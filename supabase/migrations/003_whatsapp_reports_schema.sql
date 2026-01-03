-- =====================================================
-- WHATSAPP INTEGRATION TABLES
-- =====================================================

-- WhatsApp Configurations
CREATE TABLE whatsapp_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    session_data TEXT,
    is_connected BOOLEAN DEFAULT false,
    last_connected_at TIMESTAMPTZ,
    qr_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id)
);

-- WhatsApp Groups
CREATE TABLE whatsapp_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    group_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    group_type VARCHAR(50) NOT NULL CHECK (group_type IN ('class', 'parents', 'teachers', 'custom')),
    class_id UUID REFERENCES classes(id),
    section_id UUID REFERENCES sections(id),
    description TEXT,
    invite_link TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp Message Templates
CREATE TABLE whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('fee_reminder', 'attendance', 'exam', 'result', 'general', 'announcement')),
    content TEXT NOT NULL,
    variables TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, name)
);

-- WhatsApp Message Log
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    template_id UUID REFERENCES whatsapp_templates(id),
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('individual', 'group', 'broadcast')),
    recipient_phone VARCHAR(20),
    group_id UUID REFERENCES whatsapp_groups(id),
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    sent_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp Broadcast Lists
CREATE TABLE whatsapp_broadcasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    recipient_type VARCHAR(50) CHECK (recipient_type IN ('all_parents', 'class_parents', 'all_staff', 'custom')),
    class_id UUID REFERENCES classes(id),
    section_id UUID REFERENCES sections(id),
    recipient_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ACADEMIC REPORTS TABLES
-- =====================================================

-- Report Card Templates
CREATE TABLE report_card_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    template_html TEXT NOT NULL,
    applicable_classes UUID[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student Report Cards
CREATE TABLE student_report_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id),
    exam_id UUID REFERENCES exams(id),
    template_id UUID REFERENCES report_card_templates(id),
    total_marks DECIMAL(8, 2),
    obtained_marks DECIMAL(8, 2),
    percentage DECIMAL(5, 2),
    grade VARCHAR(5),
    rank INTEGER,
    attendance_percentage DECIMAL(5, 2),
    conduct_grade VARCHAR(5),
    teacher_remarks TEXT,
    principal_remarks TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    generated_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress Report Items
CREATE TABLE progress_report_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_card_id UUID REFERENCES student_report_cards(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id),
    max_marks DECIMAL(6, 2),
    obtained_marks DECIMAL(6, 2),
    grade VARCHAR(5),
    teacher_remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COMMUNICATION TABLES
-- =====================================================

-- Announcements
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    announcement_type VARCHAR(50) NOT NULL CHECK (announcement_type IN ('general', 'academic', 'event', 'emergency')),
    target_audience TEXT[],
    target_classes UUID[],
    attachment_urls TEXT[],
    is_pinned BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('fee_due', 'attendance', 'result', 'announcement', 'leave', 'general')),
    reference_type VARCHAR(50),
    reference_id UUID,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AUDIT & LOGS
-- =====================================================

-- Activity Logs
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'login', 'logout', 'view', 'export')),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_whatsapp_messages_school ON whatsapp_messages(school_id);
CREATE INDEX idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX idx_whatsapp_messages_sent_at ON whatsapp_messages(sent_at);
CREATE INDEX idx_student_report_cards_school ON student_report_cards(school_id);
CREATE INDEX idx_student_report_cards_student ON student_report_cards(student_id);
CREATE INDEX idx_announcements_school ON announcements(school_id);
CREATE INDEX idx_announcements_published_at ON announcements(published_at);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_activity_logs_school ON activity_logs(school_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_whatsapp_configs_updated_at BEFORE UPDATE ON whatsapp_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_groups_updated_at BEFORE UPDATE ON whatsapp_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
