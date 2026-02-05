-- Phase 5: Contacts Module Schema

-- 1. Contacts Table
create table if not exists public.contacts (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  email text unique,
  phone text,
  community_id uuid references public.communities(id) on delete set null,
  unit_number text,
  avatar_url text,
  social_profiles jsonb default '{}'::jsonb,
  custom_attributes jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for fast lookup by email and community
create index if not exists contacts_email_idx on public.contacts(email);
create index if not exists contacts_community_id_idx on public.contacts(community_id);

-- Enable RLS
alter table public.contacts enable row level security;

-- Policies for Contacts
-- Admins can do everything
create policy "Admins can do everything on contacts"
  on public.contacts
  for all
  using (public.is_admin());

-- Operators can view contacts associated with their communities (Logic requires join, for now keeping it simple: Admins only or broad read if needed)
-- NOTE: For this iteration, we start with Admin only for mutation, but allow authenticated read for now to unblock development, 
-- or stick to strictly is_admin if user wants strictness. User asked for RLS, let's allow authenticated users to read for now, 
-- or better, restricted to admins as per previous strictness.
-- Actually, let's stick to is_admin() for now to be safe, as requested "Strict RBAC" in Phase 3.


-- 2. Contact Notes Table
create table if not exists public.contact_notes (
  id uuid default gen_random_uuid() primary key,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  author_id uuid references auth.users(id) on delete set null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.contact_notes enable row level security;

-- Policies for Contact Notes
create policy "Admins can do everything on contact_notes"
  on public.contact_notes
  for all
  using (public.is_admin());

-- Allow authors to view/edit their own notes? Or just admins?
-- Let's stick to Admin power for now.

-- 3. Update Communications to link to contacts (Optional but recommended)
-- alter table public.communications add column contact_id uuid references public.contacts(id) on delete set null;
