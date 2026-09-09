# 일본 사이트 전용 Kakao 설정 — FINAL

이 문서는 일본 사이트 전용입니다.
한국 사이트 Netlify 주소를 일본 프로젝트 환경변수에 넣지 마세요.

## 일본 Netlify 사이트
현재 일본 프로젝트 기준 주소:
`https://deft-gaufre-e346cc.netlify.app`

사이트 이름을 나중에 변경했다면 아래 URL도 모두 새 최종 주소로 바꾸세요.

## 필수 Netlify 환경변수
아래 3개만 기본 필수입니다.

- `KAKAO_REST_API_KEY`
- `KAKAO_REDIRECT_URI` = `https://deft-gaufre-e346cc.netlify.app/.netlify/functions/kakao-oauth-callback`
- `PUBLIC_SITE_URL` = `https://deft-gaufre-e346cc.netlify.app/`

### 기본적으로 넣지 않아도 되는 값
- `KAKAO_REFRESH_TOKEN`
  - 브라우저 OAuth 연결 완료 후 Netlify Blobs에 자동 저장됩니다.
- `KAKAO_CLIENT_SECRET`
  - Kakao Developers에서 Client Secret 기능을 별도로 활성화한 경우에만 사용합니다.
  - 현재 사용 중인 방식에서는 필수가 아닙니다.

## Kakao Developers 설정
- Kakao Login 활성화
- Redirect URI:
  `https://deft-gaufre-e346cc.netlify.app/.netlify/functions/kakao-oauth-callback`
- `talk_message` 동의항목 활성화
- Web domain:
  `https://deft-gaufre-e346cc.netlify.app`

## 배포 후 1회 연결
브라우저에서 아래 주소를 엽니다.

`https://deft-gaufre-e346cc.netlify.app/.netlify/functions/kakao-auth-start`

정상 완료되면:
1. 카카오 로그인/동의
2. Refresh Token을 Netlify Blobs에 저장
3. 본인 카카오톡 '나와의 채팅'으로 테스트 메시지 전송

## 문의 알림 동작
`mix-consultation` 폼이 Netlify에서 정상 제출되면
Netlify Function이 본인의 카카오톡 '나와의 채팅'으로 문의 알림을 보냅니다.

주의:
실제 일본 Netlify 사이트 이름을 변경했다면
`KAKAO_REDIRECT_URI`, `PUBLIC_SITE_URL`, Kakao Developers의 Redirect URI/Web domain을
모두 같은 최종 주소로 맞춰야 합니다.
