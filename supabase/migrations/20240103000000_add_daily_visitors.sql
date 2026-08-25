-- Table to store unique daily visitors
CREATE TABLE public.unique_daily_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- This constraint prevents duplicate counts for the same IP on the same day
  UNIQUE(visit_date, ip_hash)
);

ALTER TABLE public.unique_daily_visitors ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view daily visitor counts" ON public.unique_daily_visitors 
  FOR SELECT USING (true);

CREATE POLICY "System can insert visitors" ON public.unique_daily_visitors 
  FOR INSERT WITH CHECK (true);

-- Function to safely insert and return count (handles duplicates gracefully)
CREATE OR REPLACE FUNCTION track_and_count_visitor(p_ip_hash TEXT)
RETURNS INTEGER AS $$
DECLARE
  today_count INTEGER;
BEGIN
  -- Try to insert. If duplicate, it does nothing (ON CONFLICT)
  INSERT INTO public.unique_daily_visitors (visit_date, ip_hash)
  VALUES (CURRENT_DATE, p_ip_hash)
  ON CONFLICT (visit_date, ip_hash) DO NOTHING;

  -- Get today's total count
  SELECT COUNT(*) INTO today_count
  FROM public.unique_daily_visitors
  WHERE visit_date = CURRENT_DATE;

  RETURN today_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
