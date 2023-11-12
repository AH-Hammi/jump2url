// Represent a shortcut
class Shortcut {
  constructor(data, $target, $view_template, $edit_template) {
    this.title = data.title;
    this.url = data.url;
    this.key = data.key;
    this.$target = $target;
    this.$view_template = $view_template;
    this.$edit_template = $edit_template;
    this.edit_tooltip = null;
  }

  // jumps to the url
  jump() {
    // open the url
    chrome.runtime.sendMessage(
      { target: "background-jump", name: "jump", url: this.url },
      () => {}
    );
    window.close();
  }

  validate() {
    // ask the backend to validate the input
    var invalid = false;
    var request = {
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
        this.url === this.$target.find("#url").val()
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

  // render the shortcut
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
    var edit_button = this.$target.find(".edit-button");
    this.edit_tooltip = new bootstrap.Tooltip(edit_button,{
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

  // render the shortcut in edit mode
  render_edit(is_new = false) {
    this.$target.empty();
    this.$target.append(this.$edit_template);
    this.$target.find("#key").val(this.key);
    this.$target.find("#title").val(this.title);
    this.$target.find("#url").val(this.url);
    //! Validate input on changed input event
    this.$target.find("#key").on("input", (e) => {
      this.$target.find("#key").removeClass("is-invalid");
      this.validate();
    });
    this.$target.find("#title").on("input", (e) => {
      this.$target.find("#title").removeClass("is-invalid");
      this.validate();
    });
    this.$target.find("#url").on("input", (e) => {
      this.$target.find("#url").removeClass("is-invalid");
      this.validate();
    });

    var form = this.$target.find("form");
    // catch submit event
    form.on("submit", (e) => {
      // save the shortcut
      var old_key = this.key;
      this.key = this.$target.find("#key").val();
      this.title = this.$target.find("#title").val();
      this.url = this.$target.find("#url").val();
      this.render_view();
      var request = {
        target: "background-settings",
        name: "update",
        settings: {
          old_key: old_key,
          key: this.key,
          title: this.title,
          url: this.url,
        },
      };
      chrome.runtime.sendMessage(request, () => {});
      return false;
    });
    // add click event listener to submit button
    var submit_button = this.$target.find("#submit-button");
    // add tooltip to submit button
    var submit_tooltip = new bootstrap.Tooltip(submit_button);
    // add click event listener
    submit_button.on("click", () => {
      // hide tooltip
      submit_tooltip.hide();
    });

    // add click event listener to cancel button
    var cancel_button = this.$target.find("#cancel-button");
    // add tooltip to cancel button
    var cancel_tooltip = new bootstrap.Tooltip(cancel_button);
    // add click event listener
    cancel_button.on("click", () => {
      // cancel editing the shortcut
      cancel_tooltip.hide();
      if (is_new) {
        // delete the shortcut
        this.$target.remove();
        return false;
      }
      this.render_view();
      // focus to the input element
      document.getElementById("shortcut").focus();
      return false;
    });
    if (is_new) {
      // if it is a new shortcut, disable the delete button
      this.$target.find("#delete-button").attr("disabled", true);
    } else {
      this.$target.find("#delete-button").attr("disabled", false);
      // add click event listener to delete button
      var delete_button = this.$target.find("#delete-button");
      // add tooltip to delete button
      var delete_tooltip = new bootstrap.Tooltip(delete_button);
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
      block: "start",
      inline: "nearest",
      behavior: "instant",
    });

    var $layer = this.$target.find('.layer');
      var $switch = this.$target.find('.switch');
      var $no_option = this.$target.find('.no-option');
      var $yes_option = this.$target.find('.yes-option');
      var $knobs = this.$target.find('.knobs');

      // Enable Switch Button functionality
      $layer.css('width', $('.no-option').outerWidth(true));
      $layer.css('margin-left', "0px");
      // Set height of layer to height of switch-button
      $layer.css('height', $knobs.outerHeight(true));

      $switch.change(() => {
        if ($switch.is(':checked')) {
          $layer.css('width', $yes_option.outerWidth(true));
          $layer.css('margin-left', $yes_option.position().left);
        } else {
          $layer.css('width', $no_option.outerWidth(true));
          $layer.css('margin-left', $no_option.position().left);
        }
      });

    // make input character uppercase
    this.$target.find("#key").on("input", (e) => {
      e.target.value = e.target.value.toUpperCase();
    });
    // Focus to first input element
    this.$target.find("#key").focus();
  }

  // set the view to active
  set_active() {
    this.$view_template.addClass("active");
  }

  // set the view to inactive
  set_inactive() {
    this.$view_template.removeClass("active");
  }

  data() {
    return {
      title: this.title,
      url: this.url,
      key: this.key,
    };
  }
}

// a list over all shortcuts holding the ul element as well as all shortcut elements
class ShortcutList {
  constructor($target, shortcuts) {
    this.$target = $target;
    this.shortcuts = shortcuts;
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
  }

  append(shortcut) {
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
    shortcut.render_view();
    this.set_active(0);
  }

  // add list item at index 0
  prepend(shortcut) {
    this.append(shortcut);
    this.$target.prepend(shortcut.$target);
  }

  // sets the shortcut at the given index as active
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

  // select the next shortcut
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

  // select the previous shortcut
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

  // render the list with the given filter
  render_filtered(filter) {
    this.reset_active();
    // filter shortcuts
    const filtered_shortcuts = this.shortcuts.filter((shortcut) => {
      return shortcut.key.toUpperCase().includes(filter.toUpperCase());
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

  // Open the selected shortcut
  jump_selected() {
    // check if there is a selected shortcut
    if (this.active_index === -1) {
      return;
    }
    this.viewable_shortcuts[this.active_index].jump();
  }

  hide_keyboard_commands() {
    // hide all tooltips
    this.command_tooltips["add_current_page"].hide();
    this.command_tooltips["add_new_page"].hide();
    this.command_tooltips["keyboard_shortcut"].hide();
    for (const key in this.command_tooltips.edit_buttons) {
      this.command_tooltips.edit_buttons[key].hide();
    }

    this.command_tooltips_active = false;
  }

  show_keyboard_commands() {
    // show all tooltips
    this.command_tooltips["add_current_page"].show();
    this.command_tooltips["add_new_page"].show();
    this.command_tooltips["keyboard_shortcut"].show();

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
$li_template.remove();

//? Load view template
const $view_template = $("#template-view");
// remove template from DOM
$view_template.remove();

//? Load edit template
const $edit_template = $("#template-edit");
// remove template from DOM
$edit_template.remove();

function render(shortcuts) {
  //? Render shortcuts
  const shortcut_list = new ShortcutList($shortcut_list, []);
  for (const shortcut of shortcuts) {
    // create shortcut object
    const shortcut_object = new Shortcut(
      shortcut,
      $li_template.clone(),
      $view_template.clone(),
      $edit_template.clone()
    );
    // append shortcut to list
    shortcut_list.append(shortcut_object);
  }

  //? Add event listener
  // listen for keydown events on the input element for shortcuts
  $("#shortcut").on("keydown", function (e) {
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
    if (e.key == "Alt") {
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

  // listen for click events on the keyboard icon
  $("#keyboard_shortcut").on("click", () => {
    // chrome.tabs.create({url: 'chrome://extensions/shortcuts'});
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
    shortcut_object.render_edit(true);
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
    shortcut_object.render_edit(true);
    // get current tab
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      // set url to current tab
      shortcut_object.url = tabs[0].url;
      shortcut_object.title = tabs[0].title;
      shortcut_object.render_edit(true);
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
    var request = {
      target: "background-settings",
      name: "load",
    };
    chrome.runtime.sendMessage(request, (response) => {
      console.log(response);
      const downloadLink = document.createElement('a');
      downloadLink.download = 'shortcutkeys.json';
      downloadLink.href = URL.createObjectURL(new Blob([JSON.stringify(response.shortcutKeys, null, 2)], { 'type': 'text/plain' }));
      downloadLink.setAttribute('hidden', true);

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
        const importShortcutKeys = JSON.parse(fileContents);
        console.log(importShortcutKeys);
        importShortcutKeys.forEach((shortcutKey) => {
          // make request to backend to add shortcut
          var request = {
            target: "background-settings",
            name: "update",
            settings: {
              old_key: "",
              key: shortcutKey.key,
              title: shortcutKey.title,
              url: shortcutKey.url,
            },
          };
          chrome.runtime.sendMessage(request, () => {});
        });
      } catch (error) {
        console.log(error);
        alert('Could not import due to invalid format.');
      }
    }
    reader.readAsText(file);
    // close popup
    window.close();
  });

  // listen for click events on the import button
  $("#import-shortcuts").on("click", () => {
    $("#import-shortcuts-input").trigger("click");
    return false;
  });

  // listen for input events on the input element for shortcuts
  $("#shortcut").on("input", function (e) {
    // filter shortcuts
    shortcut_list.render_filtered(e.target.value);
  });

  // create tooltip for add current page button
  var add_current_page_tooltip = new bootstrap.Tooltip(
    $("#add_current_page"),
    {
      title: "Add current page",
      placement: "bottom",
      trigger: "hover",
      animation: false,
    }
  );
  // create tooltip for add new page button
  var add_new_page_tooltip = new bootstrap.Tooltip($("#new_page"), {
    title: "Add new page",
    placement: "bottom",
    trigger: "hover",
    animation: false,
  });
  // create tooltip for keyboard shortcut button
  var keyboard_shortcut_tooltip = new bootstrap.Tooltip(
    $("#keyboard_shortcut"),
    {
      title: "Keyboard shortcuts",
      placement: "bottom",
      trigger: "hover",
      animation: false,
    }
  );
  // create tooltip for export shortcut button
  var export_shortcut_tooltip = new bootstrap.Tooltip($("#export-shortcuts"), {
    title: "Export shortcuts",
    placement: "left",
    trigger: "hover",
    animation: false,
  });
  // create tooltip for import shortcut button
  var import_shortcut_tooltip = new bootstrap.Tooltip($("#import-shortcuts"), {
    title: "Import shortcuts",
    placement: "left",
    trigger: "hover",
    animation: false,
  });
  
  $('.layer').css('width', $('.no-option').outerWidth(true));
  $('.layer').css('margin-left', "0px");
  // Set height of layer to height of switch-button
  $('.layer').css('height', $('.knobs').outerHeight(true));

  $('#switch-label').change(function() {
      if ($(this).is(':checked')) {
          $('.layer').css('width', $('.yes-option').outerWidth(true));
          $('.layer').css('margin-left', $('.yes-option').position().left);
      } else {
          $('.layer').css('width', $('.no-option').outerWidth(true));
          $('.layer').css('margin-left', $('.no-option').position().left);
      }
  });
}

// while response does not contain shortcutKeys, try again
var shortcutKeys = [];

var tries = 0;
var max_tries = 10;
var interval = setInterval(() => {
  chrome.runtime.sendMessage(
    { target: "background-settings", name: "load" },
    (response) => {
      if (response.shortcutKeys) {
        shortcutKeys = response.shortcutKeys;
        clearInterval(interval);
        render(shortcutKeys);
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
