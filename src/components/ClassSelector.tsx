import React from 'react';
import { BookOpen, ExternalLink, Users, Building2, Clock, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ClassSelectorProps {
  teacherName: string;
  schoolName: string;
  schoolId: string;
  onLogout: () => void;
}

export function ClassSelector({
  teacherName,
  schoolName,
  schoolId,
  onLogout,
}: ClassSelectorProps) {
  const { authData, authWarning } = useAuth();

  const handleOpenSheet = (sheetUrl: string) => {
    window.open(sheetUrl, '_blank', 'noopener,noreferrer');
  };

  const getPermissionIcon = (level: string) => {
    switch (level) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'write':
        return <Shield className="h-4 w-4 text-green-500" />;
      default:
        return <Shield className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPermissionText = (level: string) => {
    switch (level) {
      case 'admin':
        return 'Full Access';
      case 'write':
        return 'Edit Access';
      default:
        return 'View Only';
    }
  };

  if (!authData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-4xl">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mr-4"></div>
          <p className="text-gray-600">Loading authentication data...</p>
        </div>
      </div>
    );
  }

  const { sheetLinks, school } = authData;
  const displaySchoolName = school?.name || schoolName || 'School Name Unavailable';

  return (
    <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-6xl">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {teacherName}</h2>
          <div className="flex items-center text-gray-600 mb-4">
            <Building2 className="h-5 w-5 mr-2" />
            <span className="text-lg">{displaySchoolName}</span>
          </div>
          
          {authWarning && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-800 mb-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium mb-1">System Notice:</p>
                  <p>{authWarning}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-blue-700">
            <p className="text-sm">
              You have access to <strong>{sheetLinks.length}</strong> class section{sheetLinks.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="text-sm text-gray-600 hover:text-gray-800 underline transition duration-200"
        >
          Logout
        </button>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <Users className="h-6 w-6 mr-2" />
          Your Class Sections
        </h3>
        
        {sheetLinks.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 text-yellow-700">
            <div className="flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="font-medium text-center mb-2">No Class Sections Available</p>
                <p className="text-sm text-center">
                  No class sections found for your school. Please contact your administrator to set up your class sections.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sheetLinks.map((sheet) => (
              <div
                key={sheet.classId}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">{sheet.className}</h4>
                      {sheet.gradeLevel && (
                        <span className="text-xs text-gray-500">Grade {sheet.gradeLevel}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    {getPermissionIcon(sheet.permissionLevel)}
                    <span className="ml-1">{getPermissionText(sheet.permissionLevel)}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">{sheet.sheetName}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Updated: {new Date(sheet.lastModified).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleOpenSheet(sheet.accessUrl)}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 font-medium"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Attendance Sheet
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Quick Access Guide</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <p className="font-medium mb-1">📊 Sheet Access</p>
            <p>Click "Open Attendance Sheet" to access Google Sheets directly</p>
          </div>
          <div>
            <p className="font-medium mb-1">🔒 Permissions</p>
            <p>Your access level is shown on each class card</p>
          </div>
          <div>
            <p className="font-medium mb-1">📅 Updates</p>
            <p>Last modified dates help track recent changes</p>
          </div>
          <div>
            <p className="font-medium mb-1">🎯 Organization</p>
            <p>Classes are sorted by grade level for easy navigation</p>
          </div>
        </div>
      </div>
    </div>
  );
}