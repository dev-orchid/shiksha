-- Fix WhatsApp group members unique constraint
-- The old constraint was on (group_id, phone_number) which prevents siblings with same parent phone
-- New constraint: (group_id, student_id) for student members

-- Drop the old constraint
ALTER TABLE whatsapp_group_members DROP CONSTRAINT IF EXISTS whatsapp_group_members_group_id_phone_number_key;

-- Add new constraint on (group_id, student_id) for student members
-- This allows multiple students with the same phone number to be in the same group
ALTER TABLE whatsapp_group_members ADD CONSTRAINT whatsapp_group_members_group_student_unique
  UNIQUE (group_id, student_id);

-- For custom members (without student_id), we still want phone uniqueness
-- Create a partial unique index for custom members only
CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_group_members_custom_phone_unique
  ON whatsapp_group_members (group_id, phone_number)
  WHERE student_id IS NULL AND phone_number IS NOT NULL;
