# Item list

`<wax-item-list>` is a list to choose from: one line per item, with an icon, a name and a note. One line is selected at a time, any number can be marked, and the lines can be
reordered or slid sideways to uncover an action. It knows nothing about what the items are: the application gives it items and hears what the user chose.

Use it when a screen has to show a short or medium list of things (fruits, cities, people) and the user picks one, or several, to do something with. Put it inside a
[list manager](list-manager.md) when it needs a search box and a "New" button above it. If the user only has to choose a value for a form field, a `wa-select` or a
[combobox](combobox.md) is the better fit.

```html
<wax-item-list empty="Nothing here"></wax-item-list>
```

## Examples

Every example on this page is mounted by the tests of the repository, so they work as shown. The scripts find their elements by `id` and assume the
[loaders](../installation.md) of the page.

### Items

Give the list its items with the `items` property. Each item has a `key` (what the events give back), a `name`, and optionally an `icon` (an emoji or any short text) and a `note`.
A `faded` item is struck through and paler, for something that is there but not available.

```html example
<wax-item-list id="fruit-list" empty="Nothing here"></wax-item-list>

<script type="module">
  const list = document.getElementById('fruit-list');
  list.items = [
    { key: 'apple', icon: '🍎', name: 'Apple', note: 'red or green' },
    { key: 'banana', icon: '🍌', name: 'Banana', note: 'from far away' },
    { key: 'cherry', icon: '🍒', name: 'Cherry', note: 'in summer' },
    { key: 'durian', icon: '🌰', name: 'Durian', note: 'not today', faded: true },
  ];
</script>
```

### Selecting

A click on a line (or Enter, or Space, when it has the focus) selects it and fires `wax-select` with `detail.key`. Clicking the selected line again clears the
selection and `detail.key` is `null`. The list keeps the selection when the items are set again, as long as the key is still there.

```html example
<wax-item-list id="select-list" empty="Nothing here"></wax-item-list>
<p id="select-output">Nothing chosen yet.</p>

<script type="module">
  const list = document.getElementById('select-list');
  const output = document.getElementById('select-output');
  list.items = [
    { key: 'oslo', icon: '🏔️', name: 'Oslo', note: 'Norway' },
    { key: 'lima', icon: '🌊', name: 'Lima', note: 'Peru' },
    { key: 'kyoto', icon: '⛩️', name: 'Kyoto', note: 'Japan' },
  ];
  list.addEventListener('wax-select', event => {
    output.textContent = event.detail.key ? `Chosen: ${event.detail.key}` : 'Selection cleared.';
  });
</script>
```

### Selecting from code

`select(key)` selects a line without firing `wax-select`: the application chose it (a click on a map, say) and needs no news of it. With `{ scroll: true }` the line is brought
into view. The `selected` attribute does the same declaratively.

```html example
<wax-item-list id="code-list" selected="green" style="max-height: 9rem"></wax-item-list>
<wa-button id="code-button" size="s">Select Violet</wa-button>

<script type="module">
  const list = document.getElementById('code-list');
  list.items = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Indigo', 'Violet'].map(name => ({ key: name.toLowerCase(), name }));
  document.getElementById('code-button').addEventListener('click', () => list.select('violet', { scroll: true }));
</script>
```

### Marking

Ctrl, Cmd or Shift + click marks a line without selecting it, any number of them (a dashed outline), and fires `wax-mark` with `detail.keys`, all the marked ones in the order they
were marked. Use it to let the user pick several lines and then do something with them, such as joining them. `marked` is the set of keys and `clearMarks()` empties it.

```html example
<wax-item-list id="mark-list"></wax-item-list>
<p id="mark-output">Ctrl, Cmd or Shift + click to mark lines.</p>

<script type="module">
  const list = document.getElementById('mark-list');
  const output = document.getElementById('mark-output');
  list.items = ['Ada', 'Bruno', 'Carla', 'Dario'].map(name => ({ key: name, icon: '🙂', name }));
  list.addEventListener('wax-mark', event => {
    output.textContent = event.detail.keys.length ? `Marked: ${event.detail.keys.join(', ')}` : 'Nothing marked.';
  });
</script>
```

### Movable

With `movable` every line has a handle. Drag it with the mouse or a finger, or focus it and press the up and down arrow keys. `wax-move` fires with `detail.keys`, all the keys in their
new order; the list does not change `items`, so keep the order in the application.

```html example
<wax-item-list id="move-list" movable></wax-item-list>
<p id="move-output">Drag a handle, or focus it and use the arrow keys.</p>

<script type="module">
  const list = document.getElementById('move-list');
  list.items = [
    { key: 'one', name: 'First' },
    { key: 'two', name: 'Second' },
    { key: 'three', name: 'Third' },
  ];
  list.addEventListener('wax-move', event => {
    document.getElementById('move-output').textContent = `Order: ${event.detail.keys.join(', ')}`;
  });
</script>
```

### Swipe

With `swipe-label` a line can be slid sideways with a finger, which uncovers an action (Remove, Seen) instead of doing it straight away. Pressing the action fires `wax-swipe` with `detail.key`.
Sliding needs a touch screen (or touch emulation in the developer tools of the browser); with a mouse use [custom controls](#custom-controls) instead.

```html example
<wax-item-list id="swipe-list" swipe-label="Remove"></wax-item-list>
<p id="swipe-output">Slide a line to the left on a touch screen.</p>

<script type="module">
  const list = document.getElementById('swipe-list');
  let items = [
    { key: 'mint', name: 'Mint' },
    { key: 'basil', name: 'Basil' },
    { key: 'sage', name: 'Sage' },
  ];
  list.items = items;
  list.addEventListener('wax-swipe', event => {
    items = items.filter(item => item.key !== event.detail.key);
    list.items = items;
    document.getElementById('swipe-output').textContent = `Removed ${event.detail.key}.`;
  });
</script>
```

### Empty state

With no items the list shows the text of `empty`, in its `empty` part. With no `empty` text it shows nothing at all.

```html example
<wax-item-list id="empty-list" empty="No cities yet. Add one to start."></wax-item-list>
```

### Custom controls

A click on a link, button, input or label inside a line belongs to that control and does not select the line. The controls go in the page, not in the shadow of the list, so the page styles and
listens to them: either a child of the list with `slot="<key>"`, or the `html` of the item, which the list puts there for you.

What can go wrong with one tap (removing) should only show when the line is under the mouse or has the focus, and not at all on a touch screen that swipes. The list does not style the controls of
the page, but it sets `--item-risky-visibility` and `--item-risky-width` on its slots, and the control reads them.

```html example
<style>
  .remove-button {
    visibility: var(--item-risky-visibility, visible);
    width: var(--item-risky-width, auto);
  }
</style>
<wax-item-list id="slot-list">
  <button class="remove-button" slot="plum">Remove</button>
  <button class="remove-button" slot="pear">Remove</button>
</wax-item-list>
<p id="slot-output">Hover a line to see its button.</p>

<script type="module">
  const list = document.getElementById('slot-list');
  list.items = [{ key: 'plum', icon: '🟣', name: 'Plum' }, { key: 'pear', icon: '🍐', name: 'Pear' }];
  list.addEventListener('click', event => {
    const button = event.target.closest('.remove-button');
    if (button) document.getElementById('slot-output').textContent = `Remove ${button.slot} was pressed; the line was not selected.`;
  });
</script>
```

When the markup is written by code, put it in the `html` of the item instead and the list does the slotting.

```html example
<wax-item-list id="html-list"></wax-item-list>
<p id="html-output">Tick a box.</p>

<script type="module">
  const list = document.getElementById('html-list');
  list.items = ['Tea', 'Coffee', 'Cocoa'].map(name => ({ key: name, name, html: `<input type="checkbox" aria-label="${name}">` }));
  list.addEventListener('change', event => {
    document.getElementById('html-output').textContent = `${event.target.getAttribute('aria-label')}: ${event.target.checked ? 'ticked' : 'not ticked'}`;
  });
</script>
```

### Styling

The inside is open to styling through [parts](#parts) and its colours come from custom properties that fall back to `--wa-*` tokens (see [theming](../theming.md)).

```html example
<style>
  #styled-list {
    --item-selected: var(--wa-color-success-fill-quiet);
    --item-accent: var(--wa-color-success-fill-loud);
    border: var(--wa-border-width-s) var(--wa-border-style) var(--wa-color-neutral-border-normal);
    border-radius: var(--wa-border-radius-m);
  }
  #styled-list::part(name) { font-variant: small-caps; }
  #styled-list::part(note) { font-style: italic; }
</style>
<wax-item-list id="styled-list" selected="b"></wax-item-list>

<script type="module">
  document.getElementById('styled-list').items = [
    { key: 'a', icon: '🔵', name: 'Blue', note: 'the sky' },
    { key: 'b', icon: '🟢', name: 'Green', note: 'the grass' },
  ];
</script>
```

## The shape of an item

| Field | Type | Description |
|---|---|---|
| `key` | `string` | Identifies the item: what `wax-select`, `wax-mark`, `wax-move` and `wax-swipe` give back, and the name of its slot |
| `name` | `string` | Plain text |
| `icon` | `string` | Optional. Plain text: an emoji |
| `note` | `string` | Optional. Plain text, smaller, after the name |
| `faded` | `boolean` | Optional. Struck through and paler |
| `html` | `string` | Optional. Markup the application wrote, at the end of the line: it goes into the page, not into the shadow of the list, so the page styles it and listens to it |

Names, icons and notes are text: they are never read as markup. Only `html` is, so it must be written by the application, never taken from a user.

## Texts

The list has two texts of its own, in the language of the page (see [Localization](../localization.md)): the handle's label (`waxMove`, `Move (up and down arrows)`) and its title (`waxDrag`, `Drag to sort`). Set `handle-label`
or `handle-title` to say them otherwise. Everything else comes from the application: `empty` and `swipe-label`.

## Importing

With the [loader](../installation.md), which defines the element when it appears in the page:

```html
<script type="module" data-webawesome-extras="/lib/webawesome-extras" src="/lib/webawesome-extras/webawesome-extras.loader.js"></script>
```

Cherry-picked, with no loader: one import defines the element (and only this one):

```js
import '/lib/webawesome-extras/components/item-list/item-list.js';
```

In React, with the wrapper of `dist/react`, whose props are the properties of the element and whose events are `onWax...` props (see [React](../react.md)):

```jsx
import { WaxItemList } from './lib/webawesome-extras/dist/react/wax-item-list.js';

<WaxItemList items={items} empty="Nothing here" onWaxSelect={event => setKey(event.detail.key)} />
```

## Reference

The tables are generated from `custom-elements.json` by `npm run docs`; do not edit them by hand.

<!-- api:start -->

### Properties and attributes

| Property | Description | Attribute | Type | Default |
|---|---|---|---|---|
| `items` | The lines. What was selected or marked stays so if its key is still there |  | `ListItem[]` |  |
| `marked` | The keys marked with Ctrl, Cmd or Shift + click (`clearMarks()` empties it) (read only) |  | `Set<string>` |  |
| `selected` | The key of the selected line; `select(key, { scroll })` sets it without firing `wax-select` | `selected` | `string \| null` | `null` |
| `empty` | What it says with no items | `empty` | `string` | `''` |
| `movable` | Lines have a handle to reorder them | `movable` | `boolean` | `false` |
| `swipeLabel` | The text of the action that a slid line uncovers (attribute `swipe-label`) | `swipe-label` | `string` | `''` |
| `handleLabel` | The name of the handle (attribute `handle-label`) | `handle-label` | `string` | `''` |
| `handleTitle` | The tooltip of the handle (attribute `handle-title`) | `handle-title` | `string` | `''` |

### Methods

| Method | Description | Arguments | Returns |
|---|---|---|---|
| `select(key, options?)` | Selects an item without telling anybody (the map chose it): `scroll` brings it into view. | `key: string \| null`<br>`options?: {scroll?: boolean}` |  |
| `clearMarks()` | Clears the marks, without telling anybody |  |  |

### Events

| Event | Description |
|---|---|
| `wax-select` | A line was clicked (or Enter or Space on it). `detail: { key }`, `key` null when the selection was cleared. Not fired by `select()` |
| `wax-mark` | A line was marked or unmarked with Ctrl, Cmd or Shift + click. `detail: { keys }`, all the marked ones |
| `wax-move` | A line was moved (`movable`). `detail: { keys }`, all of them in their new order |
| `wax-swipe` | The action of a slid line was pressed (`swipe-label`). `detail: { key }` |

### Slots

| Slot | Description |
|---|---|
| `<key>` | Own controls at the end of a line: a child with `slot="<key of the item>"`. (An item's `html` is put there for you.) What can go wrong with one tap (removing) is shown only when the line is under the mouse or has the focus: the control reads `--item-risky-visibility` and `--item-risky-width` |

### Parts

| Part | Description |
|---|---|
| `list` | The `ul` |
| `line` | One line. Also `selected`, `marked`, `faded` and `dragging` while they are so |
| `handle` | What moves a line |
| `icon` | The icon |
| `name` | The name |
| `note` | The note |
| `empty` | The text of an empty list |
| `swipe` | The action a slid line uncovers |

### CSS custom properties

| Property | Description |
|---|---|
| `--item-border` | The line between lines (default `--wa-color-neutral-border-quiet`) |
| `--item-hover` | A line under the pointer (`--wa-color-neutral-fill-quiet`) |
| `--item-selected` | The selected line (`--wa-color-brand-fill-quiet`) |
| `--item-accent` | The mark of the selected and marked lines (`--wa-color-brand-fill-loud`) |
| `--item-muted` | Notes and the empty text (`--wa-color-text-quiet`) |
| `--item-danger` | The swipe action (`--wa-color-danger-fill-loud`) |
| `--item-risky-visibility` | Set by the list on its slots, for a control the page puts in a line to read (`visibility: var(--item-risky-visibility, visible)`): `hidden` until the line is under the mouse or has the focus, and always `hidden` on a touch screen with swiping |
| `--item-risky-width` | Set by the list on its slots to `0` where a control is not shown at all (a touch screen with swiping), for the control to read as its `width` |

<!-- api:end -->
