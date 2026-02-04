// Background service worker
// Currently not heavily used as logic is in Popup, but ready for future expansion.
console.log("AI Bookmark Organizer Background Service Worker Loaded.");

chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed.");

    // Set panel behavior to open on click
    if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
        chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
            .catch((error) => console.error(error));
    }
});
