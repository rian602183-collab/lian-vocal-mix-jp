# Tawk 한↔일 번역 보조 — 번역 후 확인하고 전송하기

공식 문서 확인일: 2026-09-12. 계정 설정이나 구독을 변경하지 않았고 실제 고객 메시지도 보내지 않았습니다. V7.2는 Tawk를 자동 통역 서비스로 개조하지 않습니다. 고객은 일본어로 메시지를 쓰고, Lian이 뜻과 답변 초안을 확인한 뒤 전송하는 운영 방식을 준비합니다.

## 1. 공식 기능과 구현되지 않은 범위

| 구분 | 확인된 범위 | 한계 |
|---|---|---|
| A. 위젯 Japanese / Dashboard Korean | 방문자 위젯과 관리자 메뉴 언어를 각각 설정 가능 | 메뉴 번역이며 대화 메시지의 자동 번역을 뜻하지 않음 |
| B. AI Assist multilingual support | AI agent가 여러 언어로 고객에게 답변 | 사람 상담원의 입력 내용을 가로채 양방향 통역하는 옵션이 아님 |
| B. Smart Reply | 고객 질문과 데이터 소스로 답변 제안 생성; 편집하고 전송 가능 | 단순 번역 전용 기능이 아니며 원문에 없는 답변을 제안할 수 있음 |
| B. AI Commands | `/ai-task`에 작업 지시를 주어 초안 생성·수정 가능 | 아래 번역 지시는 공식 명령을 활용한 운영 제안이며 한↔일 정확도 보장 없음 |
| C. 고객 일본어를 Dashboard에 자동 한국어 병기 | 현재 조사한 공개 API/설정에서 해당 기능을 확인하지 못함 | 이번 버전에 구현하지 않음 |
| C. 사람 상담원의 한국어를 전송 직전 자동 일본어로 바꿔 보내기 | 공개 API에 상담원 composer의 전송 가로채기·교체 메서드가 없음 | 이번 버전에 구현하지 않음 |

Dashboard 한국어는 프로필 이미지 → 언어 선택 → 한국어로 바꿉니다. 위젯은 `Administration → Chat Widget → Widget Content → Language → Japanese`입니다. 두 언어 설정은 독립적입니다. [Dashboard 언어 범위](https://help.tawk.to/article/how-to-change-the-display-language-for-your-dashboard), [위젯 언어 범위](https://help.tawk.to/article/changing-your-widget-language)

공개 JS API의 메시지 이벤트는 메시지가 전송됐을 때 호출되는 알림입니다. 사람의 답변을 전송 전에 교체하는 API가 아닙니다. Webhooks는 채팅 시작·종료·transcript·ticket 생성 등을 외부에 알리는 기능이며 번역된 상담원 메시지를 Dashboard에 삽입하는 채널이 아닙니다. 이 문서의 불가 판단은 **현재 확인한 공개 API 범위**에 대한 판단이며 비공개 파트너 기능의 존재 여부까지 단정하지 않습니다. [JavaScript API](https://developer.tawk.to/jsapi/), [Webhooks](https://developer.tawk.to/webhooks/)

## 2. AI Assist를 선택적으로 준비하기

1. 관리자가 `Add-ons → AI Assist`에서 사용 여부와 현재 플랜을 확인합니다. 고객에게 AI 도구 가입을 요구하지 않습니다.
2. `Automations → Agents → 해당 AI agent → Settings`에서 `Behaviour → Enable multilingual support`와 `AI Features → Smart Reply / AI Commands`를 확인합니다. 초기 생성 과정에서는 회사 정보·데이터 소스·Instructions를 검토합니다.
3. 공식 문서상 Smart Reply와 AI Commands는 AI agent에 할당한 채널에서 사용합니다. **채널 연결은 자동응답 설정에도 영향을 줄 수 있습니다.** 번역 초안만 쓰려다 고객에게 AI가 자동 답변하기 시작하지 않는지 테스트해야 합니다.

[AI Assist 활성화와 multilingual 설정](https://help.tawk.to/article/getting-started-with-ai-assist)

현재 공개 문서에서 Live Chat 전체에 적용되는 독립적인 ‘자동응답은 전혀 하지 않고 번역 초안만 사용’ 스위치를 확인하지 못했습니다. Ticketing 문서에는 채널을 연결하고 Apollo AI bot을 끄는 절차가 있지만, 이것이 Live Chat에도 동일하게 적용된다고 가정하지 않습니다. 관리자 화면에서 초안 전용 운영을 확인할 수 없다면 기존 실사이트 AI 설정은 유지하고, 별도 테스트/미리보기에서 먼저 검증하거나 Tawk 지원에 확인합니다. [Ticketing의 자동응답 OFF 설명](https://help.tawk.to/article/how-to-set-up-ticketing-in-tawkto)

사람이 이미 참여한 실시간 채팅에서는 Lian이 대화를 맡고 번역/초안만 검토합니다. 공식 안내상 사람이 takeover하면 AI Assist는 대화에서 나가지만, 종료 후 새 conversation에서는 설정에 따라 다시 참여할 수 있습니다. 대화 한 번을 맡았다고 영구적으로 자동응답이 꺼지는 것은 아닙니다. [Takeover와 후속 대화](https://help.tawk.to/article/how-to-answer-an-incoming-chat)

## 3. 가장 단순한 한↔일 작업 흐름

### 일본어 메시지의 뜻 확인

고객 원문:

> 明日の夜までにお願いできますか？

원문은 대화에 그대로 둡니다. AI Commands 메뉴에서 공식 명령 `/ai-task`를 선택하고 다음 작업 지시를 넣습니다. 아래 내용은 Lian용 예시이며 Tawk에 기본 탑재된 번역 명령이 아닙니다. `/ai-translate` 같은 확인되지 않은 명령은 사용하지 않습니다.

```text
아래 일본어 고객 메시지의 뜻을 한국어로 번역해 주세요.
원문을 먼저 그대로 표시하고, 다음 줄에 한국어 의미를 적어 주세요.
질문에 답하지 말고 번역만 해 주세요.
상대 날짜·금액·곡명·조건은 임의로 확정하거나 바꾸지 마세요.
일본어 원문: 明日の夜までにお願いできますか？
```

예상 의미: ‘내일 밤까지 부탁드릴 수 있을까요?’ 이 문장은 납기 가능 여부를 묻는 질문이며 작업을 수락했다는 뜻이 아닙니다. 필요한 경우 실제 날짜와 시간대를 먼저 확인합니다.

AI가 만든 한국어 설명은 Lian만 확인하고 **고객에게 보내지 않습니다**. AI Commands의 초안/결과 상태에서 읽은 뒤 폐기하거나 별도 내부 메모로 남깁니다. 일반 Reply 입력란에서 Enter를 눌러 한국어 설명이나 작업 지시를 고객에게 전송하지 않도록, 처음에는 테스트 채팅으로 동작을 익힙니다.

### 한국어 답변 의도를 일본어 정중체로 만들기

Lian의 의도 예시: ‘먼저 음원과 트랙 수를 확인해야 해요. 확인한 뒤 내일 밤 납품 가능한지 안내할게요.’

```text
다음 한국어 답변 의도만 자연스러운 일본어 정중체로 바꿔 주세요.
고객에게 보낼 일본어 문장만 출력해 주세요.
납기 확정, 할인, 결제 수단, 무료 수정 약속을 새로 추가하지 마세요.
MIX 관련 용어와 숫자·금액·조건은 그대로 유지해 주세요.
답변 의도: 먼저 음원과 트랙 수를 확인해야 해요.
확인한 뒤 내일 밤 납품 가능한지 안내할게요.
```

검토용 일본어 예시:

> まずは音源とトラック数を確認させてください。確認後、明日の夜までに納品できるかご案内いたします。

Lian이 뜻·납기·추가요금·부정 표현을 확인하고, 일본어 답변만 실제 Reply로 전송합니다. 생성 결과가 틀리면 수정하거나 폐기합니다. 필요한 경우 한국어 역번역을 요청한 후 다시 읽습니다. **한국어 작성 → 일본어 초안 → Lian 확인 → 전송**이 기본입니다.

공식 AI Commands는 지시에 따른 초안을 제시하고 수정/폐기/재시도를 지원합니다. 작업지시 기반 번역은 이 범위에서 제안하는 사용법이며 Dashboard에 자동 번역 열이 생기는 것은 아닙니다. [AI Commands와 `/ai-task`](https://help.tawk.to/article/using-ai-base-commands)

### Smart Reply 사용 시

Smart Reply는 고객 질문에 대한 **답변 제안**이 필요할 때 선택합니다. Reply/Whisper 옆 Smart Reply에서 생성 후 검토합니다. 가격·납기·작업 조건이 실제 사이트 및 Lian의 판단과 일치하는지 확인하고, 필요하면 `/ai-task`로 일본어 정중체로 정리합니다. Smart Reply를 원문 그대로 번역하는 버튼으로 안내하지 않습니다. [Smart Reply 생성·편집·전송](https://help.tawk.to/article/using-smart-reply)

## 4. MIX 용어 규칙

다음은 Lian의 번역용 지침입니다. 실제 답변에 문맥상 필요할 때만 사용하고 일반 일본어 용어를 과하게 바꾸지 않습니다.

| 일본어/원문 | 한국어 이해 | 일본 고객에게 보낼 표기 |
|---|---|---|
| MIX | MIX | MIX |
| ピッチ補正 | 피치 보정 | ピッチ補正 |
| タイミング補正 | 타이밍 보정 | タイミング補正 |
| ハモリ | 하모리 | ハモリ |
| ダブル | 더블 | ダブル |
| アドリブ | 애드리브 | アドリブ |
| 納期 | 납기 | 納期 |
| 修正 | 수정 | 修正 |
| inst | inst / 반주 | inst 또는 문맥에 따라 カラオケ音源 |

MIX를 ‘혼합’, ハモリ를 무조건 ‘코러스 효과’, ダブル을 ‘2인 의뢰’로 바꾸지 않습니다. 곡명·활동명·X ID·URL·금액은 번역하지 않습니다. ‘검토 가능’과 ‘확정 수락’, ‘〜부터’와 고정가를 구분합니다. 번역 초안에 PayPal対応를 추가하지 않습니다.

Instructions 또는 데이터 소스에 실제 서비스 범위와 위 용어 규칙을 넣을 수 있습니다. 가격·납기·정책은 기존 사이트 내용만 사용하며 AI가 임의로 조건을 만들지 않도록 합니다. 고객의 비공개 음원이나 계정 secret을 AI 데이터 소스로 넣지 않습니다. [Instructions 설정과 데이터 사용 범위](https://help.tawk.to/article/using-base-prompt-to-restrict-ai-assist-replies)

## 5. 플랜과 사용량

2026-09-12 공식 안내 기준입니다. 가입·구매를 진행하지 않았으며 실제 결제 직전 관리자 화면의 현재 금액과 조건을 다시 확인해야 합니다.

| AI Assist 플랜 | 월 결제 표기 | 월 message credits |
|---|---:|---:|
| Hobby | 무료 | 100 |
| Growth | US$29 | 1,000 |
| Business | US$99 | 5,000 |
| Enterprise | US$399 | 20,000 |

Smart Reply·AI Commands의 생성도 AI Assist 사용량에 포함됩니다. 한국어 뜻 확인과 일본어 답변 생성을 별도로 하면 통상 생성 두 번이 필요합니다. 공식 AI Assist Preview에서의 테스트는 message credit을 소모하지 않는다고 안내합니다. 자동응답·에스컬레이션·채널 등 세부 제공 범위는 현재 계정 플랜에서 확인하세요. 이 문서는 유료 플랜을 필수 구매 항목으로 지정하지 않습니다. [공식 요금·크레딧](https://help.tawk.to/article/how-to-manage-billing-for-ai-assist), [플랜별 사용량 개념](https://help.tawk.to/article/ai-assist-plans-and-subscriptions)

## 6. 운영 전 테스트와 V8 후보

운영 전에는 ‘내일 밤’, GROUP 12명 STANDARD, ハモリ 추가, 수정 범위, 미확정 PayPal, 불가능한 납기 등 예문으로 원문→한국어 의미→일본어 답변을 확인합니다. 생성만 했을 때 고객에게 전송되지 않는지, 사람이 최종 전송하는지, 새 conversation에서 AI가 자동 참여하는지도 따로 확인합니다. 이 문서 작성에서는 실제 계정의 번역 품질·전송 동작을 테스트하지 않았습니다.

V7.2에는 cross-origin iframe 해킹, DOM injection, Dashboard용 브라우저 스크립트, 가짜 메시지 전송 API를 넣지 않습니다. 별도 번역 시스템은 V8 후보입니다. 원문/번역을 함께 읽는 운영자 전용 도구, 서버에서만 보관하는 번역 API key, 데이터 보관 정책, 사람의 전송 확인을 설계할 수 있습니다. Tawk로 다시 자동 전송하려면 그 시점의 공식 API나 승인된 연동 가능성을 별도로 확인해야 합니다. 공개 API가 그대로라면 운영자가 검토한 일본어를 복사해 보내는 방식까지만 구현 범위로 정합니다.
