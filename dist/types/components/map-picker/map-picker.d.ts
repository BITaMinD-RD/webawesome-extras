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
    static properties: {
        lat: {
            type: NumberConstructor;
            reflect: boolean;
        };
        lon: {
            type: NumberConstructor;
            reflect: boolean;
        };
        centerLat: {
            type: NumberConstructor;
            reflect: boolean;
            attribute: string;
        };
        centerLon: {
            type: NumberConstructor;
            reflect: boolean;
            attribute: string;
        };
        zoom: {
            type: NumberConstructor;
            reflect: boolean;
        };
        readonly: {
            type: BooleanConstructor;
            reflect: boolean;
        };
        provider: {
            type: StringConstructor;
            reflect: boolean;
        };
        tiles: {
            attribute: boolean;
        };
        unavailable: {
            type: BooleanConstructor;
            reflect: boolean;
        };
    };
    static styles: import("lit").CSSResult;
    /** Where Leaflet is loaded from; it can be changed before the first map is shown */
    static leaflet: {
        js: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        jsIntegrity: "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
        css: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        cssIntegrity: "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
        imagePath: "";
        prefix: "<a href=\"https://leafletjs.com\">Leaflet</a>";
    };
    /** The catalog of tiles by name; an application can add its own before the maps are drawn */
    static providers: {
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
    };
    /** @type {Promise<boolean> | null} The Leaflet load, once for all maps */
    static "__#8@#loading": Promise<boolean> | null;
    /**
     * Loads Leaflet, once for all maps: if the page already has `window.L` it is that one, otherwise a script is added to the page from `WaxMapPicker.leaflet`. A failure is not remembered, so the next call tries again.
     *
     * @returns {Promise<boolean>} Whether Leaflet is ready
     */
    static load(): Promise<boolean>;
    /** @type {number | null} */
    lat: number | null;
    /** @type {number | null} */
    lon: number | null;
    centerLat: number;
    centerLon: number;
    zoom: number;
    readonly: boolean;
    provider: string;
    /** @type {{url: string, attribution?: string, maxZoom?: number, subdomains?: string} | null} */
    tiles: {
        url: string;
        attribution?: string;
        maxZoom?: number;
        subdomains?: string;
    } | null;
    unavailable: boolean;
    /** @returns {{lat: number, lon: number} | null} Where the marker is, or null if there is no point */
    get point(): {
        lat: number;
        lon: number;
    };
    /** @returns {any} The Leaflet map, or null until it exists */
    get map(): any;
    /**
     * Makes sure the map exists and has measured itself. Nobody needs to call it: the map is created when the element is first visible and measured again when its size changes. It is here for code that
     * wants to wait for the map (`await map.show()`) or to try again after a failure.
     *
     * @returns {Promise<boolean>} false if Leaflet could not be loaded: the element shows its notice
     */
    show(): Promise<boolean>;
    /**
     * Puts the marker and looks at it. It does not fire `wax-pick`: that is only for what the user does on the map.
     *
     * @param {number} lat
     * @param {number} lon
     * @param {boolean} [zoomIn] Zoom all the way in; otherwise, only to a comfortable zoom
     */
    setPoint(lat: number, lon: number, zoomIn?: boolean): void;
    /**
     * Draws some sites next to the point, each with its little picture (an emoji) and its text on hover. It replaces those there were. They cannot be dragged and do not change the point. If one was
     * highlighted and still is there, it stays highlighted.
     *
     * @param {{key: string, lat: number, lon: number, icon: string, label: string, faded?: boolean}[]} items
     * @param {{fit?: boolean}} [options] `fit`: make the map cover the point and all the sites
     */
    setSites(items: {
        key: string;
        lat: number;
        lon: number;
        icon: string;
        label: string;
        faded?: boolean;
    }[], { fit }?: {
        fit?: boolean;
    }): void;
    /**
     * Highlights a site: it grows and goes on top of the others, with its text open. If it falls outside what is visible, the map moves until it can be seen.
     *
     * @param {string | null} key The site, or null to turn off the one there was
     * @param {{pan?: boolean}} [options]
     */
    highlightSite(key: string | null, { pan }?: {
        pan?: boolean;
    }): void;
    /**
     * Draws a path (a route) on top of the map. It replaces the one there was.
     *
     * @param {{lat: number, lon: number}[]} points
     * @param {{fit?: boolean}} [options] `fit`: make the map cover the whole path
     */
    setRoute(points: {
        lat: number;
        lon: number;
    }[], { fit }?: {
        fit?: boolean;
    }): void;
    /** Removes the path */
    clearRoute(): void;
    /**
     * Draws some areas (how far one gets in some minutes), from largest to smallest so that all show, each with a tooltip («20 min»). It replaces those there were.
     *
     * @param {{minutes: number, geometry: any}[]} areas Each with its GeoJSON geometry
     * @param {{fit?: boolean}} [options] `fit`: make the map cover the largest
     */
    setAreas(areas: {
        minutes: number;
        geometry: any;
    }[], { fit }?: {
        fit?: boolean;
    }): void;
    /** Removes the areas */
    clearAreas(): void;
    /** Removes the marker: there is no point */
    clear(): void;
    render(): import("lit-html").TemplateResult<1>;
    /** @param {Map<string, any>} changed */
    updated(changed: Map<string, any>): void;
    #private;
}
import { LitElement } from 'lit';
