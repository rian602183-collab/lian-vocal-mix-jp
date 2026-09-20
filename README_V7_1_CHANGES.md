# Lian Vocal MIX JP V7.1 — Lian Brand / UX Refinement

기준: Lian_Vocal_MIX_JP_V7_0_1_Security_Fix.zip  
완료일: 2026-09-11  
이번 결과는 로컬 파일과 ZIP입니다. GitHub Push, Netlify 배포, Tawk 관리자 설정 변경을 수행하지 않았습니다.

## 이번 버전의 변화

Lian의 자연스러운 보정과 선명한 보컬이 먼저 전달되도록, 기존 화이트·아이시 블루·라벤더·네이비를 정리했습니다. 메인 카피 `歌ってみたを、もっと綺麗に。`를 유지하고, 대표 음원 → MIX 판단 → Before/After → 가격 → 상담으로 이어지는 흐름을 강화했습니다.

| 영역 | V7.1 변경 |
|---|---|
| Hero | 모바일에서 대표 음원을 상담 CTA 앞에 배치. 파형 높이를 줄이고 Lian / Vocal MIX 정체성을 명확하게 표시 |
| 브랜드 | L 마크의 signal line, 절제된 waveform, 일관된 색상 역할과 세 종류 카드 강조 수준 |
| Lian 소개 | 기존 서비스 성격에 근거한 짧은 소개. 경력·수상·실적을 추가하지 않음 |
| Portfolio | 기존 5곡 / SOLO·DUET·GROUP 유지. 오디오와 읽기 쉬운 MIX POINT 메모를 연결 |
| Before/After | 기존 Flyer! 30초 파일, BEFORE → LIAN MIX → AFTER 흐름과 별도 강조 배경 |
| Price | 데스크톱에서 3개 플랜을 나란히 비교. 1280×720에서도 내용·상담 버튼까지 표시 |
| 견적 | 인원/플랜 입력 뒤와 옵션/납기 입력 뒤에 현재 금액 표시. 기존 계산 결과를 그대로 복제하며 계산식을 추가하지 않음 |
| Guide | 실제 6단계와 결제 순서를 유지. 번호·선으로 연결된 작업 순서 표현 |
| Reviews | 기존 후기 5개·날짜·기간 원문 유지. 본문 15px, 메타 12px로 위계 정리 |
| Contact | 채팅 → 문의폼 → X 순서. 확인 후 순차 답변한다는 문구 사용 |
| Navigation | 모바일 가로 스와이프 안내, 선택 상태 개선, 메인 탭 방향키·Home·End 지원 |
| 접근성 | 주요 설명 14–16px, 보조 정보 12–13px, focus 표시, reduced motion 및 실제 헤더 높이와 스크롤 기준 정렬 |
| 공유 | 1200×630 PNG/SVG OG 이미지, canonical·og:url·og:image·twitter:image·ja/ko hreflang |
| 전송 완료 | 기존 메시지는 유지하고 같은 스타일 적용. 검색용 페이지가 아니므로 noindex 추가 |

390×844에서 대표 오디오의 위쪽 위치는 V7.0.1 약 978px → V7.1 약 596px입니다. 오디오 컨트롤 전체가 첫 화면 안에 들어옵니다. 브라우저·폰트에 따른 차이는 있을 수 있으며, 수치는 제공한 Chrome 캡처 기준입니다.

## 그대로 보존한 항목

- LIGHT ¥4,000 / STANDARD ¥5,500 / DELUXE ¥6,500〜, 모든 기존 옵션·급행·수정 요금과 계산식
- GROUP 12명 입력 유지 및 STANDARD ¥29,000〜 계산
- 가격 버튼의 플랜 자동 선택·문의폼 자동 열기, form hidden/ARIA 동기화, hash·뒤로/앞으로 이동
- Netlify Form `mix-consultation` 이름, 필드·hidden 견적 값, 기존 제출 경로
- 기존 리뷰 5개, 전체 6단계 진행 순서와 결제 안내, FAQ·납기·환불 문구
- MP3 7개 경로와 바이트, HTML 오디오 8개의 `preload="metadata"`, 상호 정지
- 일본 X 링크 `https://x.com/Lian5602`
- 4개 Netlify Functions, package.json, netlify.toml, KAKAO_SETUP.md: SHA-256 동일
- signed state·nonce·HMAC·관리자 secret·허용 Kakao ID·onlyIfNew modified 결과 처리·XSS 방어
- Tawk 기존 Widget ID, 실패 fallback과 늦은 로딩 후 자동 숨김, 클릭 시에만 maximize

이번에는 프레임워크, 외부 UI 라이브러리, 음원 변환, Base64 음원, 영상 배경을 추가하지 않았습니다. 기존 jp.css는 바이트 단위로 그대로 두고 `jp-brand-v71.css`에 V7.1의 스타일 역할과 반응형 규칙을 모았습니다.

## 변경 파일

| 파일 | 변경 목적 |
|---|---|
| index.html | Hero 순서·소개·가격 비교·MIX 메모·Before/After·문의 우선순위·견적 표시·공유 메타 |
| jp.js | 기존 견적 결과를 compact 표시에도 동기화, 불필요해진 가격 필터 제거, 메인 탭 키보드/가로 스크롤, reduced motion |
| thanks.html | 같은 브랜드 CSS 연결, noindex |
| jp-brand-v71.css (신규) | 색상 토큰·타이포·카드·각 영역·반응형·접근성 스타일 |
| assets/images/lian-og-jp.png (신규) | 1200×630 SNS 공유 이미지 |
| assets/images/lian-og-jp.svg (신규) | 편집 가능한 OG 원본. PNG가 실제 공유 이미지로 사용됨 |
| README_V7_1_CHANGES.md (신규) | 현재 버전 안내와 이월 항목 |
| TAWK_LIAN_STYLE_SETUP.md (신규) | 공식 문서에 근거한 관리자 설정 안내 |

최종 전체 목록과 SHA-256은 별도 검증 자료의 `FILE_MANIFEST.json`, 원본 비교는 `preservation.json`에 있습니다. 기존 버전 README들은 이력으로 보존했습니다. 현재 버전 설명은 이 문서가 우선하며, Kakao 관리자 연결 절차는 수정하지 않은 최신 `KAKAO_SETUP.md`를 사용합니다.

## 검증 결과

- 프런트엔드 회귀: 65개 통과, 0개 실패
- V7.1 UX·표시·메타데이터 추가 검증: 28개 통과, 0개 실패
- V7.0.1 보안/API/실제 Chrome 쿠키 회귀: 36개 통과, 0개 실패
- jp.js와 Netlify Functions 4개: node --check 통과
- 1280×720 / 1440×900 / 768×1024 / 390×844 / 360×800: 패널별 가로 overflow 없음

자세한 결과는 별도 `TEST_RESULTS_V7_1.md`와 `Lian_Vocal_MIX_JP_V7_1_Verification.zip`에 있습니다. 검증 ZIP에는 실행 스크립트, 원시 결과, 5개 화면 크기 캡처, V7.0.1과 V7.1 Hero/Price 비교가 포함됩니다. 검증 ZIP을 사이트로 배포하지 않습니다.

## Tawk 관리자에서 마무리할 사항

사이트 코드는 영어 greeting을 생성하지 않으며, cross-origin iframe 내부를 수정하지 않습니다. 원형 launcher만 보이는 실제 운영 상태는 아래 관리자 설정을 저장해야 완성됩니다.

1. 원형 모양 / Bottom Right / Attention Grabber OFF.
2. desktop와 mobile의 Disable message preview ON.
3. 방문만으로 보내는 Welcome·Site/Page Notification 트리거 비활성화.
4. Widget Language를 Japanese로 설정하고 Header·Chat·Text Area 카드의 영어 문구 수정.
5. Lian alias와 `MIX ご相談窓口` 직함 설정. 자동 즉답을 약속하지 않음.
6. launcher 블루 #5B87D9, 흰 글자가 필요한 CTA는 사이트와 같은 #426BB4를 기준으로 확인.

정확한 화면 경로와 복사할 일본어 문구, 변경 가능한 범위는 `TAWK_LIAN_STYLE_SETUP.md`에 있습니다. 실제 메시지 composer placeholder를 임의 문자열로 바꿀 수 있는지는 확인되지 않아 Japanese 기본 번역을 유지하도록 안내했습니다. 스크린샷의 원형 채팅 버튼은 위치 검사 전용 모형입니다. 실제 Tawk 설정을 적용했다는 증거가 아닙니다.

## V7.2 이후로 넘긴 운영정책

아래는 운영자가 정의할 사항이며 이번 파일에 임의 조건을 추가하지 않았습니다.

- 기본 포함 트랙 수와 추가 트랙의 판단 기준, 하모리·더블·아드리브 추가 요금의 적용 경계
- 수정 1회 범위, 방향 변경·전체 재녹음·파일 교체의 추가 작업 기준
- 당일/48시간 급행의 접수 마감·시작 시점·휴일 기준, 일반 납기와 예약 상황의 관계
- 진행 단계별 취소·환불 범위, 실제 결제 수단·통화·수수료와 결제 확인 방식
- CREPE의 작업기간(특히 4분)이 어떤 기록인지와 공개 통계(10건/리뷰9건/평균5일)의 갱신 기준. 이번에는 원문·수치를 보존하고 기간 강조만 줄임
- 포트폴리오 공개 전 확인 절차와 비공개 옵션의 실제 운영 범위

그 밖에 CSS의 역사적 중복 전면 정리와 전체 보조 탭의 접근성 체계 통합은 후속 기술 작업입니다. 이번 메인 탭 키보드 개선을 전체 사이트 접근성 인증으로 표현하지 않습니다.

## 로컬 확인과 실제 서비스 검증의 범위

ZIP을 풀면 루트에 index.html, assets, netlify가 있습니다. 정적 서버로 열어 화면을 확인할 수 있습니다. 새 OG URL은 이 ZIP을 실제 배포한 후에 공개 주소에서 접근할 수 있습니다. 한국 사이트에 reciprocal hreflang을 추가하는 작업은 수행하지 않았습니다.

실제 Netlify 제출→메일/카카오 알림 전달, 운영 Tawk 대화와 greeting 상태, 실제 Kakao 계정 로그인, iOS Safari·브라우저 safe area는 이번 오프라인 Chrome 검증 범위에 포함되지 않습니다. 코드는 보존했고 API·브라우저 동작을 모의 외부 응답으로 검증했습니다. 실제 계정 설정과 전달 결과는 사용자의 추후 배포 시 확인 대상입니다.
