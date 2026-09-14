import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TimerMode, TimerSettings } from '../../types';

const FOCUS_PRESETS = [
  { label: '25 min', minutes: 25 },
  { label: '50 min', minutes: 50 },
];

const BREAK_PRESETS = [
  { label: '5 min', minutes: 5 },
  { label: '10 min', minutes: 10 },
];

export interface TimerModeSelectorProps {
  settings: TimerSettings;
  onUpdate: (patch: Partial<TimerSettings>) => void;
  /** Se true, os controles ficam desabilitados (sessão em andamento) */
  disabled?: boolean;
}

export function TimerModeSelector({ settings, onUpdate, disabled }: TimerModeSelectorProps) {
  const currentFocusMin = Math.round(settings.focusDurationSeconds / 60);
  const currentBreakMin = Math.round(settings.breakDurationSeconds / 60);

  const isPresetFocus = FOCUS_PRESETS.some(p => p.minutes === currentFocusMin);
  const isPresetBreak = BREAK_PRESETS.some(p => p.minutes === currentBreakMin);

  const [isCustomFocus, setIsCustomFocus] = useState(!isPresetFocus);
  const [isCustomBreak, setIsCustomBreak] = useState(!isPresetBreak);

  const [focusInputVal, setFocusInputVal] = useState(String(currentFocusMin));
  const [breakInputVal, setBreakInputVal] = useState(String(currentBreakMin));

  // Manter sincronizado caso settings mude externamente
  useEffect(() => {
    const min = Math.round(settings.focusDurationSeconds / 60);
    setFocusInputVal(String(min));
    if (!FOCUS_PRESETS.some(p => p.minutes === min)) {
      setIsCustomFocus(true);
    }
  }, [settings.focusDurationSeconds]);

  useEffect(() => {
    const min = Math.round(settings.breakDurationSeconds / 60);
    setBreakInputVal(String(min));
    if (!BREAK_PRESETS.some(p => p.minutes === min)) {
      setIsCustomBreak(true);
    }
  }, [settings.breakDurationSeconds]);

  function handleModeChange(mode: TimerMode) {
    if (disabled) return;
    onUpdate({ mode });
  }

  // ── Foco Handlers ──────────────────────────────────────────────────────────

  function handleFocusPreset(minutes: number) {
    if (disabled) return;
    setIsCustomFocus(false);
    setFocusInputVal(String(minutes));
    onUpdate({ focusDurationSeconds: minutes * 60 });
  }

  function handleCustomFocusClick() {
    if (disabled) return;
    setIsCustomFocus(true);
    const parsed = parseInt(focusInputVal, 10);
    const val = !isNaN(parsed) && parsed >= 1 && parsed <= 240 ? parsed : currentFocusMin;
    setFocusInputVal(String(val));
    onUpdate({ focusDurationSeconds: val * 60 });
  }

  function handleFocusInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setFocusInputVal(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 240) {
      onUpdate({ focusDurationSeconds: parsed * 60 });
    }
  }

  function handleFocusInputBlur() {
    let parsed = parseInt(focusInputVal, 10);
    if (isNaN(parsed) || parsed < 1) parsed = 1;
    if (parsed > 240) parsed = 240;
    setFocusInputVal(String(parsed));
    onUpdate({ focusDurationSeconds: parsed * 60 });
  }

  function handleFocusStep(step: number) {
    if (disabled) return;
    const current = parseInt(focusInputVal, 10) || currentFocusMin;
    const next = Math.max(1, Math.min(240, current + step));
    setFocusInputVal(String(next));
    onUpdate({ focusDurationSeconds: next * 60 });
  }

  // ── Intervalo Handlers ─────────────────────────────────────────────────────

  function handleBreakPreset(minutes: number) {
    if (disabled) return;
    setIsCustomBreak(false);
    setBreakInputVal(String(minutes));
    onUpdate({ breakDurationSeconds: minutes * 60 });
  }

  function handleCustomBreakClick() {
    if (disabled) return;
    setIsCustomBreak(true);
    const parsed = parseInt(breakInputVal, 10);
    const val = !isNaN(parsed) && parsed >= 1 && parsed <= 60 ? parsed : currentBreakMin;
    setBreakInputVal(String(val));
    onUpdate({ breakDurationSeconds: val * 60 });
  }

  function handleBreakInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setBreakInputVal(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 60) {
      onUpdate({ breakDurationSeconds: parsed * 60 });
    }
  }

  function handleBreakInputBlur() {
    let parsed = parseInt(breakInputVal, 10);
    if (isNaN(parsed) || parsed < 1) parsed = 1;
    if (parsed > 60) parsed = 60;
    setBreakInputVal(String(parsed));
    onUpdate({ breakDurationSeconds: parsed * 60 });
  }

  function handleBreakStep(step: number) {
    if (disabled) return;
    const current = parseInt(breakInputVal, 10) || currentBreakMin;
    const next = Math.max(1, Math.min(60, current + step));
    setBreakInputVal(String(next));
    onUpdate({ breakDurationSeconds: next * 60 });
  }

  return (
    <div className="w-full">
      {/* Toggle de modo */}
      <div className="flex items-center bg-bg-tertiary rounded-2xl p-1 mb-4">
        {(['stopwatch', 'timer'] as TimerMode[]).map(m => (
          <button
            key={m}
            id={`timer-mode-${m}`}
            type="button"
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
            <div className="bg-bg-tertiary rounded-2xl p-4 flex flex-col gap-5">

              {/* Foco */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-accent-primary mb-2.5">
                  🎯 Tempo de Foco
                </p>
                <div className="flex gap-2 flex-wrap">
                  {FOCUS_PRESETS.map(p => {
                    const isActive = !isCustomFocus && currentFocusMin === p.minutes;
                    return (
                      <button
                        key={p.label}
                        id={`focus-preset-${p.label.replace(' ', '-')}`}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleFocusPreset(p.minutes)}
                        className={`
                          px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150
                          disabled:opacity-50 disabled:cursor-not-allowed
                          ${isActive
                            ? 'bg-accent-primary/20 border-accent-primary text-accent-primary font-semibold'
                            : 'bg-bg-quaternary border-border text-text-secondary hover:border-accent-primary/50'}
                        `}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                  <button
                    id="focus-preset-Personalizado"
                    type="button"
                    disabled={disabled}
                    onClick={handleCustomFocusClick}
                    className={`
                      px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${isCustomFocus
                        ? 'bg-accent-primary/20 border-accent-primary text-accent-primary font-semibold'
                        : 'bg-bg-quaternary border-border text-text-secondary hover:border-accent-primary/50'}
                    `}
                  >
                    Personalizado
                  </button>
                </div>

                <AnimatePresence>
                  {isCustomFocus && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="mt-3 flex items-center gap-2"
                    >
                      <div className="flex items-center bg-bg-quaternary border border-border rounded-xl p-0.5">
                        <button
                          type="button"
                          aria-label="Diminuir 1 minuto de foco"
                          onClick={() => handleFocusStep(-1)}
                          disabled={disabled || (parseInt(focusInputVal, 10) || currentFocusMin) <= 1}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:bg-bg-tertiary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed text-base font-bold transition-colors"
                        >
                          −
                        </button>
                        <input
                          id="custom-focus-minutes"
                          type="number"
                          min={1}
                          max={240}
                          value={focusInputVal}
                          onChange={handleFocusInputChange}
                          onBlur={handleFocusInputBlur}
                          disabled={disabled}
                          className="w-14 bg-transparent text-center text-sm font-semibold text-text-primary focus:outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          aria-label="Aumentar 1 minuto de foco"
                          onClick={() => handleFocusStep(1)}
                          disabled={disabled || (parseInt(focusInputVal, 10) || currentFocusMin) >= 240}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:bg-bg-tertiary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed text-base font-bold transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm text-text-muted font-medium">minutos</span>
                      <span className="text-xs text-text-muted/60">(1 a 240 min)</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Intervalo */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-accent-success mb-2.5">
                  ☕ Tempo de Intervalo
                </p>
                <div className="flex gap-2 flex-wrap">
                  {BREAK_PRESETS.map(p => {
                    const isActive = !isCustomBreak && currentBreakMin === p.minutes;
                    return (
                      <button
                        key={p.label}
                        id={`break-preset-${p.label.replace(' ', '-')}`}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleBreakPreset(p.minutes)}
                        className={`
                          px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150
                          disabled:opacity-50 disabled:cursor-not-allowed
                          ${isActive
                            ? 'bg-accent-success/20 border-accent-success text-accent-success font-semibold'
                            : 'bg-bg-quaternary border-border text-text-secondary hover:border-accent-success/50'}
                        `}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                  <button
                    id="break-preset-Personalizado"
                    type="button"
                    disabled={disabled}
                    onClick={handleCustomBreakClick}
                    className={`
                      px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${isCustomBreak
                        ? 'bg-accent-success/20 border-accent-success text-accent-success font-semibold'
                        : 'bg-bg-quaternary border-border text-text-secondary hover:border-accent-success/50'}
                    `}
                  >
                    Personalizado
                  </button>
                </div>

                <AnimatePresence>
                  {isCustomBreak && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="mt-3 flex items-center gap-2"
                    >
                      <div className="flex items-center bg-bg-quaternary border border-border rounded-xl p-0.5">
                        <button
                          type="button"
                          aria-label="Diminuir 1 minuto de intervalo"
                          onClick={() => handleBreakStep(-1)}
                          disabled={disabled || (parseInt(breakInputVal, 10) || currentBreakMin) <= 1}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:bg-bg-tertiary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed text-base font-bold transition-colors"
                        >
                          −
                        </button>
                        <input
                          id="custom-break-minutes"
                          type="number"
                          min={1}
                          max={60}
                          value={breakInputVal}
                          onChange={handleBreakInputChange}
                          onBlur={handleBreakInputBlur}
                          disabled={disabled}
                          className="w-14 bg-transparent text-center text-sm font-semibold text-text-primary focus:outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          aria-label="Aumentar 1 minuto de intervalo"
                          onClick={() => handleBreakStep(1)}
                          disabled={disabled || (parseInt(breakInputVal, 10) || currentBreakMin) >= 60}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:bg-bg-tertiary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed text-base font-bold transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm text-text-muted font-medium">minutos</span>
                      <span className="text-xs text-text-muted/60">(1 a 60 min)</span>
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
