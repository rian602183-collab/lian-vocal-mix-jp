import { getStore } from "@netlify/blobs";

const TOKEN_URL = "https://kauth.kakao.com/oauth/token";
const SEND_URL = "https://kapi.kakao.com/v2/api/talk/memo/default/send";

function html(title, body, ok = true) {
  return new Response(`<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
body{margin:0;background:#f6faff;font-family:Arial,"Noto Sans KR",sans-serif;color:#102d4b}
main{max-width:680px;margin:8vh auto;padding:48px 30px}
.card{background:#fff;border:1px solid #dbe8f4;border-radius:24px;padding:42px;box-shadow:0 20px 60px rgba(24,56,88,.07)}
.badge{display:inline-block;font-size:12px;font-weight:800;color:${ok ? "#2f80ed" : "#c0392b"};margin-bottom:12px}
h1{font-size:32px;margin:0 0 14px}
p{line-height:1.7;color:#60778d}
a{display:inline-block;margin-top:20px;padding:12px 18px;border-radius:999px;background:#102d4b;color:#fff;text-decoration:none;font-weight:800}
</style>
</head>
<body><main><div class="card"><div class="badge">${ok ? "KAKAO CONNECTED" : "KAKAO ERROR"}</div><h1>${title}</h1><p>${body}</p><a href="/">Lian Vocal MIX 홈으로</a></div></main></body>
</html>`, {
    status: ok ? 200 : 400,
    headers: { "content-type": "text/html; charset=utf-8" }
  });
}

async function sendTest(accessToken) {
  const siteUrl = process.env.PUBLIC_SITE_URL || "https://lian-vocal-mix.netlify.app/";
  const template = {
    object_type: "text",
    text: "✅ Lian Vocal MIX\n카카오톡 문의 알림 연동이 완료되었습니다.",
    link: {
      web_url: siteUrl,
      mobile_web_url: siteUrl
    },
    button_title: "사이트 열기"
  };

  const body = new URLSearchParams({
    template_object: JSON.stringify(template)
  });

  const res = await fetch(SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
    },
    body
  });

  const raw = await res.text();
  if (!res.ok) throw new Error(`Test message failed (${res.status}): ${raw}`);
  const parsed = JSON.parse(raw);
  if (parsed.result_code !== 0) throw new Error(`Test message failed: ${raw}`);
}

export default async function handler(req) {
  const url = new URL(req.url);
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (error) {
    return html("카카오 연동이 취소되었습니다.", errorDescription || error, false);
  }
  if (!code || !state) {
    return html("카카오 연동 정보가 부족합니다.", "인증 코드 또는 state 값이 없습니다.", false);
  }

  const clientId = process.env.KAKAO_REST_API_KEY;
  const clientSecret = process.env.KAKAO_CLIENT_SECRET;
  const redirectUri = process.env.KAKAO_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return html("서버 설정이 완료되지 않았습니다.", "Netlify 환경변수를 확인해 주세요.", false);
  }

  const store = getStore({ name: "lian-kakao-auth", consistency: "strong" });

  const stateKey = `oauth-state-${state}`;
  const stateData = await store.get(stateKey, { type: "json" });

  if (!stateData) {
    return html("인증 요청이 만료되었거나 올바르지 않습니다.", "카카오 연결을 처음부터 다시 시작해 주세요.", false);
  }

  const age = Date.now() - Number(stateData.createdAt || 0);
  await store.delete(stateKey);

  if (age < 0 || age > 10 * 60 * 1000) {
    return html("인증 요청이 만료되었습니다.", "10분 이내에 카카오 연결을 다시 진행해 주세요.", false);
  }

  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code
  });

  if (clientSecret) tokenBody.set("client_secret", clientSecret);

  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
    },
    body: tokenBody
  });

  const tokenRaw = await tokenRes.text();
  if (!tokenRes.ok) {
    return html("카카오 토큰 발급에 실패했습니다.", tokenRaw, false);
  }

  const token = JSON.parse(tokenRaw);
  if (!token.refresh_token || !token.access_token) {
    return html("카카오 토큰 정보가 부족합니다.", "Refresh Token 또는 Access Token이 발급되지 않았습니다.", false);
  }

  await store.set("refresh_token", token.refresh_token);
  await store.setJSON("token-meta", {
    connectedAt: new Date().toISOString(),
    refreshTokenExpiresIn: token.refresh_token_expires_in ?? null,
    scope: token.scope ?? null
  });

  try {
    await sendTest(token.access_token);
  } catch (err) {
    console.error(err);
    return html(
      "카카오 계정 연결은 완료되었습니다.",
      "Refresh Token 저장은 완료되었지만 테스트 메시지 전송에 실패했습니다. talk_message 권한과 카카오톡 메시지 설정을 확인해 주세요.",
      false
    );
  }

  return html(
    "카카오톡 문의 알림 연동 완료",
    "Refresh Token이 안전하게 저장되었고, 나와의 채팅으로 테스트 메시지를 보냈습니다. 이제 사이트 문의가 접수되면 카카오톡 알림을 받을 수 있습니다."
  );
}
