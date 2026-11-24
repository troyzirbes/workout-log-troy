ALTER TABLE public.workout_exercises
  ADD COLUMN completed boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.workout_exercises.completed IS 'Whether the exercise was completed as planned in this workout.';