/** Move one entry without changing any of its logged exercise data. */
export function reorderExercises<T extends { id: string; position: number }>(
  entries: T[],
  activeId: string,
  overId: string,
): T[] {
  const from = entries.findIndex((entry) => entry.id === activeId);
  const to = entries.findIndex((entry) => entry.id === overId);
  if (from < 0 || to < 0 || from === to) return entries;
  const result = [...entries];
  const [moved] = result.splice(from, 1);
  if (!moved) return entries;
  result.splice(to, 0, moved);
  return result.map((entry, position) => ({ ...entry, position }));
}

export function nextExercisePosition(entries: { position: number }[]): number {
  return entries.reduce((next, entry) => Math.max(next, entry.position + 1), 0);
}