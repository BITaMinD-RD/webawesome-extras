// @ts-check
import { css } from 'lit';

/** The styles of `<wax-floating-card>`, in the shadow of the element: only `--wa-*` tokens, and its own custom properties always falling back to them */
export default css`
  :host { display: none; position: absolute; z-index: 30; width: max-content; }
  :host([open]) { display: block; }
  :host([hidden]) { display: none; }
  [part~="card"] {
    position: relative; z-index: 1;
    box-sizing: border-box;
    width: var(--floating-card-width, 400px);
    max-width: 92vw;
    max-height: 70vh;
    max-height: 70dvh;
    overflow: auto;
    padding: 12px 14px;
    border: var(--wa-border-width-s, 1px) var(--wa-border-style, solid) var(--wa-color-surface-border);
    border-radius: var(--wa-border-radius-l);
    background: var(--wa-color-surface-default);
    box-shadow: var(--floating-card-shadow, var(--wa-shadow-l));
  }
  /* Only peeking, it cannot be used until it is pinned with a click */
  :host([peeking]) [part~="card"] { box-shadow: var(--floating-card-peek-shadow, var(--wa-shadow-m)); }
  :host([peeking]) [part~="close-button"] { display: none; }
  [part~="close-button"] {
    float: right;
    border: none;
    background: none;
    color: var(--wa-color-text-quiet);
    font-size: var(--wa-font-size-l);
    line-height: 1;
    cursor: pointer;
  }
  [part~="close-button"]:hover { color: var(--wa-color-text-normal); }
  [part~="close-button"]:focus-visible { outline: var(--wa-focus-ring); }
  /* Without a mouse: in the middle, and the rest dimmed */
  :host([centered]) { position: fixed; inset: 0; width: auto; }
  :host([centered][open]) { display: grid; place-items: center; }
  [part~="backdrop"] { position: absolute; inset: 0; background: var(--floating-card-backdrop, rgba(0, 0, 0, .45)); backdrop-filter: blur(2px); }
  :host([centered]) [part~="card"] {
    width: min(92vw, 560px);
    max-height: 80vh;
    max-height: calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
    box-shadow: var(--floating-card-centered-shadow, var(--wa-shadow-l));
  }
`;
