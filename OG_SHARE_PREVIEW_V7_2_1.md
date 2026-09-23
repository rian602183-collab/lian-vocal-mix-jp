# V7.2.1 OG / 공유 카드 확인

이미지·공식 문서 확인일: 2026-09-12. 제목 비교 추가 확인일: 2026-09-13. 이번 결과는 로컬 이미지 제작·축소 미리보기와 HTML 메타데이터 검증입니다. Kakao/OpenTalk/X에서 실제로 공유하거나 운영 계정 설정·캐시를 변경하지 않았습니다.

## 이미지 before / after

| 항목 | 기존 V7.2 | V7.2.1 |
| --- | --- | --- |
| 첫 인상 | 얇고 큰 `Lian` 워드마크 | `歌ってみたMIX` / `ボーカルMIX依頼` 2줄 |
| 작은 카드의 정보 우선순위 | 브랜드 이름 중심 | 일본어 서비스명 중심 |
| 일본어 주제 글자 | 비교적 작은 설명 | 로컬 Noto Sans JP Black, 100px, 두꺼운 획 |
| 브랜드 표시 | 화면 왼쪽의 대형 Lian | 상단 `LIAN VOCAL MIX` |
| 상태 | 별도 상태 배지 없음 | `ご依頼受付中` 배지 |
| 장식 | 중앙 오른쪽의 큰 waveform | 오른쪽 아래 246×88px waveform 1개 |
| 색상 | 화이트·아이시 블루·네이비 | 동일 브랜드에 아주 옅은 라벤더 유지 |

가장자리 안전 여백은 좌우 약 72–76px, 상하 약 63px 이상입니다. 본문은 `J-POP・ボカロ・歌ってみた対応`, 하단은 `Clear · Natural · Vocal First`만 남겼습니다. 작은 배지·보조 문구보다 서비스명 두 줄이 먼저 읽히도록 구성했습니다.

새 파일은 `assets/images/lian-og-jp-v721.png`입니다. 기존 `lian-og-jp.png`는 덮어쓰지 않습니다.

- 형식 및 크기: PNG, 정확히 1200×630px
- 용량: 394,939 bytes
- SHA-256: `f5600ab1819e586343d886d644fccc173910ca95ce106daa643a8fb62505089f`
- 런타임 웹폰트 의존: 없음. 웹사이트는 완성된 PNG를 사용합니다.
- 폰트 파일 배포: 없음. 렌더 시 이 PC에 설치된 Noto Sans JP Black을 사용했습니다.
- 브라우저 폰트 검사: Chrome의 `CSS.getPlatformFontsForNode`에서 `NotoSansJP-Black`, `isCustomFont: false`를 확인했습니다.

## 메타데이터 기준

`og:title` / `twitter:title`:

> Lian Vocal MIX｜歌ってみたMIX依頼

`og:description` / `twitter:description`:

> J-POP・ボカロ・歌ってみた対応。透明感と聴きやすさを大切にしたボーカルMIX。料金・サンプル掲載、ご相談受付中。

`og:image`, `og:image:secure_url`, `twitter:image`는 모두 다음 절대 HTTPS URL을 가리킵니다.

```text
https://lian-vocal-mix-jp.netlify.app/assets/images/lian-og-jp-v721.png
```

`og:image:type=image/png`, `og:image:width=1200`, `og:image:height=630`을 사용합니다. `og:image:alt`는 `Lian Vocal MIX。歌ってみたMIX・ボーカルMIX依頼。J-POP・ボカロ・歌ってみた対応。ご依頼受付中。`처럼 새 이미지의 내용을 설명합니다. 기존 canonical / hreflang / `og:type` / `og:site_name` / `og:locale` / `og:url`은 유지합니다. 최종 적용 여부와 기존 OG 참조 제거 여부는 V7.2.1 사이트 검사 결과를 함께 확인합니다.

## 로컬 미리보기와 검증 범위

Verification의 OG 자료에는 다음 파일이 포함됩니다.

- `lian-og-jp-v721.png`: 새 1200×630 원본
- `lian-og-jp-before.png`: 비교를 위한 기존 이미지 사본
- `og-thumbnail-300px.png`: 약 300×158px 축소 이미지
- `og-thumbnail-360px.png`: 360×189px 축소 이미지
- `og-share-card-simulation.png`: 카드 폭 300/360px 및 before/after 비교 화면
- `og-share-card-simulation.html`: 같은 로컬 카드 미리보기
- `og-artwork.html`, `render-og.mjs`: 재현 가능한 원본과 렌더러
- `OG_RENDER_RESULTS.json`: 크기·여백·폰트·외부 요청 검사 기록
- `og-title-comparison-300px.png`, `og-title-comparison-360px.png`: 플랫폼 유형별 긴 제목·짧은 제목 비교
- 같은 이름의 `.html`, `compare-titles.mjs`, `OG_TITLE_COMPARISON_RESULTS.json`: 제목 비교 원본·렌더러·측정 결과

이미지 본문을 300px로 축소한 뒤 서비스명 두 줄의 가독성과 잘림을 직접 확인했습니다. 작은 카드 화면에는 **시뮬레이션이며 실제 Kakao/OpenTalk 캡처가 아님**을 표시했습니다. 이 미리보기는 링크 카드 디자인을 평가하기 위한 예시이며, 실제 앱의 카드 폭·크롭·글꼴·줄 수를 복제하거나 보장하지 않습니다.

렌더러는 Node.js, Playwright, Chrome, 시스템 Noto Sans JP를 사용합니다. 작업 폴더의 `render-og.mjs`를 Node로 실행하면 같은 폴더에 PNG와 미리보기 자료를 만듭니다. 다른 PC에서는 `PLAYWRIGHT_MODULE`, `CHROME_PATH` 환경변수로 설치 경로를 지정할 수 있습니다. 시스템 일본어 폰트가 없으면 렌더러의 폰트 확인이 실패하므로 폰트를 확인한 뒤 다시 렌더해야 합니다. HTTP(S) 요청은 렌더 중 차단되며 이번 실행에서 외부 요청은 0건이었습니다. Chrome·OS·폰트 버전에 따라 래스터화 바이트는 달라질 수 있습니다.

## 추가 38번: 제목 길이 비교와 최종 선택

비교 후보는 다음 두 가지입니다.

- 긴 제목: `Lian Vocal MIX｜歌ってみたMIX・ボーカルMIX依頼`
- **선택한 짧은 제목: `Lian Vocal MIX｜歌ってみたMIX依頼`**

동일한 이미지·카드 폭·폰트 조건에서 3가지 레이아웃 유형을 비교했습니다. Kakao/OpenTalk형은 이미지 아래 제목 최대 2줄, X형은 큰 이미지 아래 제목 1줄, 일반 공유형은 작은 이미지 옆 제목 최대 2줄로 구성한 **가독성 시험용 시뮬레이션**입니다. X형의 1줄 제한과 일반 공유형의 레이아웃은 좁은 표시 공간을 시험하는 조건이며, 실제 서비스의 고정 사양을 주장하지 않습니다.

| 유형·폭 | 긴 제목 | 짧은 제목 |
| --- | --- | --- |
| Kakao/OpenTalk형 300px | 2줄 | 1줄 |
| Kakao/OpenTalk형 360px | 1줄, 폭을 거의 채움 | 1줄, 여유 있음 |
| X형 300px | 1줄 제한에서 말줄임 발생 | 말줄임 없이 전체 표시 |
| X형 360px | 1줄, 폭을 거의 채움 | 1줄, 여유 있음 |
| 일반 공유형 300px | 2줄 | 2줄 |
| 일반 공유형 360px | 2줄 | 1줄 |

큰 이미지 카드의 14px 제목은 텍스트 영역 폭이 300px 카드에서 272px, 360px 카드에서 332px입니다. 같은 조건에서 긴 제목의 한 줄 폭은 약 329.54px, 짧은 제목은 약 234.65px였습니다. 좁은 모바일 카드에서도 핵심인 `歌ってみたMIX依頼`까지 잘리지 않고 읽히며, 360px에서는 오른쪽 여유가 생기는 짧은 제목을 선택했습니다. 일반 공유형 300px처럼 더 좁은 텍스트 영역에서는 짧은 제목도 두 줄이 되므로 모든 환경의 한 줄 표시를 보장하지 않습니다.

`ボーカルMIX`는 이미지 메인 두 번째 줄과 description에 계속 존재합니다. 제목에서 같은 서비스명을 반복하는 것보다 읽기 쉬운 길이를 우선한 결정이며, 이미지의 서비스 정보와 웹사이트 Hero 문구는 바꾸지 않습니다. 선택한 제목을 `og:title`과 `twitter:title`에 동일하게 사용합니다.

두 비교 스크린샷을 직접 확인했으며 외부 요청은 0건입니다. 실제 앱 폰트·OS 글자 크기·공유 방식에 따라 줄 수가 달라질 수 있으므로 운영 배포 후의 실제 Kakao/OpenTalk/X 확인은 별도로 필요합니다.

## Kakao 공식 문서에서 확인한 범위

Kakao 공식 스크랩 메시지 문서는 HTML `<head>`의 OG 메타데이터에서 이미지·제목·설명을 가져오며, 스크랩 메시지 제목·설명을 각각 최대 두 줄로 표시한다고 안내합니다. 그래서 메타 태그를 정적 HTML head에 두고, 이미지 자체에도 서비스명을 크게 표시했습니다. 이 문서는 Share/Message API의 스크랩 메시지를 설명하며, 일반 OpenTalk에 URL을 붙여넣었을 때의 모든 UI 세부를 보장하는 문서로 해석하지 않았습니다. [Kakao — Message Template / Common](https://developers.kakao.com/docs/en/message-template/common)

Kakao FAQ는 기존 이미지나 문구가 남는 원인으로 OG 캐시를 설명하고, **도구 → 초기화 도구 → OG(Open Graph) 캐시**에서 웹페이지 또는 파일 URL의 캐시를 지우는 절차를 제공합니다. 새 파일명은 이전 이미지 URL의 캐시 재사용을 줄이지만, 페이지 URL의 OG 캐시까지 즉시 초기화하지는 않습니다. [Kakao — 메시지 템플릿 FAQ](https://developers.kakao.com/docs/ko/message-template/faq)

## 사용자가 배포 후 확인할 항목

1. 승인한 V7.2.1을 직접 배포한 뒤 페이지 원본 head가 새 이미지 URL·제목·설명을 포함하는지 확인합니다.
2. 새 이미지 HTTPS URL이 로그인 없이 열리고 1200×630 PNG를 반환하는지 확인합니다.
3. 공유 시 이전 카드가 남으면 Kakao Developers의 **도구 → 초기화 도구 → OG(Open Graph) 캐시**에서 공개 홈페이지 URL의 캐시를 초기화합니다. 필요한 경우 해당 이미지 URL도 확인합니다.
4. 기존 대화에 이미 표시된 카드가 즉시 바뀐다고 가정하지 말고 새 링크 미리보기를 생성해 확인합니다. 문제가 계속되면 공식 FAQ의 추가 확인 절차를 따릅니다.
5. 실제 Samsung Android의 Kakao/OpenTalk 및 X에서 서비스명·이미지 크롭·제목 줄바꿈·링크 연결을 각각 확인합니다.

API로 스크랩 메시지를 전송할 때 필요한 앱의 Product Link / Web Domain 등록과 일반 채팅방의 URL 붙여넣기를 혼동하지 않습니다. 이번 작업은 공유 SDK나 메시지 전송 로직을 추가하지 않으며, V7.2의 OAuth·리뷰 알림 설정과 환경변수를 변경하지 않습니다.
