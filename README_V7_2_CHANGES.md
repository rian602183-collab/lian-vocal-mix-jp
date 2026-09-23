# Lian Vocal MIX JP V7.2 — Japanese User Feedback / Conversion UX

기준 파일: `Lian_Vocal_MIX_JP_V7_1_Lian_Brand_UX.zip`  
완료일: 2026-09-12

V7.1의 디자인과 기존 서비스를 유지하면서 일본 고객의 날짜 입력·채팅 진입·리뷰 작성 흐름을 개선했습니다. 결과물은 로컬 사이트 파일과 검증 ZIP입니다. GitHub Push, Netlify Production 배포, 실제 Kakao 메시지 전송, Tawk/PayPal 관리자 설정 변경은 수행하지 않았습니다.

## 1. 실제 구현한 내용

| 항목 | V7.2 동작 |
| --- | --- |
| 채팅 진입 | 기존 채팅 CTA 안에 작은 `登録不要・そのままご相談いただけます` 안내 추가 |
| 날짜 | OS 언어에 영향을 받는 native date 대신 `YYYY/MM/DD` 텍스트 입력. ISO 붙여넣기와 모바일 숫자 8자리 입력도 지원하고 표시를 정규화. Netlify에는 기존 `deadline=YYYY-MM-DD` 전송 |
| 날짜 검증 | 윤년·실제 날짜·형식·과거 날짜 검증, 선택 항목이므로 빈 값 허용. label과 오류 안내 연결 |
| 모바일 채팅 | 화면 폭 700px 이하에서 펼친 견적 폼이 보이면 최소화 launcher를 공식 API로 일시 숨김. 폼 안의 채팅 버튼으로 언제든 다시 열기. 열린 대화는 유지 |
| 고객 리뷰 | `/review`에 V7.1 스타일의 일본어 작성 페이지 추가. 관리자만 14일 유효한 초대를 발급하고 초대당 한 번 제출 가능. 공개 작성 버튼은 없음 |
| 리뷰 저장 | Netlify Blobs에 pending 저장. 공개 동의와 관리자 승인 모두 충족한 리뷰만 공개 API에 포함 |
| 카카오 관리 | 기존 OAuth/refresh token/나에게 보내기를 재사용. 알림 한 개에 승인·거절 두 웹 버튼, 각각 서명된 확인 페이지로 이동 |
| 승인·거절 | GET은 상태를 변경하지 않음. 같은 브라우저의 명시적 POST에서 HMAC·action·기한·nonce·쿠키·출처 확인 후 단 한 번 변경 |
| 자동 공개 | 승인 후 공개 endpoint를 읽어 기존 5개 리뷰 아래에 추가. 리뷰 탭을 볼 때와 활성 상태의 60초 간격으로 갱신 |
| 실패 복구 | 알림이 실패해도 접수된 리뷰 유지. 관리자 대기 목록과 승인 링크 재발급으로 처리 |
| PayPal | 향후 안내 흐름을 비활성 HTML template에만 준비. 공개 지원 표시·결제 버튼·SDK·계정·결제 링크 없음 |

고객 입력은 안전하게 텍스트로 출력합니다. 동의하지 않은 감상도 비공개로 접수할 수 있지만 승인은 불가능합니다. 초대는 고객의 구매 이력을 자동 인증하는 수단이 아니라, 운영자가 전달하는 한 번의 작성 권한입니다.

## 2. 그대로 보존한 내용

- 기존 `jp.js`, `jp.css`, `jp-brand-v71.css`와 기존 Kakao 함수 4개는 SHA-256 동일합니다.
- MP3 7개 바이트·경로, 오디오 태그 8개의 `preload="metadata"`, 재생 시 상호 정지를 유지합니다.
- 가격·옵션·GROUP 계산식·Netlify `mix-consultation`·기존 문의 알림 코드를 유지합니다. GROUP 12명 STANDARD는 ¥29,000입니다.
- 기존 리뷰 5개, Hero/대표 음원 위치, MIX POINT, Before/After, Price 3카드, Guide, 일본 X 링크, OG/canonical/hreflang, reduced motion을 유지합니다.
- Tawk Property/Widget ID, 늦은 로딩 후 fallback 자동 숨김, 클릭 시 채팅 열기 동작을 유지합니다.

기존 파일 중 변경한 것은 `index.html`, `netlify.toml`, `package.json`입니다. 새 UX 파일, 리뷰 페이지·서버 코드, 이번 버전 문서를 추가했습니다. 전체 목록과 바이트 비교는 `SHA256_V71_V72.md`에 있습니다.

### Netlify SDK 버전 고정이 필요한 이유

`@netlify/blobs`를 기존 `^10.0.0`에서 **정확히 `10.7.13`**으로 고정했습니다. 공식 10.0.0 및 10.0.11의 `setJSON`에서는 조건이 실제 HTTP 헤더까지 전달되지 않는 문제를 검증 중 확인했습니다. 공식 10.7.12에서 수정되었고 10.7.13의 실제 Store/Client가 조건 헤더를 보내는 것을 모의 HTTP로 검증했습니다. [공식 수정 기록](https://github.com/netlify/primitives/blob/main/packages/blobs/CHANGELOG.md#10712-2026-08-04)

이전 129개 회귀 검사는 유지했고, 이전 SDK 검사보다 더 깊은 실제 Client 전송 계층 검사를 추가했습니다. 이전 검사의 통과만으로 SDK 조건부 쓰기 전체가 검증된 것은 아니었습니다. 기존 OAuth 함수의 `modified` 검사·state·nonce 보안은 그대로 두고 이 의존성 수정이 적용되도록 했습니다. 새 리뷰 코드는 `store.set` 조건부 쓰기의 `modified === true`와 비어 있지 않은 ETag를 확인합니다.

## 3. 관리자가 설정해야 하는 부분

Tawk는 `Administration → Chat Widget → Widget Content → Edit Content → Widget State: Pre-Chat → Enable Pre-Chat OFF`를 실제 관리자 화면에서 적용해야 합니다. 일본어, Lian alias, 자동 greeting/preview OFF, 재방문 라벨도 확인합니다. **Offline Form은 Name/Email을 제거할 수 없으므로** ‘회원가입 불필요’와 ‘회신 정보 입력’을 구분하도록 안내했습니다. 사이트에서 iframe을 변조하지 않습니다. 상세 절차는 `TAWK_V7_2_SETUP.md`입니다.

PayPal은 실제 계정의 수령·결제 확인을 완료한 뒤 별도의 활성화 변경이 필요합니다. V7.2는 공개 지원을 확정하지 않습니다. `PAYPAL_SETUP.md`를 따릅니다.

## 4. 번역 보조의 지원 범위

공식 AI Commands `/ai-task`로 일본어의 한국어 뜻 또는 한국어 답변의 일본어 초안을 만들고, Lian이 검토한 뒤 전송하는 운영을 제안했습니다. Smart Reply는 답변 제안이며 번역 전용 기능은 아닙니다.

현재 확인한 공개 API에는 고객 일본어를 Dashboard에서 자동 한국어로 병기하거나, 사람 상담원의 한국어 전송을 가로채 일본어로 바꾸는 기능이 없습니다. 자동 통역은 구현하지 않았습니다. AI 채널 할당은 자동응답에도 영향을 줄 수 있으므로 초안만 사용하려는 경우 실제 설정과 테스트가 필요합니다. 용어 사전·지시 예시·제한은 `TAWK_TRANSLATION_SETUP.md`에 있습니다. 자체 번역 도구는 V8 검토 대상으로 남깁니다.

## 5. 새 환경변수와 배포 전 준비

새 변수는 **`REVIEW_HMAC_SECRET` 하나**입니다. 서버 전용의 충분히 무작위인 32자 이상 값이며 기존 `KAKAO_ADMIN_SECRET`과 다른 값을 사용합니다. 기존 Kakao 변수와 허용 사용자 ID는 유지합니다.

1. `REVIEW_SYSTEM_SETUP.md`에 따라 새 비밀값과 `PUBLIC_SITE_URL`, 기존 OAuth 연결을 확인합니다.
2. Kakao Developers의 **[앱] → [제품 링크 관리] → [웹 도메인]**에 실제 사이트 origin을 등록합니다. JS SDK 도메인 설정과 별개입니다.
3. 배포 시 의존성 10.7.13과 Functions를 실제로 설치·번들하는지 확인합니다. 정적 HTML만 보이는 것으로 리뷰 기능의 준비를 판단하지 않습니다.
4. Tawk 설정을 적용하고 모바일 실기기의 위젯·키보드·safe area를 확인합니다. PayPal은 비활성을 유지합니다.
5. 별도 테스트 프로젝트에서 실제 OAuth·Blobs·Kakao 두 버튼·쿠키·승인 공개·기존 문의 알림을 확인한 후 운영에 반영합니다. 같은 Netlify 프로젝트의 site-wide Blobs는 Deploy Preview에서도 공유될 수 있습니다.

이번 작업에서는 위 콘솔 변경·배포·실전송을 수행하지 않았습니다. 최초 설정과 배포 이후에는 개별 리뷰의 초대/승인/거절 때문에 GitHub 수정, 재배포, HTML 추가가 필요하지 않습니다.

## 6. 테스트 결과와 전달 파일

최종 **309개 검사 통과**, 별도 `node --check` 및 SHA-256/콘텐츠 보존 검사 통과입니다. 세부 수와 검증 방법은 `TEST_RESULTS_V7_2.md`에 있습니다. 실제 Chrome의 관리자 form → 초대 → 고객 제출 → pending → 확인 GET → 쿠키를 포함한 명시적 POST → 공개 반영 흐름을 검사했습니다. 외부 통신은 모두 차단·대체했고 실제 Netlify/Kakao 성공을 의미하지 않습니다.

- `Lian_Vocal_MIX_JP_V7_2_JP_User_Feedback.zip`: 사이트 소스와 설정 안내
- `Lian_Vocal_MIX_JP_V7_2_Verification.zip`: 테스트 소스·로그·화면 캡처·SHA-256·재실행 안내. 사이트 배포용이 아닙니다.
- 별도 문서 6개: 변경 보고서, 테스트 결과, Tawk 설정, 번역 보조, PayPal 준비, 리뷰 운영

로컬 서버 실행은 자동 승인 검토의 사용량 제한으로 실행하지 못했습니다. 브라우저 검사는 별도 서버나 외부 통신 없이 요청을 로컬 파일·실제 handler로 연결하는 방식으로 완료했습니다. npm 설치/잠금 파일 생성 및 Netlify 빌드는 이번 환경에서 실행하지 않았으며 배포 전 설치·번들 검증 항목으로 남깁니다.
