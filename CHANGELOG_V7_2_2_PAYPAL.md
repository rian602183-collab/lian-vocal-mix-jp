# V7.2.2 변경 파일과 이유

기준: Lian_Vocal_MIX_JP_V7_2_1_Review_Privacy_Repeat_Client_Final (71개 파일). 기준 ZIP SHA-256: 3410b7df162e39478c37ff59b82650a9cbb6bb479a5b175f7c9c655d5a19719a.

| 파일 | 변경 이유 |
|---|---|
| index.html | 기존 내용 그대로, 새 결제 CSS/JS 링크 두 줄 추가 |
| PAYPAL_SETUP.md | 현행 V7.2.2 안내 링크와 과거 V7.2 기록임을 표시 |
| paypal-checkout.js (신규) | v6 공식 버튼/동적 표시/서버 연동/중복 방지/상태 복구 |
| paypal-checkout.css (신규) | 기존 견적에 맞춘 결제 영역만의 반응형 스타일 |
| netlify/functions/paypal-config.mjs (신규) | GET 전용 공개 설정 wrapper |
| netlify/functions/paypal-create-order.mjs (신규) | POST 전용 생성 wrapper |
| netlify/functions/paypal-capture-order.mjs (신규) | POST 전용 검증/캡처 wrapper |
| netlify/functions/lib/paypal-runtime.mjs (신규) | 별도 strong-consistency Blobs store 연결 |
| netlify/functions/lib/paypal-pricing.mjs (신규) | 원본 가격식·정규화·정수/enum 검증 |
| netlify/functions/lib/paypal-protocol.mjs (신규) | OAuth/Orders transport, JPY·주문·capture 검증, 안전한 오류 |
| netlify/functions/lib/paypal-server.mjs (신규) | origin/CSRF/session, 가격 권위, CAS 상태 저장과 복구 |
| CURRENT_PRICE_RULES.md (신규) | 실제 Production/로컬 코드에서 추적한 가격표 |
| PAYPAL_OFFICIAL_API_RESEARCH.md (신규) | 현재 공식 문서와 구현 판단/제약 |
| PAYPAL_IMPLEMENTATION_PLAN.md (신규) | baseline 이후 구현 전 설계 기록 |
| PAYPAL_V7_2_2_SETUP.md (신규) | Sandbox 실환경 체크리스트/설정/추후 Live 세 변수 |
| README_V7_2_2_PAYPAL_SANDBOX.md (신규) | 사용자가 읽을 결과 요약과 한계 |
| TEST_RESULTS_V7_2_2_PAYPAL.md (신규) | 테스트/보안/회귀 상세 결과 |
| CHANGELOG_V7_2_2_PAYPAL.md (신규) | 이 변경 목록 |

기존 69개 파일은 byte-identical, 삭제 0개입니다. 기존 가격 JS, CSS, 상담 폼, 오디오, review/Kakao 모든 함수, package.json/lock, SEO/OG/robots/404/sitemap을 수정하지 않았습니다. 새로운 실행 파일은 9개, 문서는 7개입니다. 한국 사이트는 수정·연결 변경·배포하지 않았습니다.
