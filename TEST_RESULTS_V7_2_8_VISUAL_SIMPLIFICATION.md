# V7.2.8 Visual Simplification / Conversion 검증 결과

검증일: 2026-09-25

## 결과 요약

- **Static: 38/38 PASS**
- **Responsive: 10/10 PASS**
- **Interaction: 6/6 PASS**
- **Calculator: 10/10 PASS**
- **YouTube: 2/2 PASS**

- **총 66/66 PASS**

## 핵심 확인

- 기존 5개 전환 탭 제거 후 WORKS / PRICE / GUIDE / REVIEWS / CONTACT 5개 섹션이 모두 선형 페이지에서 노출됨.
- 상단 내비게이션은 WORKS / PRICE / REVIEWS + 無料相談로 단순화.
- 가격표 숫자와 기존 계산 코드 보존. 대표 계산 케이스 10개를 브라우저 JS로 재검증.
- PayPal / 리뷰 / Netlify Functions 등 핵심 운영 파일은 V7.2.7과 바이트 단위 동일.
- 포트폴리오 오디오 23개는 V7.2.7과 SHA-256 단위 동일.
- 360 / 390 / 768 / 1280 / 1440px Chromium layout 검사에서 가로 overflow 0.
- YouTube는 실제 URL을 제공받지 않았기 때문에 현재 공개 링크를 생성하지 않았고, 선택적 youtube_url 지원만 추가.

## 가격 계산 재검증

- LIGHT solo: ¥4,000 / expected ¥4,000 — PASS
- STANDARD solo: ¥5,500 / expected ¥5,500 — PASS
- DELUXE solo: ¥6,500〜 / expected ¥6,500〜 — PASS
- STANDARD duet: ¥9,000〜 / expected ¥9,000〜 — PASS
- STANDARD group 3: ¥11,000〜 / expected ¥11,000〜 — PASS
- STANDARD group 12: ¥29,000〜 / expected ¥29,000〜 — PASS
- STANDARD +1 track: ¥6,000 / expected ¥6,000 — PASS
- STANDARD private: ¥7,500 / expected ¥7,500 — PASS
- STANDARD rush48: ¥7,150 / expected ¥7,150 — PASS
- STANDARD same day: ¥8,250 / expected ¥8,250 — PASS

## 한계 / 운영 환경 확인 필요

- Chromium 검사는 로컬 HTML/CSS/JS를 인라인으로 로드하여 외부 서비스 호출 없이 수행했습니다.
- 실제 Netlify Production 배포, PayPal Sandbox/Live 네트워크 결제, Tawk 실제 연결, Kakao 실제 전송은 이번 로컬 검사에서 수행하지 않았습니다.
- 실제 iPhone Safari / Android 실기기 검수는 배포 후 별도로 권장합니다.
- 실제 고객 YouTube 작품은 공개 허락 및 정확한 URL을 받은 뒤 추가해야 합니다.
