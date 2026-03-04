-- System Integrations (Global)
create table if not exists system_integrations (
  id uuid default uuid_generate_v4() primary key,
  provider text unique not null check (provider in ('microsoft_global')),
  access_token text,
  refresh_token text,
  expires_at timestamp with time zone,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table system_integrations enable row level security;

-- Policies for system_integrations
-- Only admins can view/manage this
create policy "Admins can manage system_integrations" on system_integrations
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Update Communications Table
-- Check if columns exist, if not add them
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'communications' and column_name = 'ai_metadata') then
        alter table communications add column ai_metadata jsonb;
    end if;
     if not exists (select 1 from information_schema.columns where table_name = 'communications' and column_name = 'raw_email_data') then
        alter table communications add column raw_email_data jsonb;
    end if;
end $$;
