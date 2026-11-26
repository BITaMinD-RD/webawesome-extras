/** @param {string} path */
export function setBasePath(path: string): void;
/**
 * @param {string} [subpath] What is inside the package (`components/combobox/combobox.js`)
 * @returns {string} The path of the package, with `subpath` after it if there is one
 */
export function getBasePath(subpath?: string): string;
