# Combobox

`<wax-combobox>` is a box to choose one value from a list with a search box to filter it by typing: what a `<select>` with many options should be. It is a Web Awesome `wa-select`
whose first child is a search box (a `wa-input`). When it opens the focus goes to the search box, typing hides the options that do not match, the arrows pass from the box to the options
that are shown, and Enter in the box chooses the first one.

Use it where a `<select>` would go and the list is long enough that scrolling it is a nuisance: it has `value`, `disabled`, `name` and `required`, takes part in a form and fires `change` when
something is chosen. It chooses only among what it has: what is typed is for searching and is not kept. If the choices have to be fetched while the user types, listen to `wax-query`.
For a short list a plain `wa-select` is enough.

```html
<wax-combobox label="City" placeholder="Pick one..."></wax-combobox>
```

## Examples

Every example on this page is mounted by the tests of the repository, so they work as shown. The scripts find their elements by `id` and assume the
[loaders](../installation.md) of the page.

### Choices

Give it the `choices` property, a list of `{ value, label }`. The `label` attribute is written above the box, and the `placeholder` is the grey title while nothing is chosen.
It fires `change`, like a `wa-select`, and the `value` is what was chosen.

```html example
<wax-combobox id="city-combobox" label="City" placeholder="Pick a city..." search-placeholder="Search..." empty-text="No city matches"></wax-combobox>
<p id="city-output">Nothing chosen yet.</p>

<script type="module">
  const combo = document.getElementById('city-combobox');
  combo.choices = ['Oslo', 'Lima', 'Kyoto', 'Cairo', 'Quito', 'Hanoi', 'Dublin', 'Accra', 'Lisbon', 'Sydney']
    .map(city => ({ value: city.toLowerCase(), label: city }));
  combo.addEventListener('change', () => {
    document.getElementById('city-output').textContent = `Chosen: ${combo.value}`;
  });
</script>
```

### A value from the start

Set the `choices` first and then the `value`: a value that is not among the choices is dropped.

```html example
<wax-combobox id="colour-combobox" label="Colour"></wax-combobox>

<script type="module">
  const combo = document.getElementById('colour-combobox');
  combo.choices = [{ value: 'red', label: 'Red' }, { value: 'green', label: 'Green' }, { value: 'blue', label: 'Blue' }];
  combo.value = 'green';
</script>
```

### Choosing nothing

With `empty-label` the first option is "choose nothing", which gives the empty value. It is also the title of the box when there is no `placeholder`.

```html example
<wax-combobox id="optional-combobox" label="Favourite fruit (optional)" empty-label="No favourite"></wax-combobox>

<script type="module">
  document.getElementById('optional-combobox').choices = ['Apple', 'Banana', 'Cherry'].map(fruit => ({ value: fruit.toLowerCase(), label: fruit }));
</script>
```

### In a form

It has `name` and `required` and takes part in a form like any field: its value is in the `FormData`, and a required one blocks the submission until something is chosen.

```html example
<form id="form-example">
  <wax-combobox id="form-combobox" name="fruit" label="Fruit" placeholder="Pick one..." required></wax-combobox>
  <button type="submit">Send</button>
  <p id="form-output">Not sent yet.</p>
</form>

<script type="module">
  document.getElementById('form-combobox').choices = ['Apple', 'Banana', 'Cherry', 'Plum'].map(fruit => ({ value: fruit.toLowerCase(), label: fruit }));
  document.getElementById('form-example').addEventListener('submit', event => {
    event.preventDefault();
    document.getElementById('form-output').textContent = `Sent: ${new FormData(event.target).get('fruit')}`;
  });
</script>
```

### Disabled

A disabled combobox cannot be used yet, for example while another one has to be chosen first.

```html example
<wax-combobox id="disabled-combobox" label="District" placeholder="Choose a city first" disabled></wax-combobox>
```

### Choices that are fetched

When the choices are too many to hold, or live somewhere else, listen to `wax-query`. It fires when the user types and stops for `query-delay` milliseconds (300 by default), with `detail.query`,
and again with an empty query when the search is forgotten. Answer by setting `choices`.

```html example
<wax-combobox id="remote-combobox" label="Name" placeholder="Type to search..." query-delay="150"></wax-combobox>
<p id="remote-output">No query yet.</p>

<script type="module">
  const names = ['Ana', 'Anselm', 'Bea', 'Carlos', 'Clara', 'Diego', 'Elsa', 'Emil', 'Fiona'];
  const combo = document.getElementById('remote-combobox');
  const search = query => names.filter(name => name.toLowerCase().includes(query.toLowerCase())).map(name => ({ value: name, label: name }));
  combo.choices = search('');
  combo.addEventListener('wax-query', event => {
    // A real application would ask a server here
    combo.choices = search(event.detail.query);
    document.getElementById('remote-output').textContent = `Query: "${event.detail.query}", ${combo.choices.length} choices.`;
  });
</script>
```

### Styling

The inside is open to styling through [parts](#parts). The space below the box is `--combobox-gap`.

```html example
<style>
  #styled-combobox { --combobox-gap: var(--wa-space-xl); }
  #styled-combobox::part(select) { max-width: 20rem; }
  #styled-combobox::part(search) { --wa-form-control-border-color: var(--wa-color-brand-border-loud); }
</style>
<wax-combobox id="styled-combobox" label="Style" placeholder="Pick one..."></wax-combobox>

<script type="module">
  document.getElementById('styled-combobox').choices = [{ value: 'a', label: 'Plain' }, { value: 'b', label: 'Striped' }];
</script>
```

## Texts

The combobox has no language of its own except one default: the placeholder of its search box is `Buscar...` (Spanish) until you set `search-placeholder`. Everything else, the label, the
placeholder, the text of the empty option and of "nothing matches", comes from the application.

## Importing

With the [loader](../installation.md), which defines the element when it appears in the page:

```html
<script type="module" data-webawesome-extras="/lib/webawesome-extras" src="/lib/webawesome-extras/webawesome-extras.loader.js"></script>
```

Cherry-picked, with no loader: one import defines the element, and the Web Awesome components it uses inside (`wa-select`, `wa-option` and `wa-input`) are imported by the element itself, so the
page needs the import map of the [installation](../installation.md):

```js
import '/lib/webawesome-extras/components/combobox/combobox.js';
```

In React, with the wrapper of `dist/react` (see [React](../react.md)):

```jsx
import { WaxCombobox } from './lib/webawesome-extras/dist/react/wax-combobox.js';

<WaxCombobox label="City" choices={cities} value={city} onChange={event => setCity(event.target.value)} />
```

## Reference

The tables are generated from `custom-elements.json` by `npm run docs`; do not edit them by hand.

<!-- api:start -->

### Properties and attributes

| Property | Description | Attribute | Type | Default |
|---|---|---|---|---|
| `name` | The name of the field in a form | `name` | `string` |  |
| `choices` | What is offered. What was chosen stays if it is still there |  | `{value: string, label: string}[]` |  |
| `value` | What is chosen, empty for nothing. Only one of the choices: anything else leaves nothing chosen. Set `choices` first |  | `string` |  |
| `label` | What the box is called, written above it | `label` | `string` | `''` |
| `placeholder` | The title, grey while nothing is chosen | `placeholder` | `string` | `''` |
| `searchPlaceholder` | What the search box says while it is empty (attribute `search-placeholder`) | `search-placeholder` | `string` | `'Buscar...'` |
| `emptyLabel` | If set, a first option «choose nothing» with this name (attribute `empty-label`) | `empty-label` | `string \| undefined` | `undefined` |
| `emptyText` | What it says if what was typed matches nothing (attribute `empty-text`) | `empty-text` | `string` | `''` |
| `required` | The form is not sent without a choice | `required` | `boolean` | `false` |
| `disabled` | It cannot be used yet | `disabled` | `boolean` | `false` |
| `queryDelay` | Milliseconds without typing before `wax-query` (attribute `query-delay`) | `query-delay` | `number` | `300` |

### Events

| Event | Description |
|---|---|
| `change` | Something was chosen, with the mouse, the keys or Enter in the search box (like the `change` of a `wa-select`; the typing in the search box is not announced) |
| `wax-query` | The user typed in the search box and stopped (`query-delay`), or the search was forgotten (`query` is empty): for whoever has to fetch the choices that match. `detail: { query }` |

### Parts

| Part | Description |
|---|---|
| `select` | The `wa-select` |
| `search` | The search box |
| `option` | One option. Also `empty`, for the «choose nothing» one, and `none`, for the notice that nothing matches |

### CSS custom properties

| Property | Description |
|---|---|
| `--combobox-gap` | The space below it (`--wa-space-m`: the usual one between a control and what goes below it) |

<!-- api:end -->
