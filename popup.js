import { DEFAULT_LINKS } from "./links.js";

// Key for saving the links list in chrome storage.
const STORAGE_KEY = "links";

// Shortcut so I don't have to type document.getElementById every time.
const $ = (id) => document.getElementById(id);

// Grabs all the elements from popup.html once so they can be reused everywhere.
const els = {
  search: $("search"),
  pinnedSection: $("pinnedSection"),
  pinnedList: $("pinnedList"),
  allList: $("allList"),
  allHeading: $("allHeading"),
  empty: $("empty"),
  toggleAdd: $("toggleAdd"),
  toggleEdit: $("toggleEdit"),
  addForm: $("addForm"),
  addTitle: $("addTitle"),
  addUrl: $("addUrl"),
  addPinned: $("addPinned"),
  addError: $("addError"),
  reset: $("reset"),
  hint: $("hint"),
};

let links = [];        // The full list of links in the order the user wants them.
let query = "";        // What the user typed in the search bar (lowercase).
let activeIndex = 0;   // Which search result is highlighted for the arrow keys.
let draggedId = null;  // The id of the link being dragged, or null if nothing is.

// Checks if chrome storage exists. It won't if popup.html is opened as a normal page for testing.
const hasChromeStorage = typeof chrome !== "undefined" && chrome.storage?.sync;

// Loads the saved links from chrome storage.
// If nothing is saved yet, it just starts with a copy of the default UH links.
async function load() {
  if (hasChromeStorage) {
    const data = await chrome.storage.sync.get(STORAGE_KEY);
    if (Array.isArray(data[STORAGE_KEY])) return data[STORAGE_KEY];
  }
  return structuredClone(DEFAULT_LINKS);
}

// Saves the current links list so pins and order stick after the popup closes.
async function save() {
  if (hasChromeStorage) await chrome.storage.sync.set({ [STORAGE_KEY]: links });
}

// Turns whatever the user typed into a real URL, or returns null if it isn't valid.
// This lets people type "canvas.uh.edu" without needing the https:// part.
function normalizeUrl(raw) {
  let value = raw.trim();
  if (!value) return null;

  // Add https:// at the front if the user didn't type a protocol.
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) value = "https://" + value;

  try {
    const url = new URL(value);
    // Only allow normal web links, and make sure the host has a dot in it (like uh.edu).
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) return null;
    return url.href;
  } catch {
    return null;
  }
}

// Gets just the website part of a URL (ex: "canvas.uh.edu") to show under each title.
function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

// Builds the URL for a site's favicon using Chrome's built in favicon API.
// If it's not running as an extension (like when testing), it just uses the UH icon instead.
function faviconUrl(pageUrl) {
  if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
    const u = new URL(chrome.runtime.getURL("/_favicon/"));
    u.searchParams.set("pageUrl", pageUrl);
    u.searchParams.set("size", "32");
    return u.toString();
  }
  return "icons/icon16.png";
}

// Gives a link a score based on how well it matches the search.
// Matching the start of the title counts the most, and matching the site or tags counts the least.
// If any word in the search doesn't match at all, the score is 0 and the link gets hidden.
function score(link, q) {
  const title = link.title.toLowerCase();
  const rest = `${hostOf(link.url)} ${link.tags || ""}`.toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);
  let total = 0;
  for (const t of terms) {
    if (title.startsWith(t)) total += 4;
    else if (title.split(/[\s()/.-]+/).some((w) => w.startsWith(t))) total += 3;
    else if (title.includes(t)) total += 2;
    else if (rest.includes(t)) total += 1;
    else return 0;
  }
  return total;
}

// Figures out which links should show up right now.
// With no search, they get split into pinned and the rest. While searching, it's one sorted results list.
function visibleLinks() {
  if (!query) {
    return { pinned: links.filter((l) => l.pinned), rest: links.filter((l) => !l.pinned) };
  }
  const results = links
    .map((l, i) => ({ l, s: score(l, query), i }))
    .filter((r) => r.s > 0)
    // Sort by best score first, then pinned links, then the user's own order.
    .sort((a, b) => b.s - a.s || Number(b.l.pinned) - Number(a.l.pinned) || a.i - b.i)
    .map((r) => r.l);
  return { pinned: [], rest: results };
}

// Opens a link in a new tab.
// If background is true (ctrl/cmd or middle click), the tab opens behind and the popup stays open.
function openLink(link, { background = false } = {}) {
  if (typeof chrome !== "undefined" && chrome.tabs?.create) {
    chrome.tabs.create({ url: link.url, active: !background });
    if (!background) window.close();
  } else {
    window.open(link.url, "_blank", "noopener");
  }
}

// Builds the list item for one link: drag handle, favicon, title, website, pin button, and delete button.
// Using textContent instead of innerHTML so custom link names can't inject any HTML.
function renderItem(link) {
  const li = document.createElement("li");
  li.className = "link-item";
  li.dataset.id = link.id;
  li.tabIndex = -1;
  li.draggable = !query; // Dragging is turned off while searching since the order is different.
  li.title = link.url;

  const handle = document.createElement("span");
  handle.className = "handle";
  handle.textContent = "⋮⋮";
  handle.setAttribute("aria-hidden", "true");

  const icon = document.createElement("img");
  icon.className = "favicon";
  icon.alt = "";
  icon.src = faviconUrl(link.url);

  const text = document.createElement("div");
  text.className = "text";
  const title = document.createElement("div");
  title.className = "title";
  title.textContent = link.title;
  const host = document.createElement("div");
  host.className = "host";
  host.textContent = hostOf(link.url);
  text.append(title, host);

  // Pin button shows a filled star if pinned and an empty star if not.
  const pin = document.createElement("button");
  pin.className = "item-btn pin-btn" + (link.pinned ? " pinned" : "");
  pin.textContent = link.pinned ? "★" : "☆";
  pin.title = link.pinned ? "Unpin" : "Pin";
  pin.setAttribute("aria-label", `${pin.title} ${link.title}`);
  pin.dataset.action = "pin";

  // Delete button only shows up in edit mode (handled in the CSS).
  const del = document.createElement("button");
  del.className = "item-btn delete-btn";
  del.textContent = "✕";
  del.title = "Remove";
  del.setAttribute("aria-label", `Remove ${link.title}`);
  del.dataset.action = "delete";

  li.append(handle, icon, text, pin, del);
  return li;
}

// Redraws both lists and updates the headings, empty message, and footer hint.
// Needs to be called any time the links or the search changes.
function render() {
  const { pinned, rest } = visibleLinks();
  document.body.classList.toggle("searching", Boolean(query));

  els.pinnedList.replaceChildren(...pinned.map(renderItem));
  els.allList.replaceChildren(...rest.map(renderItem));

  // Hide a section if it's empty, but keep it showing while dragging so you can drop into it.
  els.pinnedSection.hidden = Boolean(query) || (pinned.length === 0 && !draggedId);
  els.allHeading.textContent = query ? `Results (${rest.length})` : "All links";
  els.allHeading.parentElement.hidden = !query && rest.length === 0 && !draggedId;
  els.empty.hidden = !(query && rest.length === 0);
  els.hint.textContent = query ? "↑↓ to move · Enter to open" : "Drag to reorder · ★ to pin";

  // Make sure the highlighted result is still in range after the list changes.
  const items = allItems();
  activeIndex = Math.min(activeIndex, Math.max(items.length - 1, 0));
  items.forEach((el, i) => el.classList.toggle("active", Boolean(query) && i === activeIndex));
}

// Returns every link item currently on the screen, top to bottom.
function allItems() {
  return [...document.querySelectorAll(".link-item")];
}

// Pins or unpins a link.
// Also moves it to the end of its new section so it shows up somewhere predictable.
async function togglePin(id) {
  const link = links.find((l) => l.id === id);
  if (!link) return;
  link.pinned = !link.pinned;
  links = links.filter((l) => l.id !== id);
  links.push(link);
  await save();
  render();
}

// Removes a link from the list completely.
async function removeLink(id) {
  links = links.filter((l) => l.id !== id);
  await save();
  render();
}

// Moves a link to a new spot after a drag and drop.
// pinnedGroup is which section it was dropped in, so dragging between sections pins or unpins it.
async function moveLink(id, targetId, placeAfter, pinnedGroup) {
  const link = links.find((l) => l.id === id);
  if (!link || id === targetId) return;
  link.pinned = pinnedGroup;
  links = links.filter((l) => l.id !== id);
  let index = targetId ? links.findIndex((l) => l.id === targetId) : -1;
  if (index === -1) {
    // If it was dropped on empty space instead of another link, put it at the end of that section.
    const lastInGroup = links.map((l) => l.pinned).lastIndexOf(pinnedGroup);
    index = lastInGroup + 1;
  } else if (placeAfter) {
    index += 1;
  }
  links.splice(index, 0, link);
  await save();
}

// Every time the user types, update the search and redraw the list.
els.search.addEventListener("input", () => {
  query = els.search.value.trim().toLowerCase();
  activeIndex = 0;
  render();
});

// Keyboard controls for the search bar.
// Arrow keys move the highlight, Enter opens the link, and Escape clears the search.
els.search.addEventListener("keydown", (e) => {
  const items = allItems();
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    if (!items.length) return;
    e.preventDefault();
    // The % lets the highlight wrap around from the bottom back to the top.
    activeIndex = (activeIndex + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    items.forEach((el, i) => el.classList.toggle("active", i === activeIndex));
    items[activeIndex].scrollIntoView({ block: "nearest" });
  } else if (e.key === "Enter") {
    // With no search typed, Enter just opens the first link in the list.
    const el = items[query ? activeIndex : 0];
    const link = el && links.find((l) => l.id === el.dataset.id);
    if (link) openLink(link, { background: e.ctrlKey || e.metaKey });
  } else if (e.key === "Escape" && els.search.value) {
    // Stop Escape from closing the whole popup when there's a search to clear first.
    e.preventDefault();
    els.search.value = "";
    query = "";
    render();
  }
});

// One click listener for the whole list instead of one per link.
// It checks if the pin or delete button was clicked, otherwise it opens the link.
document.querySelector("main").addEventListener("click", (e) => {
  const item = e.target.closest(".link-item");
  if (!item) return;
  const id = item.dataset.id;
  const action = e.target.closest("[data-action]")?.dataset.action;
  if (action === "pin") return togglePin(id);
  if (action === "delete") return removeLink(id);
  const link = links.find((l) => l.id === id);
  if (link) openLink(link, { background: e.ctrlKey || e.metaKey });
});

// Middle click opens the link in a background tab, like it does on normal websites.
document.querySelector("main").addEventListener("auxclick", (e) => {
  if (e.button !== 1) return;
  const item = e.target.closest(".link-item");
  if (!item || e.target.closest("[data-action]")) return;
  const link = links.find((l) => l.id === item.dataset.id);
  if (link) openLink(link, { background: true });
});

// Removes all the red lines and highlights that show where a dragged link will land.
function clearDropMarkers() {
  document.querySelectorAll(".drop-before, .drop-after, .drop-into")
    .forEach((el) => el.classList.remove("drop-before", "drop-after", "drop-into"));
}

// Drag and drop setup for both lists, so links can move inside a section or between Pinned and All links.
for (const list of [els.pinnedList, els.allList]) {
  // Starting a drag: remember which link it is and make sure both sections are showing.
  list.addEventListener("dragstart", (e) => {
    const item = e.target.closest(".link-item");
    if (!item || query) return e.preventDefault();
    draggedId = item.dataset.id;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", draggedId);
    els.pinnedSection.hidden = false;
    els.allList.parentElement.hidden = false;
    requestAnimationFrame(() => item.classList.add("dragging"));
  });

  // While dragging over a list, show a line above or below the link it would land next to.
  list.addEventListener("dragover", (e) => {
    if (!draggedId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    clearDropMarkers();
    const target = e.target.closest(".link-item");
    if (target && target.dataset.id !== draggedId) {
      // If the mouse is on the bottom half of the link, drop after it. Top half, drop before it.
      const rect = target.getBoundingClientRect();
      target.classList.add(e.clientY > rect.top + rect.height / 2 ? "drop-after" : "drop-before");
    } else if (!target) {
      list.classList.add("drop-into");
    }
  });

  // Dropping: move the link to its new spot and save the new order.
  list.addEventListener("drop", async (e) => {
    if (!draggedId) return;
    e.preventDefault();
    const target = e.target.closest(".link-item");
    const placeAfter = target?.classList.contains("drop-after") ?? false;
    const pinnedGroup = list.dataset.pinned === "true";
    const id = draggedId;
    clearDropMarkers();
    await moveLink(id, target?.dataset.id ?? null, placeAfter, pinnedGroup);
  });

  // Drag is over (dropped or cancelled), so reset everything and redraw.
  list.addEventListener("dragend", () => {
    draggedId = null;
    clearDropMarkers();
    render();
  });
}

// The + button opens and closes the add link form.
els.toggleAdd.addEventListener("click", () => {
  const open = els.addForm.hidden;
  els.addForm.hidden = !open;
  els.toggleAdd.setAttribute("aria-expanded", String(open));
  els.addError.hidden = true;
  if (open) els.addTitle.focus(); else els.search.focus();
});

// The pencil button turns edit mode on and off, which shows the delete buttons and reset option.
els.toggleEdit.addEventListener("click", () => {
  const editing = !document.body.classList.contains("editing");
  document.body.classList.toggle("editing", editing);
  els.toggleEdit.setAttribute("aria-pressed", String(editing));
  els.reset.hidden = !editing;
});

// Adds a new custom link when the form is submitted.
// Checks the name and URL first, and doesn't allow the same URL to be added twice.
els.addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = els.addTitle.value.trim();
  const url = normalizeUrl(els.addUrl.value);
  if (!title) return showAddError("Give the link a name.");
  if (!url) return showAddError("That doesn't look like a valid web address.");
  if (links.some((l) => l.url === url)) return showAddError("That link is already in your list.");

  // Using the current time as the id makes sure every custom link gets a unique one.
  const link = { id: `custom-${Date.now()}`, title, url, tags: "", pinned: els.addPinned.checked };
  links.push(link);
  await save();
  els.addForm.reset();
  els.addForm.hidden = true;
  els.toggleAdd.setAttribute("aria-expanded", "false");
  render();
  els.search.focus();
});

// Shows an error message under the add link form.
function showAddError(msg) {
  els.addError.textContent = msg;
  els.addError.hidden = false;
}

// Puts everything back to the default UH links after the user confirms.
els.reset.addEventListener("click", async () => {
  if (!confirm("Reset to the default UH links? Your custom links, pins, and order will be lost.")) return;
  links = structuredClone(DEFAULT_LINKS);
  await save();
  render();
});

// If the links change somewhere else (another window or another device), update this popup too.
// Skipped during a drag so the list doesn't jump around under the mouse.
if (hasChromeStorage) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes[STORAGE_KEY] && !draggedId) {
      links = changes[STORAGE_KEY].newValue || structuredClone(DEFAULT_LINKS);
      render();
    }
  });
}

// When the popup opens, load the saved links, draw them, and put the cursor in the search bar.
links = await load();
render();
els.search.focus();
