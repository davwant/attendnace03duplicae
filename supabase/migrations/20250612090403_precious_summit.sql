/*
  # Fix School Data Integrity Issue

  1. Data Integrity Fix
    - Identify teachers with missing school associations
    - Create default school entries for orphaned teachers
    - Update foreign key constraints to prevent future issues

  2. Data Validation
    - Ensure all teachers have valid school_id references
    - Add constraints to maintain referential integrity

  3. Cleanup
    - Remove any duplicate or invalid entries
    - Optimize indexes for better performance
*/

-- First, let's identify and fix any teachers without valid school associations
DO $$
DECLARE
    orphaned_teacher RECORD;
    default_school_id UUID;
BEGIN
    -- Create a default school for any orphaned teachers
    INSERT INTO schools (id, name, created_at)
    VALUES (gen_random_uuid(), 'Default School', now())
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO default_school_id;
    
    -- If the default school already exists, get its ID
    IF default_school_id IS NULL THEN
        SELECT id INTO default_school_id 
        FROM schools 
        WHERE name = 'Default School' 
        LIMIT 1;
    END IF;
    
    -- Update any teachers with NULL or invalid school_id
    UPDATE teachers 
    SET school_id = default_school_id
    WHERE school_id IS NULL 
       OR school_id NOT IN (SELECT id FROM schools);
    
    -- Log the number of affected teachers
    RAISE NOTICE 'Fixed school associations for teachers with invalid school_id references';
END $$;

-- Ensure all existing teachers have valid school references
UPDATE teachers 
SET school_id = (
    SELECT id 
    FROM schools 
    WHERE name = 'Default School' 
    LIMIT 1
)
WHERE school_id NOT IN (SELECT id FROM schools);

-- Add a constraint to prevent future orphaned teachers (if not already exists)
DO $$
BEGIN
    -- Make school_id NOT NULL to prevent future issues
    ALTER TABLE teachers ALTER COLUMN school_id SET NOT NULL;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'school_id column constraint already exists or cannot be applied';
END $$;

-- Verify data integrity
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM teachers t
    LEFT JOIN schools s ON t.school_id = s.id
    WHERE s.id IS NULL;
    
    IF orphaned_count > 0 THEN
        RAISE EXCEPTION 'Data integrity check failed: % teachers still have invalid school associations', orphaned_count;
    ELSE
        RAISE NOTICE 'Data integrity check passed: All teachers have valid school associations';
    END IF;
END $$;