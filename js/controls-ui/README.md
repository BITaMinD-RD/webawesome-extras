# controls-ui

The generic controls of the screens, as one stylesheet, `controls.css`: `.input`, `.pill`, `.check`, `.switch`, `.select`, the checkbox
group and the slider group. They know nothing of what they are used for.

```html
<link rel="stylesheet" href="lib/controls-ui/controls.css">
```

The look comes from variables that the page defines: `--font`, `--surface`, `--bg`, `--text`, `--border`, `--accent`, `--muted`, `--radius`,
`--thumb`, `--track` and `--color` (the colour of one control).

A switch is `<span class="switch"><input type="checkbox"><span class="switch-track"></span></span>`.

**The list to choose from** is `ItemList.js`: a line per item with icon, name and a note, for entries, places or anything. It knows nothing about what the items
are (teams, pitches, favourites): the application gives it items `{ key, name, icon, note, faded, html }` and hears what is chosen.

```html
<link rel="stylesheet" href="lib/controls-ui/controls.css">
<ul id="sites"></ul>
```
```js
import { ItemList } from './lib/controls-ui/ItemList.js';
const list = new ItemList({ element, empty: 'Nothing here', onSelect: key => open(key), onMark: keys => { /* join them */ } });
list.setItems(sites.map(s => ({ key: s.id, icon: '🍺', name: s.name, note: `${s.meters} m`, faded: s.hidden })));
```

- **Select**: click a line; click it again to clear (`onSelect(null)`). `select(key, { scroll })` does it from outside (the map was clicked).
- **Mark**: Ctrl, Cmd or Shift + click, any number of lines; `onMark(keys)` and `list.marked`; `clearMarks()`.
- **Own controls**: a click on a link, button, input or label inside a line is theirs and does not select. `html` is where the application
  puts them; it listens to them itself (one delegated listener on the element, with `data-key` on the line).
- Lines are focusable and Enter/Space select them. `ItemList.html(items, options)` gives the markup alone.
- Style: `.item-list` in `controls.css`, tokens `--item-border`, `--item-hover`, `--item-selected`, `--item-accent`, `--item-muted`. `ListManager` puts the
  filters, the search box and «New» above one.

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
