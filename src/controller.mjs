import Settings from "./settings.js";

function jump2url(url) {
	// First, search from the current window.
	chrome.tabs.query({ lastFocusedWindow: true }, (tabs) => {
		// Check if current window is a new tab
		// Get current selected tab
		const currentTab = tabs.filter((tab) => tab.active)[0];
		if (
			currentTab.url === "chrome://newtab/" ||
			currentTab.url === "about:blank" ||
			currentTab.url === "about:newtab"
		) {
			chrome.tabs.update(currentTab.id, { url: url }, () => {});
			return;
		}
		// Check if the URL is already open
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
					sendResponse({ bookmarks: settings.data() });
				}
				return true;
			case "background-jump":
				// Message name is 'jump' only
				jump2url(message.url);
				return;
		}
	});
	chrome.bookmarks.onChanged.addListener((id, changeInfo) => {
		settings.reload();
	});
	// chrome.bookmarks.onChildrenReordered.addListener(() => {
	// 	settings.reload();
	// });
	chrome.bookmarks.onCreated.addListener(() => {
		settings.reload();
	});
	chrome.bookmarks.onMoved.addListener(() => {
		settings.reload();
	});
	chrome.bookmarks.onRemoved.addListener(() => {
		settings.reload();
	});
	// chrome.bookmarks.onImportEnded.addListener(() => {
	// 	settings.reload();
	// });
});
