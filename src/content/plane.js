// Content script: renders a banner-towing plane that flies across the page.
// Injected on demand by the background worker, then triggered via a message.

(() => {
  // Guard against double-injection when executeScript runs more than once.
  if (window.__meetingFlightInjected) {
    // Still (re)register the listener check below by returning early; the
    // existing listener from the first injection remains active.
    return;
  }
  window.__meetingFlightInjected = true;

  const CONTAINER_ID = "meeting-flight-container";
  const FLIGHT_DURATION_MS = 9000;

  function formatStartTime(startTime) {
    return new Date(startTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function buildPlane(event) {
    const container = document.createElement("div");
    container.id = CONTAINER_ID;

    const flyer = document.createElement("div");
    flyer.className = "mf-flyer";

    // The banner text.
    const banner = document.createElement("div");
    banner.className = "mf-banner";

    const title = document.createElement("span");
    title.className = "mf-banner-title";
    title.textContent = event.title;

    const time = document.createElement("span");
    time.className = "mf-banner-time";
    time.textContent = `starts ${formatStartTime(event.startTime)}`;

    banner.appendChild(title);
    banner.appendChild(time);

    // The plane, drawn as inline SVG so it needs no external assets.
    const plane = document.createElement("div");
    plane.className = "mf-plane";
    plane.innerHTML = `
      <svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path class="mf-plane-body" d="M4 34 L92 26 Q108 25 116 32 Q108 39 92 38 L60 40 L44 52 L38 52 L46 40 L20 42 L12 50 L7 50 L11 40 L4 40 Z"/>
        <path class="mf-plane-wing" d="M58 30 L82 8 L88 10 L74 32 Z"/>
        <circle class="mf-plane-window" cx="86" cy="32" r="3"/>
        <circle class="mf-plane-window" cx="96" cy="32" r="3"/>
      </svg>`;

    // Flight direction is left-to-right, so the plane must sit on the right
    // (leading edge) and tow the banner trailing behind it on the left.
    flyer.appendChild(banner);
    flyer.appendChild(plane);
    container.appendChild(flyer);
    return container;
  }

  function showPlane(event) {
    const existing = document.getElementById(CONTAINER_ID);
    if (existing) existing.remove();

    const container = buildPlane(event);
    document.documentElement.appendChild(container);

    // Remove the element once the flight animation completes.
    window.setTimeout(() => {
      container.remove();
    }, FLIGHT_DURATION_MS);
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message && message.type === "MEETING_FLIGHT_SHOW" && message.event) {
      showPlane(message.event);
    }
  });
})();
