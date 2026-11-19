# webawesome-extras

The generic controls of the screens, as one stylesheet, `controls.css`: `.input`, `.pill`, `.check`, `.switch`, `.select`, the checkbox
group and the slider group. They know nothing of what they are used for.

```html
<link rel="stylesheet" href="lib/webawesome-extras/controls.css">
```

The look comes from **Web Awesome's design tokens**, so the theme of the page applies with nothing else to define: `--wa-color-surface-default`, `--wa-color-surface-lowered`,
`--wa-color-surface-border`, `--wa-color-text-normal`, `--wa-color-text-quiet`, `--wa-color-brand-fill-loud` (the accent), `--wa-border-radius-m`, `--wa-font-size-xs|s|m`,
`--wa-space-m`, `--wa-form-control-height`, `--wa-shadow-*`... The only variable of its own is `--color`, the colour of one control (a pill, a check). A page that has its own palette
sets the `--wa-*` tokens (`:root { --wa-color-brand-fill-loud: var(--accent) }`), it does not set ours.

A switch is `<span class="switch"><input type="checkbox"><span class="switch-track"></span></span>`.

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
  to them: a child of the list with `slot="<key>"` (`<button slot="a1">`), or the `html` of the item, which the list puts there for you. A control with class `item-risky` (removing) shows only
  when the line is under the mouse or has the focus.
- **Style**: `::part(line)` (also `selected`, `marked`, `faded`, `dragging`), `::part(icon)`, `::part(name)`, `::part(note)`, `::part(empty)`, `::part(handle)`, `::part(swipe)`; tokens `--item-border`,
  `--item-hover`, `--item-selected`, `--item-accent`, `--item-muted` and `--item-danger`, each one falling back to a `--wa-*` token. `ListManager` puts the filters, the search box and «New» above one
  (`manager.list` is the element).

**Buttons** are `wa-button` of Web Awesome (`lib/webawesome`, loaded by the page). `Button.js` makes them from code: `Button.make(document, { text, type, title, label, primary, pill, disabled })`,
`Button.setPrimary(button, on)` to move the filled one (`variant="brand"`; the others are `appearance="outlined"`), and `Button.forwardLabels(root)`, which gives the `aria-label` of a `wa-button`
to the real button inside it (the one a screen reader reads). A `wa-button` with `hidden` needs `wa-button[hidden] { display: none }` (see `style/webawesome.css`).

**Boxes** are `wa-input` and `wa-textarea` of Web Awesome. `Input.make(document, { type, value, placeholder, label, inputmode, rows, className, clearable, step })` makes them from code (`type: 'textarea'` for several
lines; `type: 'time'` is a `wa-time-input`, hours and minutes apart with a list to pick from, always 24-hour, `HH:mm` as its value, and `step` in seconds between the times of its list). Differences with a box of the browser that the code has to know: an empty one gives `null` (not `''`) unless it was born with a value, which `Input.make` always gives, and in the HTML a
`wa-input` needs `value=""`; what is written to `value` is not turned into text (a `41.39` stays a number); and until the component is loaded `value` does not exist, so the page waits for
`wa-input`, `wa-textarea` and `wa-button` (`customElements.whenDefined`) before starting. `list="..."` (a `datalist`) does not work: the datalist is outside the shadow of the box.

**ComboBox** is a `wa-select` with a search box as the first child of its list: the focus goes to the box when it opens, typing hides the options that do not match, the arrows pass from
the box to the options that are seen and Enter in the box chooses the first one. Same API as before (`value`, `disabled`, `setChoices`, `change`, `name`, `required`, `placeholder`,
`emptyLabel`, `emptyText`, and `searchPlaceholder` for the box); `element` is the `wa-select`, so the page that uses it needs Web Awesome (it imports `Input.js` itself) (see `micro/mapa-tiempo`). It
chooses among what it is given: what is typed is for searching, it is not kept.

**Switches and checkboxes** are `wa-switch` (a setting) and `wa-checkbox` (marking something in a list). `Toggle.make(document, { text, checked, checkbox, title, name, className })` makes them from
code. Read and write them with `checked` (a `wa-switch` has no `type`, so a reader that decides by `type === 'checkbox'` gets it wrong), they tell with `change`, and the text is what they
hold. In `Ajustes` the text is on the left and the switch on the right: `wa-switch::part(base)` turned with `flex-direction: row-reverse`. The chips of a list (`.pill.check`, the teams of the
header) are still ours: Web Awesome has no toggle chip.

**A floating card** is `FloatingCard.js` (it imports `BackClose.js`): a card next to what was clicked, for what is far from it in a long list.
With a mouse it peeks (`peek(content, near)` shows it a moment later, `leave()` takes it away) and a click pins it (`show(content, near)`);
clicking the same thing again, Escape, a click outside or its × close it. Without a mouse it goes in the middle with the page dimmed, and
the phone's Back closes it. `replace(content)` changes what it says without moving it, `place()` puts it back next to its thing after what is
inside has grown, and `onShow(card)` is called each time it has new content. Style: `.floating-card` in `controls.css`, with
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
