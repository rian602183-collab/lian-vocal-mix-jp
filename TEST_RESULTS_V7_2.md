# V7.2 검증 결과

검증일: 2026-09-12. 기준: V7.1 ZIP. 최종 대상: V7.2 사이트 폴더 및 동일 바이트로 만든 사이트 ZIP.

## 최종 결과

| 검사 묶음 | 통과 |
| --- | ---: |
| V7.1 프런트엔드 회귀 | 65/65 |
| V7.1 UX 회귀 | 28/28 |
| 기존 OAuth·Blobs·Tawk·같은 브라우저 OAuth 회귀 | 36/36 |
| V7.2 날짜·모바일 launcher·공개 리뷰 UX | 56/56 |
| 리뷰 서명·원자적 상태 전환·공개 제한·실패 복구 | 66/66 |
| 실제 Kakao 어댑터의 모의 HTTP 검사 | 30/30 |
| 공식 Netlify SDK 실제 Client 조건 헤더 검사 | 5/5 |
| 실제 Chrome 리뷰 form·쿠키·공개 전환 | 23/23 |
| **합계** | **309/309** |

`node --check`와 원본 파일/콘텐츠 보존 검사는 별도 통과이며 위 309개에 중복 합산하지 않았습니다. 코드 검토자가 독립 재실행한 리뷰·카카오 96개도 중복 합산하지 않았습니다.

## 환경과 검사 방법

Node.js 24.19.0, Playwright, 로컬 Google Chrome headless로 실행했습니다. 브라우저는 한국어 locale `ko-KR`, Asia/Seoul 및 reduced motion 조건을 사용한 추가 검사를 포함합니다. 360×800, 390×844, 768×1024, 1280×720, 1440×900을 확인했습니다.

사이트 파일은 실제 결과물에서 읽습니다. MP3도 실제 보존된 파일 바이트를 사용합니다. 브라우저의 모든 네트워크 요청은 가로채고 미처리 트래픽은 닫힌 proxy로 차단했습니다. 리뷰 브라우저 검사는 실제 release handler와 HTML/JS를 실행하며 Netlify Blobs는 조건부 쓰기를 구현한 메모리 저장소, 카카오는 알림 기록 함수로 대체합니다. 별도의 Kakao 어댑터 검사는 실제 어댑터를 실행하고 최종 HTTP 응답만 대체합니다.

공식 SDK 검사는 10.0.0/10.0.11/10.7.13의 Store와 Client 원본을 실행합니다. SDK 안의 HTTP 헤더 생성 코드는 대체하지 않았습니다. 최종 fetch와 환경/관측 보조만 대체했으며 테스트에 쓴 공식 패키지·라이선스·확인 가능한 metadata를 검증 ZIP에 포함했습니다. Netlify 실서버의 원자성을 부하 테스트한 것은 아닙니다.

## 반드시 확인한 동작

- GROUP 12명 STANDARD = ¥29,000, 기존 폼 이름/필드/계산, 오디오 상호 정지.
- 기존 MP3 7개, Kakao 함수 4개, 원본 CSS/JS와 OG 자산 바이트 보존. 기존 리뷰 5개·오디오 8개 metadata·가격·Hero·Guide·X·SEO 값 동일.
- 화면에 native date 및 한국어 `연도-월-일` 없음. 슬래시/ISO/숫자 8자리 입력 → 일본어 형식 표시와 ISO 제출, 윤년·불가능한 날짜·과거 날짜·빈 값 처리.
- 5개 viewport에서 가로 넘침 없음. 모바일 폼 표시 중 공식 API로 launcher 숨김, 내부 채팅 CTA에서 재열기, 최대화된 대화 유지.
- 초대당 한 번만 pending 생성. `onlyIfNew`/`onlyIfMatch`가 예외 없이 `modified:false`를 반환해도 실패로 처리.
- 중복·동시 접수, 승인과 거절 경쟁, 동일 token replay, action/ID/expires/nonce/signature 변조·만료·재발급 충돌 거부.
- GET은 상태·저장 레코드·쓰기 횟수를 변경하지 않음. 같은 브라우저 HttpOnly/Secure/Lax cookie와 명시적 POST 이후에만 변경.
- 공개 동의 없는 리뷰 승인 거부. pending/rejected/토큰/관리 필드 공개 응답 제외.
- 리뷰 HTML/XSS payload를 확인 페이지에서 escape하고 공개 카드에서 textContent로 처리.
- Kakao 기존 토큰 우선 읽기·갱신·허용 ID 확인, 한 default text template의 2개 같은 도메인 승인/거절 확인 링크, 본문 200자, 오류의 비밀값 비노출.
- 알림 실패·저장 응답 유실·재발급·늦은 알림 완료가 저장된 상태를 덮어쓰지 않는지 확인.
- PayPal template은 공개 화면에 표시되지 않음. 기존 Tawk fallback·늦은 로딩 성공 후 숨김 유지.

## 검증 중 발견하고 수정한 문제

1. **SDK 조건 전달:** 구버전 `setJSON`의 조건 헤더 누락을 실제 Client까지 검사해 발견했습니다. 10.7.13으로 고정하고 전송 헤더를 재검증했습니다. 기존 OAuth 함수는 바이트 동일합니다. [공식 수정 기록](https://github.com/netlify/primitives/blob/main/packages/blobs/CHANGELOG.md#10712-2026-08-04)
2. **재발급 nonce 충돌:** 같은 nonce를 재발급하면 이전 링크가 살아남을 수 있어 새 nonce의 형식과 이전 값과의 차이를 검사하고 충돌 시 저장하지 않습니다.
3. **브라우저 form 출처:** `no-referrer`인 네이티브 form POST가 `Origin: null`을 보내 관리자와 승인 요청이 실패했습니다. HTML 응답을 `strict-origin`으로 바꿔 Origin 검증을 유지하고 Referer에는 origin만 전달되도록 했습니다. JSON과 고객 리뷰 페이지는 no-referrer 유지. 실제 Chrome 요청에서도 query/token 없는 Referer와 올바른 Origin을 확인했습니다. [MDN Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Origin), [MDN Referrer-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy)
4. **같은 탭에서 새 초대 열기:** fragment만 바뀌는 이동이 이전 form 메모리를 재사용하지 않도록 새 fragment 이동 시 페이지를 다시 초기화합니다. 사용된 초대 거부와 다음 초대의 정상 접수를 브라우저에서 확인했습니다.
5. **모바일 날짜 키보드:** 숫자 키보드에서 `/` 입력 없이 숫자 8자리로도 정상 날짜를 입력하도록 처리했습니다.

검사 fixture의 유효 날짜가 현재 날짜보다 과거여서 발생한 오류는 미래 날짜/명시적 과거 거부 사례로 바로잡았습니다. 실행 환경의 Playwright 경로 누락도 해당 경로를 지정해 재실행했습니다. 최종 로그는 이 수정들을 반영한 통과 결과입니다.

## 확인하지 않은 운영 항목

다음은 성공했다고 주장하지 않으며, `REVIEW_SYSTEM_SETUP.md`, `TAWK_V7_2_SETUP.md`, `PAYPAL_SETUP.md`의 운영 절차로 확인해야 합니다.

- GitHub Push, Production/Preview 배포, Netlify build와 실제 의존성 설치, Functions 배포 및 실제 Blobs 권한·동시 쓰기.
- 실제 Kakao Developers 제품 링크 등록, OAuth 로그인·토큰 발급·refresh·실제 두 버튼 메시지 수신, 인앱 브라우저의 cookie 전달.
- 실제 Netlify 문의 전송 및 Gmail/Naver/Kakao 전달.
- Tawk 관리자 Pre-Chat/언어/alias/AI 설정, 실제 대화 전송·번역 품질·현재 플랜.
- 실제 Tawk cross-origin iframe 크기, 모바일 실기기의 키보드와 safe area. launcher 검사는 **60×60 iframe footprint 모형과 공식 API stub**을 사용했습니다.
- 실제 PayPal 계정·수령·결제·환불 또는 Sandbox 거래.

로컬 preview 서버 실행은 자동 승인 검토의 사용량 제한으로 거절되어 진행하지 않았습니다. 서버를 우회 실행하지 않고 파일과 handler를 연결하는 독립적인 오프라인 브라우저 검사를 수행했습니다.

## 검증 ZIP 읽는 순서

`README.md`의 재실행 안내 → `TEST_RESULTS_V7_2.md` → `SHA256_V71_V72.md` → `SCREENSHOTS.html` 순서로 보면 됩니다. 원시 결과는 `work/v72-tests`의 각 `*_RUN.txt`, `*_RESULTS.txt`, JSON에 있습니다. SDK 전송 결과는 `work/v72-research/BLOBS_WIRE_RESULTS.txt`, 문법 결과는 `SYNTAX_CHECKS.json`, 최종 파일 바이트는 `FILE_MANIFEST.json`에 있습니다.
