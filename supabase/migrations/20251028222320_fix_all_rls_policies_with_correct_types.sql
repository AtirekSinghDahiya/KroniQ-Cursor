/*
  # Fix All RLS Policies with Correct Data Types

  ## Summary
  Fix RLS policies to restore user access to projects, assets, video_jobs, and profiles.
  All these tables use TEXT for user_id/id (Firebase authentication).

  ## Changes
  1. Add complete RLS policies for projects table
  2. Add complete RLS policies for assets table  
  3. Add complete RLS policies for video_jobs table
  4. Fix RLS policies for profiles table
  5. All policies cast auth.uid() to TEXT for comparison
*/

-- =====================================================
-- PROJECTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
CREATE POLICY "Users can insert own projects"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid())::text);

-- =====================================================
-- ASSETS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view own assets" ON public.assets;
CREATE POLICY "Users can view own assets"
  ON public.assets FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can insert own assets" ON public.assets;
CREATE POLICY "Users can insert own assets"
  ON public.assets FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can update own assets" ON public.assets;
CREATE POLICY "Users can update own assets"
  ON public.assets FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can delete own assets" ON public.assets;
CREATE POLICY "Users can delete own assets"
  ON public.assets FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid())::text);

-- =====================================================
-- VIDEO_JOBS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view own video jobs" ON public.video_jobs;
CREATE POLICY "Users can view own video jobs"
  ON public.video_jobs FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can insert own video jobs" ON public.video_jobs;
CREATE POLICY "Users can insert own video jobs"
  ON public.video_jobs FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can update own video jobs" ON public.video_jobs;
CREATE POLICY "Users can update own video jobs"
  ON public.video_jobs FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can delete own video jobs" ON public.video_jobs;
CREATE POLICY "Users can delete own video jobs"
  ON public.video_jobs FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid())::text);

-- =====================================================
-- PROFILES TABLE (id is TEXT)
-- =====================================================

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid())::text)
  WITH CHECK (id = (SELECT auth.uid())::text);
