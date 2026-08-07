// MV3 service worker.
//
// Until 2026-08-07 this file was literally `//do nothing`, which is why the
// extension was MV3 in name only: content scripts sent chrome.runtime messages
// that nothing was listening for (Code-Analysis finding B2). It now has a real
// message handler, and -- in the spike build only -- a parallel commitment
// detector built on chrome.webNavigation.
//
// MV3 rules this file has to respect:
//
//  * Listeners MUST be registered synchronously at the top level. Chrome
//    dispatches events to a sleeping worker by starting it and replaying the
//    event; a listener registered inside a callback is registered too late and
//    silently misses events.
//  * The worker is terminated after ~30 s idle. Keep NO state in module
//    variables -- anything that must survive goes in chrome.storage.
//  * Use chrome.alarms, never setTimeout, for anything longer than a moment.

importScripts("features.js");

const SPIKE_LOG_KEY = "navSpikeLog";
const SPIKE_LOG_MAX = 300;

// Matched against the URL path. Deliberately does NOT include "?mode=" -- the
// live URLs vary (?mode=Classic, ?mode=, and possibly none) and the point of
// the spike is to find out what actually arrives.
const COMMITMENT_PATH = "inContactCommitmentReminder";

// Append to a bounded log in storage.local (not .session -- the spike needs to
// survive worker restarts and browser restarts so data accumulates over days).
//
// Read-modify-write is not atomic, so two events in the same instant can lose
// one entry. Acceptable for a spike; do not reuse this shape for anything that
// must not drop writes.
function record(entry) {
    chrome.storage.local.get([SPIKE_LOG_KEY], data => {
        const log = Array.isArray(data[SPIKE_LOG_KEY]) ? data[SPIKE_LOG_KEY] : [];
        log.push(entry);
        while (log.length > SPIKE_LOG_MAX) log.shift();
        chrome.storage.local.set({ [SPIKE_LOG_KEY]: log });
    });
    console.log("[commitment-alert]", entry.source, entry.event || entry.kind, entry.url);
}

// --- messages from content scripts -----------------------------------------
// This is the direction that actually works: content script -> service worker.
// (Content script -> content script does not, which is finding B2.)

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) return;

    if (message.type === "DETECTED") {
        record({
            t: Date.now(),
            source: "content",
            kind: message.kind,
            url: (sender && sender.url) || "",
            tabId: sender && sender.tab ? sender.tab.id : null,
            frameId: sender ? sender.frameId : null
        });
        return;
    }

    if (message.type === "GET_SPIKE_REPORT") {
        chrome.storage.local.get([SPIKE_LOG_KEY], data => {
            sendResponse(summarise(data[SPIKE_LOG_KEY] || []));
        });
        return true; // keep the channel open for the async response
    }

    if (message.type === "CLEAR_SPIKE_LOG") {
        chrome.storage.local.remove(SPIKE_LOG_KEY, () => sendResponse({ cleared: true }));
        return true;
    }
});

// --- CALERT-20 spike: can webNavigation replace the content-script match? ---
//
// Runs ALONGSIDE the existing content-script detection and only observes -- it
// never fires an alert. If webNavigation turns out not to see the commitment
// page, nothing is lost: the content script is still doing the real work.
// That is the whole point. A missed commitment costs an agent a Refusal, so
// this cannot be an either/or experiment on live users.
//
// Two things the collected data has to answer:
//   1. Do events arrive at all for arbitrary hosts with only the
//      "webNavigation" permission (no host permissions)?
//   2. Is the commitment reminder a real navigation, or is it rendered
//      client-side into an existing frame? If the latter, webNavigation never
//      fires and the content script stays the right tool.

if (FEATURES.navSpike && chrome.webNavigation) {
    const filter = { url: [{ pathContains: COMMITMENT_PATH }] };

    const observe = eventName => details => record({
        t: Date.now(),
        source: "webnav",
        event: eventName,
        url: details.url,
        tabId: details.tabId,
        frameId: details.frameId,
        transitionType: details.transitionType || null
    });

    // onCommitted fires when the navigation is committed -- the earliest point
    // with a settled URL. onCompleted is the late bound. onHistoryStateUpdated
    // catches pushState/replaceState, which is how a single-page app would
    // change the URL without a real navigation.
    chrome.webNavigation.onCommitted.addListener(observe("onCommitted"), filter);
    chrome.webNavigation.onCompleted.addListener(observe("onCompleted"), filter);
    chrome.webNavigation.onHistoryStateUpdated.addListener(observe("onHistoryStateUpdated"), filter);

    console.log("[commitment-alert] webNavigation spike active, filter pathContains:", COMMITMENT_PATH);
}

// --- reporting --------------------------------------------------------------

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
        // Positive = webNavigation was first, i.e. it could alert sooner.
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

    // Pair each content-script detection with the nearest webNavigation
    // onCommitted for the same tab within 10 s, to see which arrived first.
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
