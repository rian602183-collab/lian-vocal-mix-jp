# Current JP Price Rules — V7.2.9

Updated 2026-09-27 KST. This file describes the active calculator and PayPal server pricing.

## 1. Solo base prices

| Plan | Solo |
|---|---:|
| LIGHT | ¥4,000 |
| STANDARD | ¥5,500 |
| DELUXE | ¥6,500〜 |

## 2. Duet / Group pricing (2+ people)

For two or more participants, the Solo base price is not used. The order base is `participant count × plan-specific per-person rate`.

| Plan | 2+ people rate | Formula |
|---|---:|---|
| LIGHT | ¥4,000 / person | `count × 4000` |
| STANDARD | ¥5,000 / person | `count × 5000` |
| DELUXE | ¥6,000 / person〜 | `count × 6000` |

Examples:

| People | LIGHT | STANDARD | DELUXE |
|---:|---:|---:|---:|
| 2 | ¥8,000 | ¥10,000 | ¥12,000〜 |
| 3 | ¥12,000 | ¥15,000 | ¥18,000〜 |
| 5 | ¥20,000 | ¥25,000 | ¥30,000〜 |
| 8 | ¥32,000 | ¥40,000 | ¥48,000〜 |
| 10 | ¥40,000 | ¥50,000 | ¥60,000〜 |
| 12 | ¥48,000 | ¥60,000 | ¥72,000〜 |

All Duet / Group estimates are displayed with `〜` because actual track count, harmony structure and part complexity can change the final quote. For 10+ people the site explicitly asks the customer to confirm the final quote before payment/work starts.

## 3. Add-ons

- Additional vocal track: `+¥500 / track`
- Extra harmony / chorus beyond the basic range: `+¥1,000〜`
- Extra double / adlib organization beyond the basic range: `+¥1,000〜`
- Fully private sample / portfolio: `+¥2,000`
- Revisions: first 3 free, 4th and later `+¥500 / round` (not part of the pre-payment calculator)
- 48-hour rush: whole subtotal `+30%`
- Same-day rush: whole subtotal `+50%`

Rush uses `Math.round(subtotal * multiplier)` exactly.

## 4. Active calculation

```text
if Solo:
  base = solo plan price
else:
  base = participant count × multi-person plan rate

extras = additional tracks + checked paid options
subtotal = base + extras
total = Math.round(subtotal × rush multiplier)
```

The frontend calculator in `jp.js` and server-authoritative PayPal calculator in `netlify/functions/lib/paypal-pricing.mjs` must stay in parity. Browser-supplied `amount`, visible DOM text, hidden estimate fields or fake totals never decide the PayPal order amount.

## 5. Party validation

- Solo: exactly 1 participant
- Duet: exactly 2 participants
- Group: integer 3 or more
- Extra vocal tracks: integer 0 or more
- `consult` cannot be paid; a paid plan must be selected before checkout

`group-count` is ignored when Solo or Duet is selected.

## 6. 10+ people

The automatic estimate still calculates the base amount, but 10+ participants are treated as a pre-quote case in customer-facing copy. Track count, harmonies and part structure must be reviewed before the final price is confirmed. The existing PayPal checkout note also states that extra work may be quoted before work begins.

## 7. Examples used for V7.2.9 verification

- STANDARD 12 people = `12 × ¥5,000 = ¥60,000`
- DELUXE 12 people = `12 × ¥6,000 = ¥72,000`
- STANDARD 12 people + 2 extra tracks + harmony + private = `¥60,000 + ¥1,000 + ¥1,000 + ¥2,000 = ¥64,000`
- Previous example with 48-hour rush = `Math.round(¥64,000 × 1.30) = ¥83,200`
- DELUXE 10 people + 4 tracks + all 3 options + same-day = `Math.round((¥60,000 + ¥2,000 + ¥1,000 + ¥1,000 + ¥2,000) × 1.50) = ¥99,000`
