-- ==============================================================================
-- SMART NAGAR PARISHAD CHITTORGARH - PRODUCTION RLS & ACCESS SECURITY SCRIPT
-- ARCHITECTURE: STRICTLY PRIVATE - PORTAL MANAGER ONLY
-- AUTHORIZED ROLE: PORTAL_MANAGER (EXACTLY ONE APPLICATION ROLE)
-- TARGET DATABASE: Supabase PostgreSQL (qvrhgytkufajcpletbfp)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CLEANUP LEGACY PUBLIC ACCESS & FUNCTIONS
-- ------------------------------------------------------------------------------
-- Drop public complaint tracking function if it exists (No citizen-facing RPCs)
DROP FUNCTION IF EXISTS public.track_complaint(text);
DROP FUNCTION IF EXISTS public.is_authorized_manager();

-- ------------------------------------------------------------------------------
-- 2. PROTECTED USER PROFILES TABLE (LINKED TO auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'PORTAL_MANAGER' CHECK (role = 'PORTAL_MANAGER'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Revoke all permissions from anon
REVOKE ALL ON public.user_profiles FROM anon;
GRANT SELECT ON public.user_profiles TO authenticated;

-- Policy: Authenticated users can only read their own profile
DROP POLICY IF EXISTS "portal_manager_read_own_profile" ON public.user_profiles;
CREATE POLICY "portal_manager_read_own_profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 3. SECURITY DEFINER HELPER FUNCTION (is_authorized_manager)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_authorized_manager()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
  -- Verify authenticated session, active status, and PORTAL_MANAGER role
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_profiles
    WHERE id = auth.uid()
      AND role = 'PORTAL_MANAGER'
      AND is_active = true
  );
END;
$$;

-- Secure helper function permissions
REVOKE ALL ON FUNCTION public.is_authorized_manager() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_authorized_manager() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_authorized_manager() TO authenticated;

-- ------------------------------------------------------------------------------
-- 4. REVOKE ALL ANONYMOUS PERMISSIONS (STRICTLY NO PUBLIC ACCESS)
-- ------------------------------------------------------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Grant standard operations to authenticated role (policies will strictly gate)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ------------------------------------------------------------------------------
-- 5. ENABLE ROW LEVEL SECURITY ON ALL 10 PRODUCTION TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authority_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citizen_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 6. DROP ALL OBSOLETE / LEGACY POLICIES
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename IN (
        'departments', 'wards', 'complaint_categories', 'tickets', 
        'authority_confirmations', 'citizen_confirmations', 'call_attempts', 
        'ticket_history', 'notification_logs', 'system_settings'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 7. DEFINE ZERO-TRUST RLS POLICIES FOR PORTAL_MANAGER ONLY
-- ------------------------------------------------------------------------------

-- Table 1: departments (Full CRUD for Portal Manager)
CREATE POLICY "portal_manager_departments_select" ON public.departments FOR SELECT TO authenticated USING (public.is_authorized_manager());
CREATE POLICY "portal_manager_departments_insert" ON public.departments FOR INSERT TO authenticated WITH CHECK (public.is_authorized_manager());
CREATE POLICY "portal_manager_departments_update" ON public.departments FOR UPDATE TO authenticated USING (public.is_authorized_manager()) WITH CHECK (public.is_authorized_manager());
CREATE POLICY "portal_manager_departments_delete" ON public.departments FOR DELETE TO authenticated USING (public.is_authorized_manager());

-- Table 2: wards (Full CRUD for Portal Manager)
CREATE POLICY "portal_manager_wards_select" ON public.wards FOR SELECT TO authenticated USING (public.is_authorized_manager());
CREATE POLICY "portal_manager_wards_insert" ON public.wards FOR INSERT TO authenticated WITH CHECK (public.is_authorized_manager());
CREATE POLICY "portal_manager_wards_update" ON public.wards FOR UPDATE TO authenticated USING (public.is_authorized_manager()) WITH CHECK (public.is_authorized_manager());
CREATE POLICY "portal_manager_wards_delete" ON public.wards FOR DELETE TO authenticated USING (public.is_authorized_manager());

-- Table 3: complaint_categories (Full CRUD for Portal Manager)
CREATE POLICY "portal_manager_categories_select" ON public.complaint_categories FOR SELECT TO authenticated USING (public.is_authorized_manager());
CREATE POLICY "portal_manager_categories_insert" ON public.complaint_categories FOR INSERT TO authenticated WITH CHECK (public.is_authorized_manager());
CREATE POLICY "portal_manager_categories_update" ON public.complaint_categories FOR UPDATE TO authenticated USING (public.is_authorized_manager()) WITH CHECK (public.is_authorized_manager());
CREATE POLICY "portal_manager_categories_delete" ON public.complaint_categories FOR DELETE TO authenticated USING (public.is_authorized_manager());

-- Table 4: tickets (Full CRUD across all 60 wards)
CREATE POLICY "portal_manager_tickets_select" ON public.tickets FOR SELECT TO authenticated USING (public.is_authorized_manager());
CREATE POLICY "portal_manager_tickets_insert" ON public.tickets FOR INSERT TO authenticated WITH CHECK (public.is_authorized_manager());
CREATE POLICY "portal_manager_tickets_update" ON public.tickets FOR UPDATE TO authenticated USING (public.is_authorized_manager()) WITH CHECK (public.is_authorized_manager());
CREATE POLICY "portal_manager_tickets_delete" ON public.tickets FOR DELETE TO authenticated USING (public.is_authorized_manager());

-- Table 5: authority_confirmations (Full Management for Portal Manager)
CREATE POLICY "portal_manager_auth_conf_select" ON public.authority_confirmations FOR SELECT TO authenticated USING (public.is_authorized_manager());
CREATE POLICY "portal_manager_auth_conf_insert" ON public.authority_confirmations FOR INSERT TO authenticated WITH CHECK (public.is_authorized_manager());
CREATE POLICY "portal_manager_auth_conf_update" ON public.authority_confirmations FOR UPDATE TO authenticated USING (public.is_authorized_manager()) WITH CHECK (public.is_authorized_manager());
CREATE POLICY "portal_manager_auth_conf_delete" ON public.authority_confirmations FOR DELETE TO authenticated USING (public.is_authorized_manager());

-- Table 6: citizen_confirmations (Internal Workflow Management)
CREATE POLICY "portal_manager_cit_conf_select" ON public.citizen_confirmations FOR SELECT TO authenticated USING (public.is_authorized_manager());
CREATE POLICY "portal_manager_cit_conf_insert" ON public.citizen_confirmations FOR INSERT TO authenticated WITH CHECK (public.is_authorized_manager());
CREATE POLICY "portal_manager_cit_conf_update" ON public.citizen_confirmations FOR UPDATE TO authenticated USING (public.is_authorized_manager()) WITH CHECK (public.is_authorized_manager());
CREATE POLICY "portal_manager_cit_conf_delete" ON public.citizen_confirmations FOR DELETE TO authenticated USING (public.is_authorized_manager());

-- Table 7: call_attempts (Intake & Citizen Verification Desk)
CREATE POLICY "portal_manager_call_attempts_select" ON public.call_attempts FOR SELECT TO authenticated USING (public.is_authorized_manager());
CREATE POLICY "portal_manager_call_attempts_insert" ON public.call_attempts FOR INSERT TO authenticated WITH CHECK (public.is_authorized_manager());
CREATE POLICY "portal_manager_call_attempts_update" ON public.call_attempts FOR UPDATE TO authenticated USING (public.is_authorized_manager()) WITH CHECK (public.is_authorized_manager());
CREATE POLICY "portal_manager_call_attempts_delete" ON public.call_attempts FOR DELETE TO authenticated USING (public.is_authorized_manager());

-- Table 8: ticket_history (Audit Trail - Read & Append Only, Immutable History)
CREATE POLICY "portal_manager_ticket_history_select" ON public.ticket_history FOR SELECT TO authenticated USING (public.is_authorized_manager());
CREATE POLICY "portal_manager_ticket_history_insert" ON public.ticket_history FOR INSERT TO authenticated WITH CHECK (public.is_authorized_manager());
-- Note: UPDATE and DELETE are intentionally omitted to enforce immutable audit trail integrity.

-- Table 9: notification_logs (Audit Trail - Read & Append Only, Immutable History)
CREATE POLICY "portal_manager_notifications_select" ON public.notification_logs FOR SELECT TO authenticated USING (public.is_authorized_manager());
CREATE POLICY "portal_manager_notifications_insert" ON public.notification_logs FOR INSERT TO authenticated WITH CHECK (public.is_authorized_manager());
-- Note: UPDATE and DELETE are intentionally omitted to enforce immutable notification audit integrity.

-- Table 10: system_settings (Full Management for Portal Manager)
CREATE POLICY "portal_manager_settings_select" ON public.system_settings FOR SELECT TO authenticated USING (public.is_authorized_manager());
CREATE POLICY "portal_manager_settings_insert" ON public.system_settings FOR INSERT TO authenticated WITH CHECK (public.is_authorized_manager());
CREATE POLICY "portal_manager_settings_update" ON public.system_settings FOR UPDATE TO authenticated USING (public.is_authorized_manager()) WITH CHECK (public.is_authorized_manager());
CREATE POLICY "portal_manager_settings_delete" ON public.system_settings FOR DELETE TO authenticated USING (public.is_authorized_manager());

-- ------------------------------------------------------------------------------
-- 8. INITIAL PROVISIONING OF AUTHORIZED PORTAL MANAGER PROFILES
-- ------------------------------------------------------------------------------
INSERT INTO public.user_profiles (id, email, role, is_active)
SELECT id, email, 'PORTAL_MANAGER', true
FROM auth.users
WHERE email IN ('chittortech@gmail.com', 'nagarparisad@gmail.com')
ON CONFLICT (id) DO UPDATE 
SET role = 'PORTAL_MANAGER', is_active = true, updated_at = now();

