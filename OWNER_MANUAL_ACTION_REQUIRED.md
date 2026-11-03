# 🚨 OWNER MANUAL ACTION REQUIRED (TWO-ROLE MODEL)

**Project:** Smart Nagar Parishad Chittorgarh  
**Roles Configured:** `PORTAL_MANAGER` & `CHAIRMAN` (Equal Privileges)  
**Status:** ACTION REQUIRED BY PROJECT OWNER / ADMINISTRATOR  

> [!CAUTION]
> The tasks listed in this document can **ONLY be performed by you** (the project owner) because they require root administrative access to your personal Supabase, GitHub, and Vercel dashboards. Automated tools cannot perform these root credential rotations autonomously.

---

## ⚡ 1. URGENT MANUAL ACTIONS (Complete Today)

### Task 1.1: Make GitHub Repository Private
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
* **If you do not complete this:** Anyone on the internet can see your source code and leaked environment file.

---

### Task 1.2: Rotate Supabase Service Role Key (Root Secret)
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
* **If you do not complete this:** Anyone who copied the old key can delete or export your database.

---

### Task 1.3: Rotate Supabase Anon Key & Update Vercel
* **Why it is necessary:** The `VITE_SUPABASE_ANON_KEY` is also exposed. Generating a new one ensures only authorized platforms have access.
* **Dashboard to open:** Supabase + Vercel
* **Exact Step-by-Step Sequence:**
  1. In Supabase (`Settings → API`), find `anon` (marked `public`).
  2. Click **Roll key / Generate new key** and **Copy the new anon key**.
  3. Immediately open Vercel Dashboard: `https://vercel.com/chittor-tech/smart-nagar-parisad-chittaurgarh/settings/environment-variables`
  4. Find the variable named `VITE_SUPABASE_ANON_KEY`.
  5. Click **Edit** and paste the **NEW anon key**.
  6. Click **Save**.
  7. In Vercel, go to the **Deployments** tab.
  8. Click the three dots `...` on the latest deployment and select **Redeploy**.
* **Downtime Risk:** Approximately 30–60 seconds while Vercel rebuilds with the new key.
* **Verification:** Visit [smart-nagar-parisad-chittaurgarh.vercel.app](https://smart-nagar-parisad-chittaurgarh.vercel.app) and verify complaints load normally.
* **If you do not complete this:** The old anon key remains public and could be misused.

---

## 🔒 2. DATABASE SECURITY APPROVAL ACTIONS

### Task 2.1: Review & Approve Two-Role RLS SQL
* **Why it is necessary:** Enables RLS on all 10 live tables with equal operational access for Portal Manager and Chairman, while blocking anonymous data scraping.
* **Where to review:** Open `DATABASE_SECURITY_PLAN.md`.
* **How to execute once approved:**
  1. Open: `https://supabase.com/dashboard/project/qvrhgytkufajcpletbfp/sql/new`
  2. Paste the SQL script from `DATABASE_SECURITY_PLAN.md`.
  3. Click **Run**.
* **Downtime Risk:** Zero if executed following the phased plan.

---

## 💻 3. GITHUB ACTIONS

### Task 3.1: Stop Tracking `.env` in Git
* **Command to run in your Command Prompt:**
  ```cmd
  cd /d "e:\Chittortech Projects\Nagar Palika System"
  git rm --cached .env
  git commit -m "chore: untrack .env from git repository"
  ```

---

## 🚀 4. FINAL DEPLOYMENT ACTIONS

### Task 4.1: Merge `security-hardening-v1` Branch
* **How to merge once ready:**
  ```cmd
  cd /d "e:\Chittortech Projects\Nagar Palika System"
  git checkout main
  git merge security-hardening-v1
  git push origin main
  ```
