// @ts-check

/**
 * Where the package is served from, like `base-path` of Web Awesome: the folder that has `components/`. It is taken from the `data-webawesome-extras` attribute of any element of the page
 * (usually the script that loads the autoloader), or, without it, from the folder of the script that loads `webawesome-extras.loader.js` or `webawesome-extras.js`.
 */

let basePath = '';

/** @param {string} path */
export function setBasePath(path) {
  basePath = path;
}

/**
 * @param {string} [subpath] What is inside the package (`components/combobox/combobox.js`)
 * @returns {string} The path of the package, with `subpath` after it if there is one
 */
export function getBasePath(subpath = '') {
  if (!basePath) {
    const element = document.querySelector('[data-webawesome-extras]');
    if (element?.hasAttribute('data-webawesome-extras')) {
      setBasePath(new URL(element.getAttribute('data-webawesome-extras') ?? '', window.location.href).pathname);
    } else {
      const script = [...document.getElementsByTagName('script')].find(candidate => /webawesome-extras(\.loader)?\.js(\?|$)/.test(candidate.src));
      if (script) setBasePath(new URL(script.src).pathname.split('/').slice(0, -1).join('/'));
    }
  }
  return basePath.replace(/\/$/, '') + (subpath ? `/${subpath.replace(/^\//, '')}` : '');
}
