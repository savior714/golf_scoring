-- 기존 정책 삭제 후 재정의
DROP POLICY IF EXISTS "Only admins can update notices" ON public.notices;

-- UPDATE 정책 보완: USING(조회 권한)과 WITH CHECK(변경 후 검증) 모두 적용
CREATE POLICY "Only admins can update notices"
ON public.notices FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
