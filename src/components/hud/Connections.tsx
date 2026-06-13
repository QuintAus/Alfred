"use client";

import { useEffect, useState } from "react";
import { Cloud, Music, Power, type LucideIcon } from "lucide-react";

interface Conn {
  configured: boolean;
  hasKey: boolean;
  connected: boolean;
}
interface Status {
  google: Conn & { email: string | null };
  spotify: Conn & { name: string | null };
}

const NOTICES: Record<string, string> = {
  connected: "connected.",
  denied: "sign-in cancelled.",
  badstate: "sign-in expired — try again.",
  error: "sign-in failed.",
  unconfigured: "set the client ID/secret first.",
  nokey: "set TOKEN_ENCRYPTION_KEY first.",
};

const PILL =
  "flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] tracking-[0.15em] transition-colors";

function ProviderPill({
  name,
  icon: Icon,
  authPath,
  disconnectPath,
  conn,
  label,
  onChange,
}: {
  name: string;
  icon: LucideIcon;
  authPath: string;
  disconnectPath: string;
  conn: Conn;
  label: string | null;
  onChange: () => void;
}) {
  const disconnect = async () => {
    await fetch(disconnectPath, { method: "POST" }).catch(() => {});
    onChange();
  };

  if (conn.connected) {
    return (
      <button
        onClick={disconnect}
        title={`${name}: ${label ?? "connected"} — click to disconnect`}
        className={`${PILL} group bg-success/10 text-success ring-1 ring-success/20 hover:bg-danger/10 hover:text-danger hover:ring-danger/30`}
      >
        <Icon size={12} />
        <span className="hidden max-w-[110px] truncate md:inline">{label ?? name}</span>
        <Power size={11} className="hidden sm:inline" />
      </button>
    );
  }
  if (conn.configured && conn.hasKey) {
    return (
      <a href={authPath} className={`${PILL} bg-primary/10 text-primary ring-1 ring-primary/25 hover:bg-primary/20`}>
        <Icon size={12} />
        <span>{name.toUpperCase()}</span>
      </a>
    );
  }
  return (
    <span
      title={`Add ${name} credentials + TOKEN_ENCRYPTION_KEY to .env.local, then restart.`}
      className={`${PILL} bg-accent/10 text-accent ring-1 ring-accent/20`}
    >
      <Icon size={12} />
      <span className="hidden sm:inline">{name.toUpperCase()}</span>
    </span>
  );
}

/** Status-bar control to connect / disconnect Google and Spotify. */
export function Connections() {
  const [status, setStatus] = useState<Status | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = () =>
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});

  useEffect(() => {
    refresh();
    const params = new URLSearchParams(window.location.search);
    const g = params.get("google");
    const s = params.get("spotify");
    const code = g ?? s;
    if (code && NOTICES[code]) {
      setNotice(`${g ? "Google" : "Spotify"} ${NOTICES[code]}`);
      const t = setTimeout(() => setNotice(null), 4000);
      window.history.replaceState({}, "", window.location.pathname);
      return () => clearTimeout(t);
    }
  }, []);

  if (!status) return null;

  return (
    <div className="flex items-center gap-2">
      {notice && (
        <span className="hidden font-mono text-[10px] text-ink-dim lg:inline">{notice}</span>
      )}
      <ProviderPill
        name="Google"
        icon={Cloud}
        authPath="/api/auth/google"
        disconnectPath="/api/auth/google/disconnect"
        conn={status.google}
        label={status.google.email}
        onChange={refresh}
      />
      <ProviderPill
        name="Spotify"
        icon={Music}
        authPath="/api/auth/spotify"
        disconnectPath="/api/auth/spotify/disconnect"
        conn={status.spotify}
        label={status.spotify.name}
        onChange={refresh}
      />
    </div>
  );
}
