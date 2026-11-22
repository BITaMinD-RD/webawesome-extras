// @ts-check

/**
 * The gallery of the components page: a card per element, made from data. The name and the page come from docs/pages.json (the entries of docs/components), the tag, the sentence
 * (`@summary`) and the version (`@since`) from custom-elements.json, which take them from the JSDoc of each element, and the small live preview from the `preview` field of the entry of
 * the page in docs/pages.json: markup like the one of an `html example` block, that `mountExample` mounts. Nothing is written by hand per card.
 */
import { mountExample } from './examples.js';

/** @typedef {{title: string, path: string, preview?: string}} Page */
/** @typedef {{name: string, tag: string, summary: string, since: string, path: string, preview: string}} Card */

/**
 * @param {{title: string, pages: Page[]}[]} sections The content of docs/pages.json
 * @param {{modules?: {declarations?: any[]}[]}} manifest The content of custom-elements.json
 * @returns {Card[]} A card for each element of the manifest, in the order of the pages; it throws if an element has no page with a preview, no summary or no version
 */
export function cardsOf(sections, manifest) {
  const pages = sections.flatMap(section => section.pages);
  const elements = (manifest.modules ?? []).flatMap(module => module.declarations ?? []).filter(declaration => declaration.customElement && declaration.tagName);
  const cards = elements.map(element => {
    const path = `components/${element.tagName.replace(/^wax-/, '')}.md`;
    const page = pages.find(candidate => candidate.path === path);
    if (!page) throw new Error(`${element.tagName} has no page ${path} in docs/pages.json`);
    if (!page.preview) throw new Error(`${element.tagName}: its entry in docs/pages.json has no "preview"`);
    if (!element.summary) throw new Error(`${element.tagName} has no @summary in its JSDoc`);
    if (!element.since) throw new Error(`${element.tagName} has no @since in its JSDoc`);
    return { name: page.title, tag: element.tagName, summary: element.summary, since: element.since, path, preview: page.preview };
  });
  const order = pages.map(page => page.path);
  return cards.sort((a, b) => order.indexOf(a.path) - order.indexOf(b.path));
}

/**
 * Draws the cards in the container and mounts the preview of each one (they do not wait for each other, and one that fails does not stop the rest).
 *
 * @param {HTMLElement} container
 * @param {Card[]} cards
 * @returns {Promise<void>} It settles when every preview is mounted or has failed
 */
export async function renderGallery(container, cards) {
  const list = document.createElement('ul');
  list.className = 'gallery';
  /** @type {Promise<void>[]} */
  const mounted = [];
  for (const card of cards) {
    const item = document.createElement('li');
    item.className = 'gallery-card';
    const title = document.createElement('h3');
    const link = document.createElement('a');
    link.href = `#/${card.path}`;
    link.textContent = card.name;
    title.append(link);
    const tag = document.createElement('code');
    tag.textContent = `<${card.tag}>`;
    const summary = document.createElement('p');
    summary.textContent = card.summary;
    const since = document.createElement('p');
    since.className = 'gallery-since';
    since.textContent = `Since ${card.since}`;
    const preview = document.createElement('div');
    preview.className = 'gallery-preview';
    preview.dataset.tag = card.tag;
    item.append(preview, title, tag, summary, since);
    list.append(item);
    mounted.push(mountExample(preview, card.preview).catch(error => {
      console.error(`${card.tag}, preview:`, error);
      preview.textContent = 'The preview failed.';
    }));
  }
  container.replaceChildren(list);
  await Promise.all(mounted);
}
