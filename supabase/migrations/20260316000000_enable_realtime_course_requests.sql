-- Enable realtime for course_requests table (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'course_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.course_requests;
  END IF;
END $$;
