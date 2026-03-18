chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("listener hit", msg.type);

  if (msg.type === "GET_SELECTION") {
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : "";
    sendResponse({ text, url: location.href });
    return false; // synchronous
  }

  if (msg.type === "CHECK_FRAGMENT") {
    const { noteId, text } = msg.payload;
    if (!text) {
      sendResponse({ status: "skipped", reason: "no text" });
      return false;
    }

    let attempts = 0;
    const maxAttempts = 5;

    const check = () => {
      attempts++;
      console.log(`check attempt ${attempts} for ${noteId}`);
      let foundInViewport = false;

      // Reset selection to ensure we find from the top
      window.getSelection().removeAllRanges();

      // Use window.find to locate text and check its position
      if (window.find(text, false, false, true, false, true, false)) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const rect = selection.getRangeAt(0).getBoundingClientRect();
          // Check if it's within the viewport (browser should have scrolled here)
          foundInViewport = rect.top >= 0 && rect.bottom <= window.innerHeight;
          window.getSelection().removeAllRanges();
        }
      }

      if (foundInViewport) {
        console.log("fragment verified in viewport");
        sendResponse({ status: "success" });
      } else if (attempts < maxAttempts) {
        setTimeout(check, 1000);
      } else {
        console.log("fragment check failed after max attempts");
        chrome.storage.local.get({ failedPins: [] }, (res) => {
          if (!res.failedPins.includes(noteId)) {
            const updated = [...res.failedPins, noteId];
            chrome.storage.local.set({ failedPins: updated });
          }
        });
        sendResponse({ status: "failed" });
      }
    };

    // Start checking after a short delay to allow browser scroll to settle
    setTimeout(check, 1000);
    return true; // asynchronous
  }

  if (msg.type === "FIND") {
    const { text, noteId } = msg.payload;

    const tryFind = () => {
      console.log("tryFind searching for:", text);
      // Reset search to start of document
      window.getSelection().removeAllRanges();
      
      if (window.find(text, false, false, true, false, true, false)) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const element = range.startContainer.parentElement;
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          
          chrome.storage.local.get({ failedPins: [] }, (res) => {
            const updated = res.failedPins.filter((id) => id !== noteId);
            chrome.storage.local.set({ failedPins: updated });
          });
          return true;
        }
      }
      return false;
    };

    if (tryFind()) {
      sendResponse({ status: "success" });
    } else {
      const giveUp = setTimeout(() => {
        observer.disconnect();
        sendResponse({ status: "timeout" });
      }, 10000);

      const observer = new MutationObserver(() => {
        if (tryFind()) {
          observer.disconnect();
          clearTimeout(giveUp);
          sendResponse({ status: "success" });
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }
    return true; // asynchronous
  }
});

console.log("content script alive");
