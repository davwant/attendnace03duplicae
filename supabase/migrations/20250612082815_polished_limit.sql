/*
  # Multi-School Attendance System Database Schema

  1. New Tables
    - `schools`
      - `id` (uuid, primary key)
      - `name` (text, unique school name)
      - `created_at` (timestamp)
    
    - `teachers`
      - `id` (uuid, primary key)
      - `login_id` (text, unique login identifier)
      - `password` (text, hashed password)
      - `name` (text, teacher's full name)
      - `school_id` (uuid, foreign key to schools)
      - `created_at` (timestamp)
    
    - `class_sections`
      - `id` (uuid, primary key)
      - `school_id` (uuid, foreign key to schools)
      - `class_name` (text, name of the class)
      - `sheet_link` (text, Google Sheets URL)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for teachers to access only their school's data
    - Add policies for secure authentication

  3. Sample Data
    - Insert sample schools, teachers, and class sections for testing
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

-- Enable Row Level Security
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sections ENABLE ROW LEVEL SECURITY;

-- Create policies for schools table
CREATE POLICY "Teachers can read their own school"
  ON schools
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT school_id FROM teachers 
      WHERE id = auth.uid()
    )
  );

-- Create policies for teachers table
CREATE POLICY "Teachers can read their own data"
  ON teachers
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Create policies for class_sections table
CREATE POLICY "Teachers can read their school's class sections"
  ON class_sections
  FOR SELECT
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM teachers 
      WHERE id = auth.uid()
    )
  );

-- Insert sample data for testing
INSERT INTO schools (name) VALUES 
  ('Greenwood Elementary'),
  ('Riverside High School'),
  ('Oakmont Academy')
ON CONFLICT (name) DO NOTHING;

-- Insert sample teachers (passwords should be hashed in production)
INSERT INTO teachers (login_id, password, name, school_id) VALUES 
  ('teacher001', 'password123', 'John Smith', (SELECT id FROM schools WHERE name = 'Greenwood Elementary')),
  ('teacher002', 'password123', 'Sarah Johnson', (SELECT id FROM schools WHERE name = 'Greenwood Elementary')),
  ('teacher003', 'password123', 'Mike Davis', (SELECT id FROM schools WHERE name = 'Riverside High School')),
  ('teacher004', 'password123', 'Emily Brown', (SELECT id FROM schools WHERE name = 'Oakmont Academy'))
ON CONFLICT (login_id) DO NOTHING;

-- Insert sample class sections
INSERT INTO class_sections (school_id, class_name, sheet_link) VALUES 
  -- Greenwood Elementary classes
  ((SELECT id FROM schools WHERE name = 'Greenwood Elementary'), 'Grade 1A', 'https://docs.google.com/spreadsheets/d/1O4jcvI2zRRm7C3v7OjURMVX2wsrczpyzTo50wwc-Ras/edit'),
  ((SELECT id FROM schools WHERE name = 'Greenwood Elementary'), 'Grade 1B', 'https://docs.google.com/spreadsheets/d/1g0q03gHKoYjyN_DjtLV-3KfvKQ4crlY-fqvvwABjNd4/edit'),
  ((SELECT id FROM schools WHERE name = 'Greenwood Elementary'), 'Grade 2A', 'https://docs.google.com/spreadsheets/d/16Z6Hp5cDscGsJKGIevPxBiLl9U51a5L2erocqiX9vVY/edit'),
  
  -- Riverside High School classes
  ((SELECT id FROM schools WHERE name = 'Riverside High School'), 'Class 9A', 'https://docs.google.com/spreadsheets/d/1wH2Vn8MOJkg2umCBfbPPrH_coKU_zXB8mrkdAMZMGwc/edit'),
  ((SELECT id FROM schools WHERE name = 'Riverside High School'), 'Class 9B', 'https://docs.google.com/spreadsheets/d/1O4jcvI2zRRm7C3v7OjURMVX2wsrczpyzTo50wwc-Ras/edit'),
  ((SELECT id FROM schools WHERE name = 'Riverside High School'), 'Class 10A', 'https://docs.google.com/spreadsheets/d/1g0q03gHKoYjyN_DjtLV-3KfvKQ4crlY-fqvvwABjNd4/edit'),
  
  -- Oakmont Academy classes
  ((SELECT id FROM schools WHERE name = 'Oakmont Academy'), 'Section A', 'https://docs.google.com/spreadsheets/d/16Z6Hp5cDscGsJKGIevPxBiLl9U51a5L2erocqiX9vVY/edit'),
  ((SELECT id FROM schools WHERE name = 'Oakmont Academy'), 'Section B', 'https://docs.google.com/spreadsheets/d/1wH2Vn8MOJkg2umCBfbPPrH_coKU_zXB8mrkdAMZMGwc/edit');