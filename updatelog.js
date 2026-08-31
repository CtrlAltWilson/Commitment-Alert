// "What's new" panel in the popup.
//
// Rewritten 2026-08-07. This used to be two parallel arrays -- one of version
// strings, one of note arrays -- matched up by index. Getting them out of step
// silently showed the wrong notes against the wrong version, with no way to
// notice. One list of objects removes that failure mode entirely.
//
// VERSION NUMBERING -- read before bumping:
// Chrome compares each dot-separated part as a NUMBER, so 2.0800 < 2.0900 <
// 2.1000 works. Do NOT "tidy" this into 2.9.0: that compares [2,9,0] against
// [2,800], i.e. 9 < 800, which Chrome reads as a DOWNGRADE and refuses to
// install over an existing copy. Stay in the 2.0X00 scheme.
//
// Add new releases to the TOP, and keep the top entry equal to the version in
// manifest.json -- otherwise the popup shows notes for a release nobody has.
//
// Entries that described only Telegram were dropped in v2.1600 along with the
// feature, and a couple of notes that told users to do something no longer
// possible were reworded. These notes are user-facing help, not an audit trail
// -- git history is the audit trail. A changelog that advertises a feature the
// extension does not have is worse than a shorter one.

var RELEASES = [
    { version: "2.1600", notes: [
        "Telegram alerts have been removed",
        "The extension no longer contacts any outside server",
        "Your saved Telegram ID has been deleted"
    ]},
    { version: "2.1500", notes: [
        "Setting a link now ticks and locks 'Open in a window' for you",
        "Fixed the Reset button label spilling outside the button"
    ]},
    { version: "2.1400", notes: [
        "Your alert link is used again straight away - no checkbox needed",
        "Settings redesigned: edit with the pencil, reset with the red x",
        "Untick 'Open in a window' if you want the sound only, with no pop-up",
        "Fixed the cut-off version number and the spacing"
    ]},
    { version: "2.1300", notes: [
        "Alerts can now play in the background with no pop-up window",
        "Click the extension icon to stop an alert",
        "Alerts stop on their own when the commitment closes"
    ]},
    { version: "2.1200", notes: [
        "Groundwork for the alert improvements above",
        "No change to how alerts work"
    ]},
    { version: "2.1100", notes: [
        "Cleaned up the settings screen",
        "The reset (x) buttons are more reliable",
        "Removed the external website links"
    ]},
    { version: "2.1000", notes: [
        "Removed usage tracking"
    ]},
    { version: "2.0700", notes: [
        "Minor bug fixes",
        "Fixed auto-enable on first install"
    ]},
    { version: "2.0600", notes: [
        "Updated to manifest v3",
        "Fixed url detection issue",
        "Revamped update logs"
    ]},
    { version: "2.0200", notes: [
        "Logo now links to commitment in case the commitment box disappears",
        "Now compatible with Lightning edition of Salesforce (with some limitations)"
    ]},
    { version: "2.0000", notes: [
        "UI make over!",
        "You can now have a separate alert link for your chat pop ups",
        "New default sound for chat"
    ]}
];

// Only the most recent few are worth showing in a popup this size. Older
// entries stay in this file as a record.
var RELEASES_SHOWN = 5;

(function renderReleases() {
    var container = document.querySelector("[class=update]");
    if (!container) return;

    var running = chrome.runtime.getManifest().version;

    RELEASES.slice(0, RELEASES_SHOWN).forEach(function(release) {
        var heading = document.createElement("b");
        heading.appendChild(document.createTextNode(
            "v" + release.version + (release.version === running ? "  (installed)" : "")
        ));
        container.appendChild(heading);
        container.appendChild(document.createElement("br"));

        release.notes.forEach(function(note) {
            container.appendChild(document.createTextNode("-" + note));
            container.appendChild(document.createElement("br"));
        });
        container.appendChild(document.createElement("br"));
    });
})();
