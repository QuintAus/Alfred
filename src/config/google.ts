/**
 * ============================================================================
 *  GOOGLE OAUTH SCOPES  —  least privilege.
 * ============================================================================
 * Read-only everywhere except Calendar events, which is read + write so JARVIS
 * can CREATE events ("book a meeting"). Tighten or loosen here, then re-consent.
 *
 * NOTE: changing scopes requires re-running the consent flow (disconnect first).
 */
export const GOOGLE_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  // Calendar — read events + create events (the one write capability):
  "https://www.googleapis.com/auth/calendar.events",
  // Gmail — read only:
  "https://www.googleapis.com/auth/gmail.readonly",
  // Tasks — read only:
  "https://www.googleapis.com/auth/tasks.readonly",
  // Drive — list file metadata only (no file contents):
  "https://www.googleapis.com/auth/drive.metadata.readonly",
];
