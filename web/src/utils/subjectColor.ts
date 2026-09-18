const palette = ['#6366f1', '#e879f9', '#22c55e', '#f59e0b', '#38bdf8', '#f97316', '#14b8a6', '#ef4444'];
export const OTHER_SUBJECT_COLOR = '#71717a';

export function subjectColor(subjectId: string | null, colors: Record<string, string>): string {
  if (!subjectId) return OTHER_SUBJECT_COLOR;
  const saved = colors[subjectId];
  if (saved && /^#[0-9a-fA-F]{6}$/.test(saved)) return saved;
  let hash = 0;
  for (const character of subjectId) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}
