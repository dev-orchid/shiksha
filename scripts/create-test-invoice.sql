-- Create Test Invoice for Razorpay Testing
-- Run this in Supabase SQL Editor

-- First, let's see what students and parents exist for this school
SELECT
    s.code as school_code,
    st.id as student_id,
    st.admission_number,
    st.first_name || ' ' || COALESCE(st.last_name, '') as student_name,
    p.first_name || ' ' || COALESCE(p.last_name, '') as parent_name,
    u.email as parent_email,
    u.id as parent_user_id,
    rc.is_enabled as razorpay_enabled,
    rc.mode as razorpay_mode
FROM schools s
JOIN students st ON st.school_id = s.id AND st.status = 'active'
JOIN student_parents sp ON sp.student_id = st.id
JOIN parents p ON p.id = sp.parent_id
JOIN users u ON u.id = p.user_id AND u.is_active = true
LEFT JOIN razorpay_configs rc ON rc.school_id = s.id
WHERE s.code = 'ABCINMKFH6ETN'
LIMIT 10;

-- Check Razorpay config
SELECT
    id,
    school_id,
    key_id,
    mode,
    is_enabled,
    display_name
FROM razorpay_configs
WHERE school_id = (SELECT id FROM schools WHERE code = 'ABCINMKFH6ETN');

-- Create a test invoice (replace STUDENT_ID with an actual student ID from above query)
-- Uncomment and modify the INSERT below after getting a student ID

/*
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
SELECT
    s.id as school_id,
    'REPLACE_WITH_STUDENT_ID'::uuid as student_id,  -- Replace this
    'INV-RAZORPAY-TEST-' || EXTRACT(EPOCH FROM NOW())::INT as invoice_number,
    ay.id as academic_year_id,
    EXTRACT(MONTH FROM CURRENT_DATE)::INT as month,
    EXTRACT(YEAR FROM CURRENT_DATE)::INT as year,
    100.00 as total_amount,    -- Small test amount ₹100
    0.00 as discount_amount,
    0.00 as late_fee,
    100.00 as net_amount,
    0.00 as paid_amount,
    100.00 as balance_amount,
    CURRENT_DATE + INTERVAL '7 days' as due_date,
    'pending' as status
FROM schools s
LEFT JOIN academic_years ay ON ay.school_id = s.id AND ay.is_current = true
WHERE s.code = 'ABCINMKFH6ETN';
*/

-- Check existing pending invoices
SELECT
    fi.id,
    fi.invoice_number,
    fi.balance_amount,
    fi.status,
    st.first_name || ' ' || COALESCE(st.last_name, '') as student_name
FROM fee_invoices fi
JOIN students st ON st.id = fi.student_id
JOIN schools s ON s.id = fi.school_id
WHERE s.code = 'ABCINMKFH6ETN'
AND fi.status IN ('pending', 'partial', 'overdue')
LIMIT 10;
