# V7.3.1 자동번역 설정 가이드

## 1. DeepL API 키 준비

DeepL의 일반 웹 번역기 키가 아니라 **DeepL API 인증키**가 필요합니다. API Free 또는 API Pro를 사용할 수 있습니다.

공식 API 문서:
https://developers.deepl.com/api-reference/translate/request-translation

`DEEPL_API_KEY`는 사이트 HTML/JS에 넣지 말고 Netlify 환경변수에만 저장합니다.

## 2. 운영자 비밀번호 만들기

`LIAN_TRANSLATOR_ACCESS_KEY`에는 다른 사이트에서 쓰지 않는 긴 임의 문자열을 사용하세요.

예시 형태만 참고:

```text
Lian-Translator-2026-xxxxxxxxxxxxxxxx
```

예시 그대로 사용하지 말고 직접 다른 문자열을 만드세요.

이 값은 DeepL 키와 별개입니다.

- DeepL API key = 서버가 DeepL에 인증할 때 사용
- Translator access key = Lian 본인이 운영자 번역 페이지를 열 때 사용

## 3. Netlify 환경변수

Netlify 사이트 설정의 Environment variables에 아래 두 항목을 추가합니다.

```text
DEEPL_API_KEY=본인의 DeepL API key
LIAN_TRANSLATOR_ACCESS_KEY=본인이 만든 운영자 비밀번호
```

특별한 이유가 없다면 `DEEPL_API_URL`은 설정하지 않습니다.

DeepL API Free 키가 `:fx`로 끝나는 경우 V7.3.1이 `api-free.deepl.com`을 자동 선택합니다. 그 외에는 `api.deepl.com`을 사용합니다.

환경변수 저장 후 Production deploy/redeploy를 수행합니다.

## 4. 접속

배포 후:

```text
https://lian-vocal-mix-jp.netlify.app/operator-translate
```

또는 실제 사용 중인 custom domain 뒤에 `/operator-translate`를 붙입니다.

공개 사이트 메뉴에는 링크하지 않았습니다. 주소를 북마크해 두는 것을 권장합니다.

페이지가 검색엔진에 노출되지 않도록 `robots.txt`, `X-Robots-Tag`, `noindex`를 함께 적용했습니다. 다만 URL 자체를 아는 사람은 페이지 HTML을 열 수 있으므로 **실제 API 호출은 access key 인증을 통과해야만 가능**하게 했습니다.

## 5. 추천 실제 상담 흐름

### 고객 일본어 읽기

1. Tawk에서 고객 메시지를 복사
2. `일본어 메시지 이해하기` 입력칸에 붙여넣기
3. 자동 번역 ON이면 약 650ms 후 한국어 의미 표시
4. 숫자/납기/확정 여부 확인

### 일본어 답변 만들기

1. 내가 보낼 답변을 한국어로 작성
2. 자동으로 일본어 초안 생성
3. 기본 ON인 `역번역까지 확인` 결과 읽기
4. 아래 항목이 같은지 확인
   - 금액
   - 날짜/시간
   - 인원/트랙 수
   - 가능 여부와 확정 여부
   - 추가요금/수정 조건
5. `일본어 복사`
6. Tawk Reply에 붙여넣기
7. 마지막으로 일본어를 눈으로 확인하고 전송

## 6. 역번역 사용량

역번역 ON이면:

- 한국어 → 일본어 1회
- 생성된 일본어 → 한국어 1회

총 2번의 번역 요청이므로 사용 문자 수가 대략 2배가 됩니다. 중요한 견적/납기 답변에는 ON을 권장합니다. 짧고 반복적인 인사말에서 비용을 아끼고 싶다면 OFF할 수 있습니다.

## 7. Tawk AI Assist는 선택사항

Tawk 공식 AI Assist에는 multilingual support와 Smart Reply가 있습니다.

- https://help.tawk.to/article/getting-started-with-ai-assist
- https://help.tawk.to/article/using-smart-reply

다만 Smart Reply는 **단순 번역만 하는 기능이 아니라 고객 질문에 대한 답변을 생성**할 수 있으므로 가격·납기·수정 조건을 원문에 없게 추가하지 않는지 사람이 확인해야 합니다.

V7.3.1 운영자 번역 도구는 Tawk AI Assist를 켜지 않아도 동작합니다.

## 8. 장애별 확인

### `비밀번호가 맞지 않습니다`

- `LIAN_TRANSLATOR_ACCESS_KEY`가 Netlify 환경변수와 정확히 같은지 확인
- 저장 후 redeploy 여부 확인
- 앞뒤 공백 확인

### `DEEPL_API_KEY를 설정해야 합니다`

- Netlify 환경변수 이름 오타 확인
- DeepL API용 key인지 확인
- 환경변수 변경 후 redeploy

### `DeepL API 키 인증에 실패했습니다`

- DeepL key 만료/삭제 여부 확인
- API Free/Pro 계정 상태 확인

### `사용 한도에 도달했습니다`

DeepL 계정의 usage / Cost Control을 확인합니다.

### 자동번역이 너무 자주 실행됨

- 상단 `입력 후 자동 번역`을 끄고 `지금 번역` 버튼만 사용
- 동일 문장 재요청은 V7.3.1 자체에서 중복 차단됨

### 클립보드 붙여넣기가 차단됨

브라우저 보안 정책에 따라 Clipboard Read가 거부될 수 있습니다. 입력창을 길게 눌러 일반 붙여넣기를 사용하면 됩니다.

## 9. 개인정보 주의

앱 코드에서 번역 원문/결과를 DB나 localStorage에 저장하지 않습니다. 운영자 비밀번호만 세션 동안 `sessionStorage`에 보관합니다.

하지만 실제 번역을 위해 문장은 DeepL로 전송됩니다. 따라서 번역에 필요 없는 다음 값은 제거하고 붙여넣는 것을 권장합니다.

- 계정 비밀번호
- 카드/결제정보
- API key/secret
- 공유 URL의 비밀 token
- 고객의 불필요한 개인정보
