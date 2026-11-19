// @ts-check

/**
 * The live examples of the documentation, shared by the site (which shows them) and the browser tests (which mount every one and fail if it is broken), so that what is
 * tested is what is shown. An example is a fenced block of a page whose info string is `html example`: markup that may have `<script type="module">` blocks, which run
 * once the elements of the example are defined. The scripts find their elements by `id`, so the ids of the examples of a page are unique, and they use no relative imports (they run
 * from a blob): the page has the loaders and the import map.
 */

/** @typedef {{heading: string, code: string}} Example */

/**
 * @param {string} markdown The text of a page
 * @returns {Example[]} Its examples, each with the heading it is under
 */
export function extractExamples(markdown) {
  /** @type {Example[]} */
  const examples = [];
  let heading = '';
  /** @type {{example: boolean, lines: string[]} | null} The fenced block being read */
  let fence = null;
  for (const line of markdown.split('\n')) {
    if (fence) {
      if (/^```\s*$/.test(line)) {
        if (fence.example) examples.push({ heading, code: fence.lines.join('\n') });
        fence = null;
      } else fence.lines.push(line);
    } else if (/^```/.test(line)) {
      fence = { example: /^```html\s+example\s*$/.test(line), lines: [] };
    } else if (/^#{1,6}\s/.test(line)) {
      heading = line.replace(/^#+\s*/, '').trim();
    }
  }
  return examples;
}

const SCRIPT = /<script type="module">([\s\S]*?)<\/script>/g;

/** @param {string} code @returns {string[]} The `wax-*` and `wa-*` tags the markup of the example uses (so they are all waited for) */
export function tagsOf(code) {
  return [...new Set([...code.replace(SCRIPT, '').matchAll(/<(wax?-[a-z0-9-]+)/g)].map(match => match[1]))];
}

/**
 * Puts an example in a container that is already in the page, waits for its elements to be defined, runs its scripts and waits for the elements to draw.
 * It rejects if a tag is not defined in `timeout` milliseconds (the loader does not know it) or if a script throws.
 *
 * @param {HTMLElement} container
 * @param {string} code
 * @param {number} [timeout]
 * @returns {Promise<void>}
 */
export async function mountExample(container, code, timeout = 5000) {
  const scripts = [...code.matchAll(SCRIPT)].map(match => match[1]);
  // Parsed into the page, as the markup of a page is: WebKit does not upgrade what a template engine made after the fact
  container.innerHTML = code.replace(SCRIPT, '');
  const tags = tagsOf(code);
  await Promise.all(tags.map(tag => Promise.race([
    customElements.whenDefined(tag),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`<${tag}> was never defined: the loader does not know it`)), timeout))
  ])));
  for (const script of scripts) {
    const url = URL.createObjectURL(new Blob([script], { type: 'text/javascript' }));
    try { await import(/* @vite-ignore */ url); } finally { URL.revokeObjectURL(url); }
  }
  await Promise.all(tags.map(tag => /** @type {any} */ (container.querySelector(tag))?.updateComplete));
}
