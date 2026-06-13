import { google, type Auth } from "googleapis";
import type { CalendarEvent, EmailSummary, TaskItem } from "@/lib/types";

/**
 * Adapters: Google API responses → the widget data shapes from lib/types.
 * Because the shapes match Phase 1's mock data, the widgets render real data
 * with zero changes. Server-only (called from tool handlers).
 */

const ACCENTS = ["cyan", "amber", "violet", "green"] as const;

function hm(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

function shortDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function relTime(value?: string | null): string {
  if (!value) return "";
  const ms = /^\d+$/.test(value) ? Number(value) : Date.parse(value);
  const d = new Date(ms);
  if (isNaN(d.getTime())) return "";
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return `${d.getHours().toString().padStart(2, "0")}:${d
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  }
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function parseSender(from: string): string {
  const named = from.match(/^\s*"?([^"<]+?)"?\s*</);
  if (named) return named[1].trim();
  return from.replace(/[<>]/g, "").trim() || "Unknown";
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

export async function getCalendarEvents(client: Auth.OAuth2Client): Promise<CalendarEvent[]> {
  const cal = google.calendar({ version: "v3", auth: client });
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const res = await cal.events.list({
    calendarId: "primary",
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 10,
  });
  return (res.data.items ?? []).map((e, i) => ({
    id: e.id ?? `evt_${i}`,
    title: e.summary ?? "(no title)",
    start: hm(e.start?.dateTime ?? e.start?.date),
    end: hm(e.end?.dateTime ?? e.end?.date),
    location: e.location ?? undefined,
    accent: ACCENTS[i % ACCENTS.length],
    attendees: e.attendees?.length,
  }));
}

export async function createCalendarEvent(
  client: Auth.OAuth2Client,
  input: { title: string; start: string; end: string; location?: string },
) {
  const cal = google.calendar({ version: "v3", auth: client });
  const res = await cal.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: input.title,
      location: input.location,
      start: { dateTime: input.start },
      end: { dateTime: input.end },
    },
  });
  return {
    created: true,
    id: res.data.id,
    title: res.data.summary,
    start: res.data.start?.dateTime ?? res.data.start?.date,
    link: res.data.htmlLink,
  };
}

export async function searchEmails(
  client: Auth.OAuth2Client,
  query?: string,
): Promise<{ unread: number; emails: EmailSummary[] }> {
  const gmail = google.gmail({ version: "v1", auth: client });
  const list = await gmail.users.messages.list({
    userId: "me",
    q: query ? query : "in:inbox",
    maxResults: 6,
  });
  const ids = (list.data.messages ?? []).map((m) => m.id).filter((x): x is string => Boolean(x));

  const emails: EmailSummary[] = [];
  for (const id of ids) {
    const msg = await gmail.users.messages.get({
      userId: "me",
      id,
      format: "metadata",
      metadataHeaders: ["From", "Subject", "Date"],
    });
    const headers = msg.data.payload?.headers ?? [];
    const header = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name)?.value ?? "";
    const labels = msg.data.labelIds ?? [];
    emails.push({
      id,
      sender: parseSender(header("from")),
      subject: header("subject") || "(no subject)",
      snippet: decodeEntities(msg.data.snippet ?? ""),
      time: relTime(header("date") || msg.data.internalDate),
      unread: labels.includes("UNREAD"),
      important: labels.includes("IMPORTANT"),
    });
  }

  let unread = emails.filter((e) => e.unread).length;
  try {
    const label = await gmail.users.labels.get({ userId: "me", id: "INBOX" });
    if (typeof label.data.messagesUnread === "number") unread = label.data.messagesUnread;
  } catch {
    /* fall back to counted unread */
  }
  return { unread, emails };
}

export async function getTasks(client: Auth.OAuth2Client): Promise<TaskItem[]> {
  const api = google.tasks({ version: "v1", auth: client });
  const lists = await api.tasklists.list({ maxResults: 1 });
  const listId = lists.data.items?.[0]?.id;
  if (!listId) return [];
  const res = await api.tasks.list({
    tasklist: listId,
    maxResults: 12,
    showCompleted: true,
    showHidden: false,
  });
  return (res.data.items ?? []).map((t, i) => ({
    id: t.id ?? `task_${i}`,
    title: t.title || "(untitled)",
    done: t.status === "completed",
    priority: "medium" as const, // Google Tasks has no priority field
    due: t.due ? shortDate(t.due) : undefined,
  }));
}

export async function getDriveFiles(client: Auth.OAuth2Client, query?: string) {
  const drive = google.drive({ version: "v3", auth: client });
  const res = await drive.files.list({
    pageSize: 8,
    orderBy: "modifiedTime desc",
    q: query ? `name contains '${query.replace(/'/g, "\\'")}'` : undefined,
    fields: "files(id,name,mimeType,modifiedTime,webViewLink)",
  });
  return (res.data.files ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    type: f.mimeType,
    modified: shortDate(f.modifiedTime),
    link: f.webViewLink,
  }));
}
