# Lian Vocal MIX JP V7.2.9 — Multi-Person Pricing

기준 버전: `Lian_Vocal_MIX_JP_V7_2_8_Visual_Simplification_Final.zip`  
업데이트일: 2026-09-27

## 변경 목적

다인원 의뢰에서 인원이 늘어날수록 1인당 단가가 지나치게 낮아지는 기존 구조를 폐기했습니다. Solo 가격은 그대로 유지하고, 2명 이상은 플랜별 1인 단가로 계산합니다.

## 새 가격

### Solo
- LIGHT: ¥4,000
- STANDARD: ¥5,500
- DELUXE: ¥6,500〜

### Duet / Group (2명 이상)
- LIGHT: ¥4,000 / 1名
- STANDARD: ¥5,000 / 1名
- DELUXE: ¥6,000 / 1名〜

예: 12명 기준 LIGHT ¥48,000 / STANDARD ¥60,000 / DELUXE ¥72,000〜.

## 유지된 옵션

- 추가 보컬 트랙: +¥500 / track
- 기본 범위를 넘는 하모리/코러스: +¥1,000〜
- 기본 범위를 넘는 더블/애드리브 정리: +¥1,000〜
- 완전 비공개: +¥2,000
- 48시간 이내: 합계 +30%
- 당일: 합계 +50%
- 수정 3회 무료 / 4회째부터 +¥500 / 회

## 화면 변경

- 각 3플랜 가격 아래에 `Solo · 1名` 표시
- 3플랜 카드 바로 아래에 2명 이상 가격을 별도 시각 스트립으로 표시
- 상세조건에 기존 `Duet +¥3,500 / Group +¥2,000` 문구를 제거
- 문의폼의 인원 선택 문구를 새 계산 방식에 맞게 변경
- 10명 이상은 트랙/파트 구성을 확인한 후 최종견적을 안내한다는 문구 추가

## 계산/결제

프런트 `jp.js`와 서버 권한 계산기 `netlify/functions/lib/paypal-pricing.mjs`를 같은 공식으로 수정했습니다. PayPal 주문 금액은 여전히 브라우저 표시값이 아니라 서버가 선택값으로 재계산합니다.

## 보존 범위

V7.2.8 대비 기존 파일 중 실제 기능 변경은 다음 4개뿐입니다.
- `index.html`
- `jp.js`
- `netlify/functions/lib/paypal-pricing.mjs`
- `CURRENT_PRICE_RULES.md`

추가 파일:
- `jp-v729.css`
- `tools/test-v729-pricing.mjs`
- V7.2.9 검증 문서/스크린샷

포트폴리오 음원 23개는 바이트 단위로 변경하지 않았고, 리뷰/Netlify/PayPal checkout의 나머지 핵심 파일도 그대로 유지했습니다.
