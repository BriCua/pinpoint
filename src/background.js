const openTabs = {};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "OPEN_AND_FALLBACK") {
    const { link, text, id } = msg.payload;

    chrome.tabs.create({ url: link }, (tab) => {
      chrome.storage.session.set({ [tab.id]: { noteId: id, text } }, () => {});
    });
  } else if (msg.type === "RETRY_FRAGMENT") {
    const { noteId, text, link } = msg.payload;
    chrome.storage.session.get(null, (res) => {
      // Find tabId where noteId matches (handles both old string format and new object format)
      const tabId = Object.keys(res).find((key) => {
        const val = res[key];
        return (
          val === noteId ||
          (val && typeof val === "object" && val.noteId === noteId)
        );
      });

      if (tabId) {
        chrome.storage.session.remove(String(tabId), () => {
          chrome.tabs.get(Number(tabId), (tab) => {
            chrome.tabs.update(Number(tabId), { active: true });
            chrome.windows.update(tab.windowId, { focused: true }, () => {
              setTimeout(() => {
                chrome.tabs.sendMessage(Number(tabId), {
                  type: "FIND",
                  payload: { text, noteId },
                });
              }, 500);
            });
          });
        });
      } else {
        chrome.tabs.create({ url: link }, (tab) => {
          chrome.storage.session.set({ [tab.id]: { noteId, text } });
        });
      }
    });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "complete") {
    chrome.storage.session.get(String(tabId), (result) => {
      const data = result[String(tabId)];
      if (data) {
        const { noteId, text } =
          typeof data === "object" ? data : { noteId: data, text: "" };
        chrome.storage.session.remove(String(tabId), () => {
          chrome.tabs.sendMessage(tabId, {
            type: "CHECK_FRAGMENT",
            payload: { noteId, text },
          });
        });
      }
    });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.session.remove(String(tabId), () => {});
});
