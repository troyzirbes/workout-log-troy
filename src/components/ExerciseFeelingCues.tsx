import { CircleCheck, TriangleAlert } from "lucide-react";
import { getExerciseFeelingCues } from "@/lib/exercise-feeling-cues";

export function ExerciseFeelingCues({ name }: { name: string }) {
  const cues = getExerciseFeelingCues(name);
  return (
    <aside aria-label={`Feeling cues for ${name}`} className="min-w-0 border-t border-border pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Form & feeling</h3>
      <dl className="space-y-3 text-xs leading-relaxed">
        <div>
          <dt className="mb-1 flex items-center gap-1.5 font-semibold text-success"><CircleCheck className="size-3.5 shrink-0" /> Where to feel it</dt>
          <dd>{cues.should}</dd>
        </div>
        <div>
          <dt className="mb-1 flex items-center gap-1.5 font-semibold text-destructive"><TriangleAlert className="size-3.5 shrink-0" /> Where not to feel it</dt>
          <dd>{cues.shouldNot}</dd>
        </div>
        <div>
          <dt className="mb-1 font-semibold">Quick check</dt>
          <dd className="text-muted-foreground">{cues.check}</dd>
        </div>
      </dl>
    </aside>
  );
}
