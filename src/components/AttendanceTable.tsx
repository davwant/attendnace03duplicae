import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Send, Check, X } from 'lucide-react';
import { Student, AttendanceRecord } from '../types';

interface AttendanceTableProps {
  students: Student[];
  classId: string;
  className: string;
  teacherId: string;
  onSubmit: (records: AttendanceRecord[]) => Promise<void>;
  onBack: () => void;
}

export function AttendanceTable({
  students,
  classId,
  className,
  teacherId,
  onSubmit,
  onBack,
}: AttendanceTableProps) {
  const [attendanceDate, setAttendanceDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [attendance, setAttendance] = useState<Record<string, 'P' | 'A' | null>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize attendance status for all students as null (not marked)
  React.useEffect(() => {
    const initialAttendance: Record<string, 'P' | 'A' | null> = {};
    students.forEach((student) => {
      initialAttendance[student.id] = null;
    });
    setAttendance(initialAttendance);
  }, [students]);

  const handleAttendanceChange = (studentId: string, status: 'P' | 'A') => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === status ? null : status,
    }));
  };

  const handleSubmit = async () => {
    const unmarkedStudents = students.filter(
      (student) => attendance[student.id] === null
    );
    
    if (unmarkedStudents.length > 0) {
      setError(`${unmarkedStudents.length} student(s) don't have attendance marked yet.`);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const records: AttendanceRecord[] = students.map((student) => ({
        studentName: student.name,
        class: className,
        date: attendanceDate,
        status: attendance[student.id] as 'P' | 'A',
        teacherId,
      }));
      
      await onSubmit(records);
      setAttendance({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Attendance for {className}
        </h2>
        <button
          onClick={onBack}
          className="text-sm text-blue-600 hover:text-blue-800 transition duration-200"
        >
          Back to Class Selection
        </button>
      </div>

      <div className="mb-6">
        <label htmlFor="attendance-date" className="block text-sm font-medium text-gray-700 mb-1">
          Attendance Date
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="date"
            id="attendance-date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4 mb-6">
        {students.map((student) => {
          const status = attendance[student.id];
          const cardColor = status === 'P' ? 'bg-green-50' : status === 'A' ? 'bg-red-50' : 'bg-white';
          const borderColor = status === 'P' ? 'border-green-200' : status === 'A' ? 'border-red-200' : 'border-gray-200';
          
          return (
            <div
              key={student.id}
              className={`${cardColor} ${borderColor} border rounded-lg p-4 transition-colors duration-200`}
            >
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">{student.name}</h3>
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => handleAttendanceChange(student.id, 'P')}
                  className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 ${
                    status === 'P'
                      ? 'bg-green-500 text-white'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Present
                </button>
                <button
                  onClick={() => handleAttendanceChange(student.id, 'A')}
                  className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 ${
                    status === 'A'
                      ? 'bg-red-500 text-white'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  <X className="w-4 h-4 mr-2" />
                  Absent
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`flex items-center justify-center px-6 py-3 text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 ${
            isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-5 w-5" />
              Submit Attendance
            </>
          )}
        </button>
      </div>
    </div>
  );
}