-- ==============================================================================
-- SMART NAGAR PARISHAD CHITTORGARH - MASTER RBAC & RLS V9 PRODUCTION SCRIPT
-- TARGET DATABASE: Supabase PostgreSQL (qvrhgytkufajcpletbfp)
-- EXACT DATABASE COLUMN NAMES VERIFIED VIA LIVE SUPABASE SCHEMA INTROSPECTION
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: CLEANUP LEGACY PUBLIC ACCESS & OBSOLETE FUNCTIONS
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.track_complaint(text);
DROP FUNCTION IF EXISTS public.is_authorized_manager();

-- ------------------------------------------------------------------------------
-- STEP 2: CREATE ROLE ENUM AND DASHBOARD-LINKED user_roles TABLE
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_user_role') THEN
    CREATE TYPE public.app_user_role AS ENUM ('PORTAL_MANAGER', 'APPLICATION_VIEWER');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_user_role NOT NULL DEFAULT 'APPLICATION_VIEWER'::public.app_user_role,
  is_active boolean NOT NULL DEFAULT FALSE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Secure user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_roles FROM anon, PUBLIC;
GRANT SELECT ON public.user_roles TO authenticated;

DROP POLICY IF EXISTS "user_roles_read_own" ON public.user_roles;
CREATE POLICY "user_roles_read_own"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- STEP 3: AUTOMATIC USER ONBOARDING TRIGGER (Zero-Trust Default: INACTIVE VIEWER)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.user_roles (id, role, is_active)
  VALUES (NEW.id, 'APPLICATION_VIEWER'::public.app_user_role, FALSE)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- ------------------------------------------------------------------------------
-- STEP 4: HARDENED SECURITY DEFINER HELPER FUNCTIONS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_portal_manager()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE id = auth.uid()
      AND role = 'PORTAL_MANAGER'::public.app_user_role
      AND is_active = TRUE
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_application_viewer()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE id = auth.uid()
      AND role = 'APPLICATION_VIEWER'::public.app_user_role
      AND is_active = TRUE
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_authorized_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE id = auth.uid()
      AND is_active = TRUE
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_portal_manager() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_application_viewer() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_authorized_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_portal_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_application_viewer() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_authorized_user() TO authenticated;

-- ------------------------------------------------------------------------------
-- STEP 5: REVOKE ALL ANONYMOUS PERMISSIONS & GRANT AUTHENTICATED
-- ------------------------------------------------------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ------------------------------------------------------------------------------
-- STEP 6: ENABLE ROW LEVEL SECURITY ON ALL TABLES
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

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'complaint_intakes') THEN
    ALTER TABLE public.complaint_intakes ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- STEP 7: DROP ALL OLD/CONFLICTING POLICIES SAFELY
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'departments', 'wards', 'complaint_categories', 'tickets',
        'authority_confirmations', 'citizen_confirmations', 'call_attempts',
        'ticket_history', 'notification_logs', 'system_settings', 'complaint_intakes'
      )
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- STEP 8: REFERENCE DATA POLICIES (Departments, Wards, Complaint Categories)
-- ------------------------------------------------------------------------------
-- DEPARTMENTS
CREATE POLICY "departments_select" ON public.departments FOR SELECT TO authenticated USING (public.is_authorized_user());
CREATE POLICY "departments_insert" ON public.departments FOR INSERT TO authenticated WITH CHECK (public.is_portal_manager());
CREATE POLICY "departments_update" ON public.departments FOR UPDATE TO authenticated USING (public.is_portal_manager()) WITH CHECK (public.is_portal_manager());
CREATE POLICY "departments_delete" ON public.departments FOR DELETE TO authenticated USING (public.is_portal_manager());

-- WARDS (Primary Key is ward_number)
CREATE POLICY "wards_select" ON public.wards FOR SELECT TO authenticated USING (public.is_authorized_user());
CREATE POLICY "wards_insert" ON public.wards FOR INSERT TO authenticated WITH CHECK (public.is_portal_manager());
CREATE POLICY "wards_update" ON public.wards FOR UPDATE TO authenticated USING (public.is_portal_manager()) WITH CHECK (public.is_portal_manager());
CREATE POLICY "wards_delete" ON public.wards FOR DELETE TO authenticated USING (public.is_portal_manager());

-- COMPLAINT CATEGORIES
CREATE POLICY "complaint_categories_select" ON public.complaint_categories FOR SELECT TO authenticated USING (public.is_authorized_user());
CREATE POLICY "complaint_categories_insert" ON public.complaint_categories FOR INSERT TO authenticated WITH CHECK (public.is_portal_manager());
CREATE POLICY "complaint_categories_update" ON public.complaint_categories FOR UPDATE TO authenticated USING (public.is_portal_manager()) WITH CHECK (public.is_portal_manager());
CREATE POLICY "complaint_categories_delete" ON public.complaint_categories FOR DELETE TO authenticated USING (public.is_portal_manager());

-- ------------------------------------------------------------------------------
-- STEP 9: TICKETS TABLE POLICIES (Strictly PORTAL_MANAGER for direct table)
-- ------------------------------------------------------------------------------
CREATE POLICY "tickets_select" ON public.tickets FOR SELECT TO authenticated USING (public.is_portal_manager());
CREATE POLICY "tickets_insert" ON public.tickets FOR INSERT TO authenticated WITH CHECK (public.is_portal_manager());
CREATE POLICY "tickets_update" ON public.tickets FOR UPDATE TO authenticated USING (public.is_portal_manager()) WITH CHECK (public.is_portal_manager());
CREATE POLICY "tickets_delete" ON public.tickets FOR DELETE TO authenticated USING (public.is_portal_manager());

-- ------------------------------------------------------------------------------
-- STEP 10: CONFIRMATIONS & OPERATIONAL POLICIES
-- ------------------------------------------------------------------------------
-- AUTHORITY CONFIRMATIONS
CREATE POLICY "authority_confirmations_select" ON public.authority_confirmations FOR SELECT TO authenticated USING (public.is_portal_manager());
CREATE POLICY "authority_confirmations_insert" ON public.authority_confirmations FOR INSERT TO authenticated WITH CHECK (public.is_portal_manager());
CREATE POLICY "authority_confirmations_update" ON public.authority_confirmations FOR UPDATE TO authenticated USING (public.is_portal_manager()) WITH CHECK (public.is_portal_manager());
CREATE POLICY "authority_confirmations_delete" ON public.authority_confirmations FOR DELETE TO authenticated USING (public.is_portal_manager());

-- CITIZEN CONFIRMATIONS
CREATE POLICY "citizen_confirmations_select" ON public.citizen_confirmations FOR SELECT TO authenticated USING (public.is_portal_manager());
CREATE POLICY "citizen_confirmations_insert" ON public.citizen_confirmations FOR INSERT TO authenticated WITH CHECK (public.is_portal_manager());
CREATE POLICY "citizen_confirmations_update" ON public.citizen_confirmations FOR UPDATE TO authenticated USING (public.is_portal_manager()) WITH CHECK (public.is_portal_manager());
CREATE POLICY "citizen_confirmations_delete" ON public.citizen_confirmations FOR DELETE TO authenticated USING (public.is_portal_manager());

-- CALL ATTEMPTS
CREATE POLICY "call_attempts_select" ON public.call_attempts FOR SELECT TO authenticated USING (public.is_portal_manager());
CREATE POLICY "call_attempts_insert" ON public.call_attempts FOR INSERT TO authenticated WITH CHECK (public.is_portal_manager());
CREATE POLICY "call_attempts_update" ON public.call_attempts FOR UPDATE TO authenticated USING (public.is_portal_manager()) WITH CHECK (public.is_portal_manager());
CREATE POLICY "call_attempts_delete" ON public.call_attempts FOR DELETE TO authenticated USING (public.is_portal_manager());

-- NOTIFICATION LOGS (Manager Only, Immutable)
CREATE POLICY "notification_logs_select" ON public.notification_logs FOR SELECT TO authenticated USING (public.is_portal_manager());
CREATE POLICY "notification_logs_insert" ON public.notification_logs FOR INSERT TO authenticated WITH CHECK (public.is_portal_manager());

-- TICKET HISTORY (Audit Log - All Authorized Users Can View, Manager Inserts, Immutable)
CREATE POLICY "ticket_history_select" ON public.ticket_history FOR SELECT TO authenticated USING (public.is_authorized_user());
CREATE POLICY "ticket_history_insert" ON public.ticket_history FOR INSERT TO authenticated WITH CHECK (public.is_portal_manager());

-- SYSTEM SETTINGS (Manager Only)
CREATE POLICY "system_settings_select" ON public.system_settings FOR SELECT TO authenticated USING (public.is_portal_manager());
CREATE POLICY "system_settings_insert" ON public.system_settings FOR INSERT TO authenticated WITH CHECK (public.is_portal_manager());
CREATE POLICY "system_settings_update" ON public.system_settings FOR UPDATE TO authenticated USING (public.is_portal_manager()) WITH CHECK (public.is_portal_manager());
CREATE POLICY "system_settings_delete" ON public.system_settings FOR DELETE TO authenticated USING (public.is_portal_manager());

-- COMPLAINT INTAKES (If present)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'complaint_intakes') THEN
    CREATE POLICY "complaint_intakes_select" ON public.complaint_intakes FOR SELECT TO authenticated USING (public.is_portal_manager());
    CREATE POLICY "complaint_intakes_insert" ON public.complaint_intakes FOR INSERT TO authenticated WITH CHECK (public.is_portal_manager());
    CREATE POLICY "complaint_intakes_update" ON public.complaint_intakes FOR UPDATE TO authenticated USING (public.is_portal_manager()) WITH CHECK (public.is_portal_manager());
    CREATE POLICY "complaint_intakes_delete" ON public.complaint_intakes FOR DELETE TO authenticated USING (public.is_portal_manager());
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- STEP 11: SECURE SANITIZED VIEWS FOR APPLICATION_VIEWER
-- Matches verified columns: ward_number, department_id, category_id, landmark
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.viewer_tickets
WITH (security_barrier = true, security_invoker = false)
AS
SELECT
  t.id,
  t.ticket_number,
  t.ward_number,
  t.department_id,
  t.category_id,
  t.problem_description,
  t.status,
  t.forwarding_option,
  -- Masked Citizen Phone: First 5 digits + '****' + Last 2 digits
  CASE 
    WHEN length(t.citizen_phone) >= 10 THEN
      substring(t.citizen_phone from 1 for 5) || '****' || substring(t.citizen_phone from length(t.citizen_phone)-1)
    ELSE '**********'
  END AS citizen_phone,
  -- Sanitized Citizen Name
  split_part(t.citizen_name, ' ', 1) || ' [Verified Citizen]' AS citizen_name,
  -- Redacted Residential Address, Preserving Landmark for Locality Context
  'Redacted'::text AS address,
  t.landmark,
  t.sla_hours,
  t.sla_deadline,
  t.is_overdue,
  t.is_escalated,
  t.escalation_notes,
  t.registration_time,
  t.resolution_time,
  t.closed_at
FROM public.tickets t
WHERE public.is_authorized_user();

ALTER VIEW public.viewer_tickets OWNER TO postgres;
REVOKE ALL ON public.viewer_tickets FROM anon, PUBLIC;
GRANT SELECT ON public.viewer_tickets TO authenticated;

-- Sanitized Authority Confirmations View (Matches verified columns)
CREATE OR REPLACE VIEW public.viewer_authority_confirmations
WITH (security_barrier = true, security_invoker = false)
AS
SELECT
  ac.id,
  ac.ticket_id,
  ac.officer_confirmed,
  ac.confirmed_at
FROM public.authority_confirmations ac
WHERE public.is_authorized_user();

ALTER VIEW public.viewer_authority_confirmations OWNER TO postgres;
REVOKE ALL ON public.viewer_authority_confirmations FROM anon, PUBLIC;
GRANT SELECT ON public.viewer_authority_confirmations TO authenticated;

-- Sanitized Citizen Confirmations View (Matches verified columns)
CREATE OR REPLACE VIEW public.viewer_citizen_confirmations
WITH (security_barrier = true, security_invoker = false)
AS
SELECT
  cc.id,
  cc.ticket_id,
  cc.citizen_satisfied,
  cc.confirmed_at
FROM public.citizen_confirmations cc
WHERE public.is_authorized_user();

ALTER VIEW public.viewer_citizen_confirmations OWNER TO postgres;
REVOKE ALL ON public.viewer_citizen_confirmations FROM anon, PUBLIC;
GRANT SELECT ON public.viewer_citizen_confirmations TO authenticated;

-- ------------------------------------------------------------------------------
-- STEP 12: IMMUTABLE AUDIT LOG ENFORCEMENT TRIGGERS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_audit_tampering()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Municipal audit logs are immutable. UPDATE and DELETE operations are strictly prohibited.';
END;
$$;

DROP TRIGGER IF EXISTS trg_immutable_ticket_history ON public.ticket_history;
CREATE TRIGGER trg_immutable_ticket_history
  BEFORE UPDATE OR DELETE ON public.ticket_history
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_tampering();

DROP TRIGGER IF EXISTS trg_immutable_notification_logs ON public.notification_logs;
CREATE TRIGGER trg_immutable_notification_logs
  BEFORE UPDATE OR DELETE ON public.notification_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_tampering();

-- ------------------------------------------------------------------------------
-- STEP 13: CANONICAL TICKET AUDIT LOGGING DATABASE TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auto_record_ticket_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_action text;
  v_notes text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.ticket_history (ticket_id, previous_status, new_status, action_type, notes)
    VALUES (NEW.id, NULL, NEW.status, 'TICKET_REGISTERED', 'Grievance ticket created in municipal database');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      IF NEW.status = 'RESOLVED_AWAITING_CITIZEN' THEN
        v_action := 'AUTHORITY_VERIFIED';
        v_notes := 'Department officer confirmed field resolution';
      ELSIF NEW.status = 'CLOSED' THEN
        v_action := 'CITIZEN_CONFIRMED_CLOSED';
        v_notes := 'Citizen telephonically verified satisfaction';
      ELSIF NEW.status = 'REOPENED' THEN
        v_action := 'CITIZEN_REOPENED';
        v_notes := 'Citizen reported grievance unresolved';
      ELSE
        v_action := 'STATUS_UPDATED';
        v_notes := 'Status updated from ' || OLD.status || ' to ' || NEW.status;
      END IF;

      INSERT INTO public.ticket_history (ticket_id, previous_status, new_status, action_type, notes)
      VALUES (NEW.id, OLD.status, NEW.status, v_action, v_notes);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_record_ticket_history ON public.tickets;
CREATE TRIGGER trg_auto_record_ticket_history
  AFTER INSERT OR UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_record_ticket_history();

-- ------------------------------------------------------------------------------
-- STEP 14: INITIALIZE EXISTING ACCOUNTS AS PORTAL_MANAGER
-- ------------------------------------------------------------------------------
INSERT INTO public.user_roles (id, role, is_active)
SELECT id, 'PORTAL_MANAGER'::public.app_user_role, TRUE
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET role = 'PORTAL_MANAGER'::public.app_user_role,
    is_active = TRUE;

-- Reload Supabase Schema Cache
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- END OF SCRIPT - SMART NAGAR PARISHAD CHITTORGARH V9 PRODUCTION RBAC
-- ==============================================================================
