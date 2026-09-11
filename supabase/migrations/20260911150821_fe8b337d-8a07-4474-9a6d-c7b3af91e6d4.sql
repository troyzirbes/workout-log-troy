-- Replace the exercise-level success checkbox with a weight-direction choice.
ALTER TABLE public.workout_exercises
  ADD COLUMN weight_direction text NOT NULL DEFAULT 'same',
  ADD CONSTRAINT workout_exercises_weight_direction_check
    CHECK (weight_direction IN ('up', 'same', 'down'));

-- Migrate prior success flag: true -> increase weights next time ('up'), false -> keep same.
UPDATE public.workout_exercises
  SET weight_direction = CASE WHEN success THEN 'up' ELSE 'same' END;
