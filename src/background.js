chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "SAVE_NOTE") {
    chrome.storage.local.get({ notes: [] }, (res) => {
      const newNotes = [...res.notes, msg.payload];
      chrome.storage.local.set({ notes: newNotes }, () => {
        sendResponse({ success: true });
      });
    });
    return true; // async response
  }

  if (msg.type === "GET_NOTES") {
    chrome.storage.local.get({ notes: [] }, (res) => sendResponse(res.notes));
    return true;
  }
});
