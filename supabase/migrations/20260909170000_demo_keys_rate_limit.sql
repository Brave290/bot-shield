INSERT INTO public.rate_limits (id, endpoint, window_seconds, max_attempts, scope, description)
VALUES ('demo_keys_ip', '/api/demo-keys', 3600, 20, 'ip', 'Maximum demo-key requests per IP per hour')
ON CONFLICT (id) DO NOTHING;
