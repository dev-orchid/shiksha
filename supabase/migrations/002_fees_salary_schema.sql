-- =====================================================
-- FEES MANAGEMENT TABLES
-- =====================================================

-- Fee Categories
CREATE TABLE fee_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_recurring BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, name)
);

-- Fee Structures
CREATE TABLE fee_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id),
    class_id UUID REFERENCES classes(id),
    fee_category_id UUID REFERENCES fee_categories(id),
    amount DECIMAL(10, 2) NOT NULL,
    frequency VARCHAR(20) DEFAULT 'monthly' CHECK (frequency IN ('one_time', 'monthly', 'quarterly', 'yearly')),
    due_day INTEGER DEFAULT 10,
    late_fee_per_day DECIMAL(10, 2) DEFAULT 0,
    max_late_fee DECIMAL(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, academic_year_id, class_id, fee_category_id)
);

-- Fee Discounts
CREATE TABLE fee_discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL,
    applicable_categories UUID[],
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student Fee Assignments
CREATE TABLE student_fee_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    fee_structure_id UUID REFERENCES fee_structures(id),
    discount_id UUID REFERENCES fee_discounts(id),
    custom_amount DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fee Invoices
CREATE TABLE fee_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL,
    academic_year_id UUID REFERENCES academic_years(id),
    month INTEGER,
    year INTEGER,
    total_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    late_fee DECIMAL(10, 2) DEFAULT 0,
    net_amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    balance_amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
    generated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, invoice_number)
);

-- Fee Invoice Items
CREATE TABLE fee_invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES fee_invoices(id) ON DELETE CASCADE,
    fee_category_id UUID REFERENCES fee_categories(id),
    description VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    net_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fee Payments
CREATE TABLE fee_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES fee_invoices(id) ON DELETE CASCADE,
    receipt_number VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_mode VARCHAR(50) NOT NULL CHECK (payment_mode IN ('cash', 'cheque', 'upi', 'card', 'bank_transfer', 'online')),
    transaction_id VARCHAR(100),
    cheque_number VARCHAR(50),
    cheque_date DATE,
    bank_name VARCHAR(100),
    remarks TEXT,
    received_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, receipt_number)
);

-- =====================================================
-- SALARY MANAGEMENT TABLES
-- =====================================================

-- Salary Components
CREATE TABLE salary_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    component_type VARCHAR(20) NOT NULL CHECK (component_type IN ('earning', 'deduction')),
    is_percentage BOOLEAN DEFAULT false,
    percentage_of VARCHAR(50),
    default_value DECIMAL(10, 2),
    is_taxable BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, name)
);

-- Salary Structures
CREATE TABLE salary_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, name)
);

-- Salary Structure Details
CREATE TABLE salary_structure_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salary_structure_id UUID REFERENCES salary_structures(id) ON DELETE CASCADE,
    salary_component_id UUID REFERENCES salary_components(id),
    amount DECIMAL(10, 2),
    percentage DECIMAL(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff Salary Assignments
CREATE TABLE staff_salary_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    salary_structure_id UUID REFERENCES salary_structures(id),
    basic_salary DECIMAL(10, 2) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_current BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Salary Payroll
CREATE TABLE salary_payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    working_days INTEGER,
    present_days INTEGER,
    leave_days INTEGER,
    gross_salary DECIMAL(10, 2) NOT NULL,
    total_deductions DECIMAL(10, 2) DEFAULT 0,
    net_salary DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid', 'cancelled')),
    processed_by UUID REFERENCES users(id),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(staff_id, month, year)
);

-- Salary Payroll Details
CREATE TABLE salary_payroll_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_id UUID REFERENCES salary_payroll(id) ON DELETE CASCADE,
    salary_component_id UUID REFERENCES salary_components(id),
    component_type VARCHAR(20) NOT NULL CHECK (component_type IN ('earning', 'deduction')),
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Salary Payments
CREATE TABLE salary_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    payroll_id UUID REFERENCES salary_payroll(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_mode VARCHAR(50) NOT NULL CHECK (payment_mode IN ('bank_transfer', 'cheque', 'cash')),
    transaction_id VARCHAR(100),
    bank_reference VARCHAR(100),
    remarks TEXT,
    paid_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_fee_invoices_school ON fee_invoices(school_id);
CREATE INDEX idx_fee_invoices_student ON fee_invoices(student_id);
CREATE INDEX idx_fee_invoices_status ON fee_invoices(status);
CREATE INDEX idx_fee_invoices_due_date ON fee_invoices(due_date);
CREATE INDEX idx_fee_payments_school ON fee_payments(school_id);
CREATE INDEX idx_fee_payments_invoice ON fee_payments(invoice_id);
CREATE INDEX idx_salary_payroll_school ON salary_payroll(school_id);
CREATE INDEX idx_salary_payroll_staff ON salary_payroll(staff_id);
CREATE INDEX idx_salary_payroll_period ON salary_payroll(year, month);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_fee_invoices_updated_at BEFORE UPDATE ON fee_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_salary_payroll_updated_at BEFORE UPDATE ON salary_payroll FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
