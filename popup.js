// Popup settings UI.
//
// Rewritten 2026-08-07. The previous version was checked-in minifier output with
// six separate DOMContentLoaded listeners and three near-identical handlers for
// the little "x" reset buttons, each found with a brittle
// document.querySelector('button[class="x"]') that broke if a second class was
// ever added. Everything is now driven by the SETTINGS table below: to add a
// field you add one row, not another copy-pasted block.

// One row per stored setting. `key` is the chrome.storage.sync key; `input` is
// the text box; `display` is the button showing the current value; `clear` is
// the little "x" next to it (matched by data-clear="<key>" in popup.html).
var SETTINGS = [{
    key: "mytext",
    input: "YTlink",
    display: "linkM",
    clear: "x",
    feature: null,
    // Shown when nothing is set. Falls back to the bundled sound.
    fallbackSound: "melodyFinal.mp3",
    validate: null
}, {
    key: "chat_mytext",
    input: "Chat_YTlink",
    display: "chat_linkM",
    clear: "chat_x",
    feature: null,
    fallbackSound: "chat_melody.mp3",
    validate: null
}, {
    key: "tid_mytext",
    input: "TeleID",
    display: "tele_idM",
    clear: "t_x",
    feature: "telegram",
    fallbackSound: null,
    validate: {
        test: function(v) { return /^[0-9]+$/.test(v); },
        message: "Telegram ID can only be in numbers!"
    }
}];

function featureEnabled(name) {
    if (!name) return true;
    return typeof FEATURES !== "undefined" && !!FEATURES[name];
}

// Build-variant gate: hide the settings for features this build does not have.
// Uses a stylesheet with !important rather than removing the nodes, because
// refresh() calls $(".Tele_ID").show() and the save handler reads #TeleID.value
// -- the elements must stay in the DOM, just never be visible.
if (!featureEnabled("telegram")) {
    var hide = document.createElement("style");
    hide.textContent = ".Tele_ID, #telegramSettings { display: none !important; }";
    document.head.appendChild(hide);
}

function flash(message, ms) {
    var el = document.getElementById("Saved");
    el.innerHTML = message;
    setTimeout(function() { el.innerHTML = ""; }, ms || 1000);
}

function domainFromUrl(url) {
    var m = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n\?\=]+)/im);
    if (!m) return url;
    var host = m[1];
    var trimmed = host.match(/^[^\.]+\.(.+\..+)$/);
    return trimmed ? trimmed[1] : host;
}

// Render the "currently set to" row for one setting.
function renderSetting(setting, value) {
    var display = document.getElementById(setting.display);
    var clear = $("#" + setting.clear);
    var isSet = value !== undefined && value !== "";

    if (isSet) {
        if (setting.fallbackSound) {
            display.innerHTML = '<a href="' + value + '" target="_blank" style="color: #696969;">' +
                domainFromUrl(value) + "</a>";
        } else {
            display.innerHTML = '<a style="color: #696969;">' + value + "</a>";
        }
        clear.show();
        display.style.margin = "0px 0px 0 50px";
    } else if (setting.fallbackSound) {
        display.innerHTML = '<a href="' + chrome.runtime.getURL(setting.fallbackSound) +
            '" target="_blank" style="color: #696969;"> Default Sound </a>';
        clear.hide();
        display.style.margin = "0px 50px 0 50px";
    } else {
        display.innerHTML = "";
        clear.hide();
        display.style.margin = "0px 50px 0 50px";
    }

    // The Telegram row is only shown once an ID has been set.
    if (setting.key === "tid_mytext") {
        isSet ? $(".Tele_ID").show() : $(".Tele_ID").hide();
    }
}

// Re-read everything from storage and repaint. Also clears the input boxes, so
// they always start empty rather than echoing the saved value.
function refresh() {
    var keys = SETTINGS.map(function(s) { return s.key; });
    chrome.storage.sync.get(keys, function(stored) {
        SETTINGS.forEach(function(setting) {
            document.getElementById(setting.input).value = "";
            renderSetting(setting, stored[setting.key]);
        });
    });
}

function save(key, value) {
    var patch = {};
    patch[key] = value;
    chrome.storage.sync.set(patch, function() {});
}

// --- wiring ---------------------------------------------------------------

document.getElementById("versionCheck").innerHTML = "v" + chrome.runtime.getManifest().version;
refresh();

// Save: write every field the user actually filled in.
document.querySelector('button[type="submit"]').addEventListener("click", function() {
    var saved = 0;
    var error = null;

    SETTINGS.forEach(function(setting) {
        var value = document.getElementById(setting.input).value.trim();
        if (value === "") return;
        // Only complain about a malformed value if one was actually typed.
        // This used to fire whenever the Telegram box was empty, i.e. on every
        // save by anyone not using Telegram.
        if (setting.validate && !setting.validate.test(value)) {
            error = setting.validate.message;
            return;
        }
        save(setting.key, value);
        saved += 1;
    });

    if (error) {
        flash(error, 3000);
    } else if (saved > 0) {
        flash("Saved!");
        refresh();
    } else {
        flash("Nothing was typed!");
    }
});

// Reset: clear every setting.
document.querySelector('button[type="default"]').addEventListener("click", function() {
    SETTINGS.forEach(function(setting) { save(setting.key, ""); });
    flash("Saved!");
    refresh();
});

// The little "x" buttons. One handler for all of them -- each button declares
// which storage key it clears via data-clear in popup.html.
Array.prototype.forEach.call(document.querySelectorAll("[data-clear]"), function(button) {
    button.addEventListener("click", function() {
        save(button.getAttribute("data-clear"), "");
        flash("Saved!");
        refresh();
    });
});

// Version line expands the "what's new" panel.
Array.prototype.forEach.call(document.getElementsByClassName("collapsible"), function(el) {
    el.addEventListener("click", function() {
        this.classList.toggle("active");
        this.nextElementSibling.style.display === "block" ? $(".content").slideUp() : $(".content").slideDown();
    });
});

// Gear icon toggles between the main view and the settings view.
$(document).ready(function() {
    var showingMain = true;
    $("#settings").click(function() {
        if (showingMain) {
            $(".aligncenter").slideUp();
            $("#link_settings").slideDown();
        } else {
            $(".aligncenter").slideDown();
            $("#link_settings").slideUp();
        }
        showingMain = !showingMain;
    });
});
