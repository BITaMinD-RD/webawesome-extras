// @ts-check
import { LocalizeController } from '@awesome.me/webawesome/dist/utilities/localize.js';
import en from '../translations/en.js';

/**
 * The localisation of the `wax-*` elements is the one of Web Awesome: its `LocalizeController` (from `@shoelace-style/localize`) reads `lang` of the element or of `<html>`, picks the registered
 * translation of that language and draws the element again when `lang` of `<html>` changes. The terms of this package are registered in the same registry (`translations/`), with the
 * English one always loaded as the default. This file only gives the elements the controller and a way to ask for a term by the names of this package.
 */
export { LocalizeController };

/**
 * @param {LocalizeController} localize The controller of the element
 * @param {string} key The name of the term (`waxYes`)
 * @param {...any} args What a term that is a function takes
 * @returns {string}
 */
export function term(localize, key, ...args) {
  // The fallback of the registry is the first translation registered, the English of Web Awesome as it came, which does not have our terms: for a language we do not have, English is asked here
  if (!localize.exists(/** @type {any} */ (key), {})) {
    const english = /** @type {any} */ (en)[key];
    return typeof english === 'function' ? english(...args) : english;
  }
  return /** @type {any} */ (localize).term(key, ...args);
}
