# webawesome-extras

Our extensions of [Web Awesome](https://webawesome.com): form controls, small widgets and components that Web Awesome does not have,
written the way Web Awesome writes its own, as ES modules without a build step.

## Requirements

The page must load these two; **neither is copied into this repository**:

- **Web Awesome 3.x** (its components, such as `wa-button` or `wa-input`, and its theme stylesheets, which define the `--wa-*` tokens).
- **Lit 3.x**, for the components of this repository. They import it as a bare specifier, `import { LitElement, html, css } from 'lit'`, so the
  page needs an import map that says where it is, for example `{ "imports": { "lit": "./contrib/lit/lit-all.min.js" } }`.

## What lives where

| folder | what it is |
|---|---|
| [`js/controls-ui/`](js/controls-ui/) | The controls and widgets: `controls.css` (input, pill, check, select, combo...), the helpers that make Web Awesome controls from code (`Button`, `Input`, `Toggle`, `ComboBox`), `FloatingCard`, `AskEach`, `ListManager` and the list component `<wax-item-list>`. See its [README](js/controls-ui/README.md) |

The folder keeps the name `controls-ui` for now so that every consumer keeps importing `../controls-ui/`; renaming it will be one step later.
`text` (tolerant search) and `vendor` (the tool that makes generated copies) are in [webutils](../webutils), not here.

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

## Tests

Each folder has its own tests, with no network and no dependencies:

    cd js/controls-ui && node --test test/*.test.js

Lit elements need a DOM, which Node does not have, so the tests cover the DOM-free logic of each component (the files without Lit); what the element
shows is checked in a browser.

## How an application brings it in

Every file lives in exactly one repository. An application that uses a folder of this one carries a **generated copy**, never edited by hand, made with
`webutils/js/vendor/Vendor.js` (see the README of [webutils](../webutils)): the copy has a `MANIFEST.json` with the commit it comes from and the hash of each file,
and a test of the application fails if it differs.

## License

GPL-3.0-or-later; the text is in [`LICENSE`](LICENSE).
