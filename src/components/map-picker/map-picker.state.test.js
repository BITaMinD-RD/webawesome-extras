import test from 'node:test';
import assert from 'node:assert/strict';
import { AREA_TONES, DEFAULT_PROVIDER, LEAFLET, MapPickerState, TILE_PROVIDERS } from './map-picker.state.js';

test('the catalog has the providers that need no key, each with an https url, attribution and zoom, and the subdomains its url asks for', () => {
  assert.deepEqual(Object.keys(TILE_PROVIDERS), ['osm', 'opentopomap', 'cyclosm', 'osm-hot']);
  assert.equal(DEFAULT_PROVIDER, 'osm');
  for (const [name, provider] of Object.entries(TILE_PROVIDERS)) {
    assert.match(provider.url, /^https:\/\/.*\{z\}.*\{x\}.*\{y\}/, name);
    assert.match(provider.attribution, /OpenStreetMap/, name);
    assert.ok(provider.maxZoom >= 15, name);
    assert.equal(provider.url.includes('{s}'), Boolean(provider.subdomains), name);
    assert.doesNotMatch(provider.url, /key|token|apikey/i, name);
  }
});

test('MapPickerState.tiles: the provider asked for, or OpenStreetMap when it is not known', () => {
  assert.equal(MapPickerState.tiles('osm').url, 'https://tile.openstreetmap.org/{z}/{x}/{y}.png');
  assert.equal(MapPickerState.tiles('cyclosm').name, 'cyclosm');
  assert.equal(MapPickerState.tiles(' OSM-Hot ').name, 'osm-hot');
  assert.deepEqual(MapPickerState.tiles('osm-hot').subdomains, 'abc');
  for (const unknown of ['mapbox', '', null, undefined, 'constructor', '__proto__', 'toString']) assert.equal(MapPickerState.tiles(unknown).name, 'osm', String(unknown));
  assert.equal(MapPickerState.tiles('mapbox').url, TILE_PROVIDERS.osm.url);
});

test('MapPickerState.tiles: custom tiles win over the provider, with defaults for what they do not say, and without a url they are ignored', () => {
  const custom = MapPickerState.tiles('cyclosm', { url: 'https://tiles.example/{z}/{x}/{y}.png' });
  assert.deepEqual(custom, { name: 'osm', url: 'https://tiles.example/{z}/{x}/{y}.png', attribution: '', maxZoom: 19 });
  assert.deepEqual(MapPickerState.tiles('osm', { url: 'x/{z}/{x}/{y}', attribution: 'Mine', maxZoom: 12, subdomains: 'ab' }), { name: 'osm', url: 'x/{z}/{x}/{y}', attribution: 'Mine', maxZoom: 12, subdomains: 'ab' });
  assert.equal(MapPickerState.tiles('cyclosm', { url: '' }).name, 'cyclosm');
  assert.equal(MapPickerState.tiles('cyclosm', null).name, 'cyclosm');
});

test('MapPickerState.tiles: it reads the catalog it is given, so an application can add providers', () => {
  const catalog = { osm: TILE_PROVIDERS.osm, mine: { url: 'https://m/{z}/{x}/{y}.png' } };
  assert.deepEqual(MapPickerState.tiles('mine', null, catalog), { name: 'mine', url: 'https://m/{z}/{x}/{y}.png', attribution: '', maxZoom: 19 });
  assert.equal(MapPickerState.tiles('cyclosm', null, catalog).name, 'osm');
});

test('MapPickerState.orderAreas: from the largest to the smallest, and the smallest has the first tone', () => {
  const areas = [{ minutes: 10 }, { minutes: 30 }, { minutes: 20 }];
  assert.deepEqual(MapPickerState.orderAreas(areas).map(a => [a.minutes, a.tone]), [[30, 2], [20, 1], [10, 0]]);
  assert.deepEqual(areas.map(a => a.minutes), [10, 30, 20], 'the list given is not changed');
  assert.deepEqual(MapPickerState.orderAreas([{ minutes: 5 }]).map(a => a.tone), [0]);
  assert.deepEqual(MapPickerState.orderAreas([]), []);
});

test('MapPickerState.orderAreas: the tones start again after the last one, and what an area carries stays with it', () => {
  const many = Array.from({ length: 7 }, (_, n) => ({ minutes: (n + 1) * 5, geometry: { id: n } }));
  const ordered = MapPickerState.orderAreas(many);
  assert.deepEqual(ordered.map(a => a.tone), [1, 0, 4, 3, 2, 1, 0]);
  assert.ok(ordered.every(a => a.tone < AREA_TONES));
  assert.equal(ordered[0].geometry.id, 6);
});

test('MapPickerState.largestArea: the one with most minutes, the first when they tie, none without areas', () => {
  assert.equal(MapPickerState.largestArea([{ minutes: 5, id: 'a' }, { minutes: 15, id: 'b' }, { minutes: 15, id: 'c' }]).id, 'b');
  assert.equal(MapPickerState.largestArea([]), null);
});

test('MapPickerState.zoomFor: all the way in when asked, otherwise a comfortable zoom unless it is already closer', () => {
  assert.equal(MapPickerState.zoomFor(9, true), 17);
  assert.equal(MapPickerState.zoomFor(18, true), 17);
  assert.equal(MapPickerState.zoomFor(9), 15);
  assert.equal(MapPickerState.zoomFor(15), 15);
  assert.equal(MapPickerState.zoomFor(16), 16);
  assert.equal(MapPickerState.zoomFor(19, false), 19);
});

test('MapPickerState.isPoint: two numbers on Earth; nothing, text and out of range are no point', () => {
  assert.equal(MapPickerState.isPoint(41.6, 2.2), true);
  assert.equal(MapPickerState.isPoint(0, 0), true);
  assert.equal(MapPickerState.isPoint(-90, 180), true);
  for (const [lat, lon] of [[null, null], [41.6, null], [NaN, 2], [91, 0], [0, 181], ['41', '2'], [Infinity, 0], [undefined, undefined]]) assert.equal(MapPickerState.isPoint(lat, lon), false, `${lat}, ${lon}`);
});

test('MapPickerState.route: the points as pairs, the invalid ones left out, and nothing when there are not two to draw a line', () => {
  assert.deepEqual(MapPickerState.route([{ lat: 1, lon: 2 }, { lat: 3, lon: 4 }]), [[1, 2], [3, 4]]);
  assert.deepEqual(MapPickerState.route([{ lat: 1, lon: 2 }, { lat: NaN, lon: 4 }, { lat: 5, lon: 6 }]), [[1, 2], [5, 6]]);
  assert.equal(MapPickerState.route([{ lat: 1, lon: 2 }]), null);
  assert.equal(MapPickerState.route([]), null);
});

test('MapPickerState.fitPoints: the sites and, if there is one, the point', () => {
  assert.deepEqual(MapPickerState.fitPoints([{ lat: 1, lon: 2 }], null), [[1, 2]]);
  assert.deepEqual(MapPickerState.fitPoints([{ lat: 1, lon: 2 }], { lat: 3, lon: 4 }), [[1, 2], [3, 4]]);
});

test('MapPickerState.escapeHtml and siteClass: text stays text, and a faded site has its class', () => {
  assert.equal(MapPickerState.escapeHtml('<b>"A" & \'B\'</b>'), '&lt;b&gt;&quot;A&quot; &amp; &#39;B&#39;&lt;/b&gt;');
  assert.equal(MapPickerState.escapeHtml('🍎'), '🍎');
  assert.equal(MapPickerState.siteClass(), 'map-site');
  assert.equal(MapPickerState.siteClass(true), 'map-site faded');
});

test('MapPickerState.imagePath: the one given, or the images folder next to the stylesheet, always with its slash', () => {
  assert.equal(MapPickerState.imagePath(LEAFLET), 'https://unpkg.com/leaflet@1.9.4/dist/images/');
  assert.equal(MapPickerState.imagePath({ css: '/lib/leaflet.css' }), '/lib/images/');
  assert.equal(MapPickerState.imagePath({ css: '/lib/leaflet.css', imagePath: '/img' }), '/img/');
  assert.equal(MapPickerState.imagePath({ css: 'leaflet.css' }), 'images/');
});

test('Leaflet is pinned to a version with the integrity of both files', () => {
  assert.match(LEAFLET.js, /leaflet@1\.9\.4/);
  assert.match(LEAFLET.jsIntegrity, /^sha256-/);
  assert.match(LEAFLET.cssIntegrity, /^sha256-/);
});
