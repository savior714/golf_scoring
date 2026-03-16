-- notices 테이블 생성
CREATE TABLE IF NOT EXISTS public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- RLS 설정
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- 1. 인증된 사용자 전체 조회 허용
CREATE POLICY "Notices are viewable by authenticated users"
ON public.notices FOR SELECT
USING (auth.role() = 'authenticated');

-- 2. 관리자(profiles.role = 'admin')만 작성 허용
CREATE POLICY "Only admins can insert notices"
ON public.notices FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 3. 관리자만 삭제 허용
CREATE POLICY "Only admins can delete notices"
ON public.notices FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
