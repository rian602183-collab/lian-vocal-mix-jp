# Lian Vocal MIX JP V7.2.4 — CREPE Live Sync hardening

기준: `Lian_Vocal_MIX_JP_V7_2_3_CREPE_AutoSync_WORKCOPY(2).zip`

공개 CREPE 타입 페이지 `https://crepe.cm/ko/@SpjlauYz/af2p07a3`에서 다음 3개 값만 자동 반영합니다.

- `CREPE実績`: 프로필의 `총 작업 수`를 우선 사용
- `CREPEレビュー`: 타입의 후기 개수
- `CREPE平均納品`: `평균 작업물 전달 시간`을 원래 단위 그대로 일본어로 표시 (`分 / 時間 / 日 / 週間`)

## 자동 갱신 구조

1. 공개 사이트는 `/.netlify/functions/crepe-stats`만 호출합니다. 브라우저에서 CREPE로 직접 요청하지 않습니다.
2. 공개 endpoint는 5분 이내의 정상 캐시가 있으면 CREPE를 다시 호출하지 않습니다.
3. 별도 Scheduled Function `crepe-stats-refresh`가 Production에서 10분마다 실행되어 방문자가 없어도 캐시를 갱신합니다.
4. 사이트가 열려 있을 때는 5분마다 endpoint를 확인하고, 탭 복귀 시 최소 1분 간격으로 다시 확인합니다.
5. CREPE 오류/타임아웃/HTML 변경/파싱 실패 시 마지막 정상값을 유지합니다. 첫 정상 동기화 전에는 기존 검증값 `10件 / 9件 / 5日`을 유지합니다.
6. 실패 직후 5분 동안은 방문 요청이 CREPE를 반복 호출하지 않도록 backoff 상태를 저장합니다.

## V7.2.3 대비 강화 사항

- CREPE 실제 표기 순서인 `26건 총 작업 수` 같은 형태를 우선 파싱하고, 타입 통계의 별도 `작업 수`와 혼동하지 않습니다.
- 평균 전달 시간이 `10분`, `3시간`, `5일`, `1주`처럼 바뀌어도 `10日`처럼 잘못 표시하지 않고 원 단위를 유지합니다.
- HTML script/style 내용과 화면 텍스트를 분리하여 오탐 가능성을 줄였습니다.
- 응답 크기/HTTPS/host/content-type/숫자 범위/후기>총작업수 등의 비정상 상태를 거부합니다.
- 이전 V7.2.3 Blob의 `avgDays` 캐시를 자동 마이그레이션합니다.
- 기존 정상값이 있는 상태에서 CREPE SSR/장애로 `0 / 0`이 잠깐 보이는 경우 정상값을 덮어쓰지 않습니다.
- public endpoint와 scheduler가 같은 파서·검증·last-known-good 로직을 사용합니다.

PayPal/Kakao/리뷰/문의폼/가격/오디오/Tawk 로직은 수정하지 않았습니다.
