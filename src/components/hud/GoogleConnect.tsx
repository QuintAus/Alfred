"use client";

import { useEffect, useState } from "react";
import { Cloud, Power } from "lucide-react";

interface ConnStatus {
  configured: boolean;
  hasKey: boolean;
  connected: boolean;
  email: string | null;
}

const NOTICES: Record<string, string> = {
  connected: "Google connected.",
  denied: "Google sign-in was cancelled.",
  badstate: "Sign-in expired — please try again.",
  error: "Couldn't complete Google sign-in.",
  unconfigured: "Set GOOGLE_CLIENT_ID / SECRET first.",
  nokey: "Set TOKEN_ENCRYPTION_KEY first.",
};

/**
 * Top-bar control to connect / disconnect the user's Google account.
 * Reads /api/auth/status; connect navigates to the OAuth flow.
 */
export function GoogleConnect() {
  const [status, setStatus] = useState<ConnStatus | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = () =>
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});

  useEffect(() => {
    refresh();
    // Surface the OAuth redirect outcome once, then clean the URL.
    const params = new URLSearchParams(window.location.search);
    const g = params.get("google");
    if (g && NOTICES[g]) {
      setNotice(NOTICES[g]);
      const t = setTimeout(() => setNotice(null), 4000);
      window.history.replaceState({}, "", window.location.pathname);
      return () => clearTimeout(t);
    }
  }, []);

  const disconnect = async () => {
    await fetch("/api/auth/google/disconnect", { method: "POST" }).catch(() => {});
    refresh();
  };

  if (!status) return null;

  const pill =
    "flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] tracking-[0.15em] transition-colors";

  return (
    <div className="flex items-center gap-2">
      {notice && (
        <span className="hidden font-mono text-[10px] text-ink-dim lg:inline">{notice}</span>
      )}

      {status.connected ? (
        <button
          onClick={disconnect}
          title={`Connected as ${status.email ?? "your account"} — click to disconnect`}
          className={`${pill} group bg-success/10 text-success ring-1 ring-success/20 hover:bg-danger/10 hover:text-danger hover:ring-danger/30`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-success group-hover:bg-danger" />
          <span className="hidden max-w-[140px] truncate sm:inline">
            {status.email ?? "Google"}
          </span>
          <Power size={11} className="hidden sm:inline" />
        </button>
      ) : status.configured && status.hasKey ? (
        <a
          href="/api/auth/google"
          className={`${pill} bg-primary/10 text-primary ring-1 ring-primary/25 hover:bg-primary/20`}
        >
          <Cloud size={12} />
          <span>CONNECT GOOGLE</span>
        </a>
      ) : (
        <span
          title="Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and TOKEN_ENCRYPTION_KEY to .env.local, then restart."
          className={`${pill} bg-accent/10 text-accent ring-1 ring-accent/20`}
        >
          <Cloud size={12} />
          <span className="hidden sm:inline">GOOGLE: SETUP</span>
        </span>
      )}
    </div>
  );
}
