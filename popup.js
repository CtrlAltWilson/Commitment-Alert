var version = document.getElementById("versionCheck");

function CurrentLink() {
    chrome.storage.sync.get(["mytext", "chat_mytext", "tid_mytext"], (function(e) {
        eraseText();
        var t = document.getElementById("linkM");
        if (void 0 === e.mytext || "" === e.mytext) t.innerHTML = '<a href="' + chrome.runtime.getURL("melodyFinal.mp3") + '" target="_blank" style="color: #696969;"> Default Sound </a>', $("#x").hide(), document.getElementById("linkM").style.margin = "0px 50px 0 50px";
        else {
            var n = domain_from_url(e.mytext);
            t.innerHTML = '<a href="' + e.mytext + '" target="_blank" style="color: #696969;">' + n + "</a>", $("#x").show(), document.getElementById("linkM").style.margin = "0px 0px 0 50px"
        }
        var i = document.getElementById("chat_linkM");
        if (void 0 === e.chat_mytext || "" === e.chat_mytext) i.innerHTML = '<a href="' + chrome.runtime.getURL("chat_melody.mp3") + '" target="_blank" style="color: #696969;"> Default Sound </a>', $("#chat_x").hide(), document.getElementById("chat_linkM").style.margin = "0px 50px 0 50px";
        else {
            var o = domain_from_url(e.chat_mytext);
            i.innerHTML = '<a href="' + e.chat_mytext + '" target="_blank" style="color: #696969;">' + o + "</a>", $("#chat_x").show(), document.getElementById("chat_linkM").style.margin = "0px 0px 0 50px"
        }
        var c = document.getElementById("tele_idM");
        void 0 === e.tid_mytext || "" === e.tid_mytext ? ($(".Tele_ID").hide(), $("#t_x").hide(), document.getElementById("tele_idM").style.margin = "0px 50px 0 50px") : ($(".Tele_ID").show(), $("#t_x").show(), c.innerHTML = '<a style="color: #696969;">' + e.tid_mytext + "</a>", document.getElementById("tele_idM").style.margin = "0px 0px 0 50px")
    }))
}

function SavedLink() {
    var e = document.getElementById("Saved");
    e.innerHTML = "Saved!", setTimeout((function() {
        e.innerHTML = ""
    }), 1e3)
}
version.innerHTML = "v" + chrome.runtime.getManifest().version, CurrentLink(), document.addEventListener("DOMContentLoaded", (function() {
    document.querySelector('button[type="submit"]').addEventListener("click", (function() {
        var e = document.getElementById("YTlink").value,
            t = document.getElementById("Chat_YTlink").value,
            n = document.getElementById("TeleID").value,
            i = 0;
        if ("" === e.trim() && "" === t.trim() && "" === n.trim()) {
            (r = document.getElementById("Saved")).innerHTML = "Nothing was typed!", document.getElementsByTagName("body")[0].appendChild(r), setTimeout((function() {
                r.innerHTML = ""
            }), 1e3)
        }
        if ("" != e.trim()) {
            var o = e.trim();
            chrome.storage.sync.set({
                mytext: o
            }, (function() {
                console.log("Value is set to " + o)
            })), i = 1
        }
        if ("" != t.trim()) {
            var c = t.trim();
            chrome.storage.sync.set({
                chat_mytext: c
            }, (function() {
                console.log("Chat value is set to " + c)
            })), i = 1
        }
        if ("" != n.trim() && null != n.trim().match(/^[0-9]+$/)) {
            var a = n.trim();
            chrome.storage.sync.set({
                tid_mytext: a
            }, (function() {
                console.log("Telegram ID value is set to " + a)
            })), i = 1
        }
        if (null == n.trim().match(/^[0-9]+$/)) {
            var r;
            (r = document.getElementById("Saved")).innerHTML = "Telegram ID can only be in numbers!", document.getElementsByTagName("body")[0].appendChild(r), setTimeout((function() {
                r.innerHTML = ""
            }), 3e3)
        }
        i && (SavedLink(), CurrentLink())
    }), !1)
}), !1), document.addEventListener("DOMContentLoaded", (function() {
    document.querySelector('button[type="default"]').addEventListener("click", (function() {
        chrome.storage.sync.set({
            mytext: ""
        }, (function() {})), chrome.storage.sync.set({
            chat_mytext: ""
        }, (function() {})), chrome.storage.sync.set({
            tid_mytext: ""
        }, (function() {})), SavedLink(), CurrentLink()
    }), !1)
}), !1);
var i, coll = document.getElementsByClassName("collapsible");
for (i = 0; i < coll.length; i++) coll[i].addEventListener("click", (function() {
    this.classList.toggle("active"), "block" === this.nextElementSibling.style.display ? $(".content").slideUp() : $(".content").slideDown()
}));

function eraseText() {
    document.getElementById("YTlink").value = "", document.getElementById("Chat_YTlink").value = "", document.getElementById("TeleID").value = ""
}

function domain_from_url(e) {
    var t, n;
    return (n = e.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n\?\=]+)/im)) && (n = (t = n[1]).match(/^[^\.]+\.(.+\..+)$/)) && (t = n[1]), t
}
document.addEventListener("DOMContentLoaded", (function() {
    for (var e = document.getElementsByTagName("plug"), t = 0; t < e.length; t++) ! function() {
        var n = e[t],
            i = n.href;
        n.onclick = function() {
            chrome.tabs.create({
                active: !0,
                url: i
            })
        }
    }()
})), $(document).ready((function() {
    var e = 1;
    $("#settings").click((function() {
        1 === e ? ($(".aligncenter").slideUp(), $("#link_settings").slideDown(), e = 0) : ($(".aligncenter").slideDown(), $("#link_settings").slideUp(), e = 1)
    }))
})), document.addEventListener("DOMContentLoaded", (function() {
    document.querySelector('button[class="x"]').addEventListener("click", (function() {
        chrome.storage.sync.set({
            mytext: ""
        }, (function() {})), SavedLink(), CurrentLink()
    }), !1)
}), !1), document.addEventListener("DOMContentLoaded", (function() {
    document.querySelector('button[class="chat_x"]').addEventListener("click", (function() {
        chrome.storage.sync.set({
            chat_mytext: ""
        }, (function() {})), SavedLink(), CurrentLink()
    }), !1)
}), !1), document.addEventListener("DOMContentLoaded", (function() {
    document.querySelector('button[class="t_x"]').addEventListener("click", (function() {
        chrome.storage.sync.set({
            tid_mytext: ""
        }, (function() {})), SavedLink(), CurrentLink()
    }), !1)
}), !1);