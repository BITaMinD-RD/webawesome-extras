# Changelog

All notable changes to this package are listed here. Versions follow [Semantic Versioning](https://semver.org/).

## Unreleased

- New element `wax-map-picker`: a Leaflet map to pick a point on (click or drag the marker), with sites, a route and areas. Leaflet is loaded on demand from unpkg (`WaxMapPicker.leaflet` changes where from) and the tiles come from a catalog of providers that need no key (`provider`, or `tiles` of your own). Events `wax-pick`, `wax-site-click` and `wax-map-error`; terms `waxMapUnavailable` and `waxMinutes` in English and Spanish.

## 0.1.0

The first release.

- Elements: `wax-ask-each`, `wax-combobox`, `wax-floating-card`, `wax-item-list` and `wax-list-manager`.
- Web Awesome's own `wa-show`, `wa-after-show`, `wa-hide` and `wa-after-hide` events where the meaning is the same, and typed `wax-*` events for the rest.
- An autoloader (`webawesome-extras/loader`) that works like Web Awesome's.
- Texts localized with Web Awesome's `registerTranslation`, in English (the default) and Spanish.
- `custom-elements.json` and React wrappers (`webawesome-extras/react`).
