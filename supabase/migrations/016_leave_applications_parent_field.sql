-- =====================================================
-- ADD PARENT REFERENCE TO LEAVE APPLICATIONS
-- =====================================================
-- This migration adds a field to track which parent submitted
-- a leave application for their child

-- Add column for parent who submitted the leave application
ALTER TABLE leave_applications
ADD COLUMN IF NOT EXISTS applied_by_parent_id UUID REFERENCES parents(id) ON DELETE SET NULL;

-- Add index for faster lookups by parent
CREATE INDEX IF NOT EXISTS idx_leave_applications_parent
ON leave_applications(applied_by_parent_id) WHERE applied_by_parent_id IS NOT NULL;

-- Add index for student leave applications by status
CREATE INDEX IF NOT EXISTS idx_leave_applications_student_status
ON leave_applications(student_id, status) WHERE student_id IS NOT NULL;
