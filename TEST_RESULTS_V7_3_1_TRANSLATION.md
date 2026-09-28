# V7.3.1 Automatic Translation — 검증 결과

검증일: 2026-09-28

## 1. V7.3 기존 기능 회귀

`tools/test-v729-pricing.mjs` 재실행:

- 프런트 ↔ PayPal 서버 가격 조합: **2,880 PASS**
- 정확 금액 fixture: **11 PASS**
- 잘못된 입력 거부: **3 PASS**
- 불일치: **0**

기존 V7.3 ZIP과 SHA-256 비교:

- 공개 `index.html`: 동일
- `jp.js / jp-v72.js / jp-v721.js / jp-v728.js / jp-v730.js`: 동일
- 가격/스타일 CSS: 동일
- `paypal-checkout.js/css`: 동일
- portfolio / review 관련 핵심 파일: 동일
- 기존 포트폴리오 오디오: **23/23 byte-exact SHA-256 동일**
- 기존 파일 중 의도적으로 변경: `netlify.toml`, `robots.txt`만

자세한 해시는 `SHA256_V7_3_1_TRANSLATION_PRESERVATION.md`.

## 2. 번역 Core / Function 테스트

`node tools/test-v731-translator.mjs`:

**21개 PASS**

포함 항목:

- access secret exact match / mismatch
- DeepL API Free(`:fx`) / Pro endpoint 선택
- override URL
- XML 보호 token wrapping / restore
- 금액/ID/URL/MIX 용어 invariant 추출
- invariant 손실 경고
- JA→KO translation mock
- KO→JA + 역번역 mock
- 최신 DeepL option 400 시 core 옵션으로 1회 fallback
- 잘못된 access key → 401
- health/configured
- cross-origin → 403
- 잘못된 direction → 400
- JA→KO에 verify 요청 → 400
- 빈 text → 400
- 4,000자 초과 → 413
- 허용되지 않은 HTTP method → 405

## 3. 정적 문법/구성

- 전체 JS/MJS: **39 files `node --check` PASS**
- `netlify.toml`: Python `tomllib` parse PASS
- 운영자 HTML: HTML parser PASS
- CSP / no-store / noindex / frame deny 설정 포함
- `robots.txt`: `/operator/`, `/operator-translate` 제외

## 4. 운영자 UI 테스트

Playwright + Chromium 정적 렌더 검수:

- 390px: horizontal overflow **0**
- 1440px: horizontal overflow **0**
- Locked: auth visible / workspace hidden PASS
- Unlocked: auth hidden / workspace visible PASS

상호작용 mock API 테스트:

- access key health → unlock PASS
- 일본어 입력 → debounce 후 한국어 자동번역 PASS
- 동일 문장 manual 재실행 → 중복 API 요청 방지 PASS
- 한국어 입력 → 일본어 번역 + 역번역 PASS
- Lock → session 종료 UI PASS

검수 화면:

- `Verification_V7_3_1/390_locked.png`
- `Verification_V7_3_1/390_unlocked.png`
- `Verification_V7_3_1/1440_locked.png`
- `Verification_V7_3_1/1440_unlocked.png`

## 5. 실제 외부환경에서 아직 수행하지 않은 것

다음은 사용자 계정 secret/Production 환경이 필요하므로 성공했다고 처리하지 않았습니다.

- 실제 `DEEPL_API_KEY`를 이용한 live 번역 요청
- DeepL 실제 과금/Free quota 동작
- Netlify Production 배포
- Netlify Production 환경변수 적용 확인
- 실제 Tawk 고객 대화 복사/전송
- Tawk AI Assist 계정 설정 변경
- PayPal Sandbox/Live 실거래

배포 후 `TRANSLATOR_V7_3_1_SETUP.md`의 순서로 실제 DeepL 문장 2~3개만 최종 확인하면 됩니다.
