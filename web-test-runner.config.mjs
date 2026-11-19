/**
 * Settings of Web Test Runner, the one Web Awesome tests its components with: every `src/components/<name>/<name>.test.js` (and the one of the autoloader and the one that mounts the examples of the docs) runs in Chromium, Firefox and WebKit (Playwright),
 * with `@open-wc/testing` (`fixture`, `oneEvent`, `expect(el).to.be.accessible()`). The `*.state.test.js` files are the Node tests of the rules, which `node --test` runs.
 */
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
// The browsers are installed inside node_modules (`npx playwright install`), which is not committed
process.env.PLAYWRIGHT_BROWSERS_PATH ??= join(ROOT, 'node_modules', '.playwright');
// Imported after that: Playwright reads the variable when it loads
const { playwrightLauncher } = await import('@web/test-runner-playwright');

export default {
  files: ['src/components/*/*.test.js', 'src/utilities/*.test.js', 'docs/examples.test.js', '!src/**/*.state.test.js'],
  nodeResolve: true,
  // The tests that type and press keys need the focus of the page, which two pages open at once fight for
  concurrency: 1,
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
    playwrightLauncher({ product: 'firefox' }),
    playwrightLauncher({ product: 'webkit' }),
  ],
  // The theme of Web Awesome defines the --wa-* tokens that the elements use
  testRunnerHtml: testFramework => `<!doctype html>
<html>
  <head>
    <link rel="stylesheet" href="/node_modules/@awesome.me/webawesome/dist/styles/layers.css">
    <link rel="stylesheet" href="/node_modules/@awesome.me/webawesome/dist/styles/color/variants.css">
    <link rel="stylesheet" href="/node_modules/@awesome.me/webawesome/dist/styles/themes/default.css">
  </head>
  <body>
    <script type="module" src="${testFramework}"></script>
  </body>
</html>`,
};
