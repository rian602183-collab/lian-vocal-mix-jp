import { getStore } from "@netlify/blobs";

const AUTHORIZE_URL = "https://kauth.kakao.com/oauth/authorize";

export default async function handler() {
  const clientId = process.env.KAKAO_REST_API_KEY;
  const redirectUri = process.env.KAKAO_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return new Response("Kakao OAuth environment variables are not configured.", { status: 500 });
  }

  const state = crypto.randomUUID();
  const store = getStore({ name: "lian-kakao-auth", consistency: "strong" });

  await store.setJSON(`oauth-state-${state}`, {
    createdAt: Date.now()
  });

  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", "talk_message");

  return Response.redirect(url.toString(), 302);
}
