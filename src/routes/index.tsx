import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarDays, CalendarPlus, CheckCircle2, ClipboardCopy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatWeeklySummary, type SummaryWorkout } from "@/lib/weekly-summary";
import { isWorkoutComplete } from "@/lib/workout-completion";
import { nextWeekDate } from "@/lib/workout-template";

import { AppShell } from "@/components/AppShell";
import { AnatomyHeatMap } from "@/components/AnatomyMap";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lift Log — My Workout Journal" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      {
        name: "description",
        content:
          "Log every training session: date, exercises, sets, reps and weights, with demo GIFs.",
      },
      { property: "og:title", content: "Lift Log — My Workout Journal" },
      {
        property: "og:description",
        content: "Log every training session with sets, reps, weights and demo GIFs.",
      },
    ],
  }),
  component: WorkoutsPage,
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

type ListWorkout = {
  id: string;
  title: string;
  date: string;
  workout_exercises: {
    completed: boolean;
    exercises: { name: string } | null;
  }[];
};

const workoutListQuery = {
  queryKey: ["workouts", "with-exercises"],
  queryFn: async (): Promise<ListWorkout[]> => {
    const { data, error } = await supabase
      .from("workouts")
      .select("id, title, date, workout_exercises(completed, exercises(name))")
      .order("date", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as ListWorkout[];
  },
};

// Sunday that starts the week containing an ISO date (YYYY-MM-DD).
function weekStart(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - dt.getDay());
  return dt;
}

function weekLabel(start: Date) {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const f = (x: Date) => x.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${f(start)} – ${f(end)}, ${end.getFullYear()}`;
}

function groupByWeek(list: ListWorkout[]) {
  const map = new Map<number, { start: Date; workouts: ListWorkout[] }>();
  for (const w of list) {
    const start = weekStart(w.date);
    const k = start.getTime();
    if (!map.has(k)) map.set(k, { start, workouts: [] });
    map.get(k)!.workouts.push(w);
  }
  return [...map.values()].sort((a, b) => b.start.getTime() - a.start.getTime());
}

async function copyWeekSummary(start: Date, ids: string[]) {
  if (ids.length === 0) {
    toast("No workouts logged this week to copy.");
    return;
  }
  try {
    const { data, error } = await supabase
      .from("workouts")
      .select("date, title, workout_exercises(position, exercises(name), exercise_sets(set_number, reps, weight))")
      .in("id", ids);
    if (error) throw error;
    type Row = {
      date: string;
      title: string;
      workout_exercises: {
        position: number;
        exercises: { name: string } | null;
        exercise_sets: { set_number: number; reps: number; weight: number }[];
      }[];
    };
    const workouts: SummaryWorkout[] = ((data ?? []) as unknown as Row[]).map((w) => ({
      date: w.date,
      title: w.title,
      exercises: w.workout_exercises.map((e) => ({
        name: e.exercises?.name ?? "Exercise",
        position: e.position,
        sets: e.exercise_sets ?? [],
      })),
    }));
    await navigator.clipboard.writeText(formatWeeklySummary(start, workouts));
    toast.success("Weekly summary copied to clipboard!");
  } catch {
    toast.error("Couldn't copy the weekly summary. Please try again.");
  }
}

type TemplateWorkout = {
  date: string;
  title: string;
  notes: string | null;
  workout_exercises: {
    exercise_id: string;
    position: number;
    weight_direction: "up" | "same" | "down";
    exercise_sets: { set_number: number; reps: number; weight: number }[];
  }[];
};

async function copyWeekToNextWeek(ids: string[]) {
  if (ids.length === 0) throw new Error("No workouts to copy");
  const { data, error } = await supabase
    .from("workouts")
    .select("date, title, notes, workout_exercises(exercise_id, position, weight_direction, exercise_sets(set_number, reps, weight))")
    .in("id", ids)
    .order("date", { ascending: true });
  if (error) throw error;

  const createdWorkoutIds: string[] = [];
  try {
    for (const source of (data ?? []) as unknown as TemplateWorkout[]) {
      const { data: savedWorkout, error: workoutError } = await supabase
        .from("workouts")
        .insert({
          date: nextWeekDate(source.date),
          title: source.title,
          notes: source.notes,
        })
        .select("id")
        .single();
      if (workoutError) throw workoutError;
      createdWorkoutIds.push(savedWorkout.id);

      const sourceEntries = [...source.workout_exercises].sort((a, b) => a.position - b.position);
      for (const entry of sourceEntries) {
        const { data: savedEntry, error: entryError } = await supabase
          .from("workout_exercises")
          .insert({
            workout_id: savedWorkout.id,
            exercise_id: entry.exercise_id,
            position: entry.position,
            weight_direction: entry.weight_direction,
            success: false,
            completed: false,
          })
          .select("id")
          .single();
        if (entryError) throw entryError;
        if (entry.exercise_sets.length > 0) {
          const { error: setsError } = await supabase.from("exercise_sets").insert(
            entry.exercise_sets.map((set) => ({
              workout_exercise_id: savedEntry.id,
              set_number: set.set_number,
              reps: set.reps,
              weight: set.weight,
            })),
          );
          if (setsError) throw setsError;
        }
      }
    }
    return createdWorkoutIds.length;
  } catch (error) {
    if (createdWorkoutIds.length > 0) {
      await supabase.from("workouts").delete().in("id", createdWorkoutIds);
    }
    throw error;
  }
}

function WorkoutsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: workouts = [], isLoading } = useQuery(workoutListQuery);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("workouts")
        .insert({ title: title.trim() || "Workout", date, notes: notes.trim() || null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["workouts"] });
      setOpen(false);
      setTitle("");
      setNotes("");
      navigate({ to: "/workouts/$workoutId", params: { workoutId: data.id } });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workouts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workouts"] }),
  });

  const templateNextWeek = useMutation({
    mutationFn: copyWeekToNextWeek,
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["workouts"] });
      toast.success(`${count} workout${count === 1 ? "" : "s"} copied to next week.`);
    },
    onError: () => toast.error("Couldn't copy the full week. Please try again."),
  });

  return (
    <AppShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Workouts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {workouts.length} session{workouts.length === 1 ? "" : "s"} logged
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
        {workouts.length > 0 && (
          <Button
            variant="outline"
            disabled={templateNextWeek.isPending}
            onClick={() => {
              const latest = groupByWeek(workouts)[0];
              if (latest) templateNextWeek.mutate(latest.workouts.map((w) => w.id));
            }}
          >
            <CalendarPlus className="size-4" />
            {templateNextWeek.isPending ? "Copying…" : "Template next week"}
          </Button>
        )}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> New workout
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log a workout</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  placeholder="Push day, Leg day…"
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  placeholder="How did it feel?"
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => create.mutate()}
                disabled={create.isPending}
              >
                Create workout
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!isLoading && workouts.length === 0 && (
        <div className="surface-soft rounded-2xl border border-border p-10 text-center">
          <h2 className="text-lg font-semibold">No workouts yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Start by logging today's session.
          </p>
        </div>
      )}

      <div className="space-y-8">
        {groupByWeek(workouts).map((week) => {
          const names = week.workouts.flatMap((w) =>
            w.workout_exercises.map((e) => e.exercises?.name).filter((n): n is string => !!n),
          );
          return (
            <section key={week.start.getTime()} className="surface-soft rounded-2xl border border-border p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">
                Week of {weekLabel(week.start)}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {week.workouts.length} workout{week.workouts.length === 1 ? "" : "s"} · {names.length} exercise
                  {names.length === 1 ? "" : "s"}
                </span>
              </h2>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyWeekSummary(week.start, week.workouts.map((w) => w.id))}
                  >
                    <ClipboardCopy className="size-4" /> Copy Weekly Summary for Coach
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <ul className="min-w-0 flex-1 space-y-3">
                  {week.workouts.map((w) => (
                    <li
                      key={w.id}
                      className="group flex items-center gap-4 rounded-xl border border-border bg-background/60 p-3"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                        <CalendarDays className="size-5" />
                      </span>
                      <Link to="/workouts/$workoutId" params={{ workoutId: w.id }} className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-display text-base font-semibold">{w.title}</p>
                          {isWorkoutComplete(w.workout_exercises) && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success">
                              <CheckCircle2 className="size-3.5" /> Done
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{formatDate(w.date)}</p>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete workout"
                        onClick={() => remove.mutate(w.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
                <div className="shrink-0">
                  <AnatomyHeatMap exerciseNames={names} />
                  <div className="mt-1 flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                    <span>Less</span>
                    <span className="h-2 w-16 rounded-full bg-gradient-to-r from-primary/15 to-primary" />
                    <span>More</span>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
