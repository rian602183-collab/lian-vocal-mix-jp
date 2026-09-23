import { getCrepeStats } from './lib/crepe-stats-service.mjs';

export default async function handler() {
  // Scheduled refresh keeps the cache current even when nobody has the site open.
  // Failures are contained by the same last-known-good/fallback logic used by the public endpoint.
  await getCrepeStats({force:true});
  return new Response(null,{status:204});
}

export const config = {
  schedule:'*/10 * * * *',
};
