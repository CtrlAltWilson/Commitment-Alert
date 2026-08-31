// Minimal chrome.* / service-worker stubs so background.js can be loaded and
// exercised under plain Node.
//
// Shared by the test files so a newly-used API only has to be stubbed once --
// forgetting one shows up as "Cannot read properties of undefined (reading
// 'addListener')" at load time, which is a load-bearing failure rather than a
// nuisance: it means a listener would not have been registered in Chrome
// either.

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const noop = () => {};
const listener = () => ({ addListener: noop, removeListener: noop });

function install(options) {
    options = options || {};

    global.importScripts = noop;
    global.FEATURES = Object.assign({ navSpike: false }, options.features);

    global.chrome = {
        storage: {
            local: { get: (k, cb) => cb && cb({}), set: noop, remove: (k, cb) => cb && cb() },
            sync: { get: (k, cb) => cb && cb({}), set: noop }
        },
        runtime: {
            onMessage: listener(),
            onInstalled: listener(),
            getURL: p => "chrome-extension://TESTID/" + p,
            sendMessage: noop,
            lastError: null
        },
        action: {
            onClicked: listener(),
            setBadgeText: noop,
            setBadgeBackgroundColor: noop,
            setPopup: noop
        },
        tabs: { onRemoved: listener() },
        windows: { onRemoved: listener(), create: noop, remove: noop },
        alarms: { onAlarm: listener(), create: noop, clear: noop },
        offscreen: { createDocument: noop }
        // chrome.webNavigation is deliberately absent unless a test adds it:
        // with navSpike false the spike block must not touch it.
    };

    if (options.webNavigation) {
        global.chrome.webNavigation = {
            onCommitted: listener(),
            onCompleted: listener(),
            onHistoryStateUpdated: listener()
        };
    }
}

// Load a source file into the global scope, silencing its startup logging.
function load(relativePath) {
    const file = path.join(__dirname, "..", relativePath);
    const realLog = console.log;
    console.log = noop;
    try {
        vm.runInThisContext(fs.readFileSync(file, "utf8"), { filename: file });
    } finally {
        console.log = realLog;
    }
}

function reporter() {
    const state = { failures: 0 };
    state.check = (name, condition) => {
        console.log((condition ? "  PASS  " : "  FAIL  ") + name);
        if (!condition) state.failures++;
    };
    state.done = () => {
        console.log(state.failures ? `\n${state.failures} FAILED` : "\nall passed");
        process.exit(state.failures ? 1 : 0);
    };
    return state;
}

module.exports = { install, load, reporter };
