import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ImagePlus, Plus, Trash2 } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { GifPicker } from "@/components/GifPicker";
import { supabase } from "@/integrations/supabase/client";
import { exercisesQuery, type Exercise } from "@/lib/workout-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const GROUP_ORDER = [
  "Chest",
  "Back & Posterior Neck",
  "Arms (Biceps & Triceps)",
  "Shoulders & Lateral Neck",
  "Quads & Calves",
  "Glutes & Hamstrings",
];

function groupExercises(exercises: Exercise[]) {
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
    const ia = GROUP_ORDER.indexOf(a);
    const ib = GROUP_ORDER.indexOf(b);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    return a.localeCompare(b);
  });
}

export const Route = createFileRoute("/exercises")({
  head: () => ({
    meta: [
      { title: "Exercise Library — Lift Log" },
      {
        name: "description",
        content:
          "Your personal exercise library with muscle groups and demo GIFs showing correct form.",
      },
      { property: "og:title", content: "Exercise Library — Lift Log" },
      {
        property: "og:description",
        content: "Exercises with muscle groups and demo GIFs showing correct form.",
      },
    ],
  }),
  component: ExercisesPage,
});

function ExercisesPage() {
  const qc = useQueryClient();
  const { data: exercises = [], isLoading } = useQuery(exercisesQuery);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [muscle, setMuscle] = useState("");
  const [gifUrl, setGifUrl] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("exercises").insert({
        name: name.trim(),
        muscle_group: muscle.trim() || null,
        gif_url: gifUrl || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exercises"] });
      setOpen(false);
      setName("");
      setMuscle("");
      setGifUrl("");
    },
  });

  const setGif = useMutation({
    mutationFn: async ({ id, url }: { id: string; url: string }) => {
      const { error } = await supabase
        .from("exercises")
        .update({ gif_url: url })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exercises").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises"] }),
  });

  const target = exercises.find((e) => e.id === pickerTarget);

  return (
    <AppShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Exercises</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your movement library, with form demos.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> New exercise
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add an exercise</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ex-name">Name</Label>
                <Input
                  id="ex-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bulgarian split squat"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ex-muscle">Muscle group</Label>
                <Input
                  id="ex-muscle"
                  value={muscle}
                  onChange={(e) => setMuscle(e.target.value)}
                  placeholder="Legs"
                />
              </div>
              <div className="space-y-2">
                <Label>Demo GIF</Label>
                {gifUrl ? (
                  <img
                    src={gifUrl}
                    alt="Selected demo"
                    className="h-32 w-full rounded-xl object-cover"
                  />
                ) : null}
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setPickerTarget(null);
                    setPickerOpen(true);
                  }}
                >
                  <ImagePlus className="size-4" />
                  {gifUrl ? "Change GIF" : "Search for a GIF"}
                </Button>
              </div>
              <Button
                className="w-full"
                disabled={!name.trim() || create.isPending}
                onClick={() => create.mutate()}
              >
                Save exercise
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {exercises.map((ex) => (
          <article
            key={ex.id}
            className="surface-soft overflow-hidden rounded-2xl border border-border"
          >
            {ex.gif_url ? (
              <img
                src={ex.gif_url}
                alt={`${ex.name} demonstration`}
                loading="lazy"
                className="h-40 w-full object-cover"
              />
            ) : (
              <div className="flex h-40 items-center justify-center bg-muted text-sm text-muted-foreground">
                No demo yet
              </div>
            )}
            <div className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <h2 className="truncate font-display text-lg font-semibold">{ex.name}</h2>
                {ex.muscle_group && (
                  <p className="text-sm text-muted-foreground">{ex.muscle_group}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Pick demo GIF"
                  onClick={() => {
                    setPickerTarget(ex.id);
                    setPickerOpen(true);
                  }}
                >
                  <ImagePlus className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete exercise"
                  onClick={() => remove.mutate(ex.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <GifPicker
        key={`${pickerTarget ?? "new"}-${pickerOpen}`}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        initialQuery={pickerTarget ? (target?.name ?? "") : name}
        onSelect={(url) => {
          if (pickerTarget) setGif.mutate({ id: pickerTarget, url });
          else setGifUrl(url);
        }}
      />
    </AppShell>
  );
}
