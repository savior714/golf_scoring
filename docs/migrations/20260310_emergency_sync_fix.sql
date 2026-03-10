-- [Emergency Sync Fix] Correct columns & fix typos (ee_color, ounds)
DO $$
BEGIN
    -- 1. Correct accidental truncation of table name 'rounds'
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ounds') THEN
        ALTER TABLE public.ounds RENAME TO rounds;
    END IF;

    -- 2. Correct accidental truncation of column name 'tee_color'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rounds' AND column_name = 'ee_color') THEN
        ALTER TABLE public.rounds RENAME COLUMN ee_color TO tee_color;
    END IF;

    -- 3. Ensure all columns for 3-Layer DDD architecture exist
    ALTER TABLE public.rounds ADD COLUMN IF NOT EXISTS out_course_id UUID REFERENCES public.golf_courses(id);
    ALTER TABLE public.rounds ADD COLUMN IF NOT EXISTS in_course_id UUID REFERENCES public.golf_courses(id);
    ALTER TABLE public.rounds ADD COLUMN IF NOT EXISTS tee_color TEXT;
    ALTER TABLE public.rounds ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
    
    UPDATE public.rounds SET updated_at = NOW() WHERE updated_at IS NULL;
END $$;