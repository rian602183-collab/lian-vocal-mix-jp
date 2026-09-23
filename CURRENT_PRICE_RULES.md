# V7.2.2: current JP calculator audit

Audited 2026-09-17 KST, before implementing PayPal. This is a source audit, not an invented new price table.

## Authoritative inputs

- Current local deployment source: `D:/리안 사이트/일본판/3/Lian_Vocal_MIX_JP_V7_2_1_Review_Privacy_Repeat_Client_Final`.
- Calculator: `jp.js`, first `DOMContentLoaded` listener, lines 28–197. Formula specifically at lines 174–175.
- Current controls: `index.html`, lines 452–499.
- Display override: `jp-v721.js`, lines 20–34. This changes the visible option terminology from the legacy hidden field; it does not change any price or hidden estimate value.
- Read-only Production snapshot `work/v722-research/live-jp.js` is SHA-256 identical to this source: `c88d87dcc9c26b5d83df7f643fe74847bf056a1e718a2d8046f2b97399f9de23`.
- The complete source/Production comparison is recorded in `BASELINE_SOURCE_AUDIT.json`. Public `index.html` differs from local Netlify source, while the calculator and both overrides match. Price controls were also inspected in the live HTML snapshot. No Korean website request, deployment, account change, or payment was performed for this audit.

## Existing exact prices

| Selection | Existing raw value / selector | Current arithmetic (JPY) |
|---|---|---:|
| Plan undecided | `consult` / `#plan-select` | No amount; `プランを選択してください` |
| LIGHT | `light` | 4,000 |
| STANDARD | `standard` | 5,500 |
| DELUXE | `deluxe` | 6,500 |
| Solo | `solo` / `#people-select` | +0 |
| Duet | `duet` | +3,500 |
| Group, total `n` people | `group`, `#group-count` | `3500 + (n - 2) * 2000`, `n >= 3` |
| Additional vocal tracks, `t` tracks | `#extra-track-count` | `t * 500`, `t >= 0` |
| Extra harmony/chorus | `#extra-harmony` | +1,000 when checked |
| Extra double/adlib organization | `#extra-adlib` | +1,000 when checked |
| Fully private sample/portfolio | `#extra-private` | +2,000 when checked |
| Normal delivery | `none` / `#rush-select` | multiplier `1` |
| Delivery within 48 hours | `rush48` | multiplier `1 + 0.30` |
| Same-day delivery | `rush24` | multiplier `1 + 0.50` |

Group examples: three people +5,500; four +7,500; five +9,500; six +11,500. The group fee is an addition to the selected plan, not the complete order total.

The current implementation has **one combined double/adlib checkbox**, not separate paid double and adlib options. There is no other paid checkbox in the current form. The deadline date, customer/contact text, links and message do not affect price. The rush date hint does not automatically choose or charge rush delivery.

Exact existing formula:

```js
const subtotal = plan.price + peopleExtra + extrasPrice;
const total = Math.round(subtotal * (1 + rushMultiplier));
```

Rush applies to the entire subtotal including people, additional tracks and all checked options. Preserve `Math.round`; do not replace it with floor, ceil, or a differently ordered computation.

## Existing field and display behavior

| Element | Existing form name | Type / permitted UI values |
|---|---|---|
| `#plan-select` | `plan` | select: `consult`, `light`, `standard`, `deluxe` |
| `#people-select` | `people_type` | select: `solo`, `duet`, `group` |
| `#group-count` | `group_count` | number, `min=3`, initial `3`, **no max**, implicit integer step |
| `#extra-track-count` | `extra_track_count` | number, `min=0`, initial `0`, **no max**, implicit integer step |
| `#extra-harmony` | `extra_harmony` | checkbox, submitted checked value `yes` |
| `#extra-adlib` | `extra_adlib` | checkbox, submitted checked value `yes` |
| `#extra-private` | `sample_private` | checkbox, submitted checked value `yes` |
| `#rush-select` | `rush` | select: `none`, `rush48`, `rush24` |

For display calculation, existing `countForEstimate` applies `Number(input.value)`, then accepts only `Number.isSafeInteger(value)` at least the minimum. Invalid or incomplete values calculate using the minimum. On change/blur the old code rewrites an invalid value to that minimum; while typing it leaves the text intact. Examples: empty track input calculates zero; empty group input calculates three; decimal, negative, non-finite, or unsafe values fall back to that field's minimum.

`group-count` is ignored when the party is solo or duet. A stored group value must not silently add a group fee after the user changes back to solo/duet. Extra track count applies in all three party modes. All additional options are cumulative and available for all paid plans. No quantity ceiling of 100, 999 or another business limit exists in the current UI or calculator.

The trailing `〜` is controlled by the existing `variable` flag: DELUXE, Duet, Group, harmony or double/adlib make the total variable. LIGHT/STANDARD solo with only additional tracks/private/rush retain a plain amount in the numeric display. This patch must retain the original estimate meaning and display rather than redefining it as a final agreed service quote.

The hidden `#mail-estimate-*` controls contain human-readable plan/people/extras/rush/total strings for the existing Netlify consultation flow. They are **not payment authority**. Neither these fields, the visible `#summary-total`, DOM `data-price`, nor a browser-supplied amount may decide the PayPal order amount.

The `consult` branch always returns no payable total even if people, options and rush are populated. The payment UI should ask the customer to select a paid plan and the payment create endpoint should reject `consult`; the existing consultation form must remain usable.

## The requested 33,000 example is one dynamic combination

```text
DELUXE                                    6,500
Group total 5: 3,500 + (5 - 2) * 2,000     9,500
Extra vocal tracks: 4 * 500                2,000
Harmony/chorus                              1,000
Double/adlib                                1,000
Fully private                              2,000
Subtotal                                  22,000
Same-day: Math.round(22,000 * 1.50)         33,000
```

The example's +6,000 extras are **four tracks plus all three checkboxes**. Four tracks alone would be +2,000, producing 27,000 with this plan/party/rush combination. There is no fixed `33000` checkout price and no whitelist of allowed total amounts. Every accepted selection is recalculated dynamically; fixtures such as 4,000, 5,500, 6,500, 12,000, 18,500, 22,000, 33,000 and 41,500 are examples only.

## Payment input boundary recommendation

The payment endpoint should reject malformed payment input instead of reproducing the display calculator's forgiving fallback. Validate exact plan/party/rush/option enums, primitive integer counts, non-negativity, field lengths, and finite/safe integer arithmetic. Derive the active participant count from solo/duet/group rather than trusting contradictory counts.

Preserve the current numeric UI. Do not invent a business limit such as 100 tracks. Apply technical bounds to payment calculations: `Number.isSafeInteger` to submitted counts and each additive/multiplicative price component, the subtotal, and the final rounded positive JPY total. Thus counts that make the monetary result unsafe are rejected even though the old quote UI can still display a lossy, extremely large number. Such invalid monetary values are not new allowed prices. The implementation can additionally use per-component count maxima derived from `Number.MAX_SAFE_INTEGER / unitPrice`, followed by the final subtotal/rush bounds; a count-only check is insufficient because multiple safe components can sum to an unsafe total.

Current official Orders API uses a positive amount string; the common money schema allows up to 32 characters and explicitly permits integer values for JPY. Additional official research found `MAX_VALUE_EXCEEDED` at `999999999999999.99` in the Orders error documentation. Combining that documented generic bound with integer-only JPY gives a technical ceiling of **999,999,999,999,999 JPY**. This conversion is an inference from those two documented rules, not a claimed merchant/account processing allowance. `MAX_AMOUNT_JPY` applies this bound after exact quote arithmetic. PayPal/account-specific limits may still reject a structurally valid order and should produce a safe provider error. Send the calculated JPY integer using `String(total)`, without adding `.00`.

Sources checked 2026-09-17:

- [PayPal Orders v2: Create order](https://developer.paypal.com/api/orders/v2/orders-create)
- [PayPal Orders v2 schema: item request](https://developer.paypal.com/api/orders/v2/definitions/item_request/)
- [PayPal Orders v2 errors: MAX_VALUE_EXCEEDED](https://developer.paypal.com/api/orders/v2/error-messages)
- [PayPal currency codes: integer-only JPY](https://developer.paypal.com/api/codes/currency/)

## Required parity matrix

Retain the original `jp.js` as an independent frontend oracle. Exercise its real event listeners/DOM or first listener under a faithful DOM harness rather than duplicating the same new server function as the test's expected value. Cover three paid plans, solo/duet, group 3/4/5/6 and larger counts, tracks 0/1/4/multiple, all eight checkbox combinations, and all three rush values. Check numeric total plus unchanged `〜` behavior independently. Include the exact 33,000 case and 27,000 countercase.

Also verify consult is non-payable; ignored group count does not affect solo/duet; malformed raw input rejects in payment validation; empty/intermediate quote edits keep their old quote behavior; counts beyond safe arithmetic fail; and arbitrary submitted `amount`, `total`, `estimate` or displayed-price values cannot affect the calculated charge. Exhaustive combination tests and generated counts must show dynamic amounts beyond the example list.

## Implemented pricing module and observed verification

`netlify/functions/lib/paypal-pricing.mjs` exports `calculateQuote(raw)`, `PricingError`, and `MAX_AMOUNT_JPY`. The function requires all six selection fields: `plan`, `partyType`, `participantCount`, `extraVocalTracks`, `options`, and `rush`. Solo requires participant count 1, duet 2, and group an integer at least 3. The frontend adapter must derive solo/duet participants from the selected party and ignore the inactive group input. Options accept each of `harmony`, `adlib`, and `private` at most once and return alphabetically sorted in a new array. All non-selection properties are ignored, including fake monetary inputs. The return shape is `{normalizedQuote, amountJPY}`. Errors contain safe static Japanese messages and status/code: `INVALID_QUOTE`/400, `PLAN_REQUIRED`/422, or `AMOUNT_OUT_OF_RANGE`/422.

The independent test harness executes the **actual unchanged deployed `jp.js` listener** under a minimal DOM/event implementation. It does not use another copied formula as its expected value. Observed run: **87 named tests passed, zero failed**, including 8,640 complete branch combinations and 1,500 seeded dynamic combinations, yielding 2,853 distinct amounts across the parity checks. Six quantity/rush boundaries compare the largest accepted selection with the next rejected selection. `PRICING_MATRIX.json` records quantities and totals, while `RESULTS.txt` records the runner result. These are local calculation/validation checks, not real PayPal Sandbox transactions.
