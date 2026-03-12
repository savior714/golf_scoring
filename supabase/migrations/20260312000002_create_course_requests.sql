-- Course Request System (Lightweight)
-- 일반 사용자가 원하는 구장이 없을 경우 요청을 남길 수 있도록 하는 테이블

CREATE TABLE IF NOT EXISTS public.course_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    requested_club_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 설정
ALTER TABLE public.course_requests ENABLE ROW LEVEL SECURITY;

-- 1. 모두 읽기 가능 (관리자 화면에서 몰아서 보기 위함, 혹은 본인 것 확인용)
CREATE POLICY "Anyone can view course requests" 
ON public.course_requests FOR SELECT 
USING (true);

-- 2. 인증된 사용자라면 누구나 요청 생성 가능
CREATE POLICY "Authenticated users can create course requests" 
ON public.course_requests FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 3. 관리자만 상태 변경 가능 (상태 업데이트용)
-- profiles 테이블에 role이 'admin'인 경우만 허용한다고 가정 (있을 경우)
CREATE POLICY "Only admins can update course requests" 
ON public.course_requests FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- 트리거: updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_course_requests_modtime
    BEFORE UPDATE ON public.course_requests
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
