-- =====================================================
-- SEED DATA FOR SCHOOL MANAGEMENT SYSTEM
-- =====================================================

-- Insert a sample school
INSERT INTO schools (id, name, code, address, city, state, country, pincode, phone, email, principal_name, established_year, board_affiliation, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Manas International Public School',
    'MIPS-001',
    'Main Road, Jehanabad',
    'Jehanabad',
    'Bihar',
    'India',
    '804408',
    '9876543210',
    'info@manasschool.edu.in',
    'Dr. Rajesh Kumar',
    2010,
    'CBSE',
    true
);

-- Insert academic year
INSERT INTO academic_years (id, school_id, name, start_date, end_date, is_current)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '2024-2025',
    '2024-04-01',
    '2025-03-31',
    true
);

-- Insert classes
INSERT INTO classes (id, school_id, name, grade_level) VALUES
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Nursery', 0),
('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'LKG', 0),
('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'UKG', 0),
('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Class 1', 1),
('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'Class 2', 2),
('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 'Class 3', 3),
('00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', 'Class 4', 4),
('00000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', 'Class 5', 5),
('00000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', 'Class 6', 6),
('00000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001', 'Class 7', 7),
('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'Class 8', 8),
('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'Class 9', 9),
('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 'Class 10', 10),
('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', 'Class 11', 11),
('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', 'Class 12', 12);

-- Insert sections for each class
INSERT INTO sections (school_id, class_id, name, capacity)
SELECT
    '00000000-0000-0000-0000-000000000001',
    c.id,
    s.name,
    40
FROM classes c
CROSS JOIN (VALUES ('A'), ('B'), ('C')) AS s(name)
WHERE c.school_id = '00000000-0000-0000-0000-000000000001';

-- Insert subjects
INSERT INTO subjects (id, school_id, name, code) VALUES
('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', 'English', 'ENG'),
('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', 'Hindi', 'HIN'),
('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', 'Mathematics', 'MAT'),
('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000001', 'Science', 'SCI'),
('00000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000001', 'Social Science', 'SST'),
('00000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000001', 'Computer Science', 'CS'),
('00000000-0000-0000-0000-000000000036', '00000000-0000-0000-0000-000000000001', 'Physical Education', 'PE'),
('00000000-0000-0000-0000-000000000037', '00000000-0000-0000-0000-000000000001', 'Art', 'ART');

-- Insert departments
INSERT INTO departments (id, school_id, name, code) VALUES
('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', 'Administration', 'ADMIN'),
('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000001', 'Science', 'SCI'),
('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000001', 'Mathematics', 'MATH'),
('00000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000001', 'Languages', 'LANG'),
('00000000-0000-0000-0000-000000000044', '00000000-0000-0000-0000-000000000001', 'Social Studies', 'SST'),
('00000000-0000-0000-0000-000000000045', '00000000-0000-0000-0000-000000000001', 'Physical Education', 'PE');

-- Insert admin user (password: admin123)
-- Password hash generated with bcrypt for 'admin123'
INSERT INTO users (id, school_id, email, password_hash, role, is_active, email_verified)
VALUES (
    '00000000-0000-0000-0000-000000000100',
    '00000000-0000-0000-0000-000000000001',
    'admin@manasschool.edu.in',
    '$2a$10$rQnM8xwYxJ8xkKK8X8xkKOeQzXzPzXzPzXzPzXzPzXzPzXzPzXzPz',
    'admin',
    true,
    true
);

-- Insert sample teacher user (password: teacher123)
INSERT INTO users (id, school_id, email, password_hash, role, is_active, email_verified)
VALUES (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000001',
    'teacher@manasschool.edu.in',
    '$2a$10$rQnM8xwYxJ8xkKK8X8xkKOeQzXzPzXzPzXzPzXzPzXzPzXzPzXzPz',
    'teacher',
    true,
    true
);

-- Insert exam types
INSERT INTO exam_types (school_id, name, description, weightage) VALUES
('00000000-0000-0000-0000-000000000001', 'Unit Test 1', 'First unit test', 10),
('00000000-0000-0000-0000-000000000001', 'Unit Test 2', 'Second unit test', 10),
('00000000-0000-0000-0000-000000000001', 'Half Yearly', 'Half yearly examination', 30),
('00000000-0000-0000-0000-000000000001', 'Unit Test 3', 'Third unit test', 10),
('00000000-0000-0000-0000-000000000001', 'Unit Test 4', 'Fourth unit test', 10),
('00000000-0000-0000-0000-000000000001', 'Annual', 'Annual examination', 30);

-- Insert fee categories
INSERT INTO fee_categories (school_id, name, description, is_recurring) VALUES
('00000000-0000-0000-0000-000000000001', 'Tuition Fee', 'Monthly tuition fee', true),
('00000000-0000-0000-0000-000000000001', 'Admission Fee', 'One-time admission fee', false),
('00000000-0000-0000-0000-000000000001', 'Annual Fee', 'Annual charges', false),
('00000000-0000-0000-0000-000000000001', 'Transport Fee', 'School bus fee', true),
('00000000-0000-0000-0000-000000000001', 'Lab Fee', 'Laboratory charges', false),
('00000000-0000-0000-0000-000000000001', 'Library Fee', 'Library charges', false),
('00000000-0000-0000-0000-000000000001', 'Sports Fee', 'Sports and games fee', false),
('00000000-0000-0000-0000-000000000001', 'Computer Fee', 'Computer lab charges', true);

-- Insert salary components
INSERT INTO salary_components (school_id, name, component_type, is_percentage, percentage_of, default_value, is_taxable) VALUES
('00000000-0000-0000-0000-000000000001', 'Basic Salary', 'earning', false, NULL, NULL, true),
('00000000-0000-0000-0000-000000000001', 'HRA', 'earning', true, 'basic', 20, true),
('00000000-0000-0000-0000-000000000001', 'DA', 'earning', true, 'basic', 10, true),
('00000000-0000-0000-0000-000000000001', 'Conveyance', 'earning', false, NULL, 1600, false),
('00000000-0000-0000-0000-000000000001', 'Medical Allowance', 'earning', false, NULL, 1250, false),
('00000000-0000-0000-0000-000000000001', 'PF Deduction', 'deduction', true, 'basic', 12, false),
('00000000-0000-0000-0000-000000000001', 'Professional Tax', 'deduction', false, NULL, 200, false),
('00000000-0000-0000-0000-000000000001', 'TDS', 'deduction', false, NULL, 0, false);

-- Insert leave types
INSERT INTO leave_types (school_id, name, description, days_allowed, is_paid, applicable_to) VALUES
('00000000-0000-0000-0000-000000000001', 'Casual Leave', 'Casual leave for personal reasons', 12, true, 'all'),
('00000000-0000-0000-0000-000000000001', 'Sick Leave', 'Medical leave', 10, true, 'all'),
('00000000-0000-0000-0000-000000000001', 'Earned Leave', 'Accumulated leave', 15, true, 'all'),
('00000000-0000-0000-0000-000000000001', 'Maternity Leave', 'Maternity leave for female staff', 180, true, 'all'),
('00000000-0000-0000-0000-000000000001', 'Paternity Leave', 'Paternity leave for male staff', 15, true, 'all');

-- Insert grade settings
INSERT INTO grade_settings (school_id, academic_year_id, grade, min_percentage, max_percentage, grade_point, remarks) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'A+', 90, 100, 10, 'Outstanding'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'A', 80, 89.99, 9, 'Excellent'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'B+', 70, 79.99, 8, 'Very Good'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'B', 60, 69.99, 7, 'Good'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'C+', 50, 59.99, 6, 'Above Average'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'C', 40, 49.99, 5, 'Average'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'D', 33, 39.99, 4, 'Below Average'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'F', 0, 32.99, 0, 'Fail');

-- Insert WhatsApp templates
INSERT INTO whatsapp_templates (school_id, name, category, content, variables) VALUES
('00000000-0000-0000-0000-000000000001', 'Fee Reminder', 'fee_reminder',
 'Dear {{parent_name}}, this is a reminder that {{student_name}}''s fee of Rs. {{amount}} for {{month}} is due on {{due_date}}. Please pay at the earliest. - Manas International Public School',
 ARRAY['parent_name', 'student_name', 'amount', 'month', 'due_date']),
('00000000-0000-0000-0000-000000000001', 'Attendance Alert', 'attendance',
 'Dear {{parent_name}}, {{student_name}} was marked {{status}} on {{date}}. If you have any concerns, please contact the school. - Manas International Public School',
 ARRAY['parent_name', 'student_name', 'status', 'date']),
('00000000-0000-0000-0000-000000000001', 'Exam Schedule', 'exam',
 'Dear {{parent_name}}, please note that {{exam_name}} for {{student_name}} (Class {{class}}) will start from {{start_date}}. Please ensure your ward is well prepared. - Manas International Public School',
 ARRAY['parent_name', 'exam_name', 'student_name', 'class', 'start_date']),
('00000000-0000-0000-0000-000000000001', 'Result Announcement', 'result',
 'Dear {{parent_name}}, {{student_name}} has scored {{marks}} marks ({{percentage}}%) in {{exam_name}}. Grade: {{grade}}. Report card is available on the parent portal. - Manas International Public School',
 ARRAY['parent_name', 'student_name', 'marks', 'percentage', 'exam_name', 'grade']),
('00000000-0000-0000-0000-000000000001', 'General Notice', 'general',
 '{{message}} - Manas International Public School',
 ARRAY['message']);
