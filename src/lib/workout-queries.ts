import { supabase } from "@/integrations/supabase/client";

export type Exercise = {
  id: string;
  name: string;
  muscle_group: string | null;
  gif_url: string | null;
  notes: string | null;
};

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
  exercises: Exercise;
  exercise_sets: ExerciseSet[];
};

export type Workout = {
  id: string;
  date: string;
  title: string;
  notes: string | null;
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
