-- Fix for apsajay5172@gmail.com - Create a new unique school for this user
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    new_school_id UUID;
    user_auth_id UUID;
    user_table_id UUID;
BEGIN
    -- 1. Create a new school for apsajay5172@gmail.com
    INSERT INTO schools (name, code, email, is_active)
    VALUES (
        'XYZ School', -- You can change this to the actual school name
        'APSAJAY' || EXTRACT(EPOCH FROM NOW())::TEXT, -- Unique code
        'apsajay5172@gmail.com',
        true
    )
    RETURNING id INTO new_school_id;

    RAISE NOTICE 'Created new school with ID: %', new_school_id;

    -- 2. Get the user's ID from users table
    SELECT id INTO user_table_id
    FROM users
    WHERE email = 'apsajay5172@gmail.com';

    IF user_table_id IS NOT NULL THEN
        -- 3. Update the user's school_id in the users table
        UPDATE users
        SET school_id = new_school_id
        WHERE email = 'apsajay5172@gmail.com';

        RAISE NOTICE 'Updated users table school_id for apsajay5172@gmail.com';
    END IF;

    -- 4. Get auth user ID and update metadata
    SELECT id INTO user_auth_id
    FROM auth.users
    WHERE email = 'apsajay5172@gmail.com';

    IF user_auth_id IS NOT NULL THEN
        -- 5. Update auth.users raw_user_meta_data to include new school_id
        UPDATE auth.users
        SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('school_id', new_school_id::TEXT)
        WHERE email = 'apsajay5172@gmail.com';

        RAISE NOTICE 'Updated auth.users metadata for apsajay5172@gmail.com';
    END IF;

    -- 6. If there's a staff record, update it too
    UPDATE staff
    SET school_id = new_school_id
    WHERE email = 'apsajay5172@gmail.com';

    RAISE NOTICE 'Migration complete! New school ID: %', new_school_id;
    RAISE NOTICE 'User apsajay5172@gmail.com now has their own unique school.';
END $$;

-- Verify the changes
SELECT
    u.email,
    u.school_id,
    s.name as school_name,
    s.code as school_code
FROM users u
LEFT JOIN schools s ON u.school_id = s.id
WHERE u.email = 'apsajay5172@gmail.com';
