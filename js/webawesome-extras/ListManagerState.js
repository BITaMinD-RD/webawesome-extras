// @ts-check

/**
 * What `<wax-list-manager>` decides without a DOM: which entry is chosen, and that clicking the chosen one again does not clear it (a list of entries to edit always has the one
 * being edited marked, unlike a plain `<wax-item-list>`, where a second click clears the selection). The element (`WaxListManager.js`) only draws and listens.
 */
export class ListManagerState {
  /** The chosen entry; `null`, none
   * @type {string | null} */
  current = null;

  /**
   * What the list says when a line is clicked.
   *
   * @param {string | null} key The key the list gives: `null` when the chosen line was clicked again
   * @returns {string | null} The key to announce; `null` if nothing is to be announced (the chosen one stays)
   */
  chosen(key) {
    if (key === null) return null;
    this.current = key;
    return key;
  }
}
