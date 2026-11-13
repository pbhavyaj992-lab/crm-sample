# CRM Sample — Next.js + Supabase (multi-tenant)

A sellable **sample** CRM built from scratch in TypeScript / React / Next.js
with Supabase (PostgreSQL + Auth + Row Level Security). Original code only:
patterns were studied at a high level from tools such as Refine and Krayin
CRM; no code was copied from them, from ISHAN Detailing OS, or from any
other product. Do not copy ISHAN code into this repo.

> **Status: sample / demo — not production-ready.** The core flows work
> end to end against a real Supabase project — verified live 13 Nov 2026
> in demo project bhavya-demo-crm-marketplace (ref axvpeagvzpnjlkxbttho),
> all checks passed. Role-based access, email sending, file uploads,
> audit logs and automated tests are not yet built (see "Not yet
> implemented"). All seed data is fictional demo data.

## What is implemented

| Module | What works |
| --- | --- |
| Dashboard (`/`) | Pipeline value, open-lead count, open tasks, latest leads and deals (server component, Supabase queries) |
| Leads (`/leads`) | Create a lead (tenant-scoped insert), filter by status, move status with a dropdown — writes straight to Supabase |
| Deals pipeline (`/deals`) | Kanban-style board by stage (discovery → proposal → negotiation → won / lost), create a deal, move stage, per-stage and open-pipeline totals in ₹ |
| Conversions (`/conversions`) | Convert a lead into a contact and/or deal: pick a lead (already-converted and lost leads are excluded), link an existing contact and deal, add notes. One conversion per lead is enforced by a unique constraint in the database; converting also marks the lead qualified |
| Quotes (`/quotes`) | Create a priced quote against a deal — quote number, subtotal, 18% GST tax and total (total = subtotal + tax, computed in the UI and re-checked by a database check constraint), valid-until date, move status draft → sent → accepted / rejected / expired, accepted and sent totals shown |
| Contacts (`/contacts`) | Read list of contacts linked to leads/deals |
| Activities (`/activities`) | Timeline of calls, emails, meetings and notes |
| Tasks (`/tasks`) | Create a task with due date, tick done/undone |
| Multi-tenancy | Every business row carries `tenant_id`; `profiles.tenant_id` maps a user to one tenant; RLS policies in `supabase/schema.sql` allow a user to see only their own tenant's rows |

## Database

Tables in `supabase/schema.sql`: `tenants`, `profiles`, `leads`,
`contacts`, `deals`, `activities`, `tasks`, `conversions`, `quotes`
(9 tables). RLS is enabled on every table
with one `tenant isolation` policy per business table
(`tenant_id = public.current_tenant_id()`), plus an own-profile policy.
`current_tenant_id()` is `SECURITY DEFINER` so policies can read
`profiles` without recursing through its RLS. Two rules live in the
database, not just the UI: `conversions.lead_id` is unique (one lead
converts once) and `quotes.total_inr = subtotal_inr + tax_inr`.

## Demo / seed data

`supabase/seed.sql` inserts one fictional tenant, **Acme Demo Traders**,
with 4 demo leads, 2 contacts, 4 deals, 3 activities, 3 tasks,
2 conversions (Meera Demo Desai → contact + Demo Foods deal; Riya Demo
Shah → contact + Demo Textiles deal) and 3 quotes (Q-2026-001 sent
₹1,00,300, Q-2026-002 accepted ₹1,41,600, Q-2026-003 draft ₹53,100;
each total = subtotal + 18% GST). All
names, emails (`@example.in`) and phone numbers (`+91 90000 …`) are
invented. No real customers, no real results, no testimonials.

## Setup / run

```bash
npm install
cp .env.example .env.local   # fill in NEXT_PUBLIC_SUPABASE_URL / ANON_KEY
# In the Supabase SQL editor, run supabase/schema.sql, then supabase/seed.sql
# Create an auth user in Supabase Auth, then insert a profiles row:
#   insert into profiles (id, tenant_id, full_name)
#   values ('<auth-user-uuid>', '11111111-1111-1111-1111-111111111111', 'Demo User');
# (Use your own tenant id if you changed the seed.)
npm run dev                  # http://localhost:3000
npm run build                # production build (needs env vars set)
```

## Not yet implemented

- Sign-up / sign-in UI (use Supabase Auth dashboard or add an auth page; the app reads the session via `@supabase/ssr`)
- Roles inside a tenant (owner / sales / viewer) — needs a `profiles.role` column and per-operation RLS policies
- Email sending, calendar sync, file attachments, import/export (CSV)
- Search, pagination beyond the latest rows, and automated tests
- Audit log of who changed what

## Tech

TypeScript, React, Next.js 14 (App Router), Tailwind CSS, Supabase
(PostgreSQL, Auth, RLS), `@supabase/ssr` / `@supabase/supabase-js`.
Built by Bhavya Patel — B.Tech Computer Science and Design, GCET Anand;
Master of Business Analytics, Deakin University, GIFT City.

## What I would do differently

- The SQL was verified live on Supabase on 13 Nov 2026, but roles inside a tenant (owner / sales / viewer) are still not implemented. I would add a `profiles.role` column and per-operation RLS policies next.
- There is no sign-up / sign-in UI. I would add an auth page so a demo user can sign in instead of being created in the Supabase dashboard.
- The seed is run-once for activities and tasks (a second run duplicates them), and `contacts` and `tasks` have no `tenant_id` index. I would add `ON CONFLICT DO NOTHING` and the missing indexes.
- Email sending, file uploads, audit logs and automated tests are all still missing. I would add the audit log first, since a CRM without a record of who changed what is hard to trust.
