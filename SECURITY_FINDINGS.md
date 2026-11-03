# 🔒 SECURITY FINDINGS MATRIX (TWO-ROLE ARCHITECTURE)

**Project:** Smart Nagar Parishad Chittorgarh  
**Document Ref:** SNP-SEC-FINDINGS-TWO-ROLE-V2  
**Authorized Roles:** `PORTAL_MANAGER`, `CHAIRMAN` (Equal Privileges)  
**Removed Roles:** `SUPER_ADMIN`, `DEPARTMENTAL_OFFICER`, `WARD_COUNCILLOR`, `CALL_OPERATOR` (Completely purged)  

---

## 1. COMPREHENSIVE FINDINGS MATRIX

| Finding ID | Vulnerability / Issue | Component | Evidence | Severity | Remediation | Status |
|---|---|---|---|---|---|---|
| **SEC-01** | Root Service Role Key Committed in Public Git | `.env` | Git commits `df1c7ee` & `d6c51c0` | 🔴 **CRITICAL** | Rotate secret key in Supabase Dashboard; purge history with BFG | Requires Owner Action |
| **SEC-02** | Zero RLS on All Live Database Tables | Supabase Database | Anonymous PostgREST allows unrestricted CRUD | 🔴 **CRITICAL** | Deploy clean 2-Role RLS policies from `DATABASE_SECURITY_PLAN.md` | Ready (Approval Needed) |
| **SEC-03** | Frontend-Only Authentication | `LoginView.tsx` | Password not verified on backend | 🔴 **CRITICAL** | Connect `LoginView.tsx` to Supabase Auth for Portal Manager & Chairman | Drafted & Tested |
| **SEC-04** | Missing HTTP Security Headers | Vercel Deployment | Live response missing CSP, X-Frame-Options | 🟠 **HIGH** | Added `vercel.json` with strict security headers | ✅ Fixed on Branch |
| **SEC-05** | `.gitignore` Missing Rule for `.env` | `.gitignore` | `.gitignore` lacked `.env` pattern | 🟡 **MEDIUM** | Added `.env*` to `.gitignore` | ✅ Fixed on Branch |
| **SEC-06** | Indefinite Session Reuse in LocalStorage | `src/App.tsx` | Session never expired | 🟠 **HIGH** | Added 12-hour municipal shift session timeout | ✅ Fixed on Branch |
| **SEC-07** | Citizen PII Stored in Browser LocalStorage | `src/App.tsx` | Full tickets JSON saved in localStorage | 🟠 **HIGH** | Minimize PII persistence; rely on live authenticated state | Transition Planned |
| **SEC-08** | Client-Only Device Width Enforcement | `SecurityDeviceGuard.tsx` | Window width <1024px bypassable via DevTools | 🟢 **LOW** | Treat as UX guidance; enforce server-side security | Documented |
| **SEC-09** | Missing Schema Tables in Database | `schema.sql` vs DB | `user_profiles` & `complaint_intakes` return 404 | 🟡 **MEDIUM** | Create 2-role `user_profiles` table cleanly in DB | In Database Plan |
| **SEC-10** | WhatsApp API Config Exposed in System Settings | `system_settings` table | Publicly queryable via PostgREST | 🟡 **MEDIUM** | Restrict table to Portal Manager & Chairman only | In Database Plan |

---

## 2. TWO-ROLE SECURITY POSTURE

* **Unified Municipal Governance:** Both `PORTAL_MANAGER` and `CHAIRMAN` have equal, non-fragmented oversight across all 60 wards.
* **No Departmental Barriers:** Staff are not blocked by artificial departmental restrictions; both leaders can verify complaints across sanitation, electrical, roads, drainage, waterlogging, and encroachment.
* **Hermetic Citizen Data Shield:** Anonymous callers are completely blocked from reading complaints, phone numbers, or addresses.
