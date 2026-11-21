# Theming

The elements look like Web Awesome's own because they are made of its design tokens. Nothing is hard-coded: colours, sizes, radii, spacing, shadows and fonts come from the `--wa-*` custom properties
that the theme of the page defines, so changing the theme, or the tokens, changes the elements.

## The theme of the page

Link a theme of Web Awesome (see [installation](installation.md)) and the elements follow it, including its dark mode (`wa-dark` on a parent) and any theme you build with the theme tool of Web
Awesome. A page with its own palette sets the tokens:

```css
:root {
  --wa-color-brand-fill-loud: #2a7f62;
  --wa-border-radius-m: 0.25rem;
}
```

The tokens the elements read are, among others: `--wa-color-surface-default`, `--wa-color-text-normal`, `--wa-color-text-quiet`, `--wa-color-brand-fill-quiet`, `--wa-color-brand-fill-loud`,
`--wa-color-neutral-fill-quiet`, `--wa-color-neutral-border-quiet`, `--wa-color-danger-fill-loud`, `--wa-space-*`, `--wa-font-size-*`, `--wa-border-radius-*`, `--wa-border-width-*`, `--wa-shadow-*` and `--wa-focus-ring`.

## The custom properties of the elements

A component may add its own custom properties, **always with a `--wa-*` token as the fallback**, so it works with nothing set and can be tuned by a page, a section or one element. Set them on the
element (or on any parent: custom properties inherit):

```css
wax-item-list {
  --item-selected: var(--wa-color-success-fill-quiet);
  --item-accent: var(--wa-color-success-fill-loud);
}
```

| Element | Property | What it styles | Falls back to |
|---|---|---|---|
| `wax-item-list` | `--item-border` | The line between lines | `--wa-color-neutral-border-quiet` |
| `wax-item-list` | `--item-hover` | A line under the pointer | `--wa-color-neutral-fill-quiet` |
| `wax-item-list` | `--item-selected` | The selected line | `--wa-color-brand-fill-quiet` |
| `wax-item-list` | `--item-accent` | The mark of the selected and marked lines | `--wa-color-brand-fill-loud` |
| `wax-item-list` | `--item-muted` | Notes and the empty text | `--wa-color-text-quiet` |
| `wax-item-list` | `--item-danger` | The swipe action | `--wa-color-danger-fill-loud` |
| `wax-item-list` | `--item-risky-visibility` | Set by the list on its slots, for a control of the page to read | none: `visible` in the control |
| `wax-item-list` | `--item-risky-width` | Set by the list on its slots, for a control of the page to read | none: `auto` in the control |
| `wax-combobox` | `--combobox-gap` | The space below the box | `--wa-space-m` |
| `wax-floating-card` | `--floating-card-shadow` | The shadow of a pinned card | `--wa-shadow-l` |
| `wax-floating-card` | `--floating-card-peek-shadow` | The shadow of one that only peeks | `--wa-shadow-m` |
| `wax-floating-card` | `--floating-card-centered-shadow` | The shadow of one in the middle | `--wa-shadow-l` |
| `wax-floating-card` | `--floating-card-backdrop` | The dimmed page behind a card in the middle | `rgba(0, 0, 0, .45)` |
| `wax-floating-card` | `--floating-card-width` | The width of the card | `400px` |
| `wax-ask-each` | `--ask-each-width` | The width of the dialog | `31rem`, the one of a `wa-dialog` |
| `wax-map-picker` | `--map-picker-height` | The height of the map | `300px` |
| `wax-map-picker` | `--map-picker-route` | The line of the route | `--wa-color-brand-fill-loud` |
| `wax-map-picker` | `--map-picker-area-1` to `--map-picker-area-5` | The areas, from the smallest (the tones start again after the fifth) | `--wa-color-success-fill-loud`, `--wa-color-warning-fill-loud`, `--wa-color-danger-fill-loud`, `--wa-color-purple-50`, `--wa-color-brand-fill-loud` |
| `wax-map-picker` | `--map-picker-site-ring` | The ring of the highlighted site | `--wa-color-brand-fill-loud` |

The reference of each component page lists the same properties, generated from its JSDoc.

## Parts

The inside of each element is open to styling through `part`s, like Web Awesome's: `wax-item-list::part(line)`, `wax-combobox::part(search)`. A part can also be styled by state, as a space-separated
list in the `part` attribute: the item list's lines are `line selected`, `line marked`, `line faded` and `line dragging`, so `::part(selected)` styles the chosen one. The list manager exports the parts of its list,
so `wax-list-manager::part(name)` reaches the names of its lines. The parts of each element are in the reference of its page.

## Slots

What is the page's goes in slots, so the page styles it: the controls of a line of the item list, the filters of the list manager, the content of the floating card. The shadow of the element cannot style
what is slotted, which is why the item list tells its controls when to show through `--item-risky-visibility` and `--item-risky-width` instead of styling them.

## The Web Awesome components inside

Where an element contains a Web Awesome component (the `wa-select` of the combobox, the `wa-dialog` of ask each), it is reachable through a part (`wax-combobox::part(select)`, `wax-ask-each::part(dialog)`)
and takes the same tokens, so the theme reaches it with nothing else to do.
