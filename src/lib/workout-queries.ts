import { supabase } from "@/integrations/supabase/client";

export type Exercise = {
  id: string;
  name: string;
  muscle_group: string | null;
  gif_url: string | null;
  notes: string | null;
};

export const MUSCLE_GROUP_ORDER = [
  "Chest",
  "Back & Posterior Neck",
  "Arms",
  "Shoulders & Lateral Neck",
  "Quads & Calves",
  "Glutes & Hamstrings",
];

export function groupExercisesByMuscleGroup(exercises: Exercise[]) {
  const groups = new Map<string, Exercise[]>();
  for (const ex of exercises) {
    const group = ex.muscle_group ?? "Other";
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(ex);
  }
  // "✪ " marks compound exercises and "➭ " marks gym machines; keep them at
  // the bottom of each group, machines last.
  const markerRank = (name: string) =>
    name.startsWith("➭") ? 2 : name.startsWith("✪") ? 1 : 0;
  for (const list of groups.values()) {
    list.sort((a, b) => {
      const ac = markerRank(a.name);
      const bc = markerRank(b.name);
      if (ac !== bc) return ac - bc;
      return a.name.localeCompare(b.name);
    });
  }
  return [...groups.entries()].sort(([a], [b]) => {
    const ia = MUSCLE_GROUP_ORDER.indexOf(a);
    const ib = MUSCLE_GROUP_ORDER.indexOf(b);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    return a.localeCompare(b);
  });
}

export type ExerciseSet = {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  reps: number;
  weight: number;
};

// The Stair Climber logs time (minutes) and steps instead of reps and weight;
// the reps field holds steps and the weight field holds minutes.
export function isStairClimber(name: string) {
  return name.replace(/[✪➭]/g, "").trim().toLowerCase() === "stair climber";
}

export type WeightDirection = "up" | "same" | "down";

export type WorkoutExercise = {
  id: string;
  workout_id: string;
  exercise_id: string;
  position: number;
  success: boolean;
  weight_direction: WeightDirection;
  exercises: Exercise;
  exercise_sets: ExerciseSet[];
};

export type Workout = {
  id: string;
  date: string;
  title: string;
  notes: string | null;
  success: boolean;
};

export type LastPerformance = {
  date: string;
  weightDirection: WeightDirection;
  sets: { set_number: number; reps: number; weight: number }[];
};

export const exercisesQuery = {
  queryKey: ["exercises"],
  queryFn: async (): Promise<Exercise[]> => {
    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .order("name");
    if (error) throw error;
    return (data ?? []) as Exercise[];
  },
};

export const workoutsQuery = {
  queryKey: ["workouts"],
  queryFn: async (): Promise<Workout[]> => {
    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .order("date", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Workout[];
  },
};

export const workoutDetailQuery = (id: string) => ({
  queryKey: ["workout", id],
  queryFn: async () => {
    const [{ data: workout, error: wErr }, { data: entries, error: eErr }] =
      await Promise.all([
        supabase.from("workouts").select("*").eq("id", id).maybeSingle(),
        supabase
          .from("workout_exercises")
          .select("*, exercises(*), exercise_sets(*)")
          .eq("workout_id", id)
          .order("position"),
      ]);
    if (wErr) throw wErr;
    if (eErr) throw eErr;
    const list = ((entries ?? []) as unknown as WorkoutExercise[]).map((entry) => ({
      ...entry,
      exercise_sets: [...(entry.exercise_sets ?? [])].sort(
        (a, b) => a.set_number - b.set_number,
      ),
    }));
    const w = workout as Workout | null;
    const lastByExercise = new Map<string, LastPerformance>();

    if (w && list.length > 0) {
      const { data: history, error: hErr } = await supabase
        .from("workout_exercises")
        .select("exercise_id, workout_id, weight_direction, exercise_sets(*), workouts!inner(date)")
        .in(
          "exercise_id",
          list.map((e) => e.exercise_id),
        )
        .neq("workout_id", id)
        .lte("workouts.date", w.date);
      if (hErr) throw hErr;

      type Row = {
        exercise_id: string;
        weight_direction: WeightDirection;
        exercise_sets: ExerciseSet[];
        workouts: { date: string };
      };
      for (const row of (history ?? []) as unknown as Row[]) {
        const sets = [...(row.exercise_sets ?? [])].sort(
          (a, b) => a.set_number - b.set_number,
        );
        if (sets.length === 0) continue;
        const existing = lastByExercise.get(row.exercise_id);
        if (!existing || existing.date < row.workouts.date) {
          lastByExercise.set(row.exercise_id, {
            date: row.workouts.date,
            weightDirection: row.weight_direction,
            sets: sets.map((s) => ({
              set_number: s.set_number,
              reps: s.reps,
              weight: s.weight,
            })),
          });
        }
      }
    }

    return { workout: w, entries: list, lastByExercise };
  },
});

export type ExerciseHistoryPoint = {
  date: string;
  workoutTitle: string;
  sets: number;
  totalReps: number;
  topWeight: number;
  volume: number;
};

export const exerciseHistoryQuery = (exerciseId: string) => ({
  queryKey: ["exercise-history", exerciseId],
  queryFn: async (): Promise<ExerciseHistoryPoint[]> => {
    const { data, error } = await supabase
      .from("workout_exercises")
      .select("exercise_sets(*), exercises(name), workouts!inner(date, title)")
      .eq("exercise_id", exerciseId);
    if (error) throw error;

    type Row = {
      exercise_sets: ExerciseSet[];
      exercises: { name: string } | null;
      workouts: { date: string; title: string };
    };
    const points: ExerciseHistoryPoint[] = [];
    for (const row of (data ?? []) as unknown as Row[]) {
      const sets = row.exercise_sets ?? [];
      if (sets.length === 0) continue;
      const totalReps = sets.reduce((sum, s) => sum + s.reps, 0);
      const topWeight = Math.max(...sets.map((s) => s.weight));
      // For the stair climber, "volume" is the step count rather than a
      // meaningless steps × minutes product.
      const volume = isStairClimber(row.exercises?.name ?? "")
        ? totalReps
        : sets.reduce((sum, s) => sum + s.reps * s.weight, 0);
      points.push({
        date: row.workouts.date,
        workoutTitle: row.workouts.title,
        sets: sets.length,
        totalReps,
        topWeight,
        volume,
      });
    }
    return points.sort((a, b) => a.date.localeCompare(b.date));
  },
});

export type ExerciseMetricSeries = {
  exerciseId: string;
  exerciseName: string;
  color: string;
  data: { date: string; volume: number; topWeight: number; totalReps: number }[];
};

export type MuscleGroupMetrics = {
  group: string;
  series: ExerciseMetricSeries[];
};

export const metricsQuery = {
  queryKey: ["metrics"],
  queryFn: async (): Promise<MuscleGroupMetrics[]> => {
    const [{ data: exercisesData, error: eErr }, { data: entries, error: wErr }] =
      await Promise.all([
        supabase.from("exercises").select("id, name, muscle_group").order("name"),
        supabase
          .from("workout_exercises")
          .select("exercise_id, exercise_sets(*), workouts!inner(date)")
          .order("created_at", { ascending: true }),
      ]);
    if (eErr) throw eErr;
    if (wErr) throw wErr;

    const exercises = (exercisesData ?? []) as Exercise[];
    const byExercise = new Map<string, ExerciseMetricSeries["data"]>();

    type Row = {
      exercise_id: string;
      exercise_sets: ExerciseSet[];
      workouts: { date: string };
    };
    for (const row of (entries ?? []) as unknown as Row[]) {
      const sets = row.exercise_sets ?? [];
      if (sets.length === 0) continue;
      const totalReps = sets.reduce((sum, s) => sum + s.reps, 0);
      const topWeight = Math.max(...sets.map((s) => s.weight));
      const volume = sets.reduce((sum, s) => sum + s.reps * s.weight, 0);
      const list = byExercise.get(row.exercise_id) ?? [];
      list.push({ date: row.workouts.date, volume, topWeight, totalReps });
      byExercise.set(row.exercise_id, list);
    }

    const palette = [
      "#7C3AED",
      "#DB2777",
      "#059669",
      "#D97706",
      "#2563EB",
      "#0891B2",
      "#DC2626",
      "#7C2D12",
      "#4338CA",
      "#BE185D",
    ];

    const groups = new Map<string, ExerciseMetricSeries[]>();
    for (const ex of exercises) {
      const data = byExercise.get(ex.id);
      if (!data || data.length === 0) continue;
      const group = ex.muscle_group ?? "Other";
      if (!groups.has(group)) groups.set(group, []);
      const series = groups.get(group)!;
      series.push({
        exerciseId: ex.id,
        exerciseName: ex.name,
        color: palette[series.length % palette.length],
        data,
      });
    }

    return [...groups.entries()].sort(([a], [b]) => {
      const ia = MUSCLE_GROUP_ORDER.indexOf(a);
      const ib = MUSCLE_GROUP_ORDER.indexOf(b);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      return a.localeCompare(b);
    }).map(([group, series]) => ({ group, series }));
  },
};
