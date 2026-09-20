import { getStore } from "@netlify/blobs";
import {
  clearOauthCookie,
  readCookie,
  verifySignedState,
} from "./kakao-security.mjs";

const TOKEN_URL = "https://kauth.kakao.com/oauth/token";
const USER_URL = "https://kapi.kakao.com/v2/user/me";
const SEND_URL = "https://kapi.kakao.com/v2/api/talk/memo/default/send";
const PUBLIC_SITE_FALLBACK = "https://lian-vocal-mix-jp.netlify.app/";

function html(title, body, ok = true, extraHeaders = {}) {
  const page = [
    "<!doctype html><html lang=\"ja\" translate=\"no\" class=\"notranslate\"><head>",
    "<meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">",
    "<title>", title, "</title><style>",
    "body{margin:0;background:#f6faff;font-family:Arial,\"Noto Sans JP\",sans-serif;color:#102d4b}",
    "main{max-width:680px;margin:8vh auto;padding:48px 30px}",
    ".card{background:#fff;border:1px solid #dbe8f4;border-radius:24px;padding:42px;box-shadow:0 20px 60px rgba(24,56,88,.07)}",
    ".badge{display:inline-block;font-size:12px;font-weight:800;color:", ok ? "#2f80ed" : "#c0392b", ";margin-bottom:12px}",
    "h1{font-size:32px;margin:0 0 14px}p{line-height:1.7;color:#60778d}",
    "a{display:inline-block;margin-top:20px;padding:12px 18px;border-radius:999px;background:#102d4b;color:#fff;text-decoration:none;font-weight:800}",
    "</style></head><body><main><div class=\"card\"><div class=\"badge\">",
    ok ? "KAKAO CONNECTED" : "KAKAO ERROR",
    "</div><h1>", title, "</h1><p>", body,
    "</p><a href=\"/\">Lian Vocal MIX ホームへ</a></div></main></body></html>",
  ].join("");
  return new Response(page, {
    status: ok ? 200 : 400,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/html; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function fail(title, body, detail, extraHeaders = {}) {
  if (detail) console.error("Kakao OAuth callback:", detail);
  return html(title, body, false, extraHeaders);
}

async function exchangeCode(code) {
  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: process.env.KAKAO_REST_API_KEY,
    redirect_uri: process.env.KAKAO_REDIRECT_URI,
    code,
  });
  if (process.env.KAKAO_CLIENT_SECRET) tokenBody.set("client_secret", process.env.KAKAO_CLIENT_SECRET);

  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: tokenBody,
  });
  const raw = await tokenRes.text();
  if (!tokenRes.ok) throw new Error("token endpoint returned HTTP " + tokenRes.status);
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("token endpoint returned invalid JSON");
  }
}

async function getKakaoUser(accessToken) {
  const userRes = await fetch(USER_URL, {
    headers: { Authorization: "Bearer " + accessToken },
  });
  const raw = await userRes.text();
  if (!userRes.ok) throw new Error("user endpoint returned HTTP " + userRes.status);
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("user endpoint returned invalid JSON");
  }
}

async function sendTest(accessToken) {
  const siteUrl = process.env.PUBLIC_SITE_URL || PUBLIC_SITE_FALLBACK;
  const template = {
    object_type: "text",
    text: "✅ Lian Vocal MIX\\n카카오톡 문의 알림 연동이 완료되었습니다.",
    link: { web_url: siteUrl, mobile_web_url: siteUrl },
    button_title: "사이트 열기",
  };
  const body = new URLSearchParams({ template_object: JSON.stringify(template) });
  const res = await fetch(SEND_URL, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body,
  });
  const raw = await res.text();
  if (!res.ok) throw new Error("test message endpoint returned HTTP " + res.status);
  try {
    const parsed = JSON.parse(raw);
    if (parsed.result_code !== 0) throw new Error("test message endpoint returned an error");
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error("test message endpoint returned invalid JSON");
    throw error;
  }
}

export default async function handler(req) {
  const url = new URL(req.url);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const clearCookieHeaders = { "set-cookie": clearOauthCookie() };

  const adminSecret = process.env.KAKAO_ADMIN_SECRET || "";
  const allowedUserId = String(process.env.KAKAO_ALLOWED_USER_ID || "").trim();
  if (adminSecret.length < 32 || !allowedUserId) {
    return fail(
      "カカオ連携の設定が必要です",
      "管理者設定を確認してから、もう一度お試しください。",
      "KAKAO_ADMIN_SECRET or KAKAO_ALLOWED_USER_ID is not configured.",
      clearCookieHeaders
    );
  }

  const signed = await verifySignedState(state, adminSecret);
  const cookieNonce = readCookie(req.headers.get("cookie"), "lian_kakao_oauth_nonce");
  if (!signed || !cookieNonce || cookieNonce !== signed.nonce) {
    return fail(
      "認証リクエストを確認できません",
      "カカオ連携を最初からやり直してください。",
      "signed state or browser binding was invalid.",
      clearCookieHeaders
    );
  }

  const store = getStore({ name: "lian-kakao-auth", consistency: "strong" });
  const stateKey = "oauth-state-" + signed.nonce;
  let stateData;
  try {
    stateData = await store.get(stateKey, { type: "json" });
  } catch {
    return fail(
      "認証リクエストを確認できません",
      "しばらくしてから、もう一度お試しください。",
      "state record lookup failed.",
      clearCookieHeaders
    );
  }
  if (!stateData || stateData.state !== signed.state || stateData.nonce !== signed.nonce) {
    return fail(
      "認証リクエストが期限切れです",
      "カカオ連携を最初からやり直してください。",
      "state record was missing, mismatched, or already used.",
      clearCookieHeaders
    );
  }
  // Claim the nonce before exchanging the code so a concurrent callback cannot
  // reuse the same state record. Netlify Blobs enforces onlyIfNew atomically.
  try {
    const result = await store.setJSON(
      "oauth-used-" + signed.nonce,
      { consumedAt: new Date().toISOString() },
      { onlyIfNew: true }
    );
    if (result?.modified !== true) {
      return fail(
        "認証リクエストはすでに使用されています",
        "カカオ連携を最初からやり直してください。",
        "state nonce claim was not applied.",
        clearCookieHeaders
      );
    }
  } catch {
    return fail(
      "認証リクエストを処理できません",
      "カカオ連携を最初からやり直してください。",
      "state nonce claim storage failed.",
      clearCookieHeaders
    );
  }
  try {
    await store.delete(stateKey);
  } catch {
    return fail(
      "認証リクエストを処理できません",
      "カカオ連携を最初からやり直してください。",
      "state record cleanup failed.",
      clearCookieHeaders
    );
  }

  if (error) {
    return html(
      "カカオ連携をキャンセルしました",
      "必要な場合は管理者用の接続フォームからもう一度お試しください。",
      false,
      clearCookieHeaders
    );
  }
  if (!code) {
    return fail(
      "認証情報が不足しています",
      "カカオ連携を最初からやり直してください。",
      "authorization code was missing.",
      clearCookieHeaders
    );
  }
  if (!process.env.KAKAO_REST_API_KEY || !process.env.KAKAO_REDIRECT_URI) {
    return fail(
      "カカオ連携の設定が必要です",
      "管理者設定を確認してから、もう一度お試しください。",
      "Kakao OAuth environment variables are not configured.",
      clearCookieHeaders
    );
  }

  let token;
  try {
    token = await exchangeCode(code);
  } catch (error) {
    return fail(
      "カカオトークの認証に失敗しました",
      "しばらくしてから、もう一度お試しください。",
      error?.message || "token exchange failed.",
      clearCookieHeaders
    );
  }
  if (!token?.refresh_token || !token?.access_token) {
    return fail(
      "カカオの認証情報が不足しています",
      "必要な権限を確認してから、もう一度お試しください。",
      "token response did not contain the required tokens.",
      clearCookieHeaders
    );
  }

  let user;
  try {
    user = await getKakaoUser(token.access_token);
  } catch (error) {
    return fail(
      "カカオアカウントを確認できません",
      "許可された管理者アカウントで、もう一度お試しください。",
      error?.message || "Kakao user verification failed.",
      clearCookieHeaders
    );
  }
  if (String(user?.id ?? "") !== allowedUserId) {
    return fail(
      "許可されていないカカオアカウントです",
      "登録済みの管理者アカウントで接続してください。",
      "Kakao user ID did not match KAKAO_ALLOWED_USER_ID.",
      clearCookieHeaders
    );
  }

  await store.set("refresh_token", token.refresh_token);
  await store.setJSON("token-meta", {
    connectedAt: new Date().toISOString(),
    kakaoUserId: allowedUserId,
    refreshTokenExpiresIn: token.refresh_token_expires_in ?? null,
    scope: token.scope ?? null,
  });

  try {
    await sendTest(token.access_token);
  } catch (error) {
    console.error("Kakao OAuth test message failed:", error?.message || "unknown error");
    return html(
      "カカオアカウントを接続しました",
      "トークンは保存されましたが、テスト通知を送れませんでした。talk_message 権限を確認してください。",
      false,
      clearCookieHeaders
    );
  }

  return html(
    "カカオトーク通知連携が完了しました",
    "管理者アカウントの確認とテスト通知が完了しました。",
    true,
    clearCookieHeaders
  );
}
