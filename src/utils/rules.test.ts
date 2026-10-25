import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateExamScore, computeStudentAttendanceStats, filterContentByGrade } from './rules';
import { Question, AttendanceRecord } from '../types';

test('calculateExamScore correctly calculates MCQ and essay scores', () => {
  const sampleQuestions: Question[] = [
    {
      id: 'q1',
      type: 'mcq',
      prompt: 'ما هو التركيب المسؤول عن نقل الماء في النبات؟',
      options: ['الخشب', 'اللحاء', 'الكامبيوم', 'البشرة'],
      correctAnswer: 'الخشب',
      explanation: 'الخشب ينقل الماء والأملاح.',
      points: 2,
    },
    {
      id: 'q2',
      type: 'mcq',
      prompt: 'أي القواعد النيتروجينية ترتبط مع الأدينين برابطتين هيدروجينيتين؟',
      options: ['الثايمين', 'الجوانين', 'السيتوزين', 'اليوراسيل'],
      correctAnswer: 'الثايمين',
      explanation: 'A يرتبط مع T برابطتين هيدروجينيتين في DNA.',
      points: 2,
    },
    {
      id: 'q3',
      type: 'essay',
      prompt: 'اشرح دور هرمون الألدوستيرون في الاتزان الداخلي.',
      explanation: 'يحفز إعادة امتصاص الصوديوم والتخلص من البوتاسيوم في الكليتين.',
      points: 4,
    },
  ];

  // Scenario 1: All correct
  const perfectAnswers = {
    q1: 'الخشب',
    q2: 'الثايمين',
    q3: 'يقوم بإعادة امتصاص الصوديوم والتخلص من البوتاسيوم الزائد عبر النفرونات.',
  };
  const res1 = calculateExamScore(perfectAnswers, sampleQuestions);
  assert.equal(res1.score, 8);
  assert.equal(res1.totalPoints, 8);
  assert.equal(res1.percentage, 100);
  assert.equal(res1.isPassed, true);
  assert.equal(res1.correctCount, 3);
  assert.equal(res1.incorrectCount, 0);

  // Scenario 2: One wrong, one skipped
  const mixedAnswers = {
    q1: 'الخشب',
    q2: 'الجوانين', // wrong
  };
  const res2 = calculateExamScore(mixedAnswers, sampleQuestions);
  assert.equal(res2.score, 2);
  assert.equal(res2.correctCount, 1);
  assert.equal(res2.incorrectCount, 1);
  assert.equal(res2.unansweredCount, 1);
  assert.equal(res2.isPassed, false);
});

test('computeStudentAttendanceStats aggregates attendance rates correctly', () => {
  const records: AttendanceRecord[] = [
    {
      id: 'r1',
      studentId: 'std_1',
      studentName: 'أحمد محمود',
      studentPhone: '01012345678',
      parentPhone: '01098765432',
      grade: 'sec3',
      sessionTitle: 'محاضرة 1: الدعامة في النبات',
      date: '2026-10-01',
      status: 'present',
    },
    {
      id: 'r2',
      studentId: 'std_1',
      studentName: 'أحمد محمود',
      studentPhone: '01012345678',
      parentPhone: '01098765432',
      grade: 'sec3',
      sessionTitle: 'محاضرة 2: الدعامة في الإنسان',
      date: '2026-10-08',
      status: 'present',
    },
    {
      id: 'r3',
      studentId: 'std_1',
      studentName: 'أحمد محمود',
      studentPhone: '01012345678',
      parentPhone: '01098765432',
      grade: 'sec3',
      sessionTitle: 'محاضرة 3: الحركة في الإنسان',
      date: '2026-10-15',
      status: 'late', // 0.5
    },
    {
      id: 'r4',
      studentId: 'std_1',
      studentName: 'أحمد محمود',
      studentPhone: '01012345678',
      parentPhone: '01098765432',
      grade: 'sec3',
      sessionTitle: 'محاضرة 4: الانقباض العضلي',
      date: '2026-10-22',
      status: 'absent',
    },
  ];

  const stats = computeStudentAttendanceStats('std_1', records);
  assert.equal(stats.totalSessions, 4);
  assert.equal(stats.presentCount, 2);
  assert.equal(stats.lateCount, 1);
  assert.equal(stats.absentCount, 1);
  // effective present = 2 + 0.5 = 2.5 / 4 = 62.5% => rounds to 63%
  assert.equal(stats.attendanceRate, 63);
});

test('filterContentByGrade filters correctly by grade and search text', () => {
  const items = [
    { id: '1', grade: 'sec3', title: 'تضاعف الـ DNA' },
    { id: '2', grade: 'sec3', title: 'المناعة في الإنسان' },
    { id: '3', grade: 'sec2', title: 'التنفس الخلوي' },
    { id: '4', grade: 'sec1', title: 'النظرية الخلوية' },
  ];

  const sec3Only = filterContentByGrade(items, 'sec3');
  assert.equal(sec3Only.length, 2);

  const searchDna = filterContentByGrade(items, 'all', 'DNA');
  assert.equal(searchDna.length, 1);
  assert.equal(searchDna[0].title, 'تضاعف الـ DNA');
});
