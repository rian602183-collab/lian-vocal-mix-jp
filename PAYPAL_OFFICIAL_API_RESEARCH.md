# PayPal 공식 API 조사 — V7.2.2 Sandbox

조사일: 2026-09-17. 공개 공식 문서만 읽었으며 PayPal 계정 설정, 인증정보, Sandbox/Live 결제 API에는 접근하지 않았다. 아래의 **프로젝트 권장 정책**은 문서 스키마를 바탕으로 한 구현 판단이며 PayPal 문서가 모든 항목을 자동 보장한다는 의미가 아니다.

## 1. SDK 선택: v6 + 공개 clientId + Orders v2

현재 direct merchant Standard Payments quickstart는 v6를 사용한다. 공개 clientId로 인스턴스를 만들고, 공식 `paypal-button`을 렌더링하며 서버에서 주문을 생성·캡처하는 방식이다. 따라서 이번 신규 결제 영역은 v6 한 방식으로 구현하는 것을 권장한다. `createOrder` promise는 `{ orderId }`를 반환하며, 사용자 클릭에서 해당 promise를 **먼저 await하지 않고** `session.start()`에 바로 전달해야 팝업의 사용자 활성화가 유지된다. `onApprove`는 `data.orderId`를 사용한다. [공식 direct merchant quickstart](https://developer.paypal.com/checkout/integrate/)

현재 setup 문서는 일반 one-time checkout에 clientId를 권장하고 clientToken 방식은 Fastlane 대상으로 구분한다. 이번 작업에 브라우저용 토큰 발급 함수는 필요 없다. SDK URL은 Sandbox `https://www.sandbox.paypal.com/web-sdk/v6/core`, Live `https://www.paypal.com/web-sdk/v6/core`다. SDK 인스턴스는 `createInstance({ clientId, components: ['paypal-payments'] })`로 초기화한다. API의 OAuth access token과 공개 clientId는 전혀 다르다. [SDK v6 설정](https://developer.paypal.com/sdk/js/set-up)

v6에서는 `findEligibleMethods({ currencyCode: 'JPY', amount: String(currentJPY) })`로 적합성을 확인한 다음 `isEligible('paypal')`이면 공식 버튼을 표시한다. 통화 기본값이 USD이므로 JPY 지정이 필요하다. `createPayPalOneTimePaymentSession({ onApprove, onCancel, onError })`, `session.start({ presentationMode: 'auto' }, createOrderPromise)`를 사용한다. 공식 버튼의 `type='pay'`, `class='paypal-gold'`, 문서화된 CSS 변수/외곽 폭만 조정할 수 있다. `auto`는 팝업을 우선하고 차단되면 modal로 대체한다. 승인 콜백은 캡처 promise를 반환해야 한다. 취소는 성공이 아니며, 오류 객체 전체를 사용자에게 보여주지 않는다. [v6 Reference](https://developer.paypal.com/sdk/js/reference)

프로젝트 권장 정책: SDK script 삽입 promise를 하나만 유지한다. 결제 시작 전 선택 상태와 현재 표시 금액을 동결하고, 서버 amountJPY와 불일치하면 주문 ID promise를 reject한다. UI 잠금은 자체 busy guard와 관련 컨트롤 상태로 구현한다. 기존 상담폼 자동 제출은 하지 않는다. v5 `paypal.Buttons`, `createOrder` callback 계약, `data.orderID`, `actions.restart()`를 v6에 섞지 않는다. 기존 [Studio Standard 가이드](https://developer.paypal.com/studio/checkout/standard/integrate)는 v5 Buttons 계약을 보여주므로 이번 선택에서는 복사하지 않는다.

## 2. JPY: 계산 결과 전체를 동적으로 전달

JPY는 소수 자릿수를 허용하지 않는다. 서버가 현재 가격 규칙으로 계산한 양의 정수 `amountJPY`를 `String(amountJPY)`로 직렬화한다. 예시 금액이나 허용 금액 목록은 코드에 넣지 않는다. 소수점 `.00`을 붙이지 않는다. [통화 코드](https://developer.paypal.com/api/codes/currency/)

Orders v2의 `money.value`는 문자열이며 최대 길이는 32다. 이는 모든 32자리 금액이 실제 처리된다는 뜻이 아니다. [Orders item_request 정의](https://developer.paypal.com/api/orders/v2/definitions/item_request/)

현재 Orders 오류 문서의 `MAX_VALUE_EXCEEDED` 한계는 `999999999999999.99`다. 따라서 JPY 정수에 적용되는 공통 수치 상한은 `999999999999999`로 해석할 수 있다. 이는 JPY 정수 조건과 공통 한계를 결합한 **추론**이며 계정/리스크별 더 낮은 처리 한도를 보장하지 않는다. 중간 계산과 최종 계산에 `Number.isSafeInteger`를 적용하고 이 문서상 한계를 검사한다. 임의의 100명/100트랙 제한을 새 가격 규칙처럼 추가하지 않는다. [Orders v2 오류](https://developer.paypal.com/api/orders/v2/error-messages)

## 3. 인증과 엔드포인트

서버 OAuth: `POST /v1/oauth2/token`, Basic 인증 `clientId:clientSecret`, `Content-Type: application/x-www-form-urlencoded`, 본문 `grant_type=client_credentials`. 응답의 access token은 Bearer 요청에만 사용하고 `expires_in`을 존중한다. [PayPal OAuth](https://developer.paypal.com/api/rest/authentication/)

Sandbox REST base는 `https://api-m.sandbox.paypal.com`, Live base는 `https://api-m.paypal.com`이다. 첫 번째 당사자(direct merchant)는 자기 사업체를 위해 API를 호출한다. 파트너 위임용 헤더를 임의로 추가할 이유가 없다. [API 요청](https://developer.paypal.com/api/make-api-requests)

프로젝트 권장 정책: 환경값은 정확한 `sandbox`/`live`만 허용한다. 알 수 없는 값에 Live fallback을 하지 않는다. 이번 작업은 Sandbox만 실행한다. access token은 일시적인 서버 메모리에만 두며 Blob, HTML, 응답, 로그에 저장하지 않는다. `paypal-config`는 공개 clientId/environment/JPY만 노출한다. 로그는 검증된 상태 코드/debug ID/order ID/request ID로 제한한다.

## 4. Create body의 현재 필드 위치

배송이 없는 디지털 상품에는 `payment_source.paypal.experience_context.shipping_preference = 'NO_SHIPPING'`을 사용한다. 이 위치에서 `user_action = 'PAY_NOW'`도 설정할 수 있다. [Orders Checkout 사용 사례](https://developer.paypal.com/api/rest/integration/orders-api/api-use-cases/standard/)

공식 Orders 2.32 스키마에서 `brand_name`, `locale`, `shipping_preference`, `user_action`은 `paypal_wallet_experience_context`에 존재한다. 이전 `application_context`의 대응 필드는 deprecated로 안내된다. `brand_name: 'Lian Vocal MIX'`, REST locale `ja-JP`를 같은 experience_context 안에 넣는다. `DIGITAL_GOODS`는 purchase-unit이 아닌 **item.category** 값이다. item을 넣으면 `name`, `quantity`, `unit_amount`가 필요하고 `amount.breakdown.item_total`과 합이 맞아야 한다. `Prefer: return=representation`은 전체 표현을 요청하지만 payee/merchant_id를 required로 만드는 보장은 아니다. [PayPal 공식 Orders OpenAPI](https://github.com/paypal/paypal-rest-api-specifications/blob/main/openapi/checkout_orders_v2.json)

다음은 고정 결제금액 없이 해당 필드를 조합한 프로젝트 권장 payload 구조다. `amountJPY`, 요약문, 내부 참조값은 서버에서 생성한다.

```js
const money = { currency_code: 'JPY', value: String(amountJPY) };
const body = {
  intent: 'CAPTURE',
  payment_source: {
    paypal: {
      experience_context: {
        brand_name: 'Lian Vocal MIX',
        locale: 'ja-JP',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW'
      }
    }
  },
  purchase_units: [{
    reference_id: serverReference,
    custom_id: serverReference,
    description: shortServerSummary,
    amount: { ...money, breakdown: { item_total: money } },
    items: [{
      name: 'Lian Vocal MIX',
      quantity: '1',
      category: 'DIGITAL_GOODS',
      unit_amount: money
    }]
  }]
};
```

프로젝트 권장 정책: 고객 이름/SNS/email과 사용자 임의 payee를 이 요청에 넣지 않는다. `processing_instruction: ORDER_COMPLETE_ON_PAYMENT_APPROVAL`은 이번 명시적 서버 캡처 흐름에 추가하지 않는다. 추후 redirect를 선택하면 검증된 동일 사이트 return/cancel URL 및 v6 resume 처리가 별도로 필요하다.

## 5. Create와 capture 검증 권장안

`GET /v2/checkout/orders/{id}`는 서버 Bearer 인증을 사용하며 ID 문서 패턴은 `^[A-Z0-9]+$`, 길이는 1–36이다. GET 표현에는 주문 ID/intent/status/purchase_units가 포함될 수 있다. [Show order details](https://developer.paypal.com/api/orders/v2/orders-get)

다음은 이 사이트용 **실패 시 거절 정책**이다.

1. Create에는 서버 검증 선택값만 사용한다. 금액/total/DOM 문자열은 결제 권위로 사용하지 않는다. 로컬 별도 Store에 normalized quote, fingerprint, JPY 정수, 환경, 생성 UUID를 저장한다.
2. Create 요청에 `Prefer: return=representation`을 사용한다. 생성 응답에 검증에 필요한 필드가 없으면 같은 OAuth 자격으로 GET한다. 그래도 필요한 값이 없으면 결제를 시작하지 않는다. Create 시 `PAYER_ACTION_REQUIRED`는 정상적인 승인 대기 응답일 수 있으므로 `CREATED`만 받는 구현을 피한다.
3. direct merchant로 생성된 응답의 `payee.merchant_id`를 서버 record에 보존하고, capture 직전 GET의 merchant_id와 정확히 비교한다. 브라우저가 보내는 merchant ID는 사용하지 않는다. payee가 항상 온다고 주장하지 말고 누락 시 위 2번처럼 처리한다. 이는 추가 merchant 환경변수 없이 생성 당시의 수취인을 고정하는 프로젝트 설계다.
4. Capture는 로컬 record 존재, 환경, 생성 당시 금액/정규화값, 유효 상태를 우선 확인한다. GET 결과의 ID/intent, 단일 purchase unit, reference/custom ID, JPY/금액, 수취인을 확인한다. 새 캡처는 승인된 주문에만 보낸다.
5. 캡처 성공은 HTTP 성공만으로 결정하지 않는다. order ID와 `COMPLETED`, 단일 expected purchase unit, 예상과 같은 JPY 총액, 예상 개수의 captures, capture ID, 각 capture의 `COMPLETED`와 JPY 금액 합계까지 확인한다. PayPal fee를 뺀 `net_amount`를 고객 지불액과 비교하지 않는다. 검증되지 않은 추가 unit/capture와 부분 금액은 거절한다.
6. 정상 완료를 영속 저장한 뒤 최소 응답만 반환한다. 로컬 `COMPLETED` 재요청은 이미 검증된 저장 결과를 반환하며 다시 capture하지 않는다. 저장 실패/timeout/응답 유실은 실패와 성공 사이의 미확정 상태로 보존하고 같은 주문을 조회·재조정한다.

PayPal 스키마에는 capture 상태 `PENDING`, `DECLINED`, `FAILED`, `REFUNDED` 등도 있다. 따라서 주문 완료와 실제 capture 완료를 함께 확인해야 한다. [Capture 상태 정의](https://raw.githubusercontent.com/paypal/paypal-rest-api-specifications/main/openapi/checkout_orders_v2.json)

## 6. 멱등성과 오류

PayPal은 같은 `PayPal-Request-Id`를 사용해 timeout/5xx 요청을 재시도하도록 안내한다. 병렬로 동일 ID를 보내면 첫 요청을 처리하고 두 번째를 실패시킬 수 있으므로 이 헤더 자체가 애플리케이션 잠금을 대신하지 않는다. API 종류별 독립 UUID를 사용한다. [멱등성](https://developer.paypal.com/reference/guidelines/idempotency/)

Orders Create의 보존 시간은 공식 endpoint 스키마에서 기본 **6시간**, 계정 담당자를 통한 연장 최대 72시간으로 설명한다. 일반 API 문서의 다른 API에 해당하는 45일 예시를 Orders 보장으로 적용하지 않는다. [Create order](https://developer.paypal.com/api/orders/v2/orders-create)

프로젝트 권장 정책: 논리적 create/capture 작업의 request ID는 외부 호출 전에 저장하고 재시도 시 유지한다. `onlyIfNew` 결과의 `modified:false`를 검사하고, 상태 갱신은 강한 읽기와 CAS/ETag를 사용한다. 여러 번 클릭한 같은 진행 중 작업은 기존 promise/record를 공유한다. 불확실한 capture 뒤에 새 주문으로 자동 전환하지 않는다.

| 결과 | 권장 처리 |
| --- | --- |
| 잘못된 JSON/선택값/초과 body | PayPal 호출 전 거절 |
| OAuth 401/잘못된 credentials | 설정 오류 분류, 토큰/전체 응답 비노출 |
| 네트워크/timeout/5xx | 미확정 상태 보존, 동일 request ID로 제한 재시도/GET 검증 |
| `ORDER_NOT_APPROVED` / `PAYER_ACTION_REQUIRED` | 성공으로 표시하지 않고 고객 승인 필요 안내 |
| `INSTRUMENT_DECLINED` | 결제수단 문제 안내, 명시적 재시도; v5 actions.restart 혼용 금지 |
| `ORDER_ALREADY_CAPTURED` | 성공으로 단정하지 않고 GET 후 금액·capture 검증 및 로컬 조정 |
| `PENDING` capture | pending 기록, 성공 문구 금지, 중복 새 결제 유도 금지 |
| 4xx / malformed / 금액·환경 불일치 | 안전하게 거절하고 일본어 일반 오류 표시 |

`INSTRUMENT_DECLINED`는 결제수단 거절이고 `ORDER_ALREADY_CAPTURED`는 CAPTURE intent의 단일 캡처 완료 상태에 대한 오류다. [Orders 오류 목록](https://developer.paypal.com/api/orders/v2/error-messages) 응답 누락 후 중복 캡처는 로컬 기록과 PayPal 상태를 맞추는 문제로 취급한다. [중복 캡처 문제 해결](https://developer.paypal.com/api/rest/troubleshooting/rest_unprocessable_entity/)

## 7. 검증의 경계

이 조사는 API 계약과 구현 방향을 검토한 것이다. 실제 PayPal 버튼 eligibility, 일본/한국 계정의 결제수단, Sandbox 구매자 로그인/승인/캡처, 계정별 제한을 성공했다고 주장하지 않는다. mock 테스트는 이 계약을 모사하고, 실제 Sandbox smoke test는 사용자 승인 범위 및 안전하게 제공된 Sandbox 환경에서 별도로 기록해야 한다. Production 배포와 Live 전환은 이번 작업 범위 밖이다.
