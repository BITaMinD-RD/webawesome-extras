// @ts-check
import { css } from 'lit';

/** The styles of `<wax-item-list>`, in the shadow of the element: only `--wa-*` tokens, and its own custom properties always falling back to them */
export default css`
  :host { display: block; overflow-y: auto; }
  :host([hidden]) { display: none; }
  ul { list-style: none; margin: 0; padding: 0; }
  li {
    display: flex; flex-wrap: wrap; gap: var(--wa-space-3xs) var(--wa-space-xs); align-items: baseline;
    padding: var(--wa-space-2xs); border-bottom: var(--wa-border-width-s) var(--wa-border-style) var(--item-border, var(--wa-color-neutral-border-quiet));
    cursor: pointer;
  }
  li:hover { background: var(--item-hover, var(--wa-color-neutral-fill-quiet)); }
  li:focus-visible { outline: var(--wa-focus-ring); outline-offset: calc(-1 * var(--wa-border-width-m)); }
  [part~="icon"] { font-size: var(--wa-font-size-m); }
  /* The name takes what is left of the line next to the icon, and breaks inside itself; the note and the rest go below if they do not fit */
  [part~="name"] { flex: 1 1 8em; min-width: 0; overflow-wrap: anywhere; }
  [part~="note"] { color: var(--item-muted, var(--wa-color-text-quiet)); font-size: var(--wa-font-size-xs); }
  [part~="empty"] { padding: var(--wa-space-2xs); color: var(--item-muted, var(--wa-color-text-quiet)); cursor: default; }
  [part~="empty"]:hover { background: none; }
  /* Chosen: the one lit on the map */
  li.selected { background: var(--item-selected, var(--wa-color-brand-fill-quiet)); box-shadow: inset 3px 0 0 var(--item-accent, var(--wa-color-brand-fill-loud)); }
  /* Marked with Ctrl + click */
  li.marked { outline: 2px dashed var(--item-accent, var(--wa-color-brand-fill-loud)); outline-offset: -2px; }
  li.faded [part~="name"] { text-decoration: line-through; opacity: .65; }
  /* Moving a line: its handle, and the line while it is dragged */
  [part~="handle"] { cursor: grab; touch-action: none; padding: 0 var(--wa-space-2xs); color: var(--item-muted, var(--wa-color-text-quiet)); user-select: none; }
  li.dragging { opacity: .6; background: var(--item-selected, var(--wa-color-brand-fill-quiet)); }
  /* Swiping a line: it follows the finger, and once slid its action shows at the end */
  :host([swipe-label]) li { touch-action: pan-y; transition: transform .15s; }
  [part~="swipe"] {
    display: none; margin-left: auto; border: 0; border-radius: var(--wa-border-radius-s); padding: var(--wa-space-2xs) var(--wa-space-s);
    background: var(--item-danger, var(--wa-color-danger-fill-loud)); color: var(--wa-color-danger-on-loud); font: inherit;
  }
  li.swiped [part~="swipe"] { display: inline-block; }
  /* What can go wrong with one tap (removing) shows only when the line is under the mouse or has the focus; on a touch screen with swiping, not at all. What a line holds is the
     page's, so the shadow cannot style it: the slot says it through custom properties, which the slotted controls inherit and the page's control reads */
  slot { --item-risky-visibility: hidden; }
  li:hover slot, li:focus-within slot { --item-risky-visibility: visible; }
  @media (hover: none) { :host([swipe-label]) slot { --item-risky-visibility: hidden; --item-risky-width: 0; } }
`;
