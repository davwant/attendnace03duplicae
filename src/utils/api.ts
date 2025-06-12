import axios from 'axios';
import { Teacher, Student, AttendanceRecord } from '../types';

// Google Sheets API key (for read-only operations)
const API_KEY = 'AIzaSyB7BBWmA75MsNETNl8WE0VR-zwqyOu68sg';

// Google Apps Script Web App URL for write operations
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzPuQLE8PQJSP00UT4-eb5Ijb0Nav5cveuWLWhfgTdsZd2XjxUUZoeI-eAfoLdQpeeNBg/exec';

// Sheet IDs - extracted from URLs
const TEACHER_SHEET_ID = "1nR3Q1XRApy79iTxQFg8K_46XUtXXkjgF_gYylpJCQ0k";
const CLASS_1_SHEET_ID = "1O4jcvI2zRRm7C3v7OjURMVX2wsrczpyzTo50wwc-Ras";
const CLASS_2_SHEET_ID = "1g0q03gHKoYjyN_DjtLV-3KfvKQ4crlY-fqvvwABjNd4";
const CLASS_3_SHEET_ID = "16Z6Hp5cDscGsJKGIevPxBiLl9U51a5L2erocqiX9vVY";
const CLASS_4_SHEET_ID = "1wH2Vn8MOJkg2umCBfbPPrH_coKU_zXB8mrkdAMZMGwc";

// Attendance Sheet IDs for each class
const ATTENDANCE_SHEET_IDS = {
  'Class 1': '1yeDy-_lDiGSXRVXoSU27ONddev-ZoAFt5zIjvloHKJE',
  'Class 2': '1yeDy-_lDiGSXRVXoSU27ONddev-ZoAFt5zIjvloHKJE',
  'Class 3': '1yeDy-_lDiGSXRVXoSU27ONddev-ZoAFt5zIjvloHKJE',
  'Class 4': '1yeDy-_lDiGSXRVXoSU27ONddev-ZoAFt5zIjvloHKJE'
};

export const classSheets = [
  { id: '1', name: 'Class 1', sheetId: CLASS_1_SHEET_ID },
  { id: '2', name: 'Class 2', sheetId: CLASS_2_SHEET_ID },
  { id: '3', name: 'Class 3', sheetId: CLASS_3_SHEET_ID },
  { id: '4', name: 'Class 4', sheetId: CLASS_4_SHEET_ID },
];

// Function to fetch data from a Google Sheet (read-only operations)
async function fetchSheetData(sheetId: string, range: string) {
  try {
    const response = await axios.get(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${API_KEY}`
    );
    return response.data.values || [];
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
}

// Function to get teachers data for authentication
export async function getTeachers(): Promise<Teacher[]> {
  const data = await fetchSheetData(TEACHER_SHEET_ID, 'Sheet1!A2:D');
  return data.map((row: string[]) => ({
    id: row[0],
    name: row[1],
    loginId: row[2],
    password: row[3],
  }));
}

// Function to authenticate a teacher
export async function authenticateTeacher(loginId: string, password: string): Promise<Teacher | null> {
  const teachers = await getTeachers();
  const teacher = teachers.find(
    (t) => t.loginId === loginId && t.password === password
  );
  return teacher || null;
}

// Function to get students for a specific class
export async function getStudents(classId: string): Promise<Student[]> {
  const classData = classSheets.find((cls) => cls.id === classId);
  
  if (!classData) {
    throw new Error('Class not found');
  }
  
  const data = await fetchSheetData(classData.sheetId, 'Sheet1!A2:B');
  return data.map((row: string[], index: number) => ({
    id: index.toString(),
    name: row[0],
    class: classData.name,
  }));
}

// Function to submit attendance records using Google Apps Script
export async function submitAttendance(records: AttendanceRecord[]): Promise<void> {
  try {
    if (records.length === 0) {
      throw new Error('No attendance records provided');
    }

    const className = records[0].class;
    const attendanceSheetId = ATTENDANCE_SHEET_IDS[className as keyof typeof ATTENDANCE_SHEET_IDS];

    if (!attendanceSheetId) {
      throw new Error(`No attendance sheet found for ${className}`);
    }

    // Convert the records to a format that Google Apps Script expects
    const formData = new URLSearchParams();
    formData.append('action', 'submitAttendance');
    formData.append('sheetId', attendanceSheetId);
    formData.append('records', JSON.stringify(records.map(record => ({
      studentName: record.studentName,
      class: record.class,
      date: record.date,
      status: record.status,
      teacherId: record.teacherId,
    }))));

    const response = await axios.post(APPS_SCRIPT_URL, formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Server reported submission failure');
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(`Server error: ${error.response.data?.error || error.response.statusText}`);
      } else if (error.request) {
        throw new Error('Network error: Unable to reach the server. Please check your connection.');
      } else {
        throw new Error(`Request error: ${error.message}`);
      }
    }
    throw error; // Re-throw any other errors
  }
}