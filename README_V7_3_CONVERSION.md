# Lian Vocal MIX JP V7.3 — 상담 전환 개선

기준 버전: **V7.2.9 Multi-Person Pricing Final**  
작성/검증일: **2026-09-28**

## 목적

V7.2.9에서 검증된 가격·PayPal 계산은 유지하면서, 사이트에 들어온 고객이 실시간 채팅 답변을 기다리다가 이탈하는 구간을 줄이기 위한 전환 패치입니다.

특히 실제 문의에서 반복된 `料金・納期を確認したいです` 수요를 사이트 안에서 바로 해결하고, 채팅이 Away/Offline이어도 회신처를 남길 수 있게 했습니다.

## V7.3 변경 사항

### 1. 가격·납기 즉시 확인 카드

CONTACT 상단에 다음 정보를 바로 노출합니다.

- Solo: ¥4,000〜
- STANDARD: ¥5,500
- DELUXE: ¥6,500〜
- Solo 통상 납기: 1주 이내
- Duet 통상 납기: 2주 이내
- Group / Chorus: 1주〜1개월

정확 금액과 확정 납기는 기존 정책대로 음원·예약상황 확인 후 안내합니다.

### 2. 상담 의도 3개로 분리

- `料金・納期を確認する`
- `MIXについて相談する`
- `録音について相談する`

Tawk가 Online/Away이고 API가 준비된 경우, 선택한 의도에 맞는 일본어 메시지를 채팅 입력창에 미리 채우고 기존 채팅을 엽니다.

Tawk가 명시적으로 Offline인 경우에는 채팅창을 억지로 열지 않고 `30秒相談`으로 이동합니다.

### 3. 30초 상담 폼

필수 항목은 최소화했습니다.

- 상담 종류
- 회신처: X ID / X 프로필 URL / 이메일 중 하나
- 개인정보 이용 동의

곡명·인원·희망일·활동명·메시지는 선택 입력입니다.

중요: 이 폼을 Netlify의 별도 새 폼으로 등록하지 않았습니다. 화면상의 폼 이름은 `mix-quick-ui`이지만, POST 시 hidden `form-name=mix-consultation`으로 **기존 `mix-consultation` 파이프라인**에 전달됩니다. 따라서 기존 Netlify Forms 알림과 Kakao formSubmitted 흐름을 새로 설정하지 않아도 되도록 설계했습니다.

V7.3 quick form에서 쓰는 모든 field name은 정적 `mix-consultation` 폼의 schema 안에 존재하는 것을 검증했습니다.

### 4. Tawk 접속 상태 표시

사이트에서 다음 상태를 안내합니다.

- Online: 채팅 접수 중
- Away: 30초 폼 권장
- Offline: 30초 폼 즉시 사용 가능
- Loading: 30초 폼은 항상 사용 가능

`getStatus`, `onStatusChange`, `setChatInputMessage`, `addEvent` 등 공개 JavaScript API만 사용하며 Tawk iframe 내부 DOM/CSS는 조작하지 않습니다.

### 5. 유입 경로 기록

Quick / Detailed form 모두 아래 context를 hidden field에 저장합니다.

- page_url
- referrer
- utm_source
- utm_medium
- utm_campaign
- chat_status
- form_variant

향후 어느 경로에서 실제 문의가 생기는지 확인하기 위한 데이터입니다.

### 6. Kakao 알림 개선

기존 `kakao-notify.mjs`의 전송 구조·토큰 처리·200자 제한은 유지하면서, 알림 상단에 `sns_id` 회신처를 표시하도록 한 줄 추가했습니다.

Quick form은 활동명·곡명이 비어 있을 수 있으므로, 회신처를 알림에서 바로 확인할 수 있게 하기 위한 의도적 변경입니다.

## 보존한 핵심 기능

다음 파일/기능은 V7.2.9와 바이트 단위로 동일한 것을 확인했습니다.

- PayPal 가격 공식 `netlify/functions/lib/paypal-pricing.mjs`
- `paypal-checkout.js`
- PayPal create/capture functions
- `portfolio-manifest.json`
- `portfolio-module.js`
- `crepe-stats.js`
- 포트폴리오 오디오 23개

V7.3의 의도적 코드 변경은 `index.html`, 신규 `jp-v730.css`, 신규 `jp-v730.js`, `kakao-notify.mjs`입니다. 문서와 검증 캡처가 추가되었습니다.

## 배포 전 체크

1. 이 폴더/ZIP 전체를 Netlify 배포 대상으로 사용합니다.
2. 별도로 V7.2.9 파일과 섞지 않습니다.
3. 기존 Netlify 환경변수와 Tawk Property/Widget ID는 변경하지 않습니다.
4. Tawk Dashboard 자동응답 설정은 코드 배포와 별개이므로 `TAWK_V7_3_CONVERSION_SETUP.md`를 적용합니다.

## 배포 직후 실사이트 Smoke Test

아래는 로컬 검증으로 대신할 수 없는 운영 환경 테스트입니다.

1. Android/PC 시크릿 창에서 CONTACT로 이동
2. `料金・納期を確認する` 클릭
3. Tawk Online일 때 채팅이 열리고 문장이 미리 입력되는지 확인
4. Tawk Offline 상태에서 버튼 클릭 시 30초 폼으로 이동하는지 확인
5. 30초 폼에 테스트용 회신처만 입력해 실제 1건 전송
6. Netlify Forms에 `mix-consultation` 제출이 생성되는지 확인
7. 기존 이메일/알림과 Kakao 알림이 도착하는지 확인
8. Kakao 메시지에 `회신:` 값이 표시되는지 확인
9. Solo STANDARD, 2명 STANDARD, DELUXE 등 기존 견적 계산 확인
10. PayPal은 최소 Sandbox 또는 실제 결제 직전 금액까지 운영 환경에서 확인

테스트 문의는 확인 후 Netlify에서 삭제해도 됩니다.

## 롤백

문제가 있으면 직전 안정판 V7.2.9 전체를 다시 배포하면 됩니다. V7.3은 기존 가격 데이터나 포트폴리오 파일을 마이그레이션하지 않으므로 롤백을 위한 데이터 변환은 없습니다.
