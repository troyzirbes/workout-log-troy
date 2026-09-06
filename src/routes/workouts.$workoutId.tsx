import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import {
  exercisesQuery,
  groupExercisesByMuscleGroup,
  workoutDetailQuery,
} from "@/lib/workout-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/workouts/$workoutId")({
  head: () => ({
    meta: [
      { title: "Workout Details — Lift Log" },
      {
        name: "description",
        content: "Exercises, sets, reps and weights for this training session.",
      },
      { property: "og:title", content: "Workout Details — Lift Log" },
      {
        property: "og:description",
        content: "Exercises, sets, reps and weights for this training session.",
      },
    ],
  }),
  component: WorkoutDetail,
});

function WorkoutDetail() {
  const { workoutId } = Route.useParams();
  const qc = useQueryClient();
  const detail = workoutDetailQuery(workoutId);
  const { data, isLoading } = useQuery(detail);
  const { data: exercises = [] } = useQuery(exercisesQuery);
  const [picked, setPicked] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: detail.queryKey });

  const addExercise = useMutation({
    mutationFn: async (exerciseId: string) => {
      const { error } = await supabase.from("workout_exercises").insert({
        workout_id: workoutId,
        exercise_id: exerciseId,
        position: data?.entries.length ?? 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setPicked("");
      invalidate();
    },
  });

  const removeExercise = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workout_exercises").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const addSet = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: number }) => {
      const { error } = await supabase
        .from("exercise_sets")
        .insert({ workout_exercise_id: id, set_number: next, reps: 8, weight: 0 });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateSet = useMutation({
    mutationFn: async ({
      id,
      field,
      value,
    }: {
      id: string;
      field: "reps" | "weight";
      value: number;
    }) => {
      const { error } = await supabase
        .from("exercise_sets")
        .update(field === "reps" ? { reps: value } : { weight: value })
        .eq("id", id);
      if (error) throw error;

    },
    onSuccess: invalidate,
  });

  const removeSet = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exercise_sets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  if (isLoading) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </AppShell>
    );
  }

  if (!data?.workout) {
    return (
      <AppShell>
        <h1 className="text-2xl font-semibold">Workout not found</h1>
        <Link to="/" className="mt-4 inline-block text-sm text-primary underline">
          Back to workouts
        </Link>
      </AppShell>
    );
  }

  const { workout, entries } = data;
  const used = new Set(entries.map((e) => e.exercise_id));

  return (
    <AppShell>
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All workouts
      </Link>

      <h1 className="text-3xl font-semibold">{workout.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{workout.date}</p>
      {workout.notes && <p className="mt-3 text-sm">{workout.notes}</p>}

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <Select value={picked} onValueChange={setPicked}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Add an exercise…" />
          </SelectTrigger>
          <SelectContent>
            {groupExercisesByMuscleGroup(
              exercises.filter((e) => !used.has(e.id)),
            ).map(([group, items]) => (
              <SelectGroup key={group}>
                <SelectLabel>{group}</SelectLabel>
                {items.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        <Button disabled={!picked} onClick={() => addExercise.mutate(picked)}>
          <Plus className="size-4" /> Add
        </Button>
        <Link
          to="/exercises"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          Manage library
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {entries.length === 0 && (
          <div className="surface-soft rounded-2xl border border-border p-10 text-center text-sm text-muted-foreground">
            No exercises assigned to this workout yet.
          </div>
        )}

        {entries.map((entry) => (
          <section
            key={entry.id}
            className="surface-soft overflow-hidden rounded-2xl border border-border"
          >
            <div className="flex gap-4 p-4">
              {entry.exercises.gif_url ? (
                <img
                  src={entry.exercises.gif_url}
                  alt={`${entry.exercises.name} demonstration`}
                  loading="lazy"
                  className="size-24 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex size-24 shrink-0 items-center justify-center rounded-xl bg-muted text-center text-xs text-muted-foreground">
                  No demo
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-display text-lg font-semibold">
                      {entry.exercises.name}
                    </h2>
                    {entry.exercises.muscle_group && (
                      <p className="text-sm text-muted-foreground">
                        {entry.exercises.muscle_group}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove exercise from workout"
                    onClick={() => removeExercise.mutate(entry.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div className="mt-3 space-y-2">
                  {entry.exercise_sets.length > 0 && (
                    <div className="grid grid-cols-[2rem_1fr_1fr_2.25rem] items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                      <span>Set</span>
                      <Label className="text-xs">Reps</Label>
                      <Label className="text-xs">Weight</Label>
                      <span />
                    </div>
                  )}
                  {entry.exercise_sets.map((set) => (
                    <div
                      key={set.id}
                      className="grid grid-cols-[2rem_1fr_1fr_2.25rem] items-center gap-2"
                    >
                      <span className="text-sm font-medium">{set.set_number}</span>
                      <Input
                        type="number"
                        min={0}
                        defaultValue={set.reps}
                        aria-label="Reps"
                        onBlur={(e) =>
                          updateSet.mutate({
                            id: set.id,
                            field: "reps",
                            value: Number(e.target.value) || 0,
                          })
                        }
                      />
                      <Input
                        type="number"
                        min={0}
                        step="0.5"
                        defaultValue={set.weight}
                        aria-label="Weight"
                        onBlur={(e) =>
                          updateSet.mutate({
                            id: set.id,
                            field: "weight",
                            value: Number(e.target.value) || 0,
                          })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete set"
                        onClick={() => removeSet.mutate(set.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      addSet.mutate({
                        id: entry.id,
                        next: entry.exercise_sets.length + 1,
                      })
                    }
                  >
                    <Plus className="size-4" /> Add set
                  </Button>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
