# 🔒 SECURITY FINDINGS MATRIX

**Project:** Smart Nagar Parishad Chittorgarh  
**Document Ref:** SNP-SEC-FINDINGS-2026-V1  
**Classification:** Confidential Security Audit  

---

## 1. COMPREHENSIVE FINDINGS MATRIX

| Finding ID | Title / Vulnerability | Component | Evidence | Severity | Remediation | Status |
|---|---|---|---|---|---|---|
| **SEC-01** | Root Service Role Key Committed in Public Git | `.env` | Git commit `df1c7ee` and `d6c51c0` | 🔴 **CRITICAL** | Rotate secret key in Supabase Dashboard; purge history with BFG | Requires Owner Action |
| **SEC-02** | Zero Row-Level Security on All Live Tables | Supabase Database | PostgREST allows unrestricted anonymous GET, POST, PATCH | 🔴 **CRITICAL** | Enable RLS and deploy role-specific policies | Ready (Approval Needed) |
| **SEC-03** | Cosmetic Frontend Login (No Backend Auth) | `LoginView.tsx` | Password discarded; role hardcoded | 🔴 **CRITICAL** | Migrate to `supabase.auth.signInWithPassword()` | Proposed |
| **SEC-04** | Missing HTTP Security Headers | Vercel Deployment | Live response missing CSP, X-Frame-Options | 🟠 **HIGH** | Added `vercel.json` with security headers | ✅ Fixed on Branch |
| **SEC-05** | `.gitignore` Missing Rule for `.env` | `.gitignore` | `.gitignore` lacked `.env` pattern | 🟡 **MEDIUM** | Added `.env*` to `.gitignore` | ✅ Fixed on Branch |
| **SEC-06** | Indefinite Session Reuse in LocalStorage | `src/App.tsx` | Session never expired | 🟠 **HIGH** | Added 12-hour municipal shift session timeout | ✅ Fixed on Branch |
| **SEC-07** | Citizen PII Stored in Browser LocalStorage | `src/App.tsx` | Full tickets JSON saved in localStorage | 🟠 **HIGH** | Minimize PII persistence; rely on live authenticated state | Proposed |
| **SEC-08** | Client-Only Device Width Enforcement | `SecurityDeviceGuard.tsx` | Window width <1024px bypassable via DevTools | 🟢 **LOW** | Treat as UX guidance; enforce server-side security | Documented |
| **SEC-09** | Missing Schema Tables in Database | `schema.sql` vs DB | `user_profiles` & `complaint_intakes` return 404 | 🟡 **MEDIUM** | Run missing migrations safely | Approval Required |
| **SEC-10** | WhatsApp API Config Exposed in System Settings | `system_settings` table | Publicly queryable via PostgREST | 🟡 **MEDIUM** | Restrict table access to authenticated admins | In Database Plan |

---

## 2. DETAILED FINDING PROFILES

### SEC-01: Exposed Service Role Key
- **Risk:** Complete database compromise. The key grants root access that bypasses RLS and can delete or export all records.
- **Root Cause:** Committing `.env` to a public repository without proper `.gitignore` rules.
- **Action Required:** Immediate credential rotation in the Supabase Dashboard.

### SEC-02: RLS Disabled Across Tables
- **Risk:** Any visitor with the public `anon` key can read, insert, modify, or delete any record in the 10 live database tables.
- **Remediation:** Apply `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` and create granular SELECT/INSERT/UPDATE/DELETE policies. (See `DATABASE_SECURITY_PLAN.md`).

### SEC-03: Frontend-Only Authentication
- **Risk:** Anyone visiting the portal can click "Sign In" and access Portal Manager controls without knowing any password.
- **Remediation:** Connect `LoginView.tsx` to Supabase Auth so that users authenticate against verified server-side hashes.

