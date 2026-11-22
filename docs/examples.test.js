import { aTimeout, expect } from '@open-wc/testing';
import { setBasePath as setWebAwesomeBasePath, startLoader as startWebAwesomeLoader } from '@awesome.me/webawesome/dist/webawesome.loader.js';
import { setBasePath, startLoader } from '../src/webawesome-extras.loader.js';
import { WaxMapPicker } from '../src/components/map-picker/map-picker.js';
import { extractExamples, mountExample, tagsOf } from './site/examples.js';
import { cardsOf, renderGallery, sortCards } from './site/gallery.js';

/**
 * Every example of the documentation (the `html example` blocks of every page in docs/pages.json) is mounted as the site mounts it, with the two loaders, and must define its
 * elements and throw no errors: a broken example fails here, in the three browsers.
 */

// The test runner serves the repository from its root, so the same folders the site loads from
setWebAwesomeBasePath('/node_modules/@awesome.me/webawesome/dist');
startWebAwesomeLoader();
setBasePath('/src');
startLoader();

// The maps of the examples do not use the network: Leaflet is the copy of node_modules and every provider of tiles is a blank pixel
const BLANK = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
WaxMapPicker.leaflet = { js: '/node_modules/leaflet/dist/leaflet.js', jsIntegrity: '', css: '/node_modules/leaflet/dist/leaflet.css', cssIntegrity: '', imagePath: '' };
for (const [name, provider] of Object.entries(WaxMapPicker.providers)) WaxMapPicker.providers[name] = { ...provider, url: BLANK, subdomains: undefined };

const pages = (await (await fetch('/docs/pages.json')).json()).flatMap(section => section.pages);

describe('the examples of the documentation', () => {
  for (const page of pages) {
    describe(page.path, () => {
      let examples = [];
      before(async () => {
        examples = extractExamples(await (await fetch(`/docs/${page.path}`)).text());
      });

      it('has no ids repeated between its examples, which find their elements by id', () => {
        const ids = examples.flatMap(example => [...example.code.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
        expect(ids.filter((id, index) => ids.indexOf(id) !== index)).to.deep.equal([]);
      });

      it('mounts each example: its elements are defined and nothing throws', async function () {
        this.timeout(30000);
        for (const example of examples) {
          const errors = [];
          const onError = event => errors.push(event.error?.message ?? event.message ?? String(event.reason));
          window.addEventListener('error', onError);
          window.addEventListener('unhandledrejection', onError);
          const container = document.createElement('div');
          document.body.append(container);
          try {
            await mountExample(container, example.code);
            await aTimeout(50);
            for (const tag of tagsOf(example.code)) expect(customElements.get(tag), `<${tag}> in "${example.heading}"`).to.exist;
            expect(errors, `errors in "${example.heading}"`).to.deep.equal([]);
          } finally {
            window.removeEventListener('error', onError);
            window.removeEventListener('unhandledrejection', onError);
            container.remove();
          }
        }
      });
    });
  }
});

describe('the gallery of the components page', () => {
  it('draws a card per element, links to its page, and mounts every preview with its elements defined and nothing thrown', async function () {
    this.timeout(30000);
    const cards = cardsOf(await (await fetch('/docs/pages.json')).json(), await (await fetch('/custom-elements.json')).json());
    const errors = [];
    const onError = event => errors.push(event.error?.message ?? event.message ?? String(event.reason));
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onError);
    const container = document.createElement('div');
    document.body.append(container);
    try {
      await renderGallery(container, cards);
      await aTimeout(50);
      const items = [...container.querySelectorAll('.gallery-card')];
      expect(items.length).to.equal(cards.length);
      for (const card of cards) {
        const item = items.find(candidate => candidate.querySelector('.gallery-preview').dataset.tag === card.tag);
        expect(item.querySelector('h3 a').getAttribute('href'), card.tag).to.equal(`#/${card.path}`);
        expect(item.textContent, card.tag).to.include(`<${card.tag}>`);
        const badges = [...item.querySelectorAll('.gallery-footer wa-badge')].map(badge => badge.textContent);
        expect(badges, card.tag).to.deep.equal([card.status.charAt(0).toUpperCase() + card.status.slice(1), `Since ${card.since}`]);
        expect(item.querySelector('.gallery-preview').textContent, `the preview of ${card.tag} failed`).to.not.include('failed');
        for (const tag of tagsOf(card.preview)) expect(customElements.get(tag), `<${tag}> in the preview of ${card.tag}`).to.exist;
      }
      // The select sorts the cards: by name first, by version after
      const sort = container.querySelector('wa-select.gallery-sort');
      const order = () => [...container.querySelectorAll('.gallery-card h3')].map(title => title.textContent);
      expect(order()).to.deep.equal([...order()].sort((a, b) => a.localeCompare(b)));
      sort.value = 'since';
      sort.dispatchEvent(new Event('change'));
      expect(order().length).to.equal(cards.length);
      expect(order()).to.deep.equal(sortCards(cards, 'since').map(card => card.name));
      // The search field hides the cards that do not match and says so when none does
      const search = container.querySelector('wa-input.gallery-search');
      const visible = () => items.filter(item => !item.hidden).length;
      search.value = cards[0].tag.toUpperCase();
      search.dispatchEvent(new Event('input'));
      expect(visible()).to.equal(1);
      expect(container.querySelector('.gallery-empty').hidden).to.equal(true);
      search.value = 'no such thing';
      search.dispatchEvent(new Event('input'));
      expect(visible()).to.equal(0);
      expect(container.querySelector('.gallery-empty').hidden).to.equal(false);
      search.value = '';
      search.dispatchEvent(new Event('input'));
      expect(visible()).to.equal(cards.length);
      expect(errors, 'errors in the gallery').to.deep.equal([]);
    } finally {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onError);
      container.remove();
    }
  });
});
