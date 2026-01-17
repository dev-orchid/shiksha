-- Migration: Add platform settings table for super admin configuration
-- Description: Creates a key-value store for platform-wide settings

-- Create platform_settings table
CREATE TABLE platform_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add trigger for updated_at
CREATE TRIGGER update_platform_settings_updated_at
BEFORE UPDATE ON platform_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default platform settings
INSERT INTO platform_settings (key, value, description) VALUES
('general', '{
    "platform_name": "School Management System",
    "support_email": "support@example.com",
    "default_timezone": "Asia/Kolkata",
    "default_currency": "INR"
}', 'General platform settings'),
('feature_flags', '{
    "whatsapp_integration": true,
    "parent_portal": true,
    "student_portal": true,
    "sms_notifications": false,
    "email_notifications": true
}', 'Feature flags for enabling/disabling features'),
('payment_gateway', '{
    "provider": "razorpay",
    "is_configured": false
}', 'Payment gateway configuration'),
('pricing_plans', '{
    "starter": {
        "name": "Starter",
        "price": 5000,
        "currency": "INR",
        "period": "month",
        "student_limit": 300,
        "admin_limit": 5,
        "features": ["Basic reports", "Email support"]
    },
    "professional": {
        "name": "Professional",
        "price": 15000,
        "currency": "INR",
        "period": "month",
        "student_limit": 1000,
        "admin_limit": 15,
        "features": ["Advanced reports", "WhatsApp integration", "Priority support"]
    },
    "enterprise": {
        "name": "Enterprise",
        "price": null,
        "currency": "INR",
        "period": "month",
        "student_limit": null,
        "admin_limit": null,
        "features": ["Unlimited students", "Unlimited admin users", "Custom features", "Dedicated support", "SLA guarantee"]
    }
}', 'Pricing plan configurations');

-- Create index for fast key lookups
CREATE INDEX idx_platform_settings_key ON platform_settings(key);

-- RLS Policies
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Only super_admin can read/write platform settings
CREATE POLICY "Super admins can read platform settings"
ON platform_settings FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
);

CREATE POLICY "Super admins can update platform settings"
ON platform_settings FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
);
