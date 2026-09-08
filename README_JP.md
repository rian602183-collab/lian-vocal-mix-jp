# Lian Vocal MIX — Japanese Standalone Site

이 ZIP은 일본어 사이트만 따로 관리하기 위한 독립 버전입니다.

## 권장 구조
- GitHub 저장소: `lian-vocal-mix-jp`
- Netlify 프로젝트: 일본 전용 새 프로젝트
- 한국 사이트: 기존 `lian-vocal-mix.netlify.app` 그대로 유지

## 업로드
1. GitHub에서 `lian-vocal-mix-jp` 새 저장소 생성
2. 이 ZIP을 압축 해제
3. 압축 해제한 파일/폴더를 저장소 루트에 전부 업로드
4. Netlify에서 새 사이트를 GitHub 저장소와 연결
5. 배포 후 일본 전용 Netlify 주소 확인

## 일본 Netlify에서 다시 설정해야 하는 것
- Form notification: Gmail / Naver
- Environment variables:
  - `KAKAO_REST_API_KEY`
  - `KAKAO_REDIRECT_URI`
  - `PUBLIC_SITE_URL`
- `PUBLIC_SITE_URL`은 새 일본 사이트 주소
- `KAKAO_REDIRECT_URI`는:
  `https://<일본사이트주소>/.netlify/functions/kakao-oauth-callback`

## Kakao Developers
기존 `Lian Vocal MIX` 앱을 그대로 사용해도 됩니다.
새 일본 사이트의 OAuth Redirect URI만 추가하면 됩니다.

## 문의
일본 사이트 문의는 기존 `mix-consultation` Netlify Form 이름을 사용합니다.
Gmail/Naver/Kakao 관리자 알림을 같은 계정으로 받을 수 있습니다.
