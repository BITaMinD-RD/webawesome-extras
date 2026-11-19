// @ts-check

/**
 * Everything at once, like `webawesome.js` of Web Awesome: defines all the `wax-*` elements and exports the typed events. For a page that does not want the autoloader
 * (`webawesome-extras.loader.js`), or a bundler that builds the elements into the page.
 */
import './components/item-list/item-list.js';
import './components/combobox/combobox.js';
import './components/floating-card/floating-card.js';
import './components/ask-each/ask-each.js';
import './components/list-manager/list-manager.js';

export * from './events/events.js';
