import { aTimeout, expect, fixture, html, oneEvent } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import './list-manager.js';

const entries = [
  { key: 'a', icon: '🏆', name: 'Alfa', note: 'first' },
  { key: 'b', name: 'Beta' },
  { key: 'c', name: 'Gamma' }
];

/** @returns {Promise<any>} */
const make = async () => {
  const el = await fixture(html`<wax-list-manager search-placeholder="Search..." new-label="New" empty="Nothing here">
    <div slot="filters"><label>Kind <select><option>All</option><option>Mine</option></select></label></div>
  </wax-list-manager>`);
  el.items = entries;
  await el.updateComplete;
  const list = el.shadowRoot.querySelector('wax-item-list');
  await list.updateComplete;
  return el;
};
const list = el => el.shadowRoot.querySelector('wax-item-list');
const lines = el => [...list(el).shadowRoot.querySelectorAll('li[data-key]')];

describe('<wax-list-manager>', () => {
  it('is defined, and importing it twice does no harm', async () => {
    await import('./list-manager.js?again');
    expect(customElements.get('wax-list-manager')).to.exist;
  });

  it('has the filters above, then the search box, the New button and the list', async () => {
    const el = await make();
    const search = el.shadowRoot.querySelector('wa-input');
    const button = el.shadowRoot.querySelector('wa-button');
    const filters = el.querySelector('[slot=filters]');
    expect(search.getAttribute('placeholder')).to.equal('Search...');
    expect(button.textContent.trim()).to.equal('New');
    const top = node => node.getBoundingClientRect().top;
    expect(top(filters)).to.be.below(top(search));
    expect(top(search)).to.be.below(top(button));
    expect(top(button)).to.be.below(top(list(el)));
    expect(lines(el).map(line => line.querySelector('[part~=name]').textContent)).to.deep.equal(['Alfa', 'Beta', 'Gamma']);
  });

  it('exports the parts of its list and says what is empty', async () => {
    const el = await make();
    expect(list(el).getAttribute('exportparts')).to.include('line');
    el.items = [];
    await el.updateComplete;
    await list(el).updateComplete;
    expect(list(el).shadowRoot.querySelector('[part~=empty]').textContent).to.equal('Nothing here');
  });

  it('announces the entry the user chooses (wax-select with its key), and does not clear it when it is clicked again', async () => {
    const el = await make();
    const heard = [];
    el.addEventListener('wax-select', event => heard.push(event.detail.key));
    setTimeout(() => lines(el)[1].click());
    await oneEvent(el, 'wax-select');
    expect(heard).to.deep.equal(['b']);
    lines(el)[1].click();
    await list(el).updateComplete;
    expect(heard).to.deep.equal(['b'], 'nothing new to announce');
    expect(list(el).selected).to.equal('b', 'and it stays chosen');
  });

  it('does not announce select() and keeps the chosen entry when the items are given again', async () => {
    const el = await make();
    let heard = 0;
    el.addEventListener('wax-select', () => { heard++; });
    el.select('c');
    expect(list(el).selected).to.equal('c');
    el.items = [...entries];
    await el.updateComplete;
    await list(el).updateComplete;
    expect(list(el).selected).to.equal('c');
    expect(heard).to.equal(0);
  });

  it('announces what is typed in the search box (wax-query), and gives it in query, without letting the box events out', async () => {
    const el = await make();
    const leaked = [];
    for (const type of ['input', 'change']) el.addEventListener(type, () => leaked.push(type));
    el.shadowRoot.querySelector('wa-input').focus();
    setTimeout(() => sendKeys({ type: 'alf' }));
    const asked = await oneEvent(el, 'wax-query');
    expect(asked.detail.query).to.be.a('string');
    await aTimeout(50);
    expect(el.query).to.equal('alf');
    expect(leaked).to.deep.equal([]);
  });

  it('announces the New button (wax-new)', async () => {
    const el = await make();
    setTimeout(() => el.shadowRoot.querySelector('wa-button').click());
    const heard = await oneEvent(el, 'wax-new');
    expect(heard.type).to.equal('wax-new');
  });

  it('is accessible', async () => {
    const el = await make();
    await expect(el).to.be.accessible();
  });
});
