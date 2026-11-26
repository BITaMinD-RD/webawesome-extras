# React

`dist/react/` has one wrapper per element, generated from `custom-elements.json` with [`@lit/react`](https://www.npmjs.com/package/@lit/react), the way Web Awesome ships its own: each file exports a React
component made with `createComponent`.

| Element | Wrapper | Import |
|---|---|---|
| `wax-item-list` | `WaxItemList` | `dist/react/wax-item-list.js` |
| `wax-combobox` | `WaxCombobox` | `dist/react/wax-combobox.js` |
| `wax-floating-card` | `WaxFloatingCard` | `dist/react/wax-floating-card.js` |
| `wax-ask-each` | `WaxAskEach` | `dist/react/wax-ask-each.js` |
| `wax-list-manager` | `WaxListManager` | `dist/react/wax-list-manager.js` |
| `wax-map-picker` | `WaxMapPicker` | `dist/react/wax-map-picker.js` |

`dist/react/index.js` exports them all.

Each wrapper has its `.d.ts` beside it, so TypeScript and the editors know its props: those of the element (from `dist/types/`) and an `on*` prop per event whose handler gets the class of its event (`onWaxQuery` a `WaxQueryEvent`, with `detail.query`).

## Using a wrapper

```jsx
import { useState } from 'react';
import { WaxItemList } from './lib/webawesome-extras/dist/react/wax-item-list.js';

const items = [
  { key: 'apple', icon: '🍎', name: 'Apple', note: 'red or green' },
  { key: 'banana', icon: '🍌', name: 'Banana' },
];

export function Fruits() {
  const [key, setKey] = useState(null);
  return <WaxItemList items={items} selected={key} empty="Nothing here" onWaxSelect={event => setKey(event.detail.key)} />;
}
```

- **Properties and attributes** of the element are props. Properties that are not attributes (`items`, `choices`, `describe`, `labels`) are set as properties, so objects and functions work.
- **Events** are `on` plus the name of the event in Pascal case: `wax-select` is `onWaxSelect`, `wax-query` is `onWaxQuery`, and the Web Awesome events the card and ask each fire are `onWaShow`, `onWaAfterShow`, `onWaHide` and
  `onWaAfterHide`. The handler gets the event, with its `detail`.
- **Methods** are called on the element through a `ref`: `ask.current.ask(files)`, `card.current.toggle(anchor)`.
- **Slots** are children with the `slot` attribute: `<button slot="apple">`.

```jsx
import { useRef } from 'react';
import { WaxAskEach } from './lib/webawesome-extras/dist/react/wax-ask-each.js';

export function Overwrite({ files }) {
  const ask = useRef(null);
  return (
    <>
      <button onClick={async () => console.log(await ask.current.ask(files))}>Copy</button>
      <WaxAskEach ref={ask} label="Overwrite?" question="Overwrite" describe={file => `"${file}"?`} />
    </>
  );
}
```

## Requirements

The wrappers need React 18 or later and `@lit/react` 1.x (both optional peer dependencies of the package), and, like the elements, Web Awesome 3.x and Lit 3.x loaded as
described in [installation](installation.md). A wrapper imports its element from `../../src/components/<name>/<name>.js`, so an application that uses them copies `src/` and `dist/react/` side by side;
importing the wrapper defines the element, so with React there is no need for the loader.

## Generated, never edited

The wrappers are made by `npm run react` (part of `npm run build`) from the manifest, and a Node test fails if what is committed differs, so a new event or element of a component appears in its wrapper
without anybody writing it.
