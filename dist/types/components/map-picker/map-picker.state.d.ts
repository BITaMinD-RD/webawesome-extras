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
export const LEAFLET: Readonly<{
    js: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    jsIntegrity: "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    css: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    cssIntegrity: "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    imagePath: "";
    prefix: "<a href=\"https://leafletjs.com\">Leaflet</a>";
}>;
/** The providers of tiles that need no key (and no account), by name. The first one is the default */
export const TILE_PROVIDERS: Readonly<{
    osm: {
        url: string;
        attribution: string;
        maxZoom: number;
    };
    opentopomap: {
        url: string;
        subdomains: string;
        maxZoom: number;
        attribution: string;
    };
    cyclosm: {
        url: string;
        subdomains: string;
        maxZoom: number;
        attribution: string;
    };
    'osm-hot': {
        url: string;
        subdomains: string;
        maxZoom: number;
        attribution: string;
    };
}>;
export const DEFAULT_PROVIDER: "osm";
/** How many tones the areas have: the smallest takes the first, and the tones start again after the last */
export const AREA_TONES: 5;
/** The zoom at which a point is looked at closely, and the least one at which it is looked at comfortably */
export const CLOSE_ZOOM: 17;
export const COMFORTABLE_ZOOM: 15;
export class MapPickerState {
    /**
     * The tiles to draw. Custom tiles (with a `url`) win over the provider; a provider that is not in the catalog is the default one.
     *
     * @param {string | null | undefined} provider The name of a provider of the catalog
     * @param {TileSource | null | undefined} [custom] Tiles of one's own
     * @param {Record<string, TileSource>} [catalog]
     * @returns {Tiles}
     */
    static tiles(provider: string | null | undefined, custom?: TileSource | null | undefined, catalog?: Record<string, TileSource>): Tiles;
    /**
     * The areas from the largest to the smallest, so that all of them show when they are drawn one over the other, each with its tone: the smallest has the first, the next the second, and so on (and they start again).
     *
     * @template {{minutes: number}} T
     * @param {T[]} areas
     * @returns {(T & {tone: number})[]}
     */
    static orderAreas<T extends {
        minutes: number;
    }>(areas: T[]): (T & {
        tone: number;
    })[];
    /**
     * @template {{minutes: number}} T
     * @param {T[]} areas
     * @returns {T | null} The largest (the first one when several are as large), or null if there are none
     */
    static largestArea<T_1 extends {
        minutes: number;
    }>(areas: T_1[]): T_1;
    /**
     * How far the map zooms when it looks at a point: all the way in if asked, and otherwise to a comfortable zoom, unless it is already closer.
     *
     * @param {number} current The zoom now
     * @param {boolean} [zoomIn]
     * @returns {number}
     */
    static zoomFor(current: number, zoomIn?: boolean): number;
    /**
     * @param {unknown} lat
     * @param {unknown} lon
     * @returns {boolean} Whether they are a place on Earth (numbers in range), so that attributes with nothing or with rubbish are no point
     */
    static isPoint(lat: unknown, lon: unknown): boolean;
    /**
     * @param {{lat: number, lon: number}[]} points
     * @returns {[number, number][] | null} The points of a path as Leaflet wants them, or null if they are not enough to draw a line
     */
    static route(points: {
        lat: number;
        lon: number;
    }[]): [number, number][] | null;
    /**
     * What the map has to cover when it fits the sites: all of them and the point, if there is one.
     *
     * @param {{lat: number, lon: number}[]} sites
     * @param {{lat: number, lon: number} | null} point
     * @returns {[number, number][]}
     */
    static fitPoints(sites: {
        lat: number;
        lon: number;
    }[], point: {
        lat: number;
        lon: number;
    } | null): [number, number][];
    /**
     * @param {string} text
     * @returns {string} The text that is safe to put in HTML (the picture of a site is an emoji, but it is still text)
     */
    static escapeHtml(text: string): string;
    /**
     * @param {boolean} [faded]
     * @returns {string} The classes of the picture of a site
     */
    static siteClass(faded?: boolean): string;
    /**
     * Where the images of the default marker are: the one given, or the folder `images/` next to the stylesheet of Leaflet.
     *
     * @param {{css: string, imagePath?: string}} leaflet
     * @returns {string} Always ends in a slash
     */
    static imagePath(leaflet: {
        css: string;
        imagePath?: string;
    }): string;
}
/**
 * What `<wax-map-picker>` decides without a DOM: which tiles to draw (the catalog of providers that need no key, the custom ones and the fallback), in which order the areas are drawn and
 * which tone each one takes, how far the map zooms when it looks at a point, and what is a valid point. The element (`map-picker.js`) only draws and listens; the rules are here, so
 * they run in Node and are tested there.
 */
export type TileSource = {
    /**
     * The template of the tiles, with `{z}`, `{x}`, `{y}` and, if there are subdomains, `{s}`
     */
    url: string;
    /**
     * What the provider asks to show on the map, as HTML
     */
    attribution?: string;
    maxZoom?: number;
    /**
     * One letter per subdomain (`abc`)
     */
    subdomains?: string;
};
/**
 * What `<wax-map-picker>` decides without a DOM: which tiles to draw (the catalog of providers that need no key, the custom ones and the fallback), in which order the areas are drawn and
 * which tone each one takes, how far the map zooms when it looks at a point, and what is a valid point. The element (`map-picker.js`) only draws and listens; the rules are here, so
 * they run in Node and are tested there.
 */
export type Tiles = {
    /**
     * The provider that was used (`osm` when the one asked for is not known or the tiles are custom)
     */
    name: string;
    url: string;
    attribution: string;
    maxZoom: number;
    subdomains?: string;
};
