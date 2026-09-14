import { useCallback, useRef } from 'react';

/**
 * Gera um beep suave via Web Audio API (sem arquivos externos).
 * Dois tons curtos em sequência — tom de notificação familiar.
 */
function playBeep(frequency = 660, durationMs = 400) {
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.connect(gain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + durationMs / 1000);

    // Toca um segundo tom após breve pausa
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    gain2.connect(ctx.destination);
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.18);
    gain2.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.19);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18 + durationMs / 1000);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 1.25, ctx.currentTime + 0.18);
    osc2.connect(gain2);
    osc2.start(ctx.currentTime + 0.18);
    osc2.stop(ctx.currentTime + 0.18 + durationMs / 1000);

    // Fechar contexto após os sons terminarem
    setTimeout(() => ctx.close(), (durationMs + 300));
  } catch {
    // Web Audio API não disponível — ignora silenciosamente
  }
}

function sendNotification(title: string, body: string, icon?: string) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon: icon ?? '/vite.svg', silent: true });
  } catch {
    // Notificações bloqueadas — ignora
  }
}

export interface UseTimerNotificationReturn {
  notifyFocusEnd: () => void;
  notifyBreakEnd: () => void;
  requestPermission: () => Promise<void>;
  hasPermission: boolean;
}

export function useTimerNotification(): UseTimerNotificationReturn {
  const permissionRef = useRef<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      permissionRef.current = result;
    }
  }, []);

  const notifyFocusEnd = useCallback(() => {
    // Tom descendente: indica fim de algo (descanso merecido)
    playBeep(660, 380);
    sendNotification(
      '⏰ Tempo de foco encerrado!',
      'Ótimo trabalho! Hora de um intervalo.'
    );
  }, []);

  const notifyBreakEnd = useCallback(() => {
    // Tom ascendente: convida ao retorno
    playBeep(520, 380);
    sendNotification(
      '☕ Intervalo encerrado!',
      'Pronto para mais uma sessão de foco?'
    );
  }, []);

  return {
    notifyFocusEnd,
    notifyBreakEnd,
    requestPermission,
    hasPermission:
      typeof Notification !== 'undefined' && Notification.permission === 'granted',
  };
}
