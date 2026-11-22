# Changelog

All notable changes to this package are listed here. Versions follow [Semantic Versioning](https://semver.org/).

## 0.2.2

- `wax-floating-card` is a `wa-popup` inside when there is a mouse: it is placed by Web Awesome (flips to the other side, shifts and shrinks its height to fit) instead of by the coordinates of the page, so it no longer has to be a child of the `body`. New `placement` (`bottom-start` by default) and `distance` (6) attributes, a `popup` part, and `place()` asks the popup to reposition.
- `wax-floating-card` without a mouse is a `wa-dialog` inside (`light-dismiss`, without header, with its own × button), so Escape, a click outside and the focus are the ones of Web Awesome; its inner events do not come out, only the four of the card, once each. Changed: the `backdrop` part and the `--floating-card-backdrop` and `--floating-card-centered-shadow` properties are gone (the dialog dims the page with its own `::backdrop`; style it with the `dialog` and `body` parts and `--width`), `--floating-card-width` and the `card` part only apply next to the anchor, and in the middle a click outside has the card itself as the `source` of `wa-hide` (before it was the backdrop).
- The docs site works as published by GitHub Pages: it takes Web Awesome, Lit and marked from jsDelivr (like the demo) and needs a connection but no `npm install`.
- The docs have a gallery as the front page of the components: a card per element with its sentence, its version and a small live preview, made from `custom-elements.json` and `docs/pages.json`.
- The JSDoc of each element has `@summary` and `@since`, which `custom-elements.json` now carries as `summary` and `since`.

## 0.2.1

- The click or the drag of the user on `wax-map-picker` moves the marker and leaves the view as it is (`setPoint` and the `lat` and `lon` attributes still look at the point).
- The demo waits until every `wax-*` element it uses is defined, and its language select no longer uses the deprecated `size="small"`.

## 0.2.0

- New element `wax-map-picker`: a Leaflet map to pick a point on (click or drag the marker), with sites, a route and areas. Leaflet is loaded on demand from unpkg (`WaxMapPicker.leaflet` changes where from) and the tiles come from a catalog of providers that need no key (`provider`, or `tiles` of your own). Events `wax-pick`, `wax-site-click` and `wax-map-error`; terms `waxMapUnavailable` and `waxMinutes` in English and Spanish.
- A demo page, `demo/index.html`, that loads Web Awesome and Lit from jsDelivr.

## 0.1.0

The first release.

- Elements: `wax-ask-each`, `wax-combobox`, `wax-floating-card`, `wax-item-list` and `wax-list-manager`.
- Web Awesome's own `wa-show`, `wa-after-show`, `wa-hide` and `wa-after-hide` events where the meaning is the same, and typed `wax-*` events for the rest.
- An autoloader (`webawesome-extras/loader`) that works like Web Awesome's.
- Texts localized with Web Awesome's `registerTranslation`, in English (the default) and Spanish.
- `custom-elements.json` and React wrappers (`webawesome-extras/react`).
