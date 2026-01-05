-- Add unique constraint to prevent duplicate invoices for same student/month/year
-- This ensures data integrity at the database level

-- First, we need to handle existing duplicates by keeping only the oldest one per student/month/year
-- Delete duplicate invoices, keeping the one with the earliest created_at
DELETE FROM fee_invoices a
USING fee_invoices b
WHERE a.student_id = b.student_id
  AND a.month = b.month
  AND a.year = b.year
  AND a.created_at > b.created_at;

-- Now add the unique constraint
ALTER TABLE fee_invoices
ADD CONSTRAINT fee_invoices_student_month_year_unique
UNIQUE (student_id, month, year);

-- Add index for faster duplicate checking
CREATE INDEX IF NOT EXISTS idx_fee_invoices_student_month_year
ON fee_invoices(student_id, month, year);
