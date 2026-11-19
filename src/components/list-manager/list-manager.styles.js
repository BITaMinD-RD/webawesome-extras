// @ts-check
import { css } from 'lit';

/** The styles of `<wax-list-manager>`, in the shadow of the element: only `--wa-*` tokens, and its own custom properties always falling back to them */
export default css`
  :host { display: block; }
  :host([hidden]) { display: none; }
  [part~="actions"] { display: flex; flex-wrap: wrap; align-items: center; gap: var(--wa-space-m); margin-bottom: var(--wa-space-m); }
  [part~="new-button"] { margin: 0; }
  [part~="items"] { margin: 0; max-height: 70vh; overflow-y: auto; font-size: var(--wa-font-size-xs); }
  @media (max-width: 640px) {
    [part~="items"] { max-height: 30vh; }
  }
`;
