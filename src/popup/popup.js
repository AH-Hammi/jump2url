/**
 * Render the toggle button.
 *
 * @param {jQuery} $target - The target element containing the toggle button.
 * @return {void} This function does not return a value.
 */
function toggle_button_render($target) {
  const $layer = $target.find(".layer");
  const $switch = $target.find(".switch");
  const $no_option = $target.find(".no-option");
  const $yes_option = $target.find(".yes-option");

  // check if the switch is checked
  if ($switch.is(":checked")) {
    // set layer behind the yes option
    $layer.css("width", $yes_option.outerWidth());
    $layer.css("height", $yes_option.outerHeight());
    $layer.css("left", $yes_option.position().left);
    $layer.css("top", $yes_option.position().top);
    $yes_option.addClass("text-white");
    $no_option.removeClass("text-white");
  } else {
    // set layer behind the no option
    $layer.css("width", $no_option.outerWidth());
    $layer.css("height", $no_option.outerHeight());
    $layer.css("left", $no_option.position().left);
    $layer.css("top", $no_option.position().top);
    $no_option.addClass("text-white");
    $yes_option.removeClass("text-white");
  }

  // set transition
  $layer.css("transition", "0.2s ease all");
  $no_option.css("transition", "0.2s ease all");
  $yes_option.css("transition", "0.2s ease all");

  window.scrollTo(0, 0);
}

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
  constructor(data, $target, $view_template, $edit_template) {
    this.title = data.title;
    this.url = data.url;
    this.key = data.key;
    this.sync = data.sync;
    this.$target = $target;
    this.$view_template = $view_template;
    this.$edit_template = $edit_template;
    this.edit_tooltip = null;
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
      }
    );
  }

  /**
   * Validate the input by asking the backend for validation.
   * If the input is invalid, add is-invalid to the input.
   *
   * @return {void} No return value.
   */
  validate() {
    // ask the backend to validate the input
    let invalid = false;
    const request = {
      target: "background-validate",
      name: "validate",
      old_key: this.key,
      key: this.$target.find("#key").val(),
      title: this.$target.find("#title").val(),
      url: this.$target.find("#url").val(),
    };
    chrome.runtime.sendMessage(request, (response) => {
      // add is-invalid to invalid inputs
      if (!response.key) {
        // check if the key is the same as before
        // if (!(this.key === this.$target.find("#key").val())) {
        // key is the same as before
        this.$target.find("#key").addClass("is-invalid");
        invalid = true;
        // }
      }
      if (!response.title) {
        this.$target.find("#title").addClass("is-invalid");
        invalid = true;
      }
      if (!response.url) {
        this.$target.find("#url").addClass("is-invalid");
        invalid = true;
      }
      if (invalid) {
        // disable submit button
        this.$target.find("#submit-button").attr("disabled", true);
        return false;
      }
      // Check if any inputs were changed
      if (
        this.key === this.$target.find("#key").val() &&
        this.title === this.$target.find("#title").val() &&
        this.url === this.$target.find("#url").val() &&
        this.sync === this.$target.find(`#sync-${this.id}`).is(":checked")
      ) {
        // disable submit button
        this.$target.find("#submit-button").attr("disabled", true);
        return false;
      }
      // enable submit button
      this.$target.find("#submit-button").attr("disabled", false);
      return true;
    });
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
    // add click event listener to edit button
    const edit_button = this.$target.find(".edit-button");
    this.edit_tooltip = new bootstrap.Tooltip(edit_button, {
      title: "Edit",
      placement: "bottom",
      trigger: "hover",
    });
    edit_button.on("click", () => {
      // edit the shortcut
      this.render_edit();
      this.edit_tooltip.hide();
      return false;
    });
    // add tooltip to edit button
  }

  /**
   * Renders the edit form.
   */
  render_edit() {
    this.$target.empty();
    this.$target.append(this.$edit_template);
    // give switch input a unique id
    const $key = this.$target.find("#key");
    const $title = this.$target.find("#title");
    const $url = this.$target.find("#url");
    const $sync = this.$target.find("#sync");

    $sync.attr("id", `sync-${this.id}`);
    // find all labels looking for sync
    this.$target.find("label[for=sync]").attr("for", `sync-${this.id}`);

    $key.val(this.key);
    $title.val(this.title);
    $url.val(this.url);
    $sync.prop("checked", this.sync);
    //! Validate input on changed input event
    $key.on("input", (e) => {
      this.$target.find("#key").removeClass("is-invalid");
      this.validate();
    });
    $title.on("input", (e) => {
      this.$target.find("#title").removeClass("is-invalid");
      this.validate();
    });
    $url.on("input", (e) => {
      this.$target.find("#url").removeClass("is-invalid");
      this.validate();
    });
    $sync.on("input", (e) => {
      this.validate();
    });

    const form = this.$target.find("form");
    // catch submit event
    form.on("submit", (e) => {
      // save the shortcut
      const old_key = this.key;
      this.key = this.$target.find("#key").val();
      this.title = this.$target.find("#title").val();
      this.url = this.$target.find("#url").val();
      this.sync = this.$target.find("#sync").is(":checked");
      const request = {
        target: "background-settings",
        name: "update",
        settings: {
          old_key: old_key,
          key: this.key,
          title: this.title,
          url: this.url,
          sync: this.sync,
        },
      };
      chrome.runtime.sendMessage(request, () => {});
      this.render_view();
      return false;
    });
    // add click event listener to submit button
    const submit_button = this.$target.find("#submit-button");
    // add tooltip to submit button
    const submit_tooltip = new bootstrap.Tooltip(submit_button);
    // add click event listener
    submit_button.on("click", () => {
      // hide tooltip
      submit_tooltip.hide();
    });

    // add click event listener to cancel button
    const cancel_button = this.$target.find("#cancel-button");
    // add tooltip to cancel button
    const cancel_tooltip = new bootstrap.Tooltip(cancel_button);
    // add click event listener
    cancel_button.on("click", () => {
      // cancel editing the shortcut
      cancel_tooltip.hide();
      if (this.key === "") {
        // delete the shortcut
        this.$target.remove();
        return false;
      }
      this.render_view();
      // focus to the input element
      document.getElementById("shortcut").focus();
      return false;
    });

    if (this.key === "") {
      // if it is a new shortcut, disable the delete button
      this.$target.find("#delete-button").attr("disabled", true);
    } else {
      this.$target.find("#delete-button").attr("disabled", false);
      // add click event listener to delete button
      const delete_button = this.$target.find("#delete-button");
      // add tooltip to delete button
      const delete_tooltip = new bootstrap.Tooltip(delete_button);
      // add click event listener
      delete_button.on("click", () => {
        // hide tooltip
        delete_tooltip.hide();
        // delete the shortcut
        this.$target.remove();
        const request = {
          target: "background-settings",
          name: "delete",
          key: this.key,
        };
        chrome.runtime.sendMessage(request, () => {});
        return false;
      });
    }

    // scroll to show the edit field at the top
    this.$target[0].scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "smooth",
    });

    toggle_button_render(this.$target);

    this.$target.find(".switch").change(() => {
      toggle_button_render(this.$target);
    });

    // make input character uppercase
    this.$target.find("#key").on("input", (e) => {
      e.target.value = e.target.value.toUpperCase();
    });

    // Focus to first input element
    this.$target.find("#key").focus();
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

  /**
   * Returns an object containing the current values of the title, url, key, and sync properties.
   *
   * @return {object} An object with the following properties:
   *                  - title: The title property value
   *                  - url: The url property value
   *                  - key: The key property value
   *                  - sync: The sync property value
   */
  data() {
    return {
      title: this.title,
      url: this.url,
      key: this.key,
      sync: this.sync,
    };
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
    this.command_tooltips = {
      add_current_page: null,
      add_new_page: null,
      keyboard_shortcut: null,
      edit_buttons: [],
    };
    this.command_tooltips.add_current_page = new bootstrap.Tooltip(
      $("#add_current_page"),
      {
        title: "A",
        placement: "bottom",
        trigger: "manual",
        animation: false,
      }
    );
    this.command_tooltips.add_new_page = new bootstrap.Tooltip($("#new_page"), {
      title: "N",
      placement: "bottom",
      trigger: "manual",
      animation: false,
    });
    this.command_tooltips.keyboard_shortcut = new bootstrap.Tooltip(
      $("#keyboard_shortcut"),
      {
        title: "K",
        placement: "bottom",
        trigger: "manual",
        animation: false,
      }
    );
    this.command_tooltips_active = false;
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
    // add command edit tooltip
    this.command_tooltips.edit_buttons[shortcut.key] = new bootstrap.Tooltip(
      shortcut.$target.find(".edit-button"),
      {
        title: "E",
        placement: "bottom",
        trigger: "manual",
        animation: false,
      }
    );
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
    // filter shortcuts
    const filtered_shortcuts = this.shortcuts.filter((shortcut) => {
      return shortcut.key.toUpperCase().startsWith(filter.toUpperCase());
    });
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

  /**
   * Hides all keyboard commands.
   */
  hide_keyboard_commands() {
    // hide all tooltips
    this.command_tooltips.add_current_page.hide();
    this.command_tooltips.add_new_page.hide();
    this.command_tooltips.keyboard_shortcut.hide();
    for (const key in this.command_tooltips.edit_buttons) {
      this.command_tooltips.edit_buttons[key].hide();
    }

    this.command_tooltips_active = false;
  }

  /**
   * Shows all keyboard commands.
   */
  show_keyboard_commands() {
    // show all tooltips
    this.command_tooltips.add_current_page.show();
    this.command_tooltips.add_new_page.show();
    this.command_tooltips.keyboard_shortcut.show();

    // show current selected shortcut edit tooltip if there is one selected
    if (this.active_index !== -1) {
      this.command_tooltips.edit_buttons[
        this.viewable_shortcuts[this.active_index].key
      ].show();
    }

    this.command_tooltips_active = true;
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

//? Load edit template
const $edit_template = $("#template-edit");
// remove template from DOM
$edit_template.attr("id", "");
$edit_template.remove();

function render(shortcuts) {
  //? Render shortcuts
  const shortcut_list = new ShortcutList(
    $shortcut_list,
    shortcuts.map((shortcut) => {
      return new Shortcut(
        shortcut,
        $li_template.clone(),
        $view_template.clone(),
        $edit_template.clone()
      );
    })
  );

  //? Add event listener
  // listen for keydown events on the input element for shortcuts
  $("#shortcut").on("keydown", (e) => {
    // check if the keyboard shortcuts are visible
    if (shortcut_list.command_tooltips_active) {
      // catch keyboard shortcuts
      if (e.key === "a" || e.key === "A") {
        // add current page
        $("#add_current_page").trigger("click");
        shortcut_list.hide_keyboard_commands();
        return false;
      }
      if (e.key === "n" || e.key === "N") {
        // add new page
        $("#new_page").trigger("click");
        shortcut_list.hide_keyboard_commands();
        return false;
      }
      if (e.key === "k" || e.key === "K") {
        // open keyboard shortcuts
        $("#keyboard_shortcut").trigger("click");
        shortcut_list.hide_keyboard_commands();
        return false;
      }
      if (e.key === "e" || e.key === "E") {
        // open edit shortcut
        if (shortcut_list.active_index === -1) {
          return false;
        }
        shortcut_list.viewable_shortcuts[shortcut_list.active_index].$target
          .find(".edit-button")
          .trigger("click");
        shortcut_list.hide_keyboard_commands();
        return false;
      }
    }
    if (e.key === "Alt") {
      // open the view shortcut panel
      shortcut_list.show_keyboard_commands();
      return false;
    }
    shortcut_list.hide_keyboard_commands();
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

  // listen on focus lost on #shortcut
  $("#shortcut").on("blur", (e) => {
    // hide keyboard commands
    shortcut_list.hide_keyboard_commands();
  });

  // listen for click events on the keyboard icon
  $("#keyboard_shortcut").on("click", () => {
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
    return false;
  });

  // listen for click events on the add button
  $("#new_page").on("click", () => {
    // add a new shortcut to the list
    const shortcut = {
      title: "",
      url: "",
      key: "",
    };
    // create shortcut object
    const shortcut_object = new Shortcut(
      shortcut,
      $li_template.clone(),
      $view_template.clone(),
      $edit_template.clone()
    );
    // append shortcut to list
    shortcut_list.prepend(shortcut_object);
    // render shortcut
    shortcut_object.render_edit();
    return false;
  });

  // listen for click events on the add current page button
  $("#add_current_page").on("click", () => {
    // add a new shortcut to the list
    const shortcut = {
      title: "",
      url: "",
      key: "",
    };
    // create shortcut object
    const shortcut_object = new Shortcut(
      shortcut,
      $li_template.clone(),
      $view_template.clone(),
      $edit_template.clone()
    );
    // append shortcut to list
    shortcut_list.prepend(shortcut_object);
    // render shortcut
    shortcut_object.render_edit();
    // get current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      // set url to current tab
      shortcut_object.url = tabs[0].url;
      shortcut_object.title = tabs[0].title;
      shortcut_object.render_edit();
      // generate key from uppercase letters in title
      // fill key to input field
      shortcut_object.$target
        .find("#key")
        .val(shortcut_object.title.replace(/[^A-Z]/g, ""));
      // validate input
      shortcut_object.validate();
    });
    return false;
  });

  // listen for click events on the export button
  $("#export-shortcuts").on("click", () => {
    const request = {
      target: "background-settings",
      name: "load",
    };
    chrome.runtime.sendMessage(request, (response) => {
      console.log(response);
      const downloadLink = document.createElement("a");
      downloadLink.download = "shortcut_keys.json";
      downloadLink.href = URL.createObjectURL(
        new Blob([JSON.stringify(response.shortcut_keys, null, 2)], {
          type: "text/plain",
        })
      );
      downloadLink.setAttribute("hidden", true);

      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
    });
  });

  $("#import-shortcuts-input").on("change", (e) => {
    console.log("importing shortcuts");
    console.log(e);
    const file = e.target.files[0];

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContents = e.target.result;
      try {
        const import_shortcut_keys = JSON.parse(fileContents);
        console.log(import_shortcut_keys);
        for (const shortcutKey of import_shortcut_keys) {
          // make request to backend to add shortcut
          const request = {
            target: "background-settings",
            name: "update",
            settings: {
              old_key: "",
              key: shortcutKey.key,
              title: shortcutKey.title,
              url: shortcutKey.url,
              sync: shortcutKey.sync,
            },
          };
          chrome.runtime.sendMessage(request, () => {});
        }
      } catch (error) {
        console.log(error);
        alert("Could not import due to invalid format.");
      }
      // close popup
      window.close();
    };
    reader.readAsText(file);
  });

  // listen for click events on the import button
  $("#import-shortcuts").on("click", () => {
    $("#import-shortcuts-input").trigger("click");
    return false;
  });

  // listen for input events on the input element for shortcuts
  $("#shortcut").on("input", (e) => {
    // filter shortcuts
    shortcut_list.render_filtered(e.target.value);
  });

  // create tooltip for add current page button
  const add_current_page_tooltip = new bootstrap.Tooltip(
    $("#add_current_page"),
    {
      title: "Add current page",
      placement: "bottom",
      trigger: "hover",
      animation: false,
    }
  );
  // create tooltip for add new page button
  const add_new_page_tooltip = new bootstrap.Tooltip($("#new_page"), {
    title: "Add new page",
    placement: "bottom",
    trigger: "hover",
    animation: false,
  });
  // create tooltip for keyboard shortcut button
  const keyboard_shortcut_tooltip = new bootstrap.Tooltip(
    $("#keyboard_shortcut"),
    {
      title: "Keyboard shortcuts",
      placement: "bottom",
      trigger: "hover",
      animation: false,
    }
  );
  // create tooltip for export shortcut button
  const export_shortcut_tooltip = new bootstrap.Tooltip(
    $("#export-shortcuts"),
    {
      title: "Export shortcuts",
      placement: "left",
      trigger: "hover",
      animation: false,
    }
  );
  // create tooltip for import shortcut button
  const import_shortcut_tooltip = new bootstrap.Tooltip(
    $("#import-shortcuts"),
    {
      title: "Import shortcuts",
      placement: "left",
      trigger: "hover",
      animation: false,
    }
  );
}

// while response does not contain shortcut_keys, try again
let shortcut_keys = [];

let tries = 0;
const max_tries = 10;
const interval = setInterval(() => {
  chrome.runtime.sendMessage(
    { target: "background-settings", name: "load" },
    (response) => {
      if (response.shortcut_keys) {
        shortcut_keys = response.shortcut_keys;
        clearInterval(interval);
        render(shortcut_keys);
      }
      tries++;
      if (tries >= max_tries) {
        console.log("Could not load shortcuts");
        clearInterval(interval);
      }
    }
  );
}, 100);

// Focus to the input element
document.getElementById("shortcut").focus();
