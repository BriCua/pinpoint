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

  if (msg.type === "OPEN_AND_FALLBACK") {
    const { link, text } = msg.payload;

    // This is the fallback function that will be injected into the page
    const fallback = (searchText) => {
      // Use a short initial delay to see if the native scroll works
      setTimeout(() => {
        // The spec uses `::target-text`. There isn't a perfect way to detect it,
        // but we can check if the text is already in the viewport as a proxy.
        // For simplicity, we'll just start the fallback process. A more advanced
        // implementation could try to detect the highlight before starting.

        const MAX_ATTEMPTS = 10;
        const RETRY_INTERVAL_MS = 2000;
        let attempts = 0;

        const interval = setInterval(() => {
          if (document.readyState !== "complete") {
            console.log("PinPoint: Document not ready, waiting...");
            return;
          }
          
          attempts++;
          console.log(`PinPoint: Fallback attempt #${attempts}`);

          // window.find() highlights the text and returns true if found
          if (window.find(searchText)) {
            console.log("PinPoint: Fallback search successful. Scrolling...");
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const element = range.startContainer.parentElement;
              element.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
            clearInterval(interval); // Success, stop trying
          }

          if (attempts >= MAX_ATTEMPTS) {
            console.warn(
              "PinPoint: Fallback scrolling failed after max attempts."
            );
            clearInterval(interval); // Failure, stop trying
          }
        }, RETRY_INTERVAL_MS);
      }, 3000); // Initial 3-second delay to let native scrolling try first
    };

    // 1. Create the tab. This is the primary attempt using native Text Fragments.
    chrome.tabs.create({ url: link }, (tab) => {
      // 2. Inject the fallback script into the new tab.
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: fallback,
        args: [text],
      });
    });
    return true;
  }
});
