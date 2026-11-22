// @ts-check

/**
 * The gallery of the components page: a card per element, made from data. The name and the page come from docs/pages.json (the entries of docs/components), the tag, the sentence
 * (`@summary`) and the version (`@since`) from custom-elements.json, which take them from the JSDoc of each element, and the small live preview from the `preview` field of the entry of
 * the page in docs/pages.json: markup like the one of an `html example` block, that `mountExample` mounts. Nothing is written by hand per card.
 */
import { mountExample } from './examples.js';

/** The `wa-badge` variant of each status an entry of docs/pages.json can have (`status`, "stable" when it has none) */
export const STATUS_VARIANTS = { stable: 'success', beta: 'warning', experimental: 'danger', deprecated: 'neutral' };

/** @typedef {{title: string, path: string, preview?: string, status?: string}} Page */
/** @typedef {{name: string, tag: string, summary: string, since: string, status: string, path: string, preview: string}} Card */

/**
 * @param {{title: string, pages: Page[]}[]} sections The content of docs/pages.json
 * @param {{modules?: {declarations?: any[]}[]}} manifest The content of custom-elements.json
 * @returns {Card[]} A card for each element of the manifest, in the order of the pages; it throws if an element has no page with a preview, no summary or no version; the status is the one of its page, "stable" by default
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
    return { name: page.title, tag: element.tagName, summary: element.summary, since: element.since, status: page.status ?? 'stable', path, preview: page.preview };
  });
  const order = pages.map(page => page.path);
  return cards.sort((a, b) => order.indexOf(a.path) - order.indexOf(b.path));
}

/** @param {string} text @returns {string} The text in lower case and without accents, to compare it */
const fold = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/**
 * @param {Card[]} cards
 * @param {string} query What was typed: every word of it must appear in the name, the tag or the summary of a card, ignoring case and accents
 * @returns {Card[]} The cards that match, in their order; all of them for an empty query
 */
export function filterCards(cards, query) {
  const words = fold(query).split(/\s+/).filter(Boolean);
  return cards.filter(card => {
    const text = fold(`${card.name} ${card.tag} ${card.summary}`);
    return words.every(word => text.includes(word));
  });
}

/** The ways to sort the cards: the label of each, in the select */
export const SORTS = { name: 'Name', since: 'Newest first' };

/** @param {string} a @param {string} b @returns {number} Negative if the version a is older than b, comparing x.y.z numerically */
const compareVersions = (a, b) => {
  const [x, y] = [a, b].map(version => version.split('.').map(Number));
  for (let index = 0; index < Math.max(x.length, y.length); index++) if ((x[index] ?? 0) !== (y[index] ?? 0)) return (x[index] ?? 0) - (y[index] ?? 0);
  return 0;
};

/**
 * @param {Card[]} cards
 * @param {string} by A key of SORTS: "name" (A to Z, ignoring case and accents) or "since" (the newest version first, and by name within a version)
 * @returns {Card[]} A sorted copy
 */
export function sortCards(cards, by) {
  const byName = (/** @type {Card} */ a, /** @type {Card} */ b) => fold(a.name).localeCompare(fold(b.name));
  return [...cards].sort(by === 'since' ? (a, b) => compareVersions(b.since, a.since) || byName(a, b) : byName);
}

/**
 * Draws the hero, the search field and the cards in the container and mounts the preview of each one (they do not wait for each other, and one that fails does not stop the rest).
 *
 * @param {HTMLElement} container
 * @param {Card[]} cards
 * @returns {Promise<void>} It settles when every preview is mounted or has failed
 */
export async function renderGallery(container, cards) {
  const hero = document.createElement('header');
  hero.className = 'gallery-hero';
  const heading = document.createElement('h1');
  heading.textContent = 'Build with extra components';
  const lead = document.createElement('p');
  lead.textContent = `${cards.length} elements that look and work as if they were native Web Awesome ones. Each card shows one working; its title opens its page, with the examples, how to import it and its reference.`;
  hero.append(heading, lead);
  const search = document.createElement('wa-input');
  search.className = 'gallery-search';
  search.setAttribute('with-clear', '');
  search.setAttribute('placeholder', 'Find a component to use…');
  search.setAttribute('aria-label', 'Find a component');
  const icon = document.createElement('wa-icon');
  icon.setAttribute('slot', 'start');
  icon.setAttribute('name', 'magnifying-glass');
  search.append(icon);
  const sort = document.createElement('wa-select');
  sort.className = 'gallery-sort';
  sort.setAttribute('value', 'name');
  sort.setAttribute('aria-label', 'Sort by');
  for (const [key, label] of Object.entries(SORTS)) {
    const option = document.createElement('wa-option');
    option.setAttribute('value', key);
    option.textContent = label;
    sort.append(option);
  }
  const toolbar = document.createElement('div');
  toolbar.className = 'gallery-toolbar';
  toolbar.append(search, sort);
  const empty = document.createElement('p');
  empty.className = 'gallery-empty';
  empty.hidden = true;
  empty.textContent = 'No component matches.';
  const list = document.createElement('ul');
  list.className = 'gallery';
  /** @type {Map<Card, HTMLElement>} */
  const items = new Map();
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
    const footer = document.createElement('footer');
    footer.className = 'gallery-footer';
    const status = document.createElement('wa-badge');
    status.setAttribute('variant', STATUS_VARIANTS[card.status] ?? 'neutral');
    status.textContent = card.status.charAt(0).toUpperCase() + card.status.slice(1);
    const since = document.createElement('wa-badge');
    since.setAttribute('variant', 'neutral');
    since.textContent = `Since ${card.since}`;
    footer.append(status, since);
    const preview = document.createElement('div');
    preview.className = 'gallery-preview';
    preview.dataset.tag = card.tag;
    item.append(preview, title, tag, summary, footer);
    list.append(item);
    items.set(card, item);
    mounted.push(mountExample(preview, card.preview).catch(error => {
      console.error(`${card.tag}, preview:`, error);
      preview.textContent = 'The preview failed.';
    }));
  }
  // The cards that do not match are hidden, not removed: their previews stay mounted
  search.addEventListener('input', () => {
    const shown = new Set(filterCards(cards, /** @type {HTMLInputElement} */ (search).value ?? ''));
    for (const [card, item] of items) item.hidden = !shown.has(card);
    empty.hidden = shown.size > 0;
  });
  // The sorted cards are the same elements in another order
  sort.addEventListener('change', () => {
    const order = sortCards(cards, /** @type {HTMLSelectElement} */ (sort).value);
    list.append(...order.map(card => /** @type {HTMLElement} */ (items.get(card))));
  });
  list.append(...sortCards(cards, 'name').map(card => /** @type {HTMLElement} */ (items.get(card))));
  container.replaceChildren(hero, toolbar, empty, list);
  await Promise.all(mounted);
}
