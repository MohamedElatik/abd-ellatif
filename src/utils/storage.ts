/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, AttendanceRecord, Quiz, Lecture, User, ExamAttempt } from '../types';
import { mockStudents, mockAttendanceRecords, mockQuizzes, mockLectures } from '../data/mockData';

const STORAGE_KEYS = {
  CURRENT_USER: 'biomaster_current_user',
  STUDENTS: 'biomaster_students',
  ATTENDANCE: 'biomaster_attendance',
  QUIZZES: 'biomaster_quizzes',
  LECTURES: 'biomaster_lectures',
  THEME: 'biomaster_theme',
};

// Default current user (logged-in demo student: Ahmed Radwan)
export const defaultStudentUser: User = {
  id: 'std_1',
  name: 'أحمد محمود رضوان',
  phone: '01012345678',
  parentPhone: '01098765432',
  email: 'ahmed.radwan@gmail.com',
  role: 'student',
  grade: 'sec3',
  governorate: 'القاهرة - مدينة نصر',
  createdAt: '2026-09-01',
};

export const defaultTeacherUser: User = {
  id: 'teacher_1',
  name: 'د. محمد الأحمدي (المدرس)',
  phone: '01012345678',
  email: 'dr.alahmady.biology@gmail.com',
  role: 'teacher',
  createdAt: '2026-01-01',
};

export function getStoredCurrentUser(): User {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return defaultStudentUser;
}

export function saveStoredCurrentUser(user: User): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    window.dispatchEvent(new Event('biomaster_user_changed'));
  } catch (e) {
    console.error('Failed to save current user', e);
  }
}

export function getStoredStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return mockStudents;
}

export function saveStoredStudents(students: Student[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    window.dispatchEvent(new Event('biomaster_students_changed'));
  } catch (e) {
    console.error('Failed to save students', e);
  }
}

export function registerOrUpdateStudent(studentData: Omit<Student, 'id' | 'studentCode' | 'enrolledCourses' | 'completedLectures' | 'examAttempts'>): Student {
  const students = getStoredStudents();
  const existing = students.find(s => s.phone === studentData.phone);
  
  if (existing) {
    const updated: Student = {
      ...existing,
      ...studentData,
    };
    const nextList = students.map(s => s.id === existing.id ? updated : s);
    saveStoredStudents(nextList);
    saveStoredCurrentUser(updated);
    return updated;
  }

  const newId = 'std_' + Date.now();
  const newCode = `BIO-${new Date().getFullYear()}-${String(students.length + 1).padStart(3, '0')}`;
  const newStudent: Student = {
    ...studentData,
    id: newId,
    studentCode: newCode,
    role: 'student',
    enrolledCourses: ['course_sec3_full'],
    completedLectures: [],
    examAttempts: [],
    createdAt: new Date().toISOString().split('T')[0],
  };

  const nextList = [newStudent, ...students];
  saveStoredStudents(nextList);
  saveStoredCurrentUser(newStudent);
  return newStudent;
}

export function getStoredAttendance(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (raw) return JSON.parse(raw);
  } catch {}
  return mockAttendanceRecords;
}

export function saveStoredAttendance(records: AttendanceRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
    window.dispatchEvent(new Event('biomaster_attendance_changed'));
  } catch (e) {
    console.error('Failed to save attendance', e);
  }
}

export function getStoredQuizzes(): Quiz[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUIZZES);
    if (raw) return JSON.parse(raw);
  } catch {}
  return mockQuizzes;
}

export function saveStoredQuizzes(quizzes: Quiz[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
    window.dispatchEvent(new Event('biomaster_quizzes_changed'));
  } catch (e) {
    console.error('Failed to save quizzes', e);
  }
}

export function saveQuizAttempt(attempt: ExamAttempt): void {
  // Update student's attempt list
  const students = getStoredStudents();
  const updatedStudents = students.map(st => {
    if (st.id === attempt.studentId) {
      return {
        ...st,
        examAttempts: [attempt, ...(st.examAttempts || [])],
      };
    }
    return st;
  });
  saveStoredStudents(updatedStudents);

  // If current user is this student, update current user too
  const currentUser = getStoredCurrentUser();
  if (currentUser.id === attempt.studentId) {
    saveStoredCurrentUser({
      ...currentUser,
    });
  }
}

export function getStoredTheme(): 'dark' | 'light' {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.THEME);
    if (raw === 'light' || raw === 'dark') return raw;
  } catch {}
  return 'dark'; // default biology dark laboratory vibe
}

export function saveStoredTheme(theme: 'dark' | 'light'): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    window.dispatchEvent(new Event('biomaster_theme_changed'));
  } catch {}
}
