# V7.3 보존 범위

V7.2.9 기준 파일과 비교한 보존/변경 범위입니다.

## 의도적으로 변경

- `index.html` — 상담 전환 허브, quick form, context fields, V7.3 asset load
- `netlify/functions/kakao-notify.mjs` — Kakao 알림에 회신처(`sns_id`) 표시

## 신규

- `jp-v730.css`
- `jp-v730.js`
- `README_V7_3_CONVERSION.md`
- `TAWK_V7_3_CONVERSION_SETUP.md`
- `TEST_RESULTS_V7_3_CONVERSION.md`
- `SHA256_V7_3_PRESERVATION.md`
- `Verification_V7_3/desktop_contact.png`
- `Verification_V7_3/mobile_quick_consult.png`

## SHA-256 동일 확인

- 포트폴리오 오디오 23개
- `netlify/functions/lib/paypal-pricing.mjs`
- `paypal-checkout.js`
- `netlify/functions/paypal-create-order.mjs`
- `netlify/functions/paypal-capture-order.mjs`
- `portfolio-manifest.json`
- `portfolio-module.js`
- `crepe-stats.js`

기존 가격/PayPal/포트폴리오/CREPE 핵심을 V7.3 상담 패치와 분리해 회귀 위험을 줄였습니다.
