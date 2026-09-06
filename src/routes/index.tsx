import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarDays, CheckCircle2, Plus, Trash2 } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { workoutsQuery } from "@/lib/workout-queries";
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

function WorkoutsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: workouts = [], isLoading } = useQuery(workoutsQuery);
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

      <ul className="space-y-3">
        {workouts.map((w) => (
          <li
            key={w.id}
            className={
              w.success
                ? "group flex items-center gap-4 rounded-2xl border border-success bg-success-soft p-4"
                : "surface-soft group flex items-center gap-4 rounded-2xl border border-border p-4"
            }
          >
            <span
              className={
                w.success
                  ? "flex size-11 shrink-0 items-center justify-center rounded-xl bg-success text-success-foreground"
                  : "flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground"
              }
            >
              {w.success ? (
                <CheckCircle2 className="size-5" />
              ) : (
                <CalendarDays className="size-5" />
              )}
            </span>
            <Link
              to="/workouts/$workoutId"
              params={{ workoutId: w.id }}
              className="min-w-0 flex-1"
            >
              <p className="truncate font-display text-lg font-semibold">{w.title}</p>
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
    </AppShell>
  );
}
