# List manager

`<wax-list-manager>` is the block that repeats in the screens that edit things: the filters (if any), the search box, a "New" button and, below, the list of what there is, where one entry is chosen.
Clicking the chosen entry again does not clear it: in an editor, something stays open until the user opens another thing.

Use it for the left column of a master and detail screen: people, places, recipes. It knows nothing of what the entries are or how they are filtered: whoever uses it gives what is to be shown
(`items`) when what is typed changes (`wax-query`). The list is a [`<wax-item-list>`](item-list.md), whose parts are exported, and the search box and the button are Web Awesome's own `wa-input` and `wa-button`.

```html
<wax-list-manager search-placeholder="Search..." new-label="New" empty="Nothing here"></wax-list-manager>
```

## Examples

Every example on this page is mounted by the tests of the repository, so they work as shown. The scripts find their elements by `id` and assume the
[loaders](../installation.md) of the page.

### Searching and choosing

Set `items` (the same shape as [the item list](item-list.md#the-shape-of-an-item), without `html`). When the user types, `wax-query` fires with `detail.query` and the application answers with
the items that match. `wax-select` fires with `detail.key` when an entry is chosen; `manager.query` is what is typed.

```html example
<wax-list-manager id="people-manager" search-placeholder="Search people..." new-label="New person" empty="Nobody matches" style="max-height: 20rem"></wax-list-manager>
<p id="people-output">Nothing chosen yet.</p>

<script type="module">
  const people = [
    { key: 'ada', icon: '🙂', name: 'Ada', note: 'Oslo' },
    { key: 'bruno', icon: '🙂', name: 'Bruno', note: 'Lima' },
    { key: 'carla', icon: '🙂', name: 'Carla', note: 'Kyoto' },
    { key: 'dario', icon: '🙂', name: 'Dario', note: 'Cairo' },
  ];
  const manager = document.getElementById('people-manager');
  manager.items = people;
  manager.addEventListener('wax-query', event => {
    manager.items = people.filter(person => person.name.toLowerCase().includes(event.detail.query.toLowerCase()));
  });
  manager.addEventListener('wax-select', event => {
    document.getElementById('people-output').textContent = `Open: ${event.detail.key}`;
  });
</script>
```

### The New button

The button is always above the list, in case the list is long. It fires `wax-new` and the application decides what "new" is. Here it adds an entry and chooses it from code with
`select(key)`, which does not fire `wax-select`.

```html example
<wax-list-manager id="new-manager" search-placeholder="Search..." new-label="New colour" empty="No colours"></wax-list-manager>

<script type="module">
  const colours = [{ key: 'red', name: 'Red', icon: '🔴' }, { key: 'blue', name: 'Blue', icon: '🔵' }];
  const manager = document.getElementById('new-manager');
  manager.items = colours;
  manager.addEventListener('wax-new', () => {
    const key = `colour-${colours.length + 1}`;
    colours.push({ key, name: `Colour ${colours.length + 1}`, icon: '⚪' });
    manager.items = colours;
    manager.select(key);
  });
</script>
```

### Filters

What goes in the `filters` slot appears above the search box: usually comboboxes or selects that narrow the list. They are the page's, so the page listens to them and gives the manager the
entries that pass all the filters.

```html example
<wax-list-manager id="filter-manager" search-placeholder="Search..." new-label="New fruit" empty="No fruit matches" style="max-height: 20rem">
  <wa-select slot="filters" id="filter-colour" label="Colour" value="all">
    <wa-option value="all">All colours</wa-option>
    <wa-option value="red">Red</wa-option>
    <wa-option value="yellow">Yellow</wa-option>
  </wa-select>
</wax-list-manager>

<script type="module">
  const fruits = [
    { key: 'apple', icon: '🍎', name: 'Apple', colour: 'red' },
    { key: 'cherry', icon: '🍒', name: 'Cherry', colour: 'red' },
    { key: 'banana', icon: '🍌', name: 'Banana', colour: 'yellow' },
    { key: 'lemon', icon: '🍋', name: 'Lemon', colour: 'yellow' },
  ];
  const manager = document.getElementById('filter-manager');
  const colour = document.getElementById('filter-colour');
  const refresh = () => {
    manager.items = fruits.filter(fruit => (colour.value === 'all' || fruit.colour === colour.value) && fruit.name.toLowerCase().includes(manager.query.toLowerCase()));
  };
  refresh();
  manager.addEventListener('wax-query', refresh);
  colour.addEventListener('change', refresh);
</script>
```

### Empty state

With no `items` the list says the text of `empty`. The search box and the New button are still there, so the user can start from nothing.

```html example
<wax-list-manager id="empty-manager" search-placeholder="Search..." new-label="New place" empty="No places yet. Press New to add the first."></wax-list-manager>
```

### Styling

The search box, the row of the button, the button and the list are [parts](#parts), and the parts of the inner list (`line`, `selected`, `name`, `note`...) are exported through it.

```html example
<style>
  #styled-manager::part(new-button) { --wa-color-fill-loud: var(--wa-color-success-fill-loud); }
  #styled-manager::part(line) { padding-block: var(--wa-space-xs); }
  #styled-manager::part(selected) { font-weight: var(--wa-font-weight-bold); }
</style>
<wax-list-manager id="styled-manager" search-placeholder="Search..." new-label="Add"></wax-list-manager>

<script type="module">
  const manager = document.getElementById('styled-manager');
  manager.items = [{ key: 'a', name: 'Alpha', note: 'first' }, { key: 'b', name: 'Beta', note: 'second' }];
  manager.select('b');
</script>
```

## Texts

Two texts have a default in the language of the page (see [Localization](../localization.md)): the placeholder of the search box (`waxSearch`, `Search...`) until you set `search-placeholder`, and the button
(`waxNew`, `New`) until you set `new-label`. `search-label` (what the search box is called for those who do not see it, the placeholder if it is not given) and `empty` come from the application. The handle label of the inner
list (when it is movable) is the one noted in the [item list](item-list.md#texts).

## Importing

With the [loader](../installation.md), which defines the element when it appears in the page, and also the `wax-item-list` it has inside:

```html
<script type="module" data-webawesome-extras="/lib/webawesome-extras" src="/lib/webawesome-extras/webawesome-extras.loader.js"></script>
```

Cherry-picked, with no loader: one import defines the manager, and it imports the Web Awesome components it uses inside (`wa-input` and `wa-button`), so the page needs the import map of the
[installation](../installation.md):

```js
import '/lib/webawesome-extras/components/list-manager/list-manager.js';
```

In React, with the wrapper of `dist/react` (see [React](../react.md)):

```jsx
import { WaxListManager } from './lib/webawesome-extras/dist/react/wax-list-manager.js';

<WaxListManager items={items} newLabel="New" searchPlaceholder="Search..." onWaxSelect={event => open(event.detail.key)} onWaxNew={create} onWaxQuery={event => setQuery(event.detail.query)} />
```

## Reference

The tables are generated from `custom-elements.json` by `npm run docs`; do not edit them by hand.

<!-- api:start -->

### Properties and attributes

| Property | Description | Attribute | Type | Default |
|---|---|---|---|---|
| `query` | What is typed in the search box (read only) |  | `string` |  |
| `items` | What is shown, each one a `ListItem` of `<wax-item-list>` (without `html`: the markup of a line goes to the light DOM of the list, which here is its shadow). The chosen entry stays chosen if it is still there |  | `ListItem[]` | `[]` |
| `searchPlaceholder` | What the search box says while it is empty (attribute `search-placeholder`) | `search-placeholder` | `string` | `''` |
| `searchLabel` | What the search box is called for who does not see it (attribute `search-label`) | `search-label` | `string` | `''` |
| `newLabel` | The text of the button (attribute `new-label`) | `new-label` | `string` | `''` |
| `empty` | What it says with nothing to show | `empty` | `string` | `''` |

### Methods

| Method | Description | Arguments | Returns |
|---|---|---|---|
| `select(key)` | Chooses an entry without telling anybody (the application chose it). | `key: string \| null` `null`, none |  |

### Events

| Event | Description |
|---|---|
| `wax-select` | An entry was chosen by the user. `detail: { key }`. Not fired by `select()` |
| `wax-new` | The «New» button was pressed |
| `wax-query` | What is typed in the search box changed. `detail: { query }` |

### Slots

| Slot | Description |
|---|---|
| `filters` | What goes above the search box (comboboxes that filter) |

### Parts

| Part | Description |
|---|---|
| `search` | The search box |
| `actions` | The row of the «New» button |
| `new-button` | The «New» button |
| `items` | The list (a `<wax-item-list>`), which does not grow more than what fits |
| `line` | A line of the list. Also `selected`, `marked`, `faded`, `icon`, `name`, `note` and `empty`, those of `<wax-item-list>` |

<!-- api:end -->
