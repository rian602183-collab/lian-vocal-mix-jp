import { reviewHandlers } from './lib/review-runtime.mjs';
export default async function handler(request) { return reviewHandlers().submit(request); }
