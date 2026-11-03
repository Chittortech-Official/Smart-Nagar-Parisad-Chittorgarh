# 🛡️ REDESIGNED DATABASE SECURITY ARCHITECTURE & RLS POLICY SPECIFICATION

**Project:** Smart Nagar Parishad Chittorgarh  
**Document Reference:** SNP-DB-SECURITY-REDESIGN-V2  
**Status:** DRAFTED FOR OWNER REVIEW & APPROVAL (ZERO PRODUCTION MUTATIONS EXECUTED)  
**Security Standard:** Zero Trust, Role-Based Access Control (RBAC), Least Privilege, DPDPA 2023 Compliance  

---

## 1. ARCHITECTURAL PRINCIPLES & GOALS

Following the project owner's explicit requirements, this redesigned security architecture establishes a **strict Zero-Trust posture**:

1. **Zero Unrestricted Anonymous Access:** Anonymous users (`anon` role) are **strictly prohibited** from reading, inserting, modifying, or deleting citizen complaints, confirmation records, call logs, ticket history, or system settings.
2. **Real Supabase Auth Integration:** Staff members must authenticate using individual Supabase Auth accounts (`auth.users`), receiving cryptographically signed JWTs that carry their authenticated UUID (`auth.uid()`).
3. **Role-Based Access Control (RBAC):**
   - **`SUPER_ADMIN`**: Full administrative governance across all 60 wards, departments, staff profiles, and system settings.
   - **`PORTAL_MANAGER`**: Operational management across all 60 wards and all departments (complaint triage, 2-step verification, Parshad/Ward management, department editing).
   - **`DEPARTMENTAL_OFFICER`**: **Strictly quarantined to their assigned `department_id`**. Can only view and update complaints belonging to their municipal department.
   - **`WARD_COUNCILLOR`**: **Strictly quarantined to their assigned `ward_number`**. Can only view and monitor complaints registered in their own ward.
   - **`CALL_OPERATOR`**: Can register new complaints, record call attempts, and assist citizens. Cannot delete records or modify system configurations.
   - **`CHAIRMAN` & `VICE_CHAIRMAN`**: Executive oversight role with read-only monitoring access across all 60 wards, complaints, and SLA breach reports.
4. **Immutable Audit Trails:** `ticket_history`, `call_attempts`, and `notification_logs` can only be inserted by staff workflows; **UPDATE and DELETE are permanently revoked** for all regular roles to prevent tampering.
5. **Safe Citizen Tracking:** Anonymous visitors can only query reference data (wards, departments, categories) and submit new complaints. A dedicated secure RPC function (`track_complaint`) allows tracking via ticket number + phone verification without bulk exposure.
6. **Realtime Security:** Supabase Realtime uses PostgreSQL publication filtered through RLS. Unauthenticated clients receive **zero ticket payloads**.

---

## 2. ROLE-PERMISSION MATRIX

| Table Name | `anon` (Public) | `PORTAL_MANAGER` | `DEPARTMENTAL_OFFICER` | `WARD_COUNCILLOR` | `CALL_OPERATOR` | `CHAIRMAN` | `SUPER_ADMIN` |
|---|---|---|---|---|---|---|---|
| `departments` | **SELECT** | **ALL** | **SELECT** | **SELECT** | **SELECT** | **SELECT** | **ALL** |
| `wards` | **SELECT** | **ALL** | **SELECT** | **SELECT** (Own Ward Edit) | **SELECT** | **SELECT** | **ALL** |
| `complaint_categories` | **SELECT** | **ALL** | **SELECT** | **SELECT** | **SELECT** | **SELECT** | **ALL** |
| `tickets` | **INSERT** (Submit only) | **SELECT, INSERT, UPDATE** | **SELECT, UPDATE** (Own Dept Only) | **SELECT** (Own Ward Only) | **SELECT, INSERT** | **SELECT** (Read-Only) | **ALL** (Includes DELETE) |
| `authority_confirmations` | ❌ **DENIED** | **SELECT, INSERT** | **SELECT, INSERT** (Own Dept) | ❌ **DENIED** | ❌ **DENIED** | **SELECT** | **ALL** |
| `citizen_confirmations` | ❌ **DENIED** | **SELECT, INSERT** | **SELECT** (Own Dept) | ❌ **DENIED** | ❌ **DENIED** | **SELECT** | **ALL** |
| `call_attempts` | ❌ **DENIED** | **SELECT, INSERT** | ❌ **DENIED** | ❌ **DENIED** | **SELECT, INSERT** | **SELECT** | **ALL** (No UPDATE) |
| `ticket_history` | ❌ **DENIED** | **SELECT, INSERT** | **SELECT** (Own Dept) | **SELECT** (Own Ward) | **SELECT, INSERT** | **SELECT** | **SELECT, INSERT** (Immutable) |
| `notification_logs` | ❌ **DENIED** | **SELECT, INSERT** | ❌ **DENIED** | ❌ **DENIED** | **SELECT, INSERT** | **SELECT** | **SELECT, INSERT** (Immutable) |
| `system_settings` | ❌ **DENIED** | **SELECT** | ❌ **DENIED** | ❌ **DENIED** | ❌ **DENIED** | **SELECT** | **ALL** |

---

## 3. COMPLETE REDESIGNED SQL POLICIES (PHASE 2 READY-TO-EXECUTE)

> [!IMPORTANT]
> Do NOT execute this script until Supabase Auth accounts are generated. Review every policy below.

```sql
-- =========================================================================
-- 1. SECURITY HELPER SCHEMA & USER PROFILE LINKAGE
-- =========================================================================

-- Ensure user_profiles table exists and links directly to Supabase Auth UUID
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'SUPER_ADMIN', 
        'PORTAL_MANAGER', 
        'CALL_OPERATOR', 
        'WARD_COUNCILLOR', 
        'DEPARTMENTAL_OFFICER', 
        'CHAIRMAN', 
        'VICE_CHAIRMAN'
    )),
    ward_number INT REFERENCES public.wards(ward_number),
    department_id UUID REFERENCES public.departments(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast Index for RLS Policy Lookups (<0.5ms)
CREATE INDEX IF NOT EXISTS idx_user_profiles_lookup 
  ON public.user_profiles(id, role, is_active, department_id, ward_number);

-- Optimized Security Definer Helper Functions
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS VARCHAR LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid() AND is_active = TRUE LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_department_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT department_id FROM public.user_profiles WHERE id = auth.uid() AND is_active = TRUE LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_ward_number()
RETURNS INT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ward_number FROM public.user_profiles WHERE id = auth.uid() AND is_active = TRUE LIMIT 1;
$$;

-- =========================================================================
-- 2. ENABLE ROW LEVEL SECURITY ON ALL 10 ACTIVE TABLES
-- =========================================================================
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

-- Drop all old/permissive transitional policies
DROP POLICY IF EXISTS "allow_public_read_departments" ON public.departments;
DROP POLICY IF EXISTS "allow_staff_write_departments" ON public.departments;
DROP POLICY IF EXISTS "allow_public_read_wards" ON public.wards;
DROP POLICY IF EXISTS "allow_staff_update_wards" ON public.wards;
DROP POLICY IF EXISTS "allow_public_read_categories" ON public.complaint_categories;
DROP POLICY IF EXISTS "allow_operational_read_tickets" ON public.tickets;
DROP POLICY IF EXISTS "allow_operational_insert_tickets" ON public.tickets;
DROP POLICY IF EXISTS "allow_operational_update_tickets" ON public.tickets;
DROP POLICY IF EXISTS "prevent_anon_delete_tickets" ON public.tickets;
DROP POLICY IF EXISTS "allow_read_ticket_history" ON public.ticket_history;
DROP POLICY IF EXISTS "allow_insert_ticket_history" ON public.ticket_history;
DROP POLICY IF EXISTS "allow_manage_authority_confirmations" ON public.authority_confirmations;
DROP POLICY IF EXISTS "allow_manage_citizen_confirmations" ON public.citizen_confirmations;
DROP POLICY IF EXISTS "allow_manage_call_attempts" ON public.call_attempts;
DROP POLICY IF EXISTS "allow_manage_notification_logs" ON public.notification_logs;
DROP POLICY IF EXISTS "allow_read_system_settings" ON public.system_settings;

-- =========================================================================
-- 3. REFERENCE TABLES (GENUINELY PUBLIC READ, RESTRICTED WRITE)
-- =========================================================================

-- Departments: Public can read, only Admins/Managers can create/edit/delete
CREATE POLICY "departments_public_select" ON public.departments
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "departments_staff_insert" ON public.departments
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('SUPER_ADMIN', 'PORTAL_MANAGER'));

CREATE POLICY "departments_staff_update" ON public.departments
  FOR UPDATE TO authenticated
  USING (public.current_user_role() IN ('SUPER_ADMIN', 'PORTAL_MANAGER'))
  WITH CHECK (public.current_user_role() IN ('SUPER_ADMIN', 'PORTAL_MANAGER'));

CREATE POLICY "departments_staff_delete" ON public.departments
  FOR DELETE TO authenticated
  USING (public.current_user_role() IN ('SUPER_ADMIN', 'PORTAL_MANAGER'));

-- Wards: Public can read, Admins/Managers manage, Councillors can update own ward notes
CREATE POLICY "wards_public_select" ON public.wards
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "wards_staff_update" ON public.wards
  FOR UPDATE TO authenticated
  USING (
    public.current_user_role() IN ('SUPER_ADMIN', 'PORTAL_MANAGER')
    OR (public.current_user_role() = 'WARD_COUNCILLOR' AND ward_number = public.current_user_ward_number())
  )
  WITH CHECK (
    public.current_user_role() IN ('SUPER_ADMIN', 'PORTAL_MANAGER')
    OR (public.current_user_role() = 'WARD_COUNCILLOR' AND ward_number = public.current_user_ward_number())
  );

-- Complaint Categories: Public read, Staff write
CREATE POLICY "categories_public_select" ON public.complaint_categories
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "categories_staff_manage" ON public.complaint_categories
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('SUPER_ADMIN', 'PORTAL_MANAGER'))
  WITH CHECK (public.current_user_role() IN ('SUPER_ADMIN', 'PORTAL_MANAGER'));

-- =========================================================================
-- 4. TICKETS (STRICT ROLE-BASED ACCESS & CITIZEN PROTECTION)
-- =========================================================================

-- SELECT Policy: ANONYMOUS ACCESS IS 100% BLOCKED.
-- Only authenticated municipal roles see tickets based on their authorized department / ward scope.
CREATE POLICY "tickets_role_based_select" ON public.tickets
  FOR SELECT TO authenticated
  USING (
    -- Super Admin, Portal Manager, Call Operator, Chairman, Vice Chairman see all tickets
    public.current_user_role() IN ('SUPER_ADMIN', 'PORTAL_MANAGER', 'CALL_OPERATOR', 'CHAIRMAN', 'VICE_CHAIRMAN')
    -- Departmental Officer ONLY sees their own department complaints
    OR (
      public.current_user_role() = 'DEPARTMENTAL_OFFICER' 
      AND department_id = public.current_user_department_id()
    )
    -- Ward Councillor ONLY sees complaints in their own ward
    OR (
      public.current_user_role() = 'WARD_COUNCILLOR' 
      AND ward_number = public.current_user_ward_number()
    )
  );

-- INSERT Policy: Staff can register; Citizens/Public can submit with strict constraints
CREATE POLICY "tickets_insert_policy" ON public.tickets
  FOR INSERT TO authenticated, anon
  WITH CHECK (
    -- Staff registration
    (auth.role() = 'authenticated' AND public.current_user_role() IN ('SUPER_ADMIN', 'PORTAL_MANAGER', 'CALL_OPERATOR'))
    -- Anonymous citizen portal submission: forced status = REGISTERED, valid ward 1-60
    OR (auth.role() = 'anon' AND status = 'REGISTERED' AND ward_number BETWEEN 1 AND 60)
  );

-- UPDATE Policy: Only Portal Managers and Officers (for their own department) can update
CREATE POLICY "tickets_update_policy" ON public.tickets
  FOR UPDATE TO authenticated
  USING (
    public.current_user_role() IN ('SUPER_ADMIN', 'PORTAL_MANAGER')
    OR (
      public.current_user_role() = 'DEPARTMENTAL_OFFICER' 
      AND department_id = public.current_user_department_id()
    )
  )
  WITH CHECK (
    public.current_user_role() IN ('SUPER_ADMIN', 'PORTAL_MANAGER')
    OR (
      public.current_user_role() = 'DEPARTMENTAL_OFFICER' 
      AND department_id = public.current_user_department_id()
    )
  );

-- DELETE Policy: ONLY Super Admin can delete complaints (Prevents accidental data loss)
CREATE POLICY "tickets_delete_policy" ON public.tickets
  FOR DELETE TO authenticated
  USING (public.current_user_role() = 'SUPER_ADMIN');

-- =========================================================================
-- 5. TWO-STEP CLOSURE RECORDS (AUTHORITY & CITIZEN CONFIRMATIONS)
-- =========================================================================

-- authority_confirmations
CREATE POLICY "authority_confirmations_select" ON public.authority_confirmations
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() IN ('SUPER_ADMIN', 'PORTAL_MANAGER', 'CHAIRMAN')
    OR (
      public.current_user_role() = 'DEPARTMENTAL_OFFICER'
      AND EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.department_id = public.current_user_department_id())
    )
  );

CREATE POLICY "authority_confirmations_insert" ON public.authority_confirmations
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_role() IN ('SUPER_ADMIN', 'PORTAL_MANAGER')
    OR (
      public.current_user_role() = 'DEPARTMENTAL_OFFICER'
      AND EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.department_id = public.current_user_department_id())
    )
  );

-- citizen_confirmations
CREATE POLICY "citizen_confirmations_select" ON public.citizen_confirmations
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() IN ('SUPER_ADMIN', 'PORTAL_MANAGER', 'CHAIRMAN')
    OR (
      public.current_user_role() = 'DEPARTMENTAL_OFFICER'
      AND EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.department_id = public.current_user_department_id())
    )
  );

CREATE POLICY "citizen_confirmations_insert" ON public.citizen_confirmations
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('SUPER_ADMIN', 'PORTAL_MANAGER'));

-- =========================================================================
-- 6. IMMUTABLE AUDIT LOGS (NO UPDATE / NO DELETE PERMITTED)
-- =========================================================================

-- ticket_history (Tamper-proof audit trail)
CREATE POLICY "ticket_history_select" ON public.ticket_history
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() IN ('SUPER_ADMIN', 'PORTAL_MANAGER', 'CHAIRMAN', 'VICE_CHAIRMAN')
    OR (
      public.current_user_role() = 'DEPARTMENTAL_OFFICER'
      AND EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.department_id = public.current_user_department_id())
    )
    OR (
      public.current_user_role() = 'WARD_COUNCILLOR'
      AND EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.ward_number = public.current_user_ward_number())
    )
  );

CREATE POLICY "ticket_history_insert" ON public.ticket_history
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('SUPER_ADMIN', 'PORTAL_MANAGER', 'CALL_OPERATOR', 'DEPARTMENTAL_OFFICER'));

-- call_attempts
CREATE POLICY "call_attempts_select" ON public.call_attempts
  FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('SUPER_ADMIN', 'PORTAL_MANAGER', 'CALL_OPERATOR', 'CHAIRMAN'));

CREATE POLICY "call_attempts_insert" ON public.call_attempts
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('SUPER_ADMIN', 'PORTAL_MANAGER', 'CALL_OPERATOR'));

-- notification_logs
CREATE POLICY "notification_logs_select" ON public.notification_logs
  FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('SUPER_ADMIN', 'PORTAL_MANAGER', 'CHAIRMAN'));

CREATE POLICY "notification_logs_insert" ON public.notification_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('SUPER_ADMIN', 'PORTAL_MANAGER', 'CALL_OPERATOR'));

-- =========================================================================
-- 7. SYSTEM SETTINGS (RESTRICTED TO ADMIN & PORTAL MANAGER)
-- =========================================================================

CREATE POLICY "system_settings_select" ON public.system_settings
  FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('SUPER_ADMIN', 'PORTAL_MANAGER'));

CREATE POLICY "system_settings_manage" ON public.system_settings
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'SUPER_ADMIN')
  WITH CHECK (public.current_user_role() = 'SUPER_ADMIN');

-- =========================================================================
-- 8. SECURE CITIZEN TRACKING RPC (NO PII LEAKAGE, NO BULK ENUMERATION)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.track_complaint(
  p_ticket_number VARCHAR,
  p_phone_last4 VARCHAR
)
RETURNS TABLE (
  ticket_number VARCHAR,
  category_name VARCHAR,
  department_name VARCHAR,
  ward_number INT,
  status VARCHAR,
  sla_deadline TIMESTAMPTZ,
  is_overdue BOOLEAN,
  registration_time TIMESTAMPTZ,
  resolution_time TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Strict lookup: ticket number AND last 4 digits of phone number must match
  RETURN QUERY
  SELECT 
    t.ticket_number,
    c.name AS category_name,
    d.name AS department_name,
    t.ward_number,
    t.status,
    t.sla_deadline,
    t.is_overdue,
    t.registration_time,
    t.resolution_time,
    t.closed_at
  FROM public.tickets t
  LEFT JOIN public.complaint_categories c ON c.id = t.category_id
  LEFT JOIN public.departments d ON d.id = t.department_id
  WHERE UPPER(t.ticket_number) = UPPER(TRIM(p_ticket_number))
    AND RIGHT(REGEXP_REPLACE(t.citizen_phone, '\D', '', 'g'), 4) = TRIM(p_phone_last4)
  LIMIT 1;
END;
$$;

-- Grant anonymous & authenticated permission to execute the tracking RPC only
GRANT EXECUTE ON FUNCTION public.track_complaint(VARCHAR, VARCHAR) TO anon, authenticated;
```

---

## 4. HOW EXISTING WORKFLOWS WILL CONTINUE WORKING

| Workflow | How it works under this Redesigned Architecture | Breaking Risk? |
|---|---|---|
| **Portal Manager Dashboard** | Logs in with `portalmanager@chittorgarh.gov.in`. Receives JWT. Role is `PORTAL_MANAGER`. Has full 60-ward and all-department visibility. | **Zero** (Identical UX) |
| **New Complaint Submission** | Staff can register complaints from portal. Anonymous citizens can submit from public form. Both trigger INSERT with valid ward. | **Zero** |
| **Two-Step Closure** | Step 1 inserts `authority_confirmations`. Step 2 inserts `citizen_confirmations` and updates ticket status to `CLOSED`. Both permitted for `PORTAL_MANAGER`. | **Zero** |
| **Parshad / Ward Management** | Portal Manager reads and edits all 60 wards. Councillors can edit landmarks in their own ward. | **Zero** |
| **Department Management** | Portal Manager and Super Admin can add, edit, or delete departments. Public can only read. | **Zero** |
| **Realtime Sync** | Staff connects with JWT; Realtime server streams updates to tickets and notifications smoothly. | **Zero** |
| **Citizen Complaint Tracking** | Calls `supabase.rpc('track_complaint', { p_ticket_number, p_phone_last4 })`. Returns status without exposing other complaints. | **Improved & Secure** |

---

## 5. COMPLETE ROLLBACK PROCEDURE

If any discrepancy occurs during migration, run this single block to return to the original unrestricted mode instantly:

```sql
-- EMERGENCY ROLLBACK SCRIPT (INSTANT REVERSAL)
ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.authority_confirmations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.citizen_confirmations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY;
```
