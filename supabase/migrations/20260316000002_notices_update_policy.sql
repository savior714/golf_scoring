-- 관리자만 notices 수정 허용
CREATE POLICY "Only admins can update notices"
ON public.notices FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
