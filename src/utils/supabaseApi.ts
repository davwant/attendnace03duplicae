import { supabase } from '../lib/supabase';
import { Teacher, School, ClassSection } from '../types';

export async function authenticateTeacher(loginId: string, password: string): Promise<Teacher | null> {
  try {
    const { data: teachers, error } = await supabase
      .from('teachers')
      .select(`
        id,
        login_id,
        password,
        name,
        school_id,
        schools (
          name
        )
      `)
      .eq('login_id', loginId)
      .eq('password', password);

    if (error) {
      console.error('Authentication error:', error);
      return null;
    }

    // Check if any teachers were found
    if (!teachers || teachers.length === 0) {
      return null;
    }

    // Get the first (and should be only) teacher
    const teacher = teachers[0];

    return {
      id: teacher.id,
      name: teacher.name,
      loginId: teacher.login_id,
      password: teacher.password,
      schoolId: teacher.school_id,
      schoolName: (teacher.schools as any)?.name
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function getSchools(): Promise<School[]> {
  try {
    const { data: schools, error } = await supabase
      .from('schools')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching schools:', error);
      return [];
    }

    return schools || [];
  } catch (error) {
    console.error('Error fetching schools:', error);
    return [];
  }
}

export async function getClassSectionsBySchool(schoolId: string): Promise<ClassSection[]> {
  try {
    const { data: classSections, error } = await supabase
      .from('class_sections')
      .select('*')
      .eq('school_id', schoolId)
      .order('class_name');

    if (error) {
      console.error('Error fetching class sections:', error);
      return [];
    }

    return classSections?.map(section => ({
      id: section.id,
      schoolId: section.school_id,
      className: section.class_name,
      sheetLink: section.sheet_link,
      created_at: section.created_at
    })) || [];
  } catch (error) {
    console.error('Error fetching class sections:', error);
    return [];
  }
}

export async function getTeacherBySchool(schoolId: string): Promise<Teacher[]> {
  try {
    const { data: teachers, error } = await supabase
      .from('teachers')
      .select(`
        id,
        login_id,
        name,
        school_id,
        schools (
          name
        )
      `)
      .eq('school_id', schoolId);

    if (error) {
      console.error('Error fetching teachers:', error);
      return [];
    }

    return teachers?.map(teacher => ({
      id: teacher.id,
      name: teacher.name,
      loginId: teacher.login_id,
      password: '', // Don't return password
      schoolId: teacher.school_id,
      schoolName: (teacher.schools as any)?.name
    })) || [];
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return [];
  }
}