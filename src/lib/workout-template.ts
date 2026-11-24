/** Return the same calendar date seven days later without timezone shifts. */
export function nextWeekDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) throw new Error(`Invalid workout date: ${date}`);
  return new Date(Date.UTC(year, month - 1, day + 7)).toISOString().slice(0, 10);
}
