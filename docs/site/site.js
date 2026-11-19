// @ts-check

/**
 * The documentation site: reads docs/pages.json, shows the pages (Markdown, rendered with `marked` at runtime) and mounts the live examples of each one (the `html example`
 * blocks, with the same code the browser tests mount). The route is the hash: `#/components/item-list.md`, and `#/components/item-list.md#parts` for a heading.
 */
import { Marked } from 'marked';
import { mountExample } from './examples.js';

const content = /** @type {HTMLElement} */ (document.getElementById('site-content'));
const nav = /** @type {HTMLElement} */ (document.getElementById('site-nav'));

/** @param {string} text @returns {string} The id of a heading: the same rule the links between pages are tested with */
const slug = text => text.toLowerCase().replace(/[^a-z0-9 -]/g, '').trim().replace(/ /g, '-');

/** @param {string} text @returns {string} */
const escape = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** @param {string} from The path of the page that has the link @param {string} to What it links to @returns {string} The path of the target, relative to docs/ */
const resolve = (from, to) => new URL(to, `http://docs/${from}`).pathname.slice(1);

/**
 * @param {string} path The page being rendered
 * @returns {{ marked: Marked, examples: string[] }} A renderer that knows where it is (for the links) and collects the examples
 */
function rendererFor(path) {
  const marked = new Marked();
  /** @type {string[]} */
  const examples = [];
  marked.use({
    renderer: {
      heading: (text, level, raw) => `<h${level} id="${slug(raw)}">${text}<a class="anchor" href="#/${path}#${slug(raw)}" aria-label="Link to this heading">#</a></h${level}>\n`,
      code: (code, info) => {
        const language = (info ?? '').split(/\s+/)[0];
        const source = `<pre class="code"><code${language ? ` class="language-${language}"` : ''}>${escape(code)}</code></pre>`;
        if (!/^html\s+example$/.test(info ?? '')) return source;
        examples.push(code);
        return `<div class="example"><div class="example-result" data-example="${examples.length - 1}"></div><details class="example-code" open><summary>Code</summary>${source}</details></div>\n`;
      },
      table: (header, body) => `<div class="table-scroll"><table><thead>${header}</thead><tbody>${body}</tbody></table></div>\n`,
      link: (href, title, text) => {
        let target = href;
        if (!/^[a-z]+:/i.test(href)) {
          const [file, anchor] = href.split('#');
          target = file ? `#/${resolve(path, file)}${anchor ? `#${anchor}` : ''}` : `#/${path}#${anchor}`;
        }
        const external = /^https?:/.test(href);
        return `<a href="${target}"${title ? ` title="${title}"` : ''}${external ? ' target="_blank" rel="noreferrer"' : ''}>${text}</a>`;
      }
    }
  });
  return { marked, examples };
}

/** @returns {{ path: string, anchor: string }} */
function route() {
  const [, path = 'index.md', anchor = ''] = location.hash.match(/^#\/([^#]*)(?:#(.*))?$/) ?? [];
  return { path: path || 'index.md', anchor };
}

let sections = /** @type {{title: string, pages: {title: string, path: string}[]}[]} */ ([]);
let shown = '';

function drawNav() {
  const { path } = route();
  nav.replaceChildren(...sections.map(section => {
    const group = document.createElement('section');
    const title = document.createElement('h2');
    title.textContent = section.title;
    const list = document.createElement('ul');
    for (const page of section.pages) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#/${page.path}`;
      link.textContent = page.title;
      if (page.path === path) link.setAttribute('aria-current', 'page');
      item.append(link);
      list.append(item);
    }
    group.append(title, list);
    return group;
  }));
}

/** @param {string} anchor */
function scrollToAnchor(anchor) {
  const target = anchor ? document.getElementById(anchor) : null;
  if (target) target.scrollIntoView(); else window.scrollTo(0, 0);
}

async function show() {
  const { path, anchor } = route();
  if (path === shown) { scrollToAnchor(anchor); return; }
  shown = path;
  drawNav();
  document.getElementById('site-nav')?.classList.remove('open');
  document.getElementById('menu-button')?.setAttribute('aria-expanded', 'false');
  const response = await fetch(path);
  if (!response.ok) { content.textContent = `There is no page ${path}.`; return; }
  const { marked, examples } = rendererFor(path);
  content.innerHTML = /** @type {string} */ (marked.parse(await response.text()));
  const title = sections.flatMap(section => section.pages).find(page => page.path === path)?.title;
  document.title = title ? `${title} - webawesome-extras` : 'webawesome-extras';
  scrollToAnchor(anchor);
  // The examples run once the page is in the document, in order: they find their elements by id
  for (const [index, code] of examples.entries()) {
    const result = /** @type {HTMLElement} */ (content.querySelector(`[data-example="${index}"]`));
    try {
      await mountExample(result, code);
    } catch (error) {
      console.error(`${path}, example ${index + 1}:`, error);
      const message = document.createElement('p');
      message.className = 'example-error';
      message.textContent = `This example failed: ${error instanceof Error ? error.message : error}`;
      result.append(message);
    }
  }
}

/** The light or dark theme of Web Awesome: `wa-dark` on the root */
function setupTheme() {
  const root = document.documentElement;
  let dark = matchMedia('(prefers-color-scheme: dark)').matches;
  try { dark = (localStorage.getItem('wax-docs-theme') ?? (dark ? 'dark' : 'light')) === 'dark'; } catch { /* storage may be blocked */ }
  root.classList.toggle('wa-dark', dark);
  document.getElementById('theme-button')?.addEventListener('click', () => {
    const now = root.classList.toggle('wa-dark');
    try { localStorage.setItem('wax-docs-theme', now ? 'dark' : 'light'); } catch { /* storage may be blocked */ }
  });
}

setupTheme();
document.getElementById('menu-button')?.addEventListener('click', event => {
  const open = nav.classList.toggle('open');
  /** @type {HTMLElement} */ (event.currentTarget).setAttribute('aria-expanded', String(open));
});
sections = await (await fetch('pages.json')).json();
addEventListener('hashchange', show);
await show();
