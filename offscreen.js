// Audio playback for the invisible alert mode.
//
// This runs in an offscreen document -- a hidden page the extension owns.
// It exists because an MV3 service worker has no DOM and therefore cannot
// play audio. Chrome closes an AUDIO_PLAYBACK offscreen document
// automatically after ~30 s with nothing playing, so there is no cleanup to
// do beyond stopping the sound.

let audio = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.target !== "offscreen") return;

    if (message.type === "PLAY") {
        stop();
        audio = new Audio(message.url);
        audio.loop = !!message.loop;
        audio.volume = typeof message.volume === "number" ? message.volume : 1;
        // Autoplay policy does not apply to extension offscreen documents, but
        // play() still returns a promise that can reject (bad URL, decode
        // failure). Report it rather than failing silently -- a silent alert
        // is the one failure mode this whole extension exists to prevent.
        audio.play().then(
            () => sendResponse({ ok: true }),
            error => sendResponse({ ok: false, error: String(error) })
        );
        return true; // async response
    }

    if (message.type === "STOP") {
        stop();
        sendResponse({ ok: true });
        return;
    }
});

function stop() {
    if (!audio) return;
    try {
        audio.pause();
        audio.currentTime = 0;
    } catch (e) {
        // Already torn down; nothing to do.
    }
    audio = null;
}
