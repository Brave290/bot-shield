CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Engineering',
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  read_time TEXT DEFAULT '5 min',
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read blog" ON public.blog_posts FOR SELECT USING (true);
CREATE POLICY "service write blog" ON public.blog_posts FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, email TEXT NOT NULL, message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public insert contact" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "service read contact" ON public.contact_messages FOR SELECT USING (true);

INSERT INTO public.blog_posts (slug, title, category, excerpt, read_time, content) VALUES
('captcha-training-bots', 'Why your CAPTCHA is training bots for free', 'Engineering', 'Every puzzle you serve is a labeled dataset. Here is how challenge farms eat CAPTCHAs, and why behavioral signals close the loop.', '7 min', 'Every CAPTCHA you serve is a labeled training example. Challenge farms solve them, log the inputs, and sell the datasets back to bot authors.\n\nBehavioral analysis flips this. Instead of asking a question a machine can eventually learn, we measure physics: pointer curvature, hesitation, keystroke cadence. These signals are expensive to fake and decay quickly under automation.\n\nBotShield scores those signals in the first seconds of a session and issues a short-lived token. No puzzles, no datasets, no free lunch for bot authors.'),
('honest-numbers', 'Publishing our real numbers, mistakes included', 'Product', 'We wired this website to our production database. Here is what honest telemetry does to a team.', '4 min', 'Most SaaS pages show painted numbers. Ours stream from the production database, including this site''s own stats.\n\nThe effect on the team was immediate. When the blocked-bot counter is public, every false positive feels personal. When uptime is public, deploys get careful.\n\nTransparency is not marketing. It is a discipline mechanism that happens to be visible.'),
('hashing-visitors', 'Hashing visitors: analytics without surveillance', 'Security', 'SHA-256, salt, and a composite unique constraint. Counting unique humans without storing anything sensitive.', '9 min', 'We needed unique daily visitors without storing IP addresses. The recipe: SHA-256 hash the IP at the API layer, store only the hash, and add a UNIQUE(visit_date, ip_hash) constraint.\n\nThe database rejects duplicates for free. Refreshes do not inflate counts. Regulators find nothing raw to frown at.\n\nA hash cannot be reversed to an IP without brute force, and we salt per deployment. Analytics, minus the surveillance.'),
('five-kilobytes', 'Five kilobytes: a love letter to constraints', 'Engineering', 'How we keep the widget under 5KB in a world that ships megabytes to render a button.', '6 min', 'The widget budget is 5KB. Not 50, not 15. Five.\n\nThat constraint forces honesty: no framework, no polyfills, no dependency chain. Vanilla JavaScript, event listeners, and one fetch.\n\nWe delete more than we write. Every release candidate gets measured, and anything that grows the bundle has to argue its way in.')
ON CONFLICT (slug) DO NOTHING;
