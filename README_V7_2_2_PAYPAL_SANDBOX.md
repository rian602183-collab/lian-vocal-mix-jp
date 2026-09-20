# Lian Vocal MIX JP V7.2.2 — PayPal Sandbox

기존 견적 선택값을 서버에서 재계산하는 동적 PayPal Checkout을 추가했습니다. ¥33,000 고정값이나 허용 금액 목록은 없습니다. 기존 실제 jp.js를 실행한 10,140개 조합과 서버 계산이 일치했고 2,853개 서로 다른 금액을 확인했습니다.

이 결과물은 **로컬/mock 검증을 마친 Sandbox 구현 ZIP**입니다. 실제 Sandbox 구매자 로그인·승인·캡처는 아직 검증하지 않았습니다. 로컬 프로세스에 실제 인증정보가 없으며 Netlify의 Secret을 내려받지 않았습니다. GitHub Push, Netlify Production 배포, Live 전환, 실제 결제는 하지 않았습니다.

## 현재 가격 규칙

| 항목 | 계산(JPY) |
|---|---:|
| LIGHT / STANDARD / DELUXE | 4,000 / 5,500 / 6,500 |
| Solo / Duet | +0 / +3,500 |
| Group n명(n≥3) | +3,500 + (n−2)×2,000 |
| 추가 보컬 트랙 t개 | +t×500 |
| 하모리 | +1,000 |
| 더블·애드리브 통합 옵션 | +1,000 |
| 완전 비공개 | +2,000 |
| 일반 / 48시간 / 당일 | 전체 소계 ×1 / ×1.3 / ×1.5 |

최종 계산은 기존 코드와 같은 Math.round(소계 × 급행배율)입니다. 플랜 미정 consult는 결제하지 않습니다. 기존 UI에는 인원/트랙 업무상 최대값이 없으므로 임의 제한을 추가하지 않았습니다. 결제 입력의 safe integer와 공식 Orders 기술 상한을 검사하며 계정별 처리 한도는 별개입니다. 모든 유효한 선택 조합의 결과를 JPY 정수 문자열로 전달합니다.

¥33,000 사례: DELUXE 6,500 + Group5명 9,500 + 트랙4개 2,000 + 하모리1,000 + 더블·애드리브1,000 + 비공개2,000 = 22,000; 당일 ×1.5 = 33,000. 같은 구성에서 체크박스 세 개를 빼면 27,000입니다. 상세 근거는 CURRENT_PRICE_RULES.md에 있습니다.

## 결제 흐름

동일 브라우저 config(GET, HttpOnly 쿠키/CSRF) → 공식 SDK v6의 JPY eligibility/버튼 → 선택값 POST → 서버 가격 재계산/Blobs 생성 잠금 → Orders v2 Create → 구매자 승인 → 서버 GET으로 주문·수취인·금액·승인 상태 확인 → Capture → 실제 capture COMPLETED/JPY/총액 검증 → 완료 기록 저장 → 최소 성공 응답.

버튼의 표시 금액은 기존 견적을 따르지만 서버는 그 값을 받거나 신뢰하지 않습니다. create 응답의 서버 금액이 표시와 다르면 승인 진행 전에 멈추고 기존 견적을 다시 계산합니다. 고객에게 기존 最低料金の目安/〜 의미와 추가 작업 확인 문구를 유지합니다. 상담 폼은 자동 제출되지 않습니다.

Sandbox에서는 일반 Production 방문자에게 결제 영역/외부 SDK가 나타나지 않습니다. localhost, 신뢰된 JP Deploy Preview 또는 명시적 paypal_test=1에서만 나타납니다. 시험 사용법과 나중에 바꿀 세 환경변수는 PAYPAL_V7_2_2_SETUP.md를 확인하세요. 사이트 자체는 아직 배포하지 않았습니다.

## 보존 범위와 검증

- 변경 전 기존 538/538 통과, 변경 후 기존 538/538 통과.
- 신규 236/236 통과: 가격 87 + API 97 + 독립 보안 21 + 실제 Chrome/mock 결제 31 시나리오. 최종 774/774, 실패 0. 가격 내부 조합 10,140개는 이 숫자에 중복 가산하지 않았습니다.
- 기존 71개 파일 중 69개 byte-identical. 기존 실행 코드 변경은 index.html의 새 CSS/JS 참조 두 줄뿐입니다. PAYPAL_SETUP.md에는 현행 안내 링크와 이전 기록 표시를 추가했습니다.
- 기존 12개 server module, 가격 계산 JS/CSS, 오디오 7개, native Netlify form, Kakao OAuth/리뷰 보안, SEO/OG/canonical/robots/404/sitemap 보존.
- node --check 24개 통과. 공식 Netlify bundler로 12개 로컬 번들 생성: 서비스 entrypoint 11개와 기존 kakao-security helper 1개. 실제 Netlify 배포 검증은 아닙니다.

검증 ZIP에는 로그/테스트 코드/스크린샷/파일 해시가 들어 있습니다. **검증 ZIP은 배포하지 않습니다.** mock PayPal 버튼 화면은 자체 레이아웃 검사용이며 실제 PayPal 계정 화면을 캡처한 것이 아닙니다.
