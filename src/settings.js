/**
 * Recursively loads all bookmarks and folders from the user's bookmarks.
 * @param {BookmarkTreeNode} root - The callback function to call with the loaded bookmarks.
 * @return {list} The list of bookmarks
 */
async function load_bookmarks(root) {
	const bookmarks = [];
	const folders = [];
	const children = root.children;
	for (const child of children) {
		if (child.url) {
			bookmarks.push(child);
		} else {
			folders.push(child);
		}
	}
	for (const folder of folders) {
		bookmarks.push(...(await load_bookmarks(folder)));
	}
	return bookmarks;
}

export default class Settings {
	static async newAsync() {
		const settings = new Settings();
		await settings._load();
		return settings;
	}

	async reload() {
		await this._load();
	}

	data() {
		return this._bookmarks;
	}

	async _load() {
		this._bookmarks = [];
		chrome.bookmarks.getTree((tree) => {
			const bookmarks = tree[0];
			load_bookmarks(bookmarks).then((bookmarks) => {
				for (const bookmark of bookmarks) {
					// Generate key for all bookmarks
					// The key is all the upper case letters in the title
					const title = bookmark.title;
					const match = title.match(/[A-Z]/g);
					if (!match) continue;
					const key = match.join("");
					// check if the key is empty
					if (key === "") {
						continue;
					}
					bookmark.key = key;
					this._bookmarks.push(bookmark);
				}
			});
		});
		console.log("bookmarks: ", this._bookmarks);
	}
}
