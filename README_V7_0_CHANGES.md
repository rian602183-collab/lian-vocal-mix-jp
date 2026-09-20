# Lian Vocal MIX JP V7.0 — 변경 내역

> V7.0 당시의 변경 기록입니다. 아래의 GET 405 및 PowerShell 연결 설명, 기존 보안 mock 테스트 결과는 V7.0.1에서 수정·재검증했습니다. 현재 연결 절차와 정확한 시험 범위는 README_V7_0_1_CHANGES.md 및 KAKAO_SETUP.md를 우선 확인하세요.

기준 버전은 Lian_Vocal_MIX_JP_Standalone_V6_3_Audio_Metadata.zip입니다. V6.3의 흰색·파랑·보라 계열 디자인, 일본어 카피, 가격표, 리뷰, 포트폴리오, Netlify Form 이름, Gmail/Naver 알림 흐름, Kakao 알림 흐름, Tawk 위젯, X 링크, MP3 파일은 유지하고 확인된 기능·보안 문제만 수정했습니다.

이번 결과물은 코드와 ZIP만 제공합니다. GitHub push, Netlify 배포, 공개 운영 사이트 수정은 수행하지 않았습니다. 원본 ZIP도 수정하지 않았습니다.

## 수정한 기능

- Kakao OAuth 시작 함수를 POST 전용으로 변경했습니다. GET 직접 호출은 405로 거부하고, KAKAO_ADMIN_SECRET을 POST body로 검증합니다.
- timestamp·nonce·HMAC 서명을 포함한 state를 만들고, 10분 만료·서명·HttpOnly 브라우저 쿠키·Netlify Blob 기록을 callback에서 확인합니다.
- 동일 nonce의 동시 재사용을 막기 위해 oauth-used- nonce marker를 onlyIfNew로 선점한 뒤 state를 삭제합니다.
- KAKAO_ALLOWED_USER_ID와 Kakao 사용자 정보 API의 ID가 정확히 일치할 때만 refresh token을 기존 lian-kakao-auth Blob에 저장합니다.
- Kakao 오류·외부 API 응답은 화면에 넣지 않고 미리 정의한 일본어 메시지만 표시합니다. 상세 상태는 서버 로그에만 남깁니다.
- Kakao 공개 URL fallback을 https://lian-vocal-mix-jp.netlify.app/으로 통일했습니다.
- GROUP 인원 입력은 입력 중 빈 값과 1·12·20 같은 중간값을 허용하고 change/blur 시점에만 최소 3명을 확정합니다.
- contact form의 hidden 상태에 컴포넌트 범위 display none을 적용하고 hidden, aria-expanded, 버튼 문구를 함께 동기화했습니다.
- fixed header와 sticky 탭 높이를 기준으로 패널 이동 offset을 계산하고 scroll-margin-top을 추가했습니다.
- #portfolio, #price, #guide, #reviews, #contact hash를 최초 로드·hashchange·뒤로가기·앞으로가기와 동기화했습니다.
- Before/After 오디오 재생 시 다른 쪽을 정지하고 현재 재생 위치를 맞춥니다. 숨겨진 패널의 오디오도 정지합니다.
- LIGHT·STANDARD·DELUXE 상담 버튼이 문의폼을 열고 해당 플랜을 자동 선택하도록 연결했습니다.
- 모바일 메뉴 링크를 누르면 aria-expanded, aria-label, open class가 닫힌 상태로 함께 돌아옵니다.
- Tawk 로딩이 실패하면 문의폼과 X로 연결되는 작은 안내를 표시합니다. 기존 Tawk iframe과 widget ID는 건드리지 않았습니다.
- 폼 label과 입력 id를 연결하고 견적 합계에 aria-live를 추가했습니다. 전체 접근성 리뉴얼이나 대규모 CSS 리팩터링은 하지 않았습니다.

## 수정 파일

- jp.js — hash/탭·스크롤·오디오·플랜 연결·모바일 메뉴·Tawk fallback·GROUP 입력 처리
- index.html — 탭 ARIA, 폼 label 연결, form wrapper id, 견적 aria-live, Tawk fallback 마크업
- jp.css — contact hidden 처리, 패널 scroll margin, fallback 스타일, field label 스타일
- netlify/functions/kakao-security.mjs — signed state, HMAC, nonce cookie 유틸리티
- netlify/functions/kakao-auth-start.mjs — 관리자 POST 전용 OAuth 시작
- netlify/functions/kakao-oauth-callback.mjs — state/cookie/nonce/허용 사용자 검증과 안전한 오류 화면
- netlify/functions/kakao-notify.mjs — 현재 일본 사이트 fallback 주소
- KAKAO_SETUP.md — V7 관리자 연결 및 환경변수 설정 절차

## 새 환경변수

기존 값은 유지합니다.

- KAKAO_REST_API_KEY
- KAKAO_REDIRECT_URI
- PUBLIC_SITE_URL
- KAKAO_REFRESH_TOKEN (기존 선택값)

V7.0에서 추가합니다.

- KAKAO_ADMIN_SECRET — 32자 이상 랜덤 관리자 비밀값
- KAKAO_ALLOWED_USER_ID — 토큰 저장을 허용할 소유자의 Kakao 사용자 ID

선택값:

- KAKAO_CLIENT_SECRET — Kakao 앱에서 활성화한 경우에만 설정

KAKAO_ADMIN_SECRET, KAKAO_ALLOWED_USER_ID, 실제 API 키와 토큰은 HTML·URL·소스 저장소에 넣지 마세요. 상세 절차는 KAKAO_SETUP.md를 확인하세요.

## 배포 전에 할 일

1. Netlify Production 환경에 환경변수를 설정합니다.
2. Kakao Developers의 Web domain과 Redirect URI를 현재 일본 사이트 주소로 맞춥니다.
3. POST 방식으로 관리자 OAuth 연결을 1회 수행하고 본인에게 테스트 알림이 오는지 확인합니다.
4. 기존 Netlify Form mix-consultation 제출, Gmail/Naver 알림, Kakao 알림, MP3 재생, Tawk 모바일 상담을 각각 확인합니다.
5. 모든 확인 후에만 사용자가 직접 배포합니다. 이번 작업에서는 배포하지 않았습니다.

## 테스트 결과

- JavaScript 및 4개 Netlify Function에 node --check 통과
- 관리자 secret 누락/오류, GET 거부, signed state 위조, 브라우저 nonce 불일치, state replay, XSS 문자열, 허용되지 않은 Kakao ID, 정상 owner ID를 포함한 security smoke test 통과
- 1280×720: PORTFOLIO·PRICE·GUIDE·REVIEWS·CONTACT 탭, 제목 위치, hash 동기화, form 열기/닫기 통과
- 768×1024: 5개 패널 제목이 sticky 탭 아래에 가려지지 않음
- 390×844 및 360×800: 5개 hash 패널, 모바일 메뉴 열기/링크 이동/닫기 상태, 가로 overflow 없음
- STANDARD·GROUP·12명 입력 유지 및 ¥29,000〜 계산 통과
- LIGHT·STANDARD·DELUXE 상담 버튼의 CONTACT 이동·form 자동 열기·플랜 자동 선택 통과
- Before 재생 후 After 재생 시 상호 정지·재생 위치 동기화, PRICE 전환 시 오디오 정지 통과
- Tawk 정상 위젯이 로드된 실제 페이지에서 fallback 숨김 확인
- Tawk script가 없는 임시 무위젯 fixture에서 클릭 및 10초 timeout fallback 표시 확인
- 원본 MP3 7개 SHA-256과 V6.3 동일, HTML audio 요소 8개 모두 preload metadata 유지

Tawk 자체의 운영 계정 상태, Netlify Form/Gmail/Naver/Kakao 외부 알림 전달은 로컬 테스트만으로 최종 보증할 수 없으므로 배포 전 실제 운영 환경에서 한 번 더 확인해야 합니다.

## V7.1로 넘긴 항목

- 환불·납기·추가 작업 문구의 운영 정책 확정
- 전체 탭 키보드 모델과 전면 접근성 리뉴얼
- 기존 CSS 중복의 대규모 정리
- Tawk 관리자 화면에서 모바일 자동 인사말 노출 빈도 조정

위 항목은 V7.0에서 가격, 정책, 콘텐츠를 임의로 바꾸지 않기 위해 건드리지 않았습니다.
