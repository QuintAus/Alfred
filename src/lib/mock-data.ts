import type { DashboardData } from "./types";

/**
 * Hardcoded mock data for Phase 1.
 *
 * Everything the HUD shows comes from here for now. In Phase 3 the real tool
 * handlers return these same shapes, so swapping in live Google/Spotify data is
 * a drop-in replacement — no widget changes required.
 */
export const mockDashboard: DashboardData = {
  calendar: [
    {
      id: "evt_1",
      title: "Design Team Standup",
      start: "09:00",
      end: "09:30",
      location: "War Room · Zoom",
      accent: "cyan",
      attendees: 6,
    },
    {
      id: "evt_2",
      title: "Project Phoenix Review",
      start: "11:30",
      end: "12:30",
      location: "Conference A",
      accent: "amber",
      attendees: 9,
    },
    {
      id: "evt_3",
      title: "Lunch w/ Pepper",
      start: "13:00",
      end: "14:00",
      location: "Rooftop",
      accent: "violet",
      attendees: 2,
    },
    {
      id: "evt_4",
      title: "Investor Sync",
      start: "16:00",
      end: "16:45",
      location: "Boardroom · Floor 40",
      accent: "green",
      attendees: 4,
    },
  ],
  inbox: {
    unread: 12,
    emails: [
      {
        id: "mail_1",
        sender: "Pepper Potts",
        subject: "Re: Q3 board deck",
        snippet: "The revised numbers look great — one note on slide 14…",
        time: "08:42",
        unread: true,
        important: true,
      },
      {
        id: "mail_2",
        sender: "Happy Hogan",
        subject: "Car at 8:30 sharp",
        snippet: "Out front. Don't make me come up there again.",
        time: "07:55",
        unread: true,
      },
      {
        id: "mail_3",
        sender: "Stark Industries R&D",
        subject: "Repulsor efficiency report",
        snippet: "Latest test cycle shows a 14% gain in sustained output…",
        time: "Yesterday",
        unread: false,
      },
      {
        id: "mail_4",
        sender: "Nick Fury",
        subject: "We need to talk.",
        snippet: "You know where to find me.",
        time: "Yesterday",
        unread: true,
        important: true,
      },
    ],
  },
  tasks: [
    { id: "task_1", title: "Approve arc reactor schematics", done: false, priority: "high", due: "Today" },
    { id: "task_2", title: "Review Phoenix risk memo", done: false, priority: "high", due: "Today" },
    { id: "task_3", title: "Call back Rhodey", done: false, priority: "medium", due: "Today" },
    { id: "task_4", title: "Sign off on press release", done: true, priority: "medium" },
    { id: "task_5", title: "Re-calibrate Mark VII telemetry", done: false, priority: "low", due: "Fri" },
  ],
  weather: {
    location: "Malibu, CA",
    tempC: 22,
    condition: "Clear skies",
    icon: "clear",
    highC: 25,
    lowC: 17,
    hourly: [
      { time: "10:00", tempC: 21 },
      { time: "12:00", tempC: 23 },
      { time: "14:00", tempC: 25 },
      { time: "16:00", tempC: 24 },
      { time: "18:00", tempC: 21 },
      { time: "20:00", tempC: 19 },
    ],
  },
  nowPlaying: {
    isPlaying: true,
    track: "Back In Black",
    artist: "AC/DC",
    album: "Back In Black",
    progress: 0.37,
    durationSec: 255,
  },
  stats: [
    { id: "stat_1", label: "Unread", value: "12", hint: "mail", accent: "amber" },
    { id: "stat_2", label: "Meetings", value: "4", hint: "today", accent: "cyan" },
    { id: "stat_3", label: "Tasks Due", value: "3", hint: "today", accent: "amber" },
    { id: "stat_4", label: "Uplink", value: "98%", hint: "secure", accent: "green" },
  ],
};
