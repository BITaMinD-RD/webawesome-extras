
import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.js';

const { BackClose } = await load();

/** Un navegador de mentira: un historial con su entrada de ahora y un Atras que avisa con popstate */
const fakeHost = ({ async = false } = {}) => {
  const entries = [{ state: null }];
  let at = 0;
  const listeners = [];
  const waiting = [];
  const host = {
    entries,
    history: {
      get state() { return entries[at].state; },
      pushState(state) { entries.length = at + 1; entries.push({ state }); at++; },
      back() {
        const go = () => { if (at > 0) { at--; listeners.forEach(f => f()); } };
        if (async) waiting.push(go); else go();   // el navegador de verdad llega despues
      }
    },
    addEventListener(type, f) { if (type === 'popstate') listeners.push(f); },
    /** Llega lo que esperaba (con `async`) */
    arrive() { waiting.splice(0).forEach(go => go()); },
    /** El usuario pulsa Atras */
    userBack() { host.history.back(); },
    get depth() { return at; }
  };
  return host;
};

test('BackClose: opening adds a history entry, and Back closes it instead of leaving', () => {
  const host = fakeHost();
  BackClose.use(host);
  let closed = 0;
  BackClose.push(() => { closed++; });
  assert.equal(host.depth, 1);
  host.userBack();
  assert.equal(closed, 1);
  assert.equal(host.depth, 0);
});

test('BackClose: closing it another way spends its entry, so Back is not needed twice, and it does not close again', () => {
  const host = fakeHost();
  BackClose.use(host);
  let closed = 0;
  const release = BackClose.push(() => { closed++; });
  release();
  assert.equal(host.depth, 0, 'the entry is spent');
  assert.equal(closed, 0, 'it is not "closed" again by that');
  release();   // twice does nothing
  assert.equal(host.depth, 0);
  host.userBack();   // a Back now goes where it would have gone: nothing to close
  assert.equal(closed, 0);
});

test('BackClose: with one over another, Back closes the last, then the other', () => {
  const host = fakeHost();
  BackClose.use(host);
  const order = [];
  BackClose.push(() => order.push('panel'));
  BackClose.push(() => order.push('window'));
  assert.equal(host.depth, 2);
  host.userBack();
  host.userBack();
  assert.deepEqual(order, ['window', 'panel']);
  assert.equal(host.depth, 0);
});

test('BackClose: if Back closes it and its code calls release as well, the history is not spent twice', () => {
  const host = fakeHost();
  BackClose.use(host);
  let release;
  release = BackClose.push(() => release());   // the usual: closing something calls its release
  host.userBack();
  assert.equal(host.depth, 0);
  assert.equal(host.entries.length, 2);
});

test('BackClose: closing one and opening another at once, before the Back arrives, does not let that Back take the new one', () => {
  const host = fakeHost({ async: true });
  BackClose.use(host);
  let closed = 0;
  const first = BackClose.push(() => {});
  first();                               // its Back is on the way
  const second = BackClose.push(() => { closed++; });   // opened right after
  assert.equal(host.depth, 1, 'the new one has no entry yet: the old Back has not arrived');
  host.arrive();                         // the old Back arrives: it spends the old entry
  assert.equal(host.depth, 1, 'and now the new entry is added');
  assert.equal(closed, 0, 'the new one is still open');
  host.history.back();
  host.arrive();                         // the user presses Back: it closes the new one
  assert.equal(closed, 1);
  second();
});

test('BackClose: closing one that had not got its entry yet leaves nothing to spend', () => {
  const host = fakeHost({ async: true });
  BackClose.use(host);
  BackClose.push(() => {})();
  const waiting = BackClose.push(() => {});
  waiting();
  host.arrive();
  assert.equal(host.depth, 0);
});
