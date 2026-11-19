# Events

The elements talk to the page with events that bubble and are composed, like Web Awesome's, and carry what happened in `detail`. There are two families, and the rule that decides which is which is
simple: **if the meaning is exactly the same as an event of Web Awesome, it is that event; if not, it is a `wax-*` event of its own.**

## Web Awesome's own events

`<wax-floating-card>` and `<wax-ask-each>` open and close like a `wa-dialog`, and they fire the four events of a `wa-dialog`:

| Event | When | Cancellable | `detail` |
|---|---|---|---|
| `wa-show` | It is going to show | yes: `preventDefault()` keeps it closed | none |
| `wa-after-show` | It is shown and in its place | no | none |
| `wa-hide` | It is going to hide | yes: `preventDefault()` keeps it open | `{ source }`: the element that asked |
| `wa-after-hide` | It is hidden | no | none |

They are not copied or renamed: the classes (`WaShowEvent`, `WaAfterShowEvent`, `WaHideEvent`, `WaAfterHideEvent`) are imported from `@awesome.me/webawesome/dist/events/`, so they are the same classes
that Web Awesome's own components dispatch.

**Why.** Code written for Web Awesome keeps working with these elements. Whatever hooks `wa-show` and `wa-hide` of a `wa-dialog` (to close it with the Back button of the browser, to trap focus, to log
how the user moves) serves a floating card or an ask-each with no change, and the elements know nothing of any of it: they do not import a history library, they fire what a dialog fires. The events
of what is inside a card also come up to it, so a listener of `wa-show` checks `event.target`:

```js
card.addEventListener('wa-show', event => {
  if (event.target !== card) return;     // the show of something inside is not the card's
  card.replaceChildren(content(card.anchor));
});
```

`<wax-combobox>` fires `change`, like a `wa-select`, and its `wax-query` is its own. The `wa-select` and `wa-input` it has inside keep their events to themselves.

## The `wax-*` events

What Web Awesome has no event for, the elements fire with a typed class, one per file in `src/events/`, exported by `events.js`. All bubble and are composed.

| Event | Class | `detail` | Fired by |
|---|---|---|---|
| `wax-select` | `WaxSelectEvent` | `{ key }`, `key` is `null` when the selection was cleared | [item list](components/item-list.md), [list manager](components/list-manager.md) |
| `wax-mark` | `WaxMarkEvent` | `{ keys }`, all the marked keys | [item list](components/item-list.md) |
| `wax-move` | `WaxMoveEvent` | `{ keys }`, all the keys in their new order | [item list](components/item-list.md) |
| `wax-swipe` | `WaxSwipeEvent` | `{ key }` | [item list](components/item-list.md) |
| `wax-query` | `WaxQueryEvent` | `{ query }`, what was typed | [combobox](components/combobox.md), [list manager](components/list-manager.md) |
| `wax-new` | `WaxNewEvent` | `{}` | [list manager](components/list-manager.md) |
| `wax-answer` | `WaxAnswerEvent` | `{ index, item, action }` | [ask each](components/ask-each.md) |
| `wax-all` | `WaxAllEvent` | `{ value }` | [ask each](components/ask-each.md) |

The element that fires a `wax-*` event does not fire it when the application did the same thing from code: `list.select(key)` tells nobody, because the application already knows.

The classes are useful in TypeScript and to build the same event in a test:

```js
import { WaxSelectEvent } from '/lib/webawesome-extras/events/events.js';

list.addEventListener('wax-select', (/** @type {WaxSelectEvent} */ event) => open(event.detail.key));
```

## The loader's event

`wax-discovery-complete` is fired by the [loader](installation.md#the-loader) on the element where a discovery finished, once the elements it found are defined. It does not bubble.

## In React

A `wax-*` event is the prop `onWax...` of the wrapper (`wax-select` is `onWaxSelect`), and `wa-show` is `onWaShow`. See [React](react.md).
