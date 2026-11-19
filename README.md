# webawesome-extras

Our extensions of [Web Awesome](https://webawesome.com): form controls, small widgets and components that Web Awesome does not have,
written the way Web Awesome writes its own, as ES modules without a build step.

## Requirements

The page must load these two; **neither is copied into this repository**:

- **Web Awesome 3.x** (its theme stylesheets, which define the `--wa-*` tokens, and its components). Web Awesome's own autoloader only looks in the page, not inside the shadow of an element, so
  an element of this repository that uses `wa-select`, `wa-dialog`... inside **imports them itself**, by their name in the package: `import '@awesome.me/webawesome/dist/components/select/select.js'`. The import map of the
  page says where each one is (`{ "@awesome.me/webawesome/dist/components/select/select.js": "./lib/webawesome/dist/components/select/select.js" }`: the same file the autoloader loads, so nothing is loaded twice).
- **Lit 3.x**, for the components of this repository. They import it as a bare specifier, `import { LitElement, html, css } from 'lit'`, so the
  page needs an import map that says where it is. Besides `lit`, the components import the directives they use by their usual path (`lit/directives/repeat.js`...);
  with a bundle that has them all, every name points at the same file:
  `{ "imports": { "lit": "./contrib/lit/lit-all.min.js", "lit/directives/repeat.js": "./contrib/lit/lit-all.min.js" } }`.

## What lives where

| path | what it is |
|---|---|
| [`js/webawesome-extras/`](js/webawesome-extras/) | The components, one file each, and their tests: `<wax-item-list>` (`WaxItemList.js`, with `ItemListState.js` for its rules) and, still plain classes that will become `wax-*` elements, `ComboBox`, `FloatingCard`, `AskEach` and `ListManager`. See its [README](js/webawesome-extras/README.md) |
| [`custom-elements.json`](custom-elements.json) | The manifest of the elements (attributes, properties, events, slots, parts, CSS custom properties), generated from the code and its JSDoc with `@custom-elements-manifest/analyzer`, like Web Awesome's |
| [`dist/react/`](dist/react/) | One React wrapper per `wax-*` element (`wax-item-list.js`), generated from the manifest with `@lit/react`: the events `wax-select`... are the props `onWaxSelect`... A React application takes these; the other applications take only `js/webawesome-extras/` |
| [`scripts/`](scripts/) | `react.mjs` and `ReactWrappers.js`, the generator of the wrappers, and the test that fails if the manifest or the wrappers are stale |
| `js/history/`, `js/vendor/`, `js/tools/` | Generated copies of [webutils](../webutils) that the components import (`BackClose`) and the tool that makes them; not edited by hand |

What is **not** here: buttons, boxes and switches are Web Awesome's own (`wa-button`, `wa-input`, `wa-switch`...) and the application builds them; `Dirty`, `Typing`, `ButtonLabel`
(behaviours of forms) and `BackClose` (history) are in [webutils](../webutils), as are `text` (tolerant search) and `vendor` (the tool that makes generated copies). The loose CSS classes
(`.input`, `.row`, `.pill`, `.check`...) belong to each application's own stylesheet. This repository has components and nothing else.

## The pattern for a component

Components follow Web Awesome's way:

- a custom element built with **Lit** (`LitElement`), in a file of its own named after the class (`WaxItemList.js`), with a tag that starts with **`wax-`**;
- its colours, sizes, radii and fonts come from Web Awesome's design tokens (**`--wa-*`**), so the theme of the page applies to it. A component may add
  its own tokens (`--item-accent`...), always with a `--wa-*` token as the fallback;
- its **events** are named `wax-*` (`wax-select`, `wax-mark`...), are `CustomEvent`s that bubble and are composed, and carry what happened in `detail`;
- the inside is open to styling through **`part`s** (`::part(line)`) and to content through **`slot`s**;
- what is DOM-free (the rules: what a click selects, how keys are reordered...) is a small plain class in a file of its own, tested in Node; the element only
  connects it to the page;
- the module **defines the element when it is imported** (`customElements.define('wax-item-list', WaxItemList)`, guarded so importing it twice is harmless);
  that is the autoloader for now. The page imports the file of each component it uses.

## Tests and tooling

The components have no network and no dependencies in their tests; the manifest and the wrappers need the dev tooling:

    cd js/webawesome-extras && node --test test/*.test.js   # the components
    cd js/tools && node --test test/*.test.js               # the generated copies are not edited by hand
    npm install                                             # once: the analyzer, @lit/react, lit and react (dev only; node_modules is not committed)
    npm test                                                # all of the above plus the check that custom-elements.json and dist/react are not stale
    npm run build                                           # after changing a component: writes custom-elements.json and dist/react

Lit elements need a DOM, which Node does not have, so the tests cover the DOM-free logic of each component (the files without Lit); what the element
shows is checked in a browser. A new element goes in a file `Wax<Name>.js`: the manifest picks up the files with that name.

## How an application brings it in

Every file lives in exactly one repository. An application that uses the folder `js/webawesome-extras` carries a **generated copy** (`lib/webawesome-extras`, only the JavaScript: not the manifest or the React wrappers), never edited by hand, made with
`webutils/js/vendor/Vendor.js` (see the README of [webutils](../webutils)): the copy has a `MANIFEST.json` with the commit it comes from and the hash of each file,
and a test of the application fails if it differs.

## License

GPL-3.0-or-later; the text is in [`LICENSE`](LICENSE).
