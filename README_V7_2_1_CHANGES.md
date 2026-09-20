# Lian Vocal MIX JP V7.2.1 — 최종 변경 보고서

검증일 2026-09-13. 이 문서는 이번 버전의 기준 보고서입니다. 함께 보존한 V7.0~V7.2 문서는 과거 버전 기록이며 현재 테스트 결과는 TEST_RESULTS_V7_2_1.md를 확인합니다.

## 1. 기준과 작업 범위

운영자가 사용한 최신 V7.2 폴더(D:/리안 사이트/일본판/1/Lian_Vocal_MIX_JP_V7_2_JP_User_Feedback)를 기준으로 package-lock.json까지 보존했습니다. .netlify, node_modules, Git 내부 폴더는 배포 결과물에 포함하지 않았습니다. 공개 운영 jp-v72.css는 기준과 일치했고, index.html 차이는 Netlify가 form을 후처리한 한 줄뿐이었습니다(action /thanks, data-netlify/honeypot 속성 처리). 원본의 native form 선언은 배포 입력에 유지했습니다.

이번 결과는 로컬 수정·검증·ZIP입니다. GitHub Push, Production 배포, Kakao/Tawk 관리자 변경, 실제 메시지·문의 전송, PayPal 활성화는 수행하지 않았습니다. 사용자가 이전 V7.2 운영 흐름을 검증한 사실과 이번 로컬 회귀 결과는 구분합니다.

## 2. 모바일에서 달라진 점

- 700px 이하에서 PORTFOLIO/PRICE/GUIDE/REVIEWS/CONTACT 5개 탭이 한 화면에 표시됩니다. 정상 크기에서 PORTFOLIO도 한 줄, 최소 터치 높이44px입니다. 가로 스와이프 안내를 숨겼습니다.
- 기준판의 CONTACT 오른쪽 끝 x=464px는 360px에서104px, 390px에서74px 밖에 있었습니다. 최종판은 요청한 모든 화면에서 탭과 페이지 가로 넘침이 없습니다.
- 모바일 탭 막대는 약85.39→60px, 막대 아래 section-head 간격은34→20px입니다. H2 위치는 약231→191px로 정돈됐습니다. 기존 스크롤 함수는 그대로 두고 실제 sticky 높이를 이용합니다. 음원 위치나 Hero 구성은 옮기지 않았습니다.
- Hero H1 1.25, 본문1.74, 섹션 제목1.27, 리뷰1.8의 행간과 strict 일본어 줄바꿈을 적용했습니다. 문구 일부를 의미 단위로 묶고 기존 본문 글자 크기를 보존했습니다. 200% 글자 확대 근사 검사에서도 주요 입력·탭·버튼에 접근할 수 있습니다.
- 모바일 내부 견적은 납기 입력 뒤1개, 데스크톱은 기존 오른쪽 ESTIMATE 카드만 표시합니다. 계산과 hidden 알림 필드는 그대로입니다.
- Portfolio/Guide 서브탭의 ArrowLeft/Right/Home/End, roving tabindex, tabpanel 연결을 추가했습니다. FAQ는 native details를 유지하며 모바일에서 한 개씩 열립니다. 지원하지 않는 브라우저는 일반 details로 사용할 수 있고 데스크톱은 여러 개를 열 수 있습니다.
- thanks는360/390px에서 제목·버튼·X·상담 접근을 확인했고, 별도의 noindex 404와 공개 루트만 담은 sitemap/robots를 추가했습니다.

## 3. 주요 일본어 문구와 문의 흐름

| 영역 | 최종 표현 / 동작 |
|---|---|
| 일반 납기 | Solo：1週間以内 / Duet：2週間以内 / Group / Chorus：1週間〜1か月 |
| 급행 | 48時間以内 +30%、当日納品 +50%。예약 상황 확인 후 안내 |
| 비공개 | サンプル・ポートフォリオ完全非公開 +¥2,000。掲載候補となる場合は事前にご案内します |
| DELUXE | ダブル・ハモリ・アドリブの基本整理 |
| 추가 옵션 | 基本範囲を超える多数のハモリ・コーラス / 基本範囲を超えるダブル・アドリブの追加整理 |
| 리뷰 | CREPEで実際にいただいたレビューの一部… / 専用リンクからご記入… / サイト経由でいただいたレビュー |
| 통계 | 10件 CREPE実績 / 9件 CREPEレビュー / 5日 CREPE平均納品 |
| 연락처 | 返信可能な連絡先をどちらか1つご入力ください。SNS 또는 email 중 하나 필수 |
| 오류 | X / SNS ID またはメールアドレスのどちらかを入力してください。role=alert와 aria-invalid |
| 희망일 | 希望日は確約ではありません。予約状況と作業内容を確認後、納期をご案内します。 |
| 가까운 날짜 | 급행 없음+2일 이내면 급행 옵션 안내만 표시. 자동 선택·요금 변경 없음 |
| 추가 트랙 | 기본 범위를 넘는 트랙 설명. 分からない場合は0のままで大丈夫です。音源確認後にご案内します。 |
| 전송 중 | 유효한 native POST가 시작되면 버튼 disabled/aria-disabled、form aria-busy、送信中… |

기존 sns_id/email 및 모든 Netlify name, honeypot, notification hidden 값은 유지했습니다. 견적 카드에만 옵션의 명확한 표시명을 사용합니다. maxlength는 artist_name100, sns_id300, email254, song_title300, reference_url/file_share_url2048, message8000입니다. 입력 길이 제한은 브라우저 UX이며 새로운 서버 보안 검증을 대신하지 않습니다. 기존 서버 clip은 바꾸지 않았습니다.

## 4. FAQ 최종 10개

### 1. 初めての依頼でも大丈夫ですか？

はい。必要なファイルや進め方から順番にご案内します。プランが分からない場合も、音源を確認しておすすめをご案内します。

### 2. スマホ録音でも依頼できますか？

可能です。ただし、周囲のノイズや部屋鳴り、録音レベルによって補正できる範囲が変わります。できるだけエフェクトのかかっていない原音をお送りください。

### 3. 録音データはどの形式で送ればいいですか？

WAV（48kHz / 24bit / Mono）を推奨しています。できるだけエフェクトのかかっていないボーカル原音をお送りください。可能であれば、各トラックの開始位置をそろえて書き出してください。難しい場合は事前にご相談いただければ大丈夫です。

### 4. ピッチ・タイミング補正は料金に含まれますか？

はい。プランによって補正範囲が異なります。STANDARD以上ではより細かく整え、歌い方が不自然に変わりすぎないように作業します。

### 5. デュエット・グループも可能ですか？

可能です。2人から複数人のグループ・コーラスまで対応します。人数やトラック構成によって料金・納期が変わります。

### 6. 修正は何回までできますか？

3回まで無料です。4回目以降は +¥500 / 回となります。1回＝一度にまとめていただいた修正内容を1回として数えます。大きな方向変更、全差し替え、再録音後の大幅な差し替えなどは追加料金や納期変更の対象になる場合があります。

### 7. 納期はどれくらいですか？急ぎでもお願いできますか？

通常納期は楽曲・人数・トラック数・予約状況を確認してご案内します。目安としてSoloは1週間以内、Duetは2週間以内、Group / Chorusは1週間〜1か月程度です。48時間以内・当日納品をご希望の場合は、予約状況を確認のうえお急ぎオプションをご案内します。

### 8. 支払い方法はいつ案内されますか？

お見積り内容をご確認いただいた後に、利用可能なお支払い方法をご案内します。

### 9. レビューを書きたい場合はどうすればいいですか？

納品完了後に、こちらからレビュー専用リンクをお送りします。そちらからご感想をご記入いただけます。公開ページから直接投稿する形式ではありません。

### 10. キャンセル・返金について

作業開始後のキャンセルは進行状況に応じてご相談となります。こちらの都合で作業できない場合は全額返金します。ご依頼者様都合の場合は進行度により返金が制限される場合があります。

환불 비율·작업자 실수의 수정 횟수 처리 등 새 정책은 만들지 않았습니다. 기존 CREPE 리뷰5개 본문·날짜는 유지하고 오해를 낳던 作業期間 메타만 제거했습니다.

## 5. OG 이미지와 제목

기존의 크게 얇은 Lian 워드마크 중심 이미지를 작은 모바일 카드에서도 읽히는 굵은 일본어 서비스명2줄 중심으로 정리했습니다. white/icy blue/lavender/navy 계열과 작은 파형은 유지합니다. 새 파일은 assets/images/lian-og-jp-v721.png, 1200×630 PNG이며 기존 PNG는 그대로 남겼습니다. 렌더에는 로컬 Noto Sans JP를 사용했고 폰트 파일이나 외부 runtime 폰트를 추가하지 않았습니다.

선택한 og:title/twitter:title: **Lian Vocal MIX｜歌ってみたMIX依頼**. 300px mock에서 긴 후보가 두 줄 또는 말줄임이 되지만 짧은 후보는 큰 이미지 카드에서 한 줄로 전체 표시됩니다. ボーカルMIX는 이미지와 설명에 유지됩니다. 300/360px Kakao/OpenTalk형·X형·일반 공유형 비교와 선택 근거는 OG_SHARE_PREVIEW_V7_2_1.md에 있습니다. 실제 앱 공유·캐시 성공을 검증한 것은 아닙니다.

## 6. Tawk 코드와 관리자 설정 구분

코드: 공식 hideWidget/showWidget/maximize/isChatMaximized/onLoad/onChatMinimized만 사용합니다. 700px 이하에서 대표 음원 또는 thanks 카드가 보일 때 최소화 launcher를 일시 숨기고, 작은 사이트 상담 버튼으로 직접 열 수 있습니다. 카드에서 벗어나면 복구하되 기존 폼 보호가 작동 중이면 유지합니다. 사용자가 연 채팅은 강제로 닫지 않습니다. VisualViewport 변화를 확인하고 늦은 onLoad에서 메인/thanks fallback을 즉시 지웁니다. 기존2초 후속 확인도 보존합니다. iframe 내부 DOM/CSS는 건드리지 않습니다.

운영자가 직접 할 일: 작은 원형 mobile icon, Bottom Right, Japanese, Pre-Chat OFF, preview/attention/방문 자동 알림 OFF, Basic - Widget Maximized에 사용자 지정 첫 안내와 Suggested Messages3개를 설정합니다. Trigger Agent’s Name과 Alias Lian을 따로 확인하고 남은 Customer Support 표시를 실제 모바일에서 점검합니다. 고정 시스템 라벨은 우회하지 않습니다. 정확한 공식 경로·제약은 TAWK_V7_2_1_SETUP.md를 따릅니다.

## 7. 번역 허용

index.html/thanks.html의 translate="no", class="notranslate", google notranslate meta를 제거했습니다. 공개 고객 HTML4개(index, thanks, review/index, 404)를 전부 검사했고 모두 lang="ja"이며 번역 차단이 없습니다. 사이트에서 한국어로 자동 전환하거나 Google 번역 스크립트·쿠키를 추가하지 않았습니다. 사용자 브라우저의 일본어→한국어 선택에 맡깁니다. Chrome 번역 UI를 실제로 눌러 외부 번역 결과까지 검사한 것은 아닙니다.

전체 코드 검색에서 남은 notranslate는 **관리자 전용 kakao-oauth-callback.mjs 응답** 한 곳입니다. 공개 고객 페이지가 아니며, 기존 보안 함수 바이트 보존 범위에 따라 수정하지 않았습니다.

## 8. 변경·추가 파일과 보호 범위

변경한 기존 파일: index.html, thanks.html만 해당합니다. 추가: jp-v721.css, jp-v721.js, 404.html, robots.txt, sitemap.xml, assets/images/lian-og-jp-v721.png 및 이 버전 문서6개입니다. 전체 경로·SHA-256은 SHA256_V72_V721.md에 있습니다.

모든 기존 CSS/JS(jp.js, jp-v72.js 포함), review 폴더 전체, Netlify server module12개, netlify.toml, package.json/package-lock.json, MP3 7개, 기존 OG·문서를 그대로 보존했습니다. 가격 LIGHT4000/STANDARD5500/DELUXE6500〜, GROUP12명STANDARD29000, 추가 트랙500, 기본 옵션1000〜, 비공개2000, 급행30%/50%, 수정3회·이후500을 유지합니다. audio8개의 src와 metadata, 상호 정지, Before/After 동기화도 유지합니다.

OAuth signed state·nonce·modified/ETag·cookie/origin, allowed user/admin secret, review HMAC·expires·one-time-use·GET 무변경·explicit POST·approved-only·XSS textContent 구조에 변경이 없습니다.

## 9. 테스트와 확인이 남은 항목

**기존309 + 신규141 = 450/450 검사 통과**, 별도 node --check 16개, 공식 Netlify local esbuild 번들9개(서비스 handler8개와 기존 helper1개) 통과. 상세는 TEST_RESULTS_V7_2_1.md 및 Verification ZIP의 원본 결과를 확인합니다.

음원 성능은 별도 주의사항입니다. 읽기 전용 실서버 Range 응답에서 운영/후보 모두8요청·7파일, 대표 음원 중복2요청이 확인됐습니다. 모두 paused였으나 Range가 bytes=0-이고 작은 metadata 바이트만 전송된다는 보장은 없습니다. encoded 계측11.16~19.97MB와 약1.05MB 청크 합은 서로 다릅니다. 프로필 상한과 계측 차이로 실제4G 성능 합격을 주장하지 않습니다. 원본43,772,468B와 metadata를 보존했고 구조 변경은 자동 적용하지 않았습니다. AUDIO_NETWORK_V7_2_1.md를 확인합니다.

## 10. 환경변수와 배포 전 체크리스트

**추가·변경 환경변수 없음.** 기존 Netlify 환경변수와 Kakao Developers Product Link/Web Domain/redirect 설정을 유지합니다. 기존 REVIEW_SYSTEM_SETUP.md와 KAKAO_SETUP.md를 그대로 포함했습니다.

- [ ] 사이트 ZIP을 새 폴더에 풀고 index.html, package-lock.json, netlify.toml, netlify/functions와 새 PNG/CSS/JS가 루트 기준으로 함께 있는지 확인
- [ ] Verification ZIP은 배포하지 않고 SCREENSHOTS.html과 보고서 검토
- [ ] 기존 Netlify project/환경변수/Blobs store와 Functions 빌드 설정 유지. 사용자 승인 후 사용자가 직접 배포
- [ ] 배포 후360/390px 및 실제 Samsung Android/X 인앱의 헤더·탭·오디오·키보드·폼·thanks를 확인
- [ ] 실제 문의1건의 Netlify 수신→thanks→기존 알림을 확인하고 중복 제출이 없는지 확인
- [ ] 기존 OAuth/리뷰 초대→pending→GET확인→POST승인/거절→approved공개를 운영자가 smoke test. GitHub/HTML수정·재배포 없이 개별리뷰 처리하는 기존구조 유지
- [ ] Tawk 관리자 설정과 launcher/직접열기/첫 안내3버튼/Customer Support 잔여 표시를 실계정 확인
- [ ] 실제 브라우저에서 일본어 원문을 확인한 뒤 사용자가 한국어 번역을 선택해 메인/thanks 표시 점검
- [ ] 새 OG URL200 응답·실제 Kakao/OpenTalk/X 카드 확인. 필요시 운영자가 OG캐시 초기화
- [ ] 오디오 중복/전송량은 실제 회선과 브라우저 캐시 조건에서 추가 계측
- [ ] 기존 일본판 canonical/hreflang 유지. 한국판에서 reciprocal hreflang은 발견하지 못했으므로 양방향 SEO가 완성됐다고 간주하지 않음

## 今後確認する運用・法務項目

Privacy Policy/거래 표시 필요 여부와 실제 운영자 정보, 연락처, 결제사업자, 보관 기간·제3자 처리, 적용할 환불·법률 조건은 운영자가 확정해야 합니다. 제공되지 않은 실명·주소·전화·사업자 정보나 법적 조건을 추측해 페이지를 만들지 않았습니다.
