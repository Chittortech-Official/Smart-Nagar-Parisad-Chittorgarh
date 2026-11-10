-- ==============================================================================
-- SMART NAGAR PARISHAD CHITTORGARH - TICKET STATUS ENHANCEMENT
-- Target Database: Supabase PostgreSQL (qvrhgytkufajcpletbfp)
-- Purpose: Allow 'REJECTED' status in public.tickets table so that rejected
--          complaints are permanently persisted in Supabase with their CGR ticket ID.
-- ==============================================================================

-- Step 1: Drop the old check constraint that only allowed 5 statuses
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_status_check;

-- Step 2: Add updated check constraint including 'REJECTED'
ALTER TABLE public.tickets ADD CONSTRAINT tickets_status_check 
CHECK (status IN (
    'REGISTERED',
    'IN_PROGRESS',
    'RESOLVED_AWAITING_CITIZEN',
    'CLOSED',
    'REOPENED',
    'REJECTED'
));

-- Step 3: Verify current check constraints on tickets table
SELECT conname, pg_get_constraintdef(c.oid) 
FROM pg_constraint c 
JOIN pg_class t ON c.conrelid = t.oid 
WHERE t.relname = 'tickets' AND c.contype = 'c';

