const MAX_WORKS = 100000;
const MAX_REVIEWS = 100000;
const MAX_AVG_MINUTES = 366 * 24 * 60;
const MAX_HTML_LENGTH = 2_500_000;

const UNIT_TO_MINUTES = Object.freeze({
  minute: 1,
  hour: 60,
  day: 24 * 60,
  week: 7 * 24 * 60,
});

function decodeEscapes(value) {
  return String(value || '')
    .replace(/\\u\{([0-9a-fA-F]{1,6})\}/g, (_, hex) => {
      const cp = Number.parseInt(hex, 16);
      return Number.isInteger(cp) && cp <= 0x10ffff ? String.fromCodePoint(cp) : ' ';
    })
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/\\n|\\r|\\t/g, ' ');
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&#(\d+);/g, (_, n) => {
      const cp = Number(n);
      return Number.isInteger(cp) && cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ' ';
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => {
      const cp = Number.parseInt(n, 16);
      return Number.isInteger(cp) && cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ' ';
    })
    .replace(/&nbsp;|&ensp;|&emsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

function normalizeVisibleHtml(value) {
  return decodeEntities(decodeEscapes(value))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript\s*>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeRaw(value) {
  return decodeEntities(decodeEscapes(value))
    .replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseInteger(value) {
  const normalized = String(value ?? '').replace(/[,_\s]/g, '');
  if (!/^\d+$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function firstInteger(text, patterns) {
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (!match) continue;
    const parsed = parseInteger(match[1]);
    if (parsed !== null) return parsed;
  }
  return null;
}

function normalizeUnit(value) {
  const unit = String(value || '').trim().toLowerCase();
  if (/^(?:분|分|minute|minutes|min|mins)$/.test(unit)) return 'minute';
  if (/^(?:시간|時間|時|hour|hours|hr|hrs)$/.test(unit)) return 'hour';
  if (/^(?:일|日|day|days)$/.test(unit)) return 'day';
  if (/^(?:주|週|week|weeks)$/.test(unit)) return 'week';
  return null;
}

function firstDuration(text, patterns) {
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (!match) continue;
    const value = parseInteger(match[1]);
    const unit = normalizeUnit(match[2]);
    if (value !== null && unit) return { value, unit };
  }
  return null;
}

function firstJsonDuration(text) {
  const dayValue = firstInteger(text, [
    /["']?(?:averageDeliveryDays|avgDeliveryDays|averageWorkDays|avgWorkDays)["']?\s*[:=]\s*["']?([\d,_\s]{1,12})/i,
  ]);
  if (dayValue !== null) return { value: dayValue, unit: 'day' };

  const minuteValue = firstInteger(text, [
    /["']?(?:averageDeliveryMinutes|avgDeliveryMinutes|averageWorkMinutes|avgWorkMinutes)["']?\s*[:=]\s*["']?([\d,_\s]{1,12})/i,
  ]);
  if (minuteValue !== null) return { value: minuteValue, unit: 'minute' };

  const compound = /["']?(?:averageDeliveryTime|avgDeliveryTime|averageWorkTime|avgWorkTime)["']?\s*[:=]\s*["']?([\d,_\s]{1,12})\s*(분|시간|일|주|分|時間|日|週|minutes?|mins?|hours?|hrs?|days?|weeks?)/i.exec(text);
  if (compound) {
    const value = parseInteger(compound[1]);
    const unit = normalizeUnit(compound[2]);
    if (value !== null && unit) return { value, unit };
  }
  return null;
}

function validCount(value, max) {
  return Number.isInteger(value) && value >= 0 && value <= max;
}

function validDuration(duration) {
  if (!duration || !Number.isInteger(duration.value) || duration.value < 1) return false;
  const multiplier = UNIT_TO_MINUTES[duration.unit];
  return Number.isInteger(multiplier) && duration.value * multiplier <= MAX_AVG_MINUTES;
}

export function durationToMinutes(value, unit) {
  const normalizedUnit = normalizeUnit(unit);
  const parsedValue = parseInteger(value);
  if (parsedValue === null || !normalizedUnit) return null;
  const minutes = parsedValue * UNIT_TO_MINUTES[normalizedUnit];
  return Number.isSafeInteger(minutes) && minutes > 0 && minutes <= MAX_AVG_MINUTES ? minutes : null;
}

export function formatAverageJa(value, unit) {
  const parsed = parseInteger(value);
  const normalizedUnit = normalizeUnit(unit);
  if (parsed === null || !normalizedUnit || parsed < 1) return null;
  const suffix = { minute: '分', hour: '時間', day: '日', week: '週間' }[normalizedUnit];
  return `${parsed}${suffix}`;
}

export function parseCrepeStats(html) {
  const input = String(html || '');
  if (!input || input.length > MAX_HTML_LENGTH) {
    const error = new Error(input.length > MAX_HTML_LENGTH ? 'CREPE_HTML_TOO_LARGE' : 'CREPE_EMPTY');
    error.code = error.message;
    throw error;
  }

  const visible = normalizeVisibleHtml(input);
  const raw = normalizeRaw(input);

  // CREPE type pages expose the artist/profile total as e.g. "26건 총 작업 수".
  // Prefer that exact profile metric over the type-level "통계 > 작업 수" value.
  let works = firstInteger(visible, [
    /([\d,_\s]{1,12})\s*건\s*총\s*작업\s*수/i,
    /총\s*작업\s*수\s*[:：]?\s*([\d,_\s]{1,12})\s*건?/i,
    /([\d,_\s]{1,12})\s*(?:건|회)\s*(?:누적\s*)?(?:작업\s*(?:수|건수)|CREPE\s*실적|실적)/i,
  ]);
  if (works === null) {
    works = firstInteger(raw, [
      /["']?(?:totalWorkCount|totalWorks|workCount|worksCount|commissionCount|completedCount|completedCommissionCount)["']?\s*[:=]\s*["']?([\d,_\s]{1,12})/i,
    ]);
  }
  if (works === null) {
    // Last visible-text fallback for older CREPE markup.
    works = firstInteger(visible, [
      /(?:작업\s*(?:수|건수|횟수)|완료\s*(?:작업|건수)|커미션\s*(?:작업\s*)?(?:수|건수)|CREPE\s*실적|실적)[^0-9]{0,40}([\d,_\s]{1,12})/i,
    ]);
  }

  let reviews = firstInteger(visible, [
    /후기\s*[\(（\[]?\s*([\d,_\s]{1,12})\s*개\s*[\)）\]]?/i,
    /(?:후기|리뷰)\s*(?:수|개수|건수)?\s*[:：]?\s*([\d,_\s]{1,12})\s*(?:건|개)?/i,
    /([\d,_\s]{1,12})\s*(?:건|개)\s*(?:후기|리뷰)/i,
  ]);
  if (reviews === null) {
    reviews = firstInteger(raw, [
      /["']?(?:reviewCount|reviewsCount|totalReviews|feedbackCount)["']?\s*[:=]\s*["']?([\d,_\s]{1,12})/i,
    ]);
  }

  let average = firstDuration(visible, [
    /평균\s*작업물\s*전달\s*시간\s*[:：]?\s*([\d,_\s]{1,12})\s*(분|시간|일|주|分|時間|日|週|minutes?|mins?|hours?|hrs?|days?|weeks?)/i,
    /평균\s*(?:납품|전달|완료|작업)\s*(?:시간|기간)?\s*[:：]?\s*([\d,_\s]{1,12})\s*(분|시간|일|주|分|時間|日|週|minutes?|mins?|hours?|hrs?|days?|weeks?)/i,
    /([\d,_\s]{1,12})\s*(분|시간|일|주|分|時間|日|週|minutes?|mins?|hours?|hrs?|days?|weeks?)[^가-힣A-Za-z0-9]{0,30}평균\s*(?:작업물\s*)?(?:전달|납품|완료|작업)/i,
  ]);
  if (!average) average = firstJsonDuration(raw);

  if (!validCount(works, MAX_WORKS) || !validCount(reviews, MAX_REVIEWS) || !validDuration(average)) {
    const error = new Error('CREPE_STATS_NOT_FOUND');
    error.code = 'CREPE_STATS_NOT_FOUND';
    throw error;
  }

  // A type review count cannot sensibly exceed the artist's total completed work count.
  // Treat this as a parsing/layout mismatch rather than publishing a misleading value.
  if (reviews > works) {
    const error = new Error('CREPE_STATS_INCONSISTENT');
    error.code = 'CREPE_STATS_INCONSISTENT';
    throw error;
  }

  const avgMinutes = durationToMinutes(average.value, average.unit);
  if (avgMinutes === null) {
    const error = new Error('CREPE_AVERAGE_INVALID');
    error.code = 'CREPE_AVERAGE_INVALID';
    throw error;
  }

  return {
    works,
    reviews,
    avgValue: average.value,
    avgUnit: average.unit,
    avgMinutes,
  };
}
