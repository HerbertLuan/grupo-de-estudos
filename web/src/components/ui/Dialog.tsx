import { useEffect, useRef, type RefObject } from 'react';

let lockCount = 0;
let originalOverflow = '';
const dialogStack: symbol[] = [];

/** Shared keyboard and focus behavior for dialogs, drawers and bottom sheets. */
export function useDialogA11y(ref: RefObject<HTMLElement | null>, open: boolean, onClose?: () => void) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const id = Symbol('dialog');
    dialogStack.push(id);
    if (lockCount++ === 0) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    const getItems = () => Array.from(ref.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex="0"]') || []).filter(node => node.getClientRects().length > 0);
    const frame = requestAnimationFrame(() => {
      const node = ref.current;
      if (node) {
        node.setAttribute('tabindex', '-1');
        node.setAttribute('role', 'dialog');
        node.setAttribute('aria-modal', 'true');
        (getItems()[0] || node).focus();
      }
    });
    const keydown = (event: KeyboardEvent) => {
      if (dialogStack.at(-1) !== id) return;
      if (event.key === 'Escape' && closeRef.current) {
        event.preventDefault();
        closeRef.current();
      }
      if (event.key !== 'Tab') return;
      const items = getItems();
      if (!items.length) { event.preventDefault(); ref.current?.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !ref.current?.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !items.includes(document.activeElement as HTMLElement))) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', keydown);
      dialogStack.splice(dialogStack.indexOf(id), 1);
      if (--lockCount === 0) document.body.style.overflow = originalOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open, ref]);
}
