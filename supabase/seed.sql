-- Playwright test user (email: playwright@example.com, password: Playwright1!)
-- Created automatically by global setup if missing; this seed ensures it exists after `supabase db reset`.
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'authenticated', 'authenticated',
  'playwright@example.com',
  crypt('Playwright1!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}', '{}',
  NOW(), NOW(),
  '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  '{"sub":"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee","email":"playwright@example.com"}',
  'email',
  NOW(), NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Seed representatives for Playwright E2E tests
INSERT INTO public.representatives (bioguide_id, first_name, last_name, official_full_name, chamber, state, district, party, state_rank, birthday, in_office) VALUES
  ('S000001', 'Hank',    'Green',      'Hank Green',       'sen', 'MT', NULL, 'Democrat',    'senior', '1980-05-05', true),
  ('S000002', 'John',    'Green',      'John Green',       'sen', 'IN', NULL, 'Democrat',    'junior', '1977-08-24', true),
  ('R000001', 'April',   'May',        'April May',        'rep', 'IN', 1,    'Democrat',    NULL,     '1980-04-01', true),
  ('R000002', 'Peter',   'Petrawicki', 'Peter Petrawicki', 'rep', 'IN', 2,    'Republican',  NULL,     '1955-06-15', true),
  ('R000003', 'Andy',    'Skampt',     'Andy Skampt',      'rep', 'IN', 3,    'Independent', NULL,     '1992-09-20', true),
  ('R000004', 'Miranda', 'Beckwith',   'Miranda Beckwith', 'rep', 'IN', 4,    'Democrat',    NULL,     '1978-11-30', true)
ON CONFLICT (bioguide_id) DO NOTHING;
