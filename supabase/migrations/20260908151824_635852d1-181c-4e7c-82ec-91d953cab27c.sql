-- Lock all workout data to the single owner account
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('exercises','workouts','workout_exercises','exercise_sets')
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) = 'troyzirbes@gmail.com'
$$;

REVOKE ALL ON public.exercises FROM anon;
REVOKE ALL ON public.workouts FROM anon;
REVOKE ALL ON public.workout_exercises FROM anon;
REVOKE ALL ON public.exercise_sets FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercises TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workouts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_exercises TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_sets TO authenticated;
GRANT ALL ON public.exercises TO service_role;
GRANT ALL ON public.workouts TO service_role;
GRANT ALL ON public.workout_exercises TO service_role;
GRANT ALL ON public.exercise_sets TO service_role;

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages exercises" ON public.exercises
  FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY "Owner manages workouts" ON public.workouts
  FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY "Owner manages workout exercises" ON public.workout_exercises
  FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY "Owner manages exercise sets" ON public.exercise_sets
  FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());