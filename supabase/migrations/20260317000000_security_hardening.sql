-- ============================================================
-- [SECURITY HARDENING] Business Logic & RLS Standardization
-- Implementation of Task 6: security_vulnerability_audit.md
-- ============================================================

-- 1. profiles table: Ensure 'role' column exists with SSOT default
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END $$;

-- 2. Authority Check: Standardize is_admin() function
-- Uses profiles.role as the Single Source of Truth (SSOT)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Business Logic: Round Creation Constraints
-- [RULE 1.19] Max 10 rounds per day & Blocking past dates
CREATE OR REPLACE FUNCTION public.enforce_round_constraints()
RETURNS TRIGGER AS $$
DECLARE
    daily_count INT;
BEGIN
    -- [RULE 1.19] 과거 날짜의 기록 생성 원천 차단 (Insert 시에만 적용)
    IF (TG_OP = 'INSERT') AND (NEW.date < CURRENT_DATE) THEN
        RAISE EXCEPTION 'Past dates are not allowed for round creation (과거 날짜의 기록 생성은 불가능합니다).'
        USING ERRCODE = 'P0001';
    END IF;

    -- [RULE 1.19] 하루 최대 10건 라운드 생성 제한 (Net Count: Deleted records are naturally excluded)
    IF (TG_OP = 'INSERT') THEN
        SELECT COUNT(*) INTO daily_count
        FROM public.rounds
        WHERE user_id = auth.uid()
          AND date = NEW.date;

        IF (daily_count >= 10) THEN
            RAISE EXCEPTION 'Daily round limit reached (Max 10 per day: 하루 최대 라운드 생성 제한을 초과했습니다).'
            USING ERRCODE = 'P0002';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for public.rounds (Insert processing)
DROP TRIGGER IF EXISTS tr_enforce_round_constraints ON public.rounds;
CREATE TRIGGER tr_enforce_round_constraints
    BEFORE INSERT ON public.rounds
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_round_constraints();

-- 4. Data Integrity: Master Data Hardening
-- [RULE 0.6 & 4.70-73] Every course MUST be unitized as 9 holes
ALTER TABLE public.golf_courses 
DROP CONSTRAINT IF EXISTS check_hole_count;
ALTER TABLE public.golf_courses 
ADD CONSTRAINT check_hole_count CHECK (hole_count = 9);

-- 5. RLS Standardization: Use standardized is_admin() for all master data
-- This ensures that the authority check logic is centralized.

-- [golf_clubs]
DROP POLICY IF EXISTS "Admin only insert golf_clubs" ON public.golf_clubs;
CREATE POLICY "Admin only insert golf_clubs" ON public.golf_clubs FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admin only update golf_clubs" ON public.golf_clubs;
CREATE POLICY "Admin only update golf_clubs" ON public.golf_clubs FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "Admin only delete golf_clubs" ON public.golf_clubs;
CREATE POLICY "Admin only delete golf_clubs" ON public.golf_clubs FOR DELETE USING (public.is_admin());

-- [golf_courses]
DROP POLICY IF EXISTS "Admin only insert golf_courses" ON public.golf_courses;
CREATE POLICY "Admin only insert golf_courses" ON public.golf_courses FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admin only update golf_courses" ON public.golf_courses;
CREATE POLICY "Admin only update golf_courses" ON public.golf_courses FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "Admin only delete golf_courses" ON public.golf_courses;
CREATE POLICY "Admin only delete golf_courses" ON public.golf_courses FOR DELETE USING (public.is_admin());

-- [golf_holes]
DROP POLICY IF EXISTS "Admin only insert golf_holes" ON public.golf_holes;
CREATE POLICY "Admin only insert golf_holes" ON public.golf_holes FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admin only update golf_holes" ON public.golf_holes;
CREATE POLICY "Admin only update golf_holes" ON public.golf_holes FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "Admin only delete golf_holes" ON public.golf_holes;
CREATE POLICY "Admin only delete golf_holes" ON public.golf_holes FOR DELETE USING (public.is_admin());

-- [hole_distances]
DROP POLICY IF EXISTS "Admin only insert hole_distances" ON public.hole_distances;
CREATE POLICY "Admin only insert hole_distances" ON public.hole_distances FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admin only update hole_distances" ON public.hole_distances;
CREATE POLICY "Admin only update hole_distances" ON public.hole_distances FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "Admin only delete hole_distances" ON public.hole_distances;
CREATE POLICY "Admin only delete hole_distances" ON public.hole_distances FOR DELETE USING (public.is_admin());

-- 6. Audit & Recovery: Update triggered role if needed
-- (Optional: ensures users table can be synced if desired, but here we strictly follow profiles.role)
