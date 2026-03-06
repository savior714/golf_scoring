-- Migration: Add tee_color and updated_at to rounds table
-- Location: public.rounds

ALTER TABLE public.rounds ADD COLUMN IF NOT EXISTS tee_color TEXT;
ALTER TABLE public.rounds ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Logic: tee_color will store values like 'Black', 'Blue', 'White', 'Red', 'Gold', 'Green'.
-- updated_at handles synchronization conflict resolution (Latest Wins).
