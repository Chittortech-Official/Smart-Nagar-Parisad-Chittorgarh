# 📋 REMAINING WORK & STRATEGIC ROADMAP (TWO-ROLE MODEL)

**Project:** Smart Nagar Parishad Chittorgarh  
**Roles:** `PORTAL_MANAGER` & `CHAIRMAN` (Equal Privileges)  
**Document Ref:** SNP-ROADMAP-TWO-ROLE-V2  

---

## 1. IMMEDIATE REMAINING TASKS (OWNER ACTION)

These tasks must be executed manually by the project owner in their official accounts:

1. **Make GitHub Repository Private:**  
   GitHub Repo → Settings → Danger Zone → Change visibility → **Make Private**.
2. **Rotate Supabase Service Role Key:**  
   Supabase Dashboard → Settings → API → `service_role` → **Generate new key**.
3. **Rotate Supabase Anon Key:**  
   Supabase Dashboard → Settings → API → `anon` → **Generate new key**, update in Vercel Environment Variables, and trigger **Redeploy**.
4. **Deploy Two-Role RLS Policies:**  
   Review and run the SQL script from `DATABASE_SECURITY_PLAN.md` in Supabase SQL Editor.

---

## 2. MID-TERM TECHNICAL UPGRADES (PHASE 2)

1. **Two-Account Supabase Auth Setup:**
   Create two staff accounts in Supabase `Authentication → Users`:
   - `portalmanager@chittorgarh.gov.in` (Role: `PORTAL_MANAGER`)
   - `chairman@chittorgarh.gov.in` (Role: `CHAIRMAN`)
2. **Automated WhatsApp Webhook:**
   Connect Meta Cloud API webhook to receive citizen WhatsApp messages directly.
3. **DPDPA 2023 Municipal Compliance:**
   Formally review and adopt the citizen grievance redressal privacy disclosure.
