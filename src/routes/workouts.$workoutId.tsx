import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Pencil,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Timer,
  Trash2,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import {
  exercisesQuery,
  groupExercisesByMuscleGroup,
  workoutDetailQuery,
  type LastPerformance,
  type WeightDirection,
} from "@/lib/workout-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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

function formatDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const DIRECTION_EMOJI: Record<WeightDirection, string> = {
  up: "⬆️",
  same: "➡️",
  down: "⬇️",
};

function LastTime({ last }: { last?: LastPerformance }) {
  if (!last) {
    return (
      <p className="mt-1 text-xs text-muted-foreground">First time logging this one.</p>
    );
  }
  return (
    <p className="mt-1 text-xs text-muted-foreground">
      Last time ({formatDate(last.date)}):{" "}
      {last.sets.map((s) => `${s.reps}×${s.weight}`).join(" · ")}
      <span className="ml-2" aria-label={`Weight direction: ${last.weightDirection}`}>
        {DIRECTION_EMOJI[last.weightDirection]} 🏋️
      </span>
    </p>
  );
}

const REST_SECONDS = 90;

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function RestTimer() {
  const [secondsLeft, setSecondsLeft] = useState(REST_SECONDS);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (secondsLeft <= 0) {
      setRunning(false);
      setFinished(true);
      return;
    }
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setRunning(false);
          setFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, secondsLeft]);

  const start = () => {
    setFinished(false);
    setRunning(true);
  };
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setFinished(false);
    setSecondsLeft(REST_SECONDS);
  };

  return (
    <div
      className={cn(
        "fixed top-20 right-4 z-50 flex max-w-[16rem] items-center gap-3 rounded-2xl border p-3 shadow-lg backdrop-blur transition-colors",
        finished
          ? "border-success bg-success-soft/95"
          : "surface-soft border-border bg-background/95",
      )}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <Timer className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "font-display text-2xl font-semibold tabular-nums leading-none",
              finished ? "text-success" : "text-foreground",
            )}
          >
            {formatTime(secondsLeft)}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Rest
          </span>
        </div>
        {finished && (
          <p className="mt-1 text-xs font-medium text-success">Time's up — next set.</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {!running ? (
          <Button size="icon" className="size-8" onClick={start} aria-label="Start timer">
            <Play className="size-4" />
          </Button>
        ) : (
          <Button size="icon" className="size-8" variant="secondary" onClick={pause} aria-label="Pause timer">
            <Pause className="size-4" />
          </Button>
        )}
        <Button size="icon" className="size-8" variant="outline" onClick={reset} aria-label="Reset timer">
          <RotateCcw className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function WorkoutDetail() {
  const { workoutId } = Route.useParams();
  const qc = useQueryClient();
  const detail = workoutDetailQuery(workoutId);
  const { data, isLoading } = useQuery(detail);
  const { data: exercises = [] } = useQuery(exercisesQuery);
  const [picked, setPicked] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  const workout = data?.workout;

  useEffect(() => {
    if (workout) {
      setTitle(workout.title);
      setDate(workout.date);
      setNotes(workout.notes ?? "");
    }
  }, [workout?.id, workout?.title, workout?.date, workout?.notes]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: detail.queryKey });
    qc.invalidateQueries({ queryKey: ["workouts"] });
  };

  const saveWorkout = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("workouts")
        .update({
          title: title.trim() || "Workout",
          date,
          notes: notes.trim() || null,
        })
        .eq("id", workoutId);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditOpen(false);
      invalidate();
    },
  });

  const toggleEntrySuccess = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase
        .from("workout_exercises")
        .update({ success: value })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

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

  if (!workout) {
    return (
      <AppShell>
        <h1 className="text-2xl font-semibold">Workout not found</h1>
        <Link to="/" className="mt-4 inline-block text-sm text-primary underline">
          Back to workouts
        </Link>
      </AppShell>
    );
  }

  const entries = data.entries;
  const lastByExercise = data.lastByExercise;
  const used = new Set(entries.map((e) => e.exercise_id));

  return (
    <AppShell>
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All workouts
      </Link>

      <RestTimer />

      <header className="surface-soft rounded-2xl border border-border p-5 transition-colors">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">{workout.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDate(workout.date)}
            </p>
            {workout.notes && <p className="mt-3 text-sm">{workout.notes}</p>}
          </div>

          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm">
                <Pencil className="size-4" /> Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit workout</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Name</Label>
                  <Input
                    id="edit-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => saveWorkout.mutate()}
                  disabled={saveWorkout.isPending}
                >
                  Save changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

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
            className={cn(
              "overflow-hidden rounded-2xl border transition-colors",
              entry.success
                ? "border-success bg-success-soft"
                : "surface-soft border-border",
            )}
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
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-lg font-semibold">
                        {entry.exercises.name}
                      </h2>
                      {entry.success && (
                        <TrendingUp className="size-5 text-success" />
                      )}
                    </div>
                    {entry.exercises.muscle_group && (
                      <p className="text-sm text-muted-foreground">
                        {entry.exercises.muscle_group}
                      </p>
                    )}
                    <LastTime last={lastByExercise.get(entry.exercise_id)} />
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
                  <div className="flex flex-wrap items-center gap-4">
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
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        checked={entry.success}
                        onCheckedChange={(v) =>
                          toggleEntrySuccess.mutate({
                            id: entry.id,
                            value: v === true,
                          })
                        }
                      />
                      Increase weights next time
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
