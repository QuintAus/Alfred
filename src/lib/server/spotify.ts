import { SPOTIFY_SCOPES } from "@/config/spotify";
import { saveSession, loadSession, clearSession, hasEncryptionKey } from "./token-store";
import type { NowPlaying } from "@/lib/types";

/**
 * Spotify OAuth + Web API (server-only). Tokens are stored encrypted via
 * token-store and auto-refreshed. Mirrors the Google integration pattern.
 */
const REDIRECT_URI =
  process.env.SPOTIFY_REDIRECT_URI ?? "http://localhost:3000/api/auth/spotify/callback";
const ACCOUNTS = "https://accounts.spotify.com";
const API = "https://api.spotify.com/v1";

interface SpotifySession {
  name: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export function isSpotifyConfigured(): boolean {
  return Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
}

function basicAuth(): string {
  const raw = `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`;
  return "Basic " + Buffer.from(raw).toString("base64");
}

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID ?? "",
    scope: SPOTIFY_SCOPES.join(" "),
    redirect_uri: REDIRECT_URI,
    state,
  });
  return `${ACCOUNTS}/authorize?${params.toString()}`;
}

export async function handleCallback(code: string): Promise<void> {
  const res = await fetch(`${ACCOUNTS}/api/token`, {
    method: "POST",
    headers: { Authorization: basicAuth(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: REDIRECT_URI }),
  });
  if (!res.ok) throw new Error(`Spotify token exchange failed (${res.status})`);
  const t = await res.json();

  let name = "Spotify";
  try {
    const me = await fetch(`${API}/me`, { headers: { Authorization: `Bearer ${t.access_token}` } });
    const prof = await me.json();
    name = prof?.display_name ?? prof?.id ?? name;
  } catch {
    /* non-fatal */
  }

  await saveSession("spotify", {
    name,
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    expires_at: Date.now() + (t.expires_in ?? 3600) * 1000,
  } satisfies SpotifySession);
}

async function getAccessToken(): Promise<string | null> {
  if (!isSpotifyConfigured() || !hasEncryptionKey()) return null;
  const s = await loadSession<SpotifySession>("spotify");
  if (!s?.refresh_token) return null;
  if (Date.now() < s.expires_at - 60_000) return s.access_token;
  try {
    const res = await fetch(`${ACCOUNTS}/api/token`, {
      method: "POST",
      headers: { Authorization: basicAuth(), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: s.refresh_token }),
    });
    if (!res.ok) return null;
    const t = await res.json();
    const updated: SpotifySession = {
      name: s.name,
      access_token: t.access_token,
      refresh_token: t.refresh_token ?? s.refresh_token,
      expires_at: Date.now() + (t.expires_in ?? 3600) * 1000,
    };
    await saveSession("spotify", updated);
    return updated.access_token;
  } catch {
    return null;
  }
}

async function api(path: string, init?: RequestInit): Promise<Response | null> {
  const token = await getAccessToken();
  if (!token) return null;
  return fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
  });
}

export async function getSpotifyConnection() {
  const configured = isSpotifyConfigured();
  const hasKey = hasEncryptionKey();
  const s = configured && hasKey ? await loadSession<SpotifySession>("spotify") : null;
  return { configured, hasKey, connected: Boolean(s?.refresh_token), name: s?.name ?? null };
}

export async function disconnectSpotify(): Promise<void> {
  await clearSession("spotify");
}

const NOTHING: NowPlaying = {
  isPlaying: false,
  track: "Nothing playing",
  artist: "",
  album: "",
  progress: 0,
  durationSec: 0,
};

export async function getNowPlaying(): Promise<NowPlaying | null> {
  const res = await api("/me/player/currently-playing");
  if (!res) return null; // not connected
  if (res.status === 204) return NOTHING;
  if (!res.ok) return null;
  const d = await res.json();
  const item = d?.item;
  if (!item) return NOTHING;
  const durationMs = item.duration_ms ?? 1;
  return {
    isPlaying: Boolean(d.is_playing),
    track: item.name ?? "",
    artist: (item.artists ?? []).map((a: { name: string }) => a.name).join(", "),
    album: item.album?.name ?? "",
    progress: Math.min(1, (d.progress_ms ?? 0) / durationMs),
    durationSec: Math.round(durationMs / 1000),
  };
}

export async function playMusic(
  query?: string,
): Promise<{ ok: boolean; note?: string; nowPlaying?: NowPlaying | null }> {
  if (query?.trim()) {
    const sres = await api(`/search?type=playlist,track&limit=1&q=${encodeURIComponent(query)}`);
    if (!sres) return { ok: false, note: "Not connected to Spotify." };
    const sd = await sres.json();
    const playlistUri = sd?.playlists?.items?.[0]?.uri;
    const trackUri = sd?.tracks?.items?.[0]?.uri;
    const body = playlistUri ? { context_uri: playlistUri } : trackUri ? { uris: [trackUri] } : null;
    if (!body) return { ok: false, note: `Couldn't find anything for "${query}".` };
    const pr = await api("/me/player/play", {
      method: "PUT",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    if (!pr || (!pr.ok && pr.status !== 204)) {
      return { ok: false, note: "Couldn't start playback — make sure Spotify is open on a device." };
    }
  } else {
    const pr = await api("/me/player/play", { method: "PUT" });
    if (!pr || (!pr.ok && pr.status !== 204)) {
      return { ok: false, note: "Couldn't resume — make sure Spotify is open on a device." };
    }
  }
  return { ok: true, nowPlaying: await getNowPlaying() };
}

export async function pauseMusic(): Promise<{ ok: boolean; note?: string }> {
  const pr = await api("/me/player/pause", { method: "PUT" });
  if (!pr) return { ok: false, note: "Not connected to Spotify." };
  return { ok: pr.ok || pr.status === 204 };
}
