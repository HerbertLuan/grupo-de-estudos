import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TimerMode, TimerSettings } from '../../types';

const FOCUS_PRESETS = [
  { label: '25 min', value: 25 * 60 },
  { label: '50 min', value: 50 * 60 },
  { label: 'Personalizado', value: -1 },
];

const BREAK_PRESETS = [
  { label: '5 min', value: 5 * 60 },
  { label: '10 min', value: 10 * 60 },
  { label: 'Personalizado', value: -1 },
];

export interface TimerModeSelectorProps {
  settings: TimerSettings;
  onUpdate: (patch: Partial<TimerSettings>) => void;
  /** Se true, os controles ficam desabilitados (sessão em andamento) */
  disabled?: boolean;
}

export function TimerModeSelector({ settings, onUpdate, disabled }: TimerModeSelectorProps) {
  const [customFocusMin, setCustomFocusMin] = useState(
    Math.floor(settings.focusDurationSeconds / 60)
  );
  const [customBreakMin, setCustomBreakMin] = useState(
    Math.floor(settings.breakDurationSeconds / 60)
  );

  const isCustomFocus = !FOCUS_PRESETS.some(
    p => p.value === settings.focusDurationSeconds
  );
  const isCustomBreak = !BREAK_PRESETS.some(
    p => p.value === settings.breakDurationSeconds
  );

  function handleModeChange(mode: TimerMode) {
    if (disabled) return;
    onUpdate({ mode });
  }

  function handleFocusPreset(value: number) {
    if (disabled) return;
    if (value === -1) return; // Personalizado — não altera ainda
    onUpdate({ focusDurationSeconds: value });
  }

  function handleBreakPreset(value: number) {
    if (disabled) return;
    if (value === -1) return;
    onUpdate({ breakDurationSeconds: value });
  }

  function handleCustomFocusChange(e: React.ChangeEvent<HTMLInputElement>) {
    const min = Math.max(1, Math.min(240, parseInt(e.target.value, 10) || 1));
    setCustomFocusMin(min);
    onUpdate({ focusDurationSeconds: min * 60 });
  }

  function handleCustomBreakChange(e: React.ChangeEvent<HTMLInputElement>) {
    const min = Math.max(1, Math.min(60, parseInt(e.target.value, 10) || 1));
    setCustomBreakMin(min);
    onUpdate({ breakDurationSeconds: min * 60 });
  }

  return (
    <div className="w-full">
      {/* Toggle de modo */}
      <div className="flex items-center bg-bg-tertiary rounded-2xl p-1 mb-4">
        {(['stopwatch', 'timer'] as TimerMode[]).map(m => (
          <button
            key={m}
            id={`timer-mode-${m}`}
            disabled={disabled}
            onClick={() => handleModeChange(m)}
            className={`
              relative flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${settings.mode === m
                ? 'text-white'
                : 'text-text-muted hover:text-text-secondary'}
            `}
          >
            {settings.mode === m && (
              <motion.div
                layoutId="mode-pill"
                className="absolute inset-0 bg-accent-primary rounded-xl shadow-lg"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              {m === 'stopwatch' ? '⏱' : '⏰'}
              {m === 'stopwatch' ? 'Cronômetro' : 'Temporizador'}
            </span>
          </button>
        ))}
      </div>

      {/* Configurações do temporizador */}
      <AnimatePresence>
        {settings.mode === 'timer' && (
          <motion.div
            key="timer-config"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="bg-bg-tertiary rounded-2xl p-4 flex flex-col gap-4">

              {/* Foco */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-accent-primary mb-2">
                  🎯 Tempo de Foco
                </p>
                <div className="flex gap-2 flex-wrap">
                  {FOCUS_PRESETS.map(p => {
                    const isActive = p.value === -1
                      ? isCustomFocus
                      : settings.focusDurationSeconds === p.value;
                    return (
                      <button
                        key={p.label}
                        id={`focus-preset-${p.label.replace(' ', '-')}`}
                        disabled={disabled}
                        onClick={() => handleFocusPreset(p.value)}
                        className={`
                          px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150
                          disabled:opacity-50 disabled:cursor-not-allowed
                          ${isActive
                            ? 'bg-accent-primary/20 border-accent-primary text-accent-primary'
                            : 'bg-bg-quaternary border-border text-text-secondary hover:border-accent-primary/50'}
                        `}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
                <AnimatePresence>
                  {isCustomFocus && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="mt-2 flex items-center gap-2"
                    >
                      <input
                        id="custom-focus-minutes"
                        type="number"
                        min={1}
                        max={240}
                        value={customFocusMin}
                        onChange={handleCustomFocusChange}
                        disabled={disabled}
                        className="w-20 bg-bg-quaternary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary text-center focus:outline-none focus:border-accent-primary disabled:opacity-50"
                      />
                      <span className="text-sm text-text-muted">minutos</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Intervalo */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-accent-success mb-2">
                  ☕ Tempo de Intervalo
                </p>
                <div className="flex gap-2 flex-wrap">
                  {BREAK_PRESETS.map(p => {
                    const isActive = p.value === -1
                      ? isCustomBreak
                      : settings.breakDurationSeconds === p.value;
                    return (
                      <button
                        key={p.label}
                        id={`break-preset-${p.label.replace(' ', '-')}`}
                        disabled={disabled}
                        onClick={() => handleBreakPreset(p.value)}
                        className={`
                          px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150
                          disabled:opacity-50 disabled:cursor-not-allowed
                          ${isActive
                            ? 'bg-accent-success/20 border-accent-success text-accent-success'
                            : 'bg-bg-quaternary border-border text-text-secondary hover:border-accent-success/50'}
                        `}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
                <AnimatePresence>
                  {isCustomBreak && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="mt-2 flex items-center gap-2"
                    >
                      <input
                        id="custom-break-minutes"
                        type="number"
                        min={1}
                        max={60}
                        value={customBreakMin}
                        onChange={handleCustomBreakChange}
                        disabled={disabled}
                        className="w-20 bg-bg-quaternary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary text-center focus:outline-none focus:border-accent-success disabled:opacity-50"
                      />
                      <span className="text-sm text-text-muted">minutos</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
