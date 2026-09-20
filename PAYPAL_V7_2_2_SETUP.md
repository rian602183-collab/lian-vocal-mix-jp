# V7.2.2 PayPal Sandbox 설정과 확인

이 ZIP은 일본 사이트 `lian-vocal-mix-jp`용입니다. Production 배포, GitHub Push, 환경변수 변경, Live API 호출은 하지 않았습니다. 한국 사이트는 수정하지 않았습니다. 아래 운영 검증은 **아직 수행하지 않은 사용자 확인 절차**입니다.

## 환경변수

| 변수 | 설정 |
|---|---|
| PAYPAL_ENV | `sandbox` 그대로 유지 |
| PAYPAL_CLIENT_ID | 같은 Sandbox 앱의 공개 Client ID |
| PAYPAL_CLIENT_SECRET | 같은 앱의 Secret, Netlify Functions 서버 범위에서만 제공 |
| PUBLIC_SITE_URL | 기존 일본 사이트 HTTPS 주소 유지 |

기존 Kakao/Review 변수는 모두 유지합니다. 새 PayPal 전용 HMAC/merchant 환경변수는 필요하지 않습니다. Secret을 HTML, 클라이언트 JS, 공개 스니펫, `.env` ZIP에 넣지 마세요. access token은 서버 함수 호출의 메모리에서만 사용합니다. 브라우저에는 공개 Client ID와 세션에 묶인 CSRF 값만 전달됩니다. CSRF 값은 PayPal access token이 아닙니다.

PAYPAL_ENV는 정확히 `sandbox` 또는 `live`만 허용합니다. 비어 있거나 알 수 없는 값이면 기능이 실패하며 Live로 전환하지 않습니다. `node_modules`는 ZIP에 포함하지 않으며 기존 package-lock의 `@netlify/blobs@10.7.13`을 그대로 사용합니다. 새 PayPal npm SDK는 없습니다.

## 테스트 화면 접근

- 일반 Production 주소에서는 Sandbox UI/외부 PayPal SDK를 표시하지 않습니다.
- 추후 명시적으로 승인하여 테스트 코드를 올린 경우 `https://lian-vocal-mix-jp.netlify.app/?paypal_test=1#contact`에서 확인합니다. **현재 배포된 사이트에 이 패치를 올렸다는 뜻이 아닙니다.**
- Sandbox의 localhost는 허용합니다. Netlify Deploy Preview는 현재 JP 사이트의 정확한 preview URL과 Netlify의 DEPLOY_PRIME_URL/DEPLOY_URL이 일치해야 합니다. 다른 사이트·한국 사이트·임의 origin은 허용하지 않습니다.
- 테스트 query는 인증 비밀이 아니며 일반 방문자에게 Sandbox UI가 섞이지 않게 하는 명시적 표시 조건입니다. 보안 검증은 별도로 서버에서 수행합니다.
- 원래 견적 카드와 모바일 mini 견적은 유지합니다. 새 결제 영역은 해당 견적 아래에만 붙습니다. Sandbox 표시가 눈에 보이며 모든 값은 JPY입니다.

로컬 실행은 기존 Netlify 개발 환경에서 이 폴더를 사용하세요. 서버 환경변수는 프로세스 또는 안전한 Netlify 개발 환경으로 공급하고 터미널에 값을 출력하지 마세요. 일반 정적 파일 서버만으로는 Functions/Blobs 결제가 실행되지 않습니다. 연결된 Netlify 사이트가 반드시 JP 프로젝트인지 확인해야 합니다. 이 작업에서 로컬에 실제 PayPal 인증정보를 내려받거나 `.env`로 저장하지 않았습니다.

## 실제 Sandbox 구매자 확인 절차 — 미실행

테스트용 판매자 앱과 별도의 Sandbox buyer를 사용합니다. 테스트마다 실제 기존 UI에서 플랜·인원·추가 트랙·옵션·급행을 선택하고 다음을 확인합니다.

1. LIGHT Solo 기본은 ¥4,000, STANDARD Solo 기본은 ¥5,500입니다. 이 둘과 다른 자유 조합을 확인합니다.
2. ¥33,000 사례는 DELUXE + Group 5명 + 트랙 4개 + 하모리/더블·애드리브/비공개 **모두** + 당일입니다. 트랙만 추가한 같은 구성은 ¥27,000입니다. ¥33,000은 고정 가격이 아닙니다.
3. PayPal 버튼 → 서버 Create → Sandbox 구매자 승인 → 서버 Capture → COMPLETED 순서로 완료해야 합니다. 판매자 Sandbox 내 거래와 화면의 JPY 총액·주문 ID를 대조합니다.
4. 취소, 결제수단 거절, 네트워크 중단, 빠른 두 번 클릭, 승인 후 새로고침, 모바일 320/375/390px를 확인합니다. 보류·미확정이면 새 주문을 만들지 말고 `支払い状況を確認`으로 같은 주문을 확인합니다.
5. 일반 Production 주소에서 테스트 query를 지우면 Sandbox UI와 외부 SDK가 사라지는지 확인합니다. 기존 상담 폼을 별도로 제출할 때 선택값이 보존되는지 확인합니다. 결제 완료만으로 상담 폼·Kakao·리뷰가 자동 전송되지는 않습니다.
6. 개발자 도구로 금액 표시/요청 amount를 바꿔도 서버 가격이 기준인지 확인합니다. 표시와 서버 금액이 다르면 승인 진행 전에 멈춰야 합니다.

특정 카드/비회원 결제의 제공 여부는 PayPal eligibility에 따릅니다. 모든 고객의 카드 결제나 계정 수령 가능성을 보장하지 않습니다. 이 작업의 브라우저 테스트는 SDK/API mock을 이용했으며, 실제 계정 로그인·구매자 승인·판매자 수령을 증명하지 않습니다.

## 실패 및 주문 확인

주문은 별도 `lian-paypal-orders-v1` Blobs store에 저장됩니다. 리뷰 store를 사용하지 않습니다. 정규화한 선택값, JPY 총액, PayPal 주문/캡처 ID, 수취 merchant ID, 작업별 request ID와 상태만 보존합니다. 카드번호·고객 연락처·전체 PayPal 응답·Secret·access token은 저장하지 않습니다.

Create/Capture는 서버가 저장한 UUID를 재사용하며 조건부 쓰기와 ETag 잠금으로 경합을 처리합니다. 잠금은 60초, PayPal request ID의 보장 범위는 6시간으로 제한하여 처리합니다. 처리 중 응답이면 잠시 후 같은 주문을 다시 확인하세요. 6시간이 지난 불확실한 결제를 새 캡처로 재시도하지 않으며 조회된 완료 결과만 조정합니다.

브라우저 세션 쿠키는 HttpOnly/SameSite=Lax이며 HTTPS에서 Secure, 유효기간은 config를 읽은 시점부터 6시간입니다. 같은 탭의 sessionStorage는 진행 중인 작업 정보를 보관하고 결제 성공의 근거로 사용하지 않습니다. 저장소를 막거나 세션 쿠키를 잃으면 새 결제를 진행하지 않습니다. **쿠키 만료·삭제, 브라우저 변경 후 이전 주문 복구는 자동 보장하지 않습니다.** 미확정 거래는 주문번호와 PayPal 판매자 기록을 확인한 뒤 관리자가 처리해야 합니다.

서버 로그는 상태/debug ID/order ID/request ID만 허용합니다. 전체 요청이나 OAuth 응답을 추가로 로깅하지 마세요. REVIEW_REQUIRED/금액 불일치/재시도 기한 경과는 고객에게 새 결제를 유도하지 말고 관리자 확인으로 처리합니다. 웹훅·환불 관리·결제 알림은 이번 패치 범위에 포함하지 않습니다.

## 추후 Live 전환 — 이번에는 실행 금지

실제 Sandbox 구매자 검증과 판매자 계정의 JPY 수령 설정을 확인하고 별도 승인을 받은 뒤 Netlify에서 바꿀 PayPal 항목은 다음 세 개입니다.

- PAYPAL_ENV: `live`
- PAYPAL_CLIENT_ID: 같은 Live 앱의 Client ID
- PAYPAL_CLIENT_SECRET: 같은 Live 앱의 Secret

PUBLIC_SITE_URL과 기존 Kakao/Review 변수는 유지합니다. Netlify 컨텍스트를 구분하여 Deploy Preview에는 Sandbox 값을 유지해야 합니다. Live로 설정하면 일반 방문자에게 결제 UI가 나타나는 구조입니다. 환경변수만 바뀌면 이미 열린 브라우저 페이지를 새로고침해야 하며, Netlify Functions에 새 값이 반영되는 배포/적용 절차는 별도 승인하에 진행합니다.

공식 근거: [v6 Direct merchant Checkout](https://developer.paypal.com/checkout/integrate/), [v6 API reference](https://developer.paypal.com/sdk/js/reference), [JPY 통화 규칙](https://developer.paypal.com/api/codes/currency/), [Orders API](https://developer.paypal.com/api/orders/v2/orders-create), [멱등 요청](https://developer.paypal.com/reference/guidelines/idempotency/). 상세 구현 판단은 PAYPAL_OFFICIAL_API_RESEARCH.md를 참고하세요.
