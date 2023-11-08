// Represent a shortcut
class Shortcut {
    constructor(data, $target, $view_template, $edit_template) {
        this.title = data.title;
        this.url = data.url;
        this.key = data.key;
        this.$target = $target;
        this.$view_template = $view_template;
        this.$edit_template = $edit_template;
    }

    // jumps to the url
    jump() {
        // open the url
        chrome.runtime.sendMessage({target: 'background-jump', name: 'jump', url: this.url}, () => {});
        window.close();
    }

    validate(){
        // ask the backend to validate the input
        var invalid = false;
        var request = {
            target: 'background-validate',
            name: 'validate',
            key: this.$target.find("#key").val(),
            title: this.$target.find("#title").val(),
            url: this.$target.find("#url").val(),
            };
        chrome.runtime.sendMessage(request, (response) => {
            console.log(response);
            // add is-invalid to invalid inputs
            if (!response.key) {
                // check if the key is the same as before
                if (!(this.key === this.$target.find("#key").val())) {
                    // key is the same as before
                    this.$target.find("#key").addClass("is-invalid");
                    invalid = true;
                }
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
            if (this.key === this.$target.find("#key").val() && this.title === this.$target.find("#title").val() && this.url === this.$target.find("#url").val()) {
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
        edit_button.on("click", ()=>{
            // edit the shortcut
            console.log("Edit " + this.url);
            this.render_edit();
            return false;
        });
    }

    // render the shortcut in edit mode
    render_edit(is_new = false) {
        this.$target.empty();
        this.$target.append(this.$edit_template);
        this.$target.find("#key").val(this.key);
        this.$target.find("#title").val(this.title);
        this.$target.find("#url").val(this.url);
        //! Validate input on changed input event
        this.$target.find("#key").on("input", (e)=>{
            this.$target.find("#key").removeClass("is-invalid");
            this.validate();
        });
        this.$target.find("#title").on("input", (e)=>{
            this.$target.find("#title").removeClass("is-invalid");
            this.validate();
        });
        this.$target.find("#url").on("input", (e)=>{
            this.$target.find("#url").removeClass("is-invalid");
            this.validate();
        });
        
        var form = this.$target.find("form");
        // catch submit event
        form.on("submit", (e)=>{
            // save the shortcut
            console.log("Save " + this.url);
            
            var old_key = this.key;
            this.key = this.$target.find("#key").val();
            this.title = this.$target.find("#title").val();
            this.url = this.$target.find("#url").val();
            this.render_view();
            var request = {
                target: 'background-settings',
                name: 'update',
                settings: {
                    "old_key" : old_key,
                    "key"     : this.key,
                    "title"   : this.title,
                    "url"     : this.url
                }
              };
              chrome.runtime.sendMessage(request, () => {});
            return false;
        });

        // add click event listener to cancel button
        var cancel_button = this.$target.find("#cancel-button");
        cancel_button.on("click", ()=>{
            // cancel editing the shortcut
            console.log("Cancel " + this.url);
            if (is_new) {
                // delete the shortcut
                this.$target.remove();
                return false;
            }
            this.render_view();
            return false;
        });
        if (is_new) {
            // if it is a new shortcut, disable the delete button
            this.$target.find("#delete-button").attr("disabled", true);
        }else{
            this.$target.find("#delete-button").attr("disabled", false);
            // add click event listener to delete button 
            var delete_button = this.$target.find("#delete-button");
            delete_button.on("click", ()=>{
                // delete the shortcut
                console.log("Delete " + this.url);
                this.$target.remove();
                const request = {
                    target: 'background-settings',
                    name: 'delete',
                    key: this.key
                };
                chrome.runtime.sendMessage(request, () => {});
                return false;
            });    
        }

        // make input character uppercase
        this.$target.find("#key").on("input", (e)=>{
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
            key: this.key
        }
    }
}

// a list over all shortcuts holding the ul element as well as all shortcut elements
class ShortcutList {
    constructor($target, shortcuts) {
        this.$target = $target;
        this.shortcuts = shortcuts;
        this.active_index = 0;
    }

    append(shortcut) {
        this.shortcuts.push(shortcut);
        this.$target.append(shortcut.$target);
    }

    // add list item at index 0
    prepend(shortcut) {
        this.shortcuts.push(shortcut);
        this.$target.prepend(shortcut.$target);
    }

    // sets the shortcut at the given index as active
    setActive(index) {
        // check if index is valid
        if (index < 0 || index >= this.shortcuts.length) {
            return;
        }
        this.shortcuts[this.active_index].set_inactive();
        this.shortcuts[index].set_active();
        this.active_index = index;
    }

    // select the next shortcut
    next() {
        const next_index = (this.active_index + 1) % this.shortcuts.length;
        this.setActive(next_index);
    }

    // select the previous shortcut
    previous() {
        const previous_index = (this.active_index - 1 + this.shortcuts.length) % this.shortcuts.length;
        this.setActive(previous_index);
    }
    
    // render the list
    render() {
        for (const shortcut of this.shortcuts) {
            shortcut.render_view();
        }
        // set first shortcut as active
        this.setActive(0);
    }

    render_filtered(filter) {
        // filter shortcuts
        const filtered_shortcuts = this.shortcuts.filter((shortcut) => {
            return shortcut.key.toUpperCase().includes(filter.toUpperCase());
        });
        // render shortcuts
        this.$target.empty();
        for (const shortcut of filtered_shortcuts) {
            shortcut.render_view();
            this.$target.append(shortcut.$target);
        }
        // set current first filtered shortcut as active
        // get index of first filtered shortcut
        const index = this.shortcuts.indexOf(filtered_shortcuts[0]);
        this.setActive(index);
    }

    data() {
        return this.shortcuts.map((shortcut) => {
            return shortcut.data();
        });
    }

    // Open the selected shortcut
    jump_selected(){
        this.shortcuts[this.active_index].jump();
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

function render(shortcuts){
    //? Render shortcuts
    const shortcut_list = new ShortcutList($shortcut_list, []);
    for (const shortcut of shortcuts) {
        // create shortcut object
        const shortcut_object = new Shortcut(shortcut, $li_template.clone(), $view_template.clone(), $edit_template.clone());
        // append shortcut to list
        shortcut_list.append(shortcut_object);
    }

    shortcut_list.render();

    //? Add event listener
    // listen for keydown events on the input element for shortcuts
    $("#shortcut").on("keydown", function (e) {
        if (e.key === "Enter") {
            // open the selected shortcut
            shortcut_list.jump_selected();
            return false;
        }
        if (e.key === "ArrowUp") {
            shortcut_list.previous();
            return false;
        }
        if (e.key === "ArrowDown") {
            shortcut_list.next();
            return false;
        }
    });

    // listen for click events on the keyboard icon
    $('#keyboard_shortcut').on('click', () => {
        chrome.tabs.create({url: 'chrome://extensions/shortcuts'});
        return false;
    });

    // listen for click events on the add button
    $('#new_page').on('click', () => {
        console.log("Add new shortcut");
        // add a new shortcut to the list
        const shortcut = {
            title: "",
            url: "",
            key: ""
        };
        // create shortcut object
        const shortcut_object = new Shortcut(shortcut, $li_template.clone(), $view_template.clone(), $edit_template.clone());
        // append shortcut to list
        shortcut_list.prepend(shortcut_object);
        shortcut_list.render();
        // render shortcut
        shortcut_object.render_edit(true);
        return false;
    });

    // listen for click events on the add current page button
    $('#add_current_page').on('click', () => {
        console.log("Add current page");
        // add a new shortcut to the list
        const shortcut = {
            title: "",
            url: "",
            key: ""
        };
        // create shortcut object
        const shortcut_object = new Shortcut(shortcut, $li_template.clone(), $view_template.clone(), $edit_template.clone());
        // append shortcut to list
        shortcut_list.prepend(shortcut_object);
        shortcut_list.render();
        // render shortcut
        shortcut_object.render_edit(true);
        // get current tab
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            // set url to current tab
            shortcut_object.url = tabs[0].url;
            shortcut_object.title = tabs[0].title;
            shortcut_object.render_edit(true);
            // generate key from uppercase letters in title
            // fill key to input field
            shortcut_object.$target.find("#key").val(shortcut_object.title.replace(/[^A-Z]/g, ''));
            // validate input
            shortcut_object.validate();
        });
        return false;
    });

    // listen for input events on the input element for shortcuts
    $("#shortcut").on("input", function (e) {
        // if input is empty render all shortcuts
        if (e.target.value === "") {
            shortcut_list.render();
            return;
        }
        // filter shortcuts
        shortcut_list.render_filtered(e.target.value);
    });
}


chrome.runtime.sendMessage({target: 'background-settings', name: 'load' }, (response) => {
    console.log(response);
    shortcuts = response.shortcutKeys;

    render(shortcuts);
    
    console.log(shortcuts);
  });

// //? Load all shortcuts
// var shortcuts = [
//     {
//         title: "Google",
//         url: "https://www.google.com",
//         key: "G"
//     },
//     {
//         title: "Gmail",
//         url: "https://mail.google.com",
//         key: "M"
//     },
//     {
//         title: "Youtube",
//         url: "https://www.youtube.com",
//         key: "YT"
//     },
//     {
//         title: "Youtube Music",
//         url: "https://music.youtube.com",
//         key: "YTM"
//     },
// ]

// render(shortcuts);

const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))


// Focus to the input element
document.getElementById("shortcut").focus();
