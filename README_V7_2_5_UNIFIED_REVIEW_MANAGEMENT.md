# Lian Vocal MIX JP V7.2.5 — Unified Review Management

기준: `Lian_Vocal_MIX_JP_V7_2_4_CREPE_LiveSync_Final.zip`

V7.2.5는 CREPE 자동 통계와 사이트 자체 리뷰 시스템을 하나의 공개 집계 및 관리자 흐름으로 연결합니다.

## 공개 사이트

- 상단 리뷰 숫자를 `CREPEレビュー` 단독 수치가 아니라 `レビュー合計`으로 변경했습니다.
- 합계는 **CREPE 후기 수 + 사이트에서 승인되어 실제 공개 중인 리뷰 수**입니다.
- 바로 아래에 `CREPE n件 + SITE n件` 출처별 수치를 표시합니다.
- 리뷰 탭에도 `CREPE n件 · SITE n件 · 合計 n件` 요약을 표시합니다.
- CREPE는 기존 V7.2.4 LiveSync의 last-known-good/fallback을 그대로 사용합니다.
- 사이트 리뷰는 `reviews-public`에서 공개 가능한 승인 리뷰만 집계합니다. 숨김/대기/거절/공개 미동의 리뷰는 합계에서 제외합니다.
- 리뷰 탭에서 사이트 리뷰를 다시 읽으면 상단 합계도 즉시 동기화합니다. 기본 폴링은 CREPE/사이트 리뷰 모두 5분, 리뷰 탭 자체는 기존 60초 갱신을 유지합니다.

## 통합 관리자

`/.netlify/functions/reviews-admin`에서 CREPE와 사이트 리뷰를 함께 관리합니다.

- 30분 관리자 세션: Secure / HttpOnly / SameSite=Strict
- 관리 변경 POST: 세션 기반 CSRF 검증
- CREPE: 작업 수, 후기 수, 평균 납기, 동기화 상태, 수동 새로고침
- 사이트 리뷰: 승인 대기 / 사용 전 초대 / 승인 완료 / 거절·취소 전체 목록
- 초대: 생성 / 재발급 / 취소
- 대기 리뷰: 승인·거절 확인 링크 / 링크 재발급 / Kakao 재알림
- 승인 리뷰: 사이트에서 숨김 / 다시 표시 / 승인 취소 후 재검토
- 거절 리뷰: 공개 동의가 있는 경우 재검토
- 관리자 화면에서도 `CREPEレビュー`, `サイトレビュー`, `レビュー合計`을 함께 표시

영구 삭제는 제공하지 않습니다. 리뷰 운영 이력을 보존하면서 공개 상태만 안전하게 변경합니다.

## 공개 API 호환성

`/.netlify/functions/reviews-public`은 기존 `reviews` 배열을 그대로 유지하면서 다음 요약을 추가합니다.

```json
{
  "reviews": [],
  "summary": { "approved": 0 }
}
```

기존 클라이언트는 `reviews`만 사용해도 그대로 동작합니다.

## 보존 범위

PayPal, 가격 계산, 문의폼, Kakao OAuth/토큰, Tawk, 오디오, 포트폴리오, CREPE 파서 및 Scheduled Function 자체는 변경하지 않습니다. 리뷰 관리자에 CREPE 조회를 주입하고, 공개 리뷰 집계·UI만 연결합니다.
