const encoder = new TextEncoder();

function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

async function importHmacKey(secret, usages) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usages
  );
}

export async function hmacBase64Url(secret, message) {
  const key = await importHmacKey(secret, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toBase64Url(new Uint8Array(signature));
}

// Web Crypto performs the comparison internally instead of exposing a byte-by-byte
// secret comparison to application code.
export async function secretsMatch(provided, expected) {
  if (!provided || !expected) return false;
  try {
    const message = encoder.encode("lian-kakao-admin-secret-v7");
    const expectedKey = await importHmacKey(expected, ["sign"]);
    const expectedSignature = await crypto.subtle.sign("HMAC", expectedKey, message);
    const providedKey = await importHmacKey(provided, ["verify"]);
    return await crypto.subtle.verify("HMAC", providedKey, expectedSignature, message);
  } catch {
    return false;
  }
}

export async function createSignedState(secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomUUID();
  const payload = String(timestamp) + "." + nonce;
  const signature = await hmacBase64Url(secret, payload);
  return { state: payload + "." + signature, nonce, timestamp };
}

export async function verifySignedState(state, secret, now = Date.now()) {
  if (!state || !secret) return null;
  const parts = String(state).split(".");
  if (parts.length !== 3) return null;
  const timestampText = parts[0];
  const nonce = parts[1];
  const signature = parts[2];
  const timestamp = Number(timestampText);
  if (!Number.isInteger(timestamp) || !/^[-\w]{20,80}$/.test(nonce) || !signature) return null;
  const age = now - timestamp * 1000;
  if (age < -30_000 || age > 10 * 60 * 1000) return null;
  try {
    const expected = await hmacBase64Url(secret, timestampText + "." + nonce);
    const expectedBytes = fromBase64Url(expected);
    const providedBytes = fromBase64Url(signature);
    if (expectedBytes.length !== providedBytes.length) return null;
    let different = 0;
    for (let index = 0; index < expectedBytes.length; index += 1) {
      different |= expectedBytes[index] ^ providedBytes[index];
    }
    return different === 0 ? { timestamp, nonce, state: String(state) } : null;
  } catch {
    return null;
  }
}

export function readCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const prefix = name + "=";
  const item = String(cookieHeader).split(";").map(value => value.trim()).find(value => value.startsWith(prefix));
  if (!item) return null;
  try {
    return decodeURIComponent(item.slice(prefix.length));
  } catch {
    return null;
  }
}

export function oauthCookie(nonce) {
  return "lian_kakao_oauth_nonce=" + encodeURIComponent(nonce) + "; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax";
}

export function clearOauthCookie() {
  return "lian_kakao_oauth_nonce=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax";
}
