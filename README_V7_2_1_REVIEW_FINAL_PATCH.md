# V7.2.1 Review Privacy / Repeat Client — 최종 소규모 패치

검증일: 2026-09-14. V7.2.1 버전을 유지하며 **익명 공개 선택과 재의뢰 회차 표시 두 기능만** 추가했습니다. 기준은 Lian_Vocal_MIX_JP_V7_2_1_Mobile_Conversion_Polish.zip이며 SHA-256은 e007d805353bffc1e230499cb29375049e1437471d37186fcc7683d5aa27e27d입니다. 기존 ZIP과 V7.2.1 문서는 수정하지 않고 보존했습니다.

## 이용 흐름

1. 관리자는 기존 /.netlify/functions/reviews-admin 페이지에서 같은 관리자 비밀값을 입력하고 **이번 의뢰 회차**를 선택합니다. 1회차가 기본이며 1·2·3·4·5회 이상 중 선택합니다.
2. 초대 생성 POST가 회차를 저장하고, 기존과 같은 14일·1회용 전용 링크를 발급합니다. 생성 완료 화면에서 지정한 회차를 확인할 수 있습니다. 회차는 고객 폼이나 초대 URL에 추가하지 않습니다.
3. 고객은 활동명과 리뷰를 입력하며 **サイトでは匿名で掲載する**를 선택할 수 있습니다. 이 체크는 아래 사이트 공개 동의와 독립적이며 기본은 해제입니다.
4. 기존 Kakao 알림/대기 목록에서 실제 활동명, 익명 여부, 회차, 동의, 곡명, 평점, 내용을 확인합니다. 승인·거절 링크는 GET 확인 화면을 열고, 같은 브라우저의 명시적 POST만 처리합니다.
5. 승인된 공개 동의 리뷰는 기존 공개 API와 동적 리뷰 영역에 반영됩니다. 개별 승인에 GitHub 수정·HTML 추가·재배포가 필요한 구조를 추가하지 않았습니다.

| 사이트 공개 동의 | 익명 선택 | 승인 및 공개 결과 |
|---|---|---|
| YES | NO | 기존 활동명으로 공개 가능 |
| YES | YES | 공개 이름은 匿名 |
| NO | 어느 쪽이든 | 승인 불가·공개 API 제외 |

| 저장 회차 | 공개 카드의 작은 메타 정보 |
|---:|---|
| 1 | 회차 표시 없음 |
| 2 | 2回目のご依頼 |
| 3 | 3回目のご依頼 |
| 4 | 4回目のご依頼 |
| 5 | 5回以上のご依頼 |

카드는 기존 글꼴·색·메타 영역을 그대로 사용합니다. 예: **匿名 · 3回目のご依頼 · 2026.09.14**. 새로운 강조 박스나 CSS는 추가하지 않았습니다.

## 데이터 저장·호환성

기존 Netlify Blobs store **lian-reviews-v72**, 기존 canonical key **review-{id}**의 동일 JSON record에 저장합니다. 새 DB/store/key 구조나 migration 작업은 없습니다. schemaVersion과 기존 token 형식도 유지합니다.

- orderCount: 관리자 invite 생성 시 최상위 필드에 정수1~5를 저장합니다. native form은 정확한 문자열1~5만 정수로 변환하고 JSON 요청은 정수만 허용합니다. 생략하면1이며 null, boolean, 배열, 소수, 범위 밖, 예상하지 못한 문자열은422로 거절합니다. 중복 form 필드도 기존400 처리입니다.
- anonymousDisplay: 고객 submit 시 최상위 필드에 boolean을 저장합니다. 체크박스는 명시적인 true/false로 JSON 전송합니다. 생략하면false이고 문자열 "true"/"false"/"on", 숫자, null, 배열·객체는422로 거절하며 초대를 소비하지 않습니다.
- 제출 시 orderCount는 **저장된 초대 record에서만** 읽습니다. 고객이 임의 orderCount를 POST해도 무시하고 관리자 지정값을 유지합니다. 승인·거절·재알림 과정에서도 이 값을 새로 받지 않습니다.
- 기존 invite/review에 anonymousDisplay가 없으면false, orderCount가 없으면1로 읽습니다. 유효하지 않은 저장 회차도1로 처리합니다. 기존 pending/approved와 CREPE 정적 리뷰5개에 강제 migration이 필요하지 않습니다.

## 공개 개인정보 경계

reviews-public은 기존의 **approved + consent === true** 조건을 유지하고, 응답 projection 단계에서 anonymousDisplay === true인 record의 displayName을 **匿名**으로 바꿉니다. 실제 활동명을 CSS로 가리거나 브라우저에서 나중에 지우는 방식이 아닙니다.

공개 응답 키는 기존 id, displayName, songTitle, rating, body, publishedAt과 배지에 필요한 검증된 orderCount뿐입니다. 실제 이름을 originalName 등의 보조 필드로 함께 보내지 않으며 anonymousDisplay 자체도 공개 응답에는 필요 없어 제외했습니다. invite/moderation token, nonce, signature/HMAC, secret, 내부 Blob key, ETag, Kakao 정보, 관리자 메타는 포함하지 않습니다. 기존 공개 리뷰 ID는 유지하며 내부 Blob key와는 구분합니다.

예시: 내부 displayName="ABC", anonymousDisplay=true, orderCount=3인 승인·동의 리뷰는 공개 API에 displayName="匿名", orderCount=3으로 반환됩니다. 테스트에서는 공개 JSON 원문과 별도의 공개 브라우저 DOM에서 실제 이름이 없는지 확인했습니다.

익명화는 표시명 필드에 적용됩니다. 리뷰 본문·곡명은 기존의 공개 동의와 관리자 확인을 따르며, 폼의 개인 정보 작성 금지 안내를 유지합니다. 관리자 내부 저장값의 displayName은 바꾸지 않습니다.

## 관리자·Kakao 표시

대기 목록과 서명된 승인/거절 확인 화면은 **실제 활동명**, 사이트 익명 표시 사용/사용하지 않음, 의뢰 회차, 곡명, 평점, 공개 동의, 리뷰 본문을 보여 줍니다. 이름·본문은 기존 HTML escaping을 유지합니다. 활동명 전체는 이 화면에서 확인할 수 있습니다.

Kakao 기존 text template에 **사이트 익명 표시**와 **의뢰 회차** 두 줄을 추가했습니다. 실제 활동명·곡명·평점·동의·본문을 유지하며 기존 길이 제한도 유지합니다(이름24자/곡명30자/본문100자 미리보기, 메시지 전체200자 이내). 긴 내용은 기존처럼 축약되므로 전체 내용은 확인 페이지에서 봅니다. 승인/거절2개 버튼과 signed GET 웹 링크, 토큰 갱신, allowed user 검사는 그대로입니다. 실제 Kakao 전송은 하지 않았습니다.

## 수정·추가 파일

| 기존 수정 파일 | 변경 범위 |
|---|---|
| review/index.html | 익명 체크박스·설명과 독립 공개 동의 문구 |
| review/review.js | anonymousDisplay boolean 제출 |
| netlify/functions/lib/review-server.mjs | 관리자 회차 선택/검증·저장, 익명 검증/저장, 내부 표시, 공개 projection |
| netlify/functions/lib/review-kakao.mjs | 익명 여부와 회차 알림2줄 |
| jp-v72.js | 공개 metadata에 검증된2~5회차 문구를 textContent로 추가 |

새 사이트 파일은 이 버전 문서3개뿐입니다: README_V7_2_1_REVIEW_FINAL_PATCH.md, TEST_RESULTS_V7_2_1_REVIEW_FINAL_PATCH.md, SHA256_V721_REVIEW_PATCH.md. 추가 runtime/CSS/환경변수는 없습니다. 관련 새 테스트·캡처는 별도 Verification ZIP에 있습니다.

## 그대로 보존한 기능

기존68개 파일 중 위5개 외 **63개가 byte-identical**입니다. index.html, thanks.html, 모든 CSS, Hero/Portfolio/Price/Guide/Contact/FAQ, OG, jp-v721.js, Tawk, robots/sitemap/404, package manifest/lock, 기존 문서를 보존했습니다. MP3 7개는 파일명·SHA-256·총43,772,468B 모두 동일하며 index의8개 audio metadata 설정도 그대로입니다.

가격과 계산은 변경하지 않았습니다: LIGHT4000/STANDARD5500/DELUXE6500〜, GROUP12명 STANDARD29000, 트랙500, 기본 옵션1000〜, 비공개2000, 급행30%/50%, 무료 수정3회·이후500. 모바일5탭, SNS/email 중 하나 필수, native POST와 sending state, 날짜·급행 안내, FAQ10개, Chrome 번역 허용도 회귀 검사했습니다.

기존 Kakao 관련4개 파일과 review runtime/함수 entrypoint를 포함한 서버10개 파일은 동일합니다. 변경한 review-server 안에서도 origin/configuration/HMAC/토큰 검증/CAS·ETag/링크 생성과 전체 moderation 처리 코드를 원문 구간 비교로 보존 확인했습니다. 14일 초대,1시간 moderation,nonce,signed action,GET 무변경,Secure HttpOnly cookie,Origin/CSRF,explicitPOST,replay,approved-only/XSS-safe 렌더링에 변경이 없습니다.

## 검증 결과·외부 범위

**기존450/450 + 신규88/88 = 538/538 통과.** 신규는 서버·Kakao61개와 실제 로컬 Chrome UI27개입니다. 별도 node --check16개 및 공식 Netlify 로컬 번들9개도 통과했습니다. 상세 결과와 테스트 기대값 변경 근거는 TEST_RESULTS_V7_2_1_REVIEW_FINAL_PATCH.md 및 Verification ZIP에 있습니다.

검사는 로컬 파일·실제 handler·메모리 CAS 저장소·mock Kakao/Tawk를 사용했습니다. **실제 Netlify Production 미배포, 실제 Kakao 메시지 미전송, 실제 Tawk 변경 없음, 실제 고객 리뷰 미생성, GitHub Push 없음, PayPal 변경 없음**입니다. 기존 V7.2.1 오디오 네트워크 관측은 과거 보고서로 보존했으며 이번 소규모 패치의 새 실서버 검사라고 계산하지 않았습니다.

**환경변수 추가·변경 없음.** KAKAO_ADMIN_SECRET/KAKAO_ALLOWED_USER_ID/REVIEW_HMAC_SECRET 및 기존 OAuth 연결·store 설정을 그대로 사용합니다. Kakao Developers 설정 변경도 필요하지 않습니다.

## 운영자가 배포 후 확인할 순서

1. 최종 사이트 ZIP의 루트 파일·기존 Functions/환경변수를 유지해 사용자가 직접 배포합니다. Verification ZIP은 배포하지 않습니다.
2. 관리자 초대 생성에서3회차를 선택하고 고객 폼의 익명 선택과 공개 동의가 별개인지 확인합니다.
3. 실제 내부 Kakao 알림과 확인 페이지에 실제 이름·익명·회차가 보이는지 확인합니다.
4. GET만으로 상태가 바뀌지 않고 명시적 POST 후 공개 페이지에 匿名 · 3回目のご依頼가 표시되는지 확인합니다. 공개 API에도 실제 이름이 없어야 합니다.
5. 공개 미동의·기존 리뷰·5회 이상·실제 모바일 표시를 확인합니다. 이 목록은 사용자가 수행할 운영 확인이며 Codex가 수행한 것으로 기록하지 않습니다.
