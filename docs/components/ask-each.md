# Ask each

`<wax-ask-each>` is the usual question when something has to be decided about several things ("overwrite this file?"): it asks about each one in a dialog, with the progress ("2 of 5"). The answer can
be "yes to all" or "no to all" for the rest, or the user can cancel, so that nothing happens.

Use it when an action touches a list of things and each one may need a different answer (overwrite, skip, merge). For a single yes or no, a `wa-dialog` with two buttons is simpler.

It knows nothing of what it asks: whoever uses it gives the verbs (`labels`) and how each thing is named (`describe`). It is a `wa-dialog` inside, so it opens and closes like one: the
`open` property, `show()` and `hide()`, `light-dismiss`, Escape, and the events of Web Awesome that its dialog fires, which come out of this element as they are. Enter is the first button (the positive verb).

```html
<wax-ask-each label="Overwrite?" question="Overwrite"></wax-ask-each>
```

## Examples

Every example on this page is mounted by the tests of the repository, so they work as shown. The scripts find their elements by `id` and assume the
[loaders](../installation.md) of the page. The dialogs open when you press the button.

### Asking about each thing

`ask(items)` opens the dialog and gives a promise of the answers: an array of booleans in the order of the items (`true` is the positive verb), or `null` if the user cancelled. `describe` says how each
item is named in the question, after the `question` text.

```html example
<wax-ask-each id="basic-ask" label="Overwrite?" question="Overwrite" light-dismiss></wax-ask-each>
<wa-button id="basic-button">Ask about three files</wa-button>
<p id="basic-output">Not asked yet.</p>

<script type="module">
  const askEach = document.getElementById('basic-ask');
  askEach.describe = file => `"${file}"?`;
  askEach.labels = { yes: 'Overwrite', no: 'Skip', yesAll: 'Overwrite all', noAll: 'Skip all', cancel: 'Cancel', progress: '{n} of {total}' };
  document.getElementById('basic-button').addEventListener('click', async () => {
    const files = ['apples.txt', 'bananas.txt', 'cherries.txt'];
    const answers = await askEach.ask(files);
    document.getElementById('basic-output').textContent = answers
      ? answers.map((answer, index) => `${files[index]}: ${answer ? 'overwrite' : 'skip'}`).join('; ')
      : 'Cancelled: nothing happens.';
  });
</script>
```

### Texts

The buttons and the progress line come from `labels`. The ones that are not given are Spanish (`Sí`, `No`, `Sí a todos`, `No a todos`, `Cancelar` and `{n} de {total}`), so an application in another
language gives them all. `{n}` and `{total}` are replaced in `progress`.

```html example
<wax-ask-each id="labels-ask" label="Delete?" question="Delete"></wax-ask-each>
<wa-button id="labels-button">Ask in other words</wa-button>

<script type="module">
  const askEach = document.getElementById('labels-ask');
  askEach.describe = name => `${name}?`;
  askEach.labels = { yes: 'Delete', no: 'Keep', yesAll: 'Delete everything', noAll: 'Keep everything', cancel: 'Never mind', progress: 'Question {n} of {total}' };
  document.getElementById('labels-button').addEventListener('click', () => askEach.ask(['Ada', 'Bruno']));
</script>
```

### Hearing every answer

`wax-answer` fires for each answer, with `detail: { index, item, action }`; `action` is `yes`, `no`, `yesAll`, `noAll` or `cancel`. `wax-all` fires when the user answers "to all", with
`detail.value`, for whoever goes on answering the same to what is asked later.

```html example
<wax-ask-each id="events-ask" label="Move?" question="Move"></wax-ask-each>
<wa-button id="events-button">Ask about three items</wa-button>
<pre id="events-output">No answers yet.</pre>

<script type="module">
  const askEach = document.getElementById('events-ask');
  const output = document.getElementById('events-output');
  const log = [];
  askEach.describe = item => `${item}?`;
  askEach.addEventListener('wax-answer', event => {
    log.push(`${event.detail.index}: ${event.detail.item} -> ${event.detail.action}`);
    output.textContent = log.join('\n');
  });
  askEach.addEventListener('wax-all', event => log.push(`(to all: ${event.detail.value})`));
  document.getElementById('events-button').addEventListener('click', () => {
    log.length = 0;
    askEach.ask(['Mint', 'Basil', 'Sage']);
  });
</script>
```

### Opening and closing like a dialog

The events of Web Awesome come out as they are: `wa-show` and `wa-hide` can be cancelled (`preventDefault()` keeps the dialog as it was) and `wa-after-hide` says the answer is ready. This
example only reports the last event it heard, to show when each one comes.

```html example
<wax-ask-each id="dialog-ask" label="Replace?" question="Replace" light-dismiss></wax-ask-each>
<wa-button id="dialog-button">Ask</wa-button>
<p id="dialog-output">Not asked yet.</p>

<script type="module">
  const askEach = document.getElementById('dialog-ask');
  askEach.describe = item => `${item}?`;
  for (const name of ['wa-show', 'wa-hide', 'wa-after-hide']) {
    askEach.addEventListener(name, event => {
      if (event.target === askEach) document.getElementById('dialog-output').textContent = `Last event: ${name}`;
    });
  }
  document.getElementById('dialog-button').addEventListener('click', () => askEach.ask(['Tea', 'Coffee']));
</script>
```

### Styling

The width of the dialog is `--ask-each-width`; its [parts](#parts) reach the progress line, the question and each button.

```html example
<style>
  #styled-ask { --ask-each-width: 24rem; }
  #styled-ask::part(progress) { font-weight: var(--wa-font-weight-bold); }
  #styled-ask::part(no-all) { opacity: 0.7; }
</style>
<wax-ask-each id="styled-ask" label="Keep?" question="Keep"></wax-ask-each>
<wa-button id="styled-button">Open it</wa-button>

<script type="module">
  const askEach = document.getElementById('styled-ask');
  askEach.describe = item => `${item}?`;
  document.getElementById('styled-button').addEventListener('click', () => askEach.ask(['Oak', 'Birch']));
</script>
```

## Importing

With the [loader](../installation.md), which defines the element when it appears in the page:

```html
<script type="module" data-webawesome-extras="/lib/webawesome-extras" src="/lib/webawesome-extras/webawesome-extras.loader.js"></script>
```

An element that is made by code and used at once needs `await customElements.whenDefined('wax-ask-each')` before calling `ask()`.

Cherry-picked, with no loader: one import defines the element, and the Web Awesome components it uses inside (`wa-dialog` and `wa-button`) are imported by the element itself, so the page needs the
import map of the [installation](../installation.md):

```js
import '/lib/webawesome-extras/components/ask-each/ask-each.js';
```

In React, with the wrapper of `dist/react` (see [React](../react.md)); `describe` and `labels` are properties, so they are props too:

```jsx
import { WaxAskEach } from './lib/webawesome-extras/dist/react/wax-ask-each.js';

<WaxAskEach ref={ask} label="Overwrite?" question="Overwrite" describe={file => `"${file.name}"?`} onWaxAnswer={event => record(event.detail)} />
// await ask.current.ask(files)
```

## Reference

The tables are generated from `custom-elements.json` by `npm run docs`; do not edit them by hand.

<!-- api:start -->

### Properties and attributes

| Property | Description | Attribute | Type | Default |
|---|---|---|---|---|
| `open` | It is open | `open` | `boolean` | `false` |
| `label` | The title of the dialog | `label` | `string` | `''` |
| `question` | The beginning of the question | `question` | `string` | `''` |
| `lightDismiss` | Clicking outside the dialog cancels it (attribute `light-dismiss`) | `light-dismiss` | `boolean` | `false` |
| `describe` | How each thing is named in the question |  | `(item: any) => string` |  |
| `labels` | The verbs of the buttons and the progress (`{n} de {total}`); the ones not given are Spanish |  | `Record<string, string>` | `{}` |

### Methods

| Method | Description | Arguments | Returns |
|---|---|---|---|
| `ask(items)` | Asks about each thing in turn, in a dialog, and resolves when it has closed with what was answered for each one: booleans in the order of the items (`true` is the positive verb), `null` if it was cancelled, `[]` if there was nothing to ask. | `items: T[]` What is asked about | `Promise<boolean[] \| null>` |
| `show()` | Opens it, like a `wa-dialog` (without anything to ask there is nothing to see: `ask()` is what opens it with questions) |  |  |
| `hide()` | Closes it: what was being asked is cancelled |  |  |

### Events

| Event | Description | Class |
|---|---|---|
| `wa-show` | It is going to open. Cancellable: `preventDefault()` keeps it closed and `ask()` gives null | `WaShowEvent` |
| `wa-after-show` | It is open | `WaAfterShowEvent` |
| `wa-hide` | It is going to close, because an answer ended the questions or it was dismissed (Escape, outside, its cross). Cancellable: `preventDefault()` keeps it open. `detail: { source }` | `WaHideEvent` |
| `wa-after-hide` | It is closed, and `ask()` has its answer | `WaAfterHideEvent` |
| `wax-answer` | A question was answered (or the whole thing cancelled). `detail: { index, item, action }`, `action` is `yes`, `no`, `yesAll`, `noAll` or `cancel` |  |
| `wax-all` | «Yes to all» or «no to all» was answered: for whoever goes on answering the same to what is asked later. `detail: { value }` |  |

### Parts

| Part | Description |
|---|---|
| `dialog` | The `wa-dialog` (and, through it, its `header`, `title`, `body`, `footer` and `close-button`) |
| `progress` | The line «2 de 5» |
| `question` | The question |
| `button` | Each of the buttons. Also `yes`, `no`, `yes-all`, `no-all` and `cancel` |

### CSS custom properties

| Property | Description |
|---|---|
| `--ask-each-width` | The width of the dialog (`31rem`, the one of a `wa-dialog`) |

<!-- api:end -->
