# Map picker

`<wax-map-picker>` is a map to pick a point on: click it, or drag the marker, and it says where the point ended up. Around the point it can show sites (a circle with an emoji and a text on hover, one of them
highlighted), a route and areas (how far one gets in some minutes).

Use it when a form asks for a place and typing coordinates is not enough: the place of a match, the start of a walk, a home address to confirm. It knows nothing of pitches or forms: it is a map, a point and a few things drawn
next to it.

```html
<wax-map-picker lat="41.39" lon="2.17" zoom="12"></wax-map-picker>
```

## Where the map comes from

The element is [Leaflet](https://leafletjs.com) (the only dependency besides Web Awesome and Lit) and it does not bundle it. **Leaflet is loaded on demand from unpkg** (version 1.9.4, checked against its integrity hash)
the first time a map is visible, once for all the maps of the page, and **the tiles come from the provider you choose**. Both need a connection. If the page already has Leaflet (`window.L`), that one is used; to serve your
own copy, [say where it is](#serving-leaflet-yourself).

When the connection fails, nothing is cached: the element shows a notice in the place of the map (`unavailable`, localized), fires `wax-map-error`, and the next `show()` tries again. Whoever uses the map
carries on with what it has, typed coordinates for example:

```js
map.addEventListener('wax-map-error', () => latitudeInput.hidden = longitudeInput.hidden = false);
```

The map is made when the element is first visible, and measured again whenever its size changes (a tab that opens, a dialog): there is nothing to call. What you set before the map exists (the point, the sites, the route,
the areas) is kept and drawn when it does.

## Examples

Every example on this page is mounted by the tests of the repository, so they work as shown; the tests give them a local copy of Leaflet and blank tiles, so they do not use the network. On this site, with a connection, they show the real map.
The scripts find their elements by `id` and assume the [loaders](../installation.md) of the page.

### Picking a point

A click on the map, or dropping the marker, puts the point there and fires `wax-pick` with `detail: { lat, lon }`. `lat` and `lon` are attributes and properties, so the form can keep them.

```html example
<wax-map-picker id="pick-map"></wax-map-picker>
<p id="pick-output">Click the map.</p>

<script type="module">
  const map = document.getElementById('pick-map');
  map.addEventListener('wax-pick', event => {
    const { lat, lon } = event.detail;
    document.getElementById('pick-output').textContent = `Picked ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  });
</script>
```

### Setting the point from code

`lat` and `lon` move the marker and look at it, and so does `setPoint(lat, lon, zoomIn?)`; none of them fires `wax-pick`, which is only for what the user does. The map zooms to at least 15, or all the way in (17) with
`zoomIn`. `point` gives the point back (or `null`), and `clear()` removes the marker.

```html example
<wax-map-picker id="point-map" lat="41.3874" lon="2.1686" zoom="12"></wax-map-picker>
<wa-button id="point-near">Zoom in on the point</wa-button>
<wa-button id="point-move">Move it</wa-button>
<wa-button id="point-clear">Clear</wa-button>
<p id="point-output"></p>

<script type="module">
  const map = document.getElementById('point-map');
  const show = () => { document.getElementById('point-output').textContent = `point: ${JSON.stringify(map.point)}`; };
  document.getElementById('point-near').addEventListener('click', () => { map.setPoint(41.3874, 2.1686, true); show(); });
  document.getElementById('point-move').addEventListener('click', () => { map.setPoint(41.4036, 2.1744); show(); });
  document.getElementById('point-clear').addEventListener('click', () => { map.clear(); show(); });
  show();
</script>
```

### Read only

With `readonly` the map is only to look at: a click picks nothing and the marker cannot be dragged. Code can still set the point.

```html example
<wax-map-picker readonly lat="41.3874" lon="2.1686" zoom="14"></wax-map-picker>
```

### Sites

`setSites(items, { fit })` draws some sites next to the point, each with its picture (an emoji), its text on hover and, if `faded`, faded. It replaces the ones there were, and `fit` makes the map cover the point and
all of them. A click on a site fires `wax-site-click` with `detail: { key }`. `highlightSite(key, { pan })` makes one grow, go on top and open its text, panning to it if it is out of sight; `highlightSite(null)` turns it off.

```html example
<wax-map-picker id="sites-map" lat="41.3874" lon="2.1686"></wax-map-picker>
<p id="sites-output">Click a site.</p>

<script type="module">
  const map = document.getElementById('sites-map');
  map.setSites([
    { key: 'camp-nou', lat: 41.3809, lon: 2.1228, icon: '🏟️', label: 'Stadium' },
    { key: 'sants', lat: 41.3791, lon: 2.1400, icon: '🚉', label: 'Station' },
    { key: 'park', lat: 41.3881, lon: 2.1505, icon: '🌳', label: 'Park', faded: true }
  ], { fit: true });
  map.addEventListener('wax-site-click', event => {
    map.highlightSite(event.detail.key);
    document.getElementById('sites-output').textContent = `Site: ${event.detail.key}`;
  });
</script>
```

### A route

`setRoute(points, { fit })` draws a line (it fits the map to it unless `fit` is `false`) and `clearRoute()` takes it away. The colour is `--map-picker-route`.

```html example
<wax-map-picker id="route-map"></wax-map-picker>
<wa-button id="route-clear">Clear the route</wa-button>

<script type="module">
  const map = document.getElementById('route-map');
  map.setRoute([
    { lat: 41.3809, lon: 2.1228 }, { lat: 41.3851, lon: 2.1349 }, { lat: 41.3791, lon: 2.1400 }, { lat: 41.3874, lon: 2.1686 }
  ]);
  document.getElementById('route-clear').addEventListener('click', () => map.clearRoute());
</script>
```

### Areas

`setAreas(areas, { fit })` draws GeoJSON geometries, each with its `minutes` (how far one gets in that time): from the largest to the smallest so that all of them show, each with a tooltip («20 min», in the [language](../localization.md) of the element)
and a tone that goes from the first colour for the smallest on. `fit` covers the largest; `clearAreas()` takes them away.

```html example
<wax-map-picker id="areas-map" lat="41.3874" lon="2.1686"></wax-map-picker>
<wa-button id="areas-clear">Clear the areas</wa-button>

<script type="module">
  const square = (lat, lon, d) => ({ type: 'Polygon', coordinates: [[[lon - d, lat - d], [lon + d, lat - d], [lon + d, lat + d], [lon - d, lat + d], [lon - d, lat - d]]] });
  const map = document.getElementById('areas-map');
  map.setAreas([5, 10, 15].map(minutes => ({ minutes, geometry: square(41.3874, 2.1686, minutes / 400) })));
  document.getElementById('areas-clear').addEventListener('click', () => map.clearAreas());
</script>
```

### Tiles

`provider` chooses the tiles by name. All the providers of the catalog need no key, but each has its terms: the
[tile usage policy of OpenStreetMap](https://operations.osmfoundation.org/policies/tiles/) is for light use, and the others are for you to check (CARTO's free tiles are for non-commercial use).
The element always shows the attribution that each provider asks for.

| `provider` | Tiles | Max zoom |
|---|---|---|
| `osm` (default) | OpenStreetMap standard | 19 |
| `opentopomap` | OpenTopoMap, with relief | 17 |
| `cyclosm` | CyclOSM, for cyclists | 20 |
| `osm-hot` | Humanitarian OpenStreetMap | 20 |
| `carto-light` | CARTO Positron, a light base | 20 |
| `carto-dark` | CARTO Dark Matter, a dark base | 20 |

A name that is not in the catalog is `osm`. `tiles` gives tiles of your own (`{ url, attribution, maxZoom, subdomains }`) and wins over `provider`; and an application can add providers to the catalog it asks,
`WaxMapPicker.providers`.

```html example
<wa-select id="tiles-select" value="osm" label="Provider" size="s">
  <wa-option value="osm">osm</wa-option>
  <wa-option value="opentopomap">opentopomap</wa-option>
  <wa-option value="cyclosm">cyclosm</wa-option>
  <wa-option value="osm-hot">osm-hot</wa-option>
  <wa-option value="carto-light">carto-light</wa-option>
  <wa-option value="carto-dark">carto-dark</wa-option>
</wa-select>
<wax-map-picker id="tiles-map" lat="41.3874" lon="2.1686" zoom="12"></wax-map-picker>

<script type="module">
  const map = document.getElementById('tiles-map');
  document.getElementById('tiles-select').addEventListener('change', event => { map.provider = event.target.value; });
</script>
```

```js
// Tiles of your own
map.tiles = { url: 'https://tiles.example.org/{z}/{x}/{y}.png', attribution: '&copy; Example', maxZoom: 18 };

// A provider that an application adds to the catalog, to be used by name
import { WaxMapPicker } from './lib/webawesome-extras/components/map-picker/map-picker.js';
WaxMapPicker.providers.mine = { url: 'https://{s}.tiles.example.org/{z}/{x}/{y}.png', subdomains: 'abc', attribution: '&copy; Example' };
```

### Serving Leaflet yourself

`WaxMapPicker.leaflet` says where Leaflet is loaded from; set it before the first map is shown. An empty integrity is not checked. The stylesheet is linked inside the shadow of the element (Leaflet's CSS does not reach
into it from the page), and the images of the default marker are looked up next to it, in `images/`, unless `imagePath` says otherwise. If the page loads Leaflet itself and `window.L` is there, nothing is loaded.

```js
import { WaxMapPicker } from './lib/webawesome-extras/components/map-picker/map-picker.js';

WaxMapPicker.leaflet = {
  js: '/lib/leaflet/leaflet.js', jsIntegrity: '',
  css: '/lib/leaflet/leaflet.css', cssIntegrity: '',
  imagePath: ''      // '' is the images/ folder next to the stylesheet
};
```

### Styling

The height is `--map-picker-height` (`300px`). The route, the areas and the ring of the highlighted site have their own custom properties, which fall back to `--wa-*` tokens, so the map follows the light and dark themes.
The map is the part `base`, and the notice when Leaflet could not be loaded is `unavailable`. (The base layer of the tiles is the provider's: for a dark page, `carto-dark`.)

```html example
<style>
  #styled-map {
    --map-picker-height: 220px;
    --map-picker-route: var(--wa-color-danger-fill-loud);
    --map-picker-area-1: var(--wa-color-brand-fill-loud);
    --map-picker-site-ring: var(--wa-color-danger-fill-loud);
  }
  #styled-map::part(base) { border-radius: var(--wa-border-radius-l); }
</style>
<wax-map-picker id="styled-map" readonly></wax-map-picker>

<script type="module">
  const map = document.getElementById('styled-map');
  map.setRoute([{ lat: 41.3809, lon: 2.1228 }, { lat: 41.3791, lon: 2.1400 }, { lat: 41.3874, lon: 2.1686 }]);
  map.setSites([{ key: 'start', lat: 41.3809, lon: 2.1228, icon: '🏁', label: 'Start' }]);
  map.highlightSite('start', { pan: false });
</script>
```

## Texts

The tooltip of an area and the notice of a map that could not be loaded are [terms](../localization.md) of the language of the element or of the page: `waxMinutes` (a function of the number: `20 min`) and `waxMapUnavailable` (`The map is not available` in English).
The texts of the sites are yours (`label`).

## Importing

With the [loader](../installation.md), which defines the element when it appears in the page:

```html
<script type="module" data-webawesome-extras="/lib/webawesome-extras" src="/lib/webawesome-extras/webawesome-extras.loader.js"></script>
```

Cherry-picked, with no loader: one import defines the element, and the page needs the import map of the [installation](../installation.md). Leaflet is not imported: the element loads it, as said [above](#where-the-map-comes-from).

```js
import '/lib/webawesome-extras/components/map-picker/map-picker.js';
```

In React, with the wrapper of `dist/react` (see [React](../react.md)):

```jsx
import { WaxMapPicker } from './lib/webawesome-extras/dist/react/wax-map-picker.js';

<WaxMapPicker ref={map} lat={41.39} lon={2.17} provider="cyclosm" onWaxPick={event => save(event.detail)} />
// map.current.setSites(sites)
```

## Reference

The tables are generated from `custom-elements.json` by `npm run docs`; do not edit them by hand.

<!-- api:start -->

### Properties and attributes

| Property | Description | Attribute | Type | Default |
|---|---|---|---|---|
| `point` | The point, or null if there is none (read only) |  | `{lat: number, lon: number} \| null` |  |
| `map` | The Leaflet map, once it exists (null before), for what this element does not cover (read only) |  | `any` |  |
| `lat` | The latitude of the point, or null | `lat` | `number \| null` | `null` |
| `lon` | The longitude of the point, or null | `lon` | `number \| null` | `null` |
| `centerLat` | The latitude the map looks at before there is a point (attribute `center-lat`) | `center-lat` | `number` | `41.6` |
| `centerLon` | The longitude the map looks at before there is a point (attribute `center-lon`) | `center-lon` | `number` | `2.2` |
| `zoom` | The zoom of the starting view | `zoom` | `number` | `9` |
| `readonly` | Only to look at: the point cannot be picked or dragged | `readonly` | `boolean` | `false` |
| `provider` | The name of the provider of the tiles | `provider` | `string` | `'osm'` |
| `tiles` | Tiles of your own, which win over `provider`: `url` with `{z}`, `{x}` and `{y}` (and `{s}` with `subdomains`), the `attribution` as HTML and the `maxZoom` |  | `{url: string, attribution?: string, maxZoom?: number, subdomains?: string} \| null` | `null` |
| `unavailable` | The map could not be loaded (read only) | `unavailable` | `boolean` | `false` |

### Methods

| Method | Description | Arguments | Returns |
|---|---|---|---|
| `show()` | Makes sure the map exists and has measured itself. Nobody needs to call it: the map is created when the element is first visible and measured again when its size changes. It is here for code that wants to wait for the map (`await map.show()`) or to try again after a failure. |  | `Promise<boolean>` |
| `setPoint(lat, lon, zoomIn?)` | Puts the marker and looks at it. It does not fire `wax-pick`: that is only for what the user does on the map. | `lat: number`<br>`lon: number`<br>`zoomIn?: boolean` Zoom all the way in; otherwise, only to a comfortable zoom |  |
| `setSites(items, options?)` | Draws some sites next to the point, each with its little picture (an emoji) and its text on hover. It replaces those there were. They cannot be dragged and do not change the point. If one was highlighted and still is there, it stays highlighted. | `items: {key: string, lat: number, lon: number, icon: string, label: string, faded?: boolean}[]`<br>`options?: {fit?: boolean}` `fit`: make the map cover the point and all the sites |  |
| `highlightSite(key, options?)` | Highlights a site: it grows and goes on top of the others, with its text open. If it falls outside what is visible, the map moves until it can be seen. | `key: string \| null` The site, or null to turn off the one there was<br>`options?: {pan?: boolean}` |  |
| `setRoute(points, options?)` | Draws a path (a route) on top of the map. It replaces the one there was. | `points: {lat: number, lon: number}[]`<br>`options?: {fit?: boolean}` `fit`: make the map cover the whole path |  |
| `clearRoute()` | Removes the path |  |  |
| `setAreas(areas, options?)` | Draws some areas (how far one gets in some minutes), from largest to smallest so that all show, each with a tooltip («20 min»). It replaces those there were. | `areas: {minutes: number, geometry: any}[]` Each with its GeoJSON geometry<br>`options?: {fit?: boolean}` `fit`: make the map cover the largest |  |
| `clearAreas()` | Removes the areas |  |  |
| `clear()` | Removes the marker: there is no point |  |  |

### Events

| Event | Description |
|---|---|
| `wax-pick` | The user clicked the map or dropped the marker (not `setPoint`, nor changing `lat` and `lon`). `detail: { lat, lon }` |
| `wax-site-click` | A site was clicked. `detail: { key }` |
| `wax-map-error` | Leaflet could not be loaded, so there is no map. `detail: { src }`, the address that failed. The next `show()` tries again |

### Parts

| Part | Description |
|---|---|
| `base` | The map |
| `unavailable` | The notice that takes the place of the map when it could not be loaded |

### CSS custom properties

| Property | Description |
|---|---|
| `--map-picker-height` | The height of the element (`300px`) |
| `--map-picker-route` | The colour of the route (`--wa-color-brand-fill-loud`) |
| `--map-picker-area-1` | The colour of the smallest area (`--wa-color-success-fill-loud`); `--map-picker-area-2` to `-5` are the next ones (warning, danger, purple and brand), and then they start again |
| `--map-picker-site-ring` | The ring of the highlighted site (`--wa-color-brand-fill-loud`) |

<!-- api:end -->
