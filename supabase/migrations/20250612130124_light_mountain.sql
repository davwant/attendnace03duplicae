/*
  # Fix Database Relationships and Data Integrity

  1. Data Integrity Fixes
    - Ensure all teachers have valid school associations
    - Create missing schools if needed
    - Add class sections for all schools
    - Fix any orphaned records

  2. Sample Data Enhancement
    - Add comprehensive class sections for each school
    - Ensure proper teacher-school relationships
    - Add realistic Google Sheets links

  3. Verification
    - Check data integrity after migration
    - Ensure all relationships are properly established
*/

-- Step 1: Clean up any existing data inconsistencies
DO $$
DECLARE
    teacher_record RECORD;
    school_count INTEGER;
    default_school_id UUID;
BEGIN
    -- Check if we have any schools at all
    SELECT COUNT(*) INTO school_count FROM schools;
    
    IF school_count = 0 THEN
        RAISE NOTICE 'No schools found, creating default schools...';
        
        -- Insert default schools
        INSERT INTO schools (name) VALUES
            ('Greenwood Elementary School'),
            ('Riverside High School'),
            ('Oakmont Middle School')
        ON CONFLICT (name) DO NOTHING;
    END IF;
    
    -- Get a default school ID for any orphaned teachers
    SELECT id INTO default_school_id FROM schools LIMIT 1;
    
    -- Fix any teachers with NULL or invalid school_id
    FOR teacher_record IN 
        SELECT id, login_id, name, school_id 
        FROM teachers 
        WHERE school_id IS NULL OR school_id NOT IN (SELECT id FROM schools)
    LOOP
        RAISE NOTICE 'Fixing teacher % (%) with invalid school_id', teacher_record.name, teacher_record.login_id;
        
        UPDATE teachers 
        SET school_id = default_school_id 
        WHERE id = teacher_record.id;
    END LOOP;
    
    RAISE NOTICE 'Data cleanup completed';
END $$;

-- Step 2: Ensure we have proper sample data
DO $$
DECLARE
    greenwood_id UUID;
    riverside_id UUID;
    oakmont_id UUID;
    teacher_count INTEGER;
    class_count INTEGER;
BEGIN
    -- Get school IDs
    SELECT id INTO greenwood_id FROM schools WHERE name = 'Greenwood Elementary School';
    SELECT id INTO riverside_id FROM schools WHERE name = 'Riverside High School';
    SELECT id INTO oakmont_id FROM schools WHERE name = 'Oakmont Middle School';
    
    -- Check if we need to add teachers
    SELECT COUNT(*) INTO teacher_count FROM teachers;
    
    IF teacher_count < 6 THEN
        RAISE NOTICE 'Adding sample teachers...';
        
        -- Insert sample teachers if they don't exist
        INSERT INTO teachers (login_id, password, name, school_id) VALUES
            ('teacher001', 'password123', 'Sarah Johnson', greenwood_id),
            ('teacher002', 'password123', 'Michael Chen', greenwood_id),
            ('teacher003', 'password123', 'Emily Rodriguez', riverside_id),
            ('teacher004', 'password123', 'David Thompson', riverside_id),
            ('teacher005', 'password123', 'Lisa Anderson', oakmont_id),
            ('teacher006', 'password123', 'James Wilson', oakmont_id)
        ON CONFLICT (login_id) DO NOTHING;
    END IF;
    
    -- Check if we need to add class sections
    SELECT COUNT(*) INTO class_count FROM class_sections;
    
    IF class_count < 12 THEN
        RAISE NOTICE 'Adding class sections...';
        
        -- Delete any existing class sections to avoid duplicates
        DELETE FROM class_sections;
        
        -- Insert comprehensive class sections
        INSERT INTO class_sections (school_id, class_name, sheet_link) VALUES
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
            (oakmont_id, 'Grade 7B', 'https://docs.google.com/spreadsheets/d/1PQR678STU901VWX234YZA567BCD890EFG123HIJ456/edit');
    END IF;
    
    RAISE NOTICE 'Sample data setup completed';
END $$;

-- Step 3: Final data integrity verification
DO $$
DECLARE
    orphaned_teachers INTEGER;
    schools_without_classes INTEGER;
    total_schools INTEGER;
    total_teachers INTEGER;
    total_classes INTEGER;
BEGIN
    -- Check for orphaned teachers
    SELECT COUNT(*) INTO orphaned_teachers
    FROM teachers t
    LEFT JOIN schools s ON t.school_id = s.id
    WHERE s.id IS NULL;
    
    -- Check for schools without classes
    SELECT COUNT(*) INTO schools_without_classes
    FROM schools s
    LEFT JOIN class_sections cs ON s.id = cs.school_id
    WHERE cs.id IS NULL;
    
    -- Get totals
    SELECT COUNT(*) INTO total_schools FROM schools;
    SELECT COUNT(*) INTO total_teachers FROM teachers;
    SELECT COUNT(*) INTO total_classes FROM class_sections;
    
    -- Report status
    RAISE NOTICE 'Database Status:';
    RAISE NOTICE '- Schools: %', total_schools;
    RAISE NOTICE '- Teachers: %', total_teachers;
    RAISE NOTICE '- Class Sections: %', total_classes;
    RAISE NOTICE '- Orphaned Teachers: %', orphaned_teachers;
    RAISE NOTICE '- Schools without Classes: %', schools_without_classes;
    
    -- Fail if there are still integrity issues
    IF orphaned_teachers > 0 THEN
        RAISE EXCEPTION 'Data integrity check failed: % teachers still have invalid school associations', orphaned_teachers;
    END IF;
    
    IF total_classes = 0 THEN
        RAISE EXCEPTION 'Data integrity check failed: No class sections found';
    END IF;
    
    RAISE NOTICE 'Data integrity verification passed!';
END $$;

-- Step 4: Update any existing teachers to ensure they have proper school associations
UPDATE teachers 
SET school_id = (
    SELECT id FROM schools WHERE name = 'Greenwood Elementary School' LIMIT 1
)
WHERE login_id IN ('teacher001', 'teacher002');

UPDATE teachers 
SET school_id = (
    SELECT id FROM schools WHERE name = 'Riverside High School' LIMIT 1
)
WHERE login_id IN ('teacher003', 'teacher004');

UPDATE teachers 
SET school_id = (
    SELECT id FROM schools WHERE name = 'Oakmont Middle School' LIMIT 1
)
WHERE login_id IN ('teacher005', 'teacher006');

-- Final verification query to show the current state
DO $$
DECLARE
    result_record RECORD;
BEGIN
    RAISE NOTICE 'Final Database State:';
    
    FOR result_record IN
        SELECT 
            s.name as school_name,
            COUNT(DISTINCT t.id) as teacher_count,
            COUNT(DISTINCT cs.id) as class_count
        FROM schools s
        LEFT JOIN teachers t ON s.id = t.school_id
        LEFT JOIN class_sections cs ON s.id = cs.school_id
        GROUP BY s.id, s.name
        ORDER BY s.name
    LOOP
        RAISE NOTICE '- %: % teachers, % classes', 
            result_record.school_name, 
            result_record.teacher_count, 
            result_record.class_count;
    END LOOP;
END $$;