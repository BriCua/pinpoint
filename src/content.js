chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_SELECTION") {
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : "";

    sendResponse({
      text,
      url: location.href
    });
  }
});

console.log("content script alive");
