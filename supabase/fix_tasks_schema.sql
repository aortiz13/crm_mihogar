-- Add missing columns to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Request for existing tasks to have a creator (optional)
-- UPDATE public.tasks SET created_by = assigned_to WHERE created_by IS NULL;

-- Enable RLS for the new columns (already enabled for the table, but good to check policies)
-- The existing policy "Authenticated users can update tasks" should cover these.
