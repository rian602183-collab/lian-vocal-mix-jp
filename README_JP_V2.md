# Lian Vocal MIX JP Standalone V2

## 이번 수정
- 일본 독립 사이트에서 CSS를 한 파일(`jp.css`)로 합쳤습니다.
- `assets/css/style.css`가 빠져도 헤더/네비가 기본 링크처럼 깨지는 문제가 생기지 않습니다.
- Chrome이 일본어 페이지를 자동으로 한국어 번역해서 보이던 현상을 막기 위해 notranslate 메타를 추가했습니다.
- 한국 사이트와는 완전히 별도 관리합니다.

## GitHub에 올릴 때
기존 일본 저장소의 파일을 V2 내용으로 교체하세요.
특히 다음 파일은 반드시 업로드:
- index.html
- jp.css
- jp.js
- thanks.html
- assets/
- netlify/
- netlify.toml
- package.json

`assets/css/style.css`는 V2에서는 필요하지 않습니다.

## 정상 화면 확인
배포 후 첫 문구가 일본어로:
`歌ってみたを、もっと綺麗に。`
라고 보여야 합니다.
