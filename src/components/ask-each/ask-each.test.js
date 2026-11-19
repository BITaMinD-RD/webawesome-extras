import { aTimeout, expect, fixture, html, oneEvent } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import './ask-each.js';

const files = [{ name: 'a.txt' }, { name: 'b.txt' }, { name: 'c.txt' }];

/** @returns {Promise<any>} */
const make = async () => {
  const el = await fixture(html`<wax-ask-each label="Overwrite?" question="Overwrite"></wax-ask-each>`);
  el.describe = file => `«${file.name}»`;
  el.labels = { yes: 'Overwrite', no: 'Skip', yesAll: 'Overwrite all', noAll: 'Skip all' };
  return el;
};
const button = (el, name) => el.shadowRoot.querySelector(`[part~="${name}"]`);
const text = (el, name) => el.shadowRoot.querySelector(`[part="${name}"]`).textContent.trim();
const log = (el, names = ['wa-show', 'wa-after-show', 'wa-hide', 'wa-after-hide']) => {
  const seen = [];
  for (const name of names) el.addEventListener(name, () => seen.push(name));
  return seen;
};
/** Asks, and waits until the dialog is open and ready: gives the promise of the answers inside an object, so that waiting for the dialog does not wait for the answers */
const ask = async (el, items = files) => {
  const answers = el.ask(items);
  await oneEvent(el, 'wa-after-show');
  return { answers };
};

describe('<wax-ask-each>', () => {
  it('is defined, closed, and importing it twice does no harm', async () => {
    await import('./ask-each.js?again');
    const el = await make();
    expect(customElements.get('wax-ask-each')).to.exist;
    expect(el.open).to.equal(false);
  });

  it('asks about each thing with the progress and the question, and gives the answers in order', async () => {
    const el = await make();
    const { answers } = await ask(el);
    expect(text(el, 'progress')).to.equal('1 de 3');
    expect(text(el, 'question')).to.equal('Overwrite «a.txt»');
    expect(button(el, 'yes').textContent.trim()).to.equal('Overwrite');
    button(el, 'yes').click();
    await el.updateComplete;
    expect(text(el, 'progress')).to.equal('2 de 3');
    expect(text(el, 'question')).to.equal('Overwrite «b.txt»');
    button(el, 'no').click();
    button(el, 'yes').click();
    expect(await answers).to.deep.equal([true, false, true]);
  });

  it('answers the rest the same with «yes to all» (and says it in wax-all), keeping what was answered', async () => {
    const el = await make();
    const heard = [];
    el.addEventListener('wax-all', event => heard.push(event.detail.value));
    const { answers } = await ask(el);
    button(el, 'no').click();
    button(el, 'yes-all').click();
    expect(await answers).to.deep.equal([false, true, true]);
    expect(heard).to.deep.equal([true]);
    const { answers: more } = await ask(el, files);
    button(el, 'no-all').click();
    expect(await more).to.deep.equal([false, false, false]);
    expect(heard).to.deep.equal([true, false]);
  });

  it('says each answer in wax-answer', async () => {
    const el = await make();
    const heard = [];
    el.addEventListener('wax-answer', event => heard.push([event.detail.index, event.detail.item.name, event.detail.action]));
    const { answers } = await ask(el);
    button(el, 'yes').click();
    button(el, 'cancel').click();
    await answers;
    expect(heard).to.deep.equal([[0, 'a.txt', 'yes'], [1, 'b.txt', 'cancel']]);
  });

  it('gives null when Cancel is pressed, even after answering some', async () => {
    const el = await make();
    const seen = log(el);
    const { answers } = await ask(el);
    button(el, 'yes').click();
    button(el, 'cancel').click();
    expect(await answers).to.equal(null);
    expect(seen).to.deep.equal(['wa-show', 'wa-after-show', 'wa-hide', 'wa-after-hide']);
    expect(el.open).to.equal(false);
  });

  it('gives null on Escape, and lets wa-hide cancel the dismissal', async () => {
    const el = await make();
    const stop = event => event.preventDefault();
    el.addEventListener('wa-hide', stop);
    const { answers } = await ask(el);
    await sendKeys({ press: 'Escape' });
    await aTimeout(300);
    expect(el.open).to.equal(true, 'cancelled: it stays');
    el.removeEventListener('wa-hide', stop);
    const seen = log(el, ['wa-hide', 'wa-after-hide']);
    await sendKeys({ press: 'Escape' });
    expect(await answers).to.equal(null);
    expect(seen).to.deep.equal(['wa-hide', 'wa-after-hide']);
  });

  it('closes with the answers when the last one is answered', async () => {
    const el = await make();
    const { answers } = await ask(el, [files[0]]);
    button(el, 'yes').click();
    expect(await answers).to.deep.equal([true]);
    expect(el.open).to.equal(false);
  });

  it('has Enter as the first button, the positive verb', async () => {
    const el = await make();
    const { answers } = await ask(el, [files[0]]);
    await sendKeys({ press: 'Enter' });
    expect(await answers).to.deep.equal([true]);
  });

  it('opens and closes with the open property like a wa-dialog, and with nothing to ask the answer is empty', async () => {
    const el = await make();
    expect(await el.ask([])).to.deep.equal([]);
    expect(el.open).to.equal(false);
    el.open = true;
    await oneEvent(el, 'wa-after-show');
    el.open = false;
    await oneEvent(el, 'wa-after-hide');
    expect(el.open).to.equal(false);
  });

  it('keeps it closed when wa-show is cancelled, and the answer is null', async () => {
    const el = await make();
    el.addEventListener('wa-show', event => event.preventDefault());
    expect(await el.ask(files)).to.equal(null);
    await aTimeout(100);
    expect(el.open).to.equal(false);
  });

  it('is accessible', async () => {
    const el = await make();
    await ask(el);
    await expect(el).to.be.accessible();
  });
});
