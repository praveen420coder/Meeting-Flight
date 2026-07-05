# Chrome Web Store listing — Meeting Flight

Copy-paste these into the Developer Dashboard fields. Replace bracketed
placeholders (privacy policy URL, support email) before submitting.

## Item name

Meeting Flight — Calendar Reminders

## Summary (132 characters max)

A little plane flies a banner across your screen to remind you before Google Calendar meetings start.

## Detailed description

Never miss the start of a meeting again. Meeting Flight connects to your Google
Calendar and, a few minutes before each meeting, flies a cheerful banner-towing
plane across whatever page you're on — showing the meeting title and start time.

Features
- Connects securely to Google Calendar (read-only).
- Choose how many minutes before a meeting you want the reminder (0–120).
- A plane tows a banner with your meeting name and time across the active tab.
- Falls back to a system notification on pages where overlays aren't allowed.
- "Preview the plane" button to see the animation any time.

How it works
1. Click the toolbar icon and connect your Google Calendar.
2. Set your reminder lead time.
3. Get back to work — the plane appears right before each meeting.

Privacy
Meeting Flight reads your upcoming events only to schedule reminders. Your
calendar data stays on your device and is never sent to any server we control.
Access is read-only; the extension never changes your calendar.

## Category

Productivity

## Language

English

## Single purpose (required field)

Meeting Flight has one purpose: to remind the user of upcoming Google Calendar
meetings by displaying an animated on-page banner a configurable number of
minutes before each meeting starts.

## Permission justifications (required for review)

identity
Used to obtain a Google OAuth token via chrome.identity so the extension can
read the user's Google Calendar events. No identity data is stored or shared.

alarms
Used to schedule a reminder that fires a set number of minutes before each
meeting. Alarms are the only reliable way to trigger time-based reminders in a
Manifest V3 service worker.

storage
Stores the user's settings (reminder lead time, connection state) and a short-
lived cache of upcoming events needed to fire reminders. Stored locally only.

notifications
Displays a fallback system notification when the on-page plane cannot be shown
(for example on chrome:// pages or the Web Store).

scripting
Injects the plane/banner animation into the active tab at reminder time.

tabs
Identifies the active tab so the reminder is shown on the page the user is
currently viewing.

host access to https://www.googleapis.com/*
Required to call the Google Calendar API to read upcoming events.

host access to https://*/* and http://*/*
Required so the reminder plane can be injected into whatever normal web page the
user happens to be viewing when a meeting is about to start. The extension does
NOT read, collect, or transmit page content — it only appends a temporary banner
element and removes it after a few seconds. Injection happens solely at the
scheduled reminder moment, triggered by the meeting alarm, never continuously.

## Data usage disclosures (Privacy practices tab)

- Does this item collect or use personally identifiable information? No, beyond
  the calendar event data needed to function, which is not transmitted to the
  developer.
- Does this item collect or use health information? No.
- Does this item collect or use financial information? No.
- Is the data sold to third parties? No.
- Is the data used for purposes unrelated to the item's core functionality? No.
- Is the data used to determine creditworthiness or for lending? No.
- Certify compliance with the Developer Program Policies: yes.

## Assets you still need to provide

- Screenshots: at least one, 1280x800 or 640x400 PNG/JPEG. Tip: take a screenshot
  of a normal web page mid-flight (use the Preview the plane button), plus one of
  the popup.
- Small promo tile (optional now, recommended): 440x280 PNG.
- Store icon: 128x128 (already included as icons/icon128.png).
- Privacy policy URL: host PRIVACY_POLICY.html and paste its public URL.
- Support email: [your support email].
