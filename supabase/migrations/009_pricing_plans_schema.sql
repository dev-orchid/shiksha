-- Migration: Add pricing plan system with account types
-- Description: Adds plan_type to schools, creates usage tracking and upgrade request tables

-- Create enum for pricing plans
CREATE TYPE pricing_plan AS ENUM ('starter', 'professional', 'enterprise');

-- Add pricing plan fields to schools table
ALTER TABLE schools
ADD COLUMN plan_type pricing_plan DEFAULT 'starter',
ADD COLUMN plan_start_date DATE DEFAULT NOW(),
ADD COLUMN plan_renewal_date DATE,
ADD COLUMN student_limit INTEGER DEFAULT 300,
ADD COLUMN admin_user_limit INTEGER DEFAULT 5,
ADD COLUMN is_trial BOOLEAN DEFAULT false,
ADD COLUMN trial_end_date DATE,
ADD COLUMN plan_notes TEXT;

-- Create table for tracking school usage statistics
CREATE TABLE school_usage_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    stat_date DATE DEFAULT CURRENT_DATE,
    active_students_count INTEGER DEFAULT 0,
    admin_users_count INTEGER DEFAULT 0,
    whatsapp_messages_sent INTEGER DEFAULT 0,
    reports_generated INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, stat_date)
);

-- Create table for plan upgrade requests
CREATE TABLE plan_upgrade_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    current_plan pricing_plan NOT NULL,
    requested_plan pricing_plan NOT NULL,
    reason TEXT,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_schools_plan_type ON schools(plan_type);
CREATE INDEX idx_school_usage_stats_school_date ON school_usage_stats(school_id, stat_date);
CREATE INDEX idx_plan_upgrade_requests_school ON plan_upgrade_requests(school_id);
CREATE INDEX idx_plan_upgrade_requests_status ON plan_upgrade_requests(status);

-- Add trigger for updated_at on plan_upgrade_requests
CREATE TRIGGER update_plan_upgrade_requests_updated_at
BEFORE UPDATE ON plan_upgrade_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate current usage for a school
CREATE OR REPLACE FUNCTION get_school_current_usage(p_school_id UUID)
RETURNS TABLE (
    active_students INTEGER,
    admin_users INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*)::INTEGER FROM students WHERE school_id = p_school_id AND status = 'active'),
        (SELECT COUNT(*)::INTEGER FROM users WHERE school_id = p_school_id AND role IN ('admin', 'principal') AND is_active = true);
END;
$$ LANGUAGE plpgsql;

-- Migrate existing schools to 'starter' plan
UPDATE schools SET
    plan_type = 'starter',
    plan_start_date = NOW(),
    student_limit = 300,
    admin_user_limit = 5
WHERE plan_type IS NULL;
