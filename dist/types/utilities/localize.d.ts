/**
 * @param {LocalizeController} localize The controller of the element
 * @param {string} key The name of the term (`waxYes`)
 * @param {...any} args What a term that is a function takes
 * @returns {string}
 */
export function term(localize: LocalizeController, key: string, ...args: any[]): string;
export { LocalizeController };
import { LocalizeController } from '@awesome.me/webawesome/dist/utilities/localize.js';
