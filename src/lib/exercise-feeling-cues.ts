import { getExerciseMuscles } from "@/lib/exercise-muscles";

export type FeelingCues = { should: string; shouldNot: string; check: string };

// General cues for standard technique, not a diagnosis or a form assessment.
// Each tuple is expected effort, warning location/sensation, then a technique cue.
const CUES: Record<string, [string, string, string]> = {
  "incline dumbbell press": ["Upper chest, with front shoulders and triceps helping.", "Pinching at the front or top of the shoulder; wrist or elbow pain.", "Keep wrists stacked over elbows and avoid flaring elbows straight out."],
  "flat dumbbell flyes": ["Chest tension and a gentle chest stretch on the way down.", "A deep pull or pinch inside the shoulder; elbow pain.", "Keep a soft elbow bend; shorten the lowering range if shoulders strain."],
  "decline dumbbell press": ["Lower chest effort, with triceps helping.", "Shoulder pinching, wrist pain, or lower-back compression.", "Use a secure bench setup and lower slowly without bouncing."],
  "single-arm dumbbell row": ["Side of the back below the armpit; biceps and mid-back assist.", "Sharp shoulder pain or lower-back strain from twisting.", "Pull your elbow toward your hip; keep your torso steady rather than rotating."],
  "chest-supported incline row": ["Between the shoulder blades and along the sides of the back.", "Neck pinching, shoulder pain, or lower-back strain.", "Keep your chest on the bench and neck neutral; avoid shrugging the weight."],
  "dumbbell shrugs": ["Muscular effort in the upper traps above the shoulder blades; grip effort.", "Pain in the neck joints, headache, or tingling down an arm.", "Lift shoulders straight up and lower slowly; don't roll them or jut your head forward."],
  "incline dumbbell curls": ["Front of the upper arms, with a gentle biceps stretch at the bottom.", "Pain at the front of the shoulder, elbow tendon, or wrist.", "Keep upper arms still; don't force elbows behind you or swing."],
  "hammer curls": ["Front/outer upper arms and the thumb-side forearms; biceps help.", "Wrist, elbow, or shoulder pain.", "Keep a neutral grip and elbows near your sides; lower without swinging."],
  "hammer curls to shoulder press": ["Arms during the curl; front/side shoulders and triceps during the press.", "Shoulder pinching, wrist pain, or lower-back compression.", "Choose a weight you can press cleanly, not just curl; keep ribs from flaring."],
  "flyes to bench press": ["Chest during both phases; triceps assist the press.", "Deep shoulder stretching or pinching; wrist or elbow pain.", "Choose the lighter weight needed for the flye; don't lower beyond a comfortable range."],
  "single-arm preacher curl": ["Front of the upper arm, with forearms assisting.", "Pain at the front of the elbow, wrist, or shoulder.", "Keep your upper arm on the pad; avoid forcefully locking the elbow at the bottom."],
  "palms-up dumbbell wrist curl": ["The underside of your forearms just above the wrist; fingers and grip also work.", "Pain inside the wrist joint, pinching on the thumb side of the wrist, or elbow pain.", "Let the weight roll down to your fingertips, then curl it back up without swinging; use a light load and stop short of any wrist joint pain."],
  "overhead triceps extension": ["Back of the upper arms, especially a gentle stretch near the armpit.", "Elbow pain, shoulder pinching, or lower-back compression.", "Keep ribs down and elbows comfortable; reduce range or load if you must arch."],
  "dumbbell skullcrushers": ["Back of the upper arms as elbows straighten.", "Elbow tendon pain, wrist pain, or shoulder pinching.", "Lower slowly with steady upper arms; use a load you can safely control above you."],
  "seated overhead press": ["Front/side shoulders and triceps; upper traps can help overhead.", "Pinching in the shoulder, neck-joint pain, or lower-back compression.", "Keep ribs stacked over your pelvis; don't lean back to finish a rep."],
  "dumbbell lateral raises": ["Outer shoulders; some upper-trap effort is normal.", "Shoulder pinching or painful tension in the neck.", "Use light weights and a soft elbow bend; stop at a comfortable height without swinging."],
  "dumbbell rear delt flyes": ["Back of the shoulders and between the shoulder blades.", "Shoulder pinching, neck pain, or lower-back strain.", "Keep your torso supported or steady; don't jerk the weights or shrug."],
  "dumbbell farmers carry": ["Grip/forearms, upper traps, and steady abdominal bracing.", "Lower-back pain, neck-joint pain, or hand numbness/tingling.", "Walk tall with even steps; reduce load if you lean or lose your grip."],
  "dumbbell goblet squats": ["Front thighs and glutes; abs brace your torso.", "Sharp knee/hip pain or painful pressure in the lower back.", "Keep feet planted and knees tracking with toes; use a comfortable depth."],
  "dumbbell step-ups": ["Front thigh and glute of the leg on the step.", "Knee/hip joint pain or lower-back strain.", "Use a step height you can control; drive through the top foot rather than pushing off the floor."],
  "standing calf raises": ["Calf muscles, especially the upper calf.", "Sharp Achilles-tendon pain or ankle/foot joint pain.", "Rise and lower slowly without bouncing; keep ankles from rolling out."],
  "dumbbell romanian deadlifts": ["A broad hamstring stretch on the descent; glutes on standing. Back muscles brace.", "Sharp hamstring pulling, radiating pain, or lower-back pain.", "Push hips back with soft knees; stop lowering before your back rounds."],
  "bulgarian split squats": ["Front-leg quads and glutes; side glutes stabilize.", "Knee/hip joint pain or painful pulling at the rear hip/lower back.", "Use a comfortable stance and depth; keep the front foot planted and balance controlled."],
  "dumbbell hip thrusts": ["Glutes at the top, with some hamstring effort.", "Lower-back compression, hip pain, or hamstring cramping.", "Finish by squeezing glutes, not arching your back; adjust feet if hamstrings cramp."],
  "leg press machine": ["Front thighs and glutes.", "Knee/hip joint pain or pressure/pain in the lower back.", "Keep hips and back on the pad; stop before your pelvis curls up and don't snap knees straight."],
  "leg curl machine": ["Back of the thighs; calves may assist.", "Pain behind the knee, calf cramping, or lower-back pain.", "Align knees with the machine pivot and keep hips against the pad; lower slowly."],
  "leg extension machine": ["Front thigh muscles above the knee.", "Pain in or around the kneecap, rather than thigh-muscle effort.", "Align knees with the pivot; use a comfortable range without kicking or snapping straight."],
  "stair climber": ["Thighs, glutes, and calves; faster breathing at a manageable pace.", "Knee/hip joint pain, lower-back strain, dizziness, or chest pain.", "Stay upright with light rail support; lower speed if you must hang on the rails."],
  "arnold press": ["Front/side shoulders and triceps.", "Shoulder pinching during rotation; wrist pain or lower-back compression.", "Rotate only through a comfortable range; keep ribs down and use a lighter load than a standard press."],
  "dumbbell push press": ["Leg drive, then shoulders and triceps; core stays braced.", "Shoulder/knee joint pain or lower-back compression.", "Use a small controlled dip and drive; finish overhead without leaning back."],
  "dumbbell clean and press": ["Legs/glutes and upper traps during the clean; shoulders/triceps during the press.", "Wrist impact, shoulder pinching, or lower-back pain.", "Start light; guide the weights close to your body and receive them softly before pressing."],
  "dumbbell upright row": ["Side shoulders and upper traps; biceps assist.", "Pinching at the front/top of the shoulder or wrist pain.", "Keep elbows below shoulder height and use a comfortable grip; skip the movement if it pinches."],
  "turkish get-up": ["Abdominal bracing, shoulder stability, and glute/leg effort through each stage.", "Shoulder/wrist pain, lower-back strain, or an unstable overhead arm.", "Learn each stage without weight first; use a light load and stop if the overhead arm wobbles."],
  "dumbbell thrusters": ["Quads/glutes in the squat, then shoulders/triceps in the press.", "Knee/shoulder joint pain or lower-back compression.", "Use a load you can press without arching; keep the squat and drive controlled."],
  "dumbbell front squat": ["Front thighs and glutes; core and upper back brace.", "Knee/hip joint pain, wrist pain, or lower-back strain.", "Keep heels grounded and weights supported near shoulders; don't let your torso collapse."],
  "dumbbell snatch": ["Glutes/hamstrings driving the weight, then shoulder/upper-back stability overhead.", "Lower-back pain, shoulder pinching, or wrist impact.", "Use light weight while learning; drive with hips rather than yanking with the arm."],
  "renegade rows": ["Lats/mid-back during the row; abs and supporting arm stabilize.", "Wrist/shoulder joint pain or lower-back strain.", "Keep hips level and feet wide enough for balance; lighten the row if your torso twists."],
};

export function getExerciseFeelingCues(name: string): FeelingCues {
  const key = name.replace(/[✪➭]/g, "").trim().toLowerCase();
  const cue = CUES[key];
  if (cue) return { should: cue[0], shouldNot: cue[1], check: cue[2] };
  const targets = getExerciseMuscles(name);
  return {
    should: targets ? `Muscular effort in ${targets.primary.join(", ")}; supporting muscles may also work.` : "Controlled muscular effort in the intended target muscles. Specific cues aren't available for this exercise yet.",
    shouldNot: "Sharp or pinching joint pain, numbness, tingling, or radiating pain.",
    check: "Use a comfortable range and a load you can control without swinging or changing posture.",
  };
}