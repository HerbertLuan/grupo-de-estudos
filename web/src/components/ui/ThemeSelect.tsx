import { useId, useSyncExternalStore } from 'react';

type ThemePreference = 'system' | 'light' | 'dark';
declare global {
  interface Window {
    estudaJuntoTheme: {
      getPreference: () => ThemePreference;
      subscribe: (listener: () => void) => () => void;
      setPreference: (value: ThemePreference) => void;
    };
  }
}

/** Native select preserves keyboard, touch and assistive-technology behavior. */
export function ThemeSelect() {
  const id = useId();
  const theme = window.estudaJuntoTheme;
  const preference = useSyncExternalStore(theme.subscribe, theme.getPreference);
  return <div className="ej-theme-select">
    <label htmlFor={id}>Tema</label>
    <select id={id} value={preference} onChange={event => theme.setPreference(event.target.value as ThemePreference)}>
      <option value="system">Sistema</option>
      <option value="light">Claro</option>
      <option value="dark">Escuro</option>
    </select>
  </div>;
}
