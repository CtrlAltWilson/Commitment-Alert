// Smoke test for the alert launcher in DetectKeywordsEngine.js.
//
//   node tests/test_alert.js
//
// The extension can only really be exercised in Chrome, but the alert logic --
// which link is chosen, whether the debounce holds, whether Telegram fires --
// is pure enough to test headlessly. That is the part where a mistake is
// silent and costly: an agent hears nothing and goes into Refusal.
//
// Everything above HighlightEngine is loaded and run against stubbed chrome.*
// and window APIs. No dependencies; Node only.

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SOURCE = path.join(__dirname, "..", "DetectKeywordsEngine.js");
const full = fs.readFileSync(SOURCE, "utf8");
const marker = "function HighlightEngine() {";
if (!full.includes(marker)) {
    console.error("Could not find %j in %s -- has the file been restructured?", marker, SOURCE);
    process.exit(1);
}
const alertCore = full.slice(0, full.indexOf(marker));

let store = {};
let opened = [];
let posted = [];

global.FEATURES = { telegram: true };
global.chrome = {
    storage: { sync: {
        get(keys, cb) {
            const out = {};
            keys.forEach(k => { if (k in store) out[k] = store[k]; });
            cb(out);
        },
        set(patch, cb) { Object.assign(store, patch); if (cb) cb(); }
    }},
    runtime: { getURL: p => "chrome-extension://TESTID/" + p }
};
global.window = { open: (url, name) => opened.push({ url, name }) };
global.XMLHttpRequest = function () {
    this.open = () => {};
    this.setRequestHeader = () => {};
    this.send = body => posted.push(JSON.parse(body));
};

vm.runInThisContext(alertCore, { filename: SOURCE });

let failures = 0;
function check(name, condition) {
    console.log((condition ? "  PASS  " : "  FAIL  ") + name);
    if (!condition) failures++;
}
function reset(settings) {
    store = Object.assign({ enabledDisabled: true }, settings);
    opened = [];
    posted = [];
}

reset({});
launchLink("commitment");
check("commitment with no link configured plays the bundled sound",
    opened.length === 1 && opened[0].url.endsWith("melodyFinal.mp3") && opened[0].name === "Commitment");

reset({});
launchLink("chat");
check("chat with no link configured plays the bundled chat sound",
    opened.length === 1 && opened[0].url.endsWith("chat_melody.mp3") && opened[0].name === "Chat");

reset({ mytext: "https://youtu.be/abc" });
launchLink("commitment");
check("commitment opens the configured link",
    opened.length === 1 && opened[0].url === "https://youtu.be/abc");

reset({ chat_mytext: "5282" });
launchLink("chat");
check("legacy 5282 sentinel still falls back to the default sound",
    opened.length === 1 && opened[0].url.endsWith("chat_melody.mp3"));

reset({});
launchLink("commitment");
launchLink("commitment");
launchLink("commitment");
check("debounce: three alerts in a row fire only once", opened.length === 1);

reset({});
store.endTime = Date.now() - 1;
launchLink("commitment");
check("debounce expires and the next alert fires", opened.length === 1);

reset({});
store.enabledDisabled = false;
launchLink("commitment");
check("switched off means no alert", opened.length === 0);

reset({ tid_mytext: "12345" });
launchLink("commitment");
check("Telegram notified when a chat id is set",
    posted.length === 1 && posted[0].chatid === "12345" && posted[0].message === "You have a commitment!");

reset({});
launchLink("chat");
check("no Telegram call when no chat id is set", posted.length === 0);

reset({ tid_mytext: "12345" });
global.FEATURES = { telegram: false };
launchLink("chat");
check("no-Telegram build still alerts but makes no notify call",
    posted.length === 0 && opened.length === 1);
global.FEATURES = { telegram: true };

reset({});
launchLink("bogus");
check("an unknown alert kind is ignored rather than throwing", opened.length === 0);

console.log(failures ? `\n${failures} FAILED` : "\nall passed");
process.exit(failures ? 1 : 0);
