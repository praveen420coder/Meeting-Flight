// Popup controller: wires the UI to the background service worker.

import {
  DEFAULT_REMINDER_LEAD_MINUTES,
  LOCAL_KEYS,
  STORAGE_KEYS,
} from "../config.js";

const elements = {
  connectionStatus: document.getElementById("connection-status"),
  connectButton: document.getElementById("connect-button"),
  disconnectButton: document.getElementById("disconnect-button"),
  leadInput: document.getElementById("lead-minutes"),
  syncButton: document.getElementById("sync-button"),
  eventsList: document.getElementById("events-list"),
  previewButton: document.getElementById("preview-button"),
  message: document.getElementById("message"),
};

/**
 * Send a message to the background worker and await its response.
 * @param {object} payload
 * @returns {Promise<object>}
 */
function sendMessage(payload) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(payload, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response || { ok: false, error: "No response." });
    });
  });
}

function showMessage(text, kind) {
  elements.message.textContent = text;
  elements.message.className = `message ${kind}`;
  window.setTimeout(() => {
    elements.message.classList.add("hidden");
  }, 4000);
}

function setConnectedUi(connected) {
  if (connected) {
    elements.connectionStatus.textContent = "Connected";
    elements.connectionStatus.className = "status-badge connected";
    elements.connectButton.classList.add("hidden");
    elements.disconnectButton.classList.remove("hidden");
  } else {
    elements.connectionStatus.textContent = "Not connected";
    elements.connectionStatus.className = "status-badge disconnected";
    elements.connectButton.classList.remove("hidden");
    elements.disconnectButton.classList.add("hidden");
  }
}

function renderEvents(events) {
  elements.eventsList.innerHTML = "";

  if (!events || events.length === 0) {
    const empty = document.createElement("li");
    empty.className = "events-empty";
    empty.textContent = "No upcoming meetings in the next 24 hours.";
    elements.eventsList.appendChild(empty);
    return;
  }

  for (const event of events) {
    const item = document.createElement("li");
    item.className = "event-item";

    const title = document.createElement("span");
    title.className = "event-title";
    title.textContent = event.title;

    const time = document.createElement("span");
    time.className = "event-time";
    time.textContent = new Date(event.startTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    item.appendChild(title);
    item.appendChild(time);
    elements.eventsList.appendChild(item);
  }
}

async function loadInitialState() {
  const [syncStore, localStore] = await Promise.all([
    chrome.storage.sync.get([
      STORAGE_KEYS.connected,
      STORAGE_KEYS.reminderLeadMinutes,
    ]),
    chrome.storage.local.get(LOCAL_KEYS.cachedEvents),
  ]);

  setConnectedUi(Boolean(syncStore[STORAGE_KEYS.connected]));

  const lead = syncStore[STORAGE_KEYS.reminderLeadMinutes];
  elements.leadInput.value =
    Number.isFinite(Number(lead)) && lead !== undefined
      ? lead
      : DEFAULT_REMINDER_LEAD_MINUTES;

  renderEvents(localStore[LOCAL_KEYS.cachedEvents]);
}

// ---------- Event handlers ----------

elements.connectButton.addEventListener("click", async () => {
  elements.connectButton.disabled = true;
  const response = await sendMessage({ type: "CONNECT" });
  elements.connectButton.disabled = false;

  if (response.ok) {
    setConnectedUi(true);
    showMessage("Calendar connected.", "success");
    await refreshEvents();
  } else {
    showMessage(response.error || "Could not connect.", "error");
  }
});

elements.disconnectButton.addEventListener("click", async () => {
  const response = await sendMessage({ type: "DISCONNECT" });
  if (response.ok) {
    setConnectedUi(false);
    renderEvents([]);
    showMessage("Calendar disconnected.", "success");
  } else {
    showMessage(response.error || "Could not disconnect.", "error");
  }
});

elements.leadInput.addEventListener("change", async () => {
  const leadMinutes = Math.max(
    0,
    Math.min(120, Math.round(Number(elements.leadInput.value) || 0))
  );
  elements.leadInput.value = leadMinutes;
  const response = await sendMessage({ type: "SET_LEAD_MINUTES", leadMinutes });
  if (response.ok) {
    showMessage(`Reminder set to ${leadMinutes} min before.`, "success");
  } else {
    showMessage(response.error || "Could not save setting.", "error");
  }
});

async function refreshEvents() {
  const response = await sendMessage({ type: "SYNC_NOW" });
  if (response.ok) {
    renderEvents(response.events);
  } else {
    showMessage(response.error || "Could not refresh.", "error");
  }
}

elements.syncButton.addEventListener("click", refreshEvents);

elements.previewButton.addEventListener("click", async () => {
  const response = await sendMessage({ type: "PREVIEW" });
  if (!response.ok) {
    showMessage(
      response.error || "Open a normal web page to preview the plane.",
      "error"
    );
  } else {
    window.close(); // Close popup so the user can watch the plane fly.
  }
});

loadInitialState();
