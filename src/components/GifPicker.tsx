import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, Loader2 } from "lucide-react";

import { searchExerciseGifs } from "@/lib/klipy.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function GifPicker({
  open,
  onOpenChange,
  initialQuery,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
  onSelect: (url: string) => void;
}) {
  const [term, setTerm] = useState(initialQuery ?? "");
  const [submitted, setSubmitted] = useState(initialQuery ?? "");
  const search = useServerFn(searchExerciseGifs);

  const { data, isFetching, error } = useQuery({
    queryKey: ["klipy", submitted],
    queryFn: () => search({ data: { query: submitted, page: 1 } }),
    enabled: open,
    staleTime: 1000 * 60 * 10,
    retry: false,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Find a demo GIF</DialogTitle>
          <DialogDescription>
            Search for a short clip that shows how the movement is done.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(term);
          }}
        >
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="e.g. squat, deadlift, push up"
          />
          <Button type="submit" size="icon" aria-label="Search GIFs">
            <Search className="size-4" />
          </Button>
        </form>

        <div className="max-h-[52vh] overflow-y-auto rounded-xl bg-muted/50 p-2">
          {isFetching && (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Searching…
            </div>
          )}
          {error && !isFetching && (
            <p className="py-10 text-center text-sm text-destructive">
              Couldn't load GIFs right now.
            </p>
          )}
          {!isFetching && !error && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(data ?? []).map((gif) => (
                <button
                  key={gif.id}
                  type="button"
                  onClick={() => {
                    onSelect(gif.url);
                    onOpenChange(false);
                  }}
                  className="group overflow-hidden rounded-lg border border-border bg-card transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <img
                    src={gif.url}
                    alt={gif.title}
                    loading="lazy"
                    className="h-28 w-full object-cover"
                  />
                </button>
              ))}
              {(data ?? []).length === 0 && (
                <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
                  No results — try another word.
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
