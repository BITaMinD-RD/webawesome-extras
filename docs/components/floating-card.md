# Floating card

`<wax-floating-card>` is a card that floats next to what was clicked. In a long list the thing it talks about may be far away, out of sight, so the detail appears next to it instead of in a
side panel. With a mouse it can also peek: it shows a moment after the pointer arrives, goes when the pointer leaves, and a click pins it. Without a mouse there is no "next to", so it goes in the
middle of the page with the rest dimmed.

Use it for a detail that belongs to one thing among many (the day of a calendar, a row of a table). For something that needs a decision from the user, use a `wa-dialog` or an
[ask each](ask-each.md).

It opens and closes like a `wa-dialog`: the `open` property, `show()` and `hide()`, and the events of Web Awesome (`wa-show`, `wa-after-show`, `wa-hide` and `wa-after-hide`), of which
`wa-show` and `wa-hide` can be cancelled. See [events](../events.md) for why they are Web Awesome's own.

```html
<wax-floating-card close-label="Close"></wax-floating-card>
```

The card is placed with the coordinates of the page, so it has to be a child of the `body` or of an element that is not positioned. It knows nothing of what it shows: the content is its children,
which whoever opens it puts in the listener of `wa-show`.

## Examples

Every example on this page is mounted by the tests of the repository, so they work as shown. The scripts find their elements by `id` and assume the
[loaders](../installation.md) of the page.

### Pinned next to what was clicked

`toggle(anchor)` shows the card pinned next to the anchor; the same anchor again closes it, and a different one moves it. The content goes in when the card is going to show, in
the listener of `wa-show`, where `card.anchor` is already known. Escape, a click outside and the × close it.

```html example
<div style="display: flex; gap: 0.5rem; flex-wrap: wrap">
  <wa-button id="pin-apple">Apple</wa-button>
  <wa-button id="pin-banana">Banana</wa-button>
  <wa-button id="pin-cherry">Cherry</wa-button>
</div>
<wax-floating-card id="pin-card" close-label="Close" label="Fruit detail"></wax-floating-card>

<script type="module">
  const facts = { 'pin-apple': 'Crunchy, and red or green.', 'pin-banana': 'Yellow, and it grows in bunches.', 'pin-cherry': 'Small, with a stone inside.' };
  const card = document.getElementById('pin-card');
  card.addEventListener('wa-show', event => {
    if (event.target !== card) return;   // the events of what is inside come up here too
    const paragraph = document.createElement('p');
    paragraph.textContent = facts[card.anchor.id];
    card.replaceChildren(paragraph);
  });
  for (const id of Object.keys(facts)) document.getElementById(id).addEventListener('click', event => card.toggle(event.currentTarget));
</script>
```

### Peeking with the mouse

`peek(anchor)` shows the card a moment later (`delay`, 400 milliseconds by default), only if there is a mouse, and `leave()` takes it away. A card that only peeks cannot be used until a click
pins it. Call them from `mouseenter` and `mouseleave`, and `toggle` from `click`.

```html example
<ul id="peek-list" style="display: flex; gap: 1rem; list-style: none; padding: 0">
  <li><wa-button id="peek-red" appearance="outlined">Red</wa-button></li>
  <li><wa-button id="peek-green" appearance="outlined">Green</wa-button></li>
</ul>
<wax-floating-card id="peek-card" delay="150" close-label="Close"></wax-floating-card>

<script type="module">
  const card = document.getElementById('peek-card');
  card.addEventListener('wa-show', event => {
    if (event.target === card) card.replaceChildren(`${card.anchor.textContent}: ${card.peeking ? 'peeking' : 'pinned'}`);
  });
  for (const button of document.querySelectorAll('#peek-list wa-button')) {
    button.addEventListener('mouseenter', () => card.peek(button));
    button.addEventListener('mouseleave', () => card.leave());
    button.addEventListener('click', () => card.toggle(button));
  }
</script>
```

### Nothing to say

`wa-show` can be cancelled. If there is nothing to show for that anchor, call `preventDefault()` and the card stays closed.

```html example
<div style="display: flex; gap: 0.5rem">
  <wa-button id="cancel-yes">Has a note</wa-button>
  <wa-button id="cancel-no">Has none</wa-button>
</div>
<wax-floating-card id="cancel-card" close-label="Close"></wax-floating-card>
<p id="cancel-output">Click both.</p>

<script type="module">
  const notes = { 'cancel-yes': 'A note, here.' };
  const card = document.getElementById('cancel-card');
  card.addEventListener('wa-show', event => {
    if (event.target !== card) return;
    const note = notes[card.anchor.id];
    if (!note) {
      event.preventDefault();
      document.getElementById('cancel-output').textContent = 'No note: the card stayed closed.';
      return;
    }
    card.replaceChildren(note);
    document.getElementById('cancel-output').textContent = 'Showing a note.';
  });
  for (const id of ['cancel-yes', 'cancel-no']) document.getElementById(id).addEventListener('click', event => card.toggle(event.currentTarget));
</script>
```

### Events

The four events are Web Awesome's own. The `detail` of `wa-hide` has its `source`: the element that asked (the close button, the backdrop, whatever was clicked outside), or the card itself (Escape,
`hide()`, the pointer leaving, another anchor). A listener of `wa-hide` that calls `preventDefault()` keeps the card open.

```html example
<wa-button id="events-button">Open the card</wa-button>
<wax-floating-card id="events-card" close-label="Close">The card</wax-floating-card>
<pre id="events-output">No events yet.</pre>

<script type="module">
  const card = document.getElementById('events-card');
  const output = document.getElementById('events-output');
  const log = [];
  for (const name of ['wa-show', 'wa-after-show', 'wa-hide', 'wa-after-hide']) {
    card.addEventListener(name, event => {
      if (event.target !== card) return;
      log.push(name === 'wa-hide' ? `${name} (source: ${event.detail.source === card ? 'the card' : event.detail.source.localName})` : name);
      output.textContent = log.join('\n');
    });
  }
  document.getElementById('events-button').addEventListener('click', event => card.toggle(event.currentTarget));
</script>
```

### Opening from code

`show(anchor, { pinned })` and `hide()` return whether the card ended as asked (`false` if a listener cancelled), and `open` is the same as in a `wa-dialog`. When what is inside grows later (something
that came from the network), call `place()` to put the card back next to its anchor.

```html example
<wa-button id="code-anchor">The anchor</wa-button>
<wa-button id="code-show" appearance="outlined">Show</wa-button>
<wa-button id="code-grow" appearance="outlined">Grow</wa-button>
<wax-floating-card id="code-card" close-label="Close">Short.</wax-floating-card>

<script type="module">
  const card = document.getElementById('code-card');
  document.getElementById('code-show').addEventListener('click', () => card.show(document.getElementById('code-anchor')));
  document.getElementById('code-grow').addEventListener('click', () => {
    card.append(document.createElement('br'), 'More text arrived, so the card is taller now.');
    card.place();
  });
</script>
```

### Styling

The card is a [part](#parts) and its shadows and width are custom properties that fall back to `--wa-*` tokens.

```html example
<style>
  #styled-card {
    --floating-card-width: 16rem;
    --floating-card-shadow: 0 0 0 3px var(--wa-color-brand-fill-loud);
  }
  #styled-card::part(card) { border-radius: var(--wa-border-radius-l); }
</style>
<wa-button id="styled-anchor">Show the styled card</wa-button>
<wax-floating-card id="styled-card" close-label="Close">A narrow card with a ring.</wax-floating-card>

<script type="module">
  document.getElementById('styled-anchor').addEventListener('click', event => document.getElementById('styled-card').toggle(event.currentTarget));
</script>
```

## Texts

The card has one text of its own, the name of its close button, which is `Close` until you set `close-label`. Give the card a `label` so that people who do not see it know what it is.

## Importing

With the [loader](../installation.md), which defines the element when it appears in the page:

```html
<script type="module" data-webawesome-extras="/lib/webawesome-extras" src="/lib/webawesome-extras/webawesome-extras.loader.js"></script>
```

Cherry-picked, with no loader: one import defines the element (and only this one):

```js
import '/lib/webawesome-extras/components/floating-card/floating-card.js';
```

In React, with the wrapper of `dist/react` (see [React](../react.md)); its `wa-show` and `wa-hide` events are the props `onWaShow` and `onWaHide`:

```jsx
import { WaxFloatingCard } from './lib/webawesome-extras/dist/react/wax-floating-card.js';

<WaxFloatingCard ref={card} closeLabel="Close" onWaShow={event => { if (event.target === card.current) fill(card.current); }} />
```

## Reference

The tables are generated from `custom-elements.json` by `npm run docs`; do not edit them by hand.

<!-- api:start -->

### Properties and attributes

| Property | Description | Attribute | Type | Default |
|---|---|---|---|---|
| `anchor` | What it is next to; `show()` and `peek()` set it |  | `Element \| null` |  |
| `open` | It is shown | `open` | `boolean` | `false` |
| `peeking` | It only peeks | `peeking` | `boolean` | `false` |
| `centered` | It is in the middle with the rest dimmed | `centered` | `boolean` | `false` |
| `closeLabel` | What the close button is called (attribute `close-label`) | `close-label` | `string` | `'Close'` |
| `label` | What the card is called for who does not see it | `label` | `string` | `''` |
| `delay` | Milliseconds the pointer has to stay before it peeks (400 by default) | `delay` | `number` |  |

### Methods

| Method | Description | Arguments | Returns |
|---|---|---|---|
| `peek(anchor)` | With a mouse, it peeks (shows without being pinned) a moment later; without one, nothing. | `anchor: Element` What it talks about |  |
| `leave()` | The pointer left: a card that only peeks goes, a moment later |  |  |
| `toggle(anchor)` | Shows it pinned next to `anchor`, or hides it if it was pinned next to the same thing. | `anchor: Element` |  |
| `show(anchor?, options?)` | Shows it next to `anchor`. Pinned, it stays until it is closed. If it was open, it closes first (and either listener can cancel what it is asked). | `anchor?: Element \| null` What it talks about; by default, the one it has<br>`options?: {pinned?: boolean}` | `boolean` |
| `hide()` | Hides it. |  | `boolean` |
| `place()` | Puts it back next to its thing after what is inside has grown (something that came later from the network). In the middle, the CSS places it. |  |  |

### Events

| Event | Description | Class |
|---|---|---|
| `wa-show` | It is going to show. Cancellable: `preventDefault()` keeps it closed. The content goes in here; `anchor` and `centered` are already set | `WaShowEvent` |
| `wa-after-show` | It is shown and in its place | `WaAfterShowEvent` |
| `wa-hide` | It is going to hide. Cancellable: `preventDefault()` keeps it open. `detail: { source }`: the element that asked (the close button, the backdrop, what was clicked outside) or the card itself (Escape, `hide()`, the pointer leaving, another anchor) | `WaHideEvent` |
| `wa-after-hide` | It is hidden (it has no animation: it comes right after `wa-hide`) | `WaAfterHideEvent` |

### Slots

| Slot | Description |
|---|---|
| (default) | What it says. Whoever opens it puts it here, in the listener of `wa-show` |

### Parts

| Part | Description |
|---|---|
| `card` | The card: its border, its background, its shadow and its size |
| `close-button` | The × button, in the corner (hidden while it only peeks) |
| `backdrop` | The dimmed page behind it, without a mouse |

### CSS custom properties

| Property | Description |
|---|---|
| `--floating-card-shadow` | The shadow of a pinned card (`--wa-shadow-l`) |
| `--floating-card-peek-shadow` | The shadow of one that only peeks (`--wa-shadow-m`) |
| `--floating-card-centered-shadow` | The shadow of one in the middle (`--wa-shadow-l`) |
| `--floating-card-backdrop` | The dimmed page behind a card in the middle (`rgba(0, 0, 0, .45)`) |
| `--floating-card-width` | The width of the card (`400px`) |

<!-- api:end -->
