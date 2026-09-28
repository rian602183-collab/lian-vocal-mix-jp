# Lian Vocal MIX JP — V7.3.1 Automatic Translation Operator Patch

Base: `Lian_Vocal_MIX_JP_V7_3_Consultation_Conversion_Final.zip`

## 목적

V7.3의 가격/문의전환/PayPal/포트폴리오/리뷰/Tawk 구조를 그대로 보존하면서, Lian 운영자가 일본 고객과 대화할 때 사용할 **한↔일 자동번역 보조 도구**를 추가했습니다.

공개 고객 사이트의 상담 문구나 가격 계산 로직은 변경하지 않았습니다. 기존 파일 중 수정된 것은 `netlify.toml`, `robots.txt`뿐이며, 이는 운영자 도구의 비공개 헤더/라우팅/검색 제외를 위한 변경입니다.

## 새 기능

운영자 페이지:

- `/operator-translate`
- 실제 파일: `/operator/translate.html`
- 공개 메뉴/사이트맵에는 노출하지 않음
- `X-Robots-Tag: noindex, nofollow, noarchive`
- CSP / DENY frame / no-store 적용

번역 흐름:

1. 일본 고객 메시지 붙여넣기 → 약 650ms 후 **일본어 → 한국어 자동 번역**
2. 한국어 답변 입력 → 약 650ms 후 **한국어 → 정중한 일본어 초안**
3. 기본값으로 일본어 초안을 다시 한국어로 **역번역 검증**
4. 일본어 결과만 복사 → Tawk 답장창에 붙여넣고 사람이 최종 확인 후 전송
5. 동일한 문장을 반복해서 눌러도 같은 요청은 재호출하지 않도록 중복 요청 방지

## 정확도 보호

서버 측 DeepL 요청에서 다음을 적용합니다.

- source/target 언어 고정: `JA→KO`, `KO→JA`
- KO→JA: `formality: prefer_more`
- `model_type: prefer_quality_optimized`
- DeepL `custom_instructions`로 다음 원칙 전달
  - 질문을 답변으로 바꾸지 않음
  - 가능/검토와 확정/수락을 구분
  - 할인/납기/보장/사과를 원문에 없으면 추가하지 않음
  - 숫자, 금액, 날짜, 인원, 플랜, MIX 용어를 임의 변경하지 않음
- URL / @ID / 이메일 / 금액 / 날짜·시간 / MIX / PayPal / LIGHT / STANDARD / DELUXE / Cubase / wav / mp3 / 48kHz / 24bit 등을 XML `ignore_tags`로 보호
- 보호 토큰이 번역 후 사라지면 사용자 화면에 경고 표시
- 최신 옵션을 지원하지 않는 DeepL 계정에서 400이 나오면 안정적인 핵심 옵션으로 1회 자동 재시도

DeepL 공식 Translate API는 `custom_instructions`, tag handling/`ignore_tags`, `formality`, `model_type`을 지원합니다.

- https://developers.deepl.com/api-reference/translate/request-translation

## 보안 설계

브라우저에는 **DeepL API 키를 절대 넣지 않습니다**.

필수 Netlify 환경변수:

- `DEEPL_API_KEY` — DeepL API Free/Pro 인증키
- `LIAN_TRANSLATOR_ACCESS_KEY` — 운영자 페이지용 별도 비밀번호. 충분히 긴 임의 문자열 권장

선택:

- `DEEPL_API_URL` — 특별한 이유가 있을 때만 API endpoint override. 기본값은 키가 `:fx`로 끝나면 API Free, 아니면 API Pro endpoint를 자동 선택

보안 동작:

- 운영자 키는 HTTPS 요청 header `X-Lian-Translator-Key`로만 전송
- 서버에서 timing-safe 비교
- 브라우저 저장은 `sessionStorage`만 사용 → 탭/세션 종료 후 유지하지 않음
- cross-origin 브라우저 요청 차단
- 요청당 최대 4,000자
- 요청 body 크기 제한
- 간단한 분당 rate limit
- 번역 응답 `no-store`
- 앱 코드에 번역 내역 저장 기능 없음

주의: 번역 문장은 실제 번역을 위해 DeepL API로 전송됩니다. 비밀번호, 결제정보, API 키, 번역에 필요 없는 비공개 링크 토큰 등 민감정보는 붙여넣지 않는 운영을 권장합니다.

## Tawk와의 관계

이 패치는 **Tawk Dashboard 내부 메시지를 강제로 가로채거나 수정하지 않습니다.**

2026-09-28 확인한 Tawk 공개 JavaScript API에는 방문자/상담원 메시지 전송 후 callback은 있지만, 상담원 Dashboard composer의 메시지를 **전송 전에 가로채 번역문으로 교체하는 API**는 문서화되어 있지 않습니다. Webhook도 Chat start/end/transcript/ticket 이벤트 중심이며 모든 중간 메시지를 실시간 번역해 Dashboard에 삽입하는 구조는 아닙니다.

따라서 안정성과 계정 보안을 위해:

`Tawk에서 복사 → 운영자 번역도구 자동번역 → 일본어 결과 복사 → Tawk에서 사람이 최종 전송`

흐름으로 구현했습니다.

공식 참고:

- Tawk JS API: https://developer.tawk.to/jsapi/
- Tawk Webhooks: https://developer.tawk.to/webhooks/
- Tawk AI Assist multilingual: https://help.tawk.to/article/getting-started-with-ai-assist
- Tawk Smart Reply: https://help.tawk.to/article/using-smart-reply

AI Assist multilingual/Smart Reply는 선택적으로 사용할 수 있지만, 이 V7.3.1 도구는 AI Assist 가입 여부와 독립적으로 동작합니다.

## 배포 순서

1. DeepL API 인증키 준비
2. Netlify → Site configuration / Environment variables에서 `DEEPL_API_KEY` 추가
3. 같은 곳에 `LIAN_TRANSLATOR_ACCESS_KEY` 추가
4. 이 ZIP 배포 / redeploy
5. `https://사이트주소/operator-translate` 접속
6. 운영자 비밀번호 입력
7. 테스트 문장으로 양방향 번역 + 역번역 확인
8. 실제 Tawk 답장은 반드시 사람이 최종 확인 후 전송

환경변수 값은 HTML/JS 파일에 직접 적지 않습니다.

## 이번 버전에서 하지 않은 것

- 실제 사용자 DeepL API 키를 이용한 Production API 호출
- Netlify Production 배포
- 실제 Tawk 계정 설정 변경
- Tawk Dashboard DOM injection/userscript
- 고객 메시지를 자동으로 Tawk에 대신 전송
- 번역 로그/대화 저장 DB

위 항목은 사용자 계정/실환경이 필요하거나, 공개 API 안정성 범위를 벗어나므로 임의로 성공 처리하지 않았습니다.
