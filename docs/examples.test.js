import { aTimeout, expect } from '@open-wc/testing';
import { setBasePath as setWebAwesomeBasePath, startLoader as startWebAwesomeLoader } from '@awesome.me/webawesome/dist/webawesome.loader.js';
import { setBasePath, startLoader } from '../src/webawesome-extras.loader.js';
import { extractExamples, mountExample, tagsOf } from './site/examples.js';

/**
 * Every example of the documentation (the `html example` blocks of every page in docs/pages.json) is mounted as the site mounts it, with the two loaders, and must define its
 * elements and throw no errors: a broken example fails here, in the three browsers.
 */

// The test runner serves the repository from its root, so the same folders the site loads from
setWebAwesomeBasePath('/node_modules/@awesome.me/webawesome/dist');
startWebAwesomeLoader();
setBasePath('/src');
startLoader();

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
