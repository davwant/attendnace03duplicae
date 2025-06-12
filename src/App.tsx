import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/LoginForm';
import { ClassSelector } from './components/ClassSelector';
import { AttendanceTable } from './components/AttendanceTable';
import { Student, AttendanceRecord } from './types';
import { getStudents, submitAttendance } from './utils/api';

function AttendanceApp() {
  const { currentTeacher, isAuthenticated, logout } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = () => {
    toast.success('Login successful!');
  };

  const handleClassSelect = async (classId: string) => {
    setLoading(true);
    setError(null);
    try {
      const fetchedStudents = await getStudents(classId);
      setStudents(fetchedStudents);
      setSelectedClass(classId);
    } catch (err) {
      console.error(err);
      setError('Failed to load students. Please try again.');
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceSubmit = async (records: AttendanceRecord[]) => {
    try {
      await submitAttendance(records);
      toast.success('Attendance submitted successfully!');
      // Return to class selection after successful submission
      setSelectedClass(null);
      setStudents([]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit attendance');
      throw err;
    }
  };

  const handleBackToClassSelection = () => {
    setSelectedClass(null);
    setStudents([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Multi-School Attendance System</h1>
          <p className="text-gray-600 text-lg">Manage attendance across multiple schools with ease</p>
        </header>

        <div className="flex justify-center">
          {!isAuthenticated ? (
            <LoginForm onLoginSuccess={handleLogin} />
          ) : loading ? (
            <div className="flex items-center justify-center p-8 bg-white rounded-lg shadow-md w-full max-w-md">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading students...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                <p>{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
            </div>
          ) : selectedClass && students.length > 0 ? (
            <AttendanceTable
              students={students}
              classId={selectedClass}
              className={selectedClass}
              teacherId={currentTeacher?.id || ''}
              onSubmit={handleAttendanceSubmit}
              onBack={handleBackToClassSelection}
            />
          ) : (
            <ClassSelector
              teacherName={currentTeacher?.name || ''}
              schoolName={currentTeacher?.schoolName || ''}
              schoolId={currentTeacher?.schoolId || ''}
              onLogout={logout}
            />
          )}
        </div>
      </div>
      <ToastContainer position="bottom-right" />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AttendanceApp />
    </AuthProvider>
  );
}

export default App;