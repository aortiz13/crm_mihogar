-- Phase 3: User Management & RBAC

-- Table: operator_communities (Many-to-Many for restricted access)
create table if not exists operator_communities (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  community_id uuid references communities(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, community_id)
);

alter table operator_communities enable row level security;

-- Policies for operator_communities
-- Admins can manage everything
create policy "Admins can do everything on operator_communities" on operator_communities
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Operators can view their own assignments (to know which communities they can access)
create policy "Operators can view own assignments" on operator_communities
  for select using (
    user_id = auth.uid()
  );

-- Update profiles table policies for RBAC
-- We need to drop existing policies to avoid conflicts or lax permissions
drop policy if exists "Admins can view all profiles" on profiles;

create policy "Admins can view all profiles" on profiles
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update all profiles" on profiles
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete profiles" on profiles
  for delete using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
  
-- Operators/Users can view their own profile
create policy "Users can view own profile" on profiles
  for select using (
    auth.uid() = id
  );

-- Users can update their own profile
create policy "Users can update own profile" on profiles
  for update using (
    auth.uid() = id
  );
