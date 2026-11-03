# 📝 CHANGELOG

## [Security-Hardening-V1] - 03 November 2026

### Added
- Created `RLS_POLICIES.sql` providing comprehensive, strictly private Row Level Security policies for all 10 production tables.
- Added protected `user_profiles` schema linked to `auth.users` with `is_authorized_manager()` security definer function.
- Implemented strict 2-account email whitelist in frontend login and root session guard.
- Added `Loader2` authentication spinner and security alert badges.
- Configured HTTP security headers in `vercel.json` (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).

### Changed
- Replaced mock login with real Supabase Auth `signInWithPassword`.
- Redesigned login screen to eliminate username and role enumeration (no role cards, no prefilled emails or passwords).
- Purged all Chairman role references, types, banners, and policies from the entire codebase.
- Enforced single `PORTAL_MANAGER` role across `types/index.ts`, `LoginView.tsx`, `App.tsx`, and `DashboardView.tsx`.
- Updated all documentation files to reflect the strictly private, single-role Portal Manager architecture.

### Removed
- Removed `CHAIRMAN` from `UserRole` union.
- Removed legacy public complaint tracking and anonymous policy proposals.
