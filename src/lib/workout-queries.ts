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
  for (const list of groups.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name));
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

export type WorkoutExercise = {
  id: string;
  workout_id: string;
  exercise_id: string;
  position: number;
  success: boolean;
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
    return { workout: workout as Workout | null, entries: list };
  },
});
