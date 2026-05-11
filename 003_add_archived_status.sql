-- Migration: Add 'archived' status to hoses table
ALTER TABLE hoses DROP CONSTRAINT IF EXISTS hoses_status_check;
ALTER TABLE hoses ADD CONSTRAINT hoses_status_check CHECK (status IN ('active', 'replaced', 'archived'));