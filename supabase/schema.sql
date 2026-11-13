-- CRM Sample — Supabase schema + Row Level Security (PostgreSQL)
-- Run in the Supabase SQL editor, in order. All demo data is fictional.
-- Tenancy model: one user -> one tenant via public.profiles.tenant_id.
-- Every business table carries tenant_id; RLS compares it with the
-- caller's tenant (auth.uid() -> profiles.tenant_id). There is no
-- cross-tenant read path. Service-role key bypasses RLS: use it only
-- server-side for admin/seed scripts, never in the browser.
create extension if not exists "pgcrypto";
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text unique not null, created_at timestamptz not null default now()
);
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  tenant_id uuid references public.tenants (id) on delete cascade,
  full_name text, created_at timestamptz not null default now()
);
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants (id) on delete cascade,
  full_name text not null, email text, phone text, company text, source text,
  status text not null default 'new' check (status in ('new','contacted','qualified','lost')),
  value_inr numeric not null default 0, notes text, created_at timestamptz not null default now()
);
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete set null,
  full_name text not null, email text, phone text, role text, created_at timestamptz not null default now()
);
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants (id) on delete cascade,
  title text not null, contact_id uuid references public.contacts (id) on delete set null,
  stage text not null default 'discovery' check (stage in ('discovery','proposal','negotiation','won','lost')),
  value_inr numeric not null default 0, expected_close date, created_at timestamptz not null default now()
);
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants (id) on delete cascade,
  kind text not null check (kind in ('call','email','meeting','note')),
  subject text not null, body text, lead_id uuid references public.leads (id) on delete cascade, deal_id uuid references public.deals (id) on delete cascade,
  happened_at timestamptz not null default now()
);
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants (id) on delete cascade,
  title text not null, due_date date, done boolean not null default false,
  lead_id uuid references public.leads (id) on delete cascade, deal_id uuid references public.deals (id) on delete cascade,
  created_at timestamptz not null default now()
);
-- Lead conversion: one row records a lead becoming a contact and/or a
-- deal. One lead converts at most once (unique lead_id); the lead row
-- itself is kept, so the history is auditable. contact_id / deal_id are
-- nullable because a conversion may create only one of them.
create table if not exists public.conversions (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete set null,
  deal_id uuid references public.deals (id) on delete set null,
  notes text, converted_at timestamptz not null default now(),
  unique (lead_id)
);
-- Quotes: a priced offer against a deal. total_inr must equal
-- subtotal_inr + tax_inr (18% GST in the demo rows); the check keeps a
-- quote's maths honest instead of trusting the UI.
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants (id) on delete cascade,
  deal_id uuid not null references public.deals (id) on delete cascade,
  quote_number text not null, status text not null default 'draft' check (status in ('draft','sent','accepted','rejected','expired')),
  subtotal_inr numeric not null default 0 check (subtotal_inr >= 0),
  tax_inr numeric not null default 0 check (tax_inr >= 0),
  total_inr numeric not null default 0 check (total_inr >= 0),
  valid_until date, notes text, created_at timestamptz not null default now(),
  unique (tenant_id, quote_number),
  check (total_inr = subtotal_inr + tax_inr)
);
create index if not exists leads_tenant_idx on public.leads (tenant_id, created_at desc);
create index if not exists deals_tenant_idx on public.deals (tenant_id, stage);
create index if not exists activities_tenant_idx on public.activities (tenant_id, happened_at desc);
create index if not exists conversions_tenant_idx on public.conversions (tenant_id, converted_at desc);
create index if not exists quotes_tenant_idx on public.quotes (tenant_id, status);
create index if not exists quotes_deal_idx on public.quotes (deal_id);
alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.contacts enable row level security;
alter table public.deals enable row level security;
alter table public.activities enable row level security;
alter table public.tasks enable row level security;
alter table public.conversions enable row level security;
alter table public.quotes enable row level security;
-- Helper: the caller's tenant id. SECURITY DEFINER so RLS policies can
-- read profiles without recursing through profiles' own RLS.
create or replace function public.current_tenant_id() returns uuid language sql security definer stable as
  $$ select tenant_id from public.profiles where id = auth.uid() $$;
-- Profiles: a user reads/updates only their own row.
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
-- Tenants: readable only by members of that tenant.
drop policy if exists "own tenant" on public.tenants;
create policy "own tenant" on public.tenants for select using (id = public.current_tenant_id());
-- One policy per business table, same shape: tenant match on every op.
drop policy if exists "tenant isolation" on public.leads;
create policy "tenant isolation" on public.leads for all using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());
drop policy if exists "tenant isolation" on public.contacts;
create policy "tenant isolation" on public.contacts for all using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());
drop policy if exists "tenant isolation" on public.deals;
create policy "tenant isolation" on public.deals for all using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());
drop policy if exists "tenant isolation" on public.activities;
create policy "tenant isolation" on public.activities for all using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());
drop policy if exists "tenant isolation" on public.tasks;
create policy "tenant isolation" on public.tasks for all using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());
drop policy if exists "tenant isolation" on public.conversions;
create policy "tenant isolation" on public.conversions for all using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());
drop policy if exists "tenant isolation" on public.quotes;
create policy "tenant isolation" on public.quotes for all using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());
-- NOTE: multi-user roles inside a tenant (owner / sales / viewer) are NOT
-- implemented yet. Add a profiles.role column and split the `for all`
-- policies into per-operation policies before selling role-based access.
