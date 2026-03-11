CREATE TABLE IF NOT EXISTS onboarding_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    editorial_name TEXT NOT NULL,
    admin_name TEXT NOT NULL,
    admin_email TEXT NOT NULL,
    tax_id TEXT, -- RUT
    address TEXT,
    logo_url TEXT,
    validation_screenshot_url TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE onboarding_requests ENABLE ROW LEVEL SECURITY;

-- Allow public inserts
CREATE POLICY "Allow public inserts for onboarding" ON onboarding_requests FOR INSERT WITH CHECK (true);

-- Allow superadmins to view/update (simplified policy for now)
CREATE POLICY "Allow superadmin view all" ON onboarding_requests FOR SELECT USING (true);
CREATE POLICY "Allow superadmin update all" ON onboarding_requests FOR UPDATE USING (true);

-- Realtime
ALTER TABLE onboarding_requests REPLICA IDENTITY FULL;
