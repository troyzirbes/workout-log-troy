ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS success boolean NOT NULL DEFAULT false;
ALTER TABLE public.workout_exercises ADD COLUMN IF NOT EXISTS success boolean NOT NULL DEFAULT false;