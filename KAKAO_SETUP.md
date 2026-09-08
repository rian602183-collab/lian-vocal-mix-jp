# V21 카카오톡 문의 알림 설정

## 동작
`mix-consultation` 폼이 Netlify에서 정상 제출(verified submission)되면
Netlify Function이 자동 실행되어 본인의 카카오톡 **나와의 채팅**으로 알림을 보냅니다.

카톡 예시:
- 🎧 Lian MIX 새 문의
- 활동명
- 곡 제목
- 플랜
- 인원
- 예상 최소 금액
- 희망 납기

## Netlify 환경변수
다음 값을 Netlify 환경변수에 등록해야 합니다.

- `KAKAO_REST_API_KEY`
- `KAKAO_CLIENT_SECRET`
- `KAKAO_REFRESH_TOKEN`
- `PUBLIC_SITE_URL` = `https://lian-vocal-mix.netlify.app/`

비밀키/토큰은 HTML에 넣지 않습니다.

## 카카오 앱 설정
- Kakao Login 활성화
- Redirect URI 등록
- 동의항목 `talk_message` 활성화
- 제품 링크 관리의 Web domain에 `https://lian-vocal-mix.netlify.app` 등록
- 본인 카카오 계정으로 동의 후 refresh token 발급

## 중요한 배포 방식
V21부터 Netlify Function을 사용합니다.
단순 Drag & Drop 정적 배포가 아니라 **Git 연동 배포 또는 Netlify CLI 배포**가 필요합니다.
향후에도 Function을 유지하려면 같은 방식으로 배포하세요.

## Refresh Token 자동 갱신
Kakao refresh token이 만료 가까이에서 새 토큰으로 교체되면
Netlify Blobs에 새 refresh token을 저장하도록 구현되어 있습니다.


## V22: 브라우저에서 한 번만 연결
Function 배포 후 아래 주소를 브라우저에서 엽니다.

`https://lian-vocal-mix.netlify.app/.netlify/functions/kakao-auth-start`

카카오 로그인/동의가 끝나면 callback Function이:
1. Authorization Code를 Access/Refresh Token으로 교환
2. Refresh Token을 Netlify Blobs에 저장
3. 본인의 카카오톡 `나와의 채팅`으로 연동 완료 테스트 메시지 전송

### Netlify 환경변수
- `KAKAO_REST_API_KEY` = Kakao Developers에서 생성한 REST API 키
- `KAKAO_CLIENT_SECRET` = 해당 REST API 키의 Client Secret
- `KAKAO_REDIRECT_URI` = `https://lian-vocal-mix.netlify.app/.netlify/functions/kakao-oauth-callback`
- `PUBLIC_SITE_URL` = `https://lian-vocal-mix.netlify.app/`

`KAKAO_REFRESH_TOKEN`은 V22에서는 선택사항입니다.
브라우저 OAuth 연결을 완료하면 Refresh Token이 Netlify Blobs에 자동 저장됩니다.
