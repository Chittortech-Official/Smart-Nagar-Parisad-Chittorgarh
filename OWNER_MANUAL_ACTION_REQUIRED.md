# 🚨 OWNER MANUAL ACTION REQUIRED (STRICTLY PRIVATE PORTAL)

**Project:** Smart Nagar Parishad Chittorgarh  
**Access Architecture:** Strictly Private – Portal Manager Only  
**Authorized Role:** `PORTAL_MANAGER` (Exactly ONE role)  
**Status:** ACTION REQUIRED BY PROJECT OWNER / ADMINISTRATOR  

> [!CAUTION]
> The tasks listed in this document can **ONLY be performed by you** (the project owner) because they require root administrative access to your personal Supabase, GitHub, and Vercel dashboards. Automated tools cannot perform these root credential rotations or production SQL executions autonomously.

---

## ⚡ 1. URGENT MANUAL ACTIONS (Complete Today)

### Task 1.1: Deploy Security Hardening to Vercel (Update Live Website)
* **Why it is necessary:** All security hardening and role cleanup were developed on the local branch `security-hardening-v1`. Vercel deploys from GitHub `main`. Merging and pushing updates the live Vercel website to match localhost.
* **Commands to run in Command Prompt / Terminal:**
  ```cmd
  cd /d "e:\Chittortech Projects\Nagar Palika System"
  git checkout main
  git merge security-hardening-v1
  git push origin main
  ```
* **Verification:** Visit `https://smart-nagar-parisad-chittaurgarh.vercel.app` — the live login page will show the clean, neutral login form matching localhost:3000.

---

### Task 1.2: Execute `RLS_POLICIES.sql` in Supabase SQL Editor
* **Why it is necessary:** Enables Row Level Security on all 10 production tables, revokes all anonymous permissions (`anon`), creates the protected `user_profiles` table, and secures the database so no unauthorized visitor can read or write data.
* **Dashboard to open:** Supabase
* **Exact Navigation Path:**
  1. Open: `https://supabase.com/dashboard/project/qvrhgytkufajcpletbfp/sql/new`
  2. Open the file [`RLS_POLICIES.sql`](file:///e:/Chittortech%20Projects/Nagar%20Palika%20System/RLS_POLICIES.sql) in your code editor.
  3. Copy the entire contents of `RLS_POLICIES.sql`.
  4. Paste into the Supabase SQL Editor.
  5. Click the green **Run** button (Ctrl + Enter).
* **Verification:** Check the message output: `Success. No rows returned`. All 10 tables will show "RLS Enabled" under `Table Editor`.

---

### Task 1.3: Make GitHub Repository Private
* **Why it is necessary:** Your repository is currently **Public**. Automated crawlers can download your `.env` file and read your Supabase credentials. Making it private immediately cuts off unauthorized public access.
* **Dashboard to open:** GitHub
* **Exact Navigation Path:**  
  1. Open: `https://github.com/Chittortech-Official/Smart-Nagar-Parisad-Chittaurgarh/settings`
  2. Scroll down to the bottom section titled **Danger Zone**.
  3. Look for **Change repository visibility**.
  4. Click **Change to private**.
  5. Select **I want to make this repository private**.
  6. Type `Chittortech-Official/Smart-Nagar-Parisad-Chittaurgarh` to confirm.
  7. Click **I understand, make this repository private**.
* **Downtime Risk:** **ZERO DOWNTIME.** Your live Vercel site will continue running normally.
* **Verification:** Open an incognito browser window and visit `https://github.com/Chittortech-Official/Smart-Nagar-Parisad-Chittaurgarh`. It should show a 404 page (confirming it is private).

---

### Task 1.4: Rotate Supabase Service Role Key (Root Secret)
* **Why it is necessary:** The `SUPABASE_SERVICE_ROLE_KEY` was committed in Git. This key bypasses all security and gives root control over your entire database. It must be regenerated so the old leaked key becomes permanently invalid.
* **Dashboard to open:** Supabase
* **Exact Navigation Path:**  
  1. Open: `https://supabase.com/dashboard/project/qvrhgytkufajcpletbfp/settings/api`
  2. Scroll to the section titled **Project API keys**.
  3. Locate the row titled `service_role` (marked with `secret`).
  4. Click **Roll key / Generate new key** (or the refresh icon next to it).
  5. Confirm the warning prompt.
* **Downtime Risk:** **ZERO DOWNTIME.** Your frontend application does NOT use the service role key.
* **Verification:** The old key will immediately stop working.

---

### Task 1.5: Rotate Supabase Anon Key & Update Vercel
* **Why it is necessary:** The `VITE_SUPABASE_ANON_KEY` is also exposed. Generating a new one ensures only authorized platforms have access.
* **Dashboard to open:** Supabase + Vercel
* **Exact Step-by-Step Sequence:**
  1. In Supabase (`Settings → API`), find `anon` (marked `public`).
  2. Click **Roll key / Generate new key**.
  3. Copy the newly generated key.
  4. Open Vercel Project Settings: `https://vercel.com/chittor-tech/smart-nagar-parisad-chittaurgarh/settings/environment-variables`
  5. Find `VITE_SUPABASE_ANON_KEY`, click **Edit**, paste the new key, and save.
  6. Trigger a redeploy on Vercel (`Deployments → Redeploy`).
