import { useState, useCallback } from 'react';
import type { TimerSettings } from '../types';

const STORAGE_KEY = 'timer_settings';

const DEFAULT_SETTINGS: TimerSettings = {
  mode: 'stopwatch',
  focusDurationSeconds: 25 * 60,
  breakDurationSeconds: 5 * 60,
};

function loadSettings(): TimerSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<TimerSettings>;
    return {
      mode: parsed.mode === 'timer' ? 'timer' : 'stopwatch',
      focusDurationSeconds:
        typeof parsed.focusDurationSeconds === 'number' && parsed.focusDurationSeconds > 0
          ? parsed.focusDurationSeconds
          : DEFAULT_SETTINGS.focusDurationSeconds,
      breakDurationSeconds:
        typeof parsed.breakDurationSeconds === 'number' && parsed.breakDurationSeconds > 0
          ? parsed.breakDurationSeconds
          : DEFAULT_SETTINGS.breakDurationSeconds,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export interface UseTimerSettingsReturn {
  settings: TimerSettings;
  updateSettings: (patch: Partial<TimerSettings>) => void;
}

export function useTimerSettings(): UseTimerSettingsReturn {
  const [settings, setSettings] = useState<TimerSettings>(loadSettings);

  const updateSettings = useCallback((patch: Partial<TimerSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage indisponível (ex: modo privado bloqueado)
      }
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
