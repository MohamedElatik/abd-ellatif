/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GradeLevel = 'sec1' | 'sec2' | 'sec3';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  parentPhone?: string;
  role: 'student' | 'teacher' | 'admin';
  grade?: GradeLevel;
  governorate?: string;
  createdAt: string;
}

export interface Student extends User {
  studentCode: string;
  enrolledCourses: string[];
  completedLectures: string[];
  examAttempts: ExamAttempt[];
}

export interface Teacher {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatar: string;
  coverImage?: string;
  specialization: string;
  experienceYears: number;
  totalStudents: number;
  rating: number;
  reviewsCount: number;
  phone: string;
  email: string;
  socials: {
    facebook?: string;
    youtube?: string;
    telegram?: string;
    whatsapp?: string;
  };
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  grade: GradeLevel;
  gradeTitle: string;
  description: string;
  thumbnail: string;
  totalLectures: number;
  totalHours: number;
  price?: number;
  isFree?: boolean;
  units: Unit[];
}

export interface Unit {
  id: string;
  title: string;
  unitNumber: number;
  lecturesCount: number;
  description?: string;
}

export interface Lecture {
  id: string;
  courseId: string;
  unitId: string;
  grade: GradeLevel;
  unitTitle: string;
  title: string;
  description: string;
  videoDuration: string; // e.g. "45:30"
  videoDurationMinutes: number;
  videoUrl: string; // embedded or direct url
  playbackProvider?: 'vdocipher';
  thumbnail: string;
  isFreePreview: boolean;
  pdfAttachment?: {
    title: string;
    size: string;
    url: string;
  };
  associatedQuizId?: string;
  order: number;
  chapters?: { time: string; title: string }[];
}

export type QuestionType = 'mcq' | 'essay';

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[]; // For MCQ (typically 4 options)
  correctAnswer?: string; // For MCQ: option string; for Essay: model key points
  explanation: string;
  diagramUrl?: string; // Bio diagram if available
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  grade: GradeLevel;
  gradeTitle: string;
  unitTitle: string;
  description: string;
  isComprehensiveExam: boolean; // True for comprehensive exam, false for lesson quiz
  timeLimitMinutes: number;
  passingScore: number;
  questions: Question[];
  associatedLectureId?: string;
  createdAt: string;
}

export interface ExamAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  grade: GradeLevel;
  score: number;
  totalPoints: number;
  percentage: number;
  isPassed: boolean;
  completedAt: string;
  answers: Record<string, string>;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  parentPhone: string;
  grade: GradeLevel;
  sessionTitle: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
}
