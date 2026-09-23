# V7.2.2 PayPal 검증 결과

작성: 2026-09-20T01:08:07.028Z

| 검사 | PASS | FAIL | 근거 |
|---|---:|---:|---|
| 구현 전 기존 테스트 | 538 | 0 | baseline/VERIFIED_COUNTS.json |
| 구현 후 기존 테스트 | 538 | 0 | regression-final/VERIFIED_COUNTS.json |
| 가격 parity/입력 검증 | 87 | 0 | paypal-pricing/RESULTS.txt |
| PayPal 실제 handler/API mock | 97 | 0 | paypal-api/RESULTS.json |
| 독립 보안 공격 시나리오 | 21 | 0 | paypal-security-review/RESULTS.txt |
| Chrome + 실제 frontend/server + SDK/API mock | 31 | 0 | paypal-frontend/RESULTS.json |
| 구현 후 테스트 합계 | 774 | 0 | 기준538+신규236 |

별도 문법 검사 24개, 로컬 함수 번들 12개 통과. baseline 538은 최종 합계에 중복 가산하지 않았습니다. 가격 테스트의 8,640 전분기 + 1,500 생성 조합(2,853 서로 다른 총액)은 87개 이름 있는 테스트 내부에 포함됩니다. 그룹/트랙의 급행별 최대 허용 경계 6개와 그다음 거절 경계를 확인했습니다.

## 보안 결과

| 항목 | 구현/검증 |
|---|---|
| Secret/access token | 서버 환경변수/일시 메모리만 사용. 응답·Blob·로그 금지; mock 표식으로 누출 검사 |
| client total 불신 | 선택 enum/count만 읽고 amount/total/estimate/custom price 무시 |
| 동적 금액 | 원본 가격식/Math.round를 서버에서 재현, 정수 JPY 문자열 |
| 주문 소유/금액 | 세션·환경별 로컬 record, 서버 GET의 ID/intent/reference/custom ID/payee merchant/JPY 총액 |
| 완료 판정 | 주문 및 단일 capture의 COMPLETED, gross amount/JPY 확인 후 영속 저장 |
| 경합/재실행 | onlyIfNew modified:false 확인, ETag CAS/lease fencing, 외부 호출 전 UUID 저장 |
| 통신 중단 | 같은 request ID/주문 조회로 조정; 미확정 상태에서 자동 새 결제 없음 |
| 요청 보안 | method/JSON/8KiB/정확한 origin/CSRF/HttpOnly cookie, no-store/nosniff, CORS * 없음 |
| Sandbox | 명시적 test query/localhost/신뢰된 JP preview 외에는 UI/SDK 숨김; 잘못된 환경은 실패 |

검토 중 발견한 lease 소유권 변경 경쟁, 잘못된 capture collection, ID 타입 강제 변환, 복구 중 주문 ID 교체 문제를 수정하고 공격 시나리오로 재검증했습니다. 금액/통화/merchant/환경 불일치, unknown order, pending/declined, OAuth/잘못된 credentials/4xx/5xx/timeout/malformed response, 저장 실패/완료 응답 유실, 동시 create/capture와 완료 재요청을 검사했습니다.

브라우저에서는 실제 후보 HTML/JS와 실제 서버 handler를 연결했습니다. HttpOnly cookie/CSRF를 실제 Chrome 요청으로 전달하고 SDK/API/Blobs만 mock했습니다. 여러 동적 금액의 create→approve→capture, DOM 금액 조작, 중복 클릭, 취소/오류, 새로고침 복구, 완료 후 명시적 reset, 320/360/390/700/768/1280px 레이아웃과 키보드를 확인했습니다. 사이트외 모든 요청은 interception/dead proxy로 차단했습니다.

## 기존 회귀 검사

기존 11개 suite: 보안36, 리뷰/Kakao96, Blobs wire5, 익명/회차 backend61, frontend65, refinement28, supplemental56, review browser23, mobile108, extra33, 익명/회차 browser27 = 538.

검사 파일을 별도 경로에 복사하고 candidate 경로, 허용된 index/PayPal 문서 변경, 로컬 bootstrap 허용/외부 SDK 금지 조건만 조정했습니다. 공개 기본 화면의 PayPal config는 disabled mock입니다. 처음 추가한 review-browser fixture에서 변수 이름 오류가 있었으며 fixture만 수정한 뒤 23/23 재실행했습니다. 실패한 첫 로그와 수정 이력도 보존했습니다. 사이트 오류를 숨기거나 assertion을 제거하지 않았습니다.

파일 비교는 index의 두 참조 줄을 제거하면 원본 전체가 동일함을 확인합니다. 오디오 7개와 기존 server module 12개도 SHA-256 동일합니다. 문서와 source 최종 파일별 해시는 검증 ZIP의 FILE_MANIFEST.json에 있습니다.

## 실제 환경 미검증 항목

- 실제 Sandbox 인증, 구매자 로그인/승인, PayPal 판매자 수령/계정 제한/공식 iframe 화면은 미검증입니다. 로컬 실제 credentials 미제공; Netlify Secret은 내려받지 않았습니다.
- 실제 Netlify Blobs 저장, 실제 Tawk iframe, 실제 Kakao 발송, 실제 고객 폼/리뷰를 새로 생성하지 않았습니다.
- Live 코드 경로의 선택은 mock으로만 검사하며 Live API 호출/환경변수 변경/실제 금전 거래는 없습니다.
- Production/GitHub에 반영하지 않았습니다. Sandbox 실계정 체크리스트 완료를 다음 운영 확인 단계로 남깁니다.
- 세션 cookie는 6시간입니다. 만료/삭제/다른 브라우저에서 이전 주문 자동 복구를 보장하지 않습니다. 미확정 주문은 새 결제 전에 PayPal 관리자 기록으로 확인해야 합니다.
- 동일 checkout 작업의 중복 처리는 막지만 사용자가 저장소를 지우고 별도 세션/새 작업을 만드는 모든 상황을 계정 전체에서 중복 판별하는 기능은 아닙니다.

공식 근거와 추론 구분은 PAYPAL_OFFICIAL_API_RESEARCH.md, 설정은 PAYPAL_V7_2_2_SETUP.md에 있습니다. mock 성공을 실제 운영 결제 성공으로 해석하지 마세요.
