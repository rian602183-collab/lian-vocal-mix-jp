import { paypalHandlers } from './lib/paypal-runtime.mjs';
export default async function handler(request) { return paypalHandlers().captureOrder(request); }
