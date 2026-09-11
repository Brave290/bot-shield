-- Make subscription assignment upserts compatible with PostgREST.
-- A partial unique index cannot be used as the ON CONFLICT (user_id) target.
DROP INDEX IF EXISTS public.subscription_stats_user_id_key;
ALTER TABLE public.subscription_stats
  DROP CONSTRAINT IF EXISTS subscription_stats_user_id_key;
ALTER TABLE public.subscription_stats
  ADD CONSTRAINT subscription_stats_user_id_key UNIQUE (user_id);

-- Subscription state is server-controlled by the billing webhook and admin API.
DROP POLICY IF EXISTS "Anyone can record subscription" ON public.subscription_stats;
