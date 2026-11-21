import { aTimeout, expect, fixture, html } from '@open-wc/testing';
import '@awesome.me/webawesome/dist/translations/es.js';
import '../translations/es.js';
import '../webawesome-extras.js';

/** The language of the page, as an application sets it: `lang` on `<html>` */
const setPageLang = async lang => {
  if (lang) document.documentElement.lang = lang; else document.documentElement.removeAttribute('lang');
  await aTimeout(20);
};
const parts = (el, selector) => [...el.shadowRoot.querySelectorAll(selector)];
const asked = async (lang, attributes = '') => {
  const el = await fixture(html`<wax-ask-each ${attributes}></wax-ask-each>`);
  if (lang) el.setAttribute('lang', lang);
  el.ask(['a', 'b']);
  await new Promise(resolve => el.addEventListener('wa-after-show', resolve, { once: true }));
  return el;
};
const buttons = el => ['yes', 'no', 'yes-all', 'no-all', 'cancel'].map(name => el.shadowRoot.querySelector(`[part~="${name}"]`).textContent.trim());

describe('localization of the wax-* elements, the one of Web Awesome', () => {
  afterEach(() => setPageLang('en'));

  describe('in English, the default', () => {
    beforeEach(() => setPageLang('en'));

    it('ask each says its buttons and its progress in English', async () => {
      const el = await asked();
      expect(buttons(el)).to.deep.equal(['Yes', 'No', 'Yes to all', 'No to all', 'Cancel']);
      expect(el.shadowRoot.querySelector('[part="progress"]').textContent.trim()).to.equal('1 of 2');
    });

    it('the combobox has its search placeholder and its empty notice in English', async () => {
      const el = await fixture(html`<wax-combobox></wax-combobox>`);
      expect(el.shadowRoot.querySelector('wa-input').placeholder).to.equal('Search...');
      expect(el.shadowRoot.querySelector('[part~="none"]').textContent.trim()).to.equal('No matches');
    });

    it('the item list names its handle in English', async () => {
      const el = await fixture(html`<wax-item-list movable .items=${[{ key: 'a', name: 'A' }]}></wax-item-list>`);
      const handle = el.shadowRoot.querySelector('[part="handle"]');
      expect(handle.getAttribute('aria-label')).to.equal('Move (up and down arrows)');
      expect(handle.title).to.equal('Drag to sort');
    });

    it('the list manager has its search box and its button in English', async () => {
      const el = await fixture(html`<wax-list-manager></wax-list-manager>`);
      expect(el.shadowRoot.querySelector('[part="search"]').placeholder).to.equal('Search...');
      expect(el.shadowRoot.querySelector('[part="new-button"]').textContent.trim()).to.equal('New');
    });

    it('the floating card names its close button with the term of Web Awesome', async () => {
      const el = await fixture(html`<wax-floating-card></wax-floating-card>`);
      expect(el.shadowRoot.querySelector('[part="close-button"]').getAttribute('aria-label')).to.equal('Close');
    });
  });

  describe('in Spanish, with lang on <html>', () => {
    beforeEach(() => setPageLang('es'));

    it('every element speaks Spanish, with the Spanish of Web Awesome where it is its term', async () => {
      const ask = await asked();
      expect(buttons(ask)).to.deep.equal(['Sí', 'No', 'Sí a todos', 'No a todos', 'Cancelar']);
      expect(ask.shadowRoot.querySelector('[part="progress"]').textContent.trim()).to.equal('1 de 2');
      expect((await fixture(html`<wax-combobox></wax-combobox>`)).shadowRoot.querySelector('wa-input').placeholder).to.equal('Buscar...');
      const list = await fixture(html`<wax-item-list movable .items=${[{ key: 'a', name: 'A' }]}></wax-item-list>`);
      expect(list.shadowRoot.querySelector('[part="handle"]').title).to.equal('Arrastrar para ordenar');
      expect((await fixture(html`<wax-list-manager></wax-list-manager>`)).shadowRoot.querySelector('[part="new-button"]').textContent.trim()).to.equal('Nuevo');
      expect((await fixture(html`<wax-floating-card></wax-floating-card>`)).shadowRoot.querySelector('[part="close-button"]').getAttribute('aria-label')).to.equal('Cerrar');
    });

    it('follows a change of lang on <html> while the elements are on the page', async () => {
      const el = await fixture(html`<wax-list-manager></wax-list-manager>`);
      const button = () => el.shadowRoot.querySelector('[part="new-button"]').textContent.trim();
      expect(button()).to.equal('Nuevo');
      await setPageLang('en');
      await el.updateComplete;
      expect(button()).to.equal('New');
      await setPageLang('es');
      await el.updateComplete;
      expect(button()).to.equal('Nuevo');
    });
  });

  describe('with lang on the element itself', () => {
    beforeEach(() => setPageLang('en'));

    it('the element speaks its own language, not the one of the page', async () => {
      const el = await asked('es');
      expect(buttons(el)).to.deep.equal(['Sí', 'No', 'Sí a todos', 'No a todos', 'Cancelar']);
    });

    it('a language with a region falls back to the one without it, and an unknown one to English', async () => {
      expect(buttons(await asked('es-MX'))[0]).to.equal('Sí');
      expect(buttons(await asked('xx'))[0]).to.equal('Yes');
    });
  });

  describe('an explicit property wins over the translation', () => {
    beforeEach(() => setPageLang('es'));

    it('labels of ask each, one by one', async () => {
      const el = await fixture(html`<wax-ask-each></wax-ask-each>`);
      el.labels = { yes: 'Overwrite', progress: 'Question {n} of {total}' };
      el.ask(['a', 'b']);
      await new Promise(resolve => el.addEventListener('wa-after-show', resolve, { once: true }));
      expect(buttons(el).slice(0, 2)).to.deep.equal(['Overwrite', 'No']);
      expect(el.shadowRoot.querySelector('[part="progress"]').textContent.trim()).to.equal('Question 1 of 2');
    });

    it('the attributes of the other elements', async () => {
      const combobox = await fixture(html`<wax-combobox search-placeholder="Type" empty-text="Nothing"></wax-combobox>`);
      expect(combobox.shadowRoot.querySelector('wa-input').placeholder).to.equal('Type');
      expect(combobox.shadowRoot.querySelector('[part~="none"]').textContent.trim()).to.equal('Nothing');
      const list = await fixture(html`<wax-item-list movable handle-label="Handle" handle-title="Tip" .items=${[{ key: 'a', name: 'A' }]}></wax-item-list>`);
      expect(list.shadowRoot.querySelector('[part="handle"]').getAttribute('aria-label')).to.equal('Handle');
      expect(list.shadowRoot.querySelector('[part="handle"]').title).to.equal('Tip');
      const manager = await fixture(html`<wax-list-manager search-placeholder="Find" new-label="Add"></wax-list-manager>`);
      expect(manager.shadowRoot.querySelector('[part="search"]').placeholder).to.equal('Find');
      expect(manager.shadowRoot.querySelector('[part="new-button"]').textContent.trim()).to.equal('Add');
      const card = await fixture(html`<wax-floating-card close-label="Dismiss"></wax-floating-card>`);
      expect(card.shadowRoot.querySelector('[part="close-button"]').getAttribute('aria-label')).to.equal('Dismiss');
    });
  });
});
