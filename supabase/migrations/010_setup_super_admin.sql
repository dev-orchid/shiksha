-- Migration: Setup super admin user
-- Description: Sets dev@orchidsw.com as super_admin with no school restriction

-- Update dev@orchidsw.com to super_admin role with no school_id
UPDATE users
SET role = 'super_admin', school_id = NULL
WHERE email = 'dev@orchidsw.com';

-- Note: If the user doesn't exist yet, they'll be created on first login
-- and will need to be manually updated to super_admin role
