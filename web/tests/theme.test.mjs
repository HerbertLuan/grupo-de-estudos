import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/theme.js', import.meta.url), 'utf8');
function boot({ saved = null, dark = false, blocked = false } = {}) {
  const storage = new Map(saved === null ? [] : [['estuda-junto-theme', saved]]);
  const events = {};
  const media = { matches: dark, addEventListener: (_, listener) => { events.system = listener; } };
  const root = { dataset: {}, style: {} };
  const meta = { setAttribute: (_, value) => { meta.color = value; } };
  const localStorage = {
    getItem: key => { if (blocked) throw new Error('blocked'); return storage.get(key) ?? null; },
    setItem: (key, value) => { if (blocked) throw new Error('blocked'); storage.set(key, value); },
    removeItem: key => { if (blocked) throw new Error('blocked'); storage.delete(key); },
  };
  const window = { matchMedia: () => media, addEventListener: (name, listener) => { events[name] = listener; } };
  vm.runInNewContext(source, { window, localStorage, document: { documentElement: root, querySelector: () => meta } });
  return { api: window.estudaJuntoTheme, root, media, meta, storage, localStorage, events };
}

test('first paint follows the system without a saved choice', () => {
  for (const dark of [false, true]) {
    const app = boot({ dark });
    assert.equal(app.root.dataset.theme, dark ? 'dark' : 'light');
    assert.equal(app.api.getPreference(), 'system');
    assert.equal(app.root.style.colorScheme, app.root.dataset.theme);
  }
});
test('saved choices override the system before React loads and survive a reload', () => {
  for (const preference of ['light', 'dark']) {
    const app = boot({ dark: preference === 'light' });
    app.api.setPreference(preference);
    const reloaded = boot({ saved: app.storage.get('estuda-junto-theme'), dark: preference === 'light' });
    assert.equal(reloaded.root.dataset.theme, preference);
    assert.equal(reloaded.meta.color, preference === 'dark' ? '#0B1B3B' : '#F4F6FA');
  }
});
test('system changes apply only while following the system', () => {
  const app = boot();
  app.media.matches = true; app.events.system();
  assert.equal(app.root.dataset.theme, 'dark');
  app.api.setPreference('light'); app.events.system();
  assert.equal(app.root.dataset.theme, 'light');
  app.api.setPreference('system');
  assert.equal(app.storage.has('estuda-junto-theme'), false);
  assert.equal(app.root.dataset.theme, 'dark');
});
test('invalid preferences and unavailable storage fall back safely', () => {
  assert.equal(boot({ saved: 'invalid', dark: true }).root.dataset.theme, 'dark');
  const app = boot({ blocked: true });
  assert.doesNotThrow(() => app.api.setPreference('dark'));
  assert.equal(app.root.dataset.theme, 'dark');
});
test('other tabs synchronize preference and clearing storage restores system mode', () => {
  const app = boot();
  app.events.storage({ key: 'estuda-junto-theme', newValue: 'dark', storageArea: app.localStorage });
  assert.equal(app.api.getPreference(), 'dark');
  app.events.storage({ key: null, newValue: null, storageArea: app.localStorage });
  assert.equal(app.api.getPreference(), 'system');
  assert.equal(app.root.dataset.theme, 'light');
});
test('subscriptions notify React and can unsubscribe', () => {
  const app = boot(); let count = 0;
  const unsubscribe = app.api.subscribe(() => count++);
  app.api.setPreference('dark'); unsubscribe(); app.api.setPreference('light');
  assert.equal(count, 1);
});
