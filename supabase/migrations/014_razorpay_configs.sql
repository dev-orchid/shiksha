-- Razorpay Payment Gateway Configuration
-- Each school can configure their own Razorpay credentials

-- Razorpay configurations per school
CREATE TABLE razorpay_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    key_id VARCHAR(50) NOT NULL,
    key_secret_encrypted TEXT NOT NULL,
    webhook_secret_encrypted TEXT,
    mode VARCHAR(10) DEFAULT 'test' CHECK (mode IN ('test', 'live')),
    is_enabled BOOLEAN DEFAULT false,
    display_name VARCHAR(100),
    theme_color VARCHAR(7),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    UNIQUE(school_id)
);

-- Add Razorpay fields to payment_transactions
ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(20) DEFAULT 'ntt_data',
ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(255);

-- Indexes
CREATE INDEX idx_razorpay_configs_school ON razorpay_configs(school_id);
CREATE INDEX idx_payment_transactions_razorpay_order ON payment_transactions(razorpay_order_id);
CREATE INDEX idx_payment_transactions_gateway ON payment_transactions(payment_gateway);

-- Trigger for updated_at on razorpay_configs
CREATE TRIGGER update_razorpay_configs_updated_at
    BEFORE UPDATE ON razorpay_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
