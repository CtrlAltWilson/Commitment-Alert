// Keep this list in step with manifest.json -- the newest entry should always be
// the version the popup is running, or users see notes for a release they don't
// have. Chrome compares each dot-separated part as a number, so 2.0900 < 2.1000;
// do NOT "tidy" this into 2.9.0, which would compare as LOWER than 2.0800 and
// break updates for everyone already installed.
var ext_version = ["v2.1000", "v2.0900", "v2.0800", "v2.0700","v2.0600", "v2.0500", "v2.0400", "v2.0300", "v2.0200", "v2.0100", "v2.0000", "v1.9001", "v1.9000 It's over 9000!", "v1.8904", "v1.8903", "v1.8902"],
    ext_updatenotes = [
        ["Removed usage tracking", "The standard version no longer contacts any outside server"],
        ["Now comes in two versions: with and without Telegram alerts", "Fixed the Telegram ID warning appearing when the box was left blank"],
        ["Updated how Telegram alerts are sent"],
        ["Minor bug fixes","Fixed auto-enable on first install"],
        ["Updated to manifest v3", "Fixed url detection issue", "Revamped update logs", "Optimized code"],
        ["Minor updates"],
        ["Minor updates"],
        ["Alerts can now be sent to Telegram!", "Optimized code", "Removed scrollbar so it doesn't adjust the size of the window", "Improved expansion when clicking on settings or version"],
        ["Logo now links to commitment in case if commitment box disappears", "Now compatible with Lightning edition of Salesforce (with some limitations)", "Bug fixes"],
        ["Bug fixes"],
        ["UI make over!", "You can now have a separate alert link for your chat pop ups", "New default sound for chat"],
        ["Minor bug fixes"],
        ["Fixed multiple windows from loading up due to opened tabs and delayed it by 30 seconds", "Minor bug fixes"],
        ["Inserted plug", "Minor bug fixes"],
        ["Fixed bug where pop up appears for both chat box and Salesforce"],
        ["Fixed bug where extension would not be automatically enabled on first install", "Fixed bug where alert will appear as many times as the amount of Salesforce tabs that are opened", "Default sound is now a local resource", "Version is now implemented into pop up with notes", "Cleaned some code"]
    ],
    queryUpdates = document.querySelector("[class=update]"),
    br = document.createElement("br");
for (const e of ext_version) {
    var updatesVersion = document.createElement("b"),
        updatesContent = document.createTextNode(e);
    updatesVersion.appendChild(updatesContent), updatesVersion.appendChild(br.cloneNode(!0)), queryUpdates.appendChild(updatesVersion);
    for (const o of ext_updatenotes[ext_version.indexOf(e)]) {
        var updatelog = document.createTextNode("-" + o);
        queryUpdates.appendChild(updatelog), queryUpdates.appendChild(br.cloneNode(!0)), queryUpdates.appendChild(br.cloneNode(!0))
    }
}