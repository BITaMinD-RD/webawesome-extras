// @ts-check

/**
 * What `<wax-item-list>` decides without a DOM: which keys are marked, what a click does, how keys are reordered when a line is moved, when a slide
 * uncovers the action of a line. The element (`item-list.js`) only draws and listens; the rules are here, so they run in Node and are tested there.
 */
export class ItemListState {
  /** The keys marked with Ctrl, Cmd or Shift + click, in the order they were marked
   * @type {Set<string>} */
  marked = new Set();

  /**
   * What a click on a line does.
   *
   * @param {string} key The line that was clicked
   * @param {string | null} selected The line that is selected now
   * @param {boolean} multi Ctrl, Cmd or Shift was down
   * @returns {{type: 'mark', keys: string[]} | {type: 'select', key: string | null}} With a modifier the line is marked, or unmarked if it was; without one it is selected,
   *   or the selection is cleared (`key` null) if it was the selected one
   */
  click(key, selected, multi) {
    if (multi) {
      if (!this.marked.delete(key)) this.marked.add(key);
      return { type: 'mark', keys: [...this.marked] };
    }
    return { type: 'select', key: key === selected ? null : key };
  }

  /** @param {Iterable<string>} keys The keys that are still there: the marks of the others go */
  keep(keys) {
    const present = new Set(keys);
    for (const key of [...this.marked]) if (!present.has(key)) this.marked.delete(key);
  }

  /**
   * @param {string[]} order The keys, as the lines are
   * @param {string} key The one that moves
   * @param {string} over The one it is dragged over
   * @param {boolean} below The pointer is in the lower half of that one
   * @returns {string[]} The keys with `key` put just before `over`, or just after it if `below`; the same order if there is nothing to do
   */
  static dragged(order, key, over, below) {
    if (key === over || !order.includes(key) || !order.includes(over)) return order;
    const rest = order.filter(k => k !== key);
    rest.splice(rest.indexOf(over) + (below ? 1 : 0), 0, key);
    return rest.every((k, i) => k === order[i]) ? order : rest;
  }

  /**
   * @param {string[]} order
   * @param {string} key The one that moves
   * @param {-1 | 1} direction Up (-1) or down (1), one place: what the arrow keys do
   * @returns {string[] | null} The new order, or null if it is already at that end
   */
  static stepped(order, key, direction) {
    const from = order.indexOf(key);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= order.length) return null;
    const next = [...order];
    next.splice(from, 1);
    next.splice(to, 0, key);
    return next;
  }

  /** How far to the left a line has to be slid for its action to stay uncovered, in pixels */
  static SLIDE = 48;

  /**
   * Whether a finger that has moved is sliding a line or scrolling the list: only a movement that is more sideways than down is a slide.
   *
   * @param {number} dx
   * @param {number} dy
   * @returns {'slide' | 'scroll' | 'wait'} `scroll`: more down than sideways, so it is the list scrolling; `wait`: too little to tell yet
   */
  static gesture(dx, dy) {
    if (Math.abs(dx) >= Math.abs(dy) * 1.5) return 'slide';
    return Math.abs(dy) > 10 ? 'scroll' : 'wait';
  }

  /** @param {number} dx How far the finger went sideways, negative to the left @returns {boolean} The action stays uncovered */
  static uncovers(dx) {
    return dx < -ItemListState.SLIDE;
  }
}
