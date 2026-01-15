-- Fix super admin user: Remove school_id from super_admin users
-- Super admins should have NULL school_id to access all schools

UPDATE users
SET school_id = NULL
WHERE role = 'super_admin';

-- Verify the change
SELECT id, email, role, school_id
FROM users
WHERE role = 'super_admin';
