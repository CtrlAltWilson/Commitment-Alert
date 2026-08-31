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

// --- default is a window (v2.1400) ------------------------------------------
// A configured link must be used without the user touching a checkbox; that was
// the v2.1300 complaint -- a YouTube link silently played the default melody.
let d = decide("commitment", { mytext: "https://www.youtube.com/watch?v=abc" });
check("a link is opened by default, with no checkbox touched",
    d.mode === "window" && d.url === "https://www.youtube.com/watch?v=abc");

d = decide("commitment", {});
check("no link configured opens the bundled sound in a window by default",
    d.mode === "window" && d.url.endsWith("melodyFinal.mp3"));

d = decide("chat", {});
check("chat defaults to a window with the bundled chat sound",
    d.mode === "window" && d.url.endsWith("chat_melody.mp3"));

// --- invisible is opt-in, and only when there is no link --------------------
d = decide("commitment", { windowMode: false });
check("explicitly unticking the box plays invisibly",
    d.mode === "sound" && d.url.endsWith("melodyFinal.mp3"));

// A link wins over a stale or hand-edited windowMode:false. The popup ticks
// and disables the box to match, but storage must not be able to contradict
// this -- a link has no invisible form, so there is nothing to fall back to.
d = decide("commitment", { windowMode: false, mytext: "https://youtu.be/abc" });
check("a link overrides invisible mode and opens the link",
    d.mode === "window" && d.url === "https://youtu.be/abc");

d = decide("chat", { chat_windowMode: false, chat_mytext: "https://youtu.be/chat" });
check("the same rule applies to chat",
    d.mode === "window" && d.url === "https://youtu.be/chat");

// --- the two alert kinds stay independent -----------------------------------
d = decide("chat", { windowMode: false });
check("commitment invisible mode does not leak into chat",
    d.mode === "window" && d.url.endsWith("chat_melody.mp3"));

d = decide("commitment", { chat_windowMode: false });
check("chat invisible mode does not leak into commitment",
    d.mode === "window" && d.url.endsWith("melodyFinal.mp3"));

// --- legacy sentinel --------------------------------------------------------
d = decide("chat", { chat_mytext: "5282" });
check("legacy 5282 sentinel is treated as 'no link', not as a URL",
    d.mode === "window" && d.url.endsWith("chat_melody.mp3"));

// --- empty string is not a link --------------------------------------------
d = decide("commitment", { mytext: "" });
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
