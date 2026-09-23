import { getStore } from '@netlify/blobs';
import { createPayPalHandlers } from './paypal-server.mjs';

export function paypalHandlers() {
  return createPayPalHandlers({store:() => getStore({name:'lian-paypal-orders-v1',consistency:'strong'})});
}
