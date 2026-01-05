-- Payment Transactions Table for Online Payments
-- Tracks payment gateway transactions separately from fee_payments

CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES fee_invoices(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,

    -- Transaction details
    order_id VARCHAR(50) UNIQUE NOT NULL,
    transaction_id VARCHAR(100),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',

    -- Status tracking
    status VARCHAR(20) DEFAULT 'initiated' CHECK (status IN ('initiated', 'pending', 'success', 'failed', 'cancelled')),
    payment_mode VARCHAR(20),

    -- NTT DATA specific fields
    ntt_order_id VARCHAR(100),
    ntt_response_code VARCHAR(20),
    ntt_response_message TEXT,

    -- Customer info
    initiated_by UUID REFERENCES users(id),
    customer_name VARCHAR(200),
    customer_email VARCHAR(200),
    customer_phone VARCHAR(20),

    -- Timestamps
    initiated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- Raw data for audit trail
    gateway_request JSONB,
    gateway_response JSONB,
    webhook_payload JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_invoice ON payment_transactions(invoice_id);
CREATE INDEX idx_payment_transactions_student ON payment_transactions(student_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_school ON payment_transactions(school_id);

-- Add column to fee_payments to link online payments
ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS payment_transaction_id UUID REFERENCES payment_transactions(id);

-- Trigger for updated_at
CREATE TRIGGER update_payment_transactions_updated_at
    BEFORE UPDATE ON payment_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
