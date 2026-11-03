# 📝 PROJECT CHANGELOG

All notable changes made to the Smart Nagar Parishad Chittorgarh project are documented in this file.

---

## [Branch: security-hardening-v1] — 2026-11-03

### Added
- **`vercel.json` (Security Headers & SPA Routing):**
  - Added `X-Frame-Options: DENY` to completely eliminate Clickjacking vulnerabilities.
  - Added `X-Content-Type-Options: nosniff` to prevent MIME-type confusion attacks.
  - Added `Referrer-Policy: strict-origin-when-cross-origin`.
  - Added `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
  - Added `Strict-Transport-Security` enforcement.
  - Configured SPA rewrite rule (`/(.*) -> /index.html`) so browser page refreshes never return 404.
- **Git Security Rules (`.gitignore`):**
  - Added rules to permanently block `.env`, `.env.local`, `.env.*.local`, `.env.production`, and `.env.development` from ever being tracked by git.
- **Session Expiration & Hardening (`src/App.tsx`):**
  - Added `session_expires_at` logic with an official 12-hour municipal working shift duration.
  - Stale sessions older than 12 hours are automatically invalidated and cleared from `localStorage`.
  - Added explicit `localStorage.removeItem('snp_chittorgarh_user')` upon user logout.
- **Input Validation in Login (`src/components/LoginView.tsx`):**
  - Added email trimming and regex format validation (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`).
  - Added password length validation (minimum 4 characters) to eliminate accidental empty submissions.
  - Added user-facing validation alert banner above login form.

---

## [Branch: main] — Earlier Commits (Summary)

### 2026-11-02 (`b9483d3`)
- **Strict 1-Time Reopen Rule:**
  - Enforced business rule: a complaint can only be reopened once (`reopen_count <= 1`).
  - In `TwoStepClosureModal.tsx`, if a ticket was already reopened, the "Problem Still Unresolved" button is permanently locked and disabled, and only "Citizen Confirmed Resolution (Final Close)" is selectable.
  - Added amber municipal policy notice explaining the 1-time reopen limit.

### 2026-11-02 (`0aa3ead` & `5287c8e`)
- **Live Supabase Sync & 0-Complaint Fix:**
  - Resolved ghost complaints bug when Supabase `tickets` table is empty.
  - Added PostgreSQL Realtime listener on `tickets` and `complaint_intakes`.
  - Removed "Intake Queue" from sidebar navigation as requested by municipal user.
  - Renamed "Closed Complaints" to "Completed Complaints" (`प्रमाणित पूर्ण शिकायतें`).
  - Added dedicated "SLA Breached" tab with real-time red count badge.
  - Added Municipal Action & Alerts notification dropdown.
  - Added permanent department delete button with confirmation and ticket safety fallback.
  - Applied Sky Blue gradient header and compact search bar.
