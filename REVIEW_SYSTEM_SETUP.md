# Lian Vocal MIX JP V7.2 — 리뷰 운영 안내

V7.2는 납품을 완료한 고객에게만 일회용 리뷰 링크를 발급하고, 관리자가 내용을 확인해 승인한 리뷰만 사이트에 추가하는 방식입니다. 기존 리뷰 5개는 유지됩니다. 일반 방문자용 ‘리뷰 작성’ 버튼은 추가하지 않았습니다.

아래 운영 절차는 **V7.2 최초 배포와 환경 설정을 완료한 이후**에 사용하는 안내입니다. 이번 결과물 제작에서는 Kakao Developers 설정 변경, Netlify Production 배포, 실제 Kakao 메시지 전송을 수행하지 않았습니다. 로컬 검증 범위와 운영 환경에서 확인할 항목은 이 문서 마지막에 구분했습니다. 문서 확인일: 2026-09-12.

## 1. 처음 한 번 준비할 설정

### Netlify 환경변수

기존 Kakao 앱과 관리자 계정을 그대로 사용합니다. 새로 필요한 환경변수는 `REVIEW_HMAC_SECRET` 하나입니다.

| 이름 | 설정할 값과 용도 |
| --- | --- |
| `REVIEW_HMAC_SECRET` | 새로 생성한 32자 이상의 충분히 무작위인 비밀값. 리뷰 초대·승인·거절 서명을 만드는 서버 전용 키입니다. `KAKAO_ADMIN_SECRET`과 다른 값을 사용합니다. |
| `KAKAO_ADMIN_SECRET` | 기존 32자 이상 관리자 비밀값. 리뷰 초대 발급·대기 목록 확인·승인 링크 재발급에도 사용합니다. |
| `KAKAO_ALLOWED_USER_ID` | 기존에 확인한 관리자 본인의 Kakao API 사용자 ID. 숫자 ID이며 이메일·전화번호·표시 이름이 아닙니다. |
| `PUBLIC_SITE_URL` | `https://lian-vocal-mix-jp.netlify.app/` — 실제 운영 주소와 일치시킵니다. 서버가 링크를 생성하고 POST 요청의 출처를 확인할 때 사용합니다. |
| `KAKAO_REST_API_KEY` | 기존 Kakao 앱의 REST API 키. |
| `KAKAO_REDIRECT_URI` | 기존 `https://lian-vocal-mix-jp.netlify.app/.netlify/functions/kakao-oauth-callback` 유지. |
| `KAKAO_CLIENT_SECRET` | 기존 Kakao 앱에서 활성화한 경우만 설정하는 선택값. |
| `KAKAO_REFRESH_TOKEN` | 기존 선택값. 연결 이후에는 `lian-kakao-auth` 저장소의 `refresh_token`이 우선됩니다. |

비밀값은 Netlify 환경변수 화면에서 설정합니다. Functions 범위를 선택할 수 있는 요금제라면 해당 범위를 포함하고, Production 배포에 적용되는 값인지 확인합니다. 비밀값을 HTML, JavaScript, ZIP, README, URL, 쿼리 문자열 또는 로그에 넣지 마세요. 애플리케이션은 HMAC 키를 `process.env.REVIEW_HMAC_SECRET`에서만 읽습니다. 관리자 비밀값은 비밀번호 입력칸에서 POST 본문으로만 제출되며 응답 화면에 다시 표시되지 않습니다.

`netlify.toml`에 적는 환경변수는 Functions 런타임용 설정을 대신하지 않습니다. 환경변수 변경은 새 배포에 반영되므로, 위 값은 최초 배포 전에 준비하세요. 일상적인 개별 리뷰 승인·거절에는 환경변수 변경이나 재배포가 필요 없습니다. [Netlify Functions 환경변수 공식 문서](https://docs.netlify.com/build/functions/environment-variables/)

### Kakao Developers 제품 링크

기존 앱의 한국어 콘솔에서 **[앱] → [제품 링크 관리] → [웹 도메인]**을 열어 `https://lian-vocal-mix-jp.netlify.app`을 등록하고 기본 웹 도메인을 확인합니다. 영어 콘솔의 같은 경로는 **[App] → [Product Link] → [Web domain]**입니다. 이 설정은 JavaScript 키의 ‘JavaScript SDK 도메인’과 별개입니다. [Kakao 앱 설정 공식 문서](https://developers.kakao.com/docs/ko/app-setting/app)

등록 대상은 위 도메인입니다. 개별 리뷰 ID, 서명, 쿼리 전체를 콘솔에 등록하는 방식이 아닙니다. 코드가 버튼에 넣는 웹 링크의 형태는 다음과 같습니다. 아래 꺾쇠 표시는 설명용이며 실제로 복사해서 사용할 링크가 아닙니다.

```text
https://lian-vocal-mix-jp.netlify.app/.netlify/functions/reviews-moderate?id=<review-ID>&action=approve&expires=<expiry>&nonce=<nonce>&signature=<signature>
https://lian-vocal-mix-jp.netlify.app/.netlify/functions/reviews-moderate?id=<review-ID>&action=reject&expires=<expiry>&nonce=<nonce>&signature=<signature>
```

`web_url`과 `mobile_web_url` 모두 같은 HTTPS 확인 URL을 지정합니다. 각 URL의 도메인은 제품 링크에 등록된 도메인과 일치해야 합니다. 기본 text template은 최대 200자 본문과 최대 2개 버튼을 지원하므로, V7.2는 한 알림에 `[승인]` / `[거절]`을 함께 구성합니다. 별도의 사용자 정의 메시지 템플릿 ID는 사용하지 않습니다. [Kakao 기본 템플릿 공식 문서](https://developers.kakao.com/docs/ko/message-template/default)

기존 Kakao Login 활성화, `talk_message` 동의, callback Redirect URI를 유지합니다. ‘나에게 보내기’는 로그인한 본인의 ‘나와의 채팅’으로 보내는 API입니다. V7.2도 이 API를 사용하며, 전송 전에 사용자 정보 API의 ID가 `KAKAO_ALLOWED_USER_ID`와 일치하는지 다시 검사합니다. [Kakao 메시지 REST API 공식 문서](https://developers.kakao.com/docs/ko/kakaotalk-message/rest-api)

카카오 연결이 아직 완료되지 않았다면 기존 [KAKAO_SETUP.md](KAKAO_SETUP.md)의 브라우저 절차를 따릅니다. `/.netlify/functions/kakao-auth-start`를 열어 비밀번호 form 제출 → Kakao 로그인 → callback까지 같은 브라우저에서 완료합니다. 리뷰 때문에 새로운 앱이나 별도 OAuth 흐름을 만들 필요는 없습니다.

### 최초 배포 시 확인할 서버 구성

배포 과정에서 `package.json`의 의존성을 설치하고 `netlify/functions`의 Functions와 공통 모듈을 번들로 포함해야 합니다. `index.html`이 보이는 것만으로 서버 기능 배포가 완료된 것은 아닙니다. 기존 배포 방식이 Functions를 처리하는지 배포 로그와 아래 endpoint로 확인하세요. [Netlify 빌드 구성 공식 문서](https://docs.netlify.com/build/configure-builds/overview/)

추가된 Functions는 `reviews-admin`, `reviews-invite-check`, `reviews-submit`, `reviews-moderate`, `reviews-public`입니다. `netlify.toml`은 `/review`를 `/review/index.html`로 연결하고 고객 리뷰 페이지에 `no-store`, `noindex`, `no-referrer`를 적용합니다. Functions는 응답 헤더를 직접 설정합니다. 관리자·확인 HTML은 일반 form POST의 Origin 검증을 위해 `strict-origin`을 사용하며 Referer에는 도메인만 전달하고 경로·query·서명은 전달하지 않습니다. JSON 응답과 고객 페이지는 `no-referrer`입니다. `no-store`와 `noindex`는 모두 유지합니다.

리뷰는 site-wide Netlify Blobs 저장소 `lian-reviews-v72`에 저장됩니다. 저장 키는 `review-<UUID>`이고, 기존 Kakao 토큰 저장소 `lian-kakao-auth`와 분리됩니다. 재배포해도 리뷰 데이터를 이어서 읽습니다. 같은 Netlify 프로젝트의 Deploy Preview와 Production은 site-wide 저장소를 공유하므로 실제 운영 데이터를 건드리지 않는 검증은 **별도 테스트 프로젝트와 테스트 계정·키**로 준비하세요. [Netlify Blobs 공식 문서](https://docs.netlify.com/build/data-and-storage/netlify-blobs/)

## 2. 납품 완료 고객에게 리뷰 링크 보내기

1. 브라우저에서 [리뷰 관리자 페이지](https://lian-vocal-mix-jp.netlify.app/.netlify/functions/reviews-admin)를 엽니다.
2. 비밀번호 입력칸에 기존 `KAKAO_ADMIN_SECRET` 값을 입력합니다.
3. **고객용 리뷰 초대 링크 만들기**를 누릅니다.
4. 결과 화면의 링크 전체를 복사해 해당 고객에게 개별 전달합니다. 링크의 `#` 뒤 부분도 필요합니다.
5. 고객은 링크를 열어 일본어 form에서 표시명, 곡명(선택), 평점, 리뷰 본문, 공개 동의를 작성합니다.

초대는 발급 시점부터 **14일 동안 유효**하고 한 번만 제출할 수 있습니다. 링크를 열거나 유효성을 확인하는 것으로 소모되지 않습니다. 실제 제출이 저장될 때 초대가 소모되고 상태가 `pending`으로 바뀝니다. 만료된 초대는 관리자 처음 화면에서 새로 발급합니다. V7.2의 ‘승인 링크 재발급’은 이미 제출된 대기 리뷰용이며 고객 초대의 기한 연장 기능은 아닙니다.

고객 링크의 서명 정보는 URL fragment인 `#` 뒤에 들어갑니다. 첫 페이지 요청에는 포함되지 않으며, 리뷰 페이지가 읽은 뒤 주소창에서 제거하고 현재 페이지 메모리에만 보관합니다. 새로고침하거나 탭을 닫았다면 전달받은 원래 링크로 다시 들어가야 합니다. 회원가입, 고객 로그인, 이메일 수집은 추가하지 않았습니다.

초대 링크 자체가 제출 권한입니다. 링크를 가진 사람을 실제 납품 고객이라고 별도로 인증하지는 않으므로 공개 게시하거나 여러 사람에게 공유하지 않습니다. 이 구조가 보장하는 것은 유효한 초대당 한 번의 제출이며 고객 실명이나 구매 이력의 자동 검증은 아닙니다.

## 3. Kakao 알림에서 승인 또는 거절하기

1. 새 리뷰가 접수되면 서버가 먼저 `pending` 상태로 저장하고, 기존 관리자 ‘나와의 채팅’에 알림을 요청합니다.
2. 알림의 **승인** 또는 **거절**을 누릅니다. 리뷰 내용과 공개 동의 여부를 보여주는 웹 확인 페이지가 열립니다.
3. 내용을 확인한 뒤 페이지의 **리뷰 승인 · 사이트에 공개** 또는 **리뷰 거절 · 공개하지 않음** 버튼을 직접 누릅니다.
4. 서버 처리 완료 안내를 확인합니다.

알림 본문은 요약이므로 전체 리뷰는 확인 페이지에서 읽습니다. Kakao 메시지 본문을 누르면 승인 확인 페이지로 이동하지만, 이 경우도 페이지를 열기만 해서는 승인되지 않습니다. 승인·거절 링크는 생성 후 **1시간** 동안 유효합니다.

확인 페이지를 여는 GET은 리뷰 저장·수정·승인·거절·토큰 소모를 하지 않습니다. 서버는 같은 브라우저에서 확인했다는 사실을 검증하기 위해 **10분짜리 `Secure; HttpOnly; SameSite=Lax` 쿠키**를 설정합니다. 그 페이지의 form을 POST로 제출했을 때만 서명·기한·nonce·현재 상태·브라우저 쿠키·출처를 검증하고 상태를 바꿉니다.

확인 페이지에서 POST까지 같은 브라우저를 사용합니다. Kakao 내부 브라우저로 열었다면 그 화면에서 제출하거나, 원래 서명 링크를 외부 브라우저에서 처음부터 다시 여세요. form HTML이나 POST 주소만 다른 브라우저로 옮기면 쿠키 검증을 통과할 수 없습니다. 10분이 지났으면 아직 유효한 원래 링크로 확인 페이지를 다시 엽니다. 여러 확인 페이지를 동시에 열어 쿠키가 바뀌었다면 처리하려는 링크를 다시 열어 제출하면 됩니다.

공개에 동의하지 않은 리뷰는 비공개 의견으로 접수합니다. 해당 리뷰의 승인 버튼은 비활성화되며 직접 POST를 보내도 서버가 승인을 거부합니다. 관리자는 내용을 읽거나 거절할 수 있습니다. 동의하지 않은 내용을 이 시스템에서 임의로 공개 상태로 바꾸는 기능은 없습니다.

## 4. 알림이 안 오거나 링크가 만료되었을 때

카카오 전송에 실패해도 이미 저장한 리뷰를 삭제하거나 고객에게 중복 제출을 요구하지 않습니다. 자동 재전송 작업은 포함되어 있지 않습니다. 다음 순서로 처리합니다.

1. [리뷰 관리자 페이지](https://lian-vocal-mix-jp.netlify.app/.netlify/functions/reviews-admin)를 엽니다.
2. 관리자 비밀값을 입력하고 **대기 리뷰 확인**을 누릅니다.
3. 대기 목록에서 리뷰 내용과 ID를 확인합니다. 아직 유효한 **승인 확인 / 거절 확인** 링크가 있으면 바로 사용할 수 있습니다.
4. 링크가 만료되었거나 다시 알림이 필요하면 해당 리뷰의 비밀번호 입력칸에 관리자 비밀값을 입력하고 **승인 링크 재발급 · 카카오 재알림**을 누릅니다.
5. 결과 화면의 새 확인 링크로 처리합니다. 카카오 재알림이 실패해도 결과 화면의 새 링크를 사용할 수 있습니다.

재발급 시 새로운 nonce와 1시간 기한을 저장하므로 **이전 승인·거절 링크 둘 다 무효**가 됩니다. 카카오 요청 성공 응답이 실제 휴대폰에서 메시지를 읽었다는 뜻은 아닙니다. 이미 처리한 리뷰는 대기 목록에서 빠지며, 승인·거절의 되돌리기나 편집 기능은 이번 범위에 포함되어 있지 않습니다.

고객이 ‘전송 결과를 확인할 수 없다’는 안내를 보았다면 먼저 대기 목록을 확인합니다. 네트워크가 끊긴 시점에 따라 저장은 완료되었을 수 있습니다. 이미 접수된 리뷰라면 같은 초대로 다시 제출해도 두 번째 리뷰가 만들어지지 않습니다.

## 5. 승인 후 사이트에 표시되는 방식

승인된 리뷰는 `GET /.netlify/functions/reviews-public`의 응답에 자동 포함됩니다. 공개 동의가 있고 `approved`인 자료만 표시명·곡명·평점·본문·공개일·리뷰 ID의 제한된 공개 필드로 반환합니다. 초대·관리 서명, nonce, 관리자 비밀값, `pending`/`rejected` 자료는 공개 응답에 포함되지 않습니다.

사이트는 리뷰 탭을 열 때, 보이는 브라우저 탭으로 돌아올 때, 리뷰 탭을 보고 있는 동안 60초 간격으로 다시 읽습니다. 승인 직후 확인하려면 리뷰 탭을 다시 열거나 페이지를 새로고침합니다. 이는 WebSocket 실시간 전송이 아닌 주기적 조회입니다. 공개 API 장애가 발생해도 기존 리뷰 5개는 유지됩니다. 새 리뷰 본문은 `textContent`로 출력되어 작성한 HTML을 실행하지 않습니다.

V7.2 최초 배포 이후 일상적인 **초대 발급 → 접수 → 승인/거절 → 공개 반영**은 브라우저와 Kakao 확인 페이지로 처리합니다. 개별 리뷰를 위해 GitHub 수정, Netlify 재배포, HTML 수동 추가를 하지 않습니다.

## 6. 구현된 보호 장치와 저장 방식

각 초대·관리 토큰의 HMAC-SHA256 서명에는 용도, 리뷰 ID, action(관리 토큰의 `approve`/`reject`), expires, nonce가 결합됩니다. 한 값이라도 변경하면 검증에 실패합니다. HMAC 키 자체는 URL에 포함되지 않습니다. 서명은 URL에 존재하는 제한된 권한의 토큰이며, 비밀 키와 다릅니다. 관리 링크 역시 권한을 가진 bearer 링크이므로 고객에게 전달하지 않습니다. 애플리케이션은 토큰이나 관리자 비밀값을 로그로 출력하지 않습니다. 관리 링크는 요청 URL이므로 브라우저 기록·플랫폼 접근 기록 취급에도 주의합니다.

초대 생성은 `onlyIfNew`, 제출·재발급·승인·거절은 현재 Blob의 ETag를 조건으로 하는 `onlyIfMatch`를 사용합니다. 제출 시 초대 소모와 내용 저장을 **하나의 리뷰 레코드 변경**으로 처리합니다. 승인·거절도 그 레코드 한 번의 조건부 변경으로 처리하므로 동시에 들어온 요청 중 먼저 성공한 것만 반영되며 나머지는 거부됩니다. 승인 후 반대쪽 거절 버튼을 사용하거나 같은 POST를 재전송해도 다시 처리되지 않습니다. ‘사용됨’ 표시를 별도 레코드에 저장한 다음 본문을 저장하는 두 단계 구조는 사용하지 않습니다.

새 리뷰 저장 코드는 `store.set(key, JSON.stringify(record), 조건)`의 결과를 확인하고 `modified === true`와 유효한 ETag가 있어야 성공으로 인정합니다. 충돌의 `modified: false`를 예외 없이 반환하는 실제 SDK 동작을 처리합니다. 응답이 불명확하면 성공으로 보고하지 않습니다.

`@netlify/blobs`는 **10.7.13으로 고정**했습니다. 공식 10.7.12 변경 기록에는 `setJSON`의 조건부 쓰기 헤더 전달 수정이 있습니다. 이전 V7.0.1/V7.1 OAuth 보안 함수 원본은 유지하면서, 그 함수가 사용하는 SDK에도 해당 수정이 적용되도록 버전을 고정한 것입니다. 검증은 Store 메서드 mock뿐 아니라 공식 SDK의 실제 Client가 보내는 조건 헤더까지 확인하는 오프라인 테스트를 포함합니다. [Netlify Blobs 10.7.12 공식 변경 기록](https://github.com/netlify/primitives/blob/main/packages/blobs/CHANGELOG.md#10712-2026-08-04)

원래 `KAKAO_ALLOWED_USER_ID`, `KAKAO_ADMIN_SECRET`, OAuth state/nonce/cookie/replay 검증은 우회하지 않습니다. 리뷰 알림은 기존 refresh token 저장소를 읽고 갱신한 access token의 소유자를 다시 확인한 후 전송합니다. 서버 내부 오류 응답과 로그에는 고정 안내만 사용하며 비밀값이나 Kakao 원문 오류를 그대로 출력하지 않습니다.

## 7. 데이터 보관과 운영 범위

리뷰 레코드는 운영자가 관리하는 Netlify Blobs에 보관됩니다. 14일 초대 만료와 1시간 관리 링크 만료는 **접근 권한의 만료**이며 저장 데이터 자동 삭제가 아닙니다. 미사용 초대, 거절된 리뷰, 비공개 의견을 자동 삭제하는 보관 기간 작업은 구현하지 않았습니다. 필요할 때 Netlify 저장소에서 해당 리뷰 ID의 레코드를 확인하고 별도 운영 절차로 관리해야 합니다. 기록을 임의로 수정해 승인 검증을 우회하는 방식은 일반 운영 절차로 사용하지 않습니다.

대기 목록과 공개 목록은 저장소의 페이지를 순회하고 현재 레코드를 읽습니다. 납품 후 개별 초대를 보내는 소규모 운영을 위한 구현입니다. 대량 리뷰 서비스로 확장할 때는 별도의 인덱스·페이지네이션·보관 정책을 추가하는 작업이 필요합니다.

HMAC 비밀값을 교체하면 이전 키로 서명한 모든 초대·관리 링크가 무효가 됩니다. 변경을 적용한 배포 후, 미제출 고객에게 새 초대를 발급하고 대기 리뷰는 관리자 목록에서 승인 링크를 재발급합니다. 이미 저장된 승인 리뷰의 공개 상태는 비밀값 교체로 지워지지 않습니다.

## 8. 로컬 검증과 최초 운영 검증 구분

### 이번 결과물의 로컬/mock 검증

- 서명 필드 변조, 기한 만료, 잘못된 action, 없는/다른 nonce, 중복·동시 제출, 동시 승인/거절, replay와 재발급 후 이전 링크 거부.
- `modified: false`, 저장 오류, 불명확한 ETag, 카카오 알림 실패와 저장 결과의 처리.
- GET 조회만으로 리뷰 상태가 바뀌지 않는 구조, 같은 브라우저 확인 쿠키와 POST 검증, 공개 동의 없는 승인 거부, approved 자료만 공개하는 응답.
- 실제 Kakao 계정 대신 모의 응답을 사용한 refresh token 재사용·허용 사용자 ID·알림 template 및 두 개 확인 링크 검사.
- 검증 스크립트, 최종 통과 수, 브라우저 화면 증거와 제약은 `TEST_RESULTS_V7_2.md`와 Verification ZIP에 기록합니다. 모의 응답 통과를 Kakao 또는 Netlify 실서버 성공으로 간주하지 않습니다.

### 최초 배포 뒤 실제 환경에서 확인할 항목 — 이번 작업에서는 미수행

1. Netlify에서 정확한 SDK 버전 설치, Functions 번들, 환경변수 적용, Blobs 읽기·조건부 쓰기 권한을 확인합니다. 관리자 GET에서 빈 password form이 보이고, 잘못된 비밀값 POST는 실패하는지 확인합니다.
2. 기존 OAuth 관리자 연결이 같은 브라우저에서 완료되고 허용한 본인 계정만 연결되는지 확인합니다. 기존 문의 알림과 Gmail/Naver 연결도 기존 운영 절차로 확인합니다.
3. 별도 테스트 환경에서 관리자 form으로 초대를 만들고 일본어 리뷰를 제출해 `pending`을 확인합니다. 실제 Kakao ‘나와의 채팅’에 한 알림의 두 버튼이 표시되는지, PC와 휴대폰에서 올바른 확인 페이지를 여는지 확인합니다.
4. 버튼으로 확인 페이지를 열기만 했을 때 pending 유지, 명시적 POST 후 승인/거절, 같은 브라우저 쿠키 검증, 처리한 링크의 재사용 거부를 확인합니다. 장시간 지난 화면은 새로 열어 확인합니다.
5. 승인한 공개 동의 리뷰가 공개 endpoint와 사이트 리뷰 탭에 나타나고, 미승인·거절·동의 없는 리뷰는 나타나지 않는지 확인합니다. 기존 리뷰 5개가 유지되는지 확인합니다.
6. 알림을 확인하지 못하는 상황에서 관리자 대기 목록과 링크 재발급으로 처리할 수 있는지 확인합니다. 운영 테스트에 사용할 실제 메시지 전송과 상태 변경은 운영자가 의도한 테스트 건으로 수행합니다.

실제 콘솔 설정과 배포가 준비되기 전에는 `/review`의 정적 화면만 열어 새 서버 기능 전체가 동작한다고 판단하지 않습니다.
