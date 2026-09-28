// Mirrors the current jp.js calculator. Solo keeps the original plan price;
// 2+ people use the plan-specific per-person group rate.
// PayPal Orders MAX_VALUE_EXCEEDED documents 999999999999999.99; JPY has no
// fractional units. This technical ceiling is not a new service price limit.
export const MAX_AMOUNT_JPY = 999_999_999_999_999;

const PLAN_PRICES = Object.freeze({ light: 4000, standard: 5500, deluxe: 6500 });
const MULTI_PERSON_RATES = Object.freeze({ light: 4000, standard: 5000, deluxe: 6000 });
const OPTION_PRICES = Object.freeze({ harmony: 1000, adlib: 1000, private: 2000 });
const RUSH_RATES = Object.freeze({ none: 0, rush48: 0.30, rush24: 0.50 });

export class PricingError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'PricingError';
    this.status = status;
    this.code = code;
  }
}

function invalid() {
  throw new PricingError(400, 'INVALID_QUOTE', 'プラン・人数・追加項目をご確認ください。');
}

function amountRange() {
  throw new PricingError(422, 'AMOUNT_OUT_OF_RANGE', '選択内容の金額を決済できません。内容をご確認ください。');
}

function enumValue(value, allowed) {
  if (typeof value !== 'string' || value.length > 16 || !allowed.includes(value)) invalid();
  return value;
}

function count(value, minimum) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum) invalid();
  return value === 0 ? 0 : value;
}

function safeMoney(value) {
  if (!Number.isSafeInteger(value) || value < 0) amountRange();
  return value;
}

export function calculateQuote(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) invalid();
  const proto = Object.getPrototypeOf(raw);
  if (proto !== Object.prototype && proto !== null) invalid();
  for (const key of ['plan', 'partyType', 'participantCount', 'extraVocalTracks', 'options', 'rush']) {
    if (!Object.hasOwn(raw, key)) invalid();
  }

  const plan = enumValue(raw.plan, ['consult', 'light', 'standard', 'deluxe']);
  if (plan === 'consult') {
    throw new PricingError(422, 'PLAN_REQUIRED', 'お支払い前にプランを選択してください。');
  }
  const partyType = enumValue(raw.partyType, ['solo', 'duet', 'group']);
  const participantCount = count(raw.participantCount, 1);
  if ((partyType === 'solo' && participantCount !== 1)
    || (partyType === 'duet' && participantCount !== 2)
    || (partyType === 'group' && participantCount < 3)) invalid();
  const extraVocalTracks = count(raw.extraVocalTracks, 0);
  const rush = enumValue(raw.rush, ['none', 'rush48', 'rush24']);

  if (!Array.isArray(raw.options) || raw.options.length > 3) invalid();
  const options = Array.from(raw.options, option => enumValue(option, ['harmony', 'adlib', 'private']));
  if (new Set(options).size !== options.length) invalid();
  options.sort();

  const planAndPeople = partyType === 'solo'
    ? PLAN_PRICES[plan]
    : safeMoney(MULTI_PERSON_RATES[plan] * participantCount);
  let extrasPrice = safeMoney(extraVocalTracks * 500);
  for (const option of options) extrasPrice = safeMoney(extrasPrice + OPTION_PRICES[option]);
  const subtotal = safeMoney(planAndPeople + extrasPrice);
  // Preserve the exact existing rounding order, including whole-subtotal rush.
  const amountJPY = safeMoney(Math.round(subtotal * (1 + RUSH_RATES[rush])));
  if (amountJPY <= 0 || amountJPY > MAX_AMOUNT_JPY) amountRange();

  return {
    normalizedQuote: { plan, partyType, participantCount, extraVocalTracks, options, rush },
    amountJPY
  };
}
