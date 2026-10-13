# UH QuickLinks

UH QuickLinks is a Chrome extension I made that puts all the main University of Houston links in one place. I got tired of searching for AccessUH, Canvas, and everything else every time I needed them, so now it's just one click from the toolbar.

## What it does

- Search through the links as soon as you open it. It also checks keywords, so typing "fafsa" pulls up Financial Aid and "gym" pulls up Campus Recreation.
- Use the arrow keys to move through results and Enter to open one.
- Pin the links you use the most with the star so they stay at the top.
- Drag links around to put them in whatever order you want. Dragging a link into the Pinned section pins it too.
- Add your own links with the + button, like a specific Canvas course or a club website.
- The pencil button turns on edit mode, where you can delete links or reset back to the default list.
- Everything saves to your Chrome account, so it carries over to other computers.
- Alt+Shift+U opens it without clicking.

## How to install it

1. Download or clone this repo.
2. Go to `chrome://extensions` in Chrome.
3. Turn on Developer mode in the top right.
4. Click Load unpacked and pick the `uh-quicklinks` folder.
5. Pin it from the puzzle piece icon in the toolbar so it's always there.

## Files

- `manifest.json` has the extension settings, permissions, and keyboard shortcut.
- `popup.html` is the layout of the popup.
- `popup.css` is all the styling (UH red, plus dark mode).
- `popup.js` handles the search, pinning, drag and drop, adding/removing links, and saving.
- `links.js` is the default list of UH links.
- `icons/` has the extension icons.

## Changing the default links

The default links are in `links.js`. Each one looks like this:

```js
{ id: "canvas", title: "Canvas", url: "https://canvas.uh.edu/", tags: "courses grades", pinned: true }
```

`tags` are just extra words that help the search find it. After changing the file, reload the extension in `chrome://extensions` and hit Reset to defaults in edit mode so the new list shows up.

## Permissions

It only uses two permissions. `storage` saves your links and order, and `favicon` shows each site's icon next to its link. It doesn't read any websites or collect any browsing data.

## Built with

JavaScript, HTML, CSS, and Chrome Extensions Manifest V3.
