// Popup settings UI.
//
// Rewritten 2026-08-08 around one card per setting: the current value, the
// pencil that edits it and the red x that resets it all sit together. The
// previous layout put three inputs in one block with a global Save underneath,
// which read as though Save also applied the checkboxes -- it didn't, because
// they save on change, so clicking Save reported "Nothing was typed!".
//
// Everything is driven by the SETTINGS table. To add a field, add a row here
// and a card in popup.html.

var SETTINGS = [{
    key: "mytext",
    modeKey: "windowMode",
    // Shown when nothing is set; the alert falls back to this bundled sound.
    fallbackLabel: "Default Sound",
    fallbackSound: "melodyFinal.mp3",
    isLink: true,
    feature: null,
    validate: null
}, {
    key: "chat_mytext",
    modeKey: "chat_windowMode",
    fallbackLabel: "Default Sound",
    fallbackSound: "chat_melody.mp3",
    isLink: true,
    feature: null,
    validate: null
}, {
    key: "tid_mytext",
    modeKey: null,
    fallbackLabel: "Not set",
    fallbackSound: null,
    isLink: false,
    feature: "telegram",
    validate: {
        test: function(v) { return /^[0-9]+$/.test(v); },
        message: "Telegram ID can only be numbers"
    }
}];

function featureEnabled(name) {
    if (!name) return true;
    return typeof FEATURES !== "undefined" && !!FEATURES[name];
}

// Build-variant gate: the no-Telegram build hides that card entirely.
if (!featureEnabled("telegram")) {
    var hide = document.createElement("style");
    hide.textContent = "#card_tid_mytext { display: none !important; }";
    document.head.appendChild(hide);
}

function el(id) { return document.getElementById(id); }

function flash(message, ms) {
    var box = el("Saved");
    box.textContent = message;
    setTimeout(function() { box.textContent = ""; }, ms || 1200);
}

function domainFromUrl(url) {
    var m = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n\?\=]+)/im);
    if (!m) return url;
    var host = m[1];
    var trimmed = host.match(/^[^\.]+\.(.+\..+)$/);
    return trimmed ? trimmed[1] : host;
}

function save(key, value) {
    var patch = {};
    patch[key] = value;
    chrome.storage.sync.set(patch, function() {});
}

// --- rendering --------------------------------------------------------------

function render() {
    var keys = [];
    SETTINGS.forEach(function(s) {
        keys.push(s.key);
        if (s.modeKey) keys.push(s.modeKey);
    });

    chrome.storage.sync.get(keys, function(stored) {
        SETTINGS.forEach(function(setting) {
            var value = stored[setting.key];
            var isSet = value !== undefined && value !== "";

            var display = el("val_" + setting.key);
            display.textContent = isSet
                ? (setting.isLink ? domainFromUrl(value) : value)
                : setting.fallbackLabel;
            display.title = isSet ? value : setting.fallbackLabel;
            display.className = isSet ? "cardValue" : "cardValue muted";

            // The reset control only makes sense once something is set.
            var clear = document.querySelector('[data-clear="' + setting.key + '"]');
            if (clear) clear.style.visibility = isSet ? "visible" : "hidden";

            if (!setting.modeKey) return;

            // Window mode is the default -- undefined means on. Only an
            // explicit false turns it off.
            var windowMode = stored[setting.modeKey] !== false;
            var box = document.querySelector('[data-mode="' + setting.modeKey + '"]');
            if (box) box.checked = windowMode;

            // A link is a web page, and a web page cannot be played invisibly.
            // Say so rather than silently ignoring what the user configured.
            var note = el("note_" + setting.key);
            if (note) {
                note.textContent = (!windowMode && isSet)
                    ? "Playing the default sound instead — a link needs a window."
                    : "";
            }
        });
    });
}

function openEditor(setting) {
    chrome.storage.sync.get([setting.key], function(stored) {
        var input = el("in_" + setting.key);
        input.value = stored[setting.key] || "";
        el("edit_" + setting.key).classList.add("open");
        input.focus();
        input.select();
    });
}

function closeEditor(setting) {
    el("edit_" + setting.key).classList.remove("open");
}

function commitEditor(setting) {
    var value = el("in_" + setting.key).value.trim();

    if (value !== "" && setting.validate && !setting.validate.test(value)) {
        flash(setting.validate.message, 2500);
        return;
    }
    save(setting.key, value);
    closeEditor(setting);
    render();
    flash(value === "" ? "Reset to default" : "Saved");
}

// --- wiring -----------------------------------------------------------------

el("versionCheck").textContent = "v" + chrome.runtime.getManifest().version;

SETTINGS.forEach(function(setting) {
    var edit = document.querySelector('[data-edit="' + setting.key + '"]');
    if (edit) edit.addEventListener("click", function() { openEditor(setting); });

    var doSave = document.querySelector('[data-save="' + setting.key + '"]');
    if (doSave) doSave.addEventListener("click", function() { commitEditor(setting); });

    var cancel = document.querySelector('[data-cancel="' + setting.key + '"]');
    if (cancel) cancel.addEventListener("click", function() { closeEditor(setting); });

    var clear = document.querySelector('[data-clear="' + setting.key + '"]');
    if (clear) clear.addEventListener("click", function() {
        save(setting.key, "");
        closeEditor(setting);
        render();
        flash("Reset to default");
    });

    // Enter saves, Escape cancels -- the popup is small and closes easily, so
    // reaching for the mouse to confirm a one-line edit is a nuisance.
    var input = el("in_" + setting.key);
    if (input) input.addEventListener("keydown", function(event) {
        if (event.key === "Enter") { event.preventDefault(); commitEditor(setting); }
        if (event.key === "Escape") { event.preventDefault(); closeEditor(setting); }
    });

    if (!setting.modeKey) return;
    var box = document.querySelector('[data-mode="' + setting.modeKey + '"]');
    if (box) box.addEventListener("change", function() {
        // Stored explicitly so "off" survives the default-on rule.
        save(setting.modeKey, this.checked);
        render();
        flash("Saved");
    });
});

el("Buttons").querySelector('button[type="default"]').addEventListener("click", function() {
    SETTINGS.forEach(function(setting) {
        save(setting.key, "");
        if (setting.modeKey) save(setting.modeKey, true);
        closeEditor(setting);
    });
    render();
    flash("Everything reset");
});

// Point the cloud button at whatever the config endpoint last told us. The
// href in popup.html is the offline fallback, so a failed lookup or an
// unreachable server leaves the button working exactly as before.
try {
    chrome.runtime.sendMessage({ type: "GET_CONFIG" }, function(config) {
        void chrome.runtime.lastError;
        if (!config || !config.testPageUrl) return;
        // Never navigate to whatever a server hands back unchecked: this link
        // is opened by the whole Support team.
        if (!/^https:\/\//i.test(config.testPageUrl)) return;
        el("reopenCommitment").href = config.testPageUrl;
    });
} catch (e) {
    // Worker unavailable; the fallback href stands.
}

// Version line expands the "what's new" panel.
Array.prototype.forEach.call(document.getElementsByClassName("collapsible"), function(node) {
    node.addEventListener("click", function() {
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

render();
