// @ts-check
import { css } from 'lit';

/** The styles of `<wax-floating-card>`, in the shadow of the element: only `--wa-*` tokens, and its own custom properties always falling back to them */
export default css`
  :host { display: none; }
  /* In the middle, the wa-dialog needs the host while it closes */
  :host([open]), :host([centered]) { display: contents; }
  :host([hidden]) { display: none; }
  [part~="card"] {
    position: relative; z-index: 1;
    box-sizing: border-box;
    width: var(--floating-card-width, 400px);
    max-width: 92vw;
    max-height: min(70vh, var(--auto-size-available-height, 70vh));
    max-height: min(70dvh, var(--auto-size-available-height, 70dvh));
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
`;
