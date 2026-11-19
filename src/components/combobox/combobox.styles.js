// @ts-check
import { css } from 'lit';

/** The styles of `<wax-combobox>`, in the shadow of the element: only `--wa-*` tokens, and its own custom properties always falling back to them */
export default css`
  :host { display: block; min-width: 0; margin-bottom: var(--combobox-gap, var(--wa-space-m)); --wa-form-control-required-content: ''; }
  :host([hidden]) { display: none; }
  [part~="search"] { margin: var(--wa-space-3xs); }
  [part~="none"] { color: var(--wa-color-text-quiet); }
`;
