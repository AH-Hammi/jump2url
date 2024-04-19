/**
 * Shortcut class
 *
 * @class
 */
class Shortcut {
	// keep track of how many instances have been created
	static count = 0;

	/**
	 * Constructor function for creating an instance of the class.
	 *
	 * @param {data} data - The data object containing the properties for the instance.
	 * @param {jQuery} $target - The target element where the instance will be rendered.
	 * @param {string} $view_template - The HTML template for the view mode of the instance.
	 * @param {string} $edit_template - The HTML template for the edit mode of the instance.
	 */
	constructor(data, $target, $view_template) {
		this.title = data.title;
		this.url = data.url;
		this.key = data.key;
		this.$target = $target;
		this.$view_template = $view_template;
		this.id = Shortcut.count;
		Shortcut.count++;
	}

	/**
	 * Jumps to a specified URL and closes the window.
	 *
	 * @return {void} No return value.
	 */
	jump() {
		// open the url
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
		this.$target.empty();
		// clone template
		this.$target.append(this.$view_template);
		this.$view_template.find(".key").text(this.key);
		this.$view_template.find(".title").text(this.title);
		// add click event listener
		this.$view_template.on("click", () => {
			this.jump();
			return false;
		});
	}

	/**
	 * Sets the active state of the element.
	 *
	 * @return {void}
	 */
	set_active() {
		this.$view_template.addClass("active");
	}

	/**
	 * Sets the element as inactive by removing the "active" class from the view template.
	 *
	 * @return {void}
	 */
	set_inactive() {
		this.$view_template.removeClass("active");
	}
}

// a list over all shortcuts holding the ul element as well as all shortcut elements
class ShortcutList {
	/**
	 * Initializes a new instance of the Constructor class.
	 *
	 * @param {Object} $target - The target element.
	 * @param {Array} shortcuts - The array of shortcuts.
	 */
	constructor($target, shortcuts) {
		this.$target = $target;
		this.shortcuts = [];
		this.active_index = -1;
		this.viewable_shortcuts = [];

		// create fuse object
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
		this.render_filtered($("#shortcut").val());
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
		// render filtered shortcuts
		this.render_filtered($("#shortcut").val());
	}

	/**
	 * Appends a shortcut to the list of shortcuts and updates the view.
	 *
	 * @param {Shortcut} shortcut - The shortcut to be appended.
	 */
	_append(shortcut) {
		this.shortcuts.push(shortcut);
		this.viewable_shortcuts.push(shortcut);
		this.$target.append(shortcut.$target);
		// render shortcut
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
		// check if index is valid
		if (index < 0 || index >= this.viewable_shortcuts.length) {
			return;
		}
		// reset active shortcut
		this.reset_active();
		this.viewable_shortcuts[index].set_active();
		this.active_index = index;
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
		// check if a shortcut is already active
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
		// scroll down if the next shortcut is not visible
		this.viewable_shortcuts[next_index].$target[0].scrollIntoView({
			block: "nearest",
			inline: "nearest",
			behavior: "instant",
		});
		// set the new shortcut as active
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
		// scroll up if the previous shortcut is not visible
		this.viewable_shortcuts[previous_index].$target[0].scrollIntoView({
			block: "nearest",
			inline: "nearest",
			behavior: "instant",
		});
		// set the new shortcut as active
		this.set_active(previous_index);
	}

	/**
	 * Renders the filtered shortcuts based on the provided filter.
	 *
	 * @param {string} filter - The filter to apply to the shortcuts.
	 */
	render_filtered(filter) {
		this.reset_active();
		// if the filter is empty, render all shortcuts
		let filtered_shortcuts = this.shortcuts;
		if (!(filter === "")) {
			// filter shortcuts, return the array as a list of the item in the array
			filtered_shortcuts = this.fuse.search(filter).map((item) => item.item);
		}
		// render shortcuts
		this.$target.empty();
		this.viewable_shortcuts = [];
		for (const shortcut of filtered_shortcuts) {
			shortcut.render_view();
			this.$target.append(shortcut.$target);
			this.viewable_shortcuts.push(shortcut);
		}
		// set first shortcut as active0
		this.set_active(0);
	}

	/**
	 * jump_selected function - Checks if there is a selected shortcut and jumps to it.
	 */
	jump_selected() {
		// check if there is a selected shortcut
		if (this.active_index === -1) {
			return;
		}
		this.viewable_shortcuts[this.active_index].jump();
	}
}

const $shortcut_list = $("#shortcut-list");

//? Load list item template
const $li_template = $("#template-shortcut-li");
// remove template from DOM
$li_template.attr("id", "");
$li_template.remove();

//? Load view template
const $view_template = $("#template-view");
// remove template from DOM
$view_template.attr("id", "");
$view_template.remove();

function render(shortcuts) {
	//? Render shortcuts
	const shortcut_list = new ShortcutList(
		$shortcut_list,
		shortcuts.map((shortcut) => {
			return new Shortcut(
				shortcut,
				$li_template.clone(),
				$view_template.clone(),
			);
		}),
	);

	//? Add event listener
	// listen for keydown events on the input element for shortcuts
	$("#shortcut").on("keydown", (e) => {
		if (e.key === "Enter") {
			// open the selected shortcut
			shortcut_list.jump_selected();
			return false;
		}
		if (e.key === "ArrowUp") {
			shortcut_list.previous($("#shortcut"));
			return false;
		}
		if (e.key === "ArrowDown") {
			shortcut_list.next($("#shortcut"));
			return false;
		}
	});

	// listen for input events on the input element for shortcuts
	$("#shortcut").on("input", (e) => {
		// filter shortcuts
		shortcut_list.render_filtered(e.target.value);
	});
}

// while response does not contain shortcut_keys, try again
let bookmarks = [];

let tries = 0;
const max_tries = 10;
const interval = setInterval(() => {
	chrome.runtime.sendMessage(
		{ target: "background-settings", name: "load" },
		(response) => {
			console.log(response);
			if (response.bookmarks) {
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

// Focus to the input element
document.getElementById("shortcut").focus();
