# V7.2.1 Review Final Patch 테스트 결과

생성: 2026-09-13T20:07:51.535Z. **538/538 통과 = 기존450 + 신규88**. 동일 검사를 여러 번 실행한 횟수는 합산하지 않습니다. 문법·번들·보존 검사는 이 수치와 별개입니다.

| 검사 | 통과 | 증거(Verification ZIP의 work/v721-review-tests) |
|---|---:|---|
| 기존 frontend | 65/65 | results/RESULTS.json |
| 기존 refinement | 28/28 | refinement/RESULTS.json |
| 기존 날짜·Tawk·공개 리뷰 | 56/56 | supplemental/RESULTS.json |
| 기존 review browser | 23/23 | review-browser/RESULTS.json |
| 기존 V7.2.1 모바일·카피·접근성 | 108/108 | mobile/RESULTS.json |
| 기존 V7.2.1 추가·폼·번역 허용 | 33/33 | extra/RESULTS.json |
| 신규 익명·회차 실제 브라우저 | 27/27 | privacy-repeat/browser/RESULTS.json |
| 기존 OAuth·conditional·cookie·fallback | 36/36 | SECURITY_RESULTS.txt |
| 기존 리뷰66 + Kakao30 | 96/96 | REVIEW_TEST_RESULTS.txt |
| 기존 실제 SDK wire | 5/5 | BLOBS_WIRE_RESULTS.txt |
| 신규 익명·회차 서버·Kakao | 61/61 | PRIVACY_REPEAT_BACKEND_RUN.txt |

## 신규88개에서 확인한 동작

- 익명false는 실제 이름, 익명true는 공개 API/DOM에서匿名. 원문 JSON의 실제 이름과 내부 token/nonce/HMAC/Blob key 누출 없음. 공개 키 allowlist는 기존 키+orderCount만 허용.
- 익명 boolean 타입 검증, missing=false, 잘못된 값 거절 후 초대 미소비. 동의false는 익명 여부와 무관하게 승인 불가·비공개.
- 관리자의 native form1~5 선택을 서버 정수로 저장. JSON은 정수만 허용. 잘못된 회차·중복 필드 거절. 고객이 조작한 회차는 저장된 관리자 지정값을 덮어쓰지 못함.
- 1회차는 배지 없음,2/3/4回目のご依頼와5回以上のご依頼 정확 표시.1실명·2실명·3익명·5익명 조합과4회차도 검사.
- 기존 invite/pending/approved의 누락 필드 false/1 fallback. 기존 동적 리뷰와 CREPE5개 유지.
- 인증된 관리자 queue와 서명 confirmation에는 실제 활동명·익명·회차·동의·평점·곡명·내용 유지. 잘못된 관리자 secret은 목록 접근 거절.
- 실제 Kakao adapter를 mock HTTP에 연결해 내부 이름·익명·회차·동의,200자 제한,기존2개 signed confirmation 버튼을 확인. 긴 내용은 기존 clip 범위이며 실제 전송 아님.
- 새 필드를 포함한 리뷰도 GET으로 쓰기 없음,explicit same-cookie POST만 승인/거절,반복/대체 액션 replay거절. HMAC의 id/action/expires/nonce/signature 변조 거절,동시 moderation은 한 번만 확정.
- 관리자 HTML escaping, 공개 textContent,악성 badge 입력 안전. 개인용 리뷰 페이지 외부 요청 없음과 URL fragment 제거 유지.
- 360/390px 고객 폼·관리자 확인·공개 카드 캡처,가로 넘침 없음. 기존 메타 스타일에서匿名·3회/5회 문구를 시각 확인.

## 기존450개에 적용한 최소 테스트 수정

원래450개 assertion은 새 후보 경로에서 다시 실행했습니다. public response의 정확한 키 목록에는 기능에 필요한 orderCount만 추가했습니다. 보존 비교는 기준 ZIP에 맞춰 허용된5개 파일만 변경 허용하고 나머지63개를 엄격하게 비교합니다.12 server module 중 변경된2 review library를 명시하고 나머지10개 보존을 요구합니다. 토큰/secret 배제·쿠키·HMAC·ETag·replay 등의 assertion은 완화하지 않았습니다. 자세한 차이는 REGRESSION_ADAPTATIONS.md입니다.

## 별도 소스·빌드 검증

- node --check: 모든 배포 JS/MJS16개 통과. Node v24.19.0.
- 공식 @netlify/zip-it-and-ship-it 15.5.1, esbuild/nodeVersion22.x, 기존 설치된 @netlify/blobs10.7.13으로 로컬 bundle9개 생성(8개 서비스 entrypoint + 기존 kakao-security helper1개). BUNDLE_RESULTS.json. 기본 sandbox의 Windows 상위 경로 EACCES는 권한을 받은 로컬 재시도로 해결했습니다. Production 빌드/배포 성공이라고 주장하지 않습니다.
- PRESERVATION_REVIEW_PATCH.json: 기존63개 파일/MP3 7개/OAuth4개 byte-identical, 변경파일5개만 허용. 변경된 서버 파일 안에서도 보안 함수·moderation·Kakao auth/template 구간의 원문 SHA-256 동일.
- index.html 자체가 동일하므로 가격·폼 names·canonical/hreflang·오디오8개 metadata·정적 CREPE5개·OG·번역 허용을 보존. 전체 파일 해시는 SHA256_V721_REVIEW_PATCH.md, 최종 복사본은 FILE_MANIFEST.json.

## 검증 범위와 한계

모든 브라우저 실행은 로컬 후보 HTML/CSS/JS, 실제 handler와 메모리 CAS 저장소를 사용하고 네트워크를 interception/dead proxy로 막았습니다. 테스트 이름·일자·리뷰·secret/token은 검사 전용 값입니다. 관리/고객/공개 브라우저를 분리해 public raw response와 DOM을 검사했습니다. 200%와 Tawk footprint/BFCache의 기존 근사·mock 범위는 원래450개 검증의 제한을 그대로 유지합니다.

이번 검사로 실제 Netlify 저장, 실제 Kakao 전송, 실제 Tawk iframe, 실제 고객 리뷰,실기기 Android/X,Production 배포를 검증했다고 주장하지 않습니다. 환경변수 추가 없음. 오디오 실서버 계측은 이번 작업에서 반복하지 않았고,이전 V7.2.1의 중복 요청/전송량 한계 보고서를 보존했습니다.

## 확인할 화면

Verification ZIP의 SCREENSHOTS_REVIEW_PATCH.html을 열면360/390px 폼·관리자·익명3회차·익명5회 이상 카드가 보입니다. 전체 공개 페이지 캡처도 privacy-repeat/browser에 있습니다. 모든 화면은 mock 리뷰이며 Verification ZIP을 Production으로 배포하지 않습니다.
