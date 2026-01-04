-- Add employee_type to salary_structures to link structures with employee types
ALTER TABLE salary_structures
ADD COLUMN IF NOT EXISTS employee_type VARCHAR(50) DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN salary_structures.employee_type IS 'Links salary structure to specific employee type (teaching, non_teaching, administrative, support)';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_salary_structures_employee_type ON salary_structures(employee_type);

-- Insert default PF and ESI deduction components (if not exists)
-- These will be inserted when the school creates its first salary structure
