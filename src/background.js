importScripts("settings.js");

function jump2url(url) {
  // First, search from the current window.
  chrome.tabs.query({ lastFocusedWindow: true }, (tabs) => {
    const matchTab = tabs.filter((tab) => {
      return tab.url.indexOf(url) === 0;
    })[0];
    if (matchTab) {
      chrome.tabs.update(matchTab.id, { active: true }, () => {});
    } else {
      // Second, search from all windows.
      chrome.tabs.query({}, (tabs) => {
        const matchTab = tabs.filter((tab) => {
          return tab.url.indexOf(url) === 0;
        })[0];
        if (matchTab) {
          chrome.windows.update(matchTab.windowId, { focused: true });
          chrome.tabs.update(matchTab.id, { active: true }, () => {});
        } else {
          chrome.tabs.create({ url: url }, () => {});
        }
      });
    }
  });
}

Settings.newAsync().then((settings) => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("message: ", message);
    switch (message.target) {
      case "background-settings":
        if (message.name === "load") {
          // load
          settings.reload().then(() => {
            sendResponse(settings.data());
          });
        } else if (message.name === "update") {
          // save
          settings.update(message.settings).then(() => {
            sendResponse();
          });
        } else if (message.name === "delete") {
          // delete
          settings.delete(message.key).then(() => {
            sendResponse();
          });
        }
        return true;

      case "background-validate":
        // Message name is 'validate' only
        sendResponse({
          key: settings.validate_key(message.key, message.old_key),
          title: settings.validate_title(message.title),
          url: settings.validate_url(message.url),
        });
        return;

      case "background-options":
        // Message name is 'add' only
        addCurrentPage();
        return;

      case "background-shortcuts":
        // Message name is 'open' only
        chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
        return;

      case "background-jump":
        // Message name is 'jump' only
        jump2url(message.url);
        return;
    }
  });

  const addCurrentPage = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      chrome.runtime.openOptionsPage(() => {
        // It takes time to open the option page
        setTimeout(() => {
          chrome.runtime.sendMessage({
            target: "options",
            name: "add",
            data: {
              title: tab.title,
              action: ActionId.JUMP_URL,
              url: tab.url,
            },
          });
        }, 500);
      });
    });
  };
});
