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
};

export function getExerciseMuscles(name: string): MuscleTargets | undefined {
  return EXERCISE_MUSCLES[name.trim().toLowerCase()];
}