# Tawk V7.2.1 관리자 설정 — 모바일 상담과 선택형 첫 메시지

공식 문서 확인일: **2026-09-12**, 최종 코드 대조: **2026-09-13**. 기존 Property `6aa0d3bc08f5a2345548dc9d` / Widget `1k223m625`를 유지합니다. Codex는 이번 작업에서 Tawk 관리자에 로그인하거나 설정을 변경하지 않았습니다. 아래 설정은 운영자가 적용한 뒤 실제 위젯에서 확인할 절차이며, Dashboard에서 저장하면 현재 공개 사이트에도 바로 반영될 수 있습니다.

## 1. 모바일 버튼은 작은 원형 타입, Bottom Right

1. Dashboard에서 위 Property를 선택합니다.
2. **Administration → Chat Widget → Widget Appearance → Advanced**를 엽니다.
3. **Mobile Widget** 영역에서 긴 사각형 `Chat` 버튼 대신 **원형 말풍선 아이콘이 그려진 왼쪽 타입**을 선택합니다. 공식 화면에는 이 선택지의 별도 상품명이 표시되지 않습니다.
4. **Mobile Widget Position**의 6개 위치 중 **Bottom Right**를 선택합니다. 3×3 그림에서 오른쪽 아래 칸이 표시된 선택지입니다.
5. 브랜드 색은 기존 블루를 유지하고 **Attention Grabber는 OFF**로 둡니다. 모바일 미리보기를 확인한 다음 Save 합니다. [공식 외관 설정](https://help.tawk.to/article/changing-the-appearance-of-the-chat-widget), [공식 모바일 설정 화면](https://tawk.link/521727297ca1334016000005/kb/attachments/PuLwoP9RPe.png)

공식 모바일 화면에서 확인된 조정 항목은 **타입과 위치**입니다. 독립적인 모바일 launcher 폭·높이(px) 입력은 확인되지 않았으므로 `Mobile size = 48px` 같은 메뉴나 값을 안내하지 않습니다. Desktop의 Width/Height는 최대화된 창 치수이며, 이것을 모바일 버튼 크기 조정으로 해석하지 않습니다. UI에 실제 추가 옵션이 있다면 먼저 Preview로 범위를 확인합니다.

위치는 Top Left/Right, Center Left/Right, Bottom Left/Right의 6개를 제공하며, 기본은 Bottom Right입니다. 코드로 위치를 지정하면 Dashboard 위치보다 우선할 수 있으므로 두 곳을 동시에 다르게 지정하지 않습니다. [공식 위치 설정](https://help.tawk.to/article/changing-the-widget-position)

## 2. 자동 팝업과 등록 장벽은 계속 끕니다

| 관리 경로/항목 | 유지할 값 |
|---|---|
| Chat Widget → Widget Content → Edit Content → Widget State: Pre-Chat → Enable Pre-Chat | OFF |
| Widget Appearance → Attention Grabber | OFF |
| Chat Widget → Widget Behavior → Disable message preview on desktop | ON |
| Chat Widget → Widget Behavior → Disable message preview on mobile | ON |
| Widget Behavior → Hide widget on load in desktop/mobile | OFF |
| Widget Behavior → Click behavior | Maximize |
| Settings → Triggers → Welcome / Basic - Site Notification / 방문·체류만으로 실행되는 알림 | OFF |

`Disable …` 스위치는 ON이어야 미리보기가 꺼집니다. Maximize는 현재 탭에서 열기입니다. 사이트 방문만으로 위젯을 확대하는 코드나 `onChatMessageSystem → maximize()` 자동 실행 예제는 사용하지 않습니다. 기존 방문자 알림·오프라인 처리 정책을 임의로 변경하지 않습니다. [공식 동작 설정](https://help.tawk.to/article/change-how-the-widget-behaves-on-your-site)

Pre-Chat의 필수 표시만 제거하는 대신 양식 자체를 OFF로 둡니다. [공식 Pre-Chat 설정](https://help.tawk.to/article/using-the-pre-chat-form)

`登録不要`는 고객의 회원가입이 필요 없다는 의미입니다. **Offline Form은 별개이며 Name/Email이 필수이고 제거할 수 없다는 공식 제한**이 있습니다. 오프라인에서도 모든 연락처 입력을 건너뛸 수 있다고 안내하지 않습니다. 필요하면 Offline Text Area에 `会員登録ではありません。返信先として、お名前とメールアドレスをご入力ください。`를 넣습니다. [공식 Offline Form 제한](https://help.tawk.to/article/using-the-offline-form)

## 3. 고객이 채팅을 열 때만 첫 안내 보내기

1. **Administration → Settings → Triggers → Add Trigger**를 엽니다.
2. **Trigger Type: Basic - Widget Maximized**를 선택합니다. 저장 후에는 타입을 변경할 수 없으므로 기존 Site Notification을 이름만 바꾸어 사용하지 않습니다.
3. 내부 관리용 이름은 `Lian JP — Widget Open`처럼 알아보기 쉽게 지정합니다.
4. Delay는 즉시 안내하려면 0초로 설정합니다. 실제 화면에서 허용되는 값/미리보기를 확인합니다. 필요 없는 페이지 URL 제한은 추가하지 않습니다.
5. **Agent’s Name**을 `Lian`으로 입력합니다. 이 필드는 아래 상담원 Alias와 별도이며, 자동 안내의 발신자 이름에 해당합니다.
6. **Trigger Message**에 아래 사용자 지정 문구를 입력합니다.

```text
ご相談ありがとうございます！
料金・納期の確認だけでも大丈夫です。
MIXについてお気軽にご相談ください。
```

7. 아래 Suggested Messages 3개를 추가하고 Save 합니다. [공식 Widget Maximized 설정](https://help.tawk.to/article/trigger-%E2%80%94-send-a-message-when-the-visitor-maximizes-the-widget)

이 트리거의 기준은 **위젯의 최대화 이벤트**입니다. 클릭이 진짜 사용자 입력인지 별도로 증명하는 보안 기능은 아닙니다. 따라서 사이트/다른 트리거의 자동 최대화를 끈 상태에서 고객이 launcher 또는 사이트의 `チャットで相談`을 누르는 흐름과 결합합니다. 페이지 방문·타이머·다른 시스템 알림만으로 최대화하지 않아야 요청한 동작이 됩니다. 이전 대화 복구 시 동작과 다시 열었을 때 반복 발송 여부는 실제 계정에서 확인합니다.

Welcome/Site Notification이 살아 있으면 고객이 열었을 때 이전 환영 메시지가 먼저 나타날 수 있으므로 해당 규칙을 함께 끕니다. 여러 트리거를 같은 이벤트에 중복으로 만들지 않습니다.

## 4. Suggested Messages는 정확히 3개

위 Basic 트리거 편집 화면 아래 **Suggested message → Add Message**에서 다음을 하나씩 입력합니다.

1. `料金・納期を確認したい`
2. `録音データについて相談したい`
3. `プラン・MIX内容について相談したい`

공식 제한은 트리거당 최대 4개이며, 이번 구성은 3개입니다. Preview에서 360/390px 폭에 가까운 모바일 표시를 확인하고 Save 합니다. Advanced 트리거를 이미 사용해야 하는 경우에는 Actions의 **Send a message to visitor → Suggested message → Add Message** 경로를 사용하되 같은 내용의 Basic 규칙과 중복 실행하지 않습니다. [공식 Suggested Messages 설정](https://help.tawk.to/article/intro-to-suggested-messages)

버튼을 누르면 해당 문장이 방문자가 보낸 채팅 메시지로 전달됩니다. 이 선택지를 제공하는 데 AI 자동 응답 흐름을 새로 만들 필요는 없습니다. AI Assist를 이미 쓰는 계정이라면 선택 문장에 AI가 자동 응답하는지는 별도 계정 설정에 따르므로 실제로 확인합니다. 번역 보조의 검토 후 전송 원칙은 기존 `TAWK_TRANSLATION_SETUP.md`를 유지합니다. [공식 버튼 동작 설명](https://help.tawk.to/article/using-suggested-message-and-ai-assist-to-create-scripted-chat-sequences)

## 5. 일본어와 Lian 이름 정리

**Administration → Chat Widget → Widget Content → Language**에서 Japanese / 日本語를 확인합니다. Edit Content의 Online/Away/Offline 각각에서 직접 입력한 영어 문구도 확인합니다. 기본 언어 변경만으로 저장된 사용자 지정 영어 문장이 자동 번역되지는 않습니다. [공식 언어 설정](https://help.tawk.to/article/changing-your-widget-language)

| 위치 | 문구 |
|---|---|
| 브랜드/상담원 표시 | `Lian` |
| 상담 제목 | `MIX ご相談窓口` |
| 새 대화 | `新しい相談を始める` |
| 최근 대화 | `過去の会話` |

`Need Help?`, `Customer Support`, `Chat with us`가 편집 가능한 Header/Text Area/Chat 카드 또는 Trigger Agent’s Name에 남아 있다면 해당 입력란에서 교체합니다. Tawk가 고정한 시스템 라벨은 iframe DOM/CSS 또는 스크립트로 바꾸지 않습니다.

실제 상담 참여 이름은 **Dashboard 왼쪽 아래 프로필 이미지 → Edit Profile → Aliases → 기존 Lian 선택 또는 Add Alias**에서 설정합니다. Display Name `Lian`, Position Title `MIX ご相談窓口`, Status `Enabled`, Set as default alias `Yes`를 확인하고 저장합니다. 대화에 Join 하기 전 하단 Alias 선택에서도 Lian인지 확인합니다. Trigger Agent’s Name은 별도로 설정해야 합니다. [공식 Alias 절차](https://help.tawk.to/article/creating-and-managing-aliases)

## 6. 공식 API 범위와 customStyle 문서 차이

| 항목 | 확인 결과 / 적용 원칙 |
|---|---|
| `hideWidget()`, `showWidget()` | 공개 API에 명시. 필요한 동안 최소화 버튼을 숨겼다가 복구하는 데 사용 가능 |
| `maximize()`, `isChatMaximized()`, `isChatHidden()` | 공개 API에 명시. 사용자가 연 채팅을 유지하고 표시 상태를 확인할 수 있음 |
| `onLoad`, `onChatMinimized`, `onChatMaximized` | 공개 콜백. 기존 V7.2 콜백을 덮어 지우지 않고 보존해야 함 |
| 런타임 mobile width/height 변경 함수 | 확인되지 않음. 임의 API를 만들지 않음 |
| `customStyle` | Developer Portal은 현재 `zIndex`만 지원한다고 설명. Help Center에는 그보다 넓은 배치 예제가 있음 |

[공식 JavaScript API](https://developer.tawk.to/jsapi/)

Help Center의 **렌더링된 code 블록**에서 다음 중첩 구조를 직접 확인했습니다. 검색 결과의 본문 추출에는 코드가 빠져 있었으므로 브라우저의 원문 code 요소까지 확인했습니다.

```js
Tawk_API.customStyle = { visibility: { mobile: { position: 'br', xOffset: 0, yOffset: 0 } } };
```

같은 visibility 아래 desktop에도 position/xOffset/yOffset을 둘 수 있고 bubble에는 xOffset/yOffset/rotate가 문서화되어 있습니다. position은 br/bl/cr/cl/tr/tl, offset은 문자열 또는 정수입니다. 이 예제는 **문서의 구조를 설명하는 예시이며 사이트에 추가했다고 뜻하지 않습니다.** [공식 placement 예제](https://help.tawk.to/article/customizing-your-widget-placement-with-the-javascript-api)

두 공식 문서의 지원 범위 설명이 일치하지 않습니다. 또한 customStyle은 embed 다운로드 전에 정해야 하며 다운로드 후 변경하는 실시간 배치 API가 아닙니다. 따라서 V7.2.1은 임의의 offset 속성이나 `env(safe-area-inset-bottom)` 문자열을 Tawk에 넘겨 해결됐다고 가정하지 않습니다. 단순 right/bottom offset 몇 px는 대표 음원과의 겹침을 없앤다는 보장도 없습니다.

## 7. V7.2.1 코드에 실제로 추가한 처리

`jp-v721.js`와 `jp-v721.css`를 마지막에 추가해 기존 V7.2의 **모바일에서 열린 견적 폼이 보일 때 launcher를 숨기는 기능**과 폼의 `チャットで相談` 버튼을 보존합니다. 기존 안정판 `jp-v72.js`는 그대로 둡니다.

폭 **700px 이하**에서 대표 음원 카드 `.jp-feature-card` 또는 전송 완료 카드 `.jp-thanks-card`가 보이면 최소화 launcher를 일시 숨깁니다. 작은 모바일용 `チャットで相談` 버튼은 44px 이상의 터치 높이를 가지며 카드의 상담 진입점을 유지합니다. 데스크톱에서는 이 추가 버튼을 표시하지 않고 원래 launcher 동작을 유지합니다. 대표 음원 위치를 옮기거나 사이트 전체에 큰 bottom/right 여백을 넣지 않았습니다.

화면 판단은 사이트 카드의 `getBoundingClientRect()`와 `visualViewport.offsetTop/height`를 사용합니다. VisualViewport가 없는 브라우저는 `innerHeight`로 계산합니다. 카드 하단이 보이는 화면 상단 + 66px보다 아래이고, 카드 상단이 보이는 화면 하단보다 위에 있으면 보호 구간으로 취급합니다. Tawk 버튼의 실제 픽셀과 충돌을 측정하는 방식이 아니라 **카드가 보이는 동안 해당 내용을 보호하는 보수적인 조건**입니다. Tawk iframe 내부 DOM/CSS에는 접근하지 않습니다.

| 상황 | 구현한 동작 |
|---|---|
| 카드 보호 구간 | 공식 `hideWidget()` 사용. `isChatHidden()`이 제공되면 다시 표시된 상태를 확인해 재적용 |
| 카드에서 벗어남 | 이 코드가 숨긴 경우에만 `showWidget()`으로 복구. 열린 모바일 견적 폼이 보이면 복구 보류 |
| 고객이 사이트 채팅 버튼 클릭 | capture 단계에서 `showWidget()`을 호출하고 사용자 요청 상태를 기록. 메인 페이지는 기존 채팅 열기 핸들러를 그대로 사용 |
| 이미 최대화한 채팅 / 방금 요청한 채팅 | 숨김 조건을 적용하지 않음. 스크롤로 강제 종료하지 않음 |
| 고객이 채팅 최소화 | 기존 `onChatMinimized`를 먼저 호출하고 사용자 요청 상태를 해제한 뒤 카드/폼 위치 재검사 |
| 화면 변화 | window scroll/resize, VisualViewport scroll/resize, 폼 hidden 변경을 감지. requestAnimationFrame으로 묶어 처리 |
| 늦은 Tawk 로드 | 기존 `onLoad`를 호출한 뒤 표시 상태를 다시 계산. API 준비를 확인하는 1초 타이머는 hideWidget 준비 후 종료 |

카드 숨김과 폼 숨김은 별도의 상태로 관리합니다. 새 코드가 카드에서 벗어났다는 이유로 기존 폼 숨김을 즉시 해제하지 않도록 열린 폼의 화면 위치를 확인합니다. 임의 placement/offset은 추가하지 않았습니다.

`thanks.html`에는 기존 `jp.js`가 없으므로 새 작은 CTA의 클릭을 지원 API `maximize()`로 처리합니다. 아직 API가 준비되지 않았으면 `role="status"`의 일본어 안내를 표시하고 X/메인 문의 폼을 대안으로 제공합니다. 나중에 `onLoad`가 오면 이 안내를 지웁니다. 로딩 완료만으로 채팅을 자동으로 열지는 않습니다. 전송 완료 페이지 하단은 기존 50px 여백과 `env(safe-area-inset-bottom)` 중 큰 값만 사용하며, Tawk iframe 위치를 CSS로 변경하지 않습니다.

메인의 기존 로드 실패/지연 로드 fallback도 onLoad 연결을 보존합니다. 콜백 체인·카드/폼 전환·재열기 검사는 로컬 API mock으로 확인하며, **실제 Tawk iframe 및 Samsung/X 인앱의 주소창·키보드·safe area를 확인한 것으로 간주하지 않습니다.** 세부 결과는 `TEST_RESULTS_V7_2_1.md`를 확인합니다.

## 8. 운영자가 직접 확인할 항목

- [ ] 기존 Property/Widget ID가 맞고 새 Property를 만들지 않았습니다.
- [ ] 모바일은 원형 아이콘과 Bottom Right이며 긴 사각형 Chat 버튼이 아닙니다.
- [ ] Pre-Chat OFF, Attention Grabber OFF, desktop/mobile preview Disable ON입니다.
- [ ] 새 시크릿 방문 후 아무 조작 없이 기다려도 greeting/자동 확대가 나오지 않습니다.
- [ ] launcher 또는 사이트의 채팅 버튼을 직접 눌렀을 때 Lian 첫 안내와 Suggested Messages 3개가 보입니다.
- [ ] 선택 버튼 하나를 누르면 해당 일본어 문장이 방문자 메시지로 전송되며 중복 메시지가 생기지 않습니다.
- [ ] 자동 안내 발신자와 상담원 참여 이름 모두 Lian으로 표시됩니다. 고정 시스템 라벨은 별개입니다.
- [ ] 360×800, 390×844, 390×700에서 Hero/대표 음원과 폼을 스크롤하며 최소화 버튼 겹침과 다시 열기를 확인했습니다.
- [ ] thanks.html에서도 전송 완료 문구와 X/메인 버튼을 launcher가 가리지 않으며, 작은 채팅 버튼의 로드 실패 안내와 지연 로드 복구를 확인했습니다.
- [ ] Samsung Android Chrome 및 X 인앱 브라우저에서 주소창/하단 UI가 펼쳐진 상태, 접힌 상태, 키보드 열린 상태를 확인했습니다.
- [ ] 진행 중인 최대화 채팅이 강제로 닫히지 않고, 기존 대화 복구/다시 열기 때 알림이 과하게 반복되지 않습니다.
- [ ] Online/Away와 Offline의 입력 흐름이 다르다는 안내가 실제 동작과 일치합니다.

문서 조사와 로컬/mock 검사는 실제 Tawk 계정 설정·송수신 성공을 대신하지 않습니다. 이번 작업에서는 외부 계정 변경, 실제 고객 대화 송신, 운영 설정 성공을 주장하지 않습니다. 환경변수 변경은 Tawk 관리자 설정 절차에 필요하지 않습니다.
