-- Events Module Schema
-- Migration: 008_events_schema.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Event Types Table (Custom event types per school)
-- =============================================
CREATE TABLE IF NOT EXISTS event_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, name)
);

-- Index for event_types
CREATE INDEX IF NOT EXISTS idx_event_types_school_id ON event_types(school_id);

-- =============================================
-- Events Table
-- =============================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  event_type_id UUID REFERENCES event_types(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  location VARCHAR(255),
  is_all_day BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for events
CREATE INDEX IF NOT EXISTS idx_events_school_id ON events(school_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_event_type_id ON events(event_type_id);
CREATE INDEX IF NOT EXISTS idx_events_school_date ON events(school_id, start_date);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS events_updated_at ON events;
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

-- =============================================
-- Function to seed default event types for a school
-- =============================================
CREATE OR REPLACE FUNCTION seed_default_event_types(p_school_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO event_types (school_id, name, color) VALUES
    (p_school_id, 'Meeting', '#3b82f6'),      -- Blue
    (p_school_id, 'Event', '#22c55e'),        -- Green
    (p_school_id, 'Exam', '#ef4444'),         -- Red
    (p_school_id, 'Holiday', '#f59e0b'),      -- Amber
    (p_school_id, 'Sports', '#8b5cf6'),       -- Purple
    (p_school_id, 'Cultural', '#ec4899')      -- Pink
  ON CONFLICT (school_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Seed default event types for existing schools
-- =============================================
DO $$
DECLARE
  school_record RECORD;
BEGIN
  FOR school_record IN SELECT id FROM schools LOOP
    PERFORM seed_default_event_types(school_record.id);
  END LOOP;
END $$;

-- =============================================
-- Trigger to auto-create default event types for new schools
-- =============================================
CREATE OR REPLACE FUNCTION trigger_seed_event_types()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM seed_default_event_types(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS school_event_types_seed ON schools;
CREATE TRIGGER school_event_types_seed
  AFTER INSERT ON schools
  FOR EACH ROW
  EXECUTE FUNCTION trigger_seed_event_types();

-- =============================================
-- Row Level Security (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policies for event_types
DROP POLICY IF EXISTS "event_types_select_policy" ON event_types;
CREATE POLICY "event_types_select_policy" ON event_types
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "event_types_insert_policy" ON event_types;
CREATE POLICY "event_types_insert_policy" ON event_types
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "event_types_update_policy" ON event_types;
CREATE POLICY "event_types_update_policy" ON event_types
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "event_types_delete_policy" ON event_types;
CREATE POLICY "event_types_delete_policy" ON event_types
  FOR DELETE USING (true);

-- Policies for events
DROP POLICY IF EXISTS "events_select_policy" ON events;
CREATE POLICY "events_select_policy" ON events
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "events_insert_policy" ON events;
CREATE POLICY "events_insert_policy" ON events
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "events_update_policy" ON events;
CREATE POLICY "events_update_policy" ON events
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "events_delete_policy" ON events;
CREATE POLICY "events_delete_policy" ON events
  FOR DELETE USING (true);
