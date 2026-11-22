# Changelog

All notable changes to this package are listed here. Versions follow [Semantic Versioning](https://semver.org/).

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
