// Tests for decideAlert() in background.js -- how an alert gets delivered.
//
//   node tests/test_alert.js
//
// As of v2.1300 the service worker owns the alert, so this is where the
// sound-vs-window decision lives. It is the part where a mistake is silent and
// expensive: pick wrong and the agent hears nothing and goes into Refusal.

const stub = require("./chrome_stub");

stub.install();
stub.load("background.js");

const { check, done } = stub.reporter();

const resolve = p => "chrome-extension://TESTID/" + p;
const decide = (kind, stored) => decideAlert(kind, stored, resolve);

// --- default: invisible sound ----------------------------------------------
let d = decide("commitment", {});
check("commitment with nothing configured plays the bundled sound invisibly",
    d.mode === "sound" && d.url.endsWith("melodyFinal.mp3"));

d = decide("chat", {});
check("chat with nothing configured plays the bundled chat sound invisibly",
    d.mode === "sound" && d.url.endsWith("chat_melody.mp3"));

// --- window mode ------------------------------------------------------------
d = decide("commitment", { windowMode: true, mytext: "https://youtu.be/abc" });
check("window mode with a link opens the link",
    d.mode === "window" && d.url === "https://youtu.be/abc");

d = decide("commitment", { windowMode: true });
check("window mode with no link opens the bundled sound in a window (old behaviour)",
    d.mode === "window" && d.url.endsWith("melodyFinal.mp3"));

// --- a link cannot be played invisibly --------------------------------------
d = decide("commitment", { mytext: "https://youtu.be/abc" });
check("a link with window mode OFF falls back to the bundled sound, not the link",
    d.mode === "sound" && d.url.endsWith("melodyFinal.mp3"));

// --- the two alert kinds are independent ------------------------------------
d = decide("chat", { windowMode: true, chat_mytext: "https://youtu.be/chat" });
check("commitment window mode does not leak into chat",
    d.mode === "sound");

d = decide("chat", { chat_windowMode: true, chat_mytext: "https://youtu.be/chat" });
check("chat uses its own mode flag and its own link",
    d.mode === "window" && d.url === "https://youtu.be/chat");

// --- legacy sentinel --------------------------------------------------------
d = decide("chat", { chat_windowMode: true, chat_mytext: "5282" });
check("legacy 5282 sentinel is treated as 'no link', not as a URL",
    d.mode === "window" && d.url.endsWith("chat_melody.mp3"));

d = decide("chat", { chat_mytext: "5282" });
check("legacy 5282 sentinel with window mode off plays the default sound",
    d.mode === "sound" && d.url.endsWith("chat_melody.mp3"));

// --- empty string is not a link --------------------------------------------
d = decide("commitment", { windowMode: true, mytext: "" });
check("an empty link string is treated as unset",
    d.mode === "window" && d.url.endsWith("melodyFinal.mp3"));

// --- unknown kind -----------------------------------------------------------
check("an unknown alert kind returns null rather than throwing",
    decide("bogus", {}) === null);

// --- offline fallback config ------------------------------------------------
check("the fallback cloud URL is https and points at the commitment reminder",
    /^https:\/\//.test(DEFAULT_CONFIG.testPageUrl) &&
    DEFAULT_CONFIG.testPageUrl.includes("inContactCommitmentReminder"));

done();
