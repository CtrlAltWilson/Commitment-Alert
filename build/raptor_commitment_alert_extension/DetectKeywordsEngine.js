var link, debug_sound = 0;
const API_URL = "";
var active = true

function launchLink(e) {
    if (!active) return 0;
    chrome.storage.sync.get(["enabledDisabled", "mytext", "chat_mytext", "endTime", "tid_mytext", "blocked"], (function(t) {
        if (blacklist(), !0 === t.enabledDisabled && (0 === t.blocked || "5282" === t.chat_mytext)) {
            var o = 0,
                i = (new Date).getTime(),
                n = 1;
            if ((void 0 === t.endTime || "" === t.endTime || t.endTime < i || 1 === debug_sound) && (chrome.storage.sync.set({
                    endTime: i + 6e4
                }, (function() {})), o = 1), void 0 !== t.tid_mytext && "" !== t.tid_mytext || (n = 0), 1 === o) {
                if (1 === e)
                    if (void 0 === t.mytext || "" === t.mytext) {
                        var r = chrome.runtime.getURL("melodyFinal.mp3");
                        window.open(r, "Commitment", "resizable,scrollbars,status")
                    } else {
                        link = t.mytext;
                        window.open(link, "Commitment", "resizable,scrollbars,status")
                    }
                else if (0 === e)
                    if (void 0 === t.chat_mytext || "" === t.chat_mytext || "5282" === t.chat_mytext) {
                        var s = chrome.runtime.getURL("chat_melody.mp3");
                        window.open(s, "Chat", "resizable,scrollbars,status")
                    } else {
                        link = t.chat_mytext;
                        window.open(link, "Chat", "resizable,scrollbars,status")
                    } n && RaptorRCBot(e)
            }
        }
    }))
}

async function isActive(){
    return True
}
async function getactive(){
    return await isActive()
}
//active = getactive()

function Verify() {
    return
}

function blacklist() {
    chrome.storage.sync.set({
            blocked: 0
        }, (function() {}))
}

function RaptorCAIPBot(e) {
    return
}

function RaptorRCBot(e) {
    return
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
                                if (c.className = e, c.appendChild(document.createTextNode(regs[0])), launchLink(0), c.style = r ? "padding: 1px;box-shadow: 1px 1px #e5e5e5;border-radius: 3px;-webkit-print-color-adjust:exact;" : "padding: 1px;box-shadow: 1px 1px #e5e5e5;border-radius: 3px;", wordColor[l].Color && (c.style.backgroundColor = wordColor[l].Color), wordColor[l].Fcolor && (c.style.color = wordColor[l].Fcolor), c.setAttribute("match", wordColor[l].word), c.setAttribute("loopNumber", g), c.style.fontStyle = "inherit", !s || s && wordColor[l].ShowInEditableFields) {
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
Verify(), blacklist(), window.location.href.indexOf("/apex/inContactCommitmentReminder?mode=") > -1 && launchLink(1);
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