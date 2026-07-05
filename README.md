# Meeting Flight ✈️

A Chrome extension (Manifest V3) that connects to your Google Calendar and, a set number of minutes before each meeting, flies a banner-towing plane across whatever web page you're on — showing the meeting title and start time.

## Features

- Google Calendar sync via OAuth (`chrome.identity`), read-only.
- Configurable reminder lead time (default: 5 minutes before).
- A cartoon plane trails a banner with the meeting name + start time across the top of the active tab.
- Falls back to a system notification on pages where overlays can't be injected (e.g. `chrome://` pages, the Web Store).
- "Preview the plane" button to see the animation on demand.

## Project structure

```
manifest.json            Extension manifest (MV3)
icons/                   Toolbar / store icons
src/
  config.js              Shared constants
  calendar.js            OAuth + Google Calendar fetch
  background.js          Service worker: sync, alarms, reminder delivery
  content/
    plane.js             Injected script that renders the plane
    plane.css            Plane + banner animation styles
  popup/
    popup.html/.css/.js  Toolbar popup UI
```

## One-time setup: create a Google OAuth Client ID

The extension needs your own OAuth client so Google trusts it. This is free.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create (or pick) a project.
2. **APIs & Services → Library →** search **Google Calendar API** → **Enable**.
3. **APIs & Services → OAuth consent screen:**
   - User type: **External** (or Internal if you're in a Workspace org).
   - Fill in app name and your email. Under **Test users**, add your own Google address.
   - Add the scope `.../auth/calendar.events.readonly`.
4. Load the extension once (see below) and copy its **Extension ID** from `chrome://extensions`.
5. **APIs & Services → Credentials → Create Credentials → OAuth client ID:**
   - Application type: **Chrome Extension** (older consoles call it **Chrome App**).
   - **Item ID / Application ID:** paste the Extension ID from step 4.
6. Copy the generated **Client ID** (ends in `.apps.googleusercontent.com`).
7. Open `manifest.json` and replace `YOUR_OAUTH_CLIENT_ID.apps.googleusercontent.com` with it.
8. Reload the extension in `chrome://extensions`.

> The Extension ID is stable across reloads once loaded unpacked, so do step 4 first, then create the credential.

## Load the extension

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top-right).
3. Click **Load unpacked** and select this folder (`Meeting Flight`).
4. Pin the extension, click its icon, and press **Connect calendar**.

## Using it

- Set how many minutes before a meeting you want the plane (0–120).
- Meetings for the next 24 hours are synced automatically every 15 minutes; press **Refresh** to sync now.
- When a reminder fires, switch to any normal web tab to watch the plane fly. Use **Preview the plane** to test it any time.

## Notes & limits

- Reminders use `chrome.alarms`; Chrome must be running for them to fire. If Chrome is fully closed at the reminder time, the alarm fires on next startup.
- Only timed events on your **primary** calendar are used; all-day events are skipped.
- The scope is read-only — the extension never modifies your calendar.
