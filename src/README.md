# webawesome-extras (what an application takes)

Components that look and work as if they were native Web Awesome ones. They know nothing of what they are used for. The page loads Web Awesome's theme and has an import map for Lit and for the Web Awesome components the elements use inside (see the README of the
repository) and loads the autoloader (`webawesome-extras.loader.js`) or imports the module of each component it uses.

There is no stylesheet to link: every component carries its styles in its shadow DOM. The look comes from **Web Awesome's design tokens** (`--wa-color-surface-default`, `--wa-border-radius-m`, `--wa-font-size-s`,
`--wa-space-m`, `--wa-form-control-height`, `--wa-shadow-*`...), so the theme of the page applies with nothing else to define. A page that has its own palette sets the `--wa-*` tokens.

Buttons, boxes, switches and checkboxes are Web Awesome's own (`wa-button`, `wa-input`, `wa-textarea`, `wa-time-input`, `wa-switch`, `wa-checkbox`, `wa-toast`): there is nothing here to make
them. The behaviours that went with them (`Dirty`, `Typing.isTyping`, `ButtonLabel`, `BackClose`) are in [webutils](../../../webutils).

**The list to choose from** is `<wax-item-list>` (`components/item-list/item-list.js`, a Lit element): a line per item with icon, name and a note, for entries, places or anything. It knows nothing about
what the items are (teams, pitches, favourites): the application gives it items `{ key, name, icon, note, faded, html }` and hears what is chosen. The page imports the module, which defines
the element, and needs Lit 3 (see the README of the repository); `item-list.state.js` holds its rules without a DOM.

```html
<wax-item-list id="sites" empty="Nothing here"></wax-item-list>
```
```js
import './lib/webawesome-extras/components/item-list/item-list.js';   // or load the autoloader, `webawesome-extras.loader.js`
const list = document.getElementById('sites');
list.items = sites.map(s => ({ key: s.id, icon: '🍺', name: s.name, note: `${s.meters} m`, faded: s.hidden }));
list.addEventListener('wax-select', event => open(event.detail.key));
list.addEventListener('wax-mark', event => { /* join event.detail.keys */ });
```

- **Properties**: `items` (set it again to redraw: what was selected or marked stays so if its key is still there), `selected` (a key, also an attribute), `empty` (the text with no items, also an
  attribute), `movable` and `swipe-label` (below). `marked` is the set of marked keys.
- **Select**: click a line; click it again to clear (`wax-select` with `detail.key` null). `list.select(key, { scroll })` does it from outside (the map was clicked) and tells nobody.
- **Mark**: Ctrl, Cmd or Shift + click, any number of lines; `wax-mark` with `detail.keys`, the ones marked now; `list.marked`; `list.clearMarks()`.
- **Move** (`movable`): a handle on each line, dragged or moved with the arrow keys; `wax-move` with `detail.keys` in the new order.
- **Swipe** (`swipe-label="Remove"`): sliding a line sideways with the finger uncovers that action; pressing it fires `wax-swipe` with `detail.key`.
- **Own controls**: a click on a link, button, input or label inside a line is theirs and does not select. They go in the page, not in the shadow of the list, so the page styles them and listens
  to them: a child of the list with `slot="<key>"` (`<button slot="a1">`), or the `html` of the item, which the list puts there for you. What can go wrong with one tap (removing) shows only when the line is under the mouse or has the focus, and not at all on a touch screen with swiping: the list does not style
  the page's controls (it cannot reach them from its shadow), it sets `--item-risky-visibility` and `--item-risky-width` on its slots, which the controls inherit, and the page's control reads them:
  `.remove { visibility: var(--item-risky-visibility, visible); width: var(--item-risky-width, auto); }`.
- **Style**: `::part(line)` (also `selected`, `marked`, `faded`, `dragging`), `::part(icon)`, `::part(name)`, `::part(note)`, `::part(empty)`, `::part(handle)`, `::part(swipe)`; tokens `--item-border`,
  `--item-hover`, `--item-selected`, `--item-accent`, `--item-muted` and `--item-danger`, each one falling back to a `--wa-*` token. `<wax-list-manager>` puts the filters, the search box and «New» above one.

**Good to know about Web Awesome's controls** (the ones the components here use): an empty `wa-input` gives `null` (not `''`) unless it was born with a value, and in the HTML it needs
`value=""`; what is written to `value` is not turned into text (a `41.39` stays a number); until the component is loaded `value` does not exist, so a page waits for `wa-input`,
`wa-textarea` and `wa-button` (`customElements.whenDefined`) before starting; `list="..."` (a `datalist`) does not work, because the datalist is outside the shadow of the box;
a `wa-button` with `hidden` needs `wa-button[hidden] { display: none }`; and `aria-label` on a `wa-button` does not reach the real button inside it (`ButtonLabel` in webutils does).

**The combobox** is `<wax-combobox>` (`components/combobox/combobox.js`, with `combobox.state.js` for its rules): a `wa-select` with a search box as the first child of its list. The focus goes to the box when it opens,
typing hides the options that do not match, the arrows pass from the box to the options that are seen and Enter in the box chooses the first one. It takes part in a form (`name`, `required`) and fires
`change` like a `wa-select`. It chooses among what it is given: what is typed is for searching, it is not kept. If the choices have to be fetched as the user types, `wax-query` says what was typed.

```html
<wax-combobox placeholder="Pick one..." empty-text="Nothing matches"></wax-combobox>
```
```js
import './lib/webawesome-extras/components/combobox/combobox.js';
combo.choices = [{ value: 'es', label: 'España' }, { value: 'fr', label: 'Francia' }];   // before the value: a value that is not among the choices is dropped
combo.value = 'es';
combo.addEventListener('change', () => use(combo.value));
```

- **Properties**: `choices`, `value`, `placeholder`, `searchPlaceholder` (`search-placeholder`), `emptyLabel` (`empty-label`: a first option «choose nothing»), `emptyText` (`empty-text`), `name`, `required`, `disabled`, `queryDelay`.
- **Style**: `::part(select)`, `::part(search)`, `::part(option)` (also `empty` and `none`); the space below it is `--combobox-gap` (`--wa-space-m`).

**The floating card** is `<wax-floating-card>` (`components/floating-card/floating-card.js`, with `floating-card.state.js` for its rules): a card next to what was clicked, for what is far from it in a long list. With a mouse it
peeks (`peek(anchor)` shows it a moment later, `leave()` takes it away) and a click pins it (`toggle(anchor)`: the same thing again closes it); Escape, a click outside and its × close it. Without a mouse it goes in the
middle with the page dimmed. It opens and closes like a `wa-dialog` (`open`, `show()`, `hide()`, and the events `wax-show`, `wax-after-show`, `wax-hide`, `wax-after-hide`, the first and the third cancellable;
`wax-hide` says in `detail` what asked, `source` and `reason`) and knows nothing of the Back button: whoever wants Back to close it listens to those events (`BackClose.bind` in webutils).

```html
<wax-floating-card close-label="Cerrar"></wax-floating-card>   <!-- a child of the body: it is placed with the coordinates of the page -->
```
```js
import './lib/webawesome-extras/components/floating-card/floating-card.js';
card.addEventListener('wax-show', event => card.replaceChildren(dayView(event.detail.anchor)));   // the content goes in when it is going to show; preventDefault() if there is none
day.addEventListener('click', () => card.toggle(day));
```

The content is its children, put by whoever opens it in the listener of `wax-show` (so what is slow to draw is only drawn when it shows). `card.place()` puts it back next to its thing after what is inside has grown.
**Style**: `::part(card)`, `::part(close-button)`, `::part(backdrop)`; `--floating-card-shadow`, `--floating-card-peek-shadow`, `--floating-card-centered-shadow`, `--floating-card-backdrop` and `--floating-card-width`.

**The question about each thing** is `<wax-ask-each>` (`components/ask-each/ask-each.js`, with `ask-each.state.js` for its rules): a dialog that asks about several things one by one («overwrite this file?»), with the progress, «yes to all», «no to all» and cancel.
`ask(items)` gives a promise of the answers (`true` for the positive verb) or null if it was cancelled; `describe` says how each thing is named; `wax-all` tells whoever goes on answering the same later. It is a `wa-dialog` inside:
`open`, `show()`, `hide()`, `light-dismiss`, Escape and the four `wax-*` events (`wax-hide` is cancellable while it is being dismissed), and it knows nothing of the Back button.

```js
import './lib/webawesome-extras/components/ask-each/ask-each.js';
askEach.label = 'Overwrite?';  askEach.question = 'Overwrite';  askEach.describe = file => `«${file.name}»`;
const answers = await askEach.ask(files);   // [true, false, ...] or null
```
**Style**: `::part(progress)`, `::part(question)`, `::part(button)` (also `yes`, `no`, `yes-all`, `no-all`, `cancel`), `::part(dialog)`; `--ask-each-width`.

**The list with its search box** is `<wax-list-manager>` (`components/list-manager/list-manager.js`, with `list-manager.state.js` for its rules): the block that repeats in the screens that edit things. It has a slot for the filters
(`slot="filters"`), the search box, the «New» button and a `<wax-item-list>` below, where one entry is chosen and clicking it again does not clear it. It knows nothing of what the entries are: the application gives
`items` when the query changes (`wax-query`).

```html
<wax-list-manager search-placeholder="Search..." new-label="New" empty="Nothing here"><div slot="filters">...</div></wax-list-manager>
```
```js
import './lib/webawesome-extras/components/list-manager/list-manager.js';
manager.items = entries.map(e => ({ key: e.id, name: e.name, icon: '🏆' }));
manager.addEventListener('wax-select', event => open(event.detail.key));   // `wax-new`, `wax-query` ({ query }); manager.query; manager.select(key)
```
**Style**: `::part(search)`, `::part(actions)`, `::part(new-button)`, `::part(items)` and the parts of the list (`line`, `selected`, `marked`, `faded`, `icon`, `name`, `note`, `empty`).
