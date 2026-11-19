import { aTimeout, expect, fixture, html, oneEvent } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import './floating-card.js';

/** The card and the thing it talks about, which is where it is placed */
const make = async () => {
  const page = await fixture(html`<div>
    <button id="day" style="margin: 100px 0 0 50px">Sunday</button>
    <button id="other">Monday</button>
    <wax-floating-card close-label="Close" label="The day" delay="10"></wax-floating-card>
  </div>`);
  const card = page.querySelector('wax-floating-card');
  // The content goes in when it is going to show, like an application does
  card.addEventListener('wax-show', event => { card.replaceChildren(Object.assign(document.createElement('p'), { textContent: `About ${event.detail.anchor?.id}` })); });
  return { page, card, day: page.querySelector('#day'), other: page.querySelector('#other') };
};
const log = (card, names = ['wax-show', 'wax-after-show', 'wax-hide', 'wax-after-hide']) => {
  const seen = [];
  for (const name of names) card.addEventListener(name, event => seen.push(event.detail?.reason ? `${name}:${event.detail.reason}` : name));
  return seen;
};
const part = (card, name) => card.shadowRoot.querySelector(`[part~=${name}]`);

describe('<wax-floating-card>', () => {
  it('is defined, closed, and importing it twice does no harm', async () => {
    await import('./floating-card.js?again');
    const { card } = await make();
    expect(customElements.get('wax-floating-card')).to.exist;
    expect(card.open).to.equal(false);
    expect(getComputedStyle(card).display).to.equal('none');
  });

  it('shows next to its anchor with the content the listener put there, and tells it in the four events', async () => {
    const { card, day } = await make();
    const seen = log(card);
    expect(card.toggle(day)).to.equal(undefined);
    await oneEvent(card, 'wax-after-show');
    expect(card.open).to.equal(true);
    expect(card.hasAttribute('open')).to.equal(true);
    expect(card.textContent).to.equal('About day');
    const box = part(card, 'card').getBoundingClientRect();
    const near = day.getBoundingClientRect();
    expect(Math.round(box.top)).to.be.closeTo(Math.round(near.bottom + 6), 1, 'under its anchor');
    card.hide();
    expect(seen).to.deep.equal(['wax-show', 'wax-after-show', 'wax-hide:api', 'wax-after-hide']);
    expect(card.open).to.equal(false);
  });

  it('keeps it closed if wax-show is cancelled (nothing to say), and open if wax-hide is cancelled', async () => {
    const { card, day } = await make();
    const stop = event => event.preventDefault();
    card.addEventListener('wax-show', stop);
    expect(card.show(day)).to.equal(false);
    expect(card.open).to.equal(false);
    card.removeEventListener('wax-show', stop);
    card.show(day);
    expect(card.open).to.equal(true);
    card.addEventListener('wax-hide', stop);
    expect(card.hide()).to.equal(false);
    expect(card.open).to.equal(true, 'it stays');
    card.removeEventListener('wax-hide', stop);
    expect(card.hide()).to.equal(true);
  });

  it('says in wax-hide what asked: Escape, the close button, a click outside and the same thing again', async () => {
    const { card, day, other } = await make();
    const reasons = [];
    card.addEventListener('wax-hide', event => reasons.push([event.detail.reason, event.detail.source === card || event.detail.source instanceof Element]));
    card.toggle(day);
    await sendKeys({ press: 'Escape' });
    expect(card.open).to.equal(false);
    card.toggle(day);
    part(card, 'close-button').click();
    expect(card.open).to.equal(false);
    card.toggle(day);
    await aTimeout(10);
    other.click();
    expect(card.open).to.equal(false);
    card.toggle(day);
    card.toggle(day);
    expect(card.open).to.equal(false);
    expect(reasons.map(([reason]) => reason)).to.deep.equal(['escape', 'close-button', 'outside', 'api']);
    expect(reasons.every(([, isElement]) => isElement)).to.equal(true);
  });

  it('does not close for a click inside it', async () => {
    const { card, day } = await make();
    card.toggle(day);
    await aTimeout(10);
    card.querySelector('p').click();
    expect(card.open).to.equal(true);
  });

  it('opens and closes with the open property, like a wa-dialog, and puts open back if wax-hide is cancelled', async () => {
    const { card, day } = await make();
    card.anchor = day;
    card.open = true;
    await oneEvent(card, 'wax-after-show');
    expect(card.textContent).to.equal('About day');
    const stop = event => event.preventDefault();
    card.addEventListener('wax-hide', stop);
    card.open = false;
    await card.updateComplete;
    expect(card.open).to.equal(true);
    card.removeEventListener('wax-hide', stop);
    card.open = false;
    await card.updateComplete;
    expect(card.open).to.equal(false);
  });

  it('replaces what it shows for another anchor: it closes and opens again', async () => {
    const { card, day, other } = await make();
    const seen = log(card, ['wax-show', 'wax-hide', 'wax-after-hide']);
    card.toggle(day);
    card.toggle(other);
    expect(card.textContent).to.equal('About other');
    expect(seen).to.deep.equal(['wax-show', 'wax-hide:replace', 'wax-after-hide', 'wax-show']);
  });

  it('peeks with a mouse after a moment, without the close button, and goes when the pointer leaves', async () => {
    const { card, day } = await make();
    card.peek(day);
    expect(card.open).to.equal(false);
    await aTimeout(60);
    expect(card.open).to.equal(true);
    expect(card.peeking).to.equal(true);
    expect(getComputedStyle(part(card, 'close-button')).display).to.equal('none');
    card.leave();
    await aTimeout(250);
    expect(card.open).to.equal(false);
  });

  it('stays when the pointer goes into it, and a pinned card does not go when the pointer leaves', async () => {
    const { card, day } = await make();
    card.peek(day);
    await aTimeout(60);
    card.leave();
    card.dispatchEvent(new MouseEvent('mouseenter'));
    await aTimeout(250);
    expect(card.open).to.equal(true);
    card.show(day);
    card.leave();
    await aTimeout(250);
    expect(card.open).to.equal(true);
  });

  it('without a mouse it goes in the middle with the rest dimmed, and a click on the backdrop closes it', async () => {
    const { card, day } = await make();
    const real = window.matchMedia;
    window.matchMedia = () => ({ matches: false });
    try {
      let centered;
      card.addEventListener('wax-show', event => { centered = event.detail.centered; });
      card.peek(day);
      await aTimeout(60);
      expect(card.open).to.equal(false, 'peeking does nothing without a mouse');
      card.show(day);
      await card.updateComplete;
      expect(centered).to.equal(true);
      expect(card.centered).to.equal(true);
      expect(part(card, 'backdrop')).to.exist;
      const reasons = [];
      card.addEventListener('wax-hide', event => reasons.push(event.detail.reason));
      part(card, 'backdrop').click();
      expect(reasons).to.deep.equal(['backdrop']);
      expect(card.open).to.equal(false);
    } finally {
      window.matchMedia = real;
    }
  });

  it('is accessible', async () => {
    const { card, day } = await make();
    card.show(day);
    await oneEvent(card, 'wax-after-show');
    await expect(card).to.be.accessible();
  });
});
