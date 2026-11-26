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
  card.addEventListener('wa-show', event => { if (event.target === card) card.replaceChildren(Object.assign(document.createElement('p'), { textContent: `About ${card.anchor?.id}` })); });
  return { page, card, day: page.querySelector('#day'), other: page.querySelector('#other') };
};
const log = (card, names = ['wa-show', 'wa-after-show', 'wa-hide', 'wa-after-hide']) => {
  const seen = [];
  for (const name of names) card.addEventListener(name, () => seen.push(name));
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
    await oneEvent(card, 'wa-after-show');
    expect(card.open).to.equal(true);
    expect(card.hasAttribute('open')).to.equal(true);
    expect(card.shadowRoot.querySelector('wa-popup').active).to.equal(true);
    expect(card.textContent).to.equal('About day');
    const box = part(card, 'card').getBoundingClientRect();
    const near = day.getBoundingClientRect();
    expect(Math.round(box.top)).to.be.closeTo(Math.round(near.bottom + 6), 1, 'under its anchor');
    card.hide();
    expect(seen).to.deep.equal(['wa-show', 'wa-after-show', 'wa-hide', 'wa-after-hide']);
    expect(card.open).to.equal(false);
  });

  it('goes where placement says, flips to the other side near the edge of the window and has a default and a distance', async () => {
    const { card, day } = await make();
    expect(card.placement).to.equal('bottom-start');
    expect(card.distance).to.equal(6);
    day.style.cssText = 'position: fixed; left: 50px; bottom: 10px; margin: 0';
    card.show(day);
    await oneEvent(card, 'wa-after-show');
    expect(part(card, 'card').getBoundingClientRect().bottom).to.be.at.most(day.getBoundingClientRect().top, 'there is no room below: above');
    card.hide();
    day.style.cssText = 'position: fixed; left: 50px; top: 100px; margin: 0';
    card.placement = 'right-start';
    card.distance = 20;
    card.show(day);
    await oneEvent(card, 'wa-after-show');
    const box = part(card, 'card').getBoundingClientRect();
    const near = day.getBoundingClientRect();
    expect(Math.round(box.left)).to.be.closeTo(Math.round(near.right + 20), 1, 'to the right, at the distance');
    expect(Math.round(box.top)).to.be.closeTo(Math.round(near.top), 1);
    card.hide();
    card.setAttribute('placement', 'top');
    expect(card.placement).to.equal('top', 'the attribute');
  });

  it('place() asks the popup to reposition it after what is inside has grown', async () => {
    const { card, day } = await make();
    day.style.cssText = 'position: fixed; left: 50px; bottom: 10px; margin: 0';
    card.show(day);
    await oneEvent(card, 'wa-after-show');
    const popup = card.shadowRoot.querySelector('wa-popup');
    let repositions = 0;
    popup.addEventListener('wa-reposition', () => repositions++);
    card.place();
    expect(repositions).to.equal(1);
  });

  it('keeps it closed if wa-show is cancelled (nothing to say), and open if wa-hide is cancelled', async () => {
    const { card, day } = await make();
    const stop = event => event.preventDefault();
    card.addEventListener('wa-show', stop);
    expect(card.show(day)).to.equal(false);
    expect(card.open).to.equal(false);
    card.removeEventListener('wa-show', stop);
    card.show(day);
    expect(card.open).to.equal(true);
    card.addEventListener('wa-hide', stop);
    expect(card.hide()).to.equal(false);
    expect(card.open).to.equal(true, 'it stays');
    card.removeEventListener('wa-hide', stop);
    expect(card.hide()).to.equal(true);
  });

  it('says in wa-hide, as a source, what asked: the card itself for Escape and hide(), the close button, what was clicked outside', async () => {
    const { card, day, other } = await make();
    const sources = [];
    card.addEventListener('wa-hide', event => sources.push(event.detail.source));
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
    expect(sources).to.deep.equal([card, part(card, 'close-button'), other, card]);
  });

  it('moved in the page while shown, Escape and a click outside still close it', async () => {
    const { page, card, day, other } = await make();
    card.toggle(day);
    page.append(card);   // taken out and put back, as a list that is sorted again does
    await sendKeys({ press: 'Escape' });
    expect(card.open).to.equal(false);
    card.toggle(day);
    page.prepend(card);
    await aTimeout(10);
    other.click();
    expect(card.open).to.equal(false);
  });

  it('does not close for a click inside it', async () => {
    const { card, day } = await make();
    card.toggle(day);
    await aTimeout(10);
    card.querySelector('p').click();
    expect(card.open).to.equal(true);
  });

  it('opens and closes with the open property, like a wa-dialog, and puts open back if wa-hide is cancelled', async () => {
    const { card, day } = await make();
    card.anchor = day;
    card.open = true;
    await oneEvent(card, 'wa-after-show');
    expect(card.textContent).to.equal('About day');
    const stop = event => event.preventDefault();
    card.addEventListener('wa-hide', stop);
    card.open = false;
    await card.updateComplete;
    expect(card.open).to.equal(true);
    card.removeEventListener('wa-hide', stop);
    card.open = false;
    await card.updateComplete;
    expect(card.open).to.equal(false);
  });

  it('replaces what it shows for another anchor: it closes and opens again', async () => {
    const { card, day, other } = await make();
    const seen = log(card, ['wa-show', 'wa-hide', 'wa-after-hide']);
    card.toggle(day);
    card.toggle(other);
    expect(card.textContent).to.equal('About other');
    expect(seen).to.deep.equal(['wa-show', 'wa-hide', 'wa-after-hide', 'wa-show']);
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

  /** Runs `body` as if there were no mouse */
  const withoutMouse = async body => {
    const real = window.matchMedia;
    window.matchMedia = () => ({ matches: false });
    try { await body(); } finally { window.matchMedia = real; }
  };

  it('without a mouse it goes in the middle, in a wa-dialog, and peeking does nothing', async () => {
    const { card, day } = await make();
    await withoutMouse(async () => {
      let centered;
      card.addEventListener('wa-show', () => { centered = card.centered; });
      card.peek(day);
      await aTimeout(60);
      expect(card.open).to.equal(false, 'peeking does nothing without a mouse');
      card.show(day);
      await oneEvent(card, 'wa-after-show');
      expect(centered).to.equal(true);
      expect(card.centered).to.equal(true);
      expect(card.shadowRoot.querySelector('wa-popup')).to.equal(null);
      const dialog = card.shadowRoot.querySelector('wa-dialog');
      expect(dialog.open).to.equal(true);
      expect(dialog.lightDismiss).to.equal(true);
      expect(dialog.label).to.equal('The day');
      expect(card.textContent).to.equal('About day');
      const box = dialog.dialog.getBoundingClientRect();
      expect(Math.round(box.left + box.width / 2)).to.be.closeTo(window.innerWidth / 2, 12, 'in the middle');
      expect(part(card, 'close-button')).to.exist;
    });
  });

  it('in the middle the four events come out of the card once each, and the ones of the dialog stay inside', async () => {
    const { page, card, day } = await make();
    await withoutMouse(async () => {
      const seen = log(card);
      const outside = [];
      for (const name of ['wa-show', 'wa-after-show', 'wa-hide', 'wa-after-hide', 'wa-reposition']) page.addEventListener(name, event => outside.push(`${name}:${event.target === card}`));
      card.show(day);
      await oneEvent(card, 'wa-after-show');
      card.hide();
      await oneEvent(card.shadowRoot.querySelector('wa-dialog'), 'wa-after-hide');
      await aTimeout(20);
      expect(seen).to.deep.equal(['wa-show', 'wa-after-show', 'wa-hide', 'wa-after-hide']);
      expect(outside).to.deep.equal(['wa-show:true', 'wa-after-show:true', 'wa-hide:true', 'wa-after-hide:true']);
      expect(card.shadowRoot.querySelector('wa-dialog').open).to.equal(false);
    });
  });

  it('in the middle Escape, a click outside and the close button close it, with their source, and the card can say no', async () => {
    const { card, day } = await make();
    await withoutMouse(async () => {
      const sources = [];
      card.addEventListener('wa-hide', event => sources.push(event.detail.source));
      const dialog = () => card.shadowRoot.querySelector('wa-dialog');
      card.show(day);
      await oneEvent(card, 'wa-after-show');
      await sendKeys({ press: 'Escape' });
      expect(card.open).to.equal(false);
      await oneEvent(dialog(), 'wa-after-hide');
      card.show(day);
      await oneEvent(card, 'wa-after-show');
      dialog().dialog.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true, clientX: 1, clientY: 1 }));
      expect(card.open).to.equal(false);
      await oneEvent(dialog(), 'wa-after-hide');
      card.show(day);
      await oneEvent(card, 'wa-after-show');
      part(card, 'close-button').click();
      expect(card.open).to.equal(false);
      await oneEvent(dialog(), 'wa-after-hide');
      expect(sources).to.deep.equal([card, card, part(card, 'close-button')]);
      // wa-hide cancelled: it stays open, once asked
      card.show(day);
      await oneEvent(card, 'wa-after-show');
      let asked = 0;
      const stop = event => { asked++; event.preventDefault(); };
      card.addEventListener('wa-hide', stop);
      await sendKeys({ press: 'Escape' });
      await aTimeout(50);
      expect(asked).to.equal(1);
      expect(card.open).to.equal(true);
      expect(dialog().open).to.equal(true);
      card.removeEventListener('wa-hide', stop);
      card.hide();
      await oneEvent(dialog(), 'wa-after-hide');
    });
  });

  it('shown again for another anchor in the middle it stays open: it closes and opens without the dialog closing', async () => {
    const { card, day, other } = await make();
    await withoutMouse(async () => {
      const seen = log(card, ['wa-show', 'wa-hide', 'wa-after-hide']);
      card.toggle(day);
      await oneEvent(card, 'wa-after-show');
      card.toggle(other);
      await aTimeout(300);
      expect(seen).to.deep.equal(['wa-show', 'wa-hide', 'wa-after-hide', 'wa-show']);
      expect(card.textContent).to.equal('About other');
      expect(card.shadowRoot.querySelector('wa-dialog').open).to.equal(true);
    });
  });

  it('is accessible', async () => {
    const { card, day } = await make();
    card.show(day);
    await oneEvent(card, 'wa-after-show');
    await expect(card).to.be.accessible();
  });
});
