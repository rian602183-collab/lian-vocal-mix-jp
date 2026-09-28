# Tawk 한↔일 번역 운영 — V7.3.1

확인일: 2026-09-28

## 현재 권장 방식

V7.3.1부터 사이트에 운영자 전용 자동번역 도구가 포함됩니다.

```text
/operator-translate
```

실제 흐름:

1. Tawk 고객 일본어 메시지 복사
2. 운영자 번역도구에 붙여넣기 → 일본어→한국어 자동 번역
3. 한국어로 답변 작성 → 한국어→일본어 자동 번역
4. 역번역 확인
5. 일본어 결과 복사
6. Tawk에서 사람이 최종 전송

설정은 `TRANSLATOR_V7_3_1_SETUP.md`를 따릅니다.

## 왜 Tawk Dashboard 안에서 완전 자동 치환하지 않았는가

Tawk 공개 JavaScript API는 웹사이트에 표시되는 chat widget 제어용입니다. `onChatMessageVisitor` / `onChatMessageAgent` callback은 메시지가 전송됐을 때 호출되며, `setChatInputMessage()`는 **방문자용 위젯 입력창**을 미리 채우는 API입니다.

공식 문서에서 사람 상담원의 Dashboard composer 내용을 전송 전에 가로채 일본어 번역문으로 치환하는 API는 확인되지 않았습니다.

- https://developer.tawk.to/jsapi/

Tawk Webhooks의 현재 문서화된 이벤트는 Chat start / end / transcript / ticket create입니다. 모든 중간 메시지를 실시간으로 번역해 Dashboard에 다시 삽입하는 per-message webhook은 문서화되어 있지 않습니다.

- https://developer.tawk.to/webhooks/

따라서 Dashboard DOM injection, 확장프로그램 해킹, 비공식 endpoint 사용은 하지 않습니다.

## Tawk 자체 AI 기능을 같이 쓸 경우

AI Assist는 multilingual support를 지원합니다.

- https://help.tawk.to/article/getting-started-with-ai-assist

Smart Reply는 고객 질문을 바탕으로 답변 초안을 생성하고 사람이 편집/전송할 수 있습니다.

- https://help.tawk.to/article/using-smart-reply

중요: Smart Reply는 번역 전용이 아니라 **답변 생성** 기능입니다. MIX 가격, 납기, 수정 범위, 할인 조건을 AI가 임의 확정하지 않는지 확인해야 합니다.

V7.3.1에서는 Tawk AI Assist를 필수로 켜지 않습니다. 기존 Tawk 상담/Chat Rescuer 설정은 `TAWK_V7_3_CONVERSION_SETUP.md`를 그대로 유지합니다.

## UI 언어와 메시지 번역은 별개

- Tawk visitor widget: 일본어 UI
- Lian Dashboard: 한국어 UI로 설정 가능

이는 메뉴/버튼 언어 설정이며 대화문 자체의 자동번역과는 별개입니다.

## MIX 번역 체크 규칙

일본어로 보내기 전 항상 확인:

- 질문인가 확정인가
- `可能です`와 확정 수락을 혼동하지 않았는가
- `〜から`와 고정가격을 혼동하지 않았는가
- 날짜/시간/업로드일/납기일이 바뀌지 않았는가
- 인원/트랙 수/하모리/더블 조건이 유지됐는가
- PayPal/가격/수정 범위를 새로 추가하지 않았는가

V7.3.1 DeepL 함수도 위 원칙을 custom instructions로 전달하고 숫자/금액/ID/MIX 용어를 보호하지만, 마지막 전송 판단은 사람이 합니다.
