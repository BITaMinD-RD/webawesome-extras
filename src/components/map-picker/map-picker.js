// @ts-check
import { LitElement, html, nothing } from 'lit';
import { LocalizeController, term } from '../../utilities/localize.js';
import { LEAFLET, MapPickerState, TILE_PROVIDERS } from './map-picker.state.js';
import styles from './map-picker.styles.js';
import { WaxPickEvent } from '../../events/pick.js';
import { WaxSiteClickEvent } from '../../events/site-click.js';
import { WaxMapErrorEvent } from '../../events/map-error.js';

/** What the code moves the map with: no animation, which would still be running if the element is taken out of the page meanwhile (only what the user does is animated) */
const NOW = { animate: false };

/**
 * A map to pick a point on: click it, or drag the marker, and it says where the point ended up. It can also show sites around the point (each a circle with an emoji and a text on hover, one of them
 * highlighted), a route and areas (how far one gets in some minutes). It is [Leaflet](https://leafletjs.com), which is **loaded on demand** the first time a map is visible (from unpkg, unless the page
 * already has `window.L` or `WaxMapPicker.leaflet` says where to find it), and the tiles come from a provider that needs no key (`provider`). Both need a connection: with none, the element shows
 * a notice, has `unavailable`, fires `wax-map-error` and whoever uses it carries on with what it has (typed coordinates, for example).
 *
 * It needs no `show()`: it creates the map when it is first visible and measures it again whenever its size changes (a tab that opens, a dialog). Everything that is set before the map exists
 * (the point, the sites, the route, the areas) is kept and drawn when it does.
 *
 * ```html
 * <wax-map-picker lat="41.39" lon="2.17" zoom="12" provider="cyclosm"></wax-map-picker>
 * ```
 * ```js
 * map.addEventListener('wax-pick', event => save(event.detail.lat, event.detail.lon));
 * map.setSites([{ key: 'a', lat: 41.4, lon: 2.18, icon: '🏟️', label: 'Pitch A' }]);
 * map.highlightSite('a');
 * ```
 *
 * @summary A map to pick a point on, with sites, a route and areas; Leaflet and the tiles are loaded on demand.
 * @since 0.2.0
 *
 * @element wax-map-picker
 *
 * @attr {number} lat - The latitude of the point, which has a marker. Changing it (or `lon`) moves the marker and looks at it; with no point there is no marker
 * @attr {number} lon - The longitude of the point
 * @attr {number} center-lat - The latitude the map looks at before there is a point (`41.6`)
 * @attr {number} center-lon - The longitude the map looks at before there is a point (`2.2`)
 * @attr {number} zoom - The zoom of the starting view (`9`)
 * @attr {boolean} readonly - Only to look at: the point cannot be picked or dragged
 * @attr {string} provider - The tiles, by name: `osm` (the default), `opentopomap`, `cyclosm`, or `osm-hot`. A name that is not in the catalog is `osm`
 * @attr {boolean} unavailable - The map could not be loaded (read only: set by the element)
 *
 * @prop {number | null} lat - The latitude of the point, or null
 * @prop {number | null} lon - The longitude of the point, or null
 * @prop {number} centerLat - The latitude the map looks at before there is a point (attribute `center-lat`)
 * @prop {number} centerLon - The longitude the map looks at before there is a point (attribute `center-lon`)
 * @prop {number} zoom - The zoom of the starting view
 * @prop {boolean} readonly - Only to look at: the point cannot be picked or dragged
 * @prop {string} provider - The name of the provider of the tiles
 * @prop {{url: string, attribution?: string, maxZoom?: number, subdomains?: string} | null} tiles - Tiles of your own, which win over `provider`: `url` with `{z}`, `{x}` and `{y}` (and `{s}` with `subdomains`), the `attribution` as HTML and the `maxZoom`
 * @prop {boolean} unavailable - The map could not be loaded (read only)
 * @prop {{lat: number, lon: number} | null} point - The point, or null if there is none
 * @prop {any} map - The Leaflet map, once it exists (null before), for what this element does not cover
 * @prop {{js: string, jsIntegrity: string, css: string, cssIntegrity: string, imagePath: string, prefix: string}} leaflet - Static. Where Leaflet is loaded from: the files of version 1.9.4 on unpkg, with their integrity. Set it before the first map is shown to serve your own copy (an empty integrity is not checked). `prefix` is the HTML before the attributions of the tiles: a plain link to Leaflet by default, without the flag Leaflet adds; an empty one leaves only the attributions
 * @prop {Record<string, {url: string, attribution?: string, maxZoom?: number, subdomains?: string}>} providers - Static. The catalog of tiles by name, where an application can add its own
 *
 * @fires wax-pick - The user clicked the map or dropped the marker (not `setPoint`, nor changing `lat` and `lon`). `detail: { lat, lon }`
 * @fires wax-site-click - A site was clicked. `detail: { key }`
 * @fires wax-map-error - Leaflet could not be loaded, so there is no map. `detail: { src }`, the address that failed. The next `show()` tries again
 *
 * @csspart base - The map
 * @csspart unavailable - The notice that takes the place of the map when it could not be loaded
 *
 * @cssprop [--map-picker-height] - The height of the element (`300px`)
 * @cssprop [--map-picker-route] - The colour of the route (`--wa-color-brand-fill-loud`)
 * @cssprop [--map-picker-area-1] - The colour of the smallest area (`--wa-color-success-fill-loud`); `--map-picker-area-2` to `-5` are the next ones (warning, danger, purple and brand), and then they start again
 * @cssprop [--map-picker-site-ring] - The ring of the highlighted site (`--wa-color-brand-fill-loud`)
 */
export class WaxMapPicker extends LitElement {
  static properties = {
    lat: { type: Number, reflect: true },
    lon: { type: Number, reflect: true },
    centerLat: { type: Number, reflect: true, attribute: 'center-lat' },
    centerLon: { type: Number, reflect: true, attribute: 'center-lon' },
    zoom: { type: Number, reflect: true },
    readonly: { type: Boolean, reflect: true },
    provider: { type: String, reflect: true },
    tiles: { attribute: false },
    unavailable: { type: Boolean, reflect: true }
  };

  static styles = styles;

  /** Where Leaflet is loaded from; it can be changed before the first map is shown */
  static leaflet = { ...LEAFLET };

  /** The catalog of tiles by name; an application can add its own before the maps are drawn */
  static providers = { ...TILE_PROVIDERS };

  /** @type {Promise<boolean> | null} The Leaflet load, once for all maps */
  static #loading = null;

  #localize = new LocalizeController(this);

  /** @type {any} The Leaflet map, once created */
  #map = null;

  /** @type {Promise<boolean> | null} The map being created */
  #creating = null;

  /** @type {ResizeObserver | null} */
  #observer = null;

  /** Whether the map was already tried once without anybody asking (so a failure is not retried by every resize) */
  #autoTried = false;

  /** @type {any} */
  #tileLayer = null;

  /** @type {any} */
  #marker = null;

  /** Where the marker was last drawn, to tell what `lat` and `lon` already say from what they changed to */
  #drawn = { lat: /** @type {number | null} */ (null), lon: /** @type {number | null} */ (null) };

  #pendingZoomIn = false;

  /** @type {{center: [number, number], zoom: number} | null} Where the map was looking when it went away, for when it comes back */
  #view = null;

  /** @type {{key: string, lat: number, lon: number, icon: string, label: string, faded?: boolean}[]} */
  #siteItems = [];

  #fitSites = false;

  /** @type {any} The layer of the sites: emptied and refilled */
  #sites = null;

  /** @type {Map<string, any>} Each drawn site, by its key */
  #siteMarkers = new Map();

  /** @type {string | null} */
  #highlighted = null;

  /** @type {{lat: number, lon: number}[]} */
  #routePoints = [];

  #fitRoute = true;

  /** @type {any} */
  #route = null;

  /** @type {{minutes: number, geometry: any}[]} */
  #areaItems = [];

  #fitAreas = true;

  /** @type {any} */
  #areas = null;

  #lang = '';

  constructor() {
    super();
    /** @type {number | null} */
    this.lat = null;
    /** @type {number | null} */
    this.lon = null;
    this.centerLat = 41.6;
    this.centerLon = 2.2;
    this.zoom = 9;
    this.readonly = false;
    this.provider = 'osm';
    /** @type {{url: string, attribution?: string, maxZoom?: number, subdomains?: string} | null} */
    this.tiles = null;
    this.unavailable = false;
  }

  /** @returns {{lat: number, lon: number} | null} Where the marker is, or null if there is no point */
  get point() {
    return MapPickerState.isPoint(this.lat, this.lon) ? { lat: /** @type {number} */ (this.lat), lon: /** @type {number} */ (this.lon) } : null;
  }

  /** @returns {any} The Leaflet map, or null until it exists */
  get map() {
    return this.#map;
  }

  /**
   * Loads Leaflet, once for all maps: if the page already has `window.L` it is that one, otherwise a script is added to the page from `WaxMapPicker.leaflet`. A failure is not remembered, so the next call tries again.
   *
   * @returns {Promise<boolean>} Whether Leaflet is ready
   */
  static load() {
    WaxMapPicker.#loading ??= /** @type {any} */ (window).L ? Promise.resolve(true) : new Promise(resolve => {
      const { js, jsIntegrity } = WaxMapPicker.leaflet;
      const script = document.createElement('script');
      script.src = js;
      if (jsIntegrity) script.integrity = jsIntegrity;
      script.crossOrigin = '';
      script.onload = () => resolve(true);
      script.onerror = () => {
        script.remove();
        WaxMapPicker.#loading = null;   // no connection now is not no connection forever
        resolve(false);
      };
      document.head.append(script);
    });
    return WaxMapPicker.#loading;
  }

  /**
   * Makes sure the map exists and has measured itself. Nobody needs to call it: the map is created when the element is first visible and measured again when its size changes. It is here for code that
   * wants to wait for the map (`await map.show()`) or to try again after a failure.
   *
   * @returns {Promise<boolean>} false if Leaflet could not be loaded: the element shows its notice
   */
  async show() {
    if (this.#map) {
      this.#map.invalidateSize();
      return true;
    }
    return this.#create();
  }

  /**
   * Puts the marker and looks at it. It does not fire `wax-pick`: that is only for what the user does on the map.
   *
   * @param {number} lat
   * @param {number} lon
   * @param {boolean} [zoomIn] Zoom all the way in; otherwise, only to a comfortable zoom
   */
  setPoint(lat, lon, zoomIn = false) {
    this.lat = lat;
    this.lon = lon;
    this.#drawPoint(zoomIn);
  }

  /**
   * Draws some sites next to the point, each with its little picture (an emoji) and its text on hover. It replaces those there were. They cannot be dragged and do not change the point. If one was
   * highlighted and still is there, it stays highlighted.
   *
   * @param {{key: string, lat: number, lon: number, icon: string, label: string, faded?: boolean}[]} items
   * @param {{fit?: boolean}} [options] `fit`: make the map cover the point and all the sites
   */
  setSites(items, { fit = false } = {}) {
    this.#siteItems = items;
    this.#fitSites = fit;
    this.#drawSites();
  }

  /**
   * Highlights a site: it grows and goes on top of the others, with its text open. If it falls outside what is visible, the map moves until it can be seen.
   *
   * @param {string | null} key The site, or null to turn off the one there was
   * @param {{pan?: boolean}} [options]
   */
  highlightSite(key, { pan = true } = {}) {
    this.#highlighted = key;
    this.#drawHighlight(pan);
  }

  /**
   * Draws a path (a route) on top of the map. It replaces the one there was.
   *
   * @param {{lat: number, lon: number}[]} points
   * @param {{fit?: boolean}} [options] `fit`: make the map cover the whole path
   */
  setRoute(points, { fit = true } = {}) {
    this.#routePoints = points;
    this.#fitRoute = fit;
    this.#drawRoute();
  }

  /** Removes the path */
  clearRoute() {
    this.#routePoints = [];
    this.#drawRoute();
  }

  /**
   * Draws some areas (how far one gets in some minutes), from largest to smallest so that all show, each with a tooltip («20 min»). It replaces those there were.
   *
   * @param {{minutes: number, geometry: any}[]} areas Each with its GeoJSON geometry
   * @param {{fit?: boolean}} [options] `fit`: make the map cover the largest
   */
  setAreas(areas, { fit = true } = {}) {
    this.#areaItems = areas;
    this.#fitAreas = fit;
    this.#drawAreas(true);
  }

  /** Removes the areas */
  clearAreas() {
    this.#areaItems = [];
    this.#drawAreas(false);
  }

  /** Removes the marker: there is no point */
  clear() {
    this.lat = null;
    this.lon = null;
    this.#drawPoint(false);
  }

  connectedCallback() {
    super.connectedCallback();
    this.#autoTried = false;
    // The map is created when the element first has a size, and measured again every time the size changes: no `show()` for whoever puts it in a tab or a dialog
    this.#observer = new ResizeObserver(() => this.#resized());
    this.#observer.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#observer?.disconnect();
    this.#observer = null;
    this.#destroyMap();
  }

  render() {
    const { css, cssIntegrity } = WaxMapPicker.leaflet;
    return html`
      <link rel="stylesheet" href=${css} integrity=${cssIntegrity || nothing} crossorigin="" @load=${() => this.#map?.invalidateSize()}>
      <div part="base" ?hidden=${this.unavailable}></div>
      ${this.unavailable ? html`<div part="unavailable" role="status">${term(this.#localize, 'waxMapUnavailable')}</div>` : nothing}`;
  }

  /** @param {Map<string, any>} changed */
  updated(changed) {
    if (!this.#map) return;
    if (changed.has('lat') || changed.has('lon')) {
      if (this.lat !== this.#drawn.lat || this.lon !== this.#drawn.lon) this.#drawPoint(false);
    }
    if (changed.has('readonly')) this.#drawReadonly();
    if (changed.has('provider') || changed.has('tiles')) this.#drawTiles();
    if (!this.point && (changed.has('centerLat') || changed.has('centerLon') || changed.has('zoom'))) this.#map.setView([this.centerLat, this.centerLon], this.zoom, NOW);
    const lang = this.#localize.lang();
    if (lang !== this.#lang) {
      this.#lang = lang;
      this.#drawAreas(false);   // the tooltips of the areas are made with the words of the language
    }
  }

  #resized() {
    if (this.#map) {
      this.#map.invalidateSize();
    } else if (!this.#autoTried && this.offsetWidth > 0 && this.offsetHeight > 0) {
      this.#autoTried = true;
      this.#create();
    }
  }

  /** @returns {Promise<boolean>} */
  #create() {
    this.#creating ??= (async () => {
      try {
        if (!await WaxMapPicker.load()) {
          this.unavailable = true;
          this.dispatchEvent(new WaxMapErrorEvent({ src: WaxMapPicker.leaflet.js }));
          return false;
        }
        this.unavailable = false;
        await this.updateComplete;   // the container is shown before Leaflet measures it
        if (!this.isConnected) return false;
        this.#build();
        return true;
      } finally {
        this.#creating = null;
      }
    })();
    return this.#creating;
  }

  /** Makes the Leaflet map in the container and draws on it everything that was set before it existed */
  #build() {
    const L = /** @type {any} */ (window).L;
    const container = /** @type {HTMLElement} */ (this.renderRoot.querySelector('[part~="base"]'));
    const view = this.#view;
    this.#map = L.map(container).setView(view?.center ?? [this.centerLat, this.centerLon], view?.zoom ?? this.zoom, NOW);
    this.#view = null;
    this.#map.attributionControl.setPrefix(WaxMapPicker.leaflet.prefix ?? LEAFLET.prefix);
    this.#map.on('click', (/** @type {any} */ event) => {
      if (!this.readonly) this.#pick(event.latlng.lat, event.latlng.lng);
    });
    this.#lang = this.#localize.lang();
    this.#drawTiles();
    this.#drawPoint(this.#pendingZoomIn);
    this.#drawSites();
    this.#drawRoute();
    this.#drawAreas(true);
    this.#map.invalidateSize();
  }

  #destroyMap() {
    if (this.#map) {
      this.#view = { center: [this.#map.getCenter().lat, this.#map.getCenter().lng], zoom: this.#map.getZoom() };
      this.#map.remove();
    }
    this.#map = null;
    this.#tileLayer = this.#marker = this.#sites = this.#route = this.#areas = null;
    this.#siteMarkers.clear();
    this.#drawn = { lat: null, lon: null };
  }

  /** @param {number} lat @param {number} lon */
  #pick(lat, lon) {
    // What the user does does not move the view: the point goes where they put it, with the zoom there was
    this.lat = lat;
    this.lon = lon;
    this.#drawPoint(false, false);
    this.dispatchEvent(new WaxPickEvent({ lat, lon }));
  }

  #drawTiles() {
    const L = /** @type {any} */ (window).L;
    const tiles = MapPickerState.tiles(this.provider, this.tiles, WaxMapPicker.providers);
    this.#tileLayer?.remove();
    this.#tileLayer = L.tileLayer(tiles.url, { maxZoom: tiles.maxZoom, attribution: tiles.attribution, ...(tiles.subdomains ? { subdomains: tiles.subdomains } : {}) }).addTo(this.#map);
  }

  /**
   * @param {boolean} zoomIn
   * @param {boolean} [look] Move the view to the point: not when the user put it there
   */
  #drawPoint(zoomIn, look = true) {
    const point = this.point;
    this.#drawn = { lat: this.lat, lon: this.lon };
    if (!this.#map) {
      this.#pendingZoomIn = zoomIn;
      return;
    }
    if (!point) {
      this.#marker?.remove();
      this.#marker = null;
      return;
    }
    if (this.#marker) {
      this.#marker.setLatLng([point.lat, point.lon]);
    } else {
      const L = /** @type {any} */ (window).L;
      // The default icon finds its images through a stylesheet of the page, which is not there: it is told where they are
      const icon = new L.Icon.Default({ imagePath: MapPickerState.imagePath(WaxMapPicker.leaflet) });
      this.#marker = L.marker([point.lat, point.lon], { icon, draggable: true }).addTo(this.#map);
      this.#marker.on('dragend', () => {
        const { lat, lng } = this.#marker.getLatLng();
        this.#pick(lat, lng);
      });
      this.#drawReadonly();
    }
    this.#pendingZoomIn = false;
    if (look) this.#map.setView([point.lat, point.lon], MapPickerState.zoomFor(this.#map.getZoom(), zoomIn), NOW);
  }

  #drawReadonly() {
    this.#marker?.dragging?.[this.readonly ? 'disable' : 'enable']();
  }

  #drawSites() {
    if (!this.#map) return;
    const L = /** @type {any} */ (window).L;
    this.#sites ??= L.layerGroup().addTo(this.#map);
    this.#sites.clearLayers();
    this.#siteMarkers.clear();
    for (const item of this.#siteItems) {
      const label = document.createElement('span');
      label.textContent = item.label;
      const marker = L.marker([item.lat, item.lon], {
        icon: L.divIcon({ className: MapPickerState.siteClass(item.faded), html: `<span>${MapPickerState.escapeHtml(item.icon)}</span>`, iconSize: [26, 26], iconAnchor: [13, 13] }),
        keyboard: false
      }).bindTooltip(label);
      marker.once('add', () => marker.getElement()?.setAttribute('aria-label', item.label));
      marker.on('click', () => this.dispatchEvent(new WaxSiteClickEvent({ key: item.key })));
      marker.addTo(this.#sites);
      this.#siteMarkers.set(item.key, marker);
    }
    if (this.#highlighted !== null && !this.#siteMarkers.has(this.#highlighted)) this.#highlighted = null;
    this.#drawHighlight(false);

    if (this.#fitSites && this.#siteItems.length) {
      this.#map.fitBounds(MapPickerState.fitPoints(this.#siteItems, this.point), { padding: [24, 24], maxZoom: 17, animate: false });
    }
  }

  /** @param {boolean} pan */
  #drawHighlight(pan) {
    if (!this.#map) return;
    const key = this.#highlighted;
    for (const [k, marker] of this.#siteMarkers) {
      marker.getElement()?.classList.toggle('selected', k === key);
      marker.setZIndexOffset(k === key ? 1000 : 0);
      if (k !== key) marker.closeTooltip();
    }
    const marker = key === null ? null : this.#siteMarkers.get(key);
    if (!marker) return;
    marker.openTooltip();
    if (pan && !this.#map.getBounds().contains(marker.getLatLng())) this.#map.panTo(marker.getLatLng());
  }

  #drawRoute() {
    if (!this.#map) return;
    this.#route?.remove();
    this.#route = null;
    const line = MapPickerState.route(this.#routePoints);
    if (!line) return;
    const L = /** @type {any} */ (window).L;
    this.#route = L.polyline(line, { weight: 5, opacity: 0.85, className: 'route' }).addTo(this.#map);
    if (this.#fitRoute) this.#map.fitBounds(this.#route.getBounds(), { padding: [24, 24], animate: false });
  }

  /** @param {boolean} fit Whether to cover the largest (only when the areas are new: not when they are only drawn again with the words of another language) */
  #drawAreas(fit) {
    if (!this.#map) return;
    this.#areas?.remove();
    this.#areas = null;
    if (!this.#areaItems.length) return;
    const L = /** @type {any} */ (window).L;
    this.#areas = L.layerGroup().addTo(this.#map);
    for (const area of MapPickerState.orderAreas(this.#areaItems)) {
      L.geoJSON(area.geometry, { style: { className: `area area-${area.tone}`, weight: 2, fillOpacity: 0.12 } })
        .bindTooltip(term(this.#localize, 'waxMinutes', area.minutes), { sticky: true }).addTo(this.#areas);
    }
    const biggest = MapPickerState.largestArea(this.#areaItems);
    if (fit && this.#fitAreas && biggest) this.#map.fitBounds(L.geoJSON(biggest.geometry).getBounds(), { padding: [24, 24], animate: false });
  }
}

if (!customElements.get('wax-map-picker')) customElements.define('wax-map-picker', WaxMapPicker);
