# Localization

The elements are localized the way Web Awesome is, with the same piece: the `LocalizeController` of `@awesome.me/webawesome/dist/utilities/localize.js` (it comes from `@shoelace-style/localize`) and its
`registerTranslation`. The texts of this package are terms registered in the same registry as the terms of Web Awesome, with names that start with `wax` so they never collide with its own. English is
the default and is always loaded; any other language is a file you import.

An element that shows a text of its own asks for the term of the language of the page, unless the text is given by an attribute or a property: **what you give always wins over the translation**.

## Setting the language

The language is the `lang` attribute of the element or, without it, the one of `<html>`:

```html
<html lang="es">
  <head>
    <!-- The terms of Web Awesome and of this package in Spanish -->
    <script type="module" src="/lib/webawesome/dist/translations/es.js"></script>
    <script type="module" src="/lib/webawesome-extras/translations/es.js"></script>
  </head>
```

A language with a region (`es-MX`) uses the registered translation of the language alone (`es`) when there is none for the region, and a language that is not registered shows English.
When `lang` of `<html>` changes while the page is open, the elements are drawn again with the new language, as Web Awesome's are. (`lang` on the element itself is read when it is drawn.)

Web Awesome's own texts, such as the close button of a dialog, need its translation of the same language (`dist/translations/es.js` of its package): the floating card uses its `close` term, so it speaks
the language that file registers.

## Adding a language

A language is a single file in `src/translations/`. Copy `en.js` to `<code>.js` (`fr.js`), change `$code`, `$name` and the texts, and keep every key: a test fails if a language does not have exactly the terms of
English. Like Web Awesome, this package ships a language only when someone writes it. An application can also register terms itself, without a file in the package:

```js
import { registerTranslation } from '@awesome.me/webawesome/dist/utilities/localize.js';

registerTranslation({ $code: 'fr', $name: 'Français', $dir: 'ltr', waxYes: 'Oui', waxNo: 'Non' /* ... */ });
```

A term that is missing in a registered language is not an error: the element shows the English one.

## The terms

| Term | English | Used by |
| --- | --- | --- |
| `waxCancel` | `Cancel` | [Ask each](components/ask-each.md#texts): the cancel button (`labels.cancel`) |
| `waxDrag` | `Drag to sort` | [Item list](components/item-list.md#texts): the title of the handle (`handle-title`) |
| `waxMapUnavailable` | `The map is not available` | [Map picker](components/map-picker.md#texts): the notice that takes the place of a map that could not be loaded |
| `waxMinutes` | `20 min` | [Map picker](components/map-picker.md#texts): a function of the number, the tooltip of an area |
| `waxMove` | `Move (up and down arrows)` | [Item list](components/item-list.md#texts): the label of the handle (`handle-label`) |
| `waxNew` | `New` | [List manager](components/list-manager.md#texts): the button (`new-label`) |
| `waxNo` | `No` | [Ask each](components/ask-each.md#texts): the no button (`labels.no`) |
| `waxNoAll` | `No to all` | [Ask each](components/ask-each.md#texts): `labels.noAll` |
| `waxNoMatches` | `No matches` | [Combobox](components/combobox.md#texts): when what was typed matches nothing (`empty-text`) |
| `waxProgress` | `1 of 5` | [Ask each](components/ask-each.md#texts): a function of the number and the total (`labels.progress`) |
| `waxSearch` | `Search...` | [Combobox](components/combobox.md#texts) and [list manager](components/list-manager.md#texts): the placeholder of the search box (`search-placeholder`) |
| `waxYes` | `Yes` | [Ask each](components/ask-each.md#texts): the yes button (`labels.yes`) |
| `waxYesAll` | `Yes to all` | [Ask each](components/ask-each.md#texts): `labels.yesAll` |

The [floating card](components/floating-card.md#texts) uses the `close` term of Web Awesome, not one of its own (`close-label`).
