# V7.2.1 테스트 결과

생성 2026-09-13T01:12:47.125Z. Node v24.19.0, 설치된 Chrome headless. 기존309개 회귀를 재실행하고 신규141개를 추가해 **450/450 통과**했습니다. 이 숫자는 아래 논리 검사 수이며 화면 캡처·node --check·번들 검사를 더해 부풀리지 않았습니다.

| 검사 | 통과 | 증거(Verification ZIP의 work/v721-tests) |
|---|---:|---|
| 기존 frontend | 65/65 | results/RESULTS.json |
| 기존 refinement | 28/28 | refinement/RESULTS.json |
| 기존 날짜·Tawk·공개 리뷰 | 56/56 | supplemental/RESULTS.json |
| 기존 리뷰 실제 handler + 브라우저 | 23/23 | review-browser/RESULTS.json |
| 신규 모바일·카피·OG·접근성 | 108/108 | mobile/RESULTS.json |
| 신규 추가 요구·native POST·번역 허용 | 33/33 | extra/RESULTS.json |
| 기존 OAuth·conditional·동일 브라우저·fallback | 36/36 | SECURITY_RESULTS.txt |
| 기존 리뷰66 + Kakao30 | 96/96 | REVIEW_TEST_RESULTS.txt |
| 실제 SDK wire contract | 5/5 | BLOBS_WIRE_RESULTS.txt |

## 별도 검증

- node --check: 배포 소스 JS/MJS 16개 모두 통과(SYNTAX_CHECKS.json).
- 공식 @netlify/zip-it-and-ship-it 15.5.1, nodeBundler esbuild, nodeVersion22.x, 실제 설치된 @netlify/blobs10.7.13: 기존8개 서비스 handler + kakao-security helper =9개 로컬 ZIP 생성. BUNDLE_RESULTS.json. CLI 로그인·deploy·함수 호출은 없음.
- 처음 번들은 Windows sandbox 경로 권한 제한, 이어진 권한 시도는 자동 검토 사용량 제한으로 실행되지 않았습니다. 제한 시간 이후 정식 권한 재시도가 허용돼 최종 로컬 번들이 통과했습니다. 앞선 실패를 통과로 계산하지 않았습니다.
- 기존 파일 중 index/thanks 외에는 전부 바이트 일치. MP3 7개와12 server modules·lock 보존. SHA256_V72_V721.md 및 FILE_MANIFEST.json.
- OG1200×630, versioned URL, 최종 짧은 제목,300/360px 3유형 mock. OG_RENDER_RESULTS.json 및 OG_TITLE_COMPARISON_RESULTS.json.
- 마지막 DOM 대조에서도 audio src/preload8개, form의 모든 name/type/초깃값, canonical/hreflang, 리뷰5개 본문, Hero 제목, MIX POINT, 가격 숫자가 기준과 일치합니다(extra/FINAL_CONTENT.json).
- 같은390px 화면에서 FAQ 두 개를 연 비교는 전체 FAQ 높이1186.875px, single-open은1094px였습니다. 이전 답변이 누적되는 약93px를 줄이면서 다시 닫기와 키보드 동작을 유지해 모바일에 채택했습니다. extra/390-faq-*-comparison.png.

## 실제 실행 범위

브라우저 회귀는 모든 네트워크 요청을 로컬로 가로채고 dead proxy를 사용했습니다. 소스 HTML/CSS/JS는 실제 최종 파일입니다. Kakao/리뷰는 원래 handler와 CAS-capable memory store·알림 mock을 결합했습니다. conditional modified:false, concurrency/replay, expires, GET 무변경, explicitPOST, CSRF·cookie·origin·XSS·approved-only 검증을 유지했습니다. OAuth 브라우저 테스트는 GET form→POST→302→mock Kakao redirect→callback의 실제 Secure HttpOnly cookie 전달을 확인합니다.

고객 문의는 실제 native POST를 브라우저가 생성하고 로컬 route가 thanks HTML로 응답했습니다. 네트워크 대기 중 버튼/aria busy/중복 이벤트 차단, 기존 name 값, thanks 도착과 실제 뒤로 가기를 검사했습니다. 실제 Netlify의 Form 수신·후처리·리다이렉트 성공을 확인한 것으로 해석하지 않습니다. BFCache는 실제 뒤로 가기 외에 persisted pageshow 이벤트를 별도로 모의 실행했으며 해당 브라우저가 반드시 캐시에 저장했다고 주장하지 않습니다.

화면8종:360×800,390×844,412×915,390×700,360×720,768×1024,1280×720,1440×900. 메인8영역과 폼·확대·thanks/404를 캡처했습니다. 기본 글자 크기의5탭 한 줄·44px 목표·hash direct/click/back/forward·keyboard·sticky 위치를 검사했습니다. 200%는 computed font-size2배 근사이며 실제 Android 시스템 배율/브라우저 UI zoom 조작은 아닙니다. 물리 기기 safe area·키보드는 운영 확인 항목입니다.

Tawk는 API mock이며 일부 화면은60×60 launcher footprint를 사용합니다. 실제 cross-origin iframe 내부에 접근하지 않았습니다. 새 테스트는10초 이상 지연된 준비, 즉시 onLoad fallback 복구, 음원 카드 보호·CTA·최소화·폼 전환·thanks를 확인합니다. 실제 계정 설정·메시지 성공은 미검증입니다.

공개 HTML4개 모두 lang=ja 및 번역 차단 제거 확인. 관리자 OAuth 응답의 차단은 보호된 원본으로 남았습니다. 실제 Google 번역 서버 결과는 검증하지 않았고 자동 한국어 전환은 없습니다.

## 수정하며 발견한 문제

초기 mobile108 검사에서 취소된 submit 뒤 버튼 상태와200% MENU 넘침, 테스트가 hidden checkbox를 직접 클릭하던 문제가 발견됐습니다. 취소 복구는 전체 event dispatch 뒤 setTimeout으로 확인하고 header가 확대 시 줄바꿈하도록 수정했습니다. checkbox 검사는 실제 고객처럼 label을 클릭합니다. 시각 확인에서 PORTFOLIO 마지막 O가 혼자 줄바꿈돼 padding만2→1px로 조정했고, 정상 크기 textRange 한 줄 assertion을 추가했습니다. 늦은 Tawk 초기화는 기존2초 확인에 더해 onLoad에서 즉시 fallback을 지우도록 보완했습니다. 최종 재검사는 모두 통과했습니다.

기존309의 변경은 새 파일 경로, 사용자 요청에 따른 mini2→1, 새 OG 경로, 모바일 전용 CTA 추가에 맞춘 기존 Contact 버튼 locator뿐입니다. 세부 REGRESSION_ADAPTATIONS.md. 신규 OG test의 제목 기대값은300/360 비교에서 최종 선택한 짧은 제목으로 갱신했습니다. 보안 assertion은 완화하지 않았습니다.

## Audio 실제 HTTP 관측: 통과 숫자와 분리

운영 정적사이트와 로컬후보+운영MP3를4G/Slow4G CDP 프로필에서 각각 읽기 전용 GET했습니다. 총4회 모두8요청·7파일, paused/currentTime0. 대표파일 중복 요청과 숨김 audio 준비 요청이 있습니다. 응답206이지만 Range bytes=0-이고 EOF까지의 응답 범위입니다. 작은 metadata만 받았다는 요구를 충족했다고 주장하지 않습니다.

encodedDataLength11.16~19.97MB가 dataLength 약1.05MB와 다르며 프로필속도×관측시간 상한도 초과했습니다. 그래서 이 실행은 실제 휴대전화4G 정량 성능의 합격 증거가 아닙니다. 코드 회귀450 통과와 이 성능 주의사항을 별개로 표시합니다. 원본 재인코딩이나 preload 변경 없이 보존했습니다. 전체 측정·공식 근거·한계는 AUDIO_NETWORK_V7_2_1.md 및 audio-network/RESULTS.json.

## 운영자가 확인할 항목

Production 배포 후 Netlify Forms 알림·thanks, 기존 Kakao OAuth/리뷰 승인·거절, Tawk 설정·실제 launcher, 실제 앱 OG 캐시·카드, Chrome/Google Translate 사용자가 선택한 번역, Android/X 인앱 키보드와 회선 성능. 이번 작업에서 해당 성공을 주장하지 않습니다. 환경변수 변경 없음.
