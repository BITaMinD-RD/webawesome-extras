// @ts-check
import { registerTranslation } from '@awesome.me/webawesome/dist/utilities/localize.js';

/**
 * The terms of the `wax-*` elements in English, the default language, registered with the `registerTranslation` of Web Awesome like one of its own (`dist/translations/en.js`): they join
 * its terms of the same language code, so the elements ask for them with the same controller. Their names start with `wax` so they never collide with the ones of Web Awesome.
 * To add a language, copy this file to `<code>.js` (`fr.js`), change `$code`, `$name` and the texts, and import it.
 */
const translation = {
  $code: 'en',
  $name: 'English',
  $dir: 'ltr',
  waxCancel: 'Cancel',
  waxDrag: 'Drag to sort',
  waxMapUnavailable: 'The map is not available',
  waxMinutes: (/** @type {number} */ n) => `${n} min`,
  waxMove: 'Move (up and down arrows)',
  waxNew: 'New',
  waxNo: 'No',
  waxNoAll: 'No to all',
  waxNoMatches: 'No matches',
  waxProgress: (/** @type {number} */ n, /** @type {number} */ total) => `${n} of ${total}`,
  waxSearch: 'Search...',
  waxYes: 'Yes',
  waxYesAll: 'Yes to all'
};

registerTranslation(translation);

export default translation;
