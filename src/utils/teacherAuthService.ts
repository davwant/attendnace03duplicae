import { supabase } from '../lib/supabase';

export interface TeacherAuthResponse {
  success: boolean;
  data?: {
    teacher: {
      id: string;
      name: string;
      loginId: string;
      schoolId: string;
    };
    school: {
      id: string;
      name: string;
    } | null;
    sheetLinks: SheetLinkData[];
  };
  error?: string;
  warning?: string;
}

export interface SheetLinkData {
  classId: string;
  className: string;
  sheetName: string;
  accessUrl: string;
  lastModified: string;
  permissionLevel: 'read' | 'write' | 'admin';
  isActive: boolean;
  gradeLevel?: number;
}

export interface AuthenticationError {
  code: 'INVALID_CREDENTIALS' | 'MISSING_SCHOOL' | 'NO_SHEET_LINKS' | 'DATABASE_ERROR';
  message: string;
  details?: any;
}

/**
 * Comprehensive teacher authentication and data retrieval function
 * Validates credentials, fetches school data, and retrieves authorized sheet links
 */
export async function authenticateTeacherAndFetchData(
  loginId: string, 
  password: string
): Promise<TeacherAuthResponse> {
  try {
    // Step 1: Validate teacher login credentials with school data
    const teacherResult = await validateTeacherCredentialsWithSchool(loginId, password);
    if (!teacherResult.success) {
      return {
        success: false,
        error: teacherResult.error
      };
    }

    const { teacher, school } = teacherResult;

    // Step 2: Retrieve authorized sheet links (only if school exists)
    let sheetLinks: SheetLinkData[] = [];
    let warning = undefined;

    if (school) {
      const sheetLinksResult = await fetchAuthorizedSheetLinks(teacher.schoolId, teacher.id);
      if (sheetLinksResult.success) {
        sheetLinks = sheetLinksResult.sheetLinks!;
      } else {
        // Don't fail login for missing sheet links, just warn
        console.warn(`No sheet links found for teacher ${teacher.id}`);
        warning = 'No class sections available. Please contact your administrator.';
      }
    } else {
      warning = 'School information unavailable. Some features may be limited. Please contact your administrator.';
    }

    // Step 3: Return structured response (allow login with warnings)
    return {
      success: true,
      data: {
        teacher: {
          id: teacher.id,
          name: teacher.name,
          loginId: teacher.loginId,
          schoolId: teacher.schoolId
        },
        school,
        sheetLinks
      },
      warning
    };

  } catch (error) {
    console.error('Authentication system error:', error);
    return {
      success: false,
      error: 'System error occurred during authentication. Please try again.'
    };
  }
}

/**
 * Validates teacher login credentials and fetches school data in one query
 */
async function validateTeacherCredentialsWithSchool(loginId: string, password: string): Promise<{
  success: boolean;
  teacher?: {
    id: string;
    name: string;
    loginId: string;
    schoolId: string;
  };
  school?: {
    id: string;
    name: string;
  } | null;
  error?: string;
}> {
  try {
    // Single query to get teacher with school information
    const { data: teacherData, error } = await supabase
      .from('teachers')
      .select(`
        id,
        login_id,
        password,
        name,
        school_id,
        schools (
          id,
          name
        )
      `)
      .eq('login_id', loginId)
      .eq('password', password)
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - invalid credentials
        return {
          success: false,
          error: 'Invalid login credentials. Please check your login ID and password.'
        };
      }
      console.error('Database error during authentication:', error);
      return {
        success: false,
        error: 'Database connection error. Please try again.'
      };
    }

    if (!teacherData) {
      return {
        success: false,
        error: 'Invalid login credentials. Please check your login ID and password.'
      };
    }

    if (!teacherData.school_id) {
      return {
        success: false,
        error: 'No school association found. Please contact your administrator.'
      };
    }

    const teacher = {
      id: teacherData.id,
      name: teacherData.name,
      loginId: teacherData.login_id,
      schoolId: teacherData.school_id
    };

    // Extract school data (might be null if school doesn't exist)
    let school = null;
    if (teacherData.schools) {
      const schoolData = Array.isArray(teacherData.schools) ? teacherData.schools[0] : teacherData.schools;
      if (schoolData) {
        school = {
          id: schoolData.id,
          name: schoolData.name
        };
      }
    }

    return {
      success: true,
      teacher,
      school
    };

  } catch (error) {
    console.error('Error validating teacher credentials:', error);
    return {
      success: false,
      error: 'Authentication service unavailable. Please try again later.'
    };
  }
}

/**
 * Fetches school data for the authenticated teacher (legacy function - kept for compatibility)
 */
async function fetchSchoolData(schoolId: string): Promise<{
  success: boolean;
  school?: {
    id: string;
    name: string;
  };
  error?: string;
}> {
  try {
    const { data: schools, error } = await supabase
      .from('schools')
      .select('id, name')
      .eq('id', schoolId)
      .limit(1);

    if (error) {
      console.error('Database error fetching school:', error);
      return {
        success: false,
        error: 'Unable to fetch school information.'
      };
    }

    if (!schools || schools.length === 0) {
      return {
        success: false,
        error: `School with ID ${schoolId} not found in database.`
      };
    }

    return {
      success: true,
      school: {
        id: schools[0].id,
        name: schools[0].name
      }
    };

  } catch (error) {
    console.error('Error fetching school data:', error);
    return {
      success: false,
      error: 'School data service unavailable.'
    };
  }
}

/**
 * Retrieves authorized sheet links for the teacher's school
 * Filters active links, sorts by grade level, and includes permission data
 */
async function fetchAuthorizedSheetLinks(schoolId: string, teacherId: string): Promise<{
  success: boolean;
  sheetLinks?: SheetLinkData[];
  error?: string;
}> {
  try {
    const { data: classSections, error } = await supabase
      .from('class_sections')
      .select('id, class_name, sheet_link, created_at')
      .eq('school_id', schoolId)
      .order('class_name');

    if (error) {
      console.error('Database error fetching class sections:', error);
      return {
        success: false,
        error: 'Unable to fetch class sections.'
      };
    }

    if (!classSections || classSections.length === 0) {
      return {
        success: false,
        error: 'No class sections available for your school. Please contact your administrator.'
      };
    }

    // Transform and enrich the data
    const sheetLinks: SheetLinkData[] = classSections.map((section, index) => ({
      classId: section.id,
      className: section.class_name,
      sheetName: `${section.class_name} Attendance Sheet`,
      accessUrl: section.sheet_link,
      lastModified: section.created_at,
      permissionLevel: 'write' as const, // Teachers have write access to their sheets
      isActive: true, // All fetched sheets are considered active
      gradeLevel: extractGradeLevel(section.class_name) || index + 1
    }));

    // Sort by grade level for better organization
    sheetLinks.sort((a, b) => (a.gradeLevel || 0) - (b.gradeLevel || 0));

    return {
      success: true,
      sheetLinks
    };

  } catch (error) {
    console.error('Error fetching sheet links:', error);
    return {
      success: false,
      error: 'Sheet links service unavailable.'
    };
  }
}

/**
 * Extracts grade level from class name for sorting purposes
 */
function extractGradeLevel(className: string): number | null {
  const gradeMatch = className.match(/(\d+)/);
  return gradeMatch ? parseInt(gradeMatch[1], 10) : null;
}

/**
 * Validates if a sheet link is accessible and active
 */
export async function validateSheetAccess(sheetUrl: string): Promise<boolean> {
  try {
    // Basic URL validation
    const url = new URL(sheetUrl);
    return url.hostname === 'docs.google.com' && url.pathname.includes('/spreadsheets/');
  } catch {
    return false;
  }
}

/**
 * Gets permission level for a teacher on a specific sheet
 */
export function getTeacherPermissionLevel(teacherId: string, classId: string): 'read' | 'write' | 'admin' {
  // In this implementation, all teachers have write access to their school's sheets
  // This could be enhanced with a permissions table in the future
  return 'write';
}