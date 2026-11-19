# webawesome-extras

Our extensions of [Web Awesome](https://webawesome.com): components that Web Awesome does not have, written the way Web Awesome writes its own, so that they look and work as if they
were native Web Awesome ones. They depend on Web Awesome and Lit and on nothing else, and know nothing of what they are used for (nor of the Back button of the browser).

## The components

| element | what it is | its rules (no DOM, tested in Node) |
|---|---|---|
| `<wax-item-list>` | a list to choose from: a line per item with icon, name and note; select, mark, move, swipe | `item-list.state.js` |
| `<wax-combobox>` | a `wa-select` with a search box that filters its options as you type, and takes part in forms | `combobox.state.js` |
| `<wax-floating-card>` | a card next to what was clicked: peeks with a mouse, pinned by a click, in the middle without one | `floating-card.state.js` |
| `<wax-ask-each>` | a dialog that asks about each thing in turn, with «yes to all» and cancel | `ask-each.state.js` |
| `<wax-list-manager>` | the filters, the search box, the «New» button and a `<wax-item-list>`, for the screens that edit things | `list-manager.state.js` |

```html
<wax-combobox placeholder="Pick one..." empty-text="Nothing matches"></wax-combobox>
<wax-item-list id="sites" empty="Nothing here"></wax-item-list>
<wax-floating-card close-label="Close"></wax-floating-card>
<wax-ask-each label="Overwrite?" question="Overwrite"></wax-ask-each>
<wax-list-manager search-placeholder="Search..." new-label="New"></wax-list-manager>
```

Each one has a short example and its API in the [README of the sources](src/README.md) and, complete, in `custom-elements.json`.

## Layout

It is organised like Web Awesome's own package (`dist/` of `@awesome.me/webawesome`), and the source is already what is served: plain ES modules, no build step.

| path | what it is |
|---|---|
| [`src/components/<name>/`](src/components/) | One folder per element: `<name>.js` (the Lit element), `<name>.styles.js` (its styles, in its shadow), `<name>.state.js` (its rules, with no DOM), `<name>.state.test.js` (Node tests of the rules) and `<name>.test.js` (browser tests of the element) |
| [`src/events/`](src/events/) | One typed event per file, only for what Web Awesome has no event for (`WaxSelectEvent`, `WaxMarkEvent`, `WaxMoveEvent`...), and `events.js`, which exports them all, like Web Awesome's `events/`. What means the same as an event of Web Awesome (`wa-show`, `wa-after-show`, `wa-hide`, `wa-after-hide`) uses its own classes, imported from its `dist/events/` |
| [`src/utilities/`](src/utilities/) | The autoloader (`autoloader.js`, a copy of the one of Web Awesome with the prefix `wax-`: it discovers the `:not(:defined)` tags, honours `data-wax-preload`, imports `components/<name>/<name>.js` from the base path and fires `wax-discovery-complete`) and `base-path.js` |
| `src/webawesome-extras.loader.js` | The autoloader, like `webawesome.loader.js`: load it with a script tag and the `wax-*` elements of the page are defined when they appear; exports `discover`, `startLoader`, `stopLoader`, `getBasePath` and `setBasePath` |
| `src/webawesome-extras.js` | Everything at once, like `webawesome.js`: defines all the elements and exports the events |
| [`custom-elements.json`](custom-elements.json) | The manifest of the elements (attributes, properties, events, slots, parts, CSS custom properties), generated from the code and its JSDoc with `@custom-elements-manifest/analyzer`, like Web Awesome's |
| [`dist/react/`](dist/react/) | One React wrapper per `wax-*` element, generated from the manifest with `@lit/react`: the events `wax-select`... are the props `onWaxSelect`... |
| [`scripts/`](scripts/) | `react.mjs` and `ReactWrappers.js`, the generator of the wrappers, and the test that fails if the manifest or the wrappers are stale |

There is no `dist/` copy of the sources (Web Awesome compiles TypeScript, and this is already JavaScript); `dist/` only holds the React wrappers.

What is **not** here: buttons, boxes and switches are Web Awesome's own (`wa-button`, `wa-input`, `wa-switch`...) and the application builds them; `Dirty`, `Typing`, `ButtonLabel`
(behaviours of forms) and `BackClose` (history) are in [webutils](../webutils), as are `text` (tolerant search) and `vendor` (the tool that makes generated copies). A component knows nothing
of the Back button, as a Web Awesome one does not: it only fires `wa-show` and `wa-hide`, and the application hooks `BackClose.bind` to them (the same code serves a `wa-dialog`) where it wants Back to close something. This repository has no generated copies of anything.

## Requirements

The page must load these two; **neither is copied into this repository**:

- **Web Awesome 3.x** (its theme stylesheets, which define the `--wa-*` tokens, and its components). Web Awesome's own autoloader only looks in the page, not inside the shadow of an element, so
  an element of this repository that uses `wa-select`, `wa-dialog`... inside **imports them itself**, by their name in the package: `import '@awesome.me/webawesome/dist/components/select/select.js'` (and the classes of the events they reuse, `@awesome.me/webawesome/dist/events/hide.js`...). The import map of the
  page says where each one is (`{ "@awesome.me/webawesome/dist/components/select/select.js": "./lib/webawesome/dist/components/select/select.js" }`: the same file the autoloader loads, so nothing is loaded twice).
- **Lit 3.x**, for the components of this repository. They import it as a bare specifier, `import { LitElement, html } from 'lit'`, so the
  page needs an import map that says where it is. Besides `lit`, the components import the directives they use by their usual path (`lit/directives/repeat.js`...);
  with a bundle that has them all, every name points at the same file:
  `{ "imports": { "lit": "./contrib/lit/lit-all.min.js", "lit/directives/repeat.js": "./contrib/lit/lit-all.min.js" } }`.

Nothing else: no other library of ours.

## Using it

Like Web Awesome:

```html
<script type="module" data-webawesome-extras="lib/webawesome-extras" src="lib/webawesome-extras/webawesome-extras.loader.js"></script>   <!-- the elements are defined when they appear -->
```
`data-webawesome-extras` is the folder of the package (the one that has `components/`), as `data-webawesome` is for Web Awesome; without it the folder of the loader is used. An element that is made by code and used at once (a method called before the loader has defined it) needs `await customElements.whenDefined('wax-...')`, or its module imported. Or, without the autoloader, `import './lib/webawesome-extras/webawesome-extras.js'` (all of them) or `import './lib/webawesome-extras/components/combobox/combobox.js'` (one).

## The pattern for a component

Components follow Web Awesome's way:

- a custom element built with **Lit** (`LitElement`), in `components/<name>/<name>.js`, with a tag that starts with **`wax-`**;
- its styles are in `<name>.styles.js`, in its shadow DOM; colours, sizes, radii and fonts come from Web Awesome's design tokens (**`--wa-*`**), so the theme of the page applies to it. A component may add
  its own tokens (`--item-accent`...), always with a `--wa-*` token as the fallback;
- its **events** are Web Awesome's own where the meaning is exactly the same (`wa-show`, `wa-after-show`, `wa-hide`, `wa-after-hide`: the classes are imported from `@awesome.me/webawesome/dist/events/`, not copied), and `wax-*` for the rest (`wax-select`, `wax-mark`...), typed (one class per event in `events/`), that bubble, are composed and carry what happened in `detail`. A thing that opens and closes (`wax-floating-card`, `wax-ask-each`)
  does it like `wa-dialog`: the `open` property, `show()` and `hide()`, and the four events (`wa-show` and `wa-hide` cancellable; the detail of `wa-hide` is its `source`);
- the inside is open to styling through **`part`s** (`::part(line)`) and to content through **`slot`s**;
- what is DOM-free (the rules: what a click selects, how keys are reordered...) is a small plain class in a file of its own, tested in Node; the element only connects it to the page;
- the module **defines the element when it is imported** (`customElements.define(...)`, guarded so importing it twice is harmless), and the autoloader imports the module of each `wax-*` element it finds in the page;
- the JSDoc lists everything (attributes, properties, events, slots, parts and CSS custom properties), so the manifest and the React wrappers are complete.

## Tests and tooling

Like Web Awesome: the **elements** are tested in real browsers with [Web Test Runner](https://modern-web.dev/docs/test-runner/overview/) and `@open-wc/testing`, in Chromium, Firefox and WebKit (Playwright); the **rules** of each
element (the `*.state.js` classes, which need no DOM) with `node --test`. Next to each element there is a `<name>.test.js` that mounts it with `fixture(html...)`, drives clicks and keys, waits for events with `oneEvent`
and checks `expect(el).to.be.accessible()` (axe).

    npm install                       # once: the analyzer, @lit/react, lit, react, Web Awesome, Web Test Runner and @open-wc/testing (dev only; node_modules is not committed)
    PLAYWRIGHT_BROWSERS_PATH=$PWD/node_modules/.playwright npx playwright install chromium firefox webkit    # once: the browsers, inside node_modules too
    npm test                          # the Node tests of the rules and of the generated files (npm run test:node), then the browser tests (npm run test:browser)
    npm run build                     # after changing a component: writes custom-elements.json and dist/react

The Node tests also fail if `custom-elements.json` or `dist/react` is stale. `web-test-runner.config.mjs` runs one test file at a time (the ones that type need the focus of the page).

## How an application brings it in

Every file lives in exactly one repository. An application carries a **generated copy** of `src/` (`lib/webawesome-extras`, only the JavaScript: not the manifest or the React wrappers), never edited by hand, made with
`webutils/js/vendor/Vendor.js` (see the README of [webutils](../webutils)): the copy has a `MANIFEST.json` with the commit it comes from and the hash of each file,
and a test of the application fails if it differs.

## License

GPL-3.0-or-later; the text is in [`LICENSE`](LICENSE).
