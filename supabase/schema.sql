-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: profiles
create table if not exists profiles (
  id uuid references auth.users not null primary key,
  email text,
  role text check (role in ('admin', 'operator')) default 'operator',
  full_name text,
  assigned_communities uuid[], -- Array of community IDs
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table profiles enable row level security;

-- Table: communities
create table if not exists communities (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  address text,
  unit_count integer,
  onedrive_folder_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table communities enable row level security;

-- Table: communications (Emails)
create table if not exists communications (
  id uuid default uuid_generate_v4() primary key,
  thread_id text, -- ID from Microsoft Graph
  message_id text, -- ID of specific message
  subject text,
  body text,
  sender_email text,
  sender_name text,
  status text check (status in ('new', 'pending', 'resolved')) default 'new',
  ai_summary text,
  received_at timestamp with time zone default timezone('utc'::text, now()) not null,
  community_id uuid references communities(id)
);

alter table communications enable row level security;

-- Table: tasks
create table if not exists tasks (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  status text check (status in ('todo', 'in_progress', 'done')) default 'todo',
  priority text check (priority in ('low', 'medium', 'high', 'urgent')) default 'medium',
  assigned_to uuid references profiles(id),
  communication_id uuid references communications(id),
  community_id uuid references communities(id),
  due_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table tasks enable row level security;

-- Table: documents
create table if not exists documents (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  file_path text, -- Path in storage or OneDrive link
  type text,
  community_id uuid references communities(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table documents enable row level security;

-- Table: audit_logs
create table if not exists audit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id),
  action text not null,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table audit_logs enable row level security;

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'operator');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Policies (Basic Setup)

-- Profiles
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Admins can view all profiles" on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Communities
create policy "Authenticated users can read communities" on communities for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert communities" on communities for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update communities" on communities for update using (auth.role() = 'authenticated');

-- Communications
create policy "Authenticated users can read communications" on communications for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert communications" on communications for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update communications" on communications for update using (auth.role() = 'authenticated');

-- Tasks
create policy "Authenticated users can read tasks" on tasks for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert tasks" on tasks for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update tasks" on tasks for update using (auth.role() = 'authenticated');

-- Documents
create policy "Authenticated users can read documents" on documents for select using (auth.role() = 'authenticated');

-- Audit Logs
create policy "Admins can read audit logs" on audit_logs for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
