// @ts-check
import { css } from 'lit';

/**
 * The styles of `<wax-map-picker>`, in the shadow of the element: only `--wa-*` tokens, and its own custom properties always falling back to them. Leaflet's own stylesheet is linked
 * next to these (it has to be inside the shadow root too), and these come after it, so they win where they overlap.
 */
export default css`
  :host { display: block; position: relative; height: var(--map-picker-height, 300px); border-radius: var(--wa-border-radius-m); }
  :host([hidden]) { display: none; }

  /* The map. Its panes have z-indexes of their own (up to 1000), which must not climb over the rest of the page */
  [part~="base"].leaflet-container, [part~="base"] {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    isolation: isolate;
    overflow: hidden;
    border: var(--wa-border-width-s) var(--wa-border-style) var(--wa-color-neutral-border-normal);
    border-radius: inherit;
    background: var(--wa-color-neutral-fill-quiet);
    font-family: inherit;
    font-size: var(--wa-font-size-s);
  }
  [part~="base"][hidden] { display: none; }

  /* The map is not there: a quiet notice instead */
  [part~="unavailable"] {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding: var(--wa-space-m);
    border: var(--wa-border-width-s) var(--wa-border-style) var(--wa-color-neutral-border-normal);
    border-radius: inherit;
    background: var(--wa-color-neutral-fill-quiet);
    color: var(--wa-color-text-quiet);
    text-align: center;
  }

  /* The sites drawn next to the point, each with its emoji in a circle. The circle is the span inside: Leaflet places the outer one with a transform, which cannot be scaled */
  .map-site span {
    display: block;
    box-sizing: border-box;
    width: 26px;
    height: 26px;
    line-height: 24px;
    text-align: center;
    font-size: var(--wa-font-size-m);
    background: var(--wa-color-surface-default);
    border: var(--wa-border-width-s) var(--wa-border-style) var(--wa-color-neutral-border-loud, var(--wa-color-neutral-border-normal));
    border-radius: 50%;
    box-shadow: var(--wa-shadow-s);
    transition: transform .15s, box-shadow .15s;
  }
  .map-site.faded span { opacity: .35; }
  /* Highlighted: bigger, with a ring of the brand colour */
  .map-site.selected span {
    transform: scale(1.5);
    border-color: var(--map-picker-site-ring, var(--wa-color-brand-border-loud));
    box-shadow: 0 0 0 4px var(--map-picker-site-ring, var(--wa-color-brand-fill-loud)), var(--wa-shadow-m);
    opacity: 1;
  }

  /* The route: a line over the map */
  path.route {
    stroke: var(--map-picker-route, var(--wa-color-brand-fill-loud));
  }

  /* The areas, each with the tone of its size: the smallest takes the first, and the tones start again after the fifth */
  path.area { stroke: var(--area); fill: var(--area); }
  path.area-0 { --area: var(--map-picker-area-1, var(--wa-color-success-fill-loud)); }
  path.area-1 { --area: var(--map-picker-area-2, var(--wa-color-warning-fill-loud)); }
  path.area-2 { --area: var(--map-picker-area-3, var(--wa-color-danger-fill-loud)); }
  path.area-3 { --area: var(--map-picker-area-4, var(--wa-color-purple-50)); }
  path.area-4 { --area: var(--map-picker-area-5, var(--wa-color-brand-fill-loud)); }

  /* What Leaflet draws on top, with the surface and the text of the theme */
  .leaflet-bar a, .leaflet-bar a:focus {
    background-color: var(--wa-color-surface-default);
    color: var(--wa-color-text-normal);
    border-bottom-color: var(--wa-color-neutral-border-normal);
  }
  .leaflet-bar a:hover { background-color: var(--wa-color-neutral-fill-quiet); color: var(--wa-color-text-normal); }
  .leaflet-bar a.leaflet-disabled { background-color: var(--wa-color-neutral-fill-quiet); color: var(--wa-color-text-quiet); }
  .leaflet-touch .leaflet-bar { border: var(--wa-border-width-s) var(--wa-border-style) var(--wa-color-neutral-border-normal); }
  .leaflet-container .leaflet-control-attribution {
    background: color-mix(in srgb, var(--wa-color-surface-default) 80%, transparent);
    color: var(--wa-color-text-quiet);
  }
  .leaflet-container .leaflet-control-attribution a { color: var(--wa-color-text-link); }
  .leaflet-tooltip {
    background: var(--wa-color-surface-raised);
    color: var(--wa-color-text-normal);
    border-color: var(--wa-color-neutral-border-normal);
    border-radius: var(--wa-border-radius-s);
    box-shadow: var(--wa-shadow-s);
    font-family: inherit;
    font-size: var(--wa-font-size-s);
  }
`;
