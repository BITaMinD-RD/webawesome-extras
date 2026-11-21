import { aTimeout, expect, fixture, html, oneEvent } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import './combobox.js';

const choices = [
  { value: 'es', label: 'España' }, { value: 'fr', label: 'Francia' }, { value: 'de', label: 'Alemania' }, { value: 'ar', label: 'Arabia Saudí' }
];

/** @returns {Promise<any>} */
const make = async (template = html`<wax-combobox label="Country" placeholder="Pick one" empty-text="Nothing matches" query-delay="20"></wax-combobox>`) => {
  const el = await fixture(template);
  el.choices = choices;
  await el.updateComplete;
  return el;
};
const select = el => el.shadowRoot.querySelector('wa-select');
const search = el => el.shadowRoot.querySelector('wa-input');
const options = el => [...el.shadowRoot.querySelectorAll('wa-option')];
const shown = el => options(el).filter(option => !option.hidden && !option.hasAttribute('disabled')).map(option => option.textContent.trim());

/** Opens the list and waits until the focus is in the search box, which is where the typing goes */
const open = async el => {
  await select(el).updateComplete;
  setTimeout(() => { select(el).open = true; });
  await oneEvent(select(el), 'wa-after-show');
  await aTimeout(50);
};

describe('<wax-combobox>', () => {
  it('is defined, and importing it twice does no harm', async () => {
    await import('./combobox.js?again');
    expect(customElements.get('wax-combobox')).to.exist;
  });

  it('draws a wa-select with an option per choice, and the title as its placeholder', async () => {
    const el = await make();
    expect(select(el).getAttribute('placeholder')).to.equal('Pick one');
    expect(options(el).filter(o => o.getAttribute('value')).map(o => o.getAttribute('value'))).to.deep.equal(['es', 'fr', 'de', 'ar']);
    expect(el.value).to.equal('');
  });

  it('has a value that can only be one of the choices: anything else is nothing', async () => {
    const el = await make();
    el.value = 'fr';
    await el.updateComplete;
    expect(el.value).to.equal('fr');
    expect(select(el).value).to.equal('fr');
    el.value = 'zz';
    expect(el.value).to.equal('');
    el.value = 'de';
    el.choices = choices.filter(c => c.value !== 'de');
    expect(el.value).to.equal('', 'a value that is no longer offered goes');
  });

  it('adds «choose nothing» first when it has an empty-label', async () => {
    const el = await make(html`<wax-combobox empty-label="(none)"></wax-combobox>`);
    expect(options(el)[0].getAttribute('value')).to.equal('');
    expect(options(el)[0].textContent.trim()).to.equal('(none)');
    expect(select(el).getAttribute('placeholder')).to.equal('(none)');
  });

  it('puts the focus in the search box when it opens, and typing hides the options that do not match', async () => {
    const el = await make();
    await open(el);
    expect(el.shadowRoot.activeElement).to.equal(search(el));
    await sendKeys({ type: 'arab' });
    await el.updateComplete;
    expect(shown(el)).to.deep.equal(['Arabia Saudí']);
    expect(options(el).at(-1).hidden).to.equal(true, 'the notice that nothing matches is not shown while something does');
  });

  it('says that nothing matches when nothing does', async () => {
    const el = await make();
    await open(el);
    await sendKeys({ type: 'zzz' });
    await el.updateComplete;
    expect(shown(el)).to.deep.equal([]);
    expect(options(el).at(-1).hidden).to.equal(false);
    expect(options(el).at(-1).textContent.trim()).to.equal('Nothing matches');
  });

  it('chooses the first option that is seen with Enter in the search box, and fires change once', async () => {
    const el = await make();
    await open(el);
    let changes = 0;
    el.addEventListener('change', () => { changes++; });
    await sendKeys({ type: 'fra' });
    setTimeout(() => sendKeys({ press: 'Enter' }));
    await oneEvent(el, 'change');
    expect(el.value).to.equal('fr');
    expect(changes).to.equal(1);
  });

  it('does not let what is typed in the search box out as an input or change of its own', async () => {
    const el = await make();
    await open(el);
    const heard = [];
    for (const type of ['input', 'change']) el.addEventListener(type, () => heard.push(type));
    await sendKeys({ type: 'es' });
    expect(heard).to.deep.equal([]);
  });

  it('tells whoever fetches the choices what was typed (wax-query), a moment after typing stops', async () => {
    const el = await make();
    await open(el);
    setTimeout(() => sendKeys({ type: 'sau' }));
    const asked = await oneEvent(el, 'wax-query');
    expect(asked.detail).to.deep.equal({ query: 'sau' });
  });

  it('takes part in a form: its name and value are sent, and a required one with nothing chosen is invalid', async () => {
    const form = await fixture(html`<form><wax-combobox name="country" required placeholder="Country"></wax-combobox></form>`);
    const el = form.querySelector('wax-combobox');
    el.choices = choices;
    await el.updateComplete;
    expect(form.checkValidity()).to.equal(false);
    el.value = 'ar';
    await el.updateComplete;
    expect(form.checkValidity()).to.equal(true);
    expect(new FormData(form).get('country')).to.equal('ar');
  });

  it('a required one is valid as soon as the user chooses an option, not only when the value is set from code', async () => {
    const form = await fixture(html`<form><wax-combobox name="country" required placeholder="Country"></wax-combobox></form>`);
    const el = form.querySelector('wax-combobox');
    el.choices = choices;
    await el.updateComplete;
    expect(form.checkValidity()).to.equal(false);
    await open(el);
    await sendKeys({ type: 'Fran' });
    await sendKeys({ press: 'Enter' });
    await aTimeout(50);
    expect(el.value).to.equal('fr');
    expect(form.checkValidity()).to.equal(true);
    expect(new FormData(form).get('country')).to.equal('fr');
  });

  it('is accessible', async () => {
    const el = await make();
    await expect(el).to.be.accessible();
  });
});
