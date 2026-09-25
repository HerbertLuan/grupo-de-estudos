const memory = new Map<string, string>();

export function promptKey(project: string, uid: string): string {
  return `estuda-junto:${project}:streak-calendar:${uid}`;
}

export function wasPresented(key: string, today: string, storage?: Pick<Storage, 'getItem'>): boolean {
  try { if (storage?.getItem(key) === today) return true; } catch { /* storage desativado */ }
  return memory.get(key) === today;
}

export function recordPresentation(key: string, today: string, storage?: Pick<Storage, 'setItem'>): void {
  memory.set(key, today);
  try { storage?.setItem(key, today); } catch { /* controle em memória */ }
}

export function canPresent(today: string, lastShown: boolean, visible: boolean, busy: boolean): boolean {
  return visible && !busy && !lastShown && Boolean(today);
}
