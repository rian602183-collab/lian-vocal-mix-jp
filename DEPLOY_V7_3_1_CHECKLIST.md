# V7.3.1 배포 체크리스트

## 배포 전

- [ ] DeepL API key 준비
- [ ] Netlify `DEEPL_API_KEY` 환경변수 등록
- [ ] Netlify `LIAN_TRANSLATOR_ACCESS_KEY` 환경변수 등록
- [ ] 운영자 비밀번호를 HTML/JS/메모 공개 링크에 적지 않음
- [ ] 기존 PayPal/Kakao/CREPE 환경변수는 건드리지 않음

## 배포

- [ ] `Lian_Vocal_MIX_JP_V7_3_1_Translation_Final.zip` 배포
- [ ] Production deploy 완료 확인

## 공개 사이트 회귀

- [ ] 메인 페이지 정상 로드
- [ ] 가격: Solo LIGHT ¥4,000 / STANDARD ¥5,500 / DELUXE ¥6,500〜
- [ ] 2명 이상: LIGHT ¥4,000/人 / STANDARD ¥5,000/人 / DELUXE ¥6,000/人〜
- [ ] 30秒相談 제출 테스트 1건
- [ ] Tawk 채팅 열기 / Online·Away·Offline 상태
- [ ] PayPal 직전 견적 금액 확인
- [ ] 포트폴리오 재생 2~3곡 확인

## 번역 도구

- [ ] `/operator-translate` 접속
- [ ] 틀린 비밀번호 → 잠금 유지
- [ ] 올바른 비밀번호 → DeepL 연결됨
- [ ] `明日の夜までにお願いできますか？` → 한국어 번역 확인
- [ ] 한국어 답변 → 일본어 초안 확인
- [ ] 역번역 의미/금액/날짜 확인
- [ ] 일본어 복사 → Tawk에 붙여넣기 확인
- [ ] 브라우저 새 탭/세션 종료 후 운영자 key가 영구 저장되지 않는지 확인

## 실제 사용 원칙

- [ ] 가격·납기·수정 범위는 번역문 그대로 자동 확정하지 않음
- [ ] 고객에게 보내기 전 일본어 + 역번역 모두 확인
- [ ] 비밀번호/결제정보/API key/비공개 URL token은 번역 입력에 넣지 않음
