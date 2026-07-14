ALTER TABLE public.portfolio_settings
ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en'
CHECK (preferred_language IN ('en','bn','ja','zh','th','id','ko'));
