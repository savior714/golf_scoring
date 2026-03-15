-- Fix: Admin Requests Data Loading Error
-- 원인: course_requests.user_id -> profiles FK 미존재로 PostgREST JOIN 실패
--       "Anyone can view" 정책이 남아 보안 의도 불명확

-- 1. FK 재설정 (auth.users 참조 제거 → profiles 참조로 교체)
ALTER TABLE public.course_requests
  DROP CONSTRAINT IF EXISTS course_requests_user_id_fkey;
ALTER TABLE public.course_requests
  DROP CONSTRAINT IF EXISTS fk_course_requests_profiles;
ALTER TABLE public.course_requests
  ADD CONSTRAINT fk_course_requests_profiles
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. RLS 정책 정리 (개방 정책 제거 → 관리자 전용으로 일원화)
DROP POLICY IF EXISTS "Anyone can view course requests" ON public.course_requests;
DROP POLICY IF EXISTS "Only admins can select course requests" ON public.course_requests;
CREATE POLICY "Only admins can select course requests"
ON public.course_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
