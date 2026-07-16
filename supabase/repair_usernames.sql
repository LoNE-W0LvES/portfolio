-- Repairs accounts affected by the old admin create-user path.
-- A saved portfolio slug is treated as the intended username.
UPDATE public.site_users u
SET handle = lower(p.slug), username_set = true
FROM public.portfolio_settings p
WHERE p.owner_id = u.id
  AND p.slug IS NOT NULL
  AND lower(p.slug) ~ '^[a-z0-9_-]{3,30}$'
  AND lower(p.slug) NOT IN ('edit','api','admin','login','signup','donate','donation')
  AND (u.username_set = false OR u.handle LIKE 'pending\_%' ESCAPE '\')
  AND NOT EXISTS (
    SELECT 1 FROM public.site_users other
    WHERE other.id <> u.id AND other.handle = lower(p.slug)
  );

-- Keep portfolio URLs synchronized for every account that already has a real username.
UPDATE public.portfolio_settings p
SET slug = u.handle
FROM public.site_users u
WHERE p.owner_id = u.id
  AND u.username_set = true
  AND u.handle NOT LIKE 'pending\_%' ESCAPE '\'
  AND p.slug IS DISTINCT FROM u.handle;
