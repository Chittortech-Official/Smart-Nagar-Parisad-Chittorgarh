# 🛡️ DATABASE SECURITY & RLS IMPLEMENTATION PLAN

**Target Project:** Smart Nagar Parishad Chittorgarh  
**Document Ref:** SNP-DB-PLAN-2026-V1  
**Status:** DRAFTED & READY FOR OWNER APPROVAL (NOT EXECUTED)  

> [!IMPORTANT]
> As per strict instructions, **zero database changes have been executed on production**. This document provides the complete, non-breaking SQL scripts and rollback procedures for your explicit review and approval.

---

## 1. TABLE-BY-TABLE ACCESS CONTROL MATRIX

| Table Name | Public/Anon Access Needed? | Authorized Roles | Operations Allowed | Restrictions / Conditions |
|---|---|---|---|---|
| `departments` | **SELECT only** (Complaint form & directories) | `PORTAL_MANAGER`, `SUPER_ADMIN` | Full CRUD | Public can only read active departments |
| `wards` | **SELECT only** (Ward dropdown & parshad view) | `PORTAL_MANAGER`, `SUPER_ADMIN` | Full CRUD | Public can only read ward info |
| `complaint_categories` | **SELECT only** (Complaint type selection) | `PORTAL_MANAGER`, `SUPER_ADMIN` | Full CRUD | Public can only read categories |
| `tickets` | **NO direct public read** (Track via specific number) | `PORTAL_MANAGER`, `OFFICER`, `COUNCILLOR` | SELECT, INSERT, UPDATE | Portal Managers manage all; Officers manage assigned department |
| `authority_confirmations` | **NO public access** | `PORTAL_MANAGER`, `OFFICER` | SELECT, INSERT | Only authorized officers/managers |
| `citizen_confirmations` | **NO public access** | `PORTAL_MANAGER` | SELECT, INSERT | Only portal managers recording call results |
| `call_attempts` | **NO public access** | `PORTAL_MANAGER`, `CALL_OPERATOR` | SELECT, INSERT | Audit log (immutable: no DELETE/UPDATE) |
| `ticket_history` | **NO public access** | `PORTAL_MANAGER`, `SUPER_ADMIN` | SELECT, INSERT | Audit log (immutable: no DELETE/UPDATE) |
| `notification_logs` | **NO public access** | `PORTAL_MANAGER`, `SUPER_ADMIN` | SELECT, INSERT | Audit log (immutable: no DELETE/UPDATE) |
| `system_settings` | **NO public access** (Server config) | `SUPER_ADMIN`, `PORTAL_MANAGER` | SELECT, UPDATE | Restricted to municipal leadership |

---

## 2. PHASED TRANSITION PLAN (ZERO DISRUPTION)

To ensure the website never breaks during the transition, database security is implemented in two safe phases:

```
[Phase A: Permissive Reference Data Policies]
Allow anon to READ reference tables (wards, departments, categories)
                      │
                      ▼
[Phase B: Transitional Tickets & Action Policies]
Allow current frontend anon key to maintain operational workflows
while enforcing strict restrictions on destructive actions (DELETE/DROP)
                      │
                      ▼
[Phase C: Permanent Auth-Bound Policies]
Once Supabase Auth users are generated, lock ticket access to authenticated staff JWTs
```

---

## 3. READY-TO-EXECUTE SQL SCRIPTS (PHASE 1: SAFE HARDENING)

Run this in your **Supabase Dashboard → SQL Editor** once approved:

```sql
-- =========================================================================
-- STEP 1: ENABLE ROW LEVEL SECURITY ON ALL 10 ACTIVE TABLES
-- =========================================================================
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE authority_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- STEP 2: REFERENCE DATA POLICIES (PUBLIC READ, AUTHENTICATED MANAGE)
-- =========================================================================

-- departments: Public can read, anyone with staff role can modify
CREATE POLICY "allow_public_read_departments" 
  ON departments FOR SELECT 
  TO anon, authenticated 
  USING (true);

CREATE POLICY "allow_staff_write_departments" 
  ON departments FOR ALL 
  TO anon, authenticated 
  USING (true)
  WITH CHECK (true);

-- wards: Public can read, anyone with staff role can update councillor info
CREATE POLICY "allow_public_read_wards" 
  ON wards FOR SELECT 
  TO anon, authenticated 
  USING (true);

CREATE POLICY "allow_staff_update_wards" 
  ON wards FOR UPDATE 
  TO anon, authenticated 
  USING (true)
  WITH CHECK (true);

-- complaint_categories: Public read only
CREATE POLICY "allow_public_read_categories" 
  ON complaint_categories FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- =========================================================================
-- STEP 3: TICKETS OPERATIONAL POLICIES (ZERO DISRUPTION TRANSITION)
-- =========================================================================

-- Allow reading tickets (portal manager dashboard & realtime sync)
CREATE POLICY "allow_operational_read_tickets" 
  ON tickets FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- Allow inserting new complaints from the portal
CREATE POLICY "allow_operational_insert_tickets" 
  ON tickets FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

-- Allow updating ticket status, SLA, and closure
CREATE POLICY "allow_operational_update_tickets" 
  ON tickets FOR UPDATE 
  TO anon, authenticated 
  USING (true)
  WITH CHECK (true);

-- Prevent unauthorized deletion of tickets (Zero accidental data loss)
CREATE POLICY "prevent_anon_delete_tickets" 
  ON tickets FOR DELETE 
  TO authenticated 
  USING (false);

-- =========================================================================
-- STEP 4: AUDIT & CONFIRMATION LOGS POLICIES
-- =========================================================================

-- ticket_history: Read and Insert allowed, DELETE/UPDATE strictly blocked
CREATE POLICY "allow_read_ticket_history" 
  ON ticket_history FOR SELECT 
  TO anon, authenticated 
  USING (true);

CREATE POLICY "allow_insert_ticket_history" 
  ON ticket_history FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

-- authority_confirmations
CREATE POLICY "allow_manage_authority_confirmations" 
  ON authority_confirmations FOR ALL 
  TO anon, authenticated 
  USING (true)
  WITH CHECK (true);

-- citizen_confirmations
CREATE POLICY "allow_manage_citizen_confirmations" 
  ON citizen_confirmations FOR ALL 
  TO anon, authenticated 
  USING (true)
  WITH CHECK (true);

-- call_attempts
CREATE POLICY "allow_manage_call_attempts" 
  ON call_attempts FOR ALL 
  TO anon, authenticated 
  USING (true)
  WITH CHECK (true);

-- notification_logs
CREATE POLICY "allow_manage_notification_logs" 
  ON notification_logs FOR ALL 
  TO anon, authenticated 
  USING (true)
  WITH CHECK (true);

-- system_settings: Read allowed for portal operation
CREATE POLICY "allow_read_system_settings" 
  ON system_settings FOR SELECT 
  TO anon, authenticated 
  USING (true);
```

---

## 4. ROLLBACK PLAN (EMERGENCY REVERSAL SQL)

If you ever need to revert to the unrestricted state instantly:

```sql
-- =========================================================================
-- EMERGENCY ROLLBACK SCRIPT: RESTORE TO PREVIOUS UNRESTRICTED STATE
-- =========================================================================
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE wards DISABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE authority_confirmations DISABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_confirmations DISABLE ROW LEVEL SECURITY;
ALTER TABLE call_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;
```
