# V7.3 Consultation Conversion — 검증 결과

검증일: **2026-09-28**  
기준: **V7.2.9 Multi-Person Pricing Final**

## 결과 요약

상태: **로컬 코드/정적 레이아웃/브라우저 harness 검증 PASS**  
Netlify Production 배포 및 실제 외부 서비스 송수신은 수행하지 않았습니다.

## 1. V7.2.9 가격 공식 회귀 테스트

기존 `tools/test-v729-pricing.mjs`를 V7.3 전체 폴더에서 다시 실행했습니다.

- 프런트 ↔ 서버 가격 조합: **2,880 PASS**
- 정확 금액 fixture: **11 PASS**
- 잘못된 party/input 거부: **3 PASS**
- 불일치: **0**

V7.3 상담 패치로 기존 다인원 가격 계산이 변경되지 않았습니다.

## 2. JavaScript / MJS 문법

V7.3 폴더의 `.js` / `.mjs` **35개 전체**를 `node --check`로 검사했습니다.

- 문법 오류: **0**

## 3. HTML / 정적 리소스

`index.html`을 파싱해 확인했습니다.

- 중복 ID: **0**
- `jp-v730.css` load 확인: PASS
- `jp-v730.js` load 확인: PASS
- CSS/JS/audio/image local reference 누락: **0**
- Quick form 존재: PASS
- Detailed `mix-consultation` form 존재: PASS

## 4. Quick form → 기존 Netlify Form 라우팅

Quick UI form은 별도 Netlify form으로 등록하지 않고 hidden `form-name=mix-consultation`을 전송합니다.

검증:

- quick hidden form-name: `mix-consultation` — PASS
- Quick form에서 사용하는 field name 전체가 정적 `mix-consultation` schema 안에 존재 — PASS
- 최소 입력(X/메일 회신처 + privacy) native validity — PASS

이 구조는 기존 formSubmitted/Kakao notification 흐름을 재사용하기 위한 것입니다.

## 5. Tawk 브라우저 harness

실제 V7.3 CONTACT HTML, 실제 CSS, 실제 `jp-v730.js`를 Chromium에 넣고 Tawk 공개 API shape를 mock해 검사했습니다.

### Responsive

- 360px: horizontal overflow 0
- 390px: horizontal overflow 0
- 768px: horizontal overflow 0
- 1280px: horizontal overflow 0
- 1440px: horizontal overflow 0

### Online intent

`料金・納期を確認する` 클릭:

- `consult-intent` event 기록: PASS
- `料金・納期を確認したいです。` prefill: PASS
- 기존 chat maximize 흐름: PASS

### Offline fallback

Offline 상태에서 `録音について相談する` 클릭:

- chat maximize 차단: PASS
- 30초 폼으로 이동: PASS
- 회신처 입력에 focus: PASS
- `録音相談` intent 선택: PASS
- Offline 상태 안내: PASS

### 기존 스크립트 통합

실제 `jp.js` + `jp-v72.js` + `jp-v721.js` + `jp-v728.js` + `jp-v730.js`를 같은 Chromium 문서에서 실행해 callback/capture/bubble 순서를 함께 확인했습니다.

- Online intent + 기존 maximize handler: PASS
- Offline에서 기존 bubble maximize 차단: PASS
- 기존 스크립트와 V7.3 page error: **0**

검증 화면:

- `Verification_V7_3/desktop_contact.png`
- `Verification_V7_3/mobile_quick_consult.png`

## 6. Kakao quick lead 알림

`kakao-notify.mjs`의 실제 `buildMessage()`를 quick form 샘플 데이터로 실행했습니다.

- `회신: @sample_user` 포함: PASS
- 생성 길이: **106자**
- 200자 제한 이내: PASS

실제 Kakao API 송신은 하지 않았습니다.

## 7. 기존 파일 보존

V7.2.9와 SHA-256 비교:

- 포트폴리오 오디오 **23개 전부 동일**
- `netlify/functions/lib/paypal-pricing.mjs` 동일
- `paypal-checkout.js` 동일
- PayPal create-order function 동일
- PayPal capture-order function 동일
- `portfolio-manifest.json` 동일
- `portfolio-module.js` 동일
- `crepe-stats.js` 동일

`netlify/functions/kakao-notify.mjs`는 V7.3에서 **의도적으로 변경**했습니다. 기존 카카오 전송 구조는 그대로 두고 `sns_id` 회신처를 알림 상단에 표시하도록 한 줄을 추가했습니다.

## 8. 이번 로컬 검증의 한계

아래 항목은 실제 운영환경에서만 최종 확인할 수 있습니다.

- Netlify Production 배포
- 실제 30초 상담 form POST와 Forms dashboard 생성
- 실제 이메일/Netlify notification 도착
- 실제 Kakao formSubmitted event 및 Kakao Talk 알림 도착
- 실제 Tawk Dashboard Chat Rescuer 설정
- 실제 Tawk iframe의 Online/Away/Offline 상태
- 실제 `setChatInputMessage()` 위젯 표시
- PayPal Sandbox/Live 거래
- Android Chrome / Samsung Internet / X 인앱 브라우저의 실기기 키보드·safe area

따라서 배포 후 `README_V7_3_CONVERSION.md`의 Smoke Test를 1회 수행해야 Production 검증이 완료됩니다.
