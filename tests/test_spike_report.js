// Tests for summarise() in background.js -- the function that turns the
// CALERT-20 spike log into an answer.
//
//   node tests/test_spike_report.js
//
// Worth testing because the report IS the deliverable of the spike: if the
// pairing or verdict logic is wrong we draw the wrong conclusion from a week
// of real data and either keep an over-broad permission we didn't need, or
// drop the content script and start missing commitments.

const stub = require("./chrome_stub");

stub.install();
stub.load("background.js");

const { check, done } = stub.reporter();

const T = 1770000000000;
const webnav = (t, tabId, frameId, event) =>
    ({ t, source: "webnav", event: event || "onCommitted", url: "https://x/apex/inContactCommitmentReminder?mode=", tabId, frameId });
const content = (t, tabId, frameId, kind) =>
    ({ t, source: "content", kind: kind || "commitment", url: "https://x/apex/inContactCommitmentReminder?mode=", tabId, frameId });

// --- empty log --------------------------------------------------------------
let r = summarise([]);
check("empty log reports zero entries", r.entries === 0 && r.firstSeen === null);
check("empty log verdict says webNavigation produced no events",
    /NO events/.test(r.verdict));

// --- webNavigation never fired ---------------------------------------------
r = summarise([content(T, 1, 0), content(T + 5000, 1, 0)]);
check("content-only log counts both detections", r.bySource.content === 2 && r.bySource.webnav === undefined);
check("content-only log verdict flags the permission/navigation question",
    /NO events/.test(r.verdict));

// --- both fired, correlated -------------------------------------------------
r = summarise([webnav(T, 7, 0), content(T + 120, 7, 0)]);
check("paired detection is matched", r.pairings.length === 1 && r.pairings[0].matched === true);
check("webNavigation lead time is measured", r.pairings[0].webnavLedByMs === 120);
check("verdict reports the match", /matched 1\/1/.test(r.verdict));

// --- different tabs must not pair ------------------------------------------
r = summarise([webnav(T, 7, 0), content(T + 120, 99, 0)]);
check("detections in different tabs do not pair", r.pairings[0].matched === false);

// --- outside the 10s window must not pair ----------------------------------
r = summarise([webnav(T, 7, 0), content(T + 20000, 7, 0)]);
check("detections >10s apart do not pair", r.pairings[0].matched === false);

// --- sub-frame accounting ---------------------------------------------------
r = summarise([webnav(T, 7, 0), webnav(T + 1, 7, 3), content(T + 2, 7, 4)]);
check("top-frame and sub-frame webNavigation events counted separately",
    r.webnavTopFrame === 1 && r.webnavSubFrame === 1);
check("content sub-frame detections counted", r.contentSubFrame === 1 && r.contentTopFrame === 0);

// --- chat detections must not be paired as commitments ----------------------
r = summarise([webnav(T, 7, 0), content(T + 50, 7, 0, "chat")]);
check("chat detections are excluded from commitment pairing", r.pairings.length === 0);

// --- event breakdown --------------------------------------------------------
r = summarise([webnav(T, 7, 0, "onCommitted"), webnav(T + 1, 7, 0, "onCompleted"), content(T + 2, 7, 0)]);
check("events broken down by name",
    r.byEvent.onCommitted === 1 && r.byEvent.onCompleted === 1 && r.byEvent.commitment === 1);
check("only onCommitted is used for pairing", r.pairings[0].matched === true);

// --- fired but never together ----------------------------------------------
r = summarise([webnav(T, 7, 0), content(T + 60000, 7, 0)]);
check("webNavigation firing without correlation is called out",
    /never alongside/.test(r.verdict));

done();
