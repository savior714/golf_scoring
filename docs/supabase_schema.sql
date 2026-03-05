-- ============================================================
-- [GOLF CLUB MASTER] 구장 마스터 데이터 계층 스키마
-- Club (구장) > Course (코스) > Hole (홀) > Distance (티별 전장)
-- 모든 사용자 공유 DB - 누구나 읽기, 인증된 사용자만 쓰기
-- ============================================================

-- 1. 골프장 마스터 (Club)
CREATE TABLE IF NOT EXISTS public.golf_clubs (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,      -- 예: 아리스타CC
    address TEXT,
    created_by UUID REFERENCES auth.users,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 코스 (Course) - 한 구장에 여러 코스 (메이플, 파인 등)
CREATE TABLE IF NOT EXISTS public.golf_courses (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id    UUID REFERENCES public.golf_clubs(id) ON DELETE CASCADE NOT NULL,
    name       TEXT NOT NULL,           -- 예: Lake Course, Mountain Course
    hole_count INT  DEFAULT 9,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(club_id, name)
);

-- 3. 홀 상세 (Hole)
CREATE TABLE IF NOT EXISTS public.golf_holes (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id    UUID REFERENCES public.golf_courses(id) ON DELETE CASCADE NOT NULL,
    hole_number  INT  NOT NULL,
    par          INT  NOT NULL CHECK (par IN (3, 4, 5, 6)),
    handicap_idx INT,                   -- 핸디캡 난이도 (선택)
    UNIQUE(course_id, hole_number)
);

-- 4. 티박스별 전장 (Distance)
CREATE TABLE IF NOT EXISTS public.hole_distances (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hole_id         UUID REFERENCES public.golf_holes(id) ON DELETE CASCADE NOT NULL,
    tee_color       TEXT NOT NULL,      -- White, Blue, Black, Red 등
    distance_meter  INT,
    UNIQUE(hole_id, tee_color)
);

-- RLS 활성화
ALTER TABLE public.golf_clubs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golf_courses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golf_holes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hole_distances ENABLE ROW LEVEL SECURITY;

-- 정책: 모든 사용자 읽기 허용 (구장 정보는 공유 자산)
DROP POLICY IF EXISTS "Anyone can read golf_clubs" ON public.golf_clubs;
CREATE POLICY "Anyone can read golf_clubs" ON public.golf_clubs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read golf_courses" ON public.golf_courses;
CREATE POLICY "Anyone can read golf_courses" ON public.golf_courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read golf_holes" ON public.golf_holes;
CREATE POLICY "Anyone can read golf_holes" ON public.golf_holes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read hole_distances" ON public.hole_distances;
CREATE POLICY "Anyone can read hole_distances" ON public.hole_distances FOR SELECT USING (true);

-- 정책: 관리자(savior714@gmail.com)만 쓰기/수정/삭제 가능
-- auth.users 테이블에서 이메일을 직접 비교하는 이중 방어 구조
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
          AND email = 'savior714@gmail.com'
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- golf_clubs
DROP POLICY IF EXISTS "Auth users can insert golf_clubs" ON public.golf_clubs;
CREATE POLICY "Admin only insert golf_clubs" ON public.golf_clubs
    FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admin only update golf_clubs" ON public.golf_clubs;
CREATE POLICY "Admin only update golf_clubs" ON public.golf_clubs
    FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "Admin only delete golf_clubs" ON public.golf_clubs;
CREATE POLICY "Admin only delete golf_clubs" ON public.golf_clubs
    FOR DELETE USING (public.is_admin());

-- golf_courses
DROP POLICY IF EXISTS "Auth users can insert golf_courses" ON public.golf_courses;
CREATE POLICY "Admin only insert golf_courses" ON public.golf_courses
    FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admin only update golf_courses" ON public.golf_courses;
CREATE POLICY "Admin only update golf_courses" ON public.golf_courses
    FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "Admin only delete golf_courses" ON public.golf_courses;
CREATE POLICY "Admin only delete golf_courses" ON public.golf_courses
    FOR DELETE USING (public.is_admin());

-- golf_holes
DROP POLICY IF EXISTS "Auth users can insert golf_holes" ON public.golf_holes;
CREATE POLICY "Admin only insert golf_holes" ON public.golf_holes
    FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admin only update golf_holes" ON public.golf_holes;
CREATE POLICY "Admin only update golf_holes" ON public.golf_holes
    FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "Admin only delete golf_holes" ON public.golf_holes;
CREATE POLICY "Admin only delete golf_holes" ON public.golf_holes
    FOR DELETE USING (public.is_admin());

-- hole_distances
DROP POLICY IF EXISTS "Auth users can insert hole_distances" ON public.hole_distances;
CREATE POLICY "Admin only insert hole_distances" ON public.hole_distances
    FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admin only update hole_distances" ON public.hole_distances;
CREATE POLICY "Admin only update hole_distances" ON public.hole_distances
    FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "Admin only delete hole_distances" ON public.hole_distances;
CREATE POLICY "Admin only delete hole_distances" ON public.hole_distances
    FOR DELETE USING (public.is_admin());

-- ============================================================
-- [초기 시드 데이터] 아리스타CC (Lake + Mountain)
-- ============================================================
DO $$
DECLARE
    v_club_id     UUID;
    v_lake_id     UUID;
    v_mountain_id UUID;
BEGIN
    -- 구장이 없을 때만 삽입
    IF NOT EXISTS (SELECT 1 FROM public.golf_clubs WHERE name = '아리스타CC') THEN
        INSERT INTO public.golf_clubs (name, address)
        VALUES ('아리스타CC', NULL)
        RETURNING id INTO v_club_id;

        INSERT INTO public.golf_courses (club_id, name, hole_count)
        VALUES (v_club_id, 'Lake Course', 9) RETURNING id INTO v_lake_id;

        INSERT INTO public.golf_courses (club_id, name, hole_count)
        VALUES (v_club_id, 'Mountain Course', 9) RETURNING id INTO v_mountain_id;

        -- Lake Course 홀 (1~9)
        INSERT INTO public.golf_holes (course_id, hole_number, par) VALUES
        (v_lake_id, 1, 4), (v_lake_id, 2, 4), (v_lake_id, 3, 3),
        (v_lake_id, 4, 5), (v_lake_id, 5, 4), (v_lake_id, 6, 5),
        (v_lake_id, 7, 4), (v_lake_id, 8, 3), (v_lake_id, 9, 4);

        -- Mountain Course 홀 (1~9, hole_number는 코스 내 순서 기준)
        INSERT INTO public.golf_holes (course_id, hole_number, par) VALUES
        (v_mountain_id, 1, 5), (v_mountain_id, 2, 3), (v_mountain_id, 3, 4),
        (v_mountain_id, 4, 4), (v_mountain_id, 5, 3), (v_mountain_id, 6, 4),
        (v_mountain_id, 7, 4), (v_mountain_id, 8, 5), (v_mountain_id, 9, 4);

        -- Lake Course 전장 (White 티 기준)
        INSERT INTO public.hole_distances (hole_id, tee_color, distance_meter)
        SELECT gh.id, 'White', d.dist
        FROM public.golf_holes gh
        JOIN (VALUES (1,420),(2,380),(3,195),(4,465),(5,395),(6,535),(7,405),(8,185),(9,350))
             AS d(num, dist) ON gh.hole_number = d.num
        WHERE gh.course_id = v_lake_id;

        -- Mountain Course 전장 (White 티 기준)
        INSERT INTO public.hole_distances (hole_id, tee_color, distance_meter)
        SELECT gh.id, 'White', d.dist
        FROM public.golf_holes gh
        JOIN (VALUES (1,540),(2,185),(3,320),(4,300),(5,180),(6,350),(7,335),(8,485),(9,385))
             AS d(num, dist) ON gh.hole_number = d.num
        WHERE gh.course_id = v_mountain_id;
    END IF;
END $$;

-- ============================================================
-- [SCORE TABLES] 기존 스코어 기록 테이블 (변경 없음)
-- ============================================================

    -- 1. rounds 테이블 생성 (user_id 추가)
    CREATE TABLE IF NOT EXISTS public.rounds (
        id TEXT PRIMARY KEY,
        user_id UUID REFERENCES auth.users NOT NULL DEFAULT auth.uid(), -- 사용자 ID
        date DATE NOT NULL,
        course_name TEXT NOT NULL,      -- 구장명 (Legacy 지원용)
        course_type TEXT,                -- 코스 조합명 (Legacy 지원용: 예: Lake-Mountain)
        out_course_id UUID REFERENCES public.golf_courses(id), -- 전반 코스 (9홀)
        in_course_id  UUID REFERENCES public.golf_courses(id), -- 후반 코스 (9홀)
        memo TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- 2. holes 테이블 생성 (round_id 외래키)
    CREATE TABLE IF NOT EXISTS public.holes (
        id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        round_id TEXT REFERENCES public.rounds(id) ON DELETE CASCADE NOT NULL,
        hole_no INTEGER NOT NULL,
        par INTEGER NOT NULL,
        stroke INTEGER NOT NULL,
        putt INTEGER NOT NULL,
        is_fairway BOOLEAN DEFAULT true,
        is_gir BOOLEAN,
        ob INTEGER DEFAULT 0,
        penalty INTEGER DEFAULT 0,
        miss_shot TEXT,
        
        UNIQUE(round_id, hole_no)
    );

    -- RLS (Row Level Security) 설정
    ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.holes ENABLE ROW LEVEL SECURITY;

    -- 정책 재구성 (자신이 소유한 데이터에만 액세스 허용)
    DROP POLICY IF EXISTS "Allow user to manage their own rounds" ON public.rounds;
    CREATE POLICY "Allow user to manage their own rounds" 
    ON public.rounds FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Allow user to manage their own holes" ON public.holes;
    CREATE POLICY "Allow user to manage their own holes" 
    ON public.holes FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.rounds 
            WHERE public.rounds.id = public.holes.round_id 
            AND public.rounds.user_id = auth.uid()
        )
    );
