# Tawk V7.3 — 놓친 상담 줄이기 설정

확인일: **2026-09-28**  
사이트 코드 대상: **Lian Vocal MIX JP V7.3**

이 문서는 사이트 ZIP만으로 변경할 수 없는 Tawk Dashboard 설정입니다. 실제 Tawk 계정에는 자동 적용되지 않습니다.

## 1. V7.2.1 기본 설정은 유지

다음 원칙은 그대로 유지합니다.

- Pre-Chat: OFF
- Attention Grabber: OFF
- 방문만으로 자동 확대/강제 팝업: OFF
- Widget language: Japanese / 日本語
- Mobile launcher: 기존 원형 Bottom Right
- 고객이 직접 채팅을 열었을 때만 첫 안내 표시
- 기존 Property `6aa0d3bc08f5a2345548dc9d`
- 기존 Widget `1k223m625`

V7.3 사이트는 Tawk iframe 내부를 수정하지 않습니다.

## 2. 기존 Widget Maximized 첫 안내 유지

기존 `Basic - Widget Maximized` 트리거가 아래 흐름으로 설정되어 있으면 유지합니다.

첫 안내 예시:

```text
ご相談ありがとうございます！
料金・納期の確認だけでも大丈夫です。
MIXについてお気軽にご相談ください。
```

Suggested Messages:

1. `料金・納期を確認したい`
2. `録音データについて相談したい`
3. `プラン・MIX内容について相談したい`

사이트 V7.3의 3개 상담 버튼도 같은 의도를 사용합니다.

## 3. Chat Rescuer 추가 — 가장 중요

목표는 **고객이 채팅을 시작했는데 운영자가 바로 참여하지 못한 경우 연락처를 남기도록 안내하는 것**입니다.

Tawk Dashboard에서 Triggers 메뉴로 이동해 **Basic - Chat Rescuer** 유형을 추가합니다. 실제 메뉴명이 계정 UI에서 조금 다르면 `Chat Rescuer`가 포함된 Basic trigger를 선택합니다.

권장 지연: **30초**

권장 메시지:

```text
お問い合わせありがとうございます。
すぐに返信できない場合があります。
よろしければ、①活動名 ②返信先（Xまたはメール）③曲名 ④希望納期をこのまま送ってください。
確認後、順番に返信します。
サイトの「30秒相談」もご利用いただけます。
```

이 메시지는 즉시 답변을 약속하지 않으며, 사용자가 채팅을 닫더라도 다시 연락할 수 있는 정보를 확보하기 위한 것입니다.

### 중복 방지

- Widget Maximized: 채팅을 열었을 때 1회 첫 안내
- Chat Rescuer: 채팅이 시작됐지만 상담원이 일정 시간 참여하지 못했을 때

역할이 다르므로 둘은 함께 사용할 수 있습니다. 다만 같은 내용의 Chat Rescuer를 여러 개 만들지 않습니다.

## 4. Offline Form

Tawk 자체 Offline Form을 사용한다면, 공식 제한상 Name / Email 필수 입력이 남을 수 있습니다. 사이트의 `30秒相談`은 이와 별개의 대안입니다.

Offline 상태 문구 예시:

```text
現在すぐに返信できません。
サイトの「30秒相談」からXまたはメールを1つ残していただければ、確認後に順番に返信します。
```

Tawk Offline Form의 필수 Name/Email을 코드로 우회하거나 iframe을 조작하지 않습니다.

## 5. V7.3 사이트 버튼 동작

사이트 코드에서는 Tawk 공식 JS API 범위 안에서 다음을 수행합니다.

- `getStatus()`로 Online / Away / Offline 표시
- 상담 유형을 누르면 `setChatInputMessage()`로 아래 문장을 미리 입력
  - `料金・納期を確認したいです。`
  - `MIXについて相談したいです。`
  - `録音データについて相談したいです。`
- `addEvent()`에는 개인식별정보 없이 intent/source/page만 기록
- Offline이면 채팅을 강제 최대화하지 않고 30초 폼으로 이동

Tawk의 `setChatInputMessage()`는 위젯 입력창을 미리 채우는 용도이며, 방문자가 내용을 확인한 뒤 보내는 흐름을 유지합니다.

## 6. 관리자 적용 후 반드시 확인

- [ ] 시크릿 창에서 아무 조작 없이 기다려도 자동 채팅 확대가 되지 않음
- [ ] 채팅 버튼 클릭 시 일본어 첫 안내/Suggested Messages가 보임
- [ ] 메시지를 보낸 뒤 30초 동안 상담원이 참여하지 않은 테스트에서 Chat Rescuer가 1회 작동
- [ ] Online/Away/Offline 표시가 실제 Tawk 상태와 대체로 일치
- [ ] Offline에서 사이트 `料金・納期を確認する` 클릭 시 30초 폼으로 이동
- [ ] Online에서 사이트 상담 버튼 클릭 시 의도 문장이 입력창에 들어감
- [ ] 기존 대화/재방문에서 Rescuer가 과도하게 반복되지 않음
- [ ] Android Chrome과 X 인앱 브라우저에서 실제 확인

## 참고한 공식 문서

- JavaScript API: https://developer.tawk.to/jsapi/
- Chat Rescuer: https://help.tawk.to/article/setting-up-a-basic-chat-rescue-trigger
- Offline Form: https://help.tawk.to/article/using-the-offline-form
- Widget product updates: https://www.tawk.to/updates/

Dashboard 메뉴와 위젯 동작은 Tawk 업데이트로 달라질 수 있으므로, 저장 전 Preview와 실기기 테스트를 우선합니다.
