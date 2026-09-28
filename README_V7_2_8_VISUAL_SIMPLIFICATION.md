# Lian Vocal MIX JP V7.2.8 — Visual Simplification / Conversion

기준: `Lian_Vocal_MIX_JP_V7_2_7_Portfolio_Final.zip`  
목표: 일본 사용자 피드백의 핵심인 “세세하고 좋지만 조금 이해하기 어렵다”를 해결하면서 기존 기능/가격/음원을 보존.

## 반영한 피드백

### 1. 메뉴 단순화
- 기존 화면 중간의 PORTFOLIO / PRICE / GUIDE / REVIEWS / CONTACT 5개 전환 탭을 제거했습니다.
- 사이트는 이제 작품 → 가격 → 의뢰 흐름 → 리뷰 → 문의를 자연스럽게 스크롤하는 단일 페이지 구조입니다.
- 상단 메뉴는 `WORKS / PRICE / REVIEWS` 3개 + `無料相談` CTA로 축소했습니다.
- 모바일은 한국어 전환을 숨겨 상단을 `Lian / 無料相談 / MENU` 중심으로 정리했습니다.

### 2. Hero 한눈 요약
첫 화면 상단에서 다음 4가지를 바로 확인할 수 있습니다.
- `現在受付中`
- `¥4,000〜 Vocal MIX`
- `初めてでもOK`
- `PayPal対応`

메인 상담 버튼은 `無料で相談・見積り`, 샘플 버튼은 `MIXサンプルを聴く`으로 단순화했습니다.

### 3. 가격표 시각화
가격과 실제 계산 규칙은 변경하지 않았습니다.
- LIGHT ¥4,000
- STANDARD ¥5,500
- DELUXE ¥6,500〜

각 플랜에 “어떤 고객에게 맞는지”를 짧게 보여주고, 포함 작업은 체크형 리스트로 정리했습니다.
STANDARD는 `一番おすすめ`로만 시각적 우선순위를 줍니다.

DUET / GROUP / 추가 트랙 / 추가 하모리·코러스 / 추가 더블·애드리브 / 완전 비공개 / 급행 조건은 삭제하지 않고 `追加料金・詳しい条件を見る` 안에 보존했습니다.

### 4. 결제 방법 명확화
기존 PayPal 결제 흐름에 맞춰 다음 위치에서 `PayPal`을 명확히 표시합니다.
- Hero 요약
- 가격표 바로 위
- 의뢰 흐름 03단계
- FAQ

문구: 견적 확정 → PayPal 안내/결제 → 결제 확인 후 작업 시작.

### 5. 의뢰 흐름 시각화
기존 텍스트/탭형 Guide를 6단계 시각형 플로우로 변경했습니다.
1. ご相談
2. 音源確認・お見積り
3. PayPalでお支払い
4. MIX作業
5. 確認・修正
6. 納品

PC는 6카드 가로 플로우, 모바일은 세로 타임라인으로 표시합니다.
필요 파일과 납기/주의사항은 아래 접이식 상세영역으로 보존했습니다.

### 6. 문의 선택지 단순화
처음 보이는 주요 선택지는 두 개로 줄였습니다.
- 사이트 무료상담 폼
- X DM

기존 Tawk 채팅 기능은 삭제하지 않고 보조 링크로 유지했습니다.

### 7. 포트폴리오 / YouTube
V7.2.7의 다음 항목은 그대로 보존했습니다.
- 포트폴리오 10곡
- FEATURED 5곡
- Before / After 2세트
- 하모리 비교
- `preload=none`
- 한 번에 하나의 오디오만 재생

실제 고객 YouTube URL은 제공받지 않았으므로 임의 링크를 생성하지 않았습니다.
대신 `portfolio-view.mjs`가 각 work의 선택적 `youtube_url`을 지원하도록 추가했습니다. 검증된 YouTube URL을 manifest에 넣고 `node tools/build-portfolio.mjs`를 실행하면 해당 카드에 `YouTubeで作品を見る` 링크가 자동 생성됩니다.

## 의도적으로 변경하지 않은 것
- 모든 가격 및 가격 계산식
- PayPal checkout/API 코드
- Netlify Functions
- CREPE/사이트 통합 리뷰 시스템
- 리뷰 승인/관리 로직
- 문의 Netlify Form 필드/알림 흐름
- Tawk 연동
- SEO/OG
- 기존 포트폴리오/Before·After/하모리 음원 bytes
- 환불/수정/납기 정책

## 새 파일
- `jp-v728.css` — V7.2.8 시각 단순화 레이어
- `jp-v728.js` — 선형 페이지 보조/활성 메뉴/모바일 상세 UI
- `README_V7_2_8_VISUAL_SIMPLIFICATION.md`
- `TEST_RESULTS_V7_2_8_VISUAL_SIMPLIFICATION.md`

## 운영 전 남은 확인
- 실제 Netlify 배포 후 iPhone Safari / Android 실제 기기에서 최종 확인
- 실제 PayPal Sandbox/Live 결제는 기존 환경변수를 사용해 운영 환경에서 확인
- 실제 고객 YouTube 작품 링크는 고객 공개 허락과 URL 확인 후 추가
