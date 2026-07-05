// Shared configuration and constants for Meeting Flight.

export const CALENDAR_EVENTS_ENDPOINT =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

// How often the background worker re-syncs the calendar (minutes).
export const CALENDAR_SYNC_INTERVAL_MINUTES = 15;

// How far ahead we look for events when syncing (hours).
export const CALENDAR_LOOKAHEAD_HOURS = 24;

// chrome.alarms name used for the periodic calendar sync.
export const SYNC_ALARM_NAME = "meeting-flight:sync";

// Prefix for per-meeting reminder alarms. Full name: `${REMINDER_ALARM_PREFIX}${eventId}`.
export const REMINDER_ALARM_PREFIX = "meeting-flight:reminder:";

// storage.sync keys.
export const STORAGE_KEYS = {
  reminderLeadMinutes: "reminderLeadMinutes",
  connected: "connected",
};

// storage.local keys (larger, per-device data).
export const LOCAL_KEYS = {
  scheduledReminders: "scheduledReminders",
  cachedEvents: "cachedEvents",
};

// Default number of minutes before a meeting to fly the reminder.
export const DEFAULT_REMINDER_LEAD_MINUTES = 5;

// OAuth scopes requested from Google.
export const OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events.readonly",
];
