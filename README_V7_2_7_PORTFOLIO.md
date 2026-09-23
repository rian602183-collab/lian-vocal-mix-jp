# Lian Vocal MIX JP V7.2.7 Portfolio Final

사용자가 제공한 `Lian_Vocal_MIX_JP_V7_2_5_Unified_Review_Final.zip`에
`Lian_Portfolio_V7_2_7_Final_Module.zip`의 포트폴리오를 통합한 결과입니다.

## 통합 내용

- FEATURED WORKS 5곡 → BEFORE / AFTER 2세트 및 ハモリ生成 탭 → ALL WORKS 10곡.
- 곡명, 음원 경로, 순서, 대표곡, 비교 음원, 더보기 초기 개수는 `portfolio-manifest.json`이 기준입니다.
- 원본 manifest의 목록은 유지하고, 모듈 HTML에만 있었던 곡별 음원 경로를 `works` 배열로 옮겼습니다.
- 상단 LIAN’S SOUND도 manifest의 첫 FEATURED 곡을 사용하므로 전체 공개 작품은 10곡입니다.
- 제외 작품은 공개 페이지·대표작·데모에 표시하지 않습니다. manifest의 `removed`는 제외 검증용 메타데이터입니다.
- 기존 화이트 / 아이스블루 / 라벤더 / 네이비 색상과 간격을 사용합니다. CSS는 포트폴리오 안에만 적용됩니다.
- 데스크톱은 재생 컨트롤의 폭을 확보하는 3열, 태블릿은 2열, 모바일은 1열입니다.
- ALL WORKS는 기본 데스크톱 6곡 / 모바일 4곡을 표시하고 더보기로 10곡을 펼칩니다.
- 모든 오디오는 `preload="none"`입니다. 상단 샘플을 포함해 한 번에 하나만 재생되며,
  데모 탭 변경·더보기 접기·화면 축소로 숨겨지는 오디오도 멈춥니다.
- 제공 MP3 16개는 원본 바이트 그대로입니다. 브라우저에서 페이드·볼륨 자동화·구간 자르기·재생 위치 동기화를 추가하지 않았습니다.

## 변경 범위와 보존

기준 ZIP의 96개 기존 파일 중 `index.html`만 수정했습니다. 나머지 95개는 바이트 단위로 동일합니다.
Netlify Functions 23개, PayPal, 가격 계산, 가격·서비스 정책, CREPE 및 사이트 리뷰,
문의폼, Tawk, 일본어 lang 및 번역 허용, SEO/OG, About Lian 내용을 유지했습니다.

기존 MP3 7개도 원본 보존을 위해 파일로 남겨 두었으나, 새 공개 페이지에서는 참조하지 않습니다.
공개 작품 수는 10곡이며, 비교·하모리 음원까지 포함한 새 참조 MP3는 16개입니다.
동일 작품을 상단/대표작/전체 목록에 반복 표시하므로 audio 요소는 총 22개입니다.

새 파일: `portfolio-manifest.json`, `portfolio-view.mjs`, `portfolio-module.js`,
`portfolio-module.css`, `tools/build-portfolio.mjs`, 이 안내서, 제공 MP3 16개.

## manifest를 수정할 때

별도의 곡 목록을 HTML이나 JS에 수동으로 추가하지 마세요. manifest를 수정하고 프로젝트 폴더에서 실행합니다.

```sh
node tools/build-portfolio.mjs
```

이 명령은 manifest를 검증하고 음원 파일의 존재를 확인한 뒤, `index.html`의 포트폴리오와 상단 대표곡을 재생성합니다.
다른 섹션은 수정하지 않습니다. 배포 전 실행하면 검색엔진 및 JavaScript 미사용 환경에도 같은 목록이 제공됩니다.
일반 접속에서는 브라우저도 같은 manifest를 읽습니다. 요청 실패 시 생성된 HTML을 사용하며,
사용자가 이미 재생·탭·더보기를 사용한 경우 늦게 도착한 응답이 현재 조작을 초기화하지 않습니다.

파일을 더블 클릭하는 `file://` 방식에서는 모듈/JSON 요청이 제한될 수 있으므로 HTTP 서버에서 확인하세요.
기존 Netlify 설정과 환경변수를 사용합니다. 새 환경변수나 외부 서비스는 추가하지 않았습니다.

## 검증 범위

- HTML 4페이지: 태그/속성/중복 ID/ARIA 참조 구조 검사.
- JavaScript / MJS / 인라인 스크립트 34개: `node --check` 통과.
- 새 CSS: 구문 구조 및 Chromium의 선택자·속성 값 파싱 검사 통과.
- 실제 Chrome, 360/390/768/1280/1440px: 화면 캡처 검수, 넘침 없음, 탭·더보기·키보드 동작 확인.
- 로컬 HTTP에서 MP3 16개 모두 200/206 응답 및 실제 디코딩·재생 확인.
- manifest 데이터 변경 반영, 실패 시 정적 fallback, 상호 정지 등 포트폴리오 브라우저 검사 22개 통과.
- 기존 결제 API 97개, 가격 parity 87개, 결제 예외/경합 21개, 리뷰 75개, Kakao 리뷰 30개 통과.
- PayPal 화면 및 서버 연결은 SDK/API/Blobs mock 환경에서 31개 통과. 특정 결제금액을 고정하지 않았습니다.

외부 계정에 접속해 실제 결제·메시지 발송·리뷰 변경·문의 제출을 하지 않았습니다.
GitHub Push, Netlify 배포, Kakao Developers 설정 변경을 수행하지 않았습니다.
Chrome의 화면 폭 검수이며 실제 iPhone/Safari 단말 검증을 주장하지 않습니다.
