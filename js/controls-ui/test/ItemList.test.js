
import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.js';

const { ItemList } = await load();

test('ItemList.html: a line per item, with the text escaped and the markup of the application as is', () => {
  assert.equal(
    ItemList.html([{ key: 'a"1', icon: '🍺', name: '<Bar>', note: 'a 80 m', html: '<label>x</label>' }]),
    '<li class="item-line" data-key="a&quot;1" tabindex="0"><span class="item-icon">🍺</span><strong class="item-name">&lt;Bar&gt;</strong>'
    + '<span class="item-note">a 80 m</span><label>x</label></li>'
  );
});

test('ItemList.html: selected, marked and faded are classes; no items says the empty text, or nothing', () => {
  const html = ItemList.html([{ key: 'a', name: 'A', faded: true }, { key: 'b', name: 'B' }, { key: 'c', name: 'C' }], { selected: 'b', marked: new Set(['c']) });
  assert.match(html, /class="item-line item-faded" data-key="a"/);
  assert.match(html, /class="item-line item-selected" data-key="b"/);
  assert.match(html, /class="item-line item-marked" data-key="c"/);
  assert.equal(ItemList.html([], { empty: 'Nothing <here>' }), '<li class="item-empty">Nothing &lt;here&gt;</li>');
  assert.equal(ItemList.html([]), '');
});
