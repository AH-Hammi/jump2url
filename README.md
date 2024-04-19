# ![logo](./documentation/icon.svg) jump2url

This chrome extension provides the ability to jump to a url by typing a keyword.

1. [Usage](#usage)
2. [Features](#features)
3. [Jump2Url](#jump2url)
4. [Navigation](#navigation)
5. [Searching](#searching)
6. [How to add a shortcut](#how-to-add-a-shortcut)
7. [Contribution](#contribution)

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

## Searching

You can search for a shortcut by typing in the input field.

The search is a fuzzy search that matches against key, title and url

## How to add a shortcut

All shortcuts are created from your bookmarks.

The Key is always all uppercase letters of the bookmark.

Only bookmarks with at least one uppercase letter are considered, the rest is ignored and not shown in the popup.

To make this a bit clearer, here is an example:

Bookmark title: `YouTube Music`

The key would be `YTM`

## Contribution

For contribution please make sure to use the following tools:

- [biome](https://biomejs.dev/) As your formatting tool and linter

Suggestions and pull requests are welcomed!.
