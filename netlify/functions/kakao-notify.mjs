import { getStore } from "@netlify/blobs";

const TOKEN_URL = "https://kauth.kakao.com/oauth/token";
const SEND_URL = "https://kapi.kakao.com/v2/api/talk/memo/default/send";

function value(data, key, fallback = "-") {
  const v = data?.[key];
  if (v === undefined || v === null || String(v).trim() === "") return fallback;
  return String(v).trim();
}

function clip(text, max) {
  const s = String(text ?? "");
  return s.length > max ? `${s.slice(0, Math.max(0, max - 1))}…` : s;
}

function buildMessage(data) {
  const artist = clip(value(data, "artist_name"), 24);
  const song = clip(value(data, "song_title"), 30);
  const plan = clip(value(data, "예상_플랜", value(data, "plan")), 28);
  const people = clip(value(data, "인원_추가", value(data, "people_type")), 24);
  const total = clip(value(data, "예상_최소_금액"), 22);
  const deadline = clip(value(data, "deadline"), 16);
  const lang = clip(value(data, "site_language", "KR"), 4);

  // Kakao text template limit: 200 chars.
  const lines = [
    `🎧 Lian MIX 새 문의 · ${lang}`,
    `활동명: ${artist}`,
    `곡: ${song}`,
    `플랜: ${plan}`,
    `인원: ${people}`,
    `예상: ${total}`,
    `납기: ${deadline}`,
  ];

  return clip(lines.join("\n"), 200);
}

async function getRefreshToken(store) {
  const saved = await store.get("refresh_token", { consistency: "strong" });
  if (saved) return saved;

  const envToken = process.env.KAKAO_REFRESH_TOKEN;
  if (!envToken) throw new Error("Kakao refresh token is not connected yet.");
  return envToken;
}

async function refreshAccessToken(store) {
  const restKey = process.env.KAKAO_REST_API_KEY;
  const clientSecret = process.env.KAKAO_CLIENT_SECRET;

  if (!restKey) throw new Error("KAKAO_REST_API_KEY is not configured.");

  const refreshToken = await getRefreshToken(store);
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: restKey,
    refresh_token: refreshToken,
  });

  if (clientSecret) body.set("client_secret", clientSecret);

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body,
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Kakao token refresh failed (${res.status}): ${raw}`);
  }

  const json = JSON.parse(raw);

  // Kakao rotates the refresh token when it is near expiry.
  // Persist the new token so notifications keep working automatically.
  if (json.refresh_token) {
    await store.set("refresh_token", json.refresh_token);
  }

  if (!json.access_token) {
    throw new Error("Kakao did not return an access token.");
  }

  return json.access_token;
}

async function sendKakaoMessage(accessToken, data) {
  const siteUrl = process.env.PUBLIC_SITE_URL || "https://lian-vocal-mix-jp.netlify.app/";
  const template = {
    object_type: "text",
    text: buildMessage(data),
    link: {
      web_url: siteUrl,
      mobile_web_url: siteUrl,
    },
    button_title: "사이트 열기",
  };

  const body = new URLSearchParams({
    template_object: JSON.stringify(template),
  });

  const res = await fetch(SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body,
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Kakao send failed (${res.status}): ${raw}`);
  }

  const json = JSON.parse(raw);
  if (json.result_code !== 0) {
    throw new Error(`Kakao send failed: ${raw}`);
  }
}

export default {
  async formSubmitted(event) {
    try {
      const data = event?.data ?? {};

      // If Netlify includes the form name in the event data, ignore other forms.
      const formName = data["form-name"];
      if (formName && formName !== "mix-consultation") return;

      const tokenStore = getStore({ name: "lian-kakao-auth", consistency: "strong" });
      const accessToken = await refreshAccessToken(tokenStore);
      await sendKakaoMessage(accessToken, data);

      console.log("Lian MIX Kakao notification sent.");
    } catch (error) {
      // Form submission itself remains successful even if Kakao notification fails.
      console.error("Lian MIX Kakao notification error:", error);
    }
  },
};
