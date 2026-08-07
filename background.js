// MV3 service worker -- now the owner of the alert.
//
// Until v2.1200 this file was `//do nothing`. As of v2.1300 the content
// scripts are pure detectors: they notice a commitment or a chat and send one
// message. Everything else -- the debounce, choosing sound vs window, playing
// the audio, the toolbar badge, and every way an alert can stop -- lives here.
//
// Why the move: audio can only be played invisibly from an offscreen document,
// which only the service worker can create. It also fixes two older problems.
// The once-per-minute debounce used to be written from every frame of every
// Salesforce tab against a 120-writes-per-minute storage.sync quota (finding
// B8); there is now a single writer. And opening the alert window from a
// content script was at the mercy of the popup blocker, because it happened
// without a user gesture -- chrome.windows.create is not.
//
// MV3 rules this file has to respect:
//   * Listeners MUST be registered synchronously at the top level, or Chrome
//     starts the worker for an event that then has nobody to deliver it to.
//   * The worker is terminated after ~30 s idle. Keep NO state in module
//     variables -- anything that must survive goes in chrome.storage.
//   * chrome.alarms, never setTimeout, for anything longer than a moment.

importScripts("features.js");

const API_URL = "https://wilsonngo.com/api";

// One alert per minute, however many tabs and frames saw it.
const ALERT_COOLDOWN_MS = 60000;

// Commitments expire in about two minutes. This is the backstop that
// guarantees audio can never play forever if every other stop signal is
// missed -- the worst failure mode available to this feature.
const ALERT_TIMEOUT_MINUTES = 2.5;

// Legacy sentinel: a chat link of exactly "5282" means "use the default
// sound". Preserved because it may be sitting in someone's synced settings.
const USE_DEFAULT_SOUND = "5282";

const ALERTS = {
    commitment: {
        linkKey: "mytext",
        modeKey: "windowMode",
        sound: "melodyFinal.mp3",
        windowName: "Commitment",
        message: "You have a commitment!"
    },
    chat: {
        linkKey: "chat_mytext",
        modeKey: "chat_windowMode",
        sound: "chat_melody.mp3",
        windowName: "Chat",
        message: "You have a chat!"
    }
};

// Where the cloud button in the popup goes when the extension has never
// reached the config endpoint. Deliberately a real working URL, not a
// placeholder: the button has to work offline, on first run, and if Support
// Utilities is down. See docs/Remote-Config-and-Relay.md.
const DEFAULT_CONFIG = {
    testPageUrl: "https://raptor--icagentconsole.vf.force.com/apex/inContactCommitmentReminder?mode=",
    chatPhrase: "There is a chat contact waiting",
    notice: null,
    minVersion: null
};

// --- pure decision logic (unit-tested in tests/test_alert.js) ---------------

// Given the stored settings, decide how this alert should be delivered.
// Returns { mode: "sound" | "window", url, windowName }.
//
// Order matters:
//
//  1. A configured link ALWAYS opens a window. A link is a web page, not
//     audio, so there is no invisible way to play it -- the choice does not
//     exist, and pretending otherwise is what made v2.1300 silently play the
//     default melody over someone's YouTube link. The popup ticks and disables
//     the checkbox to match, but this function is the authority: a stale or
//     hand-edited storage value cannot contradict it.
//  2. Otherwise a window is the default (v2.1400). Only an explicit false --
//     someone deliberately unticking the box -- gives invisible playback.
function decideAlert(kind, stored, resolveUrl) {
    const alert = ALERTS[kind];
    if (!alert) return null;

    const link = stored[alert.linkKey];
    const hasLink = link !== undefined && link !== "" && link !== USE_DEFAULT_SOUND;

    if (hasLink) {
        return { mode: "window", url: link, windowName: alert.windowName };
    }
    if (stored[alert.modeKey] !== false) {
        return { mode: "window", url: resolveUrl(alert.sound), windowName: alert.windowName };
    }
    return { mode: "sound", url: resolveUrl(alert.sound), windowName: alert.windowName };
}

// --- alert lifecycle --------------------------------------------------------

async function maybeAlert(kind, sender) {
    const alert = ALERTS[kind];
    if (!alert) return;

    const sync = await chrome.storage.sync.get([
        "enabledDisabled", "tid_mytext", alert.linkKey, alert.modeKey
    ]);
    if (sync.enabledDisabled !== true) return;

    // Single-writer debounce in storage.local. Content scripts no longer touch
    // it, so the storage.sync write-quota problem is gone.
    const local = await chrome.storage.local.get(["alertEndTime"]);
    const now = Date.now();
    if (local.alertEndTime && now < local.alertEndTime) return;
    await chrome.storage.local.set({ alertEndTime: now + ALERT_COOLDOWN_MS });

    const decision = decideAlert(kind, sync, path => chrome.runtime.getURL(path));
    if (!decision) return;

    let windowId = null;
    if (decision.mode === "window") {
        try {
            const created = await chrome.windows.create({
                url: decision.url,
                type: "popup",
                width: 560,
                height: 420
            });
            windowId = created ? created.id : null;
        } catch (e) {
            console.log("[commitment-alert] window.create failed", e);
        }
    } else {
        await playSound(decision.url);
    }

    await chrome.storage.local.set({
        activeAlert: {
            kind: kind,
            mode: decision.mode,
            tabId: sender && sender.tab ? sender.tab.id : null,
            windowId: windowId,
            startedAt: now
        }
    });

    chrome.action.setBadgeText({ text: "♪" });
    chrome.action.setBadgeBackgroundColor({ color: "#D93025" });
    // Clearing the popup is what makes chrome.action.onClicked fire, which is
    // how a single click on the toolbar icon stops the alert.
    chrome.action.setPopup({ popup: "" });
    chrome.alarms.create("alert-timeout", { delayInMinutes: ALERT_TIMEOUT_MINUTES });

    if (sync.tid_mytext) notifyTelegram(alert, sync.tid_mytext);
}

async function stopAlert() {
    const { activeAlert } = await chrome.storage.local.get(["activeAlert"]);

    try {
        await chrome.runtime.sendMessage({ target: "offscreen", type: "STOP" });
    } catch (e) {
        // No offscreen document open. Fine.
    }

    if (activeAlert && activeAlert.windowId !== null && activeAlert.windowId !== undefined) {
        try {
            await chrome.windows.remove(activeAlert.windowId);
        } catch (e) {
            // Already closed by the user.
        }
    }

    await chrome.storage.local.remove("activeAlert");
    chrome.alarms.clear("alert-timeout");
    chrome.action.setBadgeText({ text: "" });
    chrome.action.setPopup({ popup: "popup.html" });
}

async function playSound(url) {
    try {
        await ensureOffscreen();
        await chrome.runtime.sendMessage({ target: "offscreen", type: "PLAY", url: url });
    } catch (e) {
        console.log("[commitment-alert] offscreen playback failed", e);
    }
}

async function ensureOffscreen() {
    // Only one offscreen document may exist per profile. hasDocument() is not
    // available on every Chrome that supports the API, so treat the
    // "already exists" error as success rather than depending on it.
    try {
        await chrome.offscreen.createDocument({
            url: "offscreen.html",
            reasons: ["AUDIO_PLAYBACK"],
            justification: "Play the commitment alert sound without opening a visible window."
        });
    } catch (e) {
        if (!String(e).includes("Only a single offscreen")) throw e;
    }
}

function notifyTelegram(alert, chatId) {
    if (!FEATURES.telegram) return;
    fetch(`${API_URL}/v1/sendgram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatid: chatId, app: "commitment_alert", message: alert.message })
    }).catch(e => console.log("[commitment-alert] sendgram failed", e));
}

// --- listeners (all registered synchronously) -------------------------------

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Messages addressed to the offscreen document are not ours.
    if (!message || !message.type || message.target === "offscreen") return;

    if (message.type === "ALERT") {
        maybeAlert(message.kind, sender);
        if (FEATURES.navSpike) recordSpike({
            t: Date.now(), source: "content", kind: message.kind,
            url: (sender && sender.url) || "",
            tabId: sender && sender.tab ? sender.tab.id : null,
            frameId: sender ? sender.frameId : null
        });
        return;
    }

    // The commitment page went away -- stop the alert early.
    if (message.type === "GONE") {
        stopAlert();
        return;
    }

    if (message.type === "GET_CONFIG") {
        chrome.storage.local.get(["config"], data => {
            sendResponse(Object.assign({}, DEFAULT_CONFIG, data.config || {}));
        });
        return true;
    }

    if (message.type === "GET_SPIKE_REPORT") {
        chrome.storage.local.get([SPIKE_LOG_KEY], data => {
            sendResponse(summarise(data[SPIKE_LOG_KEY] || []));
        });
        return true;
    }

    if (message.type === "CLEAR_SPIKE_LOG") {
        chrome.storage.local.remove(SPIKE_LOG_KEY, () => sendResponse({ cleared: true }));
        return true;
    }
});

// Single click on the toolbar icon stops the alert. Only fires while the popup
// is cleared, i.e. only while alerting.
chrome.action.onClicked.addListener(() => stopAlert());

// The tab that reported the commitment was closed.
chrome.tabs.onRemoved.addListener(tabId => {
    chrome.storage.local.get(["activeAlert"], data => {
        if (data.activeAlert && data.activeAlert.tabId === tabId) stopAlert();
    });
});

// The user closed the alert window themselves.
chrome.windows.onRemoved.addListener(windowId => {
    chrome.storage.local.get(["activeAlert"], data => {
        if (data.activeAlert && data.activeAlert.windowId === windowId) stopAlert();
    });
});

// Backstop. Must be an alarm, not setTimeout: the worker is terminated after
// ~30 s idle and a pending timeout would die with it, leaving audio playing
// with nothing left to stop it.
chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === "alert-timeout") stopAlert();
});

// v2.1300 briefly made invisible the default and wrote windowMode:false for
// anyone without a link. v2.1400 reverses that: a window is the default again,
// and invisible is opt-in. Clearing the stored flags puts everyone back on the
// default rather than leaving them on a setting they never chose.
//
// Safe to do bluntly because v2.1300 never went past testing. Do NOT reuse
// this pattern once a release has reached the team -- it discards a real user
// choice along with the accidental one.
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get(["modeDefaultReset"], stored => {
        if (stored.modeDefaultReset) return;
        chrome.storage.sync.remove(["windowMode", "chat_windowMode", "modeMigrated"], () => {
            chrome.storage.sync.set({ modeDefaultReset: true });
        });
    });
    // Clear any badge left over from an interrupted alert.
    chrome.action.setBadgeText({ text: "" });
    chrome.action.setPopup({ popup: "popup.html" });
});

// --- CALERT-20 spike --------------------------------------------------------
// Observation only: it never fires an alert. See
// docs/Spike-webNavigation-Runbook.md.

const SPIKE_LOG_KEY = "navSpikeLog";
const SPIKE_LOG_MAX = 300;
const COMMITMENT_PATH = "inContactCommitmentReminder";

function recordSpike(entry) {
    chrome.storage.local.get([SPIKE_LOG_KEY], data => {
        const log = Array.isArray(data[SPIKE_LOG_KEY]) ? data[SPIKE_LOG_KEY] : [];
        log.push(entry);
        while (log.length > SPIKE_LOG_MAX) log.shift();
        chrome.storage.local.set({ [SPIKE_LOG_KEY]: log });
    });
    console.log("[commitment-alert]", entry.source, entry.event || entry.kind, entry.url);
}

if (FEATURES.navSpike && chrome.webNavigation) {
    const filter = { url: [{ pathContains: COMMITMENT_PATH }] };
    const observe = eventName => details => recordSpike({
        t: Date.now(),
        source: "webnav",
        event: eventName,
        url: details.url,
        tabId: details.tabId,
        frameId: details.frameId,
        transitionType: details.transitionType || null
    });
    chrome.webNavigation.onCommitted.addListener(observe("onCommitted"), filter);
    chrome.webNavigation.onCompleted.addListener(observe("onCompleted"), filter);
    chrome.webNavigation.onHistoryStateUpdated.addListener(observe("onHistoryStateUpdated"), filter);
    console.log("[commitment-alert] webNavigation spike active, filter pathContains:", COMMITMENT_PATH);
}

function summarise(log) {
    const report = {
        entries: log.length,
        firstSeen: log.length ? new Date(log[0].t).toISOString() : null,
        lastSeen: log.length ? new Date(log[log.length - 1].t).toISOString() : null,
        bySource: {},
        byEvent: {},
        webnavTopFrame: 0,
        webnavSubFrame: 0,
        contentTopFrame: 0,
        contentSubFrame: 0,
        pairings: []
    };

    log.forEach(e => {
        report.bySource[e.source] = (report.bySource[e.source] || 0) + 1;
        const label = e.event || e.kind || "?";
        report.byEvent[label] = (report.byEvent[label] || 0) + 1;
        if (e.source === "webnav") {
            e.frameId === 0 ? report.webnavTopFrame++ : report.webnavSubFrame++;
        } else if (e.source === "content") {
            e.frameId === 0 ? report.contentTopFrame++ : report.contentSubFrame++;
        }
    });

    const commits = log.filter(e => e.source === "webnav" && e.event === "onCommitted");
    log.filter(e => e.source === "content" && e.kind === "commitment").forEach(c => {
        let best = null;
        commits.forEach(w => {
            if (w.tabId !== c.tabId) return;
            if (Math.abs(w.t - c.t) > 10000) return;
            if (!best || Math.abs(w.t - c.t) < Math.abs(best.t - c.t)) best = w;
        });
        report.pairings.push({
            tabId: c.tabId,
            matched: !!best,
            webnavLedByMs: best ? c.t - best.t : null
        });
    });

    const matched = report.pairings.filter(p => p.matched).length;
    report.verdict =
        report.bySource.webnav === undefined
            ? "webNavigation produced NO events -- either the permission is insufficient or the commitment page is not a real navigation"
            : matched === 0
                ? "webNavigation fired, but never alongside a content-script detection -- check the URLs it did see"
                : `webNavigation matched ${matched}/${report.pairings.length} content-script detections`;

    return report;
}
