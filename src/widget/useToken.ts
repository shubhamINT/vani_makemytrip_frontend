// Fetches a LiveKit access token + server URL from your backend.
// ponytail: assumes endpoint returns { token, url }. Backend does named agent
// dispatch, so the frontend only needs a token — change parsing here if your
// endpoint uses different keys (e.g. participantToken / serverUrl).

export type TokenResult = { token: string; url: string };

const ENDPOINT = import.meta.env.VITE_TOKEN_ENDPOINT as string | undefined;

// Random-ish identity so multiple embeds don't collide. No crypto needed.
function randomIdentity() {
  return 'web-' + Math.random().toString(36).slice(2, 10);
}

export function parseTokenResponse(data: unknown): TokenResult {
  const d = data as Record<string, unknown>;
  const token = d?.token ?? d?.participantToken ?? d?.accessToken;
  const url = d?.url ?? d?.serverUrl ?? d?.livekitUrl ?? import.meta.env.VITE_LIVEKIT_URL;
  if (typeof token !== 'string' || typeof url !== 'string') {
    throw new Error('Token endpoint response missing token/url');
  }
  return { token, url };
}

export async function fetchToken(room = 'voice-agent'): Promise<TokenResult> {
  if (!ENDPOINT) throw new Error('VITE_TOKEN_ENDPOINT is not set');
  const params = new URLSearchParams({ room, identity: randomIdentity() });
  const res = await fetch(`${ENDPOINT}?${params}`);
  if (!res.ok) throw new Error(`Token request failed: ${res.status}`);
  return parseTokenResponse(await res.json());
}
