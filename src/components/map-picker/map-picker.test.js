import { aTimeout, expect, fixture, html, oneEvent, waitUntil } from '@open-wc/testing';
import '../../translations/es.js';
import { WaxMapPicker } from './map-picker.js';

// No test touches the network: Leaflet is the copy of node_modules (served by the test runner) and every provider of tiles is a blank pixel
const BLANK = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const LOCAL = { js: '/node_modules/leaflet/dist/leaflet.js', jsIntegrity: '', css: '/node_modules/leaflet/dist/leaflet.css', cssIntegrity: '', imagePath: '' };
for (const [name, provider] of Object.entries(WaxMapPicker.providers)) WaxMapPicker.providers[name] = { ...provider, url: BLANK, subdomains: undefined };

/** @returns {Promise<any>} A map that is already drawn */
const make = async () => {
  const el = await fixture(html`<wax-map-picker></wax-map-picker>`);
  await el.show();
  return el;
};
const makeWith = async template => {
  const el = await fixture(template);
  await el.show();
  return el;
};
const base = el => el.shadowRoot.querySelector('[part="base"]');
/** The layers of the Leaflet map that satisfy a test */
const layers = (el, test) => {
  const found = [];
  el.map.eachLayer(layer => { if (test(layer)) found.push(layer); });
  return found;
};
const L = () => window.L;
const pointMarker = el => layers(el, layer => layer instanceof L().Marker && layer.options.draggable)[0];
/** What the user does: a click on the map, a bit off the middle */
const clickMap = (el, dx = 30, dy = 20) => {
  const box = base(el).getBoundingClientRect();
  base(el).dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, clientX: box.left + box.width / 2 + dx, clientY: box.top + box.height / 2 + dy }));
};
const listen = (el, names = ['wax-pick', 'wax-site-click', 'wax-map-error']) => {
  const seen = [];
  for (const name of names) el.addEventListener(name, event => seen.push([name, event.detail]));
  return seen;
};
const sites = [
  { key: 'a', lat: 41.6, lon: 2.2, icon: '🏟️', label: 'Pitch A' },
  { key: 'b', lat: 41.61, lon: 2.21, icon: '🚉', label: 'Station <b>B</b>', faded: true }
];
const square = (lat, lon, d) => ({ type: 'Polygon', coordinates: [[[lon - d, lat - d], [lon + d, lat - d], [lon + d, lat + d], [lon - d, lat + d], [lon - d, lat - d]]] });

describe('<wax-map-picker> when Leaflet cannot be loaded', () => {
  // These come first: a failed load is not remembered, and once Leaflet is loaded the page has it for good
  before(() => { WaxMapPicker.leaflet = { ...LOCAL, js: '/no-such-folder/leaflet.js' }; });

  it('says there is no map: a notice in the element, `unavailable` and `wax-map-error`', async () => {
    const el = await fixture(html`<wax-map-picker lat="41.6" lon="2.2"></wax-map-picker>`);
    const seen = listen(el);
    const ready = await el.show();
    expect(ready).to.equal(false);
    expect(el.unavailable).to.equal(true);
    expect(el.hasAttribute('unavailable')).to.equal(true);
    expect(el.map).to.equal(null);
    expect(seen.map(([name]) => name)).to.deep.equal(['wax-map-error']);
    expect(seen[0][1].src).to.equal('/no-such-folder/leaflet.js');
    expect(el.shadowRoot.querySelector('[part="unavailable"]').textContent.trim()).to.equal('The map is not available');
    expect(base(el).hidden).to.equal(true);
  });

  it('says it in the language of the element', async () => {
    const el = await fixture(html`<wax-map-picker lang="es"></wax-map-picker>`);
    await el.show();
    expect(el.shadowRoot.querySelector('[part="unavailable"]').textContent.trim()).to.equal('El mapa no está disponible');
  });

  it('does not break what is set meanwhile, and the point is still there to read', async () => {
    const el = await fixture(html`<wax-map-picker></wax-map-picker>`);
    await el.show();
    el.setPoint(41.5, 2.1);
    el.setSites(sites);
    el.setRoute([{ lat: 1, lon: 1 }, { lat: 2, lon: 2 }]);
    el.setAreas([{ minutes: 5, geometry: square(41, 2, 0.1) }]);
    el.highlightSite('a');
    el.clearRoute();
    el.clearAreas();
    expect(el.point).to.deep.equal({ lat: 41.5, lon: 2.1 });
  });

  it('is not remembered: the next show() tries again, and with Leaflet reachable there is a map and no notice', async () => {
    const el = await fixture(html`<wax-map-picker lat="41.6" lon="2.2"></wax-map-picker>`);
    await el.show();
    expect(el.unavailable).to.equal(true);
    WaxMapPicker.leaflet = { ...LOCAL };
    expect(await el.show()).to.equal(true);
    await el.updateComplete;
    expect(el.unavailable).to.equal(false);
    expect(el.hasAttribute('unavailable')).to.equal(false);
    expect(el.shadowRoot.querySelector('[part="unavailable"]')).to.equal(null);
    expect(el.map).to.exist;
    expect(window.L).to.exist;
  });
});

describe('<wax-map-picker>', () => {
  before(() => { WaxMapPicker.leaflet = { ...LOCAL }; });

  it('is defined, importing it twice does no harm, and it makes the map by itself once it is visible, without show()', async () => {
    await import('./map-picker.js?again');
    expect(customElements.get('wax-map-picker')).to.exist;
    const el = await fixture(html`<wax-map-picker></wax-map-picker>`);
    await waitUntil(() => el.map, 'the map was never made', { timeout: 4000 });
    expect(base(el).classList.contains('leaflet-container')).to.equal(true);
    expect(el.unavailable).to.equal(false);
    expect(await WaxMapPicker.load()).to.equal(true);
  });

  it('looks at the starting view while there is no point, and has no marker', async () => {
    const el = await make();
    expect(el.map.getCenter().lat).to.be.closeTo(41.6, 0.01);
    expect(el.map.getCenter().lng).to.be.closeTo(2.2, 0.01);
    expect(el.map.getZoom()).to.equal(9);
    expect(el.point).to.equal(null);
    expect(pointMarker(el)).to.equal(undefined);
  });

  it('takes its starting view from center-lat, center-lon and zoom, and follows them while there is no point', async () => {
    const el = await makeWith(html`<wax-map-picker center-lat="10" center-lon="20" zoom="5"></wax-map-picker>`);
    expect(el.map.getCenter().lat).to.be.closeTo(10, 0.1);
    expect(el.map.getZoom()).to.equal(5);
    el.centerLat = 30;
    el.zoom = 7;
    await el.updateComplete;
    expect(el.map.getCenter().lat).to.be.closeTo(30, 0.1);
    expect(el.map.getZoom()).to.equal(7);
    expect(el.getAttribute('center-lat')).to.equal('30');
  });

  it('is sized by --map-picker-height, 300px by default', async () => {
    const el = await make();
    expect(el.getBoundingClientRect().height).to.equal(300);
    el.style.setProperty('--map-picker-height', '200px');
    expect(el.getBoundingClientRect().height).to.equal(200);
  });

  it('has the stylesheet of Leaflet inside its shadow, from the same place as the script', async () => {
    const el = await make();
    const link = el.shadowRoot.querySelector('link[rel="stylesheet"]');
    expect(new URL(link.href).pathname).to.equal('/node_modules/leaflet/dist/leaflet.css');
    expect(getComputedStyle(base(el)).position).to.equal('relative');   // leaflet.css gives it, the document does not have it
  });

  describe('the point', () => {
    it('lat and lon put the marker and look at it, and are read back with point', async () => {
      const el = await makeWith(html`<wax-map-picker lat="41.39" lon="2.17"></wax-map-picker>`);
      expect(el.point).to.deep.equal({ lat: 41.39, lon: 2.17 });
      expect(pointMarker(el).getLatLng().lat).to.equal(41.39);
      expect(el.map.getCenter().lat).to.be.closeTo(41.39, 0.001);
      expect(el.map.getZoom()).to.equal(15);
      expect(pointMarker(el).getElement().src).to.contain('/node_modules/leaflet/dist/images/marker-icon');
    });

    it('moving lat and lon moves the marker without wax-pick, also by attribute', async () => {
      const el = await make();
      const seen = listen(el);
      el.lat = 41.5; el.lon = 2.1;
      await el.updateComplete;
      expect(pointMarker(el).getLatLng().lng).to.equal(2.1);
      el.setAttribute('lat', '42');
      await el.updateComplete;
      expect(pointMarker(el).getLatLng().lat).to.equal(42);
      expect(seen).to.deep.equal([]);
    });

    it('setPoint puts the marker and the view, does not fire wax-pick and keeps lat and lon (reflected)', async () => {
      const el = await make();
      const seen = listen(el);
      el.setPoint(41.7, 2.3);
      expect(seen).to.deep.equal([]);
      expect(el.point).to.deep.equal({ lat: 41.7, lon: 2.3 });
      await el.updateComplete;
      expect(el.getAttribute('lat')).to.equal('41.7');
      expect(el.map.getZoom()).to.equal(15);
      el.setPoint(41.8, 2.4, true);
      expect(el.map.getZoom()).to.equal(17);
      el.map.setZoom(18, { animate: false });
      el.setPoint(41.9, 2.5);
      expect(el.map.getZoom()).to.equal(18);   // already closer than the comfortable zoom: it stays
      expect(pointMarker(el).getLatLng().lat).to.equal(41.9);
      expect(seen).to.deep.equal([]);
    });

    it('a click on the map puts the marker there and fires wax-pick with the place', async () => {
      const el = await make();
      const seen = listen(el);
      clickMap(el);
      expect(seen).to.have.length(1);
      expect(seen[0][0]).to.equal('wax-pick');
      const { lat, lon } = seen[0][1];
      expect(lat).to.be.closeTo(41.6, 0.5);
      expect(lat).to.not.equal(41.6);
      expect(el.point).to.deep.equal({ lat, lon });
      expect(pointMarker(el).getLatLng().lat).to.equal(lat);
      await el.updateComplete;
      expect(el.getAttribute('lon')).to.equal(String(lon));
    });

    it('a click on the map keeps the view: neither the zoom nor the centre move', async () => {
      const el = await make();
      const zoom = el.map.getZoom(), center = el.map.getCenter();
      clickMap(el);
      await el.updateComplete;
      expect(el.map.getZoom()).to.equal(zoom);
      expect(el.map.getCenter().lat).to.equal(center.lat);
      expect(el.map.getCenter().lng).to.equal(center.lng);
      clickMap(el);   // and also when the marker is already there
      await el.updateComplete;
      expect(el.map.getZoom()).to.equal(zoom);
    });

    it('dropping the marker fires wax-pick with where it ended up', async () => {
      const el = await makeWith(html`<wax-map-picker lat="41.6" lon="2.2"></wax-map-picker>`);
      const seen = listen(el);
      const marker = pointMarker(el);
      expect(marker.dragging.enabled()).to.equal(true);
      marker.setLatLng([41.62, 2.25]);
      marker.fire('dragend');
      expect(seen).to.deep.equal([['wax-pick', { lat: 41.62, lon: 2.25 }]]);
      expect(el.point).to.deep.equal({ lat: 41.62, lon: 2.25 });
    });

    it('wax-pick bubbles out of the shadow, so the page can listen on a parent', async () => {
      const page = await fixture(html`<div><wax-map-picker></wax-map-picker></div>`);
      const el = page.querySelector('wax-map-picker');
      await el.show();
      setTimeout(() => clickMap(el));
      const event = await oneEvent(page, 'wax-pick');
      expect(event.detail).to.have.all.keys('lat', 'lon');
    });

    it('clear removes the marker and the point, without an event', async () => {
      const el = await makeWith(html`<wax-map-picker lat="41.6" lon="2.2"></wax-map-picker>`);
      const seen = listen(el);
      el.clear();
      await el.updateComplete;
      expect(el.point).to.equal(null);
      expect(pointMarker(el)).to.equal(undefined);
      expect(el.hasAttribute('lat')).to.equal(false);
      expect(seen).to.deep.equal([]);
    });

    it('attributes that are not a place are no point', async () => {
      const el = await makeWith(html`<wax-map-picker lat="abc" lon="2"></wax-map-picker>`);
      expect(el.point).to.equal(null);
      expect(pointMarker(el)).to.equal(undefined);
    });
  });

  describe('read-only', () => {
    it('a click picks nothing and the marker cannot be dragged', async () => {
      const el = await makeWith(html`<wax-map-picker readonly lat="41.6" lon="2.2"></wax-map-picker>`);
      const seen = listen(el);
      clickMap(el);
      expect(seen).to.deep.equal([]);
      expect(el.point).to.deep.equal({ lat: 41.6, lon: 2.2 });
      expect(pointMarker(el).dragging.enabled()).to.equal(false);
    });

    it('can be switched on and off while the map is there', async () => {
      const el = await makeWith(html`<wax-map-picker lat="41.6" lon="2.2"></wax-map-picker>`);
      el.readonly = true;
      await el.updateComplete;
      expect(pointMarker(el).dragging.enabled()).to.equal(false);
      const seen = listen(el);
      clickMap(el);
      expect(seen).to.deep.equal([]);
      el.readonly = false;
      await el.updateComplete;
      expect(pointMarker(el).dragging.enabled()).to.equal(true);
      clickMap(el);
      expect(seen).to.have.length(1);
    });

    it('setPoint still works', async () => {
      const el = await makeWith(html`<wax-map-picker readonly></wax-map-picker>`);
      el.setPoint(41.7, 2.3);
      expect(pointMarker(el).getLatLng().lat).to.equal(41.7);
    });
  });

  describe('sites', () => {
    const siteElements = el => [...el.shadowRoot.querySelectorAll('.map-site')];

    it('draws each with its emoji, its text on hover and the faded ones faded, and the text is not HTML', async () => {
      const el = await make();
      el.setSites(sites);
      const drawn = siteElements(el);
      expect(drawn).to.have.length(2);
      expect(drawn[0].textContent).to.equal('🏟️');
      expect(drawn[0].classList.contains('faded')).to.equal(false);
      expect(drawn[1].classList.contains('faded')).to.equal(true);
      expect(drawn[1].getAttribute('aria-label')).to.equal('Station <b>B</b>');
      const tooltips = layers(el, layer => layer.getTooltip?.() && layer instanceof L().Marker).map(layer => layer.getTooltip().getContent().textContent);
      expect(tooltips).to.have.members(['Pitch A', 'Station <b>B</b>']);
    });

    it('replaces the sites that were there', async () => {
      const el = await make();
      el.setSites(sites);
      el.setSites([sites[0]]);
      expect(siteElements(el)).to.have.length(1);
      el.setSites([]);
      expect(siteElements(el)).to.have.length(0);
    });

    it('a click on a site fires wax-site-click with its key, and does not pick a point', async () => {
      const el = await make();
      el.setSites(sites);
      const seen = listen(el);
      siteElements(el)[1].click();
      expect(seen).to.deep.equal([['wax-site-click', { key: 'b' }]]);
      expect(el.point).to.equal(null);
    });

    it('highlighting grows one, puts it on top and opens its text, and turning it off closes it', async () => {
      const el = await make();
      el.setSites(sites);
      const marker = key => layers(el, layer => layer instanceof L().Marker && layer.getTooltip?.()?.getContent().textContent === key)[0];
      el.highlightSite('a');
      expect(siteElements(el)[0].classList.contains('selected')).to.equal(true);
      expect(marker('Pitch A').options.zIndexOffset).to.equal(1000);
      expect(marker('Pitch A').isTooltipOpen()).to.equal(true);
      el.highlightSite('b');
      expect(siteElements(el)[0].classList.contains('selected')).to.equal(false);
      expect(siteElements(el)[1].classList.contains('selected')).to.equal(true);
      expect(marker('Pitch A').isTooltipOpen()).to.equal(false);
      el.highlightSite(null);
      expect(siteElements(el).some(site => site.classList.contains('selected'))).to.equal(false);
      expect(marker('Station <b>B</b>').isTooltipOpen()).to.equal(false);
    });

    it('highlighting a site out of sight pans to it, and without pan it stays', async () => {
      const el = await make();
      el.setSites([{ key: 'far', lat: 42.5, lon: 3.5, icon: '🌍', label: 'Far' }]);
      el.highlightSite('far', { pan: false });
      expect(el.map.getCenter().lat).to.be.closeTo(41.6, 0.01);
      el.highlightSite('far');
      expect(el.map.getCenter().lat).to.be.closeTo(42.5, 0.01);
    });

    it('a highlighted site that is still there stays highlighted when the sites are set again, and one that is not is forgotten', async () => {
      const el = await make();
      el.setSites(sites);
      el.highlightSite('a');
      el.setSites(sites);
      expect(siteElements(el)[0].classList.contains('selected')).to.equal(true);
      el.setSites([sites[1]]);
      expect(siteElements(el)[0].classList.contains('selected')).to.equal(false);
      el.setSites(sites);
      expect(siteElements(el).some(site => site.classList.contains('selected'))).to.equal(false);
    });

    it('fit makes the map cover the point and all the sites', async () => {
      const el = await makeWith(html`<wax-map-picker lat="41.0" lon="2.0"></wax-map-picker>`);
      el.setSites(sites, { fit: true });
      const bounds = el.map.getBounds();
      for (const [lat, lon] of [[41.0, 2.0], [41.6, 2.2], [41.61, 2.21]]) expect(bounds.contains([lat, lon]), `${lat}, ${lon}`).to.equal(true);
    });

    it('the ring of the highlighted one is the brand colour of the theme', async () => {
      const el = await make();
      el.setSites(sites);
      el.highlightSite('a');
      await aTimeout(250);
      const circle = el.shadowRoot.querySelector('.map-site.selected span');
      expect(getComputedStyle(circle).boxShadow).to.contain(getComputedStyle(document.documentElement).getPropertyValue('--wa-color-brand-fill-loud').trim() ? 'rgb' : '');
      expect(getComputedStyle(circle).borderTopLeftRadius).to.not.equal('0px');
    });
  });

  describe('route', () => {
    const route = [{ lat: 41.5, lon: 2.0 }, { lat: 41.6, lon: 2.1 }, { lat: 41.7, lon: 2.3 }];

    it('draws the path, fits it by default, and clearRoute takes it away', async () => {
      const el = await make();
      el.setRoute(route);
      expect(el.shadowRoot.querySelectorAll('path.route')).to.have.length(1);
      for (const point of route) expect(el.map.getBounds().contains([point.lat, point.lon])).to.equal(true);
      el.clearRoute();
      expect(el.shadowRoot.querySelectorAll('path.route')).to.have.length(0);
    });

    it('replaces the previous one, does not move the map without fit and draws nothing with less than two points', async () => {
      const el = await make();
      el.setRoute(route);
      el.setRoute(route.slice(0, 2), { fit: false });
      expect(el.shadowRoot.querySelectorAll('path.route')).to.have.length(1);
      el.setRoute([route[0]]);
      expect(el.shadowRoot.querySelectorAll('path.route')).to.have.length(0);
    });

    it('takes its colour from --map-picker-route, the brand colour by default', async () => {
      const el = await make();
      el.setRoute(route);
      const path = el.shadowRoot.querySelector('path.route');
      const brand = getComputedStyle(path).stroke;
      expect(brand).to.not.equal('none');
      el.style.setProperty('--map-picker-route', 'rgb(1, 2, 3)');
      expect(getComputedStyle(path).stroke).to.equal('rgb(1, 2, 3)');
    });
  });

  describe('areas', () => {
    const areas = [
      { minutes: 10, geometry: square(41.6, 2.2, 0.05) },
      { minutes: 30, geometry: square(41.6, 2.2, 0.2) },
      { minutes: 20, geometry: square(41.6, 2.2, 0.1) }
    ];
    const paths = el => [...el.shadowRoot.querySelectorAll('path.area')];

    it('draws them from the largest to the smallest, the smallest with the first tone', async () => {
      const el = await make();
      el.setAreas(areas);
      expect(paths(el).map(path => [...path.classList].find(name => /^area-\d/.test(name)))).to.deep.equal(['area-2', 'area-1', 'area-0']);
      const sizes = paths(el).map(path => path.getBoundingClientRect().width);
      expect(sizes[0]).to.be.greaterThan(sizes[1]);
      expect(sizes[1]).to.be.greaterThan(sizes[2]);
    });

    it('gives each a tooltip with its minutes, in the language of the element', async () => {
      const el = await make();
      el.setAreas(areas);
      const texts = layers(el, layer => layer.getTooltip?.() && !(layer instanceof L().Marker) && layer.getLayers).map(layer => layer.getTooltip().getContent());
      expect(texts).to.have.members(['10 min', '20 min', '30 min']);
    });

    it('fits the largest by default and does not move the map with fit: false', async () => {
      const el = await make();
      el.setAreas(areas);
      expect(el.map.getBounds().contains([41.6 + 0.2, 2.2 + 0.2])).to.equal(true);
      el.map.setView([50, 10], 9);
      el.setAreas(areas, { fit: false });
      expect(el.map.getCenter().lat).to.be.closeTo(50, 0.01);
    });

    it('replaces the ones there were, and clearAreas takes them away', async () => {
      const el = await make();
      el.setAreas(areas);
      el.setAreas([areas[0]]);
      expect(paths(el)).to.have.length(1);
      el.clearAreas();
      expect(paths(el)).to.have.length(0);
      el.setAreas([]);
      expect(paths(el)).to.have.length(0);
    });

    it('takes its colours from --map-picker-area-N', async () => {
      const el = await make();
      el.setAreas(areas);
      el.style.setProperty('--map-picker-area-1', 'rgb(9, 8, 7)');
      const smallest = paths(el)[2];
      expect(getComputedStyle(smallest).fill).to.equal('rgb(9, 8, 7)');
    });
  });

  describe('tiles', () => {
    const attribution = el => el.shadowRoot.querySelector('.leaflet-control-attribution').textContent;
    const tileLayer = el => layers(el, layer => layer instanceof L().TileLayer)[0];

    it('uses OpenStreetMap by default', async () => {
      const el = await make();
      expect(attribution(el)).to.contain('OpenStreetMap');
      expect(tileLayer(el).options.maxZoom).to.equal(19);
    });

    it('provider picks one of the catalog, and changing it changes the tiles', async () => {
      const el = await makeWith(html`<wax-map-picker provider="cyclosm"></wax-map-picker>`);
      expect(attribution(el)).to.contain('CyclOSM');
      el.setAttribute('provider', 'osm-hot');
      await el.updateComplete;
      expect(attribution(el)).to.contain('Humanitarian');
      expect(layers(el, layer => layer instanceof L().TileLayer)).to.have.length(1);
    });

    it('a provider that is not in the catalog is OpenStreetMap', async () => {
      const el = await makeWith(html`<wax-map-picker provider="mapbox"></wax-map-picker>`);
      expect(attribution(el)).to.contain('OpenStreetMap');
    });

    it('tiles of your own win over the provider', async () => {
      const el = await make();
      el.tiles = { url: BLANK, attribution: 'Tiles by <a href="https://example.org">Mine</a>', maxZoom: 12 };
      await el.updateComplete;
      expect(attribution(el)).to.contain('Mine');
      expect(tileLayer(el).options.maxZoom).to.equal(12);
      el.tiles = null;
      await el.updateComplete;
      expect(attribution(el)).to.contain('OpenStreetMap');
    });

    it('an application can add a provider to the catalog', async () => {
      WaxMapPicker.providers.local = { url: BLANK, attribution: 'Local tiles', maxZoom: 10 };
      const el = await makeWith(html`<wax-map-picker provider="local"></wax-map-picker>`);
      expect(attribution(el)).to.contain('Local tiles');
      delete WaxMapPicker.providers.local;
    });
  });

  describe('being visible', () => {
    it('keeps what was set before the map existed and draws it when the element first has a size', async () => {
      const el = await fixture(html`<wax-map-picker style="display: none" lat="41.6" lon="2.2"></wax-map-picker>`);
      el.setSites(sites);
      el.highlightSite('a');
      el.setRoute([{ lat: 41.5, lon: 2.0 }, { lat: 41.7, lon: 2.3 }]);
      el.setAreas([{ minutes: 5, geometry: square(41.6, 2.2, 0.1) }]);
      await aTimeout(100);
      expect(el.map).to.equal(null);
      el.style.display = '';
      await waitUntil(() => el.map, 'the map was never made', { timeout: 4000 });
      expect(el.shadowRoot.querySelectorAll('.map-site')).to.have.length(2);
      expect(el.shadowRoot.querySelector('.map-site.selected')).to.exist;
      expect(el.shadowRoot.querySelectorAll('path.route')).to.have.length(1);
      expect(el.shadowRoot.querySelectorAll('path.area')).to.have.length(1);
      expect(pointMarker(el).getLatLng().lat).to.equal(41.6);
    });

    it('measures the map again when its size changes, with no show()', async () => {
      const el = await make();
      const before = el.map.getSize().y;
      el.style.setProperty('--map-picker-height', '150px');
      await waitUntil(() => el.map.getSize().y === base(el).clientHeight && el.map.getSize().y < 150, 'the map was not measured again', { timeout: 1500 });
      expect(before).to.equal(base(el).clientHeight + 150);
    });

    it('show() on a map that exists measures it and says yes', async () => {
      const el = await make();
      expect(await el.show()).to.equal(true);
      expect(await el.show()).to.equal(true);
    });

    it('a map taken out of the page and put back is made again with what it had, looking where it looked', async () => {
      const page = await fixture(html`<div><wax-map-picker lat="41.6" lon="2.2"></wax-map-picker></div>`);
      const el = page.querySelector('wax-map-picker');
      await el.show();
      el.setSites(sites);
      el.map.setView([41.0, 2.0], 12);
      el.remove();
      expect(el.map).to.equal(null);
      page.append(el);
      await waitUntil(() => el.map, 'the map was never made again', { timeout: 4000 });
      expect(el.shadowRoot.querySelectorAll('.map-site')).to.have.length(2);
      expect(pointMarker(el).getLatLng().lat).to.equal(41.6);
    });
  });

  describe('localization', () => {
    it('the tooltip of an area follows the language of the element', async () => {
      const el = await makeWith(html`<wax-map-picker lang="es"></wax-map-picker>`);
      el.setAreas([{ minutes: 15, geometry: square(41.6, 2.2, 0.1) }]);
      const texts = layers(el, layer => layer.getTooltip?.() && layer.getLayers && !(layer instanceof L().Marker)).map(layer => layer.getTooltip().getContent());
      expect(texts).to.deep.equal(['15 min']);
    });
  });
});
