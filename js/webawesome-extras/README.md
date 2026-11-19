# webawesome-extras (the components)

Components that look and work as if they were native Web Awesome ones. They know nothing of what they are used for. The page loads Web Awesome and Lit (see the README of the
repository) and imports the module of each component it uses.

There is no stylesheet to link: what a component needs in the page (a `wa-select` or a card it builds in the light DOM, the rule for the controls a line holds) it puts there itself,
once, when it is first made (`DocumentStyles.js`). The look comes from **Web Awesome's design tokens** (`--wa-color-surface-default`, `--wa-border-radius-m`, `--wa-font-size-s`,
`--wa-space-m`, `--wa-form-control-height`, `--wa-shadow-*`...), so the theme of the page applies with nothing else to define. A page that has its own palette sets the `--wa-*` tokens.

Buttons, boxes, switches and checkboxes are Web Awesome's own (`wa-button`, `wa-input`, `wa-textarea`, `wa-time-input`, `wa-switch`, `wa-checkbox`, `wa-toast`): there is nothing here to make
them. The behaviours that went with them (`Dirty`, `Typing.isTyping`, `ButtonLabel`, `BackClose`) are in [webutils](../../../webutils).

**The list to choose from** is `<wax-item-list>` (`WaxItemList.js`, a Lit element): a line per item with icon, name and a note, for entries, places or anything. It knows nothing about
what the items are (teams, pitches, favourites): the application gives it items `{ key, name, icon, note, faded, html }` and hears what is chosen. The page imports the module, which defines
the element, and needs Lit 3 (see the README of the repository); `ItemListState.js` holds its rules without a DOM.

```html
<wax-item-list id="sites" empty="Nothing here"></wax-item-list>
```
```js
import './lib/webawesome-extras/WaxItemList.js';
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
  `--item-hover`, `--item-selected`, `--item-accent`, `--item-muted` and `--item-danger`, each one falling back to a `--wa-*` token. `ListManager` puts the filters, the search box and «New» above one
  (`manager.list` is the element); it is a control of its own, not app logic, and will become `<wax-list-manager>`.

**Good to know about Web Awesome's controls** (the ones the components here use): an empty `wa-input` gives `null` (not `''`) unless it was born with a value, and in the HTML it needs
`value=""`; what is written to `value` is not turned into text (a `41.39` stays a number); until the component is loaded `value` does not exist, so a page waits for `wa-input`,
`wa-textarea` and `wa-button` (`customElements.whenDefined`) before starting; `list="..."` (a `datalist`) does not work, because the datalist is outside the shadow of the box;
a `wa-button` with `hidden` needs `wa-button[hidden] { display: none }`; and `aria-label` on a `wa-button` does not reach the real button inside it (`ButtonLabel` in webutils does).

**ComboBox** is a `wa-select` with a search box as the first child of its list: the focus goes to the box when it opens, typing hides the options that do not match, the arrows pass from
the box to the options that are seen and Enter in the box chooses the first one. Same API as before (`value`, `disabled`, `setChoices`, `change`, `name`, `required`, `placeholder`,
`emptyLabel`, `emptyText`, and `searchPlaceholder` for the box); `element` is the `wa-select`, so the page that uses it needs Web Awesome (see `micro/mapa-tiempo`). It
chooses among what it is given: what is typed is for searching, it is not kept.

**A floating card** is `FloatingCard.js` (it imports `BackClose` from `../history/`, a module of webutils): a card next to what was clicked, for what is far from it in a long list.
With a mouse it peeks (`peek(content, near)` shows it a moment later, `leave()` takes it away) and a click pins it (`show(content, near)`);
clicking the same thing again, Escape, a click outside or its × close it. Without a mouse it goes in the middle with the page dimmed, and
the phone's Back closes it. `replace(content)` changes what it says without moving it, `place()` puts it back next to its thing after what is
inside has grown, and `onShow(card)` is called each time it has new content. Style: `.floating-card`, in `FloatingCard.STYLES`, with
`--floating-card-shadow`, `--floating-card-peek-shadow`, `--floating-card-centered-shadow` and `--floating-card-backdrop`.

```js
const card = new FloatingCard({ closeLabel: 'Cerrar', onShow: el => fillWeather(el) });
day.addEventListener('click', () => card.show(() => dayHtml(date), day));
```

The content is HTML, a node, or a function that is called when it is shown with a container (`.floating-card-body`, which takes no room) to paint
into, so whoever draws with a library does it there and this knows nothing of it; a function may also give back a string or a node. If it
comes to nothing (an empty string, nothing painted), nothing is shown.

```js
card.show(body => render(template(date), body), day);   // `render` is the library's
```
