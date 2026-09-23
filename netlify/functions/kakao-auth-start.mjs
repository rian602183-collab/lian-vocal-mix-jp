import { getStore } from "@netlify/blobs";
import {
  createSignedState,
  oauthCookie,
  secretsMatch,
} from "./kakao-security.mjs";

const AUTHORIZE_URL = "https://kauth.kakao.com/oauth/authorize";
const STATE_TTL_MS = 10 * 60 * 1000;

function response(message, status, headers = {}) {
  return new Response(message, {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/plain; charset=utf-8",
      "x-robots-tag": "noindex, nofollow, noarchive",
      "referrer-policy": "strict-origin",
      ...headers,
    },
  });
}

function adminForm() {
  // Static HTML only: never reflect request URLs, posted values, or environment secrets.
  return response(`<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<title>Lian — 카카오 관리자 연결</title>
<style>
body{margin:0;background:#f6faff;font-family:system-ui,sans-serif;color:#102d4b}
main{box-sizing:border-box;max-width:520px;margin:10vh auto;padding:28px}
form{padding:28px;background:#fff;border:1px solid #dbe8f4;border-radius:20px}
h1{font-size:24px;margin:0 0 16px}p{line-height:1.6;color:#60778d}
label{display:block;margin:20px 0 8px;font-weight:700}
input{box-sizing:border-box;width:100%;padding:12px;border:1px solid #aac4dc;border-radius:8px;font:inherit}
button{margin-top:16px;padding:12px 18px;border:0;border-radius:999px;background:#315f8d;color:#fff;font:inherit;cursor:pointer}
a{color:#315f8d}
</style></head><body><main>
<form method="POST" action="/.netlify/functions/kakao-auth-start" autocomplete="off">
<h1>카카오 관리자 연결</h1>
<p>관리자 연결 비밀값을 입력한 뒤, 이 브라우저에서 소유자 카카오 계정으로 로그인해 주세요.</p>
<label for="admin-secret">관리자 연결 비밀값</label>
<input id="admin-secret" name="admin_secret" type="password" required minlength="32" autocomplete="off" spellcheck="false" autocapitalize="none">
<button type="submit">카카오 연결 시작</button>
</form><p><a href="/">사이트로 돌아가기</a></p>
</main></body></html>`, 200, {
    "content-type": "text/html; charset=utf-8",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self' https://kauth.kakao.com https://accounts.kakao.com; base-uri 'none'; frame-ancestors 'none'",
  });
}

async function readAdminSecret(req) {
  const body = await req.text();
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return String(JSON.parse(body)?.admin_secret || "");
    } catch {
      return "";
    }
  }
  return new URLSearchParams(body).get("admin_secret") || "";
}

export default async function handler(req) {
  if (req.method === "GET") return adminForm();
  if (req.method !== "POST") {
    return response("Kakao OAuth 연결은 관리자 POST 요청으로만 시작할 수 있습니다.", 405, {
      allow: "GET, POST",
    });
  }

  const requestUrl = new URL(req.url);
  const origin = req.headers.get("origin");
  if (origin && origin !== requestUrl.origin) {
    return response("허용되지 않은 요청입니다.", 403);
  }

  const adminSecret = process.env.KAKAO_ADMIN_SECRET || "";
  if (adminSecret.length < 32) {
    console.error("Kakao OAuth admin secret is missing or too short.");
    return response("카카오 연결 관리자 설정이 완료되지 않았습니다.", 500);
  }

  const providedSecret = await readAdminSecret(req);
  if (providedSecret.length < 32 || !(await secretsMatch(providedSecret, adminSecret))) {
    return response("관리자 인증에 실패했습니다.", 403);
  }

  const clientId = process.env.KAKAO_REST_API_KEY;
  const redirectUri = process.env.KAKAO_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return response("Kakao OAuth environment variables are not configured.", 500);
  }

  const signed = await createSignedState(adminSecret);
  const store = getStore({ name: "lian-kakao-auth", consistency: "strong" });
  const stateKey = "oauth-state-" + signed.nonce;

  try {
    const result = await store.setJSON(
      stateKey,
      {
        state: signed.state,
        nonce: signed.nonce,
        createdAt: Date.now(),
        expiresAt: Date.now() + STATE_TTL_MS,
      },
      { onlyIfNew: true }
    );
    // Blobs v10 reports a conditional-write conflict without throwing.
    if (result?.modified !== true) {
      console.error("Kakao OAuth state creation was not applied.");
      return response("카카오 연결을 시작할 수 없습니다. 연결 페이지에서 다시 시도해 주세요.", 409);
    }
  } catch {
    console.error("Kakao OAuth state storage failed.");
    return response("카카오 연결을 시작할 수 없습니다. 잠시 후 다시 시도해 주세요.", 500);
  }

  const authorizeUrl = new URL(AUTHORIZE_URL);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", signed.state);
  authorizeUrl.searchParams.set("scope", "talk_message");

  return new Response(null, {
    status: 302,
    headers: {
      location: authorizeUrl.toString(),
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow, noarchive",
      "referrer-policy": "strict-origin",
      "set-cookie": oauthCookie(signed.nonce),
    },
  });
}
