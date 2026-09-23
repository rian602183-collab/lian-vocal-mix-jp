# Tawk 채팅을 Lian 스타일로 설정하기

공식 문서 확인일: 2026-09-11

대상은 일본 사이트의 기존 위젯입니다. Property ID `6aa0d3bc08f5a2345548dc9d`, Widget ID `1k223m625`를 유지합니다. 새 위젯을 만들거나 설치 코드를 교체하지 않습니다.

이 문서는 관리자가 직접 적용할 설정 안내입니다. 이번 파일 제작에서는 Tawk 계정에 로그인하거나 설정을 저장하지 않았습니다. Tawk 관리자에서 저장한 변경은 현재 공개 사이트에도 즉시 반영되므로, 아래 값을 확인한 뒤 적용하세요.

## 1. 첫 화면에는 원형 버튼만 표시

PC에서 Tawk 관리자에 로그인하고 일본 사이트에 연결된 Property를 선택합니다.

`Administration → Chat Widget → Widget Appearance → Advanced`에서 다음을 설정합니다.

| 항목 | Lian 권장값 |
|---|---|
| Desktop Shape | Circular |
| Mobile widget type | 원형 아이콘 형태 |
| Desktop / Mobile Widget Position | Bottom Right |
| Attention Grabber | OFF |

Attention Grabber는 최소화된 위젯 옆에 표시되는 장식 이미지입니다. 공식 문서상 데스크톱용이며, 모바일의 메시지 풍선과는 다른 기능입니다. 위젯을 숨기는 옵션 대신 원형 모양을 선택하고 Attention Grabber만 끕니다. [공식 외관 설정](https://help.tawk.to/article/changing-the-appearance-of-the-chat-widget), [Attention Grabber 설명](https://help.tawk.to/article/enabling-the-attention-grabber)

이어서 `Administration → Chat Widget → Widget Behavior`에서 다음을 설정합니다.

| 항목 | Lian 권장값 |
|---|---|
| Disable message preview on desktop | ON |
| Disable message preview on mobile | ON |
| Hide widget on load in desktop | OFF |
| Hide widget on load in mobile | OFF |
| Click behavior | Maximize |

이름에 Disable이 있으므로 **ON으로 해야 미리보기 풍선이 꺼집니다.** Hide widget on load를 켜면 원형 버튼 자체도 사라지므로 이번 목표와 맞지 않습니다. 클릭했을 때만 같은 페이지 안에서 채팅창을 여는 Maximize가 적합합니다. 온라인·오프라인 동작과 기존 알림 전달 설정은 유지하세요. [공식 동작 설정](https://help.tawk.to/article/change-how-the-widget-behaves-on-your-site)

## 2. 자동 영어 인사 끄기

`Administration → Settings → Triggers`에서 `Welcome message`, `Basic - Site Notification`, `Basic - Page Notification`과 페이지 방문·체류시간 조건을 사용하는 Advanced trigger를 확인합니다. 방문만으로 인사를 보내는 규칙은 비활성화합니다. 단순히 영어를 일본어로 바꾸는 것만으로는 화면을 덮는 자동 풍선이 해결되지 않습니다.

기존 규칙을 삭제하기 전에 메시지와 조건을 기록하고 비활성화 옵션을 우선 사용하세요. 관리자 화면에서 비활성화 항목을 찾을 수 없다면 해당 규칙의 조건과 메시지를 보관한 뒤 공식 안내의 선택 → Delete 방식으로 제거할 수 있습니다. 이번 사이트 코드에는 트리거를 새로 만들거나 자동 최대화하는 로직을 추가하지 않습니다. [트리거 종류·관리](https://help.tawk.to/article/creating-and-managing-triggers), [Welcome message 비활성화 안내](https://help.tawk.to/article/trigger-%E2%80%94-send-a-message-when-the-visitor-maximizes-the-widget)

사이트에 들어온 순간의 인사와 채팅창 안의 환영 문구는 별개입니다. 아래 환영 문구는 우선 **위젯을 열었을 때 보이는 Text Area 카드**에 넣으세요. Suggested Messages가 필요하다면 방문자가 직접 채팅창을 연 뒤 실행되는 `Basic - Widget Maximized` 규칙에서만 사용하세요. 사이트 방문 규칙을 다시 켜지 않습니다. Suggested Messages는 공식 안내상 트리거당 최대 4개이며, 아래 제안은 3개입니다. [위젯을 열 때만 실행하는 트리거](https://help.tawk.to/article/trigger-%E2%80%94-send-a-message-when-the-visitor-maximizes-the-widget), [트리거와 Suggested Messages](https://help.tawk.to/article/creating-and-managing-triggers)

## 3. 일본어와 Lian 문구

`Administration → Chat Widget → Widget Content`에서 `Language`를 `Japanese / 日本語`로 선택합니다. `Edit Content`에서 Online, Away, Offline 상태를 각각 확인하세요. 언어 선택은 기본 메뉴·버튼·양식·라벨에 적용되지만, 직접 작성한 영어 문장은 별도로 편집해야 합니다. [공식 언어 설정](https://help.tawk.to/article/changing-your-widget-language)

| 표시 위치 | 입력할 문구 | 설정 방법·범위 |
|---|---|---|
| 제목 | `Lian` | Header의 Heading 카드 Content |
| 상담 안내 | `MIX ご相談窓口` | Heading 또는 짧은 Text Area 카드 |
| Welcome | `ご相談ありがとうございます！MIXについてお気軽にメッセージください。` | Text Area 카드의 환영 문구 |
| Description | `確認後、順番に返信いたします。` | Text Area 카드 또는 해당 Chat 카드 설명 입력란이 있을 때 사용 |
| New Conversation | `新しい相談を始める` | Chat 카드의 새 대화 제목·동작 문구 입력란 |
| Recent Conversations | `過去の会話` | Chat 카드의 최근 대화 제목 입력란 |
| 입력 영역 CTA | `メッセージを入力してください…` | Chat 카드에서 제공하는 input-area CTA 입력란 |

카드의 연필 아이콘으로 편집한 뒤 Update/Save를 누릅니다. Heading과 Text Area는 편집 가능하며, Chat 카드는 새 대화·최근 대화 제목과 입력 영역 CTA를 지원합니다. 이 CTA와 **대화 중 실제 메시지 입력창의 placeholder는 동일한 설정이라고 단정할 수 없습니다.** 실제 composer placeholder의 별도 편집란이 없다면 Japanese 기본 번역을 유지합니다. 모든 고정 라벨을 위 문구와 완전히 똑같이 바꿀 수 있다고 보장하지 않습니다. [카드별 편집 범위](https://help.tawk.to/article/customizing-the-widget-header-and-body-cards)

`Customer Support`, `Chat with us`, `Need Help?`가 Header/Chat/Text Area 카드에 직접 저장되어 있다면 위 문구로 변경하거나 불필요한 카드를 끕니다. iframe DOM을 수정하거나 가짜 채팅창을 덧씌우지 않습니다. [카드 편집·표시 제어](https://help.tawk.to/article/how-to-modify-your-widget-content)

Suggested Messages에 사용할 문구:

- `MIXについて相談したいです`
- `料金・納期を確認したいです`
- `この録音でも依頼できますか？`

## 4. 상담원 이름과 직함

왼쪽 아래 프로필 이미지 → `Edit Profile → Aliases → Add Alias`에서 다음을 입력합니다.

| 필드 | 값 |
|---|---|
| Display Name | `Lian` |
| Position Title | `MIX ご相談窓口` |
| Status | Enabled |
| Set as default alias | Yes |

실제로 채팅에 참여할 때 alias가 Lian인지 확인합니다. 트리거의 `Agent Name`은 별도 값이므로 사용할 트리거에도 `Lian`을 입력하세요. Alias는 상담 참여 시 표시되는 이름과 직함을 바꾸는 기능이며 실제 계정 프로필을 일괄 변경하지 않습니다. [공식 Alias 설정](https://help.tawk.to/article/creating-and-managing-aliases)

위젯 Header의 Agent 카드는 실제 계정 프로필을 사용하며 alias 이미지를 쓸 수 없습니다. 이 카드에 개인 계정 정보가 보여 브랜드가 어긋난다면 Heading/Text Area로 Lian을 표시하는 구성을 쓰거나 실제 프로필을 관리자가 확인하세요. [Agent 카드 제한](https://help.tawk.to/article/customizing-the-widget-header-and-body-cards)

## 5. 색상과 모바일 위치

`Widget Appearance → Advanced`에서 블루 계열을 유지합니다. 원형 버튼과 헤더의 출발 색은 `#5B87D9`입니다. Agent/Visitor Message와 Text 색을 따로 조절해 밝은 배경·네이비 글자가 읽히도록 합니다. 공식 편집기는 Header, Header Text, Agent Message/Text, Visitor Message/Text를 구분합니다. [공식 색상 설정](https://help.tawk.to/article/changing-the-appearance-of-the-chat-widget)

`#5B87D9` 위의 흰색 일반 글자는 계산상 대비가 약 3.55:1이므로 작은 본문용 조합으로 쓰지 않습니다. 헤더 글자에 진한 네이비를 사용하거나, 흰 글자가 고정된 부분만 블루를 조금 어둡게 조정해 미리보기에서 확인하세요. V7.1 사이트 상담 버튼과 같은 `#426BB4`와 흰색은 약 5.26:1입니다. 이 수치는 색상값의 WCAG 상대휘도 공식으로 계산한 값이며, 실제 위젯 전체의 접근성 인증을 뜻하지 않습니다.

Desktop/Mobile Position은 각각 Bottom Right를 선택하고 390×844, 360×800에서 확인합니다. 견적 요약·문의 버튼·Footer·브라우저 하단 safe area와 겹치면 우선 사이트의 여백과 관리자 Mobile 위치 옵션을 조정합니다. 관리자 기본 위치는 여섯 가지이며 임의의 safe-area 수치 입력 기능은 공식 문서에서 확인되지 않았습니다. [공식 위치 설정](https://help.tawk.to/article/changing-the-widget-position)

정밀한 offset은 공식 도움말의 `customStyle` API가 안내하는 별도 개발 설정입니다. 도움말은 desktop/mobile offset을 설명하지만 현재 Developer Portal의 요약은 zIndex만 기재해 문서 간 범위 차이가 있습니다. 따라서 검증되지 않은 offset 예제를 붙여 넣지 않습니다. 필요할 때 해당 공식 도움말의 실제 예제를 확인하고 embed 로딩 전에 적용한 뒤 기기별로 검증해야 합니다. iframe 내부 CSS 수정은 필요하지 않습니다. [공식 위치 API 도움말](https://help.tawk.to/article/customizing-your-widget-placement-with-the-javascript-api), [Developer Portal](https://developer.tawk.to/jsapi/#customStyle)

## 6. 설정 후 확인

- 새 시크릿 창으로 사이트를 열고 아무 동작 없이 30초 이상 기다립니다. 원형 버튼 외의 인사·미리보기 풍선이 없어야 합니다.
- 1280×720, 1440×900, 768×1024, 390×844, 360×800에서 대표 재생 버튼·가격·문의 버튼이 가려지지 않는지 확인합니다.
- 원형 버튼과 사이트의 `チャットで相談`을 각각 눌렀을 때 기존 채팅창이 열리는지 확인합니다.
- Online/Away/Offline 상태에서 일본어 제목·설명·기본 라벨과 Lian alias를 확인합니다. 즉시 답변을 약속하는 문구는 사용하지 않습니다.
- 새 대화와 기존 대화 화면을 구분해서 확인합니다. 이미 생성된 과거 대화의 메시지를 문구 변경만으로 삭제하거나 번역하는 것은 아닙니다.

## 7. 사이트 코드 점검 결과와 남은 관리자 작업

기준 V7.0.1의 `index.html`, `jp.js`, `jp.css`를 확인했습니다. `Need Help?`, `Chat with us`, `Customer Support`와 영어 자동 인사를 만드는 사이트 코드는 없었습니다. 기존 위젯 주소는 정확히 `https://embed.tawk.to/6aa0d3bc08f5a2345548dc9d/1k223m625`이며, `Tawk_API.maximize()`는 사이트 상담 버튼의 클릭 처리에서만 호출합니다. 자동 로딩 시 열도록 하는 코드나 iframe 내부 스타일 변경 코드는 없습니다.

따라서 원형 버튼 위의 영어 이미지·인사·미리보기와 내부 영어 제목은 Tawk 관리자 설정 확인이 필요합니다. 실제 계정의 현재 설정은 열람하지 않았으므로 특정 규칙이 켜져 있다고 확정하지 않습니다. 위 설정을 저장하기 전에는 ZIP 교체만으로 launcher-only 상태가 완성됐다고 판단하면 안 됩니다.

V7.0.1의 로딩 실패 fallback과 늦게 준비됐을 때 fallback을 숨기는 상태 확인 로직은 유지 대상입니다. 이 안내문은 위젯을 읽어 오지 못했을 때 보여주는 사이트 내 문의 대안이며, 정상 로딩된 Tawk의 인사 풍선과는 별개입니다.
