# Lian Vocal MIX JP — V6 Final Cleanup

이번 버전 수정:
1. `thanks.html`에도 tawk.to Live Chat 위젯 추가
   - 문의폼 전송 후 완료 페이지에서도 채팅 유지
2. 일본용 Kakao OAuth callback의 기본 fallback 주소를 한국 사이트에서 분리
   - 현재 일본 Netlify 후보 `deft-gaufre-e346cc.netlify.app`
   - 실제 운영에서는 `PUBLIC_SITE_URL` 환경변수가 우선
3. 후기 일본어 문장에 남아 있던 한국식 문자 제거
   - `ㅎ.ㅎ` 제거
   - `ㄱㄱ` 제거 및 자연스러운 일본어로 정리
4. `KAKAO_SETUP.md`에서 한국 사이트 URL을 제거하고 일본 사이트 placeholder로 변경

주의:
- 한국 사이트 저장소/Netlify에는 이 파일을 올리지 마세요.
- 일본 전용 GitHub `lian-vocal-mix-jp` 및 일본 전용 Netlify에서만 사용하세요.
