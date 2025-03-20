/**
 * Shortcut class
 */
class Shortcut {
	// Keep track of how many instances have been created
	static count = 0;

	/**
	 * Constructor function for creating an instance of the class.
	 *
	 * @param {data} data - The data object containing the properties for the instance.
	 * @param {Element} $target - The target element where the instance will be rendered.
	 * @param {string} $view_template - The HTML template for the view mode of the instance.
	 * @param {string} $edit_template - The HTML template for the edit mode of the instance.
	 */
	constructor(data, $target, $view_template) {
		this.title = data.title;
		this.url = data.url;
		this.key = data.key;
		this.$target = $target;
		this.id = Shortcut.count;
		Shortcut.count++;
		this.setup_view_template($view_template, data.key, data.title, data.url);
	}

	/**
	 * Setup the view template
	 */
	setup_view_template(view_template, key, title, url) {
		this.$view_template = view_template;
		this.$view_template.querySelector(".key").textContent = key;
		this.$view_template.querySelector(".title").textContent = title;
		// Set the title attribute of the view template
		this.$view_template.setAttribute("title", url);
		// Add click event listener
		this.$view_template.addEventListener("click", () => {
			this.jump();
			return false;
		});
	}

	/**
	 * Jumps to a specified URL and closes the window.
	 *
	 * @return {void} No return value.
	 */
	jump() {
		// Open the url
		chrome.runtime.sendMessage(
			{ target: "background-jump", name: "jump", url: this.url },
			() => {
				window.close();
			},
		);
	}

	/**
	 * Renders the view.
	 *
	 * @return {void} No return value.
	 */
	render_view() {
		while (this.$target.firstChild) {
			this.$target.removeChild(this.$target.firstChild);
		}
		this.$target.appendChild(this.$view_template);
	}

	/**
	 * Sets the active state of the element.
	 *
	 * @return {void}
	 */
	set_active() {
		this.$view_template.classList.add("active");
	}

	/**
	 * Sets the element as inactive by removing the "active" class from the view template.
	 *
	 * @return {void}
	 */
	set_inactive() {
		this.$view_template.classList.remove("active");
	}
}

// A list over all shortcuts holding the HTML elements
class ShortcutList {
	/**
	 * Initializes a new instance of the Constructor class.
	 *
	 * @param {Element} $target - The target element.
	 * @param {Array} shortcuts - The array of shortcuts.
	 */
	constructor($target, shortcuts) {
		this.$target = $target;
		this.shortcuts = [];
		this.active_index = -1;
		this.viewable_shortcuts = [];

		// Create fuse object
		this.fuse = new Fuse(this.shortcuts, {
			isCaseSensitive: false,
			keys: [
				{
					name: "key",
					weight: 0.7,
				},
				{
					name: "title",
					weight: 0.5,
				},
				{
					name: "url",
					weight: 0.3,
				},
			],
		});

		this.append_list(shortcuts);
	}

	/**
	 * Append a shortcut to the list.
	 *
	 * @param {object} shortcut - Shortcut object to append.
	 */
	append(shortcut) {
		this._append(shortcut);
		this.render_filtered(document.getElementById("shortcut"));
	}

	/**
	 * Appends a list of shortcuts.
	 *
	 * @param {Array} shortcuts - The list of shortcuts to be appended.
	 */
	append_list(shortcuts) {
		for (const shortcut of shortcuts) {
			this._append(shortcut);
		}
		// Render filtered shortcuts
		this.render_filtered(document.getElementById("shortcut"));
	}

	/**
	 * Appends a shortcut to the list of shortcuts and updates the view.
	 *
	 * @param {Shortcut} shortcut - The shortcut to be appended.
	 */
	_append(shortcut) {
		this.shortcuts.push(shortcut);
		this.viewable_shortcuts.push(shortcut);
		this.$target.appendChild(shortcut.$target);
		// Render shortcut
		shortcut.render_view();
		this.fuse.setCollection(this.shortcuts);
	}

	/**
	 * Prepend a shortcut to the list.
	 *
	 * @param {shortcut} shortcut - The shortcut to prepend.
	 * @return {void} This function does not return a value.
	 */
	prepend(shortcut) {
		this._append(shortcut);
		this.$target.prepend(shortcut.$target);
	}

	/**
	 * Set the active shortcut at the specified index.
	 *
	 * @param {number} index - The index of the shortcut to set as active.
	 */
	set_active(index) {
		// Check if index is valid
		if (index < 0 || index >= this.viewable_shortcuts.length) {
			return;
		}
		// Reset active shortcut
		this.reset_active();
		this.viewable_shortcuts[index].set_active();
		this.active_index = index;
		// Scroll up if the previous shortcut is not visible
		this.viewable_shortcuts[index].$target.scrollIntoView({
			block: "nearest",
			inline: "nearest",
			behavior: "instant",
		});
	}

	/**
	 * Resets the active shortcut.
	 *
	 * @return {void}
	 */
	reset_active() {
		if (this.viewable_shortcuts.length === 0) {
			return;
		}
		// Check if a shortcut is already active
		if (this.active_index !== -1) {
			this.viewable_shortcuts[this.active_index].set_inactive();
		}
		this.active_index = -1;
	}

	/**
	 * Selects the next shortcut and sets it as active.
	 *
	 * @return {void} No return value.
	 */
	next() {
		const next_index = (this.active_index + 1) % this.viewable_shortcuts.length;
		// Set the new shortcut as active
		this.set_active(next_index);
	}

	/**
	 * Selects the previous shortcut and sets it as active.
	 *
	 * @return {void}
	 */
	previous() {
		const previous_index =
			(this.active_index - 1 + this.viewable_shortcuts.length) %
			this.viewable_shortcuts.length;
		// Set the new shortcut as active
		this.set_active(previous_index);
	}

	/**
	 * Renders the filtered shortcuts based on the provided filter.
	 *
	 * @param {string} filter - The filter to apply to the shortcuts.
	 */
	render_filtered(filter) {
		this.reset_active();
		// If the filter is empty, render all shortcuts
		let filtered_shortcuts = this.shortcuts;
		if (!(filter === "")) {
			// Filter shortcuts, return the array as a list of the item in the array
			filtered_shortcuts = this.fuse.search(filter).map((item) => item.item);
		}
		// Render shortcuts
		while (this.$target.firstChild) {
			this.$target.removeChild(this.$target.firstChild);
		}
		this.viewable_shortcuts = [];
		for (const shortcut of filtered_shortcuts) {
			shortcut.render_view();
			this.$target.appendChild(shortcut.$target);
			this.viewable_shortcuts.push(shortcut);
		}
		// Set first shortcut as active0
		this.set_active(0);
	}

	/**
	 * Jump_selected function - Checks if there is a selected shortcut and jumps to it.
	 */
	jump_selected() {
		// Check if there is a selected shortcut
		if (this.active_index === -1) {
			return;
		}
		this.viewable_shortcuts[this.active_index].jump();
	}
}

function render(shortcuts) {
	//? Render shortcuts
	const shortcut_list = new ShortcutList(
		$shortcut_list,
		shortcuts.map((shortcut) => {
			return new Shortcut(
				shortcut,
				$li_template.cloneNode(true),
				$view_template.cloneNode(true),
			);
		}),
	);

	//? Add event listeners
	// listen for letdown events on the input element for shortcuts
	const $shortcut = document.getElementById("shortcut");

	$shortcut.addEventListener("keydown", (e) => {
		if (e.key === "Enter") {
			// Open the selected shortcut
			shortcut_list.jump_selected();
			return false;
		}
		if (e.key === "ArrowUp") {
			shortcut_list.previous($shortcut);
			return false;
		}
		if (e.key === "ArrowDown") {
			shortcut_list.next($shortcut);
			return false;
		}
	});

	// Listen for input events on the input element for shortcuts
	$shortcut.addEventListener("input", (e) => {
		// Filter shortcuts
		shortcut_list.render_filtered(e.target.value);
	});

	shortcut_list.render_filtered($shortcut.value);
}

const $shortcut_list = document.getElementById("shortcut-list");

//? Load list item template
const $li_template = document.getElementById("template-shortcut-li");

// Remove template from DOM
$li_template.setAttribute("id", "");
$li_template.remove();

//? Load view template
const $view_template = document.getElementById("template-view");
// Remove template from DOM
$view_template.setAttribute("id", "");
$view_template.remove();

// While response does not contain shortcut_keys, try again
let bookmarks = [];

let tries = 0;
const max_tries = 10;
const interval = setInterval(() => {
	chrome.runtime.sendMessage(
		{ target: "background-settings", name: "load" },
		(response) => {
			console.log(response);
			if (response.bookmarks.length > 0) {
				bookmarks = response.bookmarks;
				clearInterval(interval);
				render(bookmarks);
			}
			tries++;
			if (tries >= max_tries) {
				console.log("Could not load shortcuts");
				clearInterval(interval);
			}
		},
	);
}, 100);

// Focus on the input element on key down actions
document.onkeydown = (e) => {
	document.getElementById("shortcut").focus();
};
