import { expect, fixture, html, oneEvent } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import './item-list.js';

const items = [
  { key: 'a', icon: '🍺', name: 'Alfa', note: '10 m' },
  { key: 'b', name: 'Beta', faded: true },
  { key: 'c', name: 'Gamma' }
];

/** @returns {Promise<any>} */
const make = async (template = html`<wax-item-list empty="Nothing here"></wax-item-list>`) => {
  const el = await fixture(template);
  el.items = items;
  await el.updateComplete;
  return el;
};
const lines = el => [...el.shadowRoot.querySelectorAll('li[data-key]')];

describe('<wax-item-list>', () => {
  it('is defined, and importing it twice does no harm', async () => {
    await import('./item-list.js?again');
    expect(customElements.get('wax-item-list')).to.exist;
  });

  it('draws a line per item with its icon, name and note, and the empty text with no items', async () => {
    const el = await make();
    expect(lines(el).map(line => line.querySelector('[part~=name]').textContent)).to.deep.equal(['Alfa', 'Beta', 'Gamma']);
    expect(lines(el)[0].querySelector('[part~=icon]').textContent).to.equal('🍺');
    expect(lines(el)[0].querySelector('[part~=note]').textContent).to.equal('10 m');
    expect(lines(el)[1].getAttribute('part')).to.include('faded');
    el.items = [];
    await el.updateComplete;
    expect(el.shadowRoot.querySelector('[part~=empty]').textContent).to.equal('Nothing here');
  });

  it('selects a line with a click (wax-select with its key) and clears it with another click', async () => {
    const el = await make();
    setTimeout(() => lines(el)[1].click());
    const chosen = await oneEvent(el, 'wax-select');
    expect(chosen.detail).to.deep.equal({ key: 'b' });
    expect(el.selected).to.equal('b');
    expect(lines(el)[1].getAttribute('part')).to.include('selected');
    setTimeout(() => lines(el)[1].click());
    expect((await oneEvent(el, 'wax-select')).detail).to.deep.equal({ key: null });
    expect(el.selected).to.equal(null);
  });

  it('does not announce select() (the application chose it) and keeps what is selected when the items change', async () => {
    const el = await make();
    let heard = 0;
    el.addEventListener('wax-select', () => { heard++; });
    el.select('c');
    el.items = [items[0], items[2]];
    await el.updateComplete;
    expect(el.selected).to.equal('c');
    el.items = [items[0]];
    await el.updateComplete;
    expect(el.selected).to.equal(null);
    expect(heard).to.equal(0);
  });

  it('marks lines with Ctrl or Shift + click (wax-mark with all the keys) and clearMarks() empties them', async () => {
    const el = await make();
    const click = (line, init) => line.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, ...init }));
    setTimeout(() => click(lines(el)[0], { ctrlKey: true }));
    expect((await oneEvent(el, 'wax-mark')).detail.keys).to.deep.equal(['a']);
    setTimeout(() => click(lines(el)[2], { shiftKey: true }));
    expect((await oneEvent(el, 'wax-mark')).detail.keys).to.deep.equal(['a', 'c']);
    expect([...el.marked]).to.deep.equal(['a', 'c']);
    el.clearMarks();
    expect(el.marked.size).to.equal(0);
  });

  it('selects with Enter on a focused line', async () => {
    const el = await make();
    lines(el)[2].focus();
    setTimeout(() => sendKeys({ press: 'Enter' }));
    expect((await oneEvent(el, 'wax-select')).detail.key).to.equal('c');
  });

  it('leaves a click on its own control to the control: a slotted button does not select', async () => {
    const el = await fixture(html`<wax-item-list><button slot="a">remove</button></wax-item-list>`);
    el.items = items;
    await el.updateComplete;
    let selected = 0;
    el.addEventListener('wax-select', () => { selected++; });
    el.querySelector('button').click();
    expect(selected).to.equal(0);
    expect(el.shadowRoot.querySelector('slot[name=a]')).to.exist;
  });

  it('moves a line with the arrow keys on its handle (wax-move with the keys in their new order)', async () => {
    const el = await make(html`<wax-item-list movable></wax-item-list>`);
    el.shadowRoot.querySelectorAll('[part~=handle]')[0].focus();
    setTimeout(() => sendKeys({ press: 'ArrowDown' }));
    expect((await oneEvent(el, 'wax-move')).detail.keys).to.deep.equal(['b', 'a', 'c']);
    await el.updateComplete;
    expect(lines(el).map(line => line.dataset.key)).to.deep.equal(['b', 'a', 'c']);
  });

  it('fires wax-swipe with the key when the action of a slid line is pressed', async () => {
    const el = await make(html`<wax-item-list swipe-label="Remove"></wax-item-list>`);
    setTimeout(() => lines(el)[1].querySelector('[part~=swipe]').click());
    expect((await oneEvent(el, 'wax-swipe')).detail).to.deep.equal({ key: 'b' });
  });

  it('is accessible', async () => {
    const el = await make();
    await expect(el).to.be.accessible();
  });
});
