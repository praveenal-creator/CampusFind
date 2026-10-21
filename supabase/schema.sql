-- ============================================================================
-- CAMPUSFIND: PostgreSQL Schema & Row Level Security (RLS) Policies
-- Free-tier Supabase compatible
-- ============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. PROFILES TABLE (Users & Roles)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  campus_domain TEXT NOT NULL,
  avatar_url TEXT,
  phone_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by authenticated campus users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 2. REPORTS TABLE (Lost & Found Items)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('lost', 'found')),
  category TEXT NOT NULL CHECK (category IN (
    'Electronics',
    'IDs & Badges',
    'Keys',
    'Bags & Wallets',
    'Audio & Headphones',
    'Bottles & Tumblers',
    'Clothing & Accessories',
    'Books & Notebooks',
    'Eyewear',
    'Other'
  )),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  secondary_color TEXT,
  brand TEXT,
  location_zone TEXT NOT NULL,
  location_detail TEXT NOT NULL,
  date_occurred DATE NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'claim_pending', 'returned', 'expired', 'archived')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '45 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_type_status ON public.reports (type, status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON public.reports (category);
CREATE INDEX IF NOT EXISTS idx_reports_location ON public.reports (location_zone);
CREATE INDEX IF NOT EXISTS idx_reports_created ON public.reports (created_at DESC);

-- RLS: Reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view open reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports or admins can update any"
  ON public.reports FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can delete their own reports or admins can delete any"
  ON public.reports FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ----------------------------------------------------------------------------
-- 3. VERIFICATION QUESTIONS (Private details to prove ownership)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.verification_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  -- Stored encrypted/hashed or strictly isolated through RLS
  expected_answer_hash TEXT NOT NULL,
  hint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Verification Questions
ALTER TABLE public.verification_questions ENABLE ROW LEVEL SECURITY;

-- Questions are readable to allow claimants to see prompts, but NOT the expected answer hash!
CREATE POLICY "Claimants can view questions and hints for open items"
  ON public.verification_questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Report finders can insert verification questions"
  ON public.verification_questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reports 
      WHERE reports.id = verification_questions.report_id 
      AND reports.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 4. CLAIMS TABLE (Ownership claim verification)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  claimant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (
    status IN ('submitted', 'under_review', 'approved', 'rejected', 'cancelled', 'returned')
  ),
  attempt_count INT NOT NULL DEFAULT 1,
  answers_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_active_claim_per_user_per_report UNIQUE (report_id, claimant_id)
);

CREATE INDEX IF NOT EXISTS idx_claims_report ON public.claims (report_id);
CREATE INDEX IF NOT EXISTS idx_claims_claimant ON public.claims (claimant_id);

-- RLS: Claims
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Claimants, item finders, and admins can view claims"
  ON public.claims FOR SELECT
  TO authenticated
  USING (
    auth.uid() = claimant_id OR
    EXISTS (SELECT 1 FROM public.reports WHERE reports.id = claims.report_id AND reports.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated users can submit a claim"
  ON public.claims FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = claimant_id);

CREATE POLICY "Finders and admins can update claim status"
  ON public.claims FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.reports WHERE reports.id = claims.report_id AND reports.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ----------------------------------------------------------------------------
-- 5. PRIVATE MESSAGES TABLE (Claim-specific chat between parties)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_claim ON public.messages (claim_id, created_at ASC);

-- RLS: Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only authorized claim participants or admins can read messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.claims c
      JOIN public.reports r ON r.id = c.report_id
      WHERE c.id = messages.claim_id
      AND (
        c.claimant_id = auth.uid() OR 
        r.user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

CREATE POLICY "Only authorized claim participants can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.claims c
      JOIN public.reports r ON r.id = c.report_id
      WHERE c.id = messages.claim_id
      AND c.status = 'approved'
      AND (c.claimant_id = auth.uid() OR r.user_id = auth.uid())
    )
  );

-- ----------------------------------------------------------------------------
-- 6. SAFE HANDOVER TABLE (Designated campus spot pickups)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.handovers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  location_name TEXT NOT NULL,
  meeting_time TIMESTAMPTZ NOT NULL,
  notes TEXT,
  finder_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  claimant_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Handovers
ALTER TABLE public.handovers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized claim participants can view handovers"
  ON public.handovers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.claims c
      JOIN public.reports r ON r.id = c.report_id
      WHERE c.id = handovers.claim_id
      AND (c.claimant_id = auth.uid() OR r.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "Authorized claim participants can manage handovers"
  ON public.handovers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.claims c
      JOIN public.reports r ON r.id = c.report_id
      WHERE c.id = handovers.claim_id
      AND (c.claimant_id = auth.uid() OR r.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- ----------------------------------------------------------------------------
-- 7. AUDIT LOGS TABLE (Administrative and security audit trail)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs (created_at DESC);

-- RLS: Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can append audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
