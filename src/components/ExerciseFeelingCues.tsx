import { CircleCheck, TriangleAlert } from "lucide-react";
import { getExerciseFeelingCues } from "@/lib/exercise-feeling-cues";

export function ExerciseFeelingCues({ name }: { name: string }) {
  const cues = getExerciseFeelingCues(name);
  const stairs = name.replace(/[✪➭]/g, "").trim().toLowerCase() === "stair climber";
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
        <div>
          <dt className="mb-1 font-semibold">{stairs ? "Pace check" : "Weight check"}</dt>
          <dd className="text-muted-foreground">{stairs ? "Keep a pace that lets you stay upright and breathe steadily; slow down if posture slips." : "Last reps can feel challenging, but stay controlled. If you swing, shorten your range, or lose posture, lower the weight."}</dd>
        </div>
      </dl>
      <p className="mt-3 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">Feeling alone can't confirm form. Muscle effort or a mild burn can be normal; pain isn't the goal. Stop for sharp pain, numbness, tingling, chest pain, or dizziness. Seek urgent care for chest pain or severe symptoms; get persistent pain assessed.</p>
    </aside>
  );
}