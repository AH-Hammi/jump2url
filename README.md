# ![logo](./documentation/icon.svg) jump2url

This chrome extension provides the ability to jump to a url by typing a keyword.

1. [Usage](#usage)
2. [Features](#features)
3. [Jump2Url](#jump2url)
4. [Navigation](#navigation)
5. [Using the hotkeys](#using-the-hotkeys)
6. [Create a new shortcut](#create-a-new-shortcut)
7. [Add current page as shortcut](#add-current-page-as-shortcut)
8. [The edit page](#the-edit-page)
9. [Storage Location](#storage-location)
10. [Export and Import](#export-and-import)
11. [Contribution](#contribution)

## Usage

This extension only consists of a popup.

You can configure a shortcut for this popup in the chrome extension page.  
This is directly accessible from the popup.

![popup](./documentation/Overview.jpg)

## Features

This extension provides the following features:

<!-- no toc -->
- [Jump to a url](#jump2url)
- [Navigate with keyboard](#navigation)
- Full keyboard support. [Including Hotkeys](#using-the-hotkeys)
- [Create custom shortcuts](#create-a-new-shortcut)
- [Add Current page as shortcut](#add-current-page-as-shortcut)
- [Edit existing shortcuts](#the-edit-page)
- [Save shortcuts either to local storage or in sync storage](#storage-location)
- [Export and Import](#export-and-import) shortcuts

## Jump2Url

This is the main feature of this extension.

It jump to the url of the selected shortcut across all windows and tabs.

In case the url is not found it will open a new tab with the url.

## Navigation

When you open the popup you will see a list of all shortcuts.

You need to keep the input field in focus to navigate the list and start the correct page.  
Furthermore you can click on a shortcut to start the page.

You can navigate the list with the arrow keys.

You can start the selected page with the enter key.

## Using the hotkeys

To use the hotkeys you need to have focus on the input field.

Then you need to press "ALT" and you will see all possible Hotkeys from there.

With "A" you can call the add current page feature.

With "N" you can create a new shortcut.

With "E" you can edit the selected shortcut.

With "K" you can open the settings page to the keyboard shortcuts from chrome.

## Create a new shortcut

You can create a new shortcut by clicking on the "New" button in the popup.

## Add current page as shortcut

You can add the current page as shortcut by clicking on the "Add Current Page" button in the popup.

This will automatically fill the url and the title.

Furthermore it will try to fill the keyword with the titles uppercase letters.

## The edit page

When you edit a shortcut you can change the following things:

- Keyword
- Title
- Url
- Storage Location

## Storage Location

The Storage Location is either local or sync.  
Offline means local  
Online means sync

## Export and Import

You can export and import your shortcuts.  
Therefore you can edit them in bulk in case you want to change the storage location. For example.
But you should be careful when importing, because it will overwrite all existing shortcuts with the same key.  
Furthermore it doesn't validate if the key is unique.

## Contribution

Suggestions and pull requests are welcomed!.
