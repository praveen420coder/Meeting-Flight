// Meeting Flight background service worker.
// Responsibilities:
//   1. Periodically sync Google Calendar events.
//   2. Schedule a chrome.alarms alarm for each event's reminder time.
//   3. When an alarm fires, fly a banner-towing plane across the active tab.

import { fetchUpcomingEvents, getAuthToken, signOut } from "./calendar.js";
import {
  CALENDAR_SYNC_INTERVAL_MINUTES,
  DEFAULT_REMINDER_LEAD_MINUTES,
  LOCAL_KEYS,
  REMINDER_ALARM_PREFIX,
  STORAGE_KEYS,
  SYNC_ALARM_NAME,
} from "./config.js";

// ---------- Settings helpers ----------

async function getReminderLeadMinutes() {
  const stored = await chrome.storage.sync.get(STORAGE_KEYS.reminderLeadMinutes);
  const value = Number(stored[STORAGE_KEYS.reminderLeadMinutes]);
  return Number.isFinite(value) && value >= 0
    ? value
    : DEFAULT_REMINDER_LEAD_MINUTES;
}

async function isConnected() {
  const stored = await chrome.storage.sync.get(STORAGE_KEYS.connected);
  return Boolean(stored[STORAGE_KEYS.connected]);
}

// ---------- Reminder scheduling ----------

/**
 * Clear every previously scheduled per-meeting reminder alarm.
 */
async function clearReminderAlarms() {
  const alarms = await chrome.alarms.getAll();
  await Promise.all(
    alarms
      .filter((alarm) => alarm.name.startsWith(REMINDER_ALARM_PREFIX))
      .map((alarm) => chrome.alarms.clear(alarm.name))
  );
}

/**
 * Sync the calendar and (re)schedule reminder alarms for upcoming events.
 */
async function syncAndSchedule() {
  if (!(await isConnected())) return;

  let events;
  try {
    events = await fetchUpcomingEvents();
  } catch (error) {
    console.warn("[Meeting Flight] Sync failed:", error.message);
    return;
  }

  const leadMinutes = await getReminderLeadMinutes();
  const leadMs = leadMinutes * 60 * 1000;
  const now = Date.now();

  await clearReminderAlarms();

  const scheduledReminders = {};

  for (const event of events) {
    const reminderTime = event.startTime - leadMs;
    if (reminderTime <= now) continue; // Reminder time already passed.

    const alarmName = `${REMINDER_ALARM_PREFIX}${event.id}`;
    chrome.alarms.create(alarmName, { when: reminderTime });
    scheduledReminders[alarmName] = event;
  }

  await chrome.storage.local.set({
    [LOCAL_KEYS.scheduledReminders]: scheduledReminders,
    [LOCAL_KEYS.cachedEvents]: events,
  });
}

// ---------- Reminder delivery ----------

/**
 * Fly the plane reminder across the user's active tab, falling back to a
 * system notification when script injection is not possible (e.g. chrome:// pages).
 * @param {{title: string, startTime: number, hangoutLink: string|null}} event
 */
async function deliverReminder(event) {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  const canInject =
    activeTab &&
    activeTab.id !== undefined &&
    typeof activeTab.url === "string" &&
    /^https?:/.test(activeTab.url);

  if (canInject) {
    try {
      await chrome.scripting.insertCSS({
        target: { tabId: activeTab.id },
        files: ["src/content/plane.css"],
      });
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ["src/content/plane.js"],
      });
      await chrome.tabs.sendMessage(activeTab.id, {
        type: "MEETING_FLIGHT_SHOW",
        event,
      });
      return;
    } catch (error) {
      console.warn("[Meeting Flight] Injection failed:", error.message);
      // Fall through to notification.
    }
  }

  showSystemNotification(event);
}

function showSystemNotification(event) {
  const timeLabel = new Date(event.startTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  chrome.notifications.create(`meeting-flight:${event.startTime}`, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: "Meeting starting soon ✈️",
    message: `${event.title} at ${timeLabel}`,
    priority: 2,
  });
}

// ---------- Event wiring ----------

chrome.runtime.onInstalled.addListener(async () => {
  chrome.alarms.create(SYNC_ALARM_NAME, {
    periodInMinutes: CALENDAR_SYNC_INTERVAL_MINUTES,
  });
  await syncAndSchedule();
});

chrome.runtime.onStartup.addListener(() => {
  syncAndSchedule();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === SYNC_ALARM_NAME) {
    await syncAndSchedule();
    return;
  }

  if (alarm.name.startsWith(REMINDER_ALARM_PREFIX)) {
    const stored = await chrome.storage.local.get(LOCAL_KEYS.scheduledReminders);
    const reminders = stored[LOCAL_KEYS.scheduledReminders] || {};
    const event = reminders[alarm.name];
    if (event) {
      await deliverReminder(event);
      delete reminders[alarm.name];
      await chrome.storage.local.set({
        [LOCAL_KEYS.scheduledReminders]: reminders,
      });
    }
  }
});

// Clicking the notification opens the meeting link when present.
chrome.notifications.onClicked.addListener(async (notificationId) => {
  const stored = await chrome.storage.local.get(LOCAL_KEYS.cachedEvents);
  const events = stored[LOCAL_KEYS.cachedEvents] || [];
  const match = events.find(
    (event) => `meeting-flight:${event.startTime}` === notificationId
  );
  if (match && match.hangoutLink) {
    chrome.tabs.create({ url: match.hangoutLink });
  }
  chrome.notifications.clear(notificationId);
});

// Messages from the popup UI.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case "CONNECT": {
          await getAuthToken(true); // Triggers the consent screen.
          await chrome.storage.sync.set({ [STORAGE_KEYS.connected]: true });
          await syncAndSchedule();
          sendResponse({ ok: true });
          break;
        }
        case "DISCONNECT": {
          await signOut();
          await chrome.storage.sync.set({ [STORAGE_KEYS.connected]: false });
          await clearReminderAlarms();
          await chrome.storage.local.remove([
            LOCAL_KEYS.scheduledReminders,
            LOCAL_KEYS.cachedEvents,
          ]);
          sendResponse({ ok: true });
          break;
        }
        case "SYNC_NOW": {
          await syncAndSchedule();
          const stored = await chrome.storage.local.get(LOCAL_KEYS.cachedEvents);
          sendResponse({ ok: true, events: stored[LOCAL_KEYS.cachedEvents] || [] });
          break;
        }
        case "SET_LEAD_MINUTES": {
          await chrome.storage.sync.set({
            [STORAGE_KEYS.reminderLeadMinutes]: message.leadMinutes,
          });
          await syncAndSchedule();
          sendResponse({ ok: true });
          break;
        }
        case "PREVIEW": {
          await deliverReminder({
            title: "Preview meeting",
            startTime: Date.now() + 5 * 60 * 1000,
            hangoutLink: null,
          });
          sendResponse({ ok: true });
          break;
        }
        default:
          sendResponse({ ok: false, error: "Unknown message type." });
      }
    } catch (error) {
      sendResponse({ ok: false, error: error.message });
    }
  })();

  return true; // Keep the message channel open for the async response.
});
