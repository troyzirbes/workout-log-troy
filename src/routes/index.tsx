import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarDays, Plus, Trash2 } from "lucide-react";

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
  workout_exercises: { exercises: { name: string } | null }[];
};

const workoutListQuery = {
  queryKey: ["workouts", "with-exercises"],
  queryFn: async (): Promise<ListWorkout[]> => {
    const { data, error } = await supabase
      .from("workouts")
      .select("id, title, date, workout_exercises(exercises(name))")
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

  return (
    <AppShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Workouts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {workouts.length} session{workouts.length === 1 ? "" : "s"} logged
          </p>
        </div>
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
              <h2 className="mb-3 font-display text-lg font-semibold">
                Week of {weekLabel(week.start)}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {week.workouts.length} workout{week.workouts.length === 1 ? "" : "s"} · {names.length} exercise
                  {names.length === 1 ? "" : "s"}
                </span>
              </h2>
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
                        <p className="truncate font-display text-base font-semibold">{w.title}</p>
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
