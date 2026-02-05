-- Create community_integrations table
CREATE TABLE IF NOT EXISTS public.community_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook')),
    email TEXT NOT NULL,
    access_token TEXT NOT NULL, -- Will be encrypted app-side usually, or use pgsodium
    refresh_token TEXT, -- Will be encrypted app-side
    scopes JSONB DEFAULT '[]'::jsonb,
    expires_at BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(community_id, provider)
);

-- RLS Policies
ALTER TABLE public.community_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all integrations"
    ON public.community_integrations
    FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can insert integrations"
    ON public.community_integrations
    FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update integrations"
    ON public.community_integrations
    FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete integrations"
    ON public.community_integrations
    FOR DELETE
    USING (public.is_admin());
