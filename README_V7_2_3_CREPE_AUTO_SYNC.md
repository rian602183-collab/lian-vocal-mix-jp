# V7.2.3 CREPE stats auto-sync

CREPE public page: https://crepe.cm/ko/@SpjlauYz/af2p07a3

Only the top CREPE summary counters were changed.

- `CREPE実績`
- `CREPEレビュー`
- `CREPE平均納品`

The browser reads `/.netlify/functions/crepe-stats` on load and every 30 minutes while the page remains open.
The Netlify Function fetches the public CREPE page only when its stored value is 30 minutes old or older, then caches the last successful result in Netlify Blobs store `lian-crepe-stats-v1`.

Safety/failure behavior:

- If CREPE is temporarily unavailable or its page cannot be parsed, the last successful value is kept.
- Before the first successful fetch, the existing verified values `10 / 9 / 5` remain visible.
- A failed request never changes the public counters to zero.
- No PayPal, Kakao, review, contact form, audio, pricing, or checkout logic was changed.

After this version is deployed once, normal CREPE counter changes do not require another site deployment. A page visit after the 30-minute cache window refreshes the stored counters automatically.
