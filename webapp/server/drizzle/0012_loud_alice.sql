-- Add mode column to video table (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'video' AND column_name = 'mode'
    ) THEN
        ALTER TABLE "video" ADD COLUMN "mode" text DEFAULT 'auto' NOT NULL;
    END IF;
END $$;
