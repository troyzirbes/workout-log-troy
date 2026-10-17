export type MuscleTargets = {
  primary: string[];
  supporting: string[];
};

// Typical recruitment for standard form; emphasis varies with technique.
const EXERCISE_MUSCLES: Record<string, MuscleTargets> = {
  "incline dumbbell press": { primary: ["Upper chest"], supporting: ["Front shoulders", "Triceps"] },
  "flat dumbbell flyes": { primary: ["Chest (middle fibers)"], supporting: ["Front shoulders"] },
  "decline dumbbell press": { primary: ["Lower chest"], supporting: ["Triceps", "Front shoulders"] },
  "single-arm dumbbell row": { primary: ["Lats (sides of back)"], supporting: ["Mid-back (rhomboids & traps)", "Biceps", "Rear shoulders"] },
  "chest-supported incline row": { primary: ["Mid-back (rhomboids & traps)"], supporting: ["Lats", "Rear shoulders", "Biceps"] },
  "dumbbell shrugs": { primary: ["Upper traps (neck & shoulders)"], supporting: ["Forearms (grip)"] },
  "incline dumbbell curls": { primary: ["Biceps"], supporting: ["Brachialis (under biceps)", "Forearms"] },
"hammer curls": { primary: ["Brachialis (under biceps)", "Brachioradialis (outer forearm)"], supporting: ["Biceps"] },
  "hammer curls to shoulder press": { primary: ["Brachialis (under biceps)", "Front shoulders"], supporting: ["Biceps", "Brachioradialis (outer forearm)", "Side shoulders", "Triceps"] },
  "flyes to bench press": { primary: ["Chest"], supporting: ["Front shoulders", "Triceps"] },
  "single-arm preacher curl": { primary: ["Biceps (short-head emphasis)"], supporting: ["Brachialis (under biceps)", "Forearms"] },
  "overhead triceps extension": { primary: ["Triceps (long-head emphasis)"], supporting: [] },
  "dumbbell skullcrushers": { primary: ["Triceps"], supporting: [] },
  "seated overhead press": { primary: ["Front shoulders", "Side shoulders"], supporting: ["Triceps", "Upper traps"] },
  "dumbbell lateral raises": { primary: ["Side shoulders (lateral delts)"], supporting: ["Upper traps"] },
  "dumbbell rear delt flyes": { primary: ["Rear shoulders (rear delts)"], supporting: ["Rhomboids", "Mid traps"] },
  "dumbbell farmers carry": { primary: ["Forearms (grip)", "Upper traps"], supporting: ["Core (abs & obliques)", "Shoulder stabilizers"] },
  "dumbbell goblet squats": { primary: ["Quads (front thighs)"], supporting: ["Glutes", "Inner thighs (adductors)", "Core"] },
  "dumbbell step-ups": { primary: ["Quads (front thighs)", "Glutes"], supporting: ["Side glutes (hip stabilizers)", "Hamstrings"] },
  "standing calf raises": { primary: ["Gastrocnemius (upper calf)"], supporting: ["Soleus (deeper calf)"] },
  "dumbbell romanian deadlifts": { primary: ["Hamstrings (back thighs)", "Glutes"], supporting: ["Lower-back stabilizers", "Forearms (grip)"] },
  "bulgarian split squats": { primary: ["Quads (front thighs)", "Glutes"], supporting: ["Inner thighs (adductors)", "Side glutes (hip stabilizers)"] },
"dumbbell hip thrusts": { primary: ["Gluteus maximus (main glutes)"], supporting: ["Hamstrings", "Inner thighs (adductors)"] },
  // Compound exercises
  "arnold press": { primary: ["Front shoulders", "Side shoulders"], supporting: ["Triceps", "Upper traps"] },
  "dumbbell push press": { primary: ["Front shoulders", "Side shoulders"], supporting: ["Triceps", "Quads (drive)", "Core (abs & obliques)"] },
  "dumbbell clean and press": { primary: ["Front shoulders", "Triceps"], supporting: ["Upper traps", "Glutes", "Hamstrings", "Quads (front thighs)"] },
  "dumbbell upright row": { primary: ["Side shoulders (lateral delts)", "Upper traps (neck & shoulders)"], supporting: ["Biceps", "Rear shoulders"] },
  "turkish get-up": { primary: ["Front shoulders", "Core (abs & obliques)"], supporting: ["Triceps", "Glutes", "Shoulder stabilizers"] },
  "dumbbell thrusters": { primary: ["Quads (front thighs)", "Front shoulders"], supporting: ["Glutes", "Triceps", "Core (abs & obliques)"] },
  "dumbbell front squat": { primary: ["Quads (front thighs)"], supporting: ["Glutes", "Core (abs & obliques)", "Upper traps"] },
  "dumbbell snatch": { primary: ["Glutes", "Hamstrings (back thighs)", "Front shoulders"], supporting: ["Quads (front thighs)", "Upper traps", "Triceps", "Core (abs & obliques)"] },
  "renegade rows": { primary: ["Lats (sides of back)", "Mid-back (rhomboids & traps)"], supporting: ["Core (abs & obliques)", "Triceps", "Rear shoulders"] },
};

export function getExerciseMuscles(name: string): MuscleTargets | undefined {
  // "✪ " marks compound exercises; the lookup is keyed by the plain name.
  return EXERCISE_MUSCLES[name.replace(/✪/g, "").trim().toLowerCase()];
}

// Labels that describe the same area under different names, so a workout
// summary lists each area once.
const MUSCLE_ALIASES: Record<string, string> = {
  gastrocnemius: "calves",
  soleus: "calves",
  "gluteus maximus": "glutes",
  rhomboids: "mid-back",
  "mid traps": "mid-back",
};

// Preferred wording when several labels collapse into one area.
// Stable wording for the summary, so the same area reads the same everywhere.
const MUSCLE_DISPLAY: Record<string, string> = {
  calves: "Calves",
  glutes: "Glutes",
  "mid-back": "Mid-back",
  "upper traps": "Upper traps",
  lats: "Lats",
  forearms: "Forearms",
  quads: "Quads",
  hamstrings: "Hamstrings",
  chest: "Chest",
  triceps: "Triceps",
  biceps: "Biceps",
  "front shoulders": "Front shoulders",
  "side shoulders": "Side shoulders",
  "rear shoulders": "Rear shoulders",
  "inner thighs": "Inner thighs",
  "side glutes": "Side glutes",
  core: "Core",
  "lower-back stabilizers": "Lower back",
  "shoulder stabilizers": "Shoulder stabilizers",
};

// "Quads (front thighs)" and "Quads" describe the same area.
function muscleKey(label: string) {
  const base = label.replace(/\s*\(.*?\)\s*/g, "").trim().toLowerCase();
  return MUSCLE_ALIASES[base] ?? base;
}

export type WorkedMuscle = {
  label: string;
  primary: boolean;
};

// Areas a set of exercises covers, each listed once, primaries first.
export function musclesWorked(names: string[]): WorkedMuscle[] {
  const seen = new Map<string, WorkedMuscle>();

  const add = (label: string, isPrimary: boolean) => {
    const key = muscleKey(label);
    if (!key) return;
    const existing = seen.get(key);
    if (existing) {
      existing.primary = existing.primary || isPrimary;
      return;
    }
    seen.set(key, { label: MUSCLE_DISPLAY[key] ?? label.trim(), primary: isPrimary });
  };

  const targets = names.map((name) => getExerciseMuscles(name));
  for (const targets_ of targets) targets_?.primary.forEach((label) => add(label, true));
  for (const targets_ of targets) targets_?.supporting.forEach((label) => add(label, false));

  return [...seen.values()];
}
