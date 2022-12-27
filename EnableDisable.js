function EDCheck() {
    chrome.storage.sync.get(["enabledDisabled"], (function(e) {
        !0 === e.enabledDisabled ? document.getElementById("enabledDisabled").checked = !0 : !1 === e.enabledDisabled && (document.getElementById("enabledDisabled").checked = !1)
    }))
}
EDCheck(), document.addEventListener("DOMContentLoaded", (function() {
    document.querySelector("input[name=onoffswitch]").addEventListener("change", (function() {
        this.checked ? chrome.storage.sync.set({
            enabledDisabled: !0
        }, (function() {})) : chrome.storage.sync.set({
            enabledDisabled: !1
        }, (function() {})), EDCheck()
    }))
}), !1);