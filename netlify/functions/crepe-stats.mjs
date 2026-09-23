import { getCrepeStats } from './lib/crepe-stats-service.mjs';

const headers = {
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store, max-age=0',
  'pragma':'no-cache',
  'x-content-type-options':'nosniff',
  'x-robots-tag':'noindex, nofollow, noarchive',
};

function response(body, status = 200) {
  return new Response(JSON.stringify(body),{status,headers});
}

export default async function handler(request) {
  if (request.method !== 'GET') return response({error:'METHOD_NOT_ALLOWED'},405);
  try {
    return response(await getCrepeStats());
  } catch {
    // The service already has safe fallbacks, so this is only a final containment layer.
    return response({error:'CREPE_STATS_UNAVAILABLE'},503);
  }
}
