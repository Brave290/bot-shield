CREATE OR REPLACE FUNCTION public.increment_request_metrics(was_blocked BOOLEAN DEFAULT FALSE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE metric_id UUID;
BEGIN
  SELECT id INTO metric_id FROM public.request_metrics ORDER BY id LIMIT 1 FOR UPDATE;
  IF metric_id IS NULL THEN
    INSERT INTO public.request_metrics (total_requests, blocked_requests, last_updated)
    VALUES (1, CASE WHEN was_blocked THEN 1 ELSE 0 END, NOW());
  ELSE
    UPDATE public.request_metrics
    SET total_requests = total_requests + 1,
        blocked_requests = blocked_requests + CASE WHEN was_blocked THEN 1 ELSE 0 END,
        last_updated = NOW()
    WHERE id = metric_id;
  END IF;
END;
$$;
