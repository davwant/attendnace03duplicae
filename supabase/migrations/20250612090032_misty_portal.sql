/*
  # Complete Teacher Attendance System Schema

  1. New Tables
    - `schools` - Store school information with unique names
    - `teachers` - Teacher credentials linked to schools
    - `class_sections` - Class information with Google Sheets links

  2. Security
    - Enable RLS on all tables
    - Add policies for proper data access control
    - Anonymous access for login, authenticated access for data

  3. Sample Data
    - 3 schools with realistic names
    - 6 teachers with login credentials
    - 12 class sections with Google Sheets links

  4. Performance
    - Indexes on frequently queried columns
    - Foreign key constraints for data integrity
*/

-- Create schools table
CREATE TABLE IF NOT EXISTS schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  login_id text UNIQUE NOT NULL,
  password text NOT NULL,
  name text NOT NULL,
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create class_sections table
CREATE TABLE IF NOT EXISTS class_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  class_name text NOT NULL,
  sheet_link text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security (safe to run multiple times)
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate them
DO $$
BEGIN
  -- Drop and recreate schools policies
  DROP POLICY IF EXISTS "Teachers can read their own school" ON schools;
  CREATE POLICY "Teachers can read their own school"
    ON schools
    FOR SELECT
    TO authenticated
    USING (id IN (
      SELECT school_id FROM teachers WHERE id = auth.uid()
    ));

  -- Drop and recreate teachers policies
  DROP POLICY IF EXISTS "Allow anon select for custom login" ON teachers;
  CREATE POLICY "Allow anon select for custom login"
    ON teachers
    FOR SELECT
    TO anon
    USING (true);

  DROP POLICY IF EXISTS "Teachers can read their own data" ON teachers;
  CREATE POLICY "Teachers can read their own data"
    ON teachers
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

  -- Drop and recreate class_sections policies
  DROP POLICY IF EXISTS "Teachers can read their school's class sections" ON class_sections;
  CREATE POLICY "Teachers can read their school's class sections"
    ON class_sections
    FOR SELECT
    TO authenticated
    USING (school_id IN (
      SELECT school_id FROM teachers WHERE id = auth.uid()
    ));
END $$;

-- Insert sample schools (handle conflicts gracefully)
INSERT INTO schools (name) VALUES
  ('Greenwood Elementary School'),
  ('Riverside High School'),
  ('Oakmont Middle School')
ON CONFLICT (name) DO NOTHING;

-- Insert sample teachers (handle conflicts gracefully)
INSERT INTO teachers (login_id, password, name, school_id) VALUES
  ('teacher001', 'password123', 'Sarah Johnson', (SELECT id FROM schools WHERE name = 'Greenwood Elementary School')),
  ('teacher002', 'password123', 'Michael Chen', (SELECT id FROM schools WHERE name = 'Greenwood Elementary School')),
  ('teacher003', 'password123', 'Emily Rodriguez', (SELECT id FROM schools WHERE name = 'Riverside High School')),
  ('teacher004', 'password123', 'David Thompson', (SELECT id FROM schools WHERE name = 'Riverside High School')),
  ('teacher005', 'password123', 'Lisa Anderson', (SELECT id FROM schools WHERE name = 'Oakmont Middle School')),
  ('teacher006', 'password123', 'James Wilson', (SELECT id FROM schools WHERE name = 'Oakmont Middle School'))
ON CONFLICT (login_id) DO NOTHING;

-- Insert sample class sections with Google Sheets links
-- Use DO block to handle potential conflicts
DO $$
DECLARE
  greenwood_id uuid;
  riverside_id uuid;
  oakmont_id uuid;
BEGIN
  -- Get school IDs
  SELECT id INTO greenwood_id FROM schools WHERE name = 'Greenwood Elementary School';
  SELECT id INTO riverside_id FROM schools WHERE name = 'Riverside High School';
  SELECT id INTO oakmont_id FROM schools WHERE name = 'Oakmont Middle School';

  -- Insert class sections only if they don't exist
  INSERT INTO class_sections (school_id, class_name, sheet_link)
  SELECT * FROM (VALUES
    -- Greenwood Elementary School classes
    (greenwood_id, 'Grade 1A', 'https://docs.google.com/spreadsheets/d/1nR3Q1XRApy79iTxQFg8K_46XUtXXkjgF_gYylpJCQ0k/edit'),
    (greenwood_id, 'Grade 1B', 'https://docs.google.com/spreadsheets/d/1O4jcvI2zRRm7C3v7OjURMVX2wsrczpyzTo50wwc-Ras/edit'),
    (greenwood_id, 'Grade 2A', 'https://docs.google.com/spreadsheets/d/1g0q03gHKoYjyN_DjtLV-3KfvKQ4crlY-fqvvwABjNd4/edit'),
    (greenwood_id, 'Grade 2B', 'https://docs.google.com/spreadsheets/d/16Z6Hp5cDscGsJKGIevPxBiLl9U51a5L2erocqiX9vVY/edit'),
    
    -- Riverside High School classes
    (riverside_id, 'Grade 9 Math', 'https://docs.google.com/spreadsheets/d/1wH2Vn8MOJkg2umCBfbPPrH_coKU_zXB8mrkdAMZMGwc/edit'),
    (riverside_id, 'Grade 9 Science', 'https://docs.google.com/spreadsheets/d/1yeDy-_lDiGSXRVXoSU27ONddev-ZoAFt5zIjvloHKJE/edit'),
    (riverside_id, 'Grade 10 English', 'https://docs.google.com/spreadsheets/d/1ABC123XYZ789DEF456GHI012JKL345MNO678PQR901/edit'),
    (riverside_id, 'Grade 10 History', 'https://docs.google.com/spreadsheets/d/1DEF456GHI789JKL012MNO345PQR678STU901VWX234/edit'),
    
    -- Oakmont Middle School classes
    (oakmont_id, 'Grade 6A', 'https://docs.google.com/spreadsheets/d/1GHI789JKL012MNO345PQR678STU901VWX234YZA567/edit'),
    (oakmont_id, 'Grade 6B', 'https://docs.google.com/spreadsheets/d/1JKL012MNO345PQR678STU901VWX234YZA567BCD890/edit'),
    (oakmont_id, 'Grade 7A', 'https://docs.google.com/spreadsheets/d/1MNO345PQR678STU901VWX234YZA567BCD890EFG123/edit'),
    (oakmont_id, 'Grade 7B', 'https://docs.google.com/spreadsheets/d/1PQR678STU901VWX234YZA567BCD890EFG123HIJ456/edit')
  ) AS new_sections(school_id, class_name, sheet_link)
  WHERE NOT EXISTS (
    SELECT 1 FROM class_sections cs 
    WHERE cs.school_id = new_sections.school_id 
    AND cs.class_name = new_sections.class_name
  );
END $$;

-- Create indexes for better performance (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_teachers_login_id ON teachers(login_id);
CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_class_sections_school_id ON class_sections(school_id);
CREATE INDEX IF NOT EXISTS idx_schools_name ON schools(name);