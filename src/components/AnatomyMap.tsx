import type { WorkedMuscle } from "@/lib/exercise-muscles";

type Shape =
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { kind: "poly"; points: string };

type Region = { id: string; shape: Shape };

// Left-side shapes on a 100x200 figure; each is mirrored for the right side.
const FRONT: Region[] = [
  { id: "traps", shape: { kind: "poly", points: "44,25 50,27 50,31 37,33" } },
  { id: "front-delt", shape: { kind: "ellipse", cx: 32, cy: 38, rx: 5, ry: 6.5 } },
  { id: "side-delt", shape: { kind: "ellipse", cx: 26.5, cy: 40, rx: 3, ry: 6 } },
  { id: "chest-upper", shape: { kind: "poly", points: "37,34 49.5,34 49.5,42 35,42" } },
  { id: "chest-lower", shape: { kind: "poly", points: "35,42.5 49.5,42.5 49.5,50 38,51" } },
  { id: "biceps", shape: { kind: "ellipse", cx: 27, cy: 56, rx: 4.5, ry: 9 } },
  { id: "forearms", shape: { kind: "ellipse", cx: 24, cy: 77, rx: 3.8, ry: 11 } },
  { id: "core", shape: { kind: "poly", points: "39,53 49.5,53 49.5,88 42,86 39,75" } },
  { id: "quads", shape: { kind: "ellipse", cx: 41.5, cy: 120, rx: 7, ry: 19 } },
  { id: "inner-thighs", shape: { kind: "ellipse", cx: 48, cy: 108, rx: 2.2, ry: 10 } },
  { id: "calves", shape: { kind: "ellipse", cx: 42, cy: 165, rx: 4.5, ry: 14 } },
];

const BACK: Region[] = [
  { id: "traps", shape: { kind: "poly", points: "44,25 50,26 50,40 36,33" } },
  { id: "rear-delt", shape: { kind: "ellipse", cx: 32, cy: 38, rx: 5, ry: 6.5 } },
  { id: "side-delt", shape: { kind: "ellipse", cx: 26.5, cy: 40, rx: 3, ry: 6 } },
  { id: "mid-back", shape: { kind: "poly", points: "38,36 50,41 50,55 41,52" } },
  { id: "lats", shape: { kind: "poly", points: "36,43 40.5,53 46,66 39,64 35,52" } },
  { id: "triceps", shape: { kind: "ellipse", cx: 27, cy: 56, rx: 4.5, ry: 9 } },
  { id: "forearms", shape: { kind: "ellipse", cx: 24, cy: 77, rx: 3.8, ry: 11 } },
  { id: "lower-back", shape: { kind: "poly", points: "44,58 50,57 50,82 44,82" } },
  { id: "side-glutes", shape: { kind: "ellipse", cx: 35.5, cy: 91, rx: 3, ry: 6 } },
  { id: "glutes", shape: { kind: "ellipse", cx: 43, cy: 95, rx: 7.5, ry: 9 } },
  { id: "hamstrings", shape: { kind: "ellipse", cx: 42, cy: 124, rx: 7, ry: 18 } },
  { id: "calves", shape: { kind: "ellipse", cx: 42, cy: 162, rx: 5, ry: 13 } },
];

// Muscle summary key -> figure regions it lights up.
const KEY_REGIONS: Record<string, string[]> = {
  chest: ["chest-upper", "chest-lower"],
  "upper chest": ["chest-upper"],
  "lower chest": ["chest-lower"],
  "front shoulders": ["front-delt"],
  "side shoulders": ["side-delt"],
  "rear shoulders": ["rear-delt"],
  "shoulder stabilizers": ["rear-delt"],
  "upper traps": ["traps"],
  "mid-back": ["mid-back"],
  lats: ["lats"],
  biceps: ["biceps"],
  brachialis: ["biceps"],
  brachioradialis: ["forearms"],
  triceps: ["triceps"],
  forearms: ["forearms"],
  core: ["core"],
  quads: ["quads"],
  "inner thighs": ["inner-thighs"],
  calves: ["calves"],
  glutes: ["glutes"],
  "side glutes": ["side-glutes"],
  hamstrings: ["hamstrings"],
  "lower-back stabilizers": ["lower-back"],
};

function regionLevels(muscles: WorkedMuscle[]) {
  const levels = new Map<string, "primary" | "supporting">();
  for (const m of muscles) {
    for (const id of KEY_REGIONS[m.key] ?? []) {
      if (m.primary) levels.set(id, "primary");
      else if (!levels.has(id)) levels.set(id, "supporting");
    }
  }
  return levels;
}

function ShapeEl({ shape, className }: { shape: Shape; className: string }) {
  return shape.kind === "ellipse" ? (
    <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} className={className} />
  ) : (
    <polygon points={shape.points} className={className} />
  );
}

function Figure({ regions, levels, label }: { regions: Region[]; levels: Map<string, string>; label: string }) {
  const side = (mirror: boolean) => (
    <g transform={mirror ? "translate(100 0) scale(-1 1)" : undefined}>
      {/* neutral body */}
      <ellipse cx={24} cy={93} rx={3} ry={4} className="fill-muted" />
      <polygon points="35,82 50,84 50,100 34,98" className="fill-muted" />
      <ellipse cx={43} cy={190} rx={5} ry={3} className="fill-muted" />
      {regions.map((r) => {
        const level = levels.get(r.id);
        return (
          <ShapeEl
            key={r.id}
            shape={r.shape}
            className={
              level === "primary"
                ? "fill-primary stroke-background"
                : level === "supporting"
                  ? "fill-primary/35 stroke-background"
                  : "fill-muted stroke-background"
            }
          />
        );
      })}
    </g>
  );
  return (
    <figure className="flex flex-col items-center">
      <svg viewBox="0 0 100 200" className="h-56 w-auto" role="img" aria-label={`${label} view of muscles worked`}>
        <circle cx={50} cy={13} r={9} className="fill-muted" />
        <rect x={46} y={20} width={8} height={7} className="fill-muted" />
        <g strokeWidth={0.8}>
          {side(false)}
          {side(true)}
        </g>
      </svg>
      <figcaption className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</figcaption>
    </figure>
  );
}

export function AnatomyMap({ muscles }: { muscles: WorkedMuscle[] }) {
  const levels = regionLevels(muscles);
  return (
    <div className="flex items-end justify-center gap-2">
      <Figure regions={FRONT} levels={levels} label="Front" />
      <Figure regions={BACK} levels={levels} label="Back" />
    </div>
  );
}
