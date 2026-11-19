# webawesome-extras

Components that [Web Awesome](https://webawesome.com) does not have, written the way Web Awesome writes its own, so that they look and work as if they were native Web Awesome ones:
custom elements with the prefix `wax-`, built with Lit and styled with the `--wa-*` design tokens. They depend on Web Awesome 3.x and Lit 3.x and on nothing else.

## Components

| Element | What it is | Page |
|---|---|---|
| `<wax-item-list>` | A list to choose from: a line per item with icon, name and note; select, mark, move, swipe | [Item list](docs/components/item-list.md) |
| `<wax-combobox>` | A `wa-select` with a search box that filters its options as you type | [Combobox](docs/components/combobox.md) |
| `<wax-floating-card>` | A card next to what was clicked: peeks, pinned by a click, or in the middle | [Floating card](docs/components/floating-card.md) |
| `<wax-ask-each>` | A dialog that asks about each thing in turn, with "yes to all" and cancel | [Ask each](docs/components/ask-each.md) |
| `<wax-list-manager>` | Filters, search box, "New" button and an item list, for screens that edit things | [List manager](docs/components/list-manager.md) |

The rest of the documentation: [overview](docs/index.md), [installation and usage](docs/installation.md), [events](docs/events.md), [theming](docs/theming.md) and [React](docs/react.md).

## Install

The page loads Web Awesome and Lit (neither is copied here) and then the loader, which defines each `wax-*` element when it appears:

```html
<script type="module" data-webawesome-extras="lib/webawesome-extras" src="lib/webawesome-extras/webawesome-extras.loader.js"></script>
```

The import map, cherry-picking, vendoring and React are in [installation and usage](docs/installation.md).

## The docs

The pages are in [`docs/`](docs/). To read them with their live examples, serve the root of the repository with any static server and open `/docs/`:

    npm install
    npx http-server -p 8080          # or: python3 -m http.server 8080
    # then open http://localhost:8080/docs/

## Layout

| Path | What it is |
|---|---|
| `src/components/<name>/` | One folder per element: `<name>.js`, `<name>.styles.js`, `<name>.state.js` (its rules, no DOM) and their tests |
| `src/events/`, `src/utilities/` | The typed `wax-*` events; the autoloader and base path |
| `src/webawesome-extras.loader.js`, `src/webawesome-extras.js` | The autoloader, and everything at once |
| `custom-elements.json` | The manifest, generated from the JSDoc with `@custom-elements-manifest/analyzer` |
| `dist/react/` | React wrappers generated from the manifest |
| `docs/` | The pages, the site (`docs/index.html`) and the test that mounts every example |
| `scripts/` | Generators (React wrappers, reference tables) and the tests that fail when they are stale |

## Tests and build

    npm install
    PLAYWRIGHT_BROWSERS_PATH=$PWD/node_modules/.playwright npx playwright install chromium firefox webkit    # once
    npm test             # Node tests of the rules and generated files, then browser tests in Chromium, Firefox and WebKit (they also mount every example of the docs)
    npm run build        # manifest, React wrappers and the reference tables of the docs

## License

GPL-3.0-or-later; the text is in [`LICENSE`](LICENSE).
