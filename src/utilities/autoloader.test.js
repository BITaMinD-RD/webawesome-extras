import { aTimeout, expect, fixture, html, oneEvent } from '@open-wc/testing';
import { discover, startLoader, stopLoader } from './autoloader.js';
import { getBasePath, setBasePath } from './base-path.js';

// The test runner serves the repository from its root: the package is in /src
setBasePath('/src');

describe('the autoloader', () => {
  afterEach(() => stopLoader());

  it('gives paths inside the package from its base path', () => {
    expect(getBasePath()).to.equal('/src');
    expect(getBasePath('components/combobox/combobox.js')).to.equal('/src/components/combobox/combobox.js');
    setBasePath('/lib/webawesome-extras/');
    expect(getBasePath('/components/x/x.js')).to.equal('/lib/webawesome-extras/components/x/x.js');
    setBasePath('/src');
  });

  it('defines the wax-* elements of a page that are not defined, and says when it is done (wax-discovery-complete)', async () => {
    // Parsed into the page, as the markup of a page is (not made by a template engine: WebKit does not upgrade those after the fact)
    const page = document.createElement('div');
    page.innerHTML = '<wax-list-manager></wax-list-manager>';
    document.body.append(page);
    expect(customElements.get('wax-list-manager')).to.equal(undefined);
    const done = oneEvent(page, 'wax-discovery-complete');
    discover(page);
    await done;
    expect(customElements.get('wax-list-manager')).to.exist;
    expect(customElements.get('wax-item-list')).to.exist;   // the one it has inside imports the one it uses
    const element = page.querySelector('wax-list-manager');
    await element.updateComplete;
    expect(element.shadowRoot).to.exist;
    page.remove();
  });

  it('loads the elements that appear later, when the loader watches the page', async () => {
    startLoader();
    const page = await fixture(html`<div></div>`);
    const element = document.createElement('wax-ask-each');
    const done = oneEvent(element, 'wax-discovery-complete');
    page.append(element);
    await done;
    expect(customElements.get('wax-ask-each')).to.exist;
    await element.updateComplete;
    expect(element.shadowRoot).to.exist;
  });

  it('loads what data-wax-preload asks for even if the page does not have it yet, and leaves alone what is not wax-*', async () => {
    const page = await fixture(html`<div data-wax-preload="wax-floating-card wa-button other"></div>`);
    const done = oneEvent(page, 'wax-discovery-complete');
    discover(page);
    await done;
    expect(customElements.get('wax-floating-card')).to.exist;
  });

  it('warns, and does not fail, for a wax-* tag that is not in the package', async () => {
    const warned = [];
    const real = console.warn;
    console.warn = (...args) => { warned.push(args.join(' ')); };
    try {
      const page = await fixture(html`<div><wax-nothing-here></wax-nothing-here></div>`);
      const done = oneEvent(page, 'wax-discovery-complete');
      discover(page);
      await done;
    } finally {
      console.warn = real;
    }
    expect(warned.join('\n')).to.include('wax-nothing-here');
    await aTimeout(0);
  });
});
