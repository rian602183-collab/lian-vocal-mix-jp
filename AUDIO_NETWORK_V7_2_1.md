# V7.2.1 Audio Network 검증 기록

검토일: 2026-09-13. 이 문서는 `work/v721-tests/audio-network.mjs`, `work/v721-tests/audio-network/RESULTS.json`, `work/v721-tests/AUDIO_NETWORK_RUN.txt`에 기록된 **실제 공개 MP3 응답**을 분석한 결과입니다. MP3를 재인코딩하거나 바이트·경로·preload 값을 변경하지 않았습니다.

## 결론

메타데이터 용도로 시작된 **8개 요청 / 서로 다른 7개 MP3**가 관측됐고, 모든 음원은 일시 정지 상태와 `currentTime = 0`을 유지했습니다. 숨겨진 탭의 음원도 부분 데이터를 요청합니다. Hero와 Portfolio가 함께 사용하는 대표 음원은 캐시를 끈 이번 검사에서 **같은 URL로 2번 요청**됐습니다. 따라서 “첫 방문에 숨긴 음원 요청 없음” 또는 “중복 요청 0건”은 충족했다고 보고하지 않습니다.

요청은 모두 `Range: bytes=0-`, 응답은 `206 Partial Content`였습니다. 그러나 Content-Range는 파일 처음부터 끝까지의 범위이고, **작은 고정 범위만 요청한 것은 아닙니다.** 브라우저가 읽기를 중단한 결과를 “서버가 메타데이터 몇 KB만 전송했다”라고 해석하면 안 됩니다.

아래 두 계측값은 서로 다릅니다. `dataLength` 합계 약 1.05MB만으로 실제 전송량이 1MB라고 단정할 수 없습니다. `encodedDataLength` 합계는 11.16~19.97MB로 훨씬 크며, 설정한 속도와 관측 시간에서 예상되는 합계도 초과합니다. **읽기 전용 HTTP 동작 검증은 수행했지만, 이 실행을 실제 휴대전화 4G 통신량·로딩 성능의 정량 합격 증거로 사용하지 않습니다.**

## 검사 방식과 범위

| 항목 | 설정 |
|---|---|
| 브라우저 | 설치된 Google Chrome headless + Playwright/CDP |
| 화면/언어 | 390×700, ja-JP; Android 실기기 또는 Android UA로 가장한 검사는 아님 |
| 캐시 | 각 실행 새 context, CDP cacheDisabled=true, Service Worker 차단 |
| 동작 | 첫 페이지 GET 후 DOMContentLoaded부터 12초 대기. 재생·탭 클릭·폼 POST 없음 |
| 외부 서비스 | Tawk 등 외부 스크립트는 테스트용 빈 응답으로 대체. Netlify Functions는 테스트용 응답으로 차단 |
| Production 모드 | 공개 운영 페이지와 정적 파일을 실제 GET. 해당 MP3 요청은 route.continue로 실제 Netlify에 전달 |
| 후보 모드 | 후보 V7.2.1 HTML/CSS/JS는 로컬 파일로 응답, MP3는 운영 사이트에서 실제 GET |

후보 모드는 **로컬 V7.2.1 문서 + 실제 운영 음원**의 조합입니다. V7.2.1을 Production에 올려 측정한 것이 아니며, 후보 HTML/CSS/JS 배포·다운로드 속도도 포함하지 않습니다. Tawk·리뷰 Functions 실제 성능이나 계정 동작은 이 검사 대상이 아닙니다.

| 시뮬레이션 이름 | 지연 | 다운로드 | 업로드 |
|---|---:|---:|---:|
| 4G-simulation | 60ms | 500,000 B/s = 4.0Mbps | 125,000 B/s = 1.0Mbps |
| Slow-4G-simulation | 150ms | 200,000 B/s = 1.6Mbps | 93,750 B/s = 0.75Mbps |

이 이름은 스크립트에서 정한 CDP 프로필 이름입니다. 특정 통신사나 Chrome의 모든 버전에 동일한 기본 프리셋이라는 뜻이 아닙니다. CPU 지연이나 실제 모바일 전파·패킷 손실을 재현하지 않았습니다.

## 기록된 수치

| 대상 / 프로필 | 관측 시간 | MP3 요청 / 고유 파일 | dataLength 합계 | encodedDataLength 합계 | 자동 재생 |
|---|---:|---:|---:|---:|---|
| 운영 / 4G | 14.632초 | 8 / 7 | 1,056,037 B | 14,726,417 B | 없음 |
| 운영 / Slow 4G | 17.732초 | 8 / 7 | 1,057,725 B | 17,140,931 B | 없음 |
| 후보+운영 음원 / 4G | 12.167초 | 8 / 7 | 1,053,948 B | 11,155,755 B | 없음 |
| 후보+운영 음원 / Slow 4G | 12.156초 | 8 / 7 | 1,055,192 B | 19,967,827 B | 없음 |

관측 시간은 페이지 진입 시작부터 결과 수집까지입니다. DOMContentLoaded 전 소요 시간과 그 후 12초 대기를 포함하므로, 이 숫자를 로딩 완료 시간·LCP·재생 시작 지연으로 쓰지 않습니다. 후보와 운영의 전체 페이지 전달 경로가 다르므로 이 표에서 “후보가 더 빨라졌다”라고 결론 내리지 않습니다.

각 실행의 8개 음원 모두 `preload="metadata"`, `paused=true`, `currentTime=0`, 유효한 duration이 기록됐습니다. 4개 숨김 음원은 `visible=false`였으며 재생하지 않았습니다. 이 visible 필드는 DOM의 사각형 존재 여부이고, 스크롤상 화면 안에 들어왔는지를 뜻하지는 않습니다.

### 대표적인 Range 응답

대표 음원 `01_solo_dakara_boku_wa_ongaku_wo_yameta.mp3`:

```text
Request: Range: bytes=0-
Response: 206
Content-Range: bytes 0-9755563/9755564
Content-Length: 9755564
```

나머지 음원도 같은 형태로 0부터 마지막 바이트까지를 응답 범위로 제시했습니다. 모든 요청은 `finished=false`, `net::ERR_ABORTED`로 관측됐습니다. duration을 읽고 재생하지 않은 상태의 중단 기록이며 HTTP 서버 오류 응답은 아닙니다. 다만 이 기록만으로 요청의 모든 하위 네트워크 버퍼가 몇 바이트까지 받았는지 또는 짧은 음원 파일의 전송이 물리적으로 전혀 완료되지 않았는지를 확정하지 않습니다.

## 계측값을 해석할 때의 한계

CDP는 `Network.dataReceived.dataLength`를 데이터 청크 길이, `encodedDataLength`를 실제 수신 바이트로 구분합니다. 스크립트의 `totalBodyBytes`/`bodyBytes`는 전자의 합계입니다. 실제 파일 전체 크기나 후자의 합계와 같은 지표가 아닙니다. 요청이 정상 완료되지 않아 `loadingFinished.encodedDataLength` 최종 합계도 없습니다. [CDP Network 공식 정의](https://chromedevtools.github.io/devtools-protocol/tot/Network/#event-dataReceived)

예를 들어 후보 Slow 4G의 관측 시간 12.156초 × 200,000B/s는 약 2.43MB지만, encoded 이벤트 합계는 약 19.97MB입니다. 운영 4G도 시간×속도로 계산한 약 7.32MB보다 encoded 합계 14.73MB가 큽니다. 따라서 설정 값을 실제 회선 수준에서 검증된 엄격한 전송 상한으로 볼 수 없습니다.

Chromium의 공식 네트워크 throttle 구현 설명은 실제 네트워크 작업 후 클라이언트 콜백을 지연하는 구조를 명시합니다. 버퍼링 및 계측 단계의 차이는 이 수치 차이에 대한 **가능한 설명**입니다. 이 실행에서 정확한 원인을 별도로 분리 측정한 것은 아닙니다. 테스트 route interception의 영향도 완전히 배제하지 못하지만, 음원 자체는 route.fetch/fulfill로 대체하지 않았으므로 “interception이 throttle을 우회했다”고 확정하지 않습니다. [Chromium throttle 구현 주석](https://chromium.googlesource.com/chromium/src/+/refs/tags/142.0.7420.3/services/network/throttling/throttling_network_interceptor.h)

HTML 표준의 preload는 브라우저에 대한 힌트입니다. 따라서 `metadata` 보존은 필요하지만 고정된 바이트 수, 숨김 탭의 무요청, 브라우저 간 동일 캐시 동작을 보장하지 않습니다. [HTML Standard — preload](https://html.spec.whatwg.org/multipage/media.html#attr-media-preload)

## 요청 조건별 결과

| 사용자 확인 항목 | 판정 |
|---|---|
| MP3 7개 바이트/경로, audio 8개 metadata 유지 | 소스 보존 검사 대상. 상세 SHA-256은 SHA256_V72_V721.md 참조 |
| 7개 파일 전체를 처음부터 모두 다운로드하는지 | 7개 URL 모두 요청됨. 관측에서 전 요청 정상 완료는 없었으나 전체 통신량이 메타데이터 크기로 제한됐다는 보장은 없음 |
| 작은 metadata Range만 발생하는지 | **그대로 통과라고 할 수 없음**. 실제 Range는 bytes=0-이며 서버 응답 범위는 EOF까지 |
| 숨김 탭 자동 재생 | 관측 없음. 모두 paused/currentTime=0 |
| 숨김 탭 다운로드 요청 | 발생함. metadata 준비에 따른 부분 읽기이며 숨김만으로 네트워크 요청이 없어지지 않음 |
| 같은 파일 중복 요청 없음 | **미충족**. 대표 음원 2개 audio 요소에 대해 같은 URL 요청 2건 |
| V7.2.1이 요청 수를 증가시켰는지 | 관측한 네 번의 실행에서는 운영/후보 모두 8건으로 동일 |
| 실제 4G/Slow 4G 성능 보장 | **미검증**. 프로필 지정 실험 결과이며 회선 수준 throttle 상한과 계측값의 차이 존재 |

7개 고유 파일의 원본 크기 합계는 **43,772,468바이트**입니다. 이번 요청당 청크 수치, encoded 이벤트 합계, 원본 총 크기는 서로 다른 값이므로 혼용하지 않습니다.

## 이번 버전의 조치와 운영 확인

오디오 원본 보존 요구에 따라 **재인코딩·음질 저하·src 지연 할당·preload 변경·Hero 음원 삭제를 하지 않았습니다.** 대표 음원의 중복 초기 요청은 운영 기준판에서도 같은 조건으로 재현된 기존 구조이며, 이번 polish에서 무리하게 오디오 구조를 바꾸지 않았습니다.

운영자가 최종 배포한 뒤에는 실제 Samsung Android/X 인앱 브라우저에서 캐시 켠 상태와 새 방문 상태를 각각 확인해야 합니다. 엄격한 전송량 검증이 필요하면 DevTools 청크 지표 외에 운영자가 통제하는 회선 제한·프록시 또는 브라우저 네트워크 로그로 한 번 더 측정해야 합니다. 오디오 지연 초기화 같은 구조 변경은 별도 작업으로 검토할 수 있지만 V7.2.1에서 자동 적용하지 않았습니다.

이번 작업은 공개 정적 파일의 읽기 전용 검사와 로컬 후보 검사입니다. **Production 배포, 실제 Tawk 운영 확인, Kakao/리뷰 상태 변경, 실제 문의 전송은 수행하지 않았습니다.**
