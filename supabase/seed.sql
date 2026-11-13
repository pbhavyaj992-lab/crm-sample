-- CRM Sample — DEMO / SAMPLE DATA ONLY. Fictional business "Acme Demo Traders"
-- (Anand, Gujarat — invented). No real customers, no real results.
-- Run after schema.sql, with the service-role key or as a SQL-editor admin.
-- Replace the tenant id with your own tenant, and create a matching
-- auth user + profiles row before using the app.
insert into public.tenants (id, name, slug) values
  ('11111111-1111-1111-1111-111111111111', 'Acme Demo Traders', 'acme-demo')
  on conflict (id) do nothing;
insert into public.leads (id, tenant_id, full_name, email, phone, company, source, status, value_inr, notes) values
  ('a1111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111111', 'Riya Demo Shah', 'riya@example.in', '+91 90000 00001', 'Demo Textiles', 'website', 'new', 45000, 'Asked for a demo of the sales pipeline.'),
  ('a1111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111111', 'Arjun Demo Patel', 'arjun@example.in', '+91 90000 00002', 'Demo Ceramics', 'referral', 'contacted', 120000, 'Needs pricing for 5 users.'),
  ('a1111111-1111-1111-1111-111111111103', '11111111-1111-1111-1111-111111111111', 'Meera Demo Desai', 'meera@example.in', '+91 90000 00003', 'Demo Foods', 'website', 'qualified', 85000, 'Budget approved, wants a proposal this week.'),
  ('a1111111-1111-1111-1111-111111111104', '11111111-1111-1111-1111-111111111111', 'Karan Demo Iyer', 'karan@example.in', '+91 90000 00004', 'Demo Logistics', 'cold call', 'lost', 30000, 'Chose a competitor; revisit in 6 months.')
  on conflict (id) do nothing;
insert into public.contacts (id, tenant_id, lead_id, full_name, email, phone, role) values
  ('a1111111-1111-1111-1111-111111111201', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111101', 'Riya Demo Shah', 'riya@example.in', '+91 90000 00001', 'Owner'),
  ('a1111111-1111-1111-1111-111111111202', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111103', 'Meera Demo Desai', 'meera@example.in', '+91 90000 00003', 'Operations Head')
  on conflict (id) do nothing;
insert into public.deals (id, tenant_id, title, contact_id, stage, value_inr, expected_close) values
  ('a1111111-1111-1111-1111-111111111301', '11111111-1111-1111-1111-111111111111', 'CRM setup — Demo Textiles', 'a1111111-1111-1111-1111-111111111201', 'discovery', 45000, '2026-12-15'),
  ('a1111111-1111-1111-1111-111111111302', '11111111-1111-1111-1111-111111111111', 'CRM + onboarding — Demo Foods', 'a1111111-1111-1111-1111-111111111202', 'proposal', 85000, '2026-11-30'),
  ('a1111111-1111-1111-1111-111111111303', '11111111-1111-1111-1111-111111111111', 'Annual plan — Demo Ceramics', null, 'negotiation', 120000, '2026-12-20'),
  ('a1111111-1111-1111-1111-111111111304', '11111111-1111-1111-1111-111111111111', 'Pilot — Demo Logistics', null, 'lost', 30000, '2026-11-10')
  on conflict (id) do nothing;
insert into public.activities (tenant_id, kind, subject, body, happened_at) values
  ('11111111-1111-1111-1111-111111111111', 'call', 'Intro call with Demo Textiles', 'Walked through the pipeline view; sent a follow-up email.', now() - interval '2 days'),
  ('11111111-1111-1111-1111-111111111111', 'email', 'Proposal sent to Demo Foods', 'Proposal covers setup, training and first-month support.', now() - interval '1 day'),
  ('11111111-1111-1111-1111-111111111111', 'meeting', 'Pricing discussion — Demo Ceramics', 'Agreed to share a revised quote after checking user count.', now() - interval '3 hours');
insert into public.tasks (tenant_id, title, due_date, done) values
  ('11111111-1111-1111-1111-111111111111', 'Follow up with Demo Foods on the proposal', '2026-11-15', false),
  ('11111111-1111-1111-1111-111111111111', 'Send revised quote to Demo Ceramics', '2026-11-16', false),
  ('11111111-1111-1111-1111-111111111111', 'Log outcome of Demo Textiles intro call', '2026-11-13', true);
-- Conversions: Meera Demo Desai (qualified lead) became a contact and the
-- Demo Foods deal; Riya Demo Shah became a contact and the Demo Textiles
-- deal. One conversion per lead (see the unique lead_id in schema.sql).
insert into public.conversions (tenant_id, lead_id, contact_id, deal_id, notes, converted_at) values
  ('11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111103', 'a1111111-1111-1111-1111-111111111202', 'a1111111-1111-1111-1111-111111111302', 'Budget approved; created contact and deal from the qualified lead.', now() - interval '4 days'),
  ('11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111101', 'a1111111-1111-1111-1111-111111111201', 'a1111111-1111-1111-1111-111111111301', 'Intro call went well; created contact and discovery-stage deal.', now() - interval '2 days')
  on conflict (lead_id) do nothing;
-- Quotes: tax is 18% GST, total = subtotal + tax (enforced by the check
-- in schema.sql). Q-2026-001 is sent, Q-2026-002 is accepted.
insert into public.quotes (tenant_id, deal_id, quote_number, status, subtotal_inr, tax_inr, total_inr, valid_until, notes) values
  ('11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111302', 'Q-2026-001', 'sent', 85000, 15300, 100300, '2026-12-14', 'CRM + onboarding, first year.'),
  ('11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111303', 'Q-2026-002', 'accepted', 120000, 21600, 141600, '2026-12-20', 'Annual plan for 5 users.'),
  ('11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111301', 'Q-2026-003', 'draft', 45000, 8100, 53100, '2026-12-31', 'Draft — awaiting final user count.')
  on conflict (tenant_id, quote_number) do nothing;
