# V7.2.9 Multi-Person Pricing 검증 결과

상태: 로컬 수정 및 검증 완료. Production/Netlify 배포는 수행하지 않았습니다.

## 가격 공식 검증

- Solo: LIGHT ¥4,000 / STANDARD ¥5,500 / DELUXE ¥6,500〜
- 2명 이상: LIGHT ¥4,000/인 / STANDARD ¥5,000/인 / DELUXE ¥6,000/인〜
- 12명: LIGHT ¥48,000 / STANDARD ¥60,000 / DELUXE ¥72,000
- 추가 track: +¥500 / track
- 하모리 +¥1,000 / 더블·애드리브 +¥1,000 / 비공개 +¥2,000
- 48시간 +30%, 당일 +50%, 전체 subtotal에 `Math.round` 적용

## 프런트 ↔ PayPal 서버 parity

`tools/test-v729-pricing.mjs`가 실제 `jp.js` 첫 번째 계산 listener를 최소 DOM harness에서 실행하고, 서버 `calculateQuote()`와 비교했습니다.

- 전체 조합: **2,880개 PASS**
- 정확 금액 fixture: **11개 PASS**
- 잘못된 인원/party 입력 거부: **3개 PASS**
- 불일치: **0**

확인 예시:
- STANDARD 12명 = ¥60,000
- DELUXE 12명 = ¥72,000
- STANDARD 12명 + track 2 + harmony + private + 48h = ¥83,200
- DELUXE 10명 + track 4 + harmony + adlib + private + 당일 = ¥99,000

## 코드/보존 검증

- JS/MJS **34개 `node --check` 통과**
- 기존 포트폴리오 오디오 **23개 SHA-256 동일**
- `paypal-pricing.mjs`를 제외한 Netlify Functions + PayPal checkout/CREPE/portfolio 핵심 **26개 바이트 동일**
- 기존 다인원 구식 가격문구/공식이 활성 `index.html`, `jp.js`, `paypal-pricing.mjs`에 남아 있지 않음을 확인

## 반응형 정적 레이아웃 검증

Chromium에 실제 HTML/CSS를 삽입하여 가격 섹션을 검사했습니다.

- 360px: horizontal overflow 0
- 390px: horizontal overflow 0
- 768px: horizontal overflow 0
- 1280px: horizontal overflow 0
- 1440px: horizontal overflow 0

검수 화면은 `Verification_V7_2_9/mobile_price.png`, `desktop_price.png`에 포함했습니다.

## 범위 한계

실제 PayPal Sandbox/Live 거래, Netlify Production 배포, 실제 문의 제출은 이번 로컬 가격 업데이트에서 수행하지 않았습니다. 기존 환경변수/연동 설정은 변경하지 않았습니다.
