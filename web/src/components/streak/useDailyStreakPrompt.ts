import { useCallback, useEffect, useRef, useState } from 'react';
import { app } from '../../firebase/config';
import { getTodayDateString } from '../../utils/formatDate';
import { canPresent, promptKey, recordPresentation, wasPresented } from './dailyPrompt';

function priorityDialogOpen(uid: string): boolean {
  let completionPending = false;
  try { completionPending = Boolean(sessionStorage.getItem(`pending-study-completion:${uid}`)); } catch { /* sem storage */ }
  return completionPending || Boolean(document.querySelector('.ej-dialog-backdrop, .ej-more-overlay, [role="dialog"]:not(.streak-modal)'));
}

function availableStorage(): Storage | undefined {
  try { return window.localStorage; } catch { return undefined; }
}

export function useDailyStreakPrompt(uid: string, sessionActive: boolean) {
  const [openForUid, setOpenForUid] = useState<string | null>(null);
  const [pendingUid, setPendingUid] = useState<string | null>(null);
  const open = Boolean(uid && openForUid === uid);
  const manualPending = pendingUid === uid;
  const key = promptKey(app.options.projectId || 'default', uid);
  const releasing = useRef<(() => void) | null>(null);
  const opening = useRef(false);
  const openManual = useCallback(() => {
    if (priorityDialogOpen(uid)) setPendingUid(uid);
    else setOpenForUid(uid);
  }, [uid]);
  const close = useCallback(() => setOpenForUid(null), []);
  const onPresented = useCallback(() => {
    recordPresentation(key, getTodayDateString(), availableStorage());
    releasing.current?.();
    releasing.current = null;
  }, [key]);

  useEffect(() => () => {
    releasing.current?.();
    releasing.current = null;
  }, [key]);

  useEffect(() => {
    let active = true;
    const tryOpen = () => {
      if (!active || opening.current || open) return;
      if (manualPending) {
        if (!priorityDialogOpen(uid)) { setPendingUid(null); setOpenForUid(uid); }
        return;
      }
      const today = getTodayDateString();
      if (!canPresent(today, wasPresented(key, today, availableStorage()), document.visibilityState === 'visible', sessionActive || priorityDialogOpen(uid))) return;
      const claim = async () => {
        if (navigator.locks?.request) {
          await navigator.locks.request(key, { ifAvailable: true }, async lock => {
            if (!lock || !active || wasPresented(key, getTodayDateString(), availableStorage()) || sessionActive || priorityDialogOpen(uid)) return;
            await new Promise<void>(resolve => { releasing.current = resolve; setOpenForUid(uid); });
          });
        } else if (active && !wasPresented(key, getTodayDateString(), availableStorage())) {
          setOpenForUid(uid);
        }
      };
      opening.current = true;
      void claim().finally(() => { opening.current = false; });
    };
    const onReturn = () => { if (document.visibilityState === 'visible') tryOpen(); };
    const observer = new MutationObserver(tryOpen);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('visibilitychange', onReturn);
    window.addEventListener('focus', onReturn);
    window.addEventListener('storage', onReturn);
    window.addEventListener('pointerdown', tryOpen, true);
    window.addEventListener('keydown', tryOpen, true);
    const frame = requestAnimationFrame(tryOpen);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onReturn);
      window.removeEventListener('focus', onReturn);
      window.removeEventListener('storage', onReturn);
      window.removeEventListener('pointerdown', tryOpen, true);
      window.removeEventListener('keydown', tryOpen, true);
      opening.current = false;
    };
  }, [uid, key, sessionActive, open, manualPending]);

  return { open, openManual, close, onPresented };
}
