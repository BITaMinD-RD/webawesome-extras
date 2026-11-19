// @ts-check
import { css } from 'lit';

/** The styles of `<wax-list-manager>`, in the shadow of the element: only `--wa-*` tokens, and its own custom properties always falling back to them */
export default css`
  :host { display: block; }
  :host([hidden]) { display: none; }
  /* The label is the name of the box for who does not see it: visually hidden, but there for the box to be named by it */
  [part~="search"]::part(form-control-label) { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  [part~="actions"] { display: flex; flex-wrap: wrap; align-items: center; gap: var(--wa-space-m); margin-bottom: var(--wa-space-m); }
  [part~="new-button"] { margin: 0; }
  [part~="items"] { margin: 0; max-height: 70vh; overflow-y: auto; font-size: var(--wa-font-size-xs); }
  @media (max-width: 640px) {
    [part~="items"] { max-height: 30vh; }
  }
`;
