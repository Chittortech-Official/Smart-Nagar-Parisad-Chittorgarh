# 📝 PROJECT CHANGELOG

All notable changes made to the Smart Nagar Parishad Chittorgarh project are documented in this file.

---

## [Branch: security-hardening-v1] — 2026-11-03

### Refactored (Two-Role Architecture)
- **Role System Streamlined to Exactly 2 Roles:**
  - `PORTAL_MANAGER` and `CHAIRMAN` configured with **100% identical operational authority** across all 60 wards, complaints, departments, and audit logs.
  - Purged all references to `SUPER_ADMIN`, `DEPARTMENTAL_OFFICER`, `WARD_COUNCILLOR`, and `CALL_OPERATOR` from `src/types/index.ts`, `LoginView.tsx`, and all documentation.
- **Login View Updated (`src/components/LoginView.tsx`):**
  - Added clean toggle buttons between `Portal Manager` and `Chairman`.
  - Added email trimming and format regex validation.
  - Added minimum password length check with user alert banner.
- **Database Security Redesign (`DATABASE_SECURITY_PLAN.md`):**
  - Created unified `is_authorized_manager()` security helper function.
  - Drafted RLS policies granting equal full governance to both roles.
  - Blocked anonymous bulk reads and PII harvesting completely.
  - Added secure `track_complaint` RPC lookup function.
  - Made audit tables (`ticket_history`, `call_attempts`, `notification_logs`) immutable.
- **Infrastructure & Sessions:**
  - Added `vercel.json` with strict HTTP security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
  - Added `.env*` exclusion to `.gitignore`.
  - Added 12-hour municipal shift session timeout in `src/App.tsx`.
