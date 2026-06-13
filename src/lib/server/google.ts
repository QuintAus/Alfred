import { google, type Auth } from "googleapis";
import { GOOGLE_SCOPES } from "@/config/google";
import { saveSession, loadSession, clearSession, hasEncryptionKey } from "./token-store";

/**
 * Google OAuth + authed-client management (server-only).
 *
 * The OAuth client secret and the user's tokens never leave the server. Tokens
 * are persisted encrypted by token-store. Refreshes are captured and re-saved.
 */

interface GoogleSession {
  email: string;
  tokens: Auth.Credentials;
}

const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/auth/google/callback";

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function getOAuthClient(): Auth.OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI,
  );
}

/** The Google consent URL to send the user to. `state` guards against CSRF. */
export function buildAuthUrl(state: string): string {
  return getOAuthClient().generateAuthUrl({
    access_type: "offline", // get a refresh token
    prompt: "consent", // ensure refresh token is returned
    scope: GOOGLE_SCOPES,
    include_granted_scopes: true,
    state,
  });
}

/** Exchange an auth code for tokens, look up the account email, and persist. */
export async function handleCallback(code: string): Promise<string> {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  let email = "your account";
  try {
    const me = await google.oauth2({ version: "v2", auth: client }).userinfo.get();
    email = me.data.email ?? email;
  } catch {
    /* non-fatal — we still have tokens */
  }

  await saveSession({ email, tokens } satisfies GoogleSession);
  return email;
}

/**
 * An authed OAuth client ready for API calls, or null if not connected.
 * Persists refreshed tokens automatically.
 */
export async function getAuthedClient(): Promise<Auth.OAuth2Client | null> {
  if (!isGoogleConfigured() || !hasEncryptionKey()) return null;
  const session = await loadSession<GoogleSession>();
  if (!session?.tokens) return null;

  const client = getOAuthClient();
  client.setCredentials(session.tokens);
  client.on("tokens", (fresh) => {
    // Merge + re-persist refreshed credentials (refresh_token may be omitted).
    const merged = { ...session.tokens, ...fresh };
    void saveSession({ email: session.email, tokens: merged } satisfies GoogleSession);
  });
  return client;
}

/** Connection status for the UI / status endpoint. */
export async function getConnection(): Promise<{
  configured: boolean;
  hasKey: boolean;
  connected: boolean;
  email: string | null;
}> {
  const configured = isGoogleConfigured();
  const hasKey = hasEncryptionKey();
  const session = configured && hasKey ? await loadSession<GoogleSession>() : null;
  return {
    configured,
    hasKey,
    connected: Boolean(session?.tokens),
    email: session?.email ?? null,
  };
}

/** Revoke (best-effort) and clear the stored session. */
export async function disconnectGoogle(): Promise<void> {
  try {
    const client = await getAuthedClient();
    if (client) await client.revokeCredentials();
  } catch {
    /* best effort */
  }
  await clearSession();
}
