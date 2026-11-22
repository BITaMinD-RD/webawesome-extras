# Installation and usage

The elements of this package are plain ES modules: there is no build step and no stylesheet to link, because every component carries its styles in its shadow DOM. The page loads Web Awesome and Lit,
and then the elements.

## Requirements

The page must load these two. **Neither is copied into this package.**

- **Web Awesome 3.x**: its theme stylesheets, which define the `--wa-*` tokens, and its components. The elements use Web Awesome components inside (`wa-select`, `wa-option` and `wa-input` in
  the combobox, `wa-dialog` and `wa-button` in ask each, `wa-input` and `wa-button` in the list manager). Web Awesome's autoloader only looks in the page, not inside the shadow of an element, so the
  elements import those components themselves, by their name in the package (`@awesome.me/webawesome/dist/components/select/select.js`).
- **Lit 3.x**. The elements import it as a bare specifier (`import { LitElement, html } from 'lit'`), and the directives they use by their usual path (`lit/directives/repeat.js`).

Because the imports are bare, the page needs an **import map** that says where each one is.

## A page that has everything

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">

    <!-- The theme of Web Awesome: it defines the --wa-* tokens that the elements use -->
    <link rel="stylesheet" href="/lib/webawesome/dist/styles/layers.css">
    <link rel="stylesheet" href="/lib/webawesome/dist/styles/color/variants.css">
    <link rel="stylesheet" href="/lib/webawesome/dist/styles/themes/default.css">

    <!-- Where Lit and the Web Awesome components the elements use inside are -->
    <script type="importmap">
      {
        "imports": {
          "lit": "/lib/lit/lit-all.min.js",
          "lit/directives/repeat.js": "/lib/lit/lit-all.min.js",
          "@awesome.me/webawesome/dist/": "/lib/webawesome/dist/"
        }
      }
    </script>

    <!-- The loaders: each one defines the elements of its family when they appear in the page -->
    <script type="module" data-webawesome="/lib/webawesome/dist" src="/lib/webawesome/dist/webawesome.loader.js"></script>
    <script type="module" data-webawesome-extras="/lib/webawesome-extras" src="/lib/webawesome-extras/webawesome-extras.loader.js"></script>
  </head>
  <body>
    <wax-combobox label="City" placeholder="Pick one..."></wax-combobox>
  </body>
</html>
```

The files in `lib/` are yours: whichever way you bring Web Awesome and Lit in (the packages from npm, a bundle), the import map says where they are. If Lit comes from `node_modules`,
the map lists `lit`, `lit/` and the packages Lit itself imports (`@lit/reactive-element`, `lit-html` and `lit-element`); with a bundle that has them all, every name points at the same file.
The [docs site](index.md#reading-these-pages) does it from a CDN (jsDelivr): see the import map in `docs/index.html`, which lists only what the elements and the site import (`lit`, `lit/directives/repeat.js`, `marked` and the prefix of Web Awesome).

Web Awesome's own `utilities/localize.js` imports `@shoelace-style/localize`, so the map lists it too if you load Web Awesome from its own files (the CDN build of the docs site has it bundled). The language of the elements is set as in Web Awesome: see [Localization](localization.md).

The import path `@awesome.me/webawesome/dist/components/select/select.js` has to be the same file that Web Awesome's own autoloader loads for `<wa-select>`, so that nothing is loaded twice. A prefix
entry in the import map (`"@awesome.me/webawesome/dist/": "/lib/webawesome/dist/"`) does that for all of them.

## The loader

`webawesome-extras.loader.js` is the autoloader, the counterpart of Web Awesome's `webawesome.loader.js`: a `MutationObserver` that discovers the `wax-*` tags of the page that are not defined
yet and imports `components/<name>/<name>.js` from the base path for each one. So the page only pays for the elements it uses.

```html
<script type="module" data-webawesome-extras="/lib/webawesome-extras" src="/lib/webawesome-extras/webawesome-extras.loader.js"></script>
```

- `data-webawesome-extras` is the folder of the package, the one that has `components/`, as `data-webawesome` is for Web Awesome. Without it, the folder of the loader script is used.
- `data-wax-preload="wax-floating-card wax-ask-each"` on any element asks for elements that are not in the page yet but will be (made later by code).
- `wax-discovery-complete` fires on the element where a discovery finished (it does not bubble), like Web Awesome's `wa-discovery-complete`.
- The module exports `discover`, `startLoader`, `stopLoader`, `getBasePath` and `setBasePath`.
- An element that is made by code and used at once, a method called before the loader has defined it, needs `await customElements.whenDefined('wax-ask-each')` first, or its module imported.

## Cherry-picking

Without the loader, import the module of each component you use. Importing it defines the element (guarded, so importing twice is harmless), and the elements it needs inside are imported by it.

```js
import '/lib/webawesome-extras/components/item-list/item-list.js';
import '/lib/webawesome-extras/components/combobox/combobox.js';
```

Everything at once, like `webawesome.js` of Web Awesome, defines all the elements and exports the typed events:

```js
import '/lib/webawesome-extras/webawesome-extras.js';
import { WaxSelectEvent } from '/lib/webawesome-extras/events/events.js';
```

## How an application brings it in

Every file lives in exactly one repository. An application carries a **copy of `src/`** (the JavaScript only: not the manifest, the docs or the React wrappers), for instance in
`lib/webawesome-extras`, which it never edits by hand: a fix goes into this repository and the copy is made again. A good copy has a manifest of its own (the commit it comes from and a hash of each
file) and a test of the application fails if the copy differs, so nobody changes it by mistake.

The React wrappers (`dist/react`) are for applications that use React; they import the elements from `../../src/components/...`, so the copy for React keeps `src/` and `dist/react` side by side. See [React](react.md).

## Developing this package

```
npm install                       # once: the analyzer, @lit/react, lit, react, Web Awesome, Web Test Runner, @open-wc/testing and marked (dev only; node_modules is not committed)
PLAYWRIGHT_BROWSERS_PATH=$PWD/node_modules/.playwright npx playwright install chromium firefox webkit    # once: the browsers
npm test                          # Node tests of the rules and of the generated files, then the browser tests (Chromium, Firefox and WebKit), which mount every example of these docs
npm run build                     # after changing a component: writes custom-elements.json, dist/react and the reference tables of the docs
```

The Node tests also fail if `custom-elements.json`, `dist/react` or a reference table of the docs is stale.
