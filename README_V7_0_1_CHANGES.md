# Lian Vocal MIX JP V7.0.1 — 보안 수정

V7.0 결과물을 기준으로 관리자 OAuth 두 문제와 Tawk 지연 로딩 안내만 수정했습니다. 기존 사이트 디자인·가격·콘텐츠·MP3·폼·알림 로직은 유지했습니다. GitHub push, Netlify 배포, 실제 환경변수 변경은 수행하지 않았습니다.

## 1. Netlify Blobs v10 조건부 쓰기

이전 V7.0은 onlyIfNew 충돌을 예외로만 처리했습니다. 실제 @netlify/blobs@10.0.0의 Store.setJSON은 조건 충돌 HTTP 412를 예외 대신 { modified: false }로 반환합니다.

- kakao-auth-start.mjs: oauth-state 생성 결과가 modified === true일 때만 nonce 쿠키와 Kakao 302 redirect를 발급합니다. 충돌 시 409로 종료합니다.
- kakao-oauth-callback.mjs: oauth-used nonce 선점 결과가 modified === true일 때만 state 삭제와 token 교환을 진행합니다. 충돌 시 token API 호출 전에 실패합니다.
- 실제 저장소 예외는 별도로 처리하고, 반환값이 없거나 예상과 달라도 성공으로 취급하지 않습니다.
- 기존 lian-kakao-auth, refresh_token, token-meta 저장 구조를 유지합니다.

근거: [Netlify setJSON API](https://docs.netlify.com/build/data-and-storage/netlify-blobs/#setjson), 공식 npm @netlify/blobs 10.0.0 배포본 dist/main.js. 프로젝트 의존성은 기존 ^10.0.0을 그대로 유지합니다.

## 2. 같은 브라우저의 관리자 연결

- GET /.netlify/functions/kakao-auth-start는 비어 있는 password 입력 form만 표시합니다. GET 자체는 state 생성·쿠키 발급·OAuth redirect를 하지 않습니다.
- form의 method는 POST, action은 동일 endpoint입니다. secret은 body에만 담깁니다.
- 올바른 secret으로 POST하면 Set-Cookie와 302 응답을 받고, 같은 브라우저에서 Kakao 로그인 및 callback까지 이어집니다.
- secret을 HTML에 재표시하거나 서버 로그에 출력하지 않습니다. 페이지는 Cache-Control: no-store 및 robots noindex로 응답합니다.
- Referrer-Policy는 strict-origin으로 URL 경로·query 전달을 제한하면서 정상 브라우저 POST의 Origin 검증을 유지합니다. no-referrer로 Origin이 null이 되어 정상 POST가 거부되는 경우를 실제 Chrome 테스트에서 확인하고 수정했습니다.
- 관리자 페이지 CSP는 사이트 및 kauth.kakao.com, accounts.kakao.com의 로그인 redirect를 허용합니다. 외부 script와 frame 삽입은 허용하지 않습니다.

KAKAO_SETUP.md를 브라우저 중심 절차로 다시 작성했습니다. V7.0의 PowerShell POST 후 Location 복사 절차는 사용하지 않습니다.

## 3. Tawk 늦은 로딩

jp.js에서 처음 10초까지 0.5초마다 확인하고, 실패 안내가 나온 뒤에도 2초마다 확인합니다. 늦게 준비되면 안내를 자동으로 숨기고 추가 확인을 종료합니다. 기존 Widget ID, embed script, iframe, onLoad 설정은 그대로입니다.

## 확인한 범위

| 검증 | 결과 |
| --- | --- |
| node --check: jp.js 및 Netlify 함수 4개 | 통과 |
| 공식 Blobs 10.0.0 Store.setJSON 반환 계약 | HTTP 412 → modified:false, HTTP 200 → modified:true 확인 |
| state 생성 modified:false | 302 및 쿠키 발급 없음 |
| 이미 사용된 nonce + 유효 state | token API 호출·저장 없음 |
| 두 callback이 같은 state를 먼저 읽도록 강제 | 성공 1개, 실패 1개, token 교환·저장 각 1회 |
| 정상 처리 이후 replay | 추가 token 교환·저장 없음 |
| secret/Origin/state/만료/cookie/owner/XSS | 회귀 테스트 통과 |
| 실제 Chrome form → POST → 302 → Kakao/account 경유 → callback | Secure·HttpOnly·SameSite=Lax 쿠키 자동 유지 및 성공 후 삭제 확인 |
| 다른 브라우저 세션에서 callback 복사 접속 | 쿠키 없음으로 실패, token 교환 없음 |
| Tawk 즉시/실패/지연/클릭 후 로딩 | 4개 타이머 테스트 통과 |

총 36개 테스트: 보안 30개 + 공식 Blobs 반환 계약 1개 + Tawk 4개 + 실제 Chrome 1개. 같은 보안 시험을 V7.0에 적용하면 관련 5개 항목이 실패하므로 원래 문제를 검출하는지도 확인했습니다.

Chrome은 실제 브라우저의 form 제출·302 처리·cookie jar·CSP를 사용했습니다. 최종 시험은 모든 redirect를 CDP로 가로채고 실제 네트워크를 차단한 상태에서 Kakao 응답과 저장소만 mock했습니다. 실제 계정으로 로그인하거나 운영 Netlify Blobs에 쓰거나 카카오 알림을 발송한 테스트가 아닙니다.

## 유지한 파일 및 설정

V7.0과 비교한 결과, 실행 코드 변경은 jp.js, kakao-auth-start.mjs, kakao-oauth-callback.mjs 3개입니다. index.html, jp.css, thanks.html, netlify.toml, package.json, kakao-notify.mjs, kakao-security.mjs 및 모든 assets는 바이트 단위로 동일합니다. MP3는 7개, audio 요소는 8개이며 preload="metadata"가 유지됩니다.

V7.0.1에서 추가되는 환경변수는 없습니다. V7.0의 KAKAO_ADMIN_SECRET과 KAKAO_ALLOWED_USER_ID를 설정하고 기존 KAKAO_REST_API_KEY, KAKAO_REDIRECT_URI, PUBLIC_SITE_URL을 유지하세요. KAKAO_CLIENT_SECRET은 계속 선택값입니다.

## 사용자 배포 후 확인

1. 현재 사이트 도메인과 Kakao Redirect URI가 일치하는지 확인합니다.
2. 관리자 연결 페이지에서 소유자 계정으로 연결하고 ‘나와의 채팅’ 테스트 알림을 확인합니다.
3. 기존 Netlify Forms 문의, Gmail/Naver/Kakao 알림, Tawk 채팅·모바일 앱을 실제 운영 환경에서 확인합니다.

브라우저 연결 페이지의 상세 사용법은 KAKAO_SETUP.md를 확인하세요. 기존 V7.1 정책·디자인·CSS 정리 항목은 이번 수정 범위에 포함하지 않았습니다.
