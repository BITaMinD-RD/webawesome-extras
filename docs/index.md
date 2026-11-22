# webawesome-extras

webawesome-extras is a set of components that [Web Awesome](https://webawesome.com) does not have, written the way Web Awesome writes its own, so that they look and work as if they were native
Web Awesome ones. They are custom elements with the prefix `wax-`, built with Lit, styled with the `--wa-*` design tokens, and organised, tested and documented like Web Awesome's package.

They depend on Web Awesome and Lit and on nothing else (the [map picker](components/map-picker.md) also needs Leaflet, which it loads on demand), and know nothing of what they are used for.

## Components

The [gallery of components](components/index.md) shows each one working, small. The same list in a table:

| Component | What it is for |
|---|---|
| [Item list](components/item-list.md) | A list to choose from: a line per item with icon, name and note; select, mark, move and swipe |
| [Combobox](components/combobox.md) | A `wa-select` with a search box that filters its options as you type, which takes part in forms |
| [Floating card](components/floating-card.md) | A card next to what was clicked: peeks with a mouse, pinned by a click, in the middle without one |
| [Ask each](components/ask-each.md) | A dialog that asks about each thing in turn, with "yes to all" and cancel |
| [List manager](components/list-manager.md) | The filters, the search box, the "New" button and an item list, for the screens that edit things |
| [Map picker](components/map-picker.md) | A map to pick a point on, with sites, a route and areas; Leaflet and the tiles are loaded on demand |

## Where to start

- [Installation and usage](installation.md): what the page must load, the loader and how to cherry-pick.
- [Events](events.md): the events that are Web Awesome's own and the `wax-*` ones with their classes.
- [Theming](theming.md): the `--wa-*` tokens and the custom properties of each component.
- [React](react.md): the wrappers of `dist/react`.

Each component page has live examples with their code, how to import it, and reference tables that are generated from the manifest of the package (`custom-elements.json`), so they cannot
drift from the code.

## Reading these pages

The pages are Markdown files in the `docs/` folder of the repository, readable as they are. The site renders them with the examples running, and it is published at
<https://bitamind-rd.github.io/webawesome-extras/docs/>: it takes Web Awesome, Lit and the Markdown renderer from a CDN, so it needs a connection but no `npm install`. To run it from your clone,
serve the root of the repository with any static server:

```
npx http-server -p 8080     # or: python3 -m http.server 8080
```

and then open `http://localhost:8080/docs/`. Every example of every page is also mounted by the browser tests (`npm install`, then `npm test`, which do not use the network), so a broken example fails the build.
