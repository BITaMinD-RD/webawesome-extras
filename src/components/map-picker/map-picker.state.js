// @ts-check

/**
 * What `<wax-map-picker>` decides without a DOM: which tiles to draw (the catalog of providers that need no key, the custom ones and the fallback), in which order the areas are drawn and
 * which tone each one takes, how far the map zooms when it looks at a point, and what is a valid point. The element (`map-picker.js`) only draws and listens; the rules are here, so
 * they run in Node and are tested there.
 *
 * @typedef {object} TileSource
 * @property {string} url The template of the tiles, with `{z}`, `{x}`, `{y}` and, if there are subdomains, `{s}`
 * @property {string} [attribution] What the provider asks to show on the map, as HTML
 * @property {number} [maxZoom]
 * @property {string} [subdomains] One letter per subdomain (`abc`)
 *
 * @typedef {object} Tiles
 * @property {string} name The provider that was used (`osm` when the one asked for is not known or the tiles are custom)
 * @property {string} url
 * @property {string} attribution
 * @property {number} maxZoom
 * @property {string} [subdomains]
 */

/** Where Leaflet comes from by default: the files of version 1.9.4, with the integrity of each, which the element checks. An application can serve its own copy (`WaxMapPicker.leaflet`) */
export const LEAFLET = Object.freeze({
  js: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  jsIntegrity: 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=',
  css: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  cssIntegrity: 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=',
  // The images of the default marker; when it is empty they are next to the stylesheet (`images/`)
  imagePath: '',
  // What goes before the attributions of the tiles, as HTML: a plain link to Leaflet, without the flag that Leaflet adds by default since 1.8
  prefix: '<a href="https://leafletjs.com">Leaflet</a>'
});

const OSM = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** The providers of tiles that need no key (and no account), by name. The first one is the default */
export const TILE_PROVIDERS = Object.freeze({
  osm: { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: OSM, maxZoom: 19 },
  opentopomap: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', subdomains: 'abc', maxZoom: 17,
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  },
  cyclosm: {
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', subdomains: 'abc', maxZoom: 20,
    attribution: `<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: ${OSM}`
  },
  'osm-hot': {
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', subdomains: 'abc', maxZoom: 20,
    attribution: `${OSM}. Tiles style by <a href="https://www.hotosm.org/">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/">OpenStreetMap France</a>`
  }
});

export const DEFAULT_PROVIDER = 'osm';

/** How many tones the areas have: the smallest takes the first, and the tones start again after the last */
export const AREA_TONES = 5;

/** The zoom at which a point is looked at closely, and the least one at which it is looked at comfortably */
export const CLOSE_ZOOM = 17;
export const COMFORTABLE_ZOOM = 15;

export class MapPickerState {
  /**
   * The tiles to draw. Custom tiles (with a `url`) win over the provider; a provider that is not in the catalog is the default one.
   *
   * @param {string | null | undefined} provider The name of a provider of the catalog
   * @param {TileSource | null | undefined} [custom] Tiles of one's own
   * @param {Record<string, TileSource>} [catalog]
   * @returns {Tiles}
   */
  static tiles(provider, custom, catalog = TILE_PROVIDERS) {
    if (custom && typeof custom.url === 'string' && custom.url) {
      return { name: DEFAULT_PROVIDER, url: custom.url, attribution: custom.attribution ?? '', maxZoom: custom.maxZoom ?? 19, ...(custom.subdomains ? { subdomains: custom.subdomains } : {}) };
    }
    const wanted = String(provider ?? '').trim().toLowerCase();
    const name = Object.hasOwn(catalog, wanted) ? wanted : DEFAULT_PROVIDER;
    const { url, attribution = '', maxZoom = 19, subdomains } = catalog[name];
    return { name, url, attribution, maxZoom, ...(subdomains ? { subdomains } : {}) };
  }

  /**
   * The areas from the largest to the smallest, so that all of them show when they are drawn one over the other, each with its tone: the smallest has the first, the next the second, and so on (and they start again).
   *
   * @template {{minutes: number}} T
   * @param {T[]} areas
   * @returns {(T & {tone: number})[]}
   */
  static orderAreas(areas) {
    return [...areas].sort((a, b) => b.minutes - a.minutes).map((area, index, all) => ({ ...area, tone: (all.length - 1 - index) % AREA_TONES }));
  }

  /**
   * @template {{minutes: number}} T
   * @param {T[]} areas
   * @returns {T | null} The largest (the first one when several are as large), or null if there are none
   */
  static largestArea(areas) {
    return areas.reduce((/** @type {T | null} */ best, area) => (best === null || area.minutes > best.minutes ? area : best), null);
  }

  /**
   * How far the map zooms when it looks at a point: all the way in if asked, and otherwise to a comfortable zoom, unless it is already closer.
   *
   * @param {number} current The zoom now
   * @param {boolean} [zoomIn]
   * @returns {number}
   */
  static zoomFor(current, zoomIn = false) {
    return zoomIn ? CLOSE_ZOOM : Math.max(current, COMFORTABLE_ZOOM);
  }

  /**
   * @param {unknown} lat
   * @param {unknown} lon
   * @returns {boolean} Whether they are a place on Earth (numbers in range), so that attributes with nothing or with rubbish are no point
   */
  static isPoint(lat, lon) {
    return typeof lat === 'number' && typeof lon === 'number' && Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
  }

  /**
   * @param {{lat: number, lon: number}[]} points
   * @returns {[number, number][] | null} The points of a path as Leaflet wants them, or null if they are not enough to draw a line
   */
  static route(points) {
    const valid = points.filter(point => MapPickerState.isPoint(point.lat, point.lon));
    return valid.length < 2 ? null : valid.map(point => [point.lat, point.lon]);
  }

  /**
   * What the map has to cover when it fits the sites: all of them and the point, if there is one.
   *
   * @param {{lat: number, lon: number}[]} sites
   * @param {{lat: number, lon: number} | null} point
   * @returns {[number, number][]}
   */
  static fitPoints(sites, point) {
    const points = /** @type {[number, number][]} */ (sites.map(site => [site.lat, site.lon]));
    if (point) points.push([point.lat, point.lon]);
    return points;
  }

  /**
   * @param {string} text
   * @returns {string} The text that is safe to put in HTML (the picture of a site is an emoji, but it is still text)
   */
  static escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, character => /** @type {Record<string, string>} */ ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  }

  /**
   * @param {boolean} [faded]
   * @returns {string} The classes of the picture of a site
   */
  static siteClass(faded = false) {
    return faded ? 'map-site faded' : 'map-site';
  }

  /**
   * Where the images of the default marker are: the one given, or the folder `images/` next to the stylesheet of Leaflet.
   *
   * @param {{css: string, imagePath?: string}} leaflet
   * @returns {string} Always ends in a slash
   */
  static imagePath(leaflet) {
    const path = leaflet.imagePath || leaflet.css.replace(/[^/]*$/, 'images/');
    return path.endsWith('/') ? path : `${path}/`;
  }
}
