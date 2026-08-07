// Alert launcher.
//
// Rewritten 2026-08-07. The commitment and chat paths were two copies of the
// same logic inside a stack of nested ifs and comma-sequenced expressions, with
// the alert kind passed as a bare 1 or 0. They are now one code path driven by
// the ALERTS table: adding a third alert type is a table entry, not another
// branch.

// Set to 1 to bypass the once-per-minute debounce while testing.
var debug_sound = 0;

// Only used by the Telegram notify call, which the no-Telegram build gates off.
const API_URL = "https://wilsonngo.com/api";

// One alert per minute, shared across every tab and frame via storage.sync.
// This is what stops eight open Salesforce tabs firing eight alerts.
const ALERT_COOLDOWN_MS = 60000;

// Legacy sentinel: a chat link of exactly "5282" means "use the default sound".
// Preserved because it may be saved in someone's synced settings.
const USE_DEFAULT_SOUND = "5282";

const ALERTS = {
    commitment: {
        linkKey: "mytext",
        sound: "melodyFinal.mp3",
        windowName: "Commitment",
        message: "You have a commitment!"
    },
    chat: {
        linkKey: "chat_mytext",
        sound: "chat_melody.mp3",
        windowName: "Chat",
        message: "You have a chat!"
    }
};

// True if enough time has passed since the last alert. Claims the slot as a
// side effect so a second caller in the same instant loses the race.
function claimAlertSlot(endTime) {
    const now = Date.now();
    const ready = endTime === undefined || endTime === "" || endTime < now || debug_sound === 1;
    if (!ready) return false;
    chrome.storage.sync.set({ endTime: now + ALERT_COOLDOWN_MS }, function() {});
    return true;
}

// What the user configured for this alert, or the bundled sound if nothing is
// set (or if the legacy "use default" sentinel is stored).
function alertTarget(alert, stored) {
    const configured = stored[alert.linkKey];
    if (configured === undefined || configured === "" || configured === USE_DEFAULT_SOUND) {
        return chrome.runtime.getURL(alert.sound);
    }
    return configured;
}

// Tell the service worker a detection happened. Observation only -- the alert
// does not depend on this, and a failure here must never stop one firing.
function reportDetection(kind) {
    try {
        chrome.runtime.sendMessage({ type: "DETECTED", kind: kind }, function() {
            // Reading lastError suppresses the "unchecked runtime.lastError"
            // console noise when the worker is not listening.
            void chrome.runtime.lastError;
        });
    } catch (e) {
        // Extension context invalidated (reload/update). Nothing to do.
    }
}

// kind: "commitment" | "chat"
function launchLink(kind) {
    const alert = ALERTS[kind];
    if (!alert) return;

    // Before the debounce, so the spike counts real detections rather than
    // the subset that survived the once-per-minute cooldown.
    reportDetection(kind);

    chrome.storage.sync.get(
        ["enabledDisabled", "endTime", "tid_mytext", alert.linkKey],
        function(stored) {
            if (stored.enabledDisabled !== true) return;
            // Was: enabledDisabled && (blocked === 0 || chat_mytext === "5282").
            // blacklist() only ever set blocked to 0 (its blocklist array was
            // always empty), so the extra clause could never change the outcome.
            if (!claimAlertSlot(stored.endTime)) return;

            window.open(alertTarget(alert, stored), alert.windowName, "resizable,scrollbars,status");

            if (stored.tid_mytext) notifyTelegram(alert, stored.tid_mytext);
        }
    );
}

function notifyTelegram(alert, chatId) {
    // Build-variant gate: the no-Telegram build makes no notify call at all.
    if (typeof FEATURES === "undefined" || !FEATURES.telegram) return;

    const request = new XMLHttpRequest();
    request.open("POST", `${API_URL}/v1/sendgram`);
    request.setRequestHeader("Content-Type", "application/json");
    request.onreadystatechange = function() {
        if (request.readyState === 4 && request.status !== 200) {
            console.log("sendgram failed", request.status, request.responseText);
        }
    };
    request.send(JSON.stringify({
        chatid: chatId,
        app: "commitment_alert",
        message: alert.message
    }));
}

function HighlightEngine() {
    var e = "Highlight",
        t = new RegExp("^(?:SCRIPT|HEAD|NOSCRIPT|STYLE|TEXTAREA)$"),
        o = {},
        i = {},
        n = new Set;
    this.highlightWords = function(n, r, s, g) {
        if (null != n && n && (n.nodeType !== Node.ELEMENT_NODE || !t.test(n.nodeName) && !n.matches(SkipSelectors))) {
            if (n.hasChildNodes())
                for (var a = 0; a < n.childNodes.length; a++) this.highlightWords(n.childNodes[a], r, s || n.isContentEditable, g);
            if (3 == n.nodeType) {
                var d = n.nodeValue;
                if ("" != d.trim())
                    if ("EM" != n.parentElement.tagName || n.parentElement.className != e) {
                        if (s ? (RegexConfig.doMatchRegexEditable ? regs = matchRegexEditable.exec(d) : regs = void 0, RegexConfig.doMatchRegexEditableCS ? regsCS = matchRegexEditableCS.exec(d) : regsCS = void 0) : (RegexConfig.doMatchRegex ? regs = matchRegex.exec(d) : regs = void 0, RegexConfig.doMatchRegexCS ? regsCS = matchRegexCS.exec(d) : regsCS = void 0), regs && regsCS ? (regs.index > regsCS.index || regs.index == regsCS.index && regsCS[0].length > regs[0].length) && (regs = regsCS) : regs = regs || regsCS, regs) {
                            var l = "";
                            for (word in wordColor) {
                                var h = new RegExp(wordColor[word].regex, wordColor[word].Matchtoken);
                                if ((!wordColor[word].findBackAgainstContent && h.test(regs[0]) || wordColor[word].findBackAgainstContent && h.test(regs.input)) && word.length > l.length) {
                                    l = word;
                                    break
                                }
                            }
                            if (null != wordColor[l]) {
                                var c = document.createElement("EM");
                                if (c.className = e, c.appendChild(document.createTextNode(regs[0])), launchLink("chat"), c.style = r ? "padding: 1px;box-shadow: 1px 1px #e5e5e5;border-radius: 3px;-webkit-print-color-adjust:exact;" : "padding: 1px;box-shadow: 1px 1px #e5e5e5;border-radius: 3px;", wordColor[l].Color && (c.style.backgroundColor = wordColor[l].Color), wordColor[l].Fcolor && (c.style.color = wordColor[l].Fcolor), c.setAttribute("match", wordColor[l].word), c.setAttribute("loopNumber", g), c.style.fontStyle = "inherit", !s || s && wordColor[l].ShowInEditableFields) {
                                    var m = n.splitText(regs.index);
                                    m.nodeValue = m.nodeValue.substring(regs[0].length), n.parentNode.insertBefore(c, m)
                                }
                                numberOfHighlights += 1, o[l] = o[l] + 1 || 1
                            }
                        }
                    } else if (n.parentElement.getAttribute("loopNumber") !== g.toString()) {
                    var f = this.findNodeAttributes(n.parentElement, {
                        offset: 0,
                        isInHidden: !1
                    });
                    i[numberOfHighlights] = {
                        word: n.parentElement.getAttribute("match"),
                        offset: f.offset,
                        hidden: f.isInHidden,
                        color: wordColor.find((e => e.word === n.parentElement.getAttribute("match"))).Color
                    }, numberOfHighlights += 1, o[n.parentElement.getAttribute("match")] = o[n.parentElement.getAttribute("match")] + 1 || 1
                }
            }
        }
    }, this.findNodeAttributes = function(e, t) {
        return t.offset += e.offsetTop, (e.hidden || e.getAttribute("aria-hidden")) && (t.isInHidden = !0), e.offsetParent ? this.findNodeAttributes(e.offsetParent, t) : t
    }, this.highlight = function(e, t, r, s, g) {
        return wordColor = e, numberOfHighlights = 0, RegexConfig = r, matchRegex = new RegExp(r.matchRegex, "i"), matchRegexCS = new RegExp(r.matchRegexCS, ""), matchRegexEditable = new RegExp(r.matchRegexEditable, "i"), matchRegexEditableCS = new RegExp(r.matchRegexEditableCS, ""), SkipSelectors = s, (matchRegex || matchRegexEditable) && this.highlightWords(document.body, t, !1, g), {
            numberOfHighlights: numberOfHighlights,
            details: o,
            markers: i,
            notify: Array.from(n),
            notifyAnyway: false
        }
    }
}
window.location.href.indexOf("/apex/inContactCommitmentReminder?mode=") > -1 && launchLink("commitment");
var debug = !1;

function highlightLoop() {
    ReadyToFindWords = !0, debug && console.log("in loop", debugStats), Highlight ? (findWords(), !Config.fixedLoopTime && HighlightLoopFrequency < Config.maxLoopTime && (HighlightLoopFrequency += Config.increaseLoop)) : !Config.fixedLoopTime && HighlightLoopFrequency > Config.minLoopTime && (HighlightLoopFrequency -= Config.decreaseLoop), debug && (debugStats.loopCount += 1), debug && console.log("new loop frequency", HighlightLoopFrequency), HighlightLoop = setTimeout((function() {
        highlightLoop()
    }), HighlightLoopFrequency)
}

function findWords() {
    if (Object.keys(wordsArray).length > 0) {
        Highlight = !1, debug && console.log("finding words", window.location), ReadyToFindWords = !1;
        var e = new HighlightEngine;
        regexConfig.removeStrings = "";
        var t = Math.floor(1e9 * Math.random()),
            o = e.highlight(wordsArray, printHighlights, regexConfig, skipSelectors, t);
        if (o.numberOfHighlights > 0) {
            for (marker in highlightMarkers = o.markers, markerPositions = [], highlightMarkers) - 1 == markerPositions.indexOf(highlightMarkers[marker].offset) && markerPositions.push(highlightMarkers[marker].offset);
            markerPositions.sort(), chrome.runtime.sendMessage({
                command: "showHighlights",
                count: o.numberOfHighlights,
                url: document.location.href
            }, (function(e) {}))
        }
        debug && console.log("finished finding words"), debug && (debugStats.findCount += 1), ReadyToFindWords = !0
    }
}
chrome.storage.sync.get(["enabledDisabled"], (function(e) {
    !0 === e.enabledDisabled && chrome.runtime.sendMessage({
        command: "getStatus"
    }, (function(e) {
        debug && console.log("reponse from getStatus", window.location), highlighterEnabled = e.status, printHighlights = e.printHighlights, Config = e.config, Highlight = Config.highlightAtStart, HighlightLoopFrequency = Config.highlightLoopFrequency, debug && console.log("reponse from getStatus", Config), highlighterEnabled && (debug && console.log("about to get words", window.location), chrome.runtime.sendMessage({
            command: "getWords",
            url: location.href.replace(location.protocol + "//", "")
        }, (function(e) {
            debug && console.log("got words"), wordsArray = e.words.words, regexConfig = e.words.regex, skipSelectors = e.words.skipSelectors, debug && console.log("processed words"), wordsReceived = !0;
            setInterval(highlightLoop, 1e3)
        })))
    }))
}));