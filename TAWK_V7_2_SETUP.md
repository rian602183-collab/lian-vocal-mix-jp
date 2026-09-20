# Tawk V7.2 관리자 설정 — 등록 장벽과 재방문 혼동 줄이기

공식 문서 확인일: 2026-09-12. 대상 Property `6aa0d3bc08f5a2345548dc9d`, Widget `1k223m625`를 유지합니다. 이 작업에서는 Tawk 관리자 계정에 로그인하거나 설정을 변경하지 않았습니다. 아래는 관리자가 적용하고 실제 위젯에서 확인할 절차입니다. 설정 저장은 기존 공개 사이트에도 반영될 수 있습니다.

## 1. 먼저 Pre-Chat을 끄기

일본 사이트 Property를 선택한 뒤 다음 경로로 들어갑니다.

**Administration → Chat Widget → Widget Content → Edit Content → Widget State: Pre-Chat → Enable Pre-Chat OFF**

Save/Update로 저장합니다. 필드를 단순히 선택 사항으로 바꾸는 대신 사전 양식 자체를 끄는 것이 기본값입니다. 채팅을 시작하기 전에 활동명, 이메일, X ID를 요구하지 않습니다. `Exclude from AI`는 사전 양식을 유지하면서 AI의 첫 반응만 막는 설정이므로 이번 OFF 설정을 대신하지 않습니다. [Pre-Chat 공식 절차](https://help.tawk.to/article/using-the-pre-chat-form), [Exclude from AI의 범위](https://help.tawk.to/article/excluding-pre-chat-form-submissions-from-your-ai-agents-responses)

필요한 정보는 상담이 시작된 뒤 Lian이 자연스럽게 묻습니다.

> 差し支えなければ、活動名やX IDを教えていただけますか？

사이트의 작은 안내 `登録不要・そのままご相談いただけます`는 **방문자에게 외부 서비스 회원가입을 요구하지 않는다는 의미**입니다. Lian이 운영을 위해 사용하는 관리자 계정 가입·로그인과 구분합니다. 실제 위젯에 외부 번역 서비스 가입 링크나 안내 카드가 남아 있다면 제거하세요. 고객에게 번역 도구를 설치하거나 가입하라고 안내하지 않습니다.

## 2. Offline Form은 다른 기능입니다

Pre-Chat OFF만으로 모든 상태의 입력란이 없어지는 것은 아닙니다. 현행 공식 문서는 **Offline Form의 Name와 Email이 필수이며 제거할 수 없다**고 설명합니다. 따라서 오프라인에서도 이름·이메일 없이 메시지를 남길 수 있다고 안내하지 않습니다. [Offline Form의 제한](https://help.tawk.to/article/using-the-offline-form)

`Widget Content → Edit Content → Widget State: Offline`의 Text Area에 다음처럼 짧게 설명할 수 있습니다.

> 会員登録ではありません。返信先として、お名前とメールアドレスをご入力ください。

추가 X ID 등은 오프라인 필수 항목으로 만들지 않습니다. 과도한 필수 입력을 추가하지 않고 기존 문의 폼과 X를 다른 상담 경로로 유지합니다. 비접속 상태를 Online으로 위장해서는 안 됩니다. 전 상태에서 개인정보 입력 없는 비동기 상담이 필요하다면 별도 기능 검토 대상이며, 이번 설정만으로 완성됐다고 판단하지 않습니다.

## 3. 기존 Lian 외관 유지

`Administration → Chat Widget → Widget Appearance → Advanced`에서 확인합니다.

| 항목 | 권장값 |
|---|---|
| Desktop shape | Circular |
| Mobile shape | 원형 아이콘 |
| Desktop / Mobile position | Bottom Right |
| Attention Grabber | OFF |
| 기본 브랜드 색 | 기존 블루 유지; 작은 흰 글자는 충분히 어두운 블루 사용 |

원형 버튼 자체를 제거하는 옵션과 Attention Grabber OFF를 혼동하지 않습니다. 외관 설정은 실제 미리보기에서 PC/모바일 각각 확인합니다. [공식 외관 설정](https://help.tawk.to/article/changing-the-appearance-of-the-chat-widget)

`Administration → Chat Widget → Widget Behavior`에서 확인합니다.

| 항목 | 권장값 |
|---|---|
| Disable message preview on desktop | ON |
| Disable message preview on mobile | ON |
| Hide widget on load in desktop | OFF |
| Hide widget on load in mobile | OFF |
| Click behavior | Maximize |

Disable 옵션은 ON으로 해야 미리보기 풍선이 꺼집니다. Maximize는 현재 탭에서 채팅을 엽니다. 접속 상태·기존 문의 알림 전달은 유지합니다. [공식 동작 설정](https://help.tawk.to/article/change-how-the-widget-behaves-on-your-site)

`Administration → Settings → Triggers`에서 Welcome message, Basic - Site Notification, Basic - Page Notification 및 방문/체류시간만으로 실행되는 Advanced 규칙을 끕니다. 비활성화가 제공되지 않는 관리 화면에서는 내용을 기록한 뒤 해당 규칙을 제거합니다. 고객이 말하지 않았는데 외부 도구 가입을 권하는 메시지·링크도 확인합니다. 채팅을 열어야만 보이는 정적인 환영 Text Area는 유지할 수 있습니다. [트리거 종류와 관리 경로](https://help.tawk.to/article/creating-and-managing-triggers)

## 4. 일본어 문구와 상담원 이름

`Administration → Chat Widget → Widget Content → Language`는 `Japanese / 日本語`를 선택합니다. `Edit Content`에서 Online, Away, Offline을 각각 확인합니다. 언어 설정은 기본 라벨을 바꾸지만 직접 저장한 영어 카드 문장이나 외부 Knowledge Base를 자동 번역하지는 않습니다. [공식 위젯 언어 설정](https://help.tawk.to/article/changing-your-widget-language)

| 카드/위치 | 문구 |
|---|---|
| Heading | `Lian` |
| 상담 제목 | `MIX ご相談窓口` |
| Text Area 환영 | `ご相談ありがとうございます。MIXについてお気軽にメッセージください。` |
| 응답 안내 | `確認後、順番に返信いたします。` |
| Chat 카드 New Conversation | `新しい相談を始める` |
| Chat 카드 Recent Conversations | `過去の会話` |
| Chat 카드 입력 영역 CTA | `メッセージを入力してください…` |

Chat 카드는 새 대화·최근 대화 제목과 입력 영역 CTA를 편집할 수 있습니다. 이 설정이 실제 대화 composer의 모든 placeholder를 바꾸는 기능이라고 단정하지 않습니다. 편집란이 없는 고정 라벨은 Japanese 기본 번역을 유지합니다. `Need Help?`, `Customer Support`, `Chat with us`가 직접 입력된 Header/Text Area/Chat 카드에 남아 있지 않은지 확인합니다. [카드별 편집 범위](https://help.tawk.to/article/customizing-the-widget-header-and-body-cards)

프로필 이미지 → `Edit Profile → Aliases → Add Alias`에서 Display Name `Lian`, Position Title `MIX ご相談窓口`, Enabled 및 기본 alias를 확인합니다. 실제 상담 참여 시 Lian alias를 선택합니다. 위젯 Header Agent 카드의 실제 계정 정보는 별도로 확인해야 합니다. [공식 Alias 설정](https://help.tawk.to/article/creating-and-managing-aliases)

## 5. 종료 후 다시 오는 고객

사이트에 한 줄 안내가 필요하다면 다음 정도를 사용합니다.

> 続きのご相談は「過去の会話」から。終了後のメッセージは、新しい会話として届く場合があります。

공식 안내상 종료된 채팅에 나중에 후속 메시지가 오면 새 conversation으로 나타날 수 있으며, 설정에 따라 AI Assist가 다시 참여할 수 있습니다. 과거 대화가 항상 하나의 계속된 실시간 세션이 된다거나 별도 기기에서도 자동 복구된다고 약속하지 않습니다. [종료 후 후속 메시지의 공식 동작](https://help.tawk.to/article/how-to-answer-an-incoming-chat)

## 6. 모바일 launcher와 견적 폼

V7.2 코드에서는 폭 700px 이하에서 열린 견적 폼이 화면에 보이는 동안 최소화 launcher만 일시 숨깁니다. 폼 제목 옆 `チャットで相談`으로 다시 열 수 있고, 폼을 닫거나 벗어나면 launcher를 복구합니다. 이미 최대화한 채팅창은 숨기지 않습니다. 아래 공식 API만 사용해 구현했으며 실제 위젯의 운영 검증은 필요합니다.

공식 JS API는 `hideWidget()`, `showWidget()`, `maximize()`, `isChatMaximized()` 및 `onLoad`, `onChatMinimized`, `onChatMaximized`를 제공합니다. 폼과 겹치는 최소화 버튼을 필요한 동안만 숨기고, 사용자가 사이트의 채팅 CTA를 누르면 다시 표시해 여는 방식에 사용할 수 있습니다. iframe 내부 DOM/CSS 수정이나 Dashboard 변조는 필요하지 않습니다. 자동으로 대화를 종료하는 `endChat()`나 연결을 끊는 `shutdown()`을 겹침 해소 수단으로 쓰지 않습니다. [공식 JavaScript API](https://developer.tawk.to/jsapi/)

정밀한 배치는 공식 도움말의 `customStyle` desktop/mobile offset으로 조정할 수 있습니다. 이는 embed보다 먼저 지정해야 하며 관리자 위치보다 우선합니다. Developer Portal 요약은 zIndex만 기재하므로 offset 구현 시에는 도움말의 현재 예제를 함께 확인해야 합니다. 큰 bottom offset 하나로 모든 폼 겹침이 해결된다고 가정하지 않습니다. [공식 배치 API 도움말](https://help.tawk.to/article/customizing-your-widget-placement-with-the-javascript-api)

## 7. 관리자가 실제로 확인할 항목

- 새 시크릿 창에서 원형 버튼과 `チャットで相談` 양쪽으로 열어 봅니다. 외부 서비스 가입/로그인 요구가 없어야 합니다.
- Online/Away에서 Pre-Chat 없이 메시지를 입력할 수 있는지, Offline에서 회원가입과 회신 정보 입력이 구분되는지 확인합니다.
- 아무 동작 없이 기다릴 때 자동 greeting·영어 풍선·message preview가 나타나지 않아야 합니다.
- 대화를 종료한 뒤 재방문해 `新しい相談を始める`와 `過去の会話`가 구분되는지 확인합니다.
- 360×800, 390×844, 768×1024, 1280×720, 1440×900에서 날짜/입력칸/전송 버튼과 launcher를 확인합니다. 모바일 실기기의 키보드·하단 safe area도 포함합니다.
- 채팅창을 실제로 열어 둔 동안 사이트 동작이 이를 강제로 숨기거나 종료하지 않는지 확인합니다.
- 로드 실패 시 문의 대안 안내, 뒤늦게 로드 성공 시 안내가 사라지는 기존 fallback을 확인합니다.

이 문서의 경로·지원 범위 조사는 완료했습니다. 실제 Tawk 설정 적용, 실고객 메시지 송수신, 계정의 현재 플랜/AI 동작 및 실기기 위젯 확인은 운영자 확인 항목입니다. 번역 보조는 `TAWK_TRANSLATION_SETUP.md`를 따릅니다.
