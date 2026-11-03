# 🛡️ STRICTLY PRIVATE DATABASE SECURITY PLAN (PORTAL_MANAGER ONLY)

**Project:** Smart Nagar Parishad Chittorgarh  
**Document Ref:** SNP-DB-SINGLE-ROLE-V4  
**Status:** DRAFTED FOR OWNER REVIEW (ZERO PRODUCTION SQL EXECUTED)  
**Access Architecture:** Strictly Private – Portal Manager Only  
**Authorized Role:** `PORTAL_MANAGER` (Exactly ONE role)  
**Target Database:** Supabase PostgreSQL (`qvrhgytkufajcpletbfp`)  

---

## 1. PROJECT OBJECTIVE & PRIVATE ACCESS ARCHITECTURE

The Smart Nagar Parishad Chittorgarh application is a **strictly private administrative portal**.

It is **NOT** a public website, citizen portal, public service platform, or public complaint management system.

### Core Architectural Principles:
1. **Exactly ONE Authorized Role (`PORTAL_MANAGER`):** The Chairman role and all other roles (`SUPER_ADMIN`, `DEPARTMENTAL_OFFICER`, `WARD_COUNCILLOR`, `CALL_OPERATOR`) have been **completely eliminated**.
2. **Zero Public/Anonymous Access:** The Supabase `anon` role is denied all access (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, RPCs) across all application tables.
3. **No Citizen-Facing Features:** No public registration, no citizen complaint submission, no public complaint tracking, and no public directory.
4. **Complete Administrative CRUD:** The authorized Portal Manager possesses 100% full governance across all 60 wards, departments, categories, tickets, confirmations, intakes, and notifications.
5. **Audit Data Integrity:** `ticket_history` and `notification_logs` are read-and-append only (immutable audit records).

---

## 2. STRICTLY PRIVATE PERMISSION MATRIX

| Table Name | `anon` (Public Visitor) | `authenticated` (Non-Manager) | `PORTAL_MANAGER` | Enforcement Rule |
|---|---|---|---|---|
| `departments` | ❌ **DENIED (0 Rows)** | ❌ **DENIED (0 Rows)** | **ALL** (Full CRUD) | Internal administrative directory. |
| `wards` | ❌ **DENIED (0 Rows)** | ❌ **DENIED (0 Rows)** | **ALL** (Full CRUD) | Internal 60-ward municipal directory. |
| `complaint_categories`| ❌ **DENIED (0 Rows)** | ❌ **DENIED (0 Rows)** | **ALL** (Full CRUD) | Internal categorization. |
| `tickets` | ❌ **DENIED (0 Rows)** | ❌ **DENIED (0 Rows)** | **ALL** (Full CRUD) | Internal municipal grievance desk. |
| `authority_confirmations` | ❌ **DENIED (0 Rows)** | ❌ **DENIED (0 Rows)** | **ALL** (Full CRUD) | Officer field sign-off records. |
| `citizen_confirmations` | ❌ **DENIED (0 Rows)** | ❌ **DENIED (0 Rows)** | **ALL** (Full CRUD) | Citizen satisfaction verification desk. |
| `call_attempts` | ❌ **DENIED (0 Rows)** | ❌ **DENIED (0 Rows)** | **ALL** (Full CRUD) | Telephonic intake desk logs. |
| `ticket_history` | ❌ **DENIED (0 Rows)** | ❌ **DENIED (0 Rows)** | **SELECT, INSERT** | Status audit trail (Immutable: UPDATE/DELETE blocked). |
| `notification_logs` | ❌ **DENIED (0 Rows)** | ❌ **DENIED (0 Rows)** | **SELECT, INSERT** | WhatsApp & SMS logs (Immutable: UPDATE/DELETE blocked). |
| `system_settings` | ❌ **DENIED (0 Rows)** | ❌ **DENIED (0 Rows)** | **ALL** (Full CRUD) | Internal system configuration. |
| `user_profiles` | ❌ **DENIED (0 Rows)** | **SELECT (Own Profile)** | **SELECT (Own Profile)** | Protected RBAC profiles linked to `auth.users`. |

---

## 3. READY-TO-EXECUTE PRODUCTION SQL POLICIES

The complete migration script is provided in [`RLS_POLICIES.sql`](file:///e:/Chittortech%20Projects/Nagar%20Palika%20System/RLS_POLICIES.sql).

### Key Features:
- **`user_profiles` Table:** Enforces role verification directly linked to `auth.users(id)`.
- **`is_authorized_manager()` Helper Function:** `SECURITY DEFINER` function with pinned `search_path = public, pg_temp` checking `role = 'PORTAL_MANAGER'` and `is_active = true`.
- **Complete Revocation from `anon`:** Blocks all table reads, inserts, updates, deletes, and RPC executions.
- **Audit Immutability:** Preserves integrity by blocking UPDATE and DELETE on audit log tables.

---

## 4. SAFE STAGING MIGRATION & VERIFICATION PLAN

1. **Phase 1: Verification in Staging:**
   - Run `RLS_POLICIES.sql` against staging Supabase project.
   - Test anonymous curl requests to verify 100% rejection (HTTP 401/403 or empty rows).
   - Test authorized `PORTAL_MANAGER` login and full CRUD.
2. **Phase 2: Owner Authorization:**
   - Owner explicitly reviews and confirms execution on production (`qvrhgytkufajcpletbfp`).
3. **Phase 3: Rollback Plan:**
   - If unexpected issues arise, execute `ROLLBACK_RLS.sql` to revert to baseline without dropping user data.
