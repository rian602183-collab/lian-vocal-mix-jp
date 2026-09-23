import { getStore } from '@netlify/blobs';
import { formatAverageJa, parseCrepeStats } from './crepe-stats-parser.mjs';

export const CREPE_SOURCE_URL = 'https://crepe.cm/ko/@SpjlauYz/af2p07a3';
export const CREPE_STORE_NAME = 'lian-crepe-stats-v1';
export const CREPE_STORE_KEY = 'latest';
export const CREPE_STATUS_KEY = 'refresh-status';
export const CREPE_CACHE_MS = 5 * 60 * 1000;
export const CREPE_RETRY_MS = 5 * 60 * 1000;
export const CREPE_FETCH_TIMEOUT_MS = 9000;
export const CREPE_MAX_HTML_BYTES = 2_500_000;
export const CREPE_FALLBACK = Object.freeze({
  works: 10,
  reviews: 9,
  avgValue: 5,
  avgUnit: 'day',
  avgMinutes: 5 * 24 * 60,
});

function asNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function safeAverage(value) {
  const avgValue = Number(value?.avgValue);
  const avgUnit = String(value?.avgUnit || '');
  const avgMinutes = Number(value?.avgMinutes);
  if (Number.isInteger(avgValue) && avgValue >= 1 && ['minute','hour','day','week'].includes(avgUnit) && Number.isInteger(avgMinutes) && avgMinutes >= 1) {
    return {avgValue, avgUnit, avgMinutes};
  }

  // Seamlessly migrate a V7.2.3 cache entry written with the old avgDays schema.
  const avgDays = Number(value?.avgDays);
  if (Number.isInteger(avgDays) && avgDays >= 1 && avgDays <= 366) {
    return {avgValue:avgDays, avgUnit:'day', avgMinutes:avgDays * 24 * 60};
  }
  return null;
}

export function sanitizeCachedRecord(value) {
  if (!value || typeof value !== 'object') return null;
  const works = Number(value.works);
  const reviews = Number(value.reviews);
  const fetchedAt = asNumber(value.fetchedAt);
  const checkedAt = asNumber(value.checkedAt) ?? fetchedAt;
  const average = safeAverage(value);
  if (!Number.isInteger(works) || works < 0 || works > 100000 || !Number.isInteger(reviews) || reviews < 0 || reviews > 100000 || reviews > works || !average || !fetchedAt || fetchedAt <= 0) return null;
  return {
    works,
    reviews,
    ...average,
    fetchedAt,
    checkedAt: checkedAt && checkedAt > 0 ? checkedAt : fetchedAt,
    sourceUrl: CREPE_SOURCE_URL,
    schemaVersion: 2,
  };
}

function sanitizeStatus(value) {
  if (!value || typeof value !== 'object') return null;
  const lastAttemptAt = asNumber(value.lastAttemptAt);
  const lastFailureAt = asNumber(value.lastFailureAt);
  const lastSuccessAt = asNumber(value.lastSuccessAt);
  return {
    lastAttemptAt: lastAttemptAt && lastAttemptAt > 0 ? lastAttemptAt : null,
    lastFailureAt: lastFailureAt && lastFailureAt > 0 ? lastFailureAt : null,
    lastSuccessAt: lastSuccessAt && lastSuccessAt > 0 ? lastSuccessAt : null,
  };
}

async function readJson(store, key) {
  try {
    const entry = await store.getWithMetadata(key,{type:'json',consistency:'strong'});
    return entry?.data ?? null;
  } catch {
    return null;
  }
}

export async function readCrepeCache(store) {
  return sanitizeCachedRecord(await readJson(store, CREPE_STORE_KEY));
}

async function readRefreshStatus(store) {
  return sanitizeStatus(await readJson(store, CREPE_STATUS_KEY));
}

async function writeStatus(store, patch) {
  try {
    const previous = await readRefreshStatus(store) || {};
    await store.setJSON(CREPE_STATUS_KEY,{...previous,...patch});
  } catch {
    // Status/backoff storage is best effort only.
  }
}

function validSourceResponse(res) {
  if (!res || !res.ok) return false;
  try {
    const url = new URL(res.url || CREPE_SOURCE_URL);
    if (url.protocol !== 'https:' || url.hostname !== 'crepe.cm') return false;
  } catch {
    return false;
  }
  const contentType = String(res.headers?.get?.('content-type') || '').toLowerCase();
  if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) return false;
  const lengthHeader = Number(res.headers?.get?.('content-length'));
  if (Number.isFinite(lengthHeader) && lengthHeader > CREPE_MAX_HTML_BYTES) return false;
  return true;
}

export async function fetchFreshCrepeStats(fetchImpl = fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CREPE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetchImpl(CREPE_SOURCE_URL, {
      method:'GET',
      redirect:'follow',
      signal:controller.signal,
      headers:{
        'accept':'text/html,application/xhtml+xml',
        'accept-language':'ko-KR,ko;q=0.9,en;q=0.6',
        'user-agent':'Mozilla/5.0 (compatible; LianVocalMixStats/2.0; +https://lian-vocal-mix-jp.netlify.app/)',
      },
    });
    if (!validSourceResponse(res)) throw new Error(`CREPE_SOURCE_REJECTED_${res?.status || 0}`);
    const html = await res.text();
    if (!html || html.length < 200) throw new Error('CREPE_EMPTY');
    if (html.length > CREPE_MAX_HTML_BYTES) throw new Error('CREPE_HTML_TOO_LARGE');
    return parseCrepeStats(html);
  } finally {
    clearTimeout(timer);
  }
}

function protectAgainstTransientZero(previous, next) {
  if (!previous) return true;
  if (previous.works > 0 && previous.reviews > 0 && next.works === 0 && next.reviews === 0) return false;
  return true;
}

function publicPayload(record, {stale, cached, fallback = false}) {
  return {
    works: record.works,
    reviews: record.reviews,
    avgValue: record.avgValue,
    avgUnit: record.avgUnit,
    avgText: formatAverageJa(record.avgValue, record.avgUnit),
    // Keep avgDays for old clients only when the source really reports days.
    avgDays: record.avgUnit === 'day' ? record.avgValue : null,
    fetchedAt: record.fetchedAt || null,
    sourceUrl: CREPE_SOURCE_URL,
    stale:Boolean(stale),
    cached:Boolean(cached),
    fallback:Boolean(fallback),
    schemaVersion:2,
  };
}

export async function getCrepeStats({force = false, fetchImpl = fetch, now = Date.now(), store: suppliedStore} = {}) {
  const store = suppliedStore || getStore({name:CREPE_STORE_NAME,consistency:'strong'});
  const cached = await readCrepeCache(store);
  const status = await readRefreshStatus(store);

  if (!force && cached && now - cached.fetchedAt < CREPE_CACHE_MS) {
    return publicPayload(cached,{stale:false,cached:true});
  }

  if (!force && status?.lastFailureAt && now - status.lastFailureAt < CREPE_RETRY_MS) {
    if (cached) return publicPayload(cached,{stale:true,cached:true});
    return publicPayload({...CREPE_FALLBACK,fetchedAt:null},{stale:true,cached:false,fallback:true});
  }

  await writeStatus(store,{lastAttemptAt:now});
  try {
    const next = await fetchFreshCrepeStats(fetchImpl);
    if (!protectAgainstTransientZero(cached,next)) throw new Error('CREPE_TRANSIENT_ZERO_REJECTED');
    const record = {
      ...next,
      fetchedAt:now,
      checkedAt:now,
      sourceUrl:CREPE_SOURCE_URL,
      schemaVersion:2,
    };
    try {
      await store.setJSON(CREPE_STORE_KEY,record);
      await writeStatus(store,{lastAttemptAt:now,lastSuccessAt:now,lastFailureAt:null});
    } catch {
      // A cache outage must not prevent a successful live response.
    }
    return publicPayload(record,{stale:false,cached:false});
  } catch {
    await writeStatus(store,{lastAttemptAt:now,lastFailureAt:now});
    if (cached) return publicPayload(cached,{stale:true,cached:true});
    return publicPayload({...CREPE_FALLBACK,fetchedAt:null},{stale:true,cached:false,fallback:true});
  }
}
