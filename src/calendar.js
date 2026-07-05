// Google Calendar access: OAuth token handling and event fetching.

import {
  CALENDAR_EVENTS_ENDPOINT,
  CALENDAR_LOOKAHEAD_HOURS,
  OAUTH_SCOPES,
} from "./config.js";

/**
 * Acquire an OAuth access token via chrome.identity.
 * @param {boolean} interactive Whether to show the Google consent screen.
 * @returns {Promise<string>} The access token.
 */
export function getAuthToken(interactive) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken(
      { interactive, scopes: OAUTH_SCOPES },
      (token) => {
        const error = chrome.runtime.lastError;
        if (error || !token) {
          reject(new Error(error ? error.message : "No token returned."));
          return;
        }
        resolve(token);
      }
    );
  });
}

/**
 * Revoke and remove the cached OAuth token so the user is fully signed out.
 * @returns {Promise<void>}
 */
export async function signOut() {
  let token;
  try {
    token = await getAuthToken(false);
  } catch {
    return; // No cached token; nothing to revoke.
  }

  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
      method: "POST",
    });
  } catch {
    // Ignore network failures on revoke; still clear the local cache below.
  }

  await new Promise((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, resolve);
  });
}

/**
 * Fetch upcoming timed events from the user's primary calendar.
 * All-day events (which have no dateTime) are skipped.
 * @returns {Promise<Array<{id: string, title: string, startTime: number, hangoutLink: string|null}>>}
 */
export async function fetchUpcomingEvents() {
  const token = await getAuthToken(true);

  const now = new Date();
  const timeMax = new Date(
    now.getTime() + CALENDAR_LOOKAHEAD_HOURS * 60 * 60 * 1000
  );

  const query = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "50",
  });

  const response = await fetch(`${CALENDAR_EVENTS_ENDPOINT}?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 401) {
    // Token expired or revoked. Drop it so the next call re-authenticates.
    await new Promise((resolve) =>
      chrome.identity.removeCachedAuthToken({ token }, resolve)
    );
    throw new Error("Authentication expired. Please reconnect your calendar.");
  }

  if (!response.ok) {
    throw new Error(`Calendar request failed (${response.status}).`);
  }

  const data = await response.json();
  const items = Array.isArray(data.items) ? data.items : [];

  return items
    .filter((item) => item.start && item.start.dateTime && item.status !== "cancelled")
    .map((item) => ({
      id: item.id,
      title: item.summary || "(No title)",
      startTime: new Date(item.start.dateTime).getTime(),
      hangoutLink: item.hangoutLink || null,
    }));
}
