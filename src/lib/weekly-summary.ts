import { getExerciseMuscles } from "@/lib/exercise-muscles";
import { isStairClimber } from "@/lib/workout-queries";

export type SummaryWorkout = {
  date: string; // YYYY-MM-DD
  title: string;
  exercises: {
    name: string;
    position: number;
    sets: { set_number: number; reps: number; weight: number }[];
  }[];
};

function parse(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y!, m! - 1, day!);
}

const fmt = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export function setLine(name: string, n: number, reps: number, weight: number) {
  if (isStairClimber(name)) return `  - Set ${n}: ${weight} min x ${reps} steps`;
  if (weight <= 0) return `  - Set ${n}: Bodyweight x ${reps} reps`;
  return `  - Set ${n}: ${weight} lbs x ${reps} reps`;
}

export function formatWeeklySummary(weekStart: Date, workouts: SummaryWorkout[]) {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date));
  let totalSets = 0;
  let volume = 0;
  const blocks = sorted.map((w) => {
    const d = parse(w.date);
    const day = d.toLocaleDateString("en-US", { weekday: "long" });
    const lines = [`${day}, ${fmt(d)} - ${w.title}`];
    for (const ex of [...w.exercises].sort((a, b) => a.position - b.position)) {
      const m = getExerciseMuscles(ex.name);
      let head = `• ${ex.name}`;
      if (m?.primary.length) head += ` | Primary: ${m.primary.join(", ")}`;
      if (m?.supporting.length) head += ` | Secondary: ${m.supporting.join(", ")}`;
      lines.push(head);
      const sets = [...ex.sets].sort((a, b) => a.set_number - b.set_number);
      sets.forEach((s, i) => {
        totalSets++;
        if (!isStairClimber(ex.name)) volume += s.reps * s.weight;
        lines.push(setLine(ex.name, i + 1, s.reps, s.weight));
      });
    }
    return lines.join("\n");
  });
  return [
    `WEEKLY LIFT LOG SUMMARY: ${fmt(weekStart)} - ${fmt(end)}`,
    `Total Workouts: ${sorted.length} | Total Sets: ${totalSets} | Total Volume: ${volume.toLocaleString("en-US")} lbs`,
    "",
    "---",
    blocks.join("\n---\n"),
    "---",
  ].join("\n");
}
