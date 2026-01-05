-- WhatsApp Group Members
CREATE TABLE whatsapp_group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES whatsapp_groups(id) ON DELETE CASCADE,
    member_type VARCHAR(20) NOT NULL CHECK (member_type IN ('student', 'parent', 'teacher', 'staff', 'custom')),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20),
    name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    added_by UUID REFERENCES users(id),
    UNIQUE(group_id, phone_number)
);

-- Index for faster lookups
CREATE INDEX idx_whatsapp_group_members_group ON whatsapp_group_members(group_id);
CREATE INDEX idx_whatsapp_group_members_student ON whatsapp_group_members(student_id);
CREATE INDEX idx_whatsapp_group_members_phone ON whatsapp_group_members(phone_number);

-- Function to update member count on whatsapp_groups
CREATE OR REPLACE FUNCTION update_whatsapp_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE whatsapp_groups
        SET member_count = (SELECT COUNT(*) FROM whatsapp_group_members WHERE group_id = NEW.group_id AND is_active = true)
        WHERE id = NEW.group_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE whatsapp_groups
        SET member_count = (SELECT COUNT(*) FROM whatsapp_group_members WHERE group_id = OLD.group_id AND is_active = true)
        WHERE id = OLD.group_id;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE whatsapp_groups
        SET member_count = (SELECT COUNT(*) FROM whatsapp_group_members WHERE group_id = NEW.group_id AND is_active = true)
        WHERE id = NEW.group_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update member count
CREATE TRIGGER update_group_member_count
AFTER INSERT OR UPDATE OR DELETE ON whatsapp_group_members
FOR EACH ROW EXECUTE FUNCTION update_whatsapp_group_member_count();

-- Add member_count column to whatsapp_groups if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_groups' AND column_name = 'member_count') THEN
        ALTER TABLE whatsapp_groups ADD COLUMN member_count INTEGER DEFAULT 0;
    END IF;
END $$;
