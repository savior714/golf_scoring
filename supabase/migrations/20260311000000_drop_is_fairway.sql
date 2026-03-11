-- Migration: Drop is_fairway column from holes table
-- Reason: FIR (Fairway In Regulation) tracking feature permanently removed.
--         The UI toggle was already removed; the field was kept for data compatibility
--         but has now been fully deprecated with no plan to restore (2026-03-11).
ALTER TABLE holes DROP COLUMN IF EXISTS is_fairway;
