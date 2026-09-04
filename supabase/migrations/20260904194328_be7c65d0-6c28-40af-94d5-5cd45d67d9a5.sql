CREATE TABLE public.exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  muscle_group text,
  gif_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercises TO anon, authenticated;
GRANT ALL ON public.exercises TO service_role;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access to exercises" ON public.exercises FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT current_date,
  title text NOT NULL DEFAULT 'Workout',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workouts TO anon, authenticated;
GRANT ALL ON public.workouts TO service_role;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access to workouts" ON public.workouts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX workout_exercises_workout_id_idx ON public.workout_exercises(workout_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_exercises TO anon, authenticated;
GRANT ALL ON public.workout_exercises TO service_role;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access to workout_exercises" ON public.workout_exercises FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.exercise_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id uuid NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  set_number integer NOT NULL DEFAULT 1,
  reps integer NOT NULL DEFAULT 0,
  weight numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX exercise_sets_we_id_idx ON public.exercise_sets(workout_exercise_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_sets TO anon, authenticated;
GRANT ALL ON public.exercise_sets TO service_role;
ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access to exercise_sets" ON public.exercise_sets FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.exercises (name, muscle_group) VALUES
  ('Incline Dumbbell Press','Chest'),
  ('Flat Dumbbell Flyes','Chest'),
  ('Decline Dumbbell Press','Chest'),
  ('Single-Arm Dumbbell Row','Back & Posterior Neck'),
  ('Chest-Supported Incline Row','Back & Posterior Neck'),
  ('Dumbbell Shrugs','Back & Posterior Neck'),
  ('Incline Dumbbell Curls','Arms (Biceps & Triceps)'),
  ('Hammer Curls','Arms (Biceps & Triceps)'),
  ('Overhead Triceps Extension','Arms (Biceps & Triceps)'),
  ('Dumbbell Skullcrushers','Arms (Biceps & Triceps)'),
  ('Seated Overhead Press','Shoulders & Lateral Neck'),
  ('Dumbbell Lateral Raises','Shoulders & Lateral Neck'),
  ('Dumbbell Rear Delt Flyes','Shoulders & Lateral Neck'),
  ('Dumbbell Farmers Carry','Shoulders & Lateral Neck'),
  ('Dumbbell Goblet Squats','Quads & Calves'),
  ('Dumbbell Step-Ups','Quads & Calves'),
  ('Standing Calf Raises','Quads & Calves'),
  ('Dumbbell Romanian Deadlifts','Glutes & Hamstrings'),
  ('Bulgarian Split Squats','Glutes & Hamstrings'),
  ('Dumbbell Hip Thrusts','Glutes & Hamstrings');