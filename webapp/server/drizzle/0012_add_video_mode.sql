-- Add mode column to video table for distinguishing workflow types
-- 'auto' = Simple/Auto mode (default)
-- 'editor' = Editor mode with full control

ALTER TABLE "video" ADD COLUMN IF NOT EXISTS "mode" text NOT NULL DEFAULT 'auto';
