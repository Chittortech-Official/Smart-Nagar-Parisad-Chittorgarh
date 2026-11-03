# 📋 REMAINING WORK & LONG-TERM ROADMAP

**Project:** Smart Nagar Parishad Chittorgarh  
**Document Ref:** SNP-ROADMAP-2026-V1  
**Classification:** Strategic Development & Compliance Roadmap  

---

## 1. IMMEDIATE REMAINING TASKS (OWNER ACTION)

These items require owner intervention because they involve third-party root accounts:

1. **GitHub Repository Privacy:** Change repository from Public to **Private** in GitHub Settings.
2. **Rotate Supabase Service Role Key:** Roll the secret key in Supabase Dashboard (`Settings → API`).
3. **Rotate Supabase Anon Key:** Roll the anon key, update in Vercel Environment Variables, and trigger a redeploy.
4. **Approve Database RLS Migration:** Review `DATABASE_SECURITY_PLAN.md` and execute the SQL script in Supabase SQL Editor.

---

## 2. MID-TERM TECHNICAL UPGRADES (PHASE 2 ROADMAP)

### Upgrade 2.1: Full Supabase Auth Integration
- Currently, the application uses application-level session storage with an email/password prompt.
- **Goal:** Create official accounts in Supabase `Authentication → Users` for each Portal Manager, Departmental Officer, and Chairman.
- Replace `LoginView.tsx` with `supabase.auth.signInWithPassword({ email, password })`.
- This will supply a cryptographically signed JWT with every API request, allowing RLS to enforce ward-specific and department-specific permissions natively in PostgreSQL.

### Upgrade 2.2: Automated Bidirectional WhatsApp Webhook
- Currently, WhatsApp messages are dispatched via WhatsApp Web client links (`wa.me/?text=...`).
- **Goal:** Connect a Meta Cloud API webhook to receive citizen messages directly into `complaint_intakes` in real-time.

### Upgrade 2.3: Database Migrations for Missing Tables
- Safe execution of `user_profiles` and `complaint_intakes` tables to match `schema.sql` cleanly.

---

## 3. COMPLIANCE & LEGAL DRAFTS (FOR OFFICIAL APPROVAL)

The following regulatory documents should be reviewed and officially published by Nagar Parishad Chittorgarh:

1. **Digital Personal Data Protection (DPDPA 2023) Notice:**
   - Notice explaining to citizens what data (name, phone, ward) is collected, the legal municipal purpose (grievance redressal), and data retention period.
2. **Citizen User Manual & Helpline SLA Charter:**
   - Formal publication of the 12h, 24h, 48h, and 72h resolution commitments under Rajasthan Guaranteed Delivery of Public Services Act.
3. **Portal Manager Operating Procedure:**
   - Standard Operating Procedure (SOP) for telephonic citizen satisfaction verification prior to final complaint closure.

---

*Prepared by Senior Full-Stack Security & DevOps Engineer — ChittorTech Official*

