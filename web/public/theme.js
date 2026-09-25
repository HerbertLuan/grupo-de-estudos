/* Runs synchronously in <head> so the first paint uses the selected theme. */
(() => {
  const key = 'estuda-junto-theme';
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const listeners = new Set();
  const normalize = value => value === 'light' || value === 'dark' ? value : 'system';
  let preference = 'system';
  try { preference = normalize(localStorage.getItem(key)); } catch { /* Storage may be unavailable. */ }

  function apply() {
    const theme = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0B1B3B' : '#F4F6FA');
    listeners.forEach(listener => listener());
  }

  window.estudaJuntoTheme = {
    getPreference: () => preference,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    setPreference(value) {
      preference = normalize(value);
      try {
        if (preference === 'system') localStorage.removeItem(key);
        else localStorage.setItem(key, preference);
      } catch { /* Keep the choice for this tab even when persistence is blocked. */ }
      apply();
    },
  };
  media.addEventListener('change', () => { if (preference === 'system') apply(); });
  window.addEventListener('storage', event => {
    if (event.storageArea === localStorage && (event.key === key || event.key === null)) {
      preference = normalize(event.newValue);
      apply();
    }
  });
  apply();
})();
