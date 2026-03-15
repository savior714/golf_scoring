-- Fix Course Requests Visibility and Role Management
-- 1. Add role column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. Grant admin to savior714@gmail.com
UPDATE public.profiles SET role = 'admin' WHERE email = 'savior714@gmail.com';

-- 3. 명시적 외래키 추가 (PostgREST Join 지원용)
-- course_requests.user_id -> profiles.id
ALTER TABLE public.course_requests 
DROP CONSTRAINT IF EXISTS fk_course_requests_profiles;

ALTER TABLE public.course_requests 
ADD CONSTRAINT fk_course_requests_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- 4. RLS 정책 업데이트 (role 컬럼 기반)
ALTER TABLE public.course_requests ENABLE ROW LEVEL SECURITY;

-- SELECT 정책 추가 (관리자 전용)
DROP POLICY IF EXISTS "Only admins can select course requests" ON public.course_requests;
CREATE POLICY "Only admins can select course requests" 
ON public.course_requests FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

DROP POLICY IF EXISTS "Only admins can update course requests" ON public.course_requests;
CREATE POLICY "Only admins can update course requests" 
ON public.course_requests FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- 보너스: 관리자는 모든 요청을 삭제할 수도 있도록 정책 추가 (필요 시)
DROP POLICY IF EXISTS "Only admins can delete course requests" ON public.course_requests;
CREATE POLICY "Only admins can delete course requests" 
ON public.course_requests FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);