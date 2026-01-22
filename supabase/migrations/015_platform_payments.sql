-- Migration: Create platform_payments table
-- Description: Stores payment records for platform subscriptions

CREATE TABLE IF NOT EXISTS platform_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    razorpay_signature TEXT,
    plan_type VARCHAR(50),
    school_name VARCHAR(255),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    student_count INTEGER,
    amount INTEGER, -- Amount in paise
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(50) DEFAULT 'pending', -- pending, verified, used, failed
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_platform_payments_razorpay_order_id ON platform_payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_platform_payments_razorpay_payment_id ON platform_payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_platform_payments_status ON platform_payments(status);
CREATE INDEX IF NOT EXISTS idx_platform_payments_school_id ON platform_payments(school_id);

-- Add trigger for updated_at
CREATE TRIGGER update_platform_payments_updated_at
BEFORE UPDATE ON platform_payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
