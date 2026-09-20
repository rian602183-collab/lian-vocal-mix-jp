# Kakao 관리자 연결 — V7.0.1

현재 일본 사이트는 https://lian-vocal-mix-jp.netlify.app/ 입니다. V7.0.1은 관리자 연결 페이지에서 입력부터 카카오 로그인, 연결 완료까지 같은 브라우저로 진행합니다.

## 환경변수 설정

기존 설정값은 유지하세요. V7.0에서 이미 아래 두 값을 추가했다면 V7.0.1용 새 환경변수는 필요 없습니다.

| 이름 | 설정 |
| --- | --- |
| KAKAO_REST_API_KEY | 기존 Kakao REST API 키 |
| KAKAO_REDIRECT_URI | https://lian-vocal-mix-jp.netlify.app/.netlify/functions/kakao-oauth-callback |
| PUBLIC_SITE_URL | https://lian-vocal-mix-jp.netlify.app/ |
| KAKAO_ADMIN_SECRET | 32자 이상인 랜덤 관리자 연결 비밀값 |
| KAKAO_ALLOWED_USER_ID | 본인 Kakao 계정의 사용자 정보 API ID |
| KAKAO_CLIENT_SECRET | Kakao 앱에서 활성화한 경우에만 사용하는 선택값 |
| KAKAO_REFRESH_TOKEN | 기존 선택값. 연결 후에는 lian-kakao-auth Blob 토큰을 우선 사용 |

KAKAO_ALLOWED_USER_ID는 이메일·전화번호·카카오톡 표시 이름이 아닙니다. 기존에 확인한 소유자 계정의 Kakao API 사용자 ID를 그대로 설정하세요. 실제 키·비밀값·토큰을 소스 파일이나 README에 적지 마세요.

## 브라우저에서 연결하기

아래 절차는 V7.0.1 배포 후 사용할 수 있습니다. 이 ZIP 제작 과정에서는 배포나 운영 환경 설정을 수행하지 않았습니다.

1. Chrome 또는 Edge에서 [카카오 관리자 연결 페이지](https://lian-vocal-mix-jp.netlify.app/.netlify/functions/kakao-auth-start)를 엽니다.
2. 비밀번호 입력칸에 Netlify에 설정한 KAKAO_ADMIN_SECRET 값을 입력합니다.
3. **카카오 연결 시작**을 누릅니다.
4. 자동으로 열린 카카오 로그인 화면에서 허용된 소유자 계정으로 로그인하고 동의합니다.
5. 같은 탭으로 돌아와 연결 완료 안내가 표시되고, 카카오톡 ‘나와의 채팅’에 테스트 알림이 오는지 확인합니다.

주소창에 비밀값을 붙이거나 중간 카카오 URL을 다른 브라우저·시크릿 창으로 복사하지 마세요. 관리자 form을 제출한 브라우저에 10분짜리 Secure·HttpOnly·SameSite=Lax nonce 쿠키가 저장되며, callback에서 이 쿠키를 검증합니다.

페이지를 여는 GET 요청은 빈 form만 표시합니다. 올바른 비밀값을 담은 POST 요청이 성공했을 때만 state를 생성하고 카카오로 이동합니다. 입력값은 URL이나 응답 화면에 재표시하지 않으며, 관리자 페이지는 no-store 및 noindex로 응답합니다. 페이지 주소 자체는 인증 수단이 아니며 관리자 비밀값이 필요합니다.

실패하면 관리자 연결 페이지를 다시 열고 새로 시작하세요. 이전 callback URL 재사용, 10분 만료, 다른 브라우저의 쿠키, 허용되지 않은 Kakao ID는 연결을 거부합니다.

## Kakao Developers 설정

- Kakao Login 활성화 및 talk_message 동의항목
- Web domain: https://lian-vocal-mix-jp.netlify.app
- Redirect URI: https://lian-vocal-mix-jp.netlify.app/.netlify/functions/kakao-oauth-callback
- KAKAO_CLIENT_SECRET은 활성화한 경우에만 사용합니다.

## 배포 후 운영 확인

- 관리자 브라우저 연결 및 테스트 알림
- mix-consultation 문의 제출과 Gmail/Naver/Kakao 알림
- 기존 Tawk 채팅·모바일 상담원 앱과 MP3 재생

KAKAO_ADMIN_SECRET을 변경했다면 진행 중인 연결은 폐기하고 관리자 페이지에서 다시 시작하세요. V7.0의 PowerShell POST 후 Location 복사 절차는 사용하지 않습니다.
