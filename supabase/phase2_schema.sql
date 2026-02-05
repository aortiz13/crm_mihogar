-- Phase 2: Communities & RAG Expansion

-- Update communities table
alter table communities add column if not exists contact_info jsonb;

-- Table: community_documents (Knowledge Base)
create table if not exists community_documents (
  id uuid default uuid_generate_v4() primary key,
  community_id uuid references communities(id) not null,
  filename text not null,
  file_url text not null, -- Supabase Storage URL
  content_type text,
  status text check (status in ('processing', 'indexed', 'error')) default 'processing',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table community_documents enable row level security;

-- Table: document_embeddings (RAG Vector Store)
-- Ensure extension is enabled (already done in Phase 1 but good practice)
create extension if not exists vector;

create table if not exists document_embeddings (
  id uuid default uuid_generate_v4() primary key,
  community_id uuid references communities(id) not null, -- Critical for scoping
  document_id uuid references community_documents(id) on delete cascade not null,
  content_chunk text,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table document_embeddings enable row level security;

-- Policies for Phase 2

-- Community Documents
create policy "Authenticated users can read community_documents" on community_documents for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert community_documents" on community_documents for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update community_documents" on community_documents for update using (auth.role() = 'authenticated');

-- Document Embeddings (Internal use mostly, but useful for RAG queries)
create policy "Authenticated users can read document_embeddings" on document_embeddings for select using (auth.role() = 'authenticated');
-- Insert/Update should ideally be restricted to service role or specific triggers, but for MVP/prototype we allow auth users to facilitate testing via server actions
create policy "Authenticated users can insert document_embeddings" on document_embeddings for insert with check (auth.role() = 'authenticated');

-- Create storage bucket for documents if not exists
insert into storage.buckets (id, name, public) 
values ('community-documents', 'community-documents', true)
on conflict (id) do nothing;

-- Storage Policy: Allow authenticated uploads
create policy "Authenticated users can upload documents" on storage.objects for insert with check (
  bucket_id = 'community-documents' and auth.role() = 'authenticated'
);

create policy "Authenticated users can read documents" on storage.objects for select using (
  bucket_id = 'community-documents' and auth.role() = 'authenticated'
);
