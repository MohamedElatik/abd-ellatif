/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, AttendanceRecord, Quiz, Question } from '../types';

/**
 * Calculates student quiz/exam percentage and evaluation
 */
export function calculateExamScore(
  answers: Record<string, string>,
  questions: Question[]
): {
  score: number;
  totalPoints: number;
  percentage: number;
  isPassed: boolean;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
} {
  let score = 0;
  let totalPoints = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  for (const q of questions) {
    const points = q.points || 1;
    totalPoints += points;
    const studentAnswer = answers[q.id];

    if (!studentAnswer || studentAnswer.trim() === '') {
      unansweredCount++;
    } else if (q.type === 'mcq') {
      if (studentAnswer === q.correctAnswer) {
        score += points;
        correctCount++;
      } else {
        incorrectCount++;
      }
    } else {
      // Essay question: check if answered with reasonable length
      if (studentAnswer.trim().length >= 10) {
        score += points;
        correctCount++;
      } else {
        incorrectCount++;
      }
    }
  }

  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
  const isPassed = percentage >= 60;

  return {
    score,
    totalPoints,
    percentage,
    isPassed,
    correctCount,
    incorrectCount,
    unansweredCount,
  };
}

/**
 * Computes attendance summary for a student across all sessions
 */
export function computeStudentAttendanceStats(
  studentId: string,
  records: AttendanceRecord[]
): {
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
} {
  const studentRecords = records.filter(r => r.studentId === studentId);
  const totalSessions = studentRecords.length;

  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;

  for (const rec of studentRecords) {
    if (rec.status === 'present') presentCount++;
    else if (rec.status === 'absent') absentCount++;
    else if (rec.status === 'late') lateCount++;
    else if (rec.status === 'excused') excusedCount++;
  }

  // Late counts as 0.5 present, excused doesn't penalize attendance
  const effectivePresent = presentCount + (lateCount * 0.5);
  const nonExcusedSessions = totalSessions - excusedCount;
  const attendanceRate = nonExcusedSessions > 0
    ? Math.round((effectivePresent / nonExcusedSessions) * 100)
    : 100;

  return {
    totalSessions,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    attendanceRate,
  };
}

/**
 * Filter items by grade and search query
 */
export function filterContentByGrade<T extends { grade: string; title?: string; name?: string }>(
  items: T[],
  gradeFilter: string,
  searchQuery: string = ''
): T[] {
  return items.filter(item => {
    const matchesGrade = gradeFilter === 'all' || item.grade === gradeFilter;
    const textToSearch = ((item.title || '') + ' ' + (item.name || '')).toLowerCase();
    const matchesSearch = !searchQuery || textToSearch.includes(searchQuery.trim().toLowerCase());
    return matchesGrade && matchesSearch;
  });
}
