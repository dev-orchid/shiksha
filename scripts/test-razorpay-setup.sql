-- Test Razorpay Setup Script
-- Run this in Supabase SQL Editor to create test data for Razorpay payment testing

-- Step 1: Get school ID for code ABCINMKFH6ETN
DO $$
DECLARE
    v_school_id UUID;
    v_student_id UUID;
    v_parent_user_id UUID;
    v_parent_id UUID;
    v_class_id UUID;
    v_academic_year_id UUID;
    v_invoice_id UUID;
BEGIN
    -- Get school ID
    SELECT id INTO v_school_id FROM schools WHERE code = 'ABCINMKFH6ETN';

    IF v_school_id IS NULL THEN
        RAISE EXCEPTION 'School with code ABCINMKFH6ETN not found';
    END IF;

    RAISE NOTICE 'School ID: %', v_school_id;

    -- Check if Razorpay config exists
    IF NOT EXISTS (SELECT 1 FROM razorpay_configs WHERE school_id = v_school_id) THEN
        RAISE NOTICE 'WARNING: Razorpay config not found for this school. Please configure via Settings > Payment Gateway';
    ELSE
        RAISE NOTICE 'Razorpay config found for school';
    END IF;

    -- Get or create a class
    SELECT id INTO v_class_id FROM classes WHERE school_id = v_school_id AND is_active = true LIMIT 1;
    IF v_class_id IS NULL THEN
        INSERT INTO classes (school_id, name, grade_level, is_active)
        VALUES (v_school_id, 'Test Class 1', 1, true)
        RETURNING id INTO v_class_id;
        RAISE NOTICE 'Created test class: %', v_class_id;
    END IF;

    -- Get or create academic year
    SELECT id INTO v_academic_year_id FROM academic_years WHERE school_id = v_school_id AND is_current = true LIMIT 1;
    IF v_academic_year_id IS NULL THEN
        INSERT INTO academic_years (school_id, name, start_date, end_date, is_current)
        VALUES (v_school_id, '2024-25', '2024-04-01', '2025-03-31', true)
        RETURNING id INTO v_academic_year_id;
        RAISE NOTICE 'Created academic year: %', v_academic_year_id;
    END IF;

    -- Create test student
    INSERT INTO students (
        school_id,
        admission_number,
        first_name,
        last_name,
        date_of_birth,
        admission_date,
        current_class_id,
        academic_year_id,
        status,
        email,
        phone
    )
    VALUES (
        v_school_id,
        'TEST-' || EXTRACT(EPOCH FROM NOW())::INT,
        'Test',
        'Student',
        '2015-01-15',
        CURRENT_DATE,
        v_class_id,
        v_academic_year_id,
        'active',
        'teststudent@example.com',
        '9876543210'
    )
    RETURNING id INTO v_student_id;

    RAISE NOTICE 'Created test student: %', v_student_id;

    -- Create test parent user in auth.users (via Supabase auth)
    -- Note: This creates the user in the users table; the actual auth user needs to be created separately
    INSERT INTO users (
        school_id,
        email,
        role,
        is_active,
        phone
    )
    VALUES (
        v_school_id,
        'testparent' || EXTRACT(EPOCH FROM NOW())::INT || '@example.com',
        'parent',
        true,
        '9876543211'
    )
    RETURNING id INTO v_parent_user_id;

    RAISE NOTICE 'Created test parent user: %', v_parent_user_id;

    -- Create parent record
    INSERT INTO parents (
        school_id,
        user_id,
        first_name,
        last_name,
        relation,
        phone,
        email,
        is_primary_contact
    )
    VALUES (
        v_school_id,
        v_parent_user_id,
        'Test',
        'Parent',
        'father',
        '9876543211',
        'testparent' || EXTRACT(EPOCH FROM NOW())::INT || '@example.com',
        true
    )
    RETURNING id INTO v_parent_id;

    RAISE NOTICE 'Created test parent: %', v_parent_id;

    -- Link parent to student
    INSERT INTO student_parents (student_id, parent_id, is_primary)
    VALUES (v_student_id, v_parent_id, true);

    RAISE NOTICE 'Linked parent to student';

    -- Create test fee invoice
    INSERT INTO fee_invoices (
        school_id,
        student_id,
        invoice_number,
        academic_year_id,
        month,
        year,
        total_amount,
        discount_amount,
        late_fee,
        net_amount,
        paid_amount,
        balance_amount,
        due_date,
        status
    )
    VALUES (
        v_school_id,
        v_student_id,
        'INV-TEST-' || EXTRACT(EPOCH FROM NOW())::INT,
        v_academic_year_id,
        EXTRACT(MONTH FROM CURRENT_DATE)::INT,
        EXTRACT(YEAR FROM CURRENT_DATE)::INT,
        1000.00,  -- Total amount
        0.00,     -- Discount
        0.00,     -- Late fee
        1000.00,  -- Net amount
        0.00,     -- Paid amount
        1000.00,  -- Balance amount
        CURRENT_DATE + INTERVAL '7 days',  -- Due date
        'pending'
    )
    RETURNING id INTO v_invoice_id;

    RAISE NOTICE 'Created test invoice: %', v_invoice_id;

    -- Output summary
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'TEST DATA CREATED SUCCESSFULLY';
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'School ID: %', v_school_id;
    RAISE NOTICE 'Student ID: %', v_student_id;
    RAISE NOTICE 'Parent User ID: %', v_parent_user_id;
    RAISE NOTICE 'Invoice ID: %', v_invoice_id;
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Create auth user for parent via Supabase Auth dashboard';
    RAISE NOTICE '2. Use email: testparent...@example.com (check users table)';
    RAISE NOTICE '3. Login as parent and go to /parent/fees';
    RAISE NOTICE '4. Click Pay on the test invoice';
    RAISE NOTICE '===============================================';

END $$;

-- Query to verify the created data
SELECT
    s.code as school_code,
    st.admission_number,
    st.first_name || ' ' || st.last_name as student_name,
    u.email as parent_email,
    fi.invoice_number,
    fi.balance_amount,
    fi.status as invoice_status,
    rc.is_enabled as razorpay_enabled
FROM schools s
JOIN students st ON st.school_id = s.id
JOIN student_parents sp ON sp.student_id = st.id
JOIN parents p ON p.id = sp.parent_id
JOIN users u ON u.id = p.user_id
JOIN fee_invoices fi ON fi.student_id = st.id
LEFT JOIN razorpay_configs rc ON rc.school_id = s.id
WHERE s.code = 'ABCINMKFH6ETN'
AND st.first_name = 'Test'
ORDER BY st.created_at DESC
LIMIT 1;
