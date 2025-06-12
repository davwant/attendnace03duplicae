export interface Teacher {
  id: string;
  name: string;
  loginId: string;
  password: string;
  schoolId: string;
  schoolName?: string;
}

export interface School {
  id: string;
  name: string;
  created_at: string;
}

export interface ClassSection {
  id: string;
  schoolId: string;
  className: string;
  sheetLink: string;
  created_at: string;
}

export interface Student {
  id: string;
  name: string;
  class: string;
}

export interface AttendanceRecord {
  studentName: string;
  class: string;
  date: string;
  status: 'P' | 'A';
  teacherId: string;
}

export interface AuthContextType {
  currentTeacher: Teacher | null;
  authData?: {
    teacher: {
      id: string;
      name: string;
      loginId: string;
      schoolId: string;
    };
    school: {
      id: string;
      name: string;
    };
    sheetLinks: Array<{
      classId: string;
      className: string;
      sheetName: string;
      accessUrl: string;
      lastModified: string;
      permissionLevel: 'read' | 'write' | 'admin';
      isActive: boolean;
      gradeLevel?: number;
    }>;
  } | null;
  isAuthenticated: boolean;
  login: (loginId: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export interface ClassData {
  id: string;
  name: string;
  sheetId: string;
}