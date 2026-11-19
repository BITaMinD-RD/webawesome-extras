// @ts-check
import { css } from 'lit';

/** The styles of `<wax-ask-each>`, in the shadow of the element: only `--wa-*` tokens, and its own custom properties always falling back to them */
export default css`
  :host { display: contents; }
  wa-dialog { --width: var(--ask-each-width, 31rem); }
  [part~="progress"] { margin: 10px 0 0; font-size: var(--wa-font-size-s); color: var(--wa-color-text-quiet); }
`;
