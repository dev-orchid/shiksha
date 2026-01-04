-- =====================================================
-- SALARY MODULE COMPLETE SETUP
-- Run this in Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Create salary_components table (if not exists)
CREATE TABLE IF NOT EXISTS salary_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    component_type VARCHAR(20) NOT NULL CHECK (component_type IN ('earning', 'deduction')),
    is_percentage BOOLEAN DEFAULT false,
    percentage_of VARCHAR(50),
    default_value DECIMAL(10, 2),
    is_taxable BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, name)
);

-- 2. Create salary_structures table (if not exists)
CREATE TABLE IF NOT EXISTS salary_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    employee_type VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, name)
);

-- 3. Create salary_structure_details table (if not exists)
CREATE TABLE IF NOT EXISTS salary_structure_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salary_structure_id UUID REFERENCES salary_structures(id) ON DELETE CASCADE,
    salary_component_id UUID REFERENCES salary_components(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2),
    percentage DECIMAL(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(salary_structure_id, salary_component_id)
);

-- 4. Create staff_salary_assignments table (if not exists)
CREATE TABLE IF NOT EXISTS staff_salary_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    salary_structure_id UUID REFERENCES salary_structures(id),
    basic_salary DECIMAL(10, 2) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_current BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create salary_payroll table (if not exists)
CREATE TABLE IF NOT EXISTS salary_payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id),
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

-- 6. Create salary_payroll_details table (if not exists)
CREATE TABLE IF NOT EXISTS salary_payroll_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_id UUID REFERENCES salary_payroll(id) ON DELETE CASCADE,
    salary_component_id UUID REFERENCES salary_components(id),
    component_name VARCHAR(100) NOT NULL,
    component_type VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Add employee_type column to salary_structures if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'salary_structures' AND column_name = 'employee_type') THEN
        ALTER TABLE salary_structures ADD COLUMN employee_type VARCHAR(50);
    END IF;
END $$;

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_salary_components_school ON salary_components(school_id);
CREATE INDEX IF NOT EXISTS idx_salary_structures_school ON salary_structures(school_id);
CREATE INDEX IF NOT EXISTS idx_salary_structures_employee_type ON salary_structures(employee_type);
CREATE INDEX IF NOT EXISTS idx_staff_salary_assignments_staff ON staff_salary_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_salary_assignments_current ON staff_salary_assignments(is_current);
CREATE INDEX IF NOT EXISTS idx_salary_payroll_school ON salary_payroll(school_id);
CREATE INDEX IF NOT EXISTS idx_salary_payroll_staff ON salary_payroll(staff_id);
CREATE INDEX IF NOT EXISTS idx_salary_payroll_month_year ON salary_payroll(month, year);

-- Done!
-- After running this, go to your app and:
-- 1. Salary → Salary Structure → Click "Add Defaults" to add PF, ESI, HRA, etc.
-- 2. Create a salary structure
-- 3. Assign salary to staff members
-- 4. Generate payroll
