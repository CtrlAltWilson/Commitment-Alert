var highlighterEnabled = !0,
    debug = !1;

function isInstalled() {
    chrome.storage.sync.get(["firstInstall", "enabledDisabled"], function(e) {
        !1 !== e.firstInstall && null !== e.firstInstall && void 0 !== e.firstInstall || void 0 !== e.enabledDisabled && null !== e.enabledDisabled || (chrome.storage.sync.set({
            enabledDisabled: !0
        }, function() {}), chrome.storage.sync.set({
            firstInstall: !0
        }, function() {}))
    })
}

function getGroups(e, t, n) {
    var r = n;
    try {
        for (var o in e.Groups) {
            var s = !1;
            e.Groups[o].Enabled && ("" != t && 0 != e.Groups[o].ShowOn.length || (s = !0), s && (r[o] = e.Groups[o]))
        }
    } catch {
        log("error in getting groups", e, t, n)
    }
    return r
}

function getWords(e) {
    groupsForUrl = getGroups(HighlightsData, e, []);
    var t = {
        words: {},
        regex: {}
    };
    return t.words = transformWordsToWordList(groupsForUrl), t.regex = transformWordsToRegex(t.words), t
}

function transformWordsToWordList(e) {
    var t = [],
        n = /\(\?\=|\(\?\!|\(\?\<\=|\(\?\<\!/gi;
    for (group in e)
        if (e[group].Enabled) {
            for (word in e[group].Words)
                if ("" !== e[group].Words[word].trim()) {
                    if (e[group].regexTokens) {
                        var r = e[group].Words[word];
                        e[group].Words[word].match(n)
                    } else r = globStringToRegex(e[group].Words[word]);
                    var o = e[group].action || {
                        type: 0
                    };
                    t.push({
                        regex: r,
                        Color: e[group].Color,
                        Fcolor: e[group].FColor,
                        action: o
                    })
                }
        } return t
}

function transformWordsToRegex(e) {
    var t = "",
        n = "",
        r = "",
        o = "",
        s = "",
        g = "",
        i = "",
        l = "",
        a = e.sort(function(e, t) {
            return t.word.length - e.word.length
        });
    for (word in e.map(function(e) {
            return e.word
        }), a) a[word].FindWords ? a[word].caseSensitive ? (s += a[word].regex + "|", a[word].ShowInEditableFields && (i += a[word].regex + "|")) : (t += a[word].regex + "|", a[word].ShowInEditableFields && (r += a[word].regex + "|")) : a[word].caseSensitive ? (g += a[word].regex + "|", a[word].ShowInEditableFields && (l += a[word].regex + "|")) : (n += a[word].regex + "|", a[word].ShowInEditableFields && (o += a[word].regex + "|"));
    var d = "";
    t.length > 1 && (d = "\\b" + (d += "(" + (t = t.substring(0, t.length - 1)) + ")") + "\\b|\\s" + d + "\\s"), n.length > 1 && t.length > 1 && (d += "|"), n.length > 1 && (d += "(" + (n = n.substring(0, n.length - 1)) + ")"), matchRegex = d, d = "", s.length > 1 && (d = "\\b" + (d += "(" + (s = s.substring(0, s.length - 1)) + ")") + "\\b|\\s" + d + "\\s"), g.length > 1 && s.length > 1 && (d += "|"), g.length > 1 && (d += "(" + (g = g.substring(0, g.length - 1)) + ")"), matchRegexCS = d, d = "", r.length > 1 && (d = "\\b" + (d += "(" + (r = r.substring(0, r.length - 1)) + ")") + "\\b|\\s" + d + "\\s"), o.length > 1 && r.length > 1 && (d += "|"), o.length > 1 && (d += "(" + (o = o.substring(0, o.length - 1)) + ")"), matchRegexEditable = d, d = "", i.length > 1 && (d = "\\b" + (d += "(" + (i = i.substring(0, i.length - 1)) + ")") + "\\b|\\s" + d + "\\s"), l.length > 1 && i.length > 1 && (d += "|"), l.length > 1 && (d += "(" + (l = l.substring(0, l.length - 1)) + ")"), matchRegexEditableCS = d;
    var h = matchRegex.length > 0,
        c = matchRegexCS.length > 0,
        u = matchRegexEditable.length > 0,
        b = matchRegexEditableCS.length > 0;
    return {
        matchRegex: matchRegex,
        matchRegexCS: matchRegexCS,
        matchRegexEditable: matchRegexEditable,
        matchRegexEditableCS: matchRegexEditableCS,
        doMatchRegex: h,
        doMatchRegexCS: c,
        domatchRegexEditable: u,
        domatchRegexEditableCS: b
    }
}

function globStringToRegex(e) {
    return preg_quote(e = e.replace(/[-[\]{}()*+?.,\\^$|]/g, "\\$&")).replace(/\*/g, "S*").replace(/\\\?/g, ".")
}

function preg_quote(e, t) {
    return (e + "").replace(RegExp("/^.*[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\" + (t || "") + "-].*$/", "g"), "\\$&")
}

function getConfig() {
    return {
        highlightLoopFrequency: 500,
        fixedLoopTime: !1,
        increaseLoop: 250,
        decreaseLoop: 125,
        maxLoopTime: 2500,
        minLoopTime: 500,
        highlightAtStart: !0,
        updateOnDomChange: !0
    }
}

function skipSelectorsForUrl(e) {
    return skipSelectors.join(", ")
}
HighlightsData = {
    Groups: {
        "chat test": {
            Color: "",
            Fcolor: "",
            Enabled: !0,
            ShowOn: [],
            DontShowOn: [],
            FindWords: !0,
            Type: "local",
            ShowInEditableFields: !1,
            NotifyOnHighlight: !1,
            NotifyFrequency: "1",
            storage: "local",
            regexTokens: !1,
            caseSensitive: !1,
            action: {
                type: "1"
            },
            Words: ["There is a chat contact waiting. Do you want to accept it"]
        }
    }
}, chrome.runtime.onMessage.addListener(function(e, t, n) {
    return "getWords" == e.command && n({
        words: getWords(e.url)
    }), "getStatus" == e.command && n({
        status: highlighterEnabled,
        config: getConfig()
    }), !0
}), isInstalled(), isInstalled();