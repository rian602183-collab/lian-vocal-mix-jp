const TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
const USER_URL = 'https://kapi.kakao.com/v2/user/me';
const SEND_URL = 'https://kapi.kakao.com/v2/api/talk/memo/default/send';
const clip = (value, max) => { const chars = [...String(value ?? '')]; return chars.length > max ? chars.slice(0,max-1).join('') + '…' : chars.join(''); };

export function createKakaoReviewNotifier({ tokenStore, env = process.env, fetcher = fetch }) {
  async function request(url, options) {
    const response = await fetcher(url,{...options,signal:AbortSignal.timeout(4000)});
    if (!response.ok) throw new Error('Kakao request was not accepted.');
    try { return await response.json(); } catch { throw new Error('Kakao response was not valid.'); }
  }
  return async function notifyReview(review, links) {
    if (!env.KAKAO_REST_API_KEY || !/^\d+$/.test(String(env.KAKAO_ALLOWED_USER_ID || ''))) throw new Error('Kakao owner configuration is missing.');
    const origin = new URL(env.PUBLIC_SITE_URL || 'https://lian-vocal-mix-jp.netlify.app/').origin;
    for (const action of ['approve','reject']) {
      const url = new URL(links[action]);
      if (url.protocol !== 'https:' || url.origin !== origin || url.pathname !== '/.netlify/functions/reviews-moderate' || url.searchParams.get('action') !== action) throw new Error('Kakao confirmation link is invalid.');
    }
    // Reuse the exact store/key and refresh-token fallback from the existing
    // Kakao OAuth and mix-consultation notification implementation.
    const saved = await tokenStore.get('refresh_token',{consistency:'strong'});
    const refreshToken = saved || env.KAKAO_REFRESH_TOKEN;
    if (!refreshToken) throw new Error('Kakao is not connected.');
    const refreshBody = new URLSearchParams({grant_type:'refresh_token',client_id:env.KAKAO_REST_API_KEY,refresh_token:refreshToken});
    if (env.KAKAO_CLIENT_SECRET) refreshBody.set('client_secret',env.KAKAO_CLIENT_SECRET);
    const refreshed = await request(TOKEN_URL,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=utf-8'},body:refreshBody});
    if (typeof refreshed.access_token !== 'string' || !refreshed.access_token) throw new Error('Kakao access token is missing.');
    const profile = await request(USER_URL,{method:'GET',headers:{Authorization:'Bearer '+refreshed.access_token}});
    if (String(profile.id) !== String(env.KAKAO_ALLOWED_USER_ID)) throw new Error('Kakao account is not the allowed owner.');
    if (typeof refreshed.refresh_token === 'string' && refreshed.refresh_token) {
      const result = await tokenStore.set('refresh_token',refreshed.refresh_token);
      if (result?.modified !== true || !result.etag) throw new Error('Kakao token rotation could not be saved.');
    }
    const text = clip([
      '새 리뷰가 도착했습니다.',
      '활동명: '+clip(review.displayName,24),
      '곡명: '+clip(review.songTitle || '—',30),
      '평점: '+'★'.repeat(review.rating),
      review.consent ? '사이트 공개 동의함' : '공개 미동의 — 승인 불가',
      '사이트 익명 표시: '+(review.anonymousDisplay === true ? '사용' : '사용하지 않음'),
      '의뢰 회차: '+(review.orderCount === 5 ? '5회 이상' : (Number.isInteger(review.orderCount) && review.orderCount >= 1 && review.orderCount <= 4 ? review.orderCount : 1)+'회차'),
      clip(review.body,100),
    ].join('\n'),200);
    const template = {
      object_type:'text',text,
      link:{web_url:links.approve,mobile_web_url:links.approve},
      buttons:[
        {title:'승인',link:{web_url:links.approve,mobile_web_url:links.approve}},
        {title:'거절',link:{web_url:links.reject,mobile_web_url:links.reject}},
      ],
    };
    const response = await request(SEND_URL,{method:'POST',headers:{Authorization:'Bearer '+refreshed.access_token,'Content-Type':'application/x-www-form-urlencoded;charset=utf-8'},body:new URLSearchParams({template_object:JSON.stringify(template)})});
    if (response.result_code !== 0) throw new Error('Kakao message result was not successful.');
  };
}
