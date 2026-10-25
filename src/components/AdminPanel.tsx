/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Student, AttendanceRecord, Quiz, Question, GradeLevel, AttendanceStatus } from '../types';
import {
  getStoredStudents,
  getStoredAttendance,
  saveStoredAttendance,
  getStoredQuizzes,
  saveStoredQuizzes,
} from '../utils/storage';
import {
  Users,
  CalendarCheck,
  FileQuestion,
  TrendingUp,
  Plus,
  Trash2,
  Phone,
  MessageCircle,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  Check,
} from 'lucide-react';

interface AdminPanelProps {
  onSelectQuiz: (quizId: string) => void;
  onExitAdmin?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onSelectQuiz, onExitAdmin }) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'quizzes' | 'students'>('attendance');

  // Dynamic state loaded from persistent storage
  const [students, setStudents] = useState<Student[]>(() => getStoredStudents());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => getStoredAttendance());
  const [quizzes, setQuizzes] = useState<Quiz[]>(() => getStoredQuizzes());

  // Filter states
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | 'all'>('sec3');
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [currentSessionTitle, setCurrentSessionTitle] = useState<string>('حصة 2: الهيكل المحوري وعظام القفص الصدري');
  const [currentSessionDate, setCurrentSessionDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Quiz creation modal state
  const [showAddQuizModal, setShowAddQuizModal] = useState<boolean>(false);
  const [newQuizTitle, setNewQuizTitle] = useState<string>('');
  const [newQuizGrade, setNewQuizGrade] = useState<GradeLevel>('sec3');
  const [newQuizUnit, setNewQuizUnit] = useState<string>('الباب الأول: الدعامة والحركة');
  const [newQuizDuration, setNewQuizDuration] = useState<number>(20);
  const [newQuizPassing, setNewQuizPassing] = useState<number>(60);
  const [isComprehensive, setIsComprehensive] = useState<boolean>(false);
  const [newQuestions, setNewQuestions] = useState<Question[]>([
    {
      id: 'q_' + Date.now(),
      type: 'mcq',
      prompt: 'ما هي الوظيفة الأساسية لخيوط الأكتين في القطعة العضلية؟',
      options: ['الانزلاق لتوليد قوة الانقباض', 'تخزين الكالسيوم', 'توليد النبض العصبي', 'تثبيت العظم'],
      correctAnswer: 'الانزلاق لتوليد قوة الانقباض',
      explanation: 'تنزلق خيوط الأكتين الرفيعة فوق خيوط الميوسين السميكة بواسطة الروابط المستعرضة وبمساعدة ATP وأيونات الكالسيوم.',
      points: 2,
    },
  ]);

  // Calculate high-level metrics
  const totalStudentsCount = students.length;
  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const overallAttendanceRate = attendanceRecords.length > 0
    ? Math.round((presentCount / attendanceRecords.length) * 100)
    : 92;

  // Handler: Update attendance for a student
  const handleUpdateAttendance = (student: Student, status: AttendanceStatus) => {
    // Check if record exists for this session & student
    const existingIndex = attendanceRecords.findIndex(
      r => r.studentId === student.id && (r.sessionTitle === currentSessionTitle || r.date === currentSessionDate)
    );

    let updated: AttendanceRecord[];
    if (existingIndex >= 0) {
      updated = [...attendanceRecords];
      updated[existingIndex] = {
        ...updated[existingIndex],
        status,
        date: currentSessionDate,
      };
    } else {
      const newRec: AttendanceRecord = {
        id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        studentId: student.id,
        studentName: student.name,
        studentPhone: student.phone,
        parentPhone: student.parentPhone || student.phone,
        grade: student.grade || 'sec3',
        sessionTitle: currentSessionTitle,
        date: currentSessionDate,
        status,
      };
      updated = [newRec, ...attendanceRecords];
    }

    setAttendanceRecords(updated);
    saveStoredAttendance(updated);
  };

  const getStudentStatusForSession = (studentId: string): AttendanceStatus | 'unrecorded' => {
    const rec = attendanceRecords.find(
      r => r.studentId === studentId && (r.sessionTitle === currentSessionTitle || r.date === currentSessionDate)
    );
    return rec ? rec.status : 'unrecorded';
  };

  // Handler: Delete Quiz
  const handleDeleteQuiz = (quizId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الاختبار؟')) return;
    const next = quizzes.filter(q => q.id !== quizId);
    setQuizzes(next);
    saveStoredQuizzes(next);
  };

  // Handler: Save New Quiz
  const handleCreateQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuizTitle.trim()) return;

    const created: Quiz = {
      id: 'quiz_' + Date.now(),
      title: newQuizTitle.trim(),
      grade: newQuizGrade,
      gradeTitle: newQuizGrade === 'sec3' ? 'الصف الثالث الثانوي' : newQuizGrade === 'sec2' ? 'الصف الثاني الثانوي' : 'الصف الأول الثانوي',
      unitTitle: newQuizUnit,
      description: isComprehensive ? 'امتحان شامل مطابق للثانوية العامة' : 'كويز تقييمي سريع لمتابعة الاستيعاب',
      isComprehensiveExam: isComprehensive,
      timeLimitMinutes: newQuizDuration,
      passingScore: newQuizPassing,
      createdAt: new Date().toISOString().split('T')[0],
      questions: newQuestions,
    };

    const next = [created, ...quizzes];
    setQuizzes(next);
    saveStoredQuizzes(next);
    setShowAddQuizModal(false);
    setNewQuizTitle('');
  };

  const filteredStudents = students.filter(s => {
    const matchesGrade = selectedGrade === 'all' || s.grade === selectedGrade;
    const matchesSearch =
      searchStudent.trim() === '' ||
      s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.phone.includes(searchStudent) ||
      s.studentCode.toLowerCase().includes(searchStudent.toLowerCase());
    return matchesGrade && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 text-xs font-bold">
                لوحة المدرس والأدمن (منطقة مقيدة)
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                إدارة المنصة والطلاب
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              تسجيل الحضور والغياب للطلاب، إضافة وتعديل الامتحانات، ومتابعة أولياء الأمور.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {onExitAdmin && (
              <button
                onClick={onExitAdmin}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl border border-slate-300 dark:border-slate-700 transition-colors shadow-xs"
              >
                معاينة المنصة كطالب ←
              </button>
            )}

            <button
              onClick={() => setShowAddQuizModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة امتحان أو كويز جديد</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">الطلاب المسجلون</span>
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {totalStudentsCount} طالب
            </div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 block">مرتبط بنظام تسجيل الدخول</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">نسبة الحضور التراكمية</span>
              <CalendarCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 tabular-nums">
              {overallAttendanceRate}%
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">عبر جميع المحاضرات</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">الامتحانات والكويزات</span>
              <FileQuestion className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
              {quizzes.length} اختبار
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">شاملة وتفاعلية</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">متوسط الدرجات</span>
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              88.5%
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">مستوى تفوق ممتاز</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
              activeTab === 'attendance'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            📋 تسجيل ومتابعة الحضور والغياب
          </button>

          <button
            onClick={() => setActiveTab('quizzes')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
              activeTab === 'quizzes'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            📝 إدارة الامتحانات والكويزات ({quizzes.length})
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
              activeTab === 'students'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            👥 سجل الطلاب ودرجاتهم ({students.length})
          </button>
        </div>

        {/* TAB 1: ATTENDANCE & ABSENCE TRACKER */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            
            {/* Session Settings & Filters */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    عنوان المحاضرة / الجلسة:
                  </label>
                  <input
                    type="text"
                    value={currentSessionTitle}
                    onChange={e => setCurrentSessionTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    تاريخ الحصة:
                  </label>
                  <input
                    type="date"
                    value={currentSessionDate}
                    onChange={e => setCurrentSessionDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    تصفية حسب الصف:
                  </label>
                  <select
                    value={selectedGrade}
                    onChange={e => setSelectedGrade(e.target.value as GradeLevel | 'all')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="all">جميع الصفوف الدراسية</option>
                    <option value="sec3">الصف الثالث الثانوي</option>
                    <option value="sec2">الصف الثاني الثانوي</option>
                    <option value="sec1">الصف الأول الثانوي</option>
                  </select>
                </div>
              </div>

              {/* Search in Student Roster */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ابحث باسم الطالب، رقم الهاتف، أو كود الطالب..."
                  value={searchStudent}
                  onChange={e => setSearchStudent(e.target.value)}
                  className="w-full pl-4 pr-9 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Attendance Roster Table */}
            <div className="rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-950/80 text-slate-700 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3.5 px-4">كود الطالب</th>
                      <th className="py-3.5 px-4">اسم الطالب</th>
                      <th className="py-3.5 px-4">الصف والمحافظة</th>
                      <th className="py-3.5 px-4">التواصل والمتابعة</th>
                      <th className="py-3.5 px-4">تسجيل الحضور للجلسة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                    {filteredStudents.map(student => {
                      const currentStatus = getStudentStatusForSession(student.id);

                      return (
                        <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-colors">
                          {/* Student Code */}
                          <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {student.studentCode}
                          </td>

                          {/* Student Name */}
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                            {student.name}
                          </td>

                          {/* Grade & Governorate */}
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            <div>{student.grade === 'sec3' ? 'ثالثة ثانوي' : student.grade === 'sec2' ? 'ثانية ثانوي' : 'أولى ثانوي'}</div>
                            <span className="text-[11px] text-slate-400">{student.governorate || 'القاهرة'}</span>
                          </td>

                          {/* Contact & Parent Link */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <a
                                href={`tel:${student.phone}`}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                                title="اتصال بالطالب"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                              <a
                                href={`https://wa.me/2${student.parentPhone || student.phone}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors"
                                title="إرسال تقرير الحضور لولي الأمر عبر واتساب"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                                {student.parentPhone || student.phone}
                              </span>
                            </div>
                          </td>

                          {/* Attendance Actions */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleUpdateAttendance(student, 'present')}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                                  currentStatus === 'present'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                                }`}
                              >
                                حاضر
                              </button>

                              <button
                                onClick={() => handleUpdateAttendance(student, 'absent')}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                                  currentStatus === 'absent'
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                                }`}
                              >
                                غائب
                              </button>

                              <button
                                onClick={() => handleUpdateAttendance(student, 'late')}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                                  currentStatus === 'late'
                                    ? 'bg-amber-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                                }`}
                              >
                                متأخر
                              </button>

                              <button
                                onClick={() => handleUpdateAttendance(student, 'excused')}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                                  currentStatus === 'excused'
                                    ? 'bg-cyan-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                                }`}
                              >
                                بعذر
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: EXAMS & QUIZZES MANAGEMENT */}
        {activeTab === 'quizzes' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {quizzes.map(quiz => (
                <div
                  key={quiz.id}
                  className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        quiz.isComprehensiveExam
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {quiz.isComprehensiveExam ? 'امتحان شامل' : 'كويز درس'}
                      </span>
                      <span className="text-xs text-slate-400 tabular-nums">
                        {quiz.timeLimitMinutes} دقيقة
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-base mb-2">
                      {quiz.title}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      {quiz.description}
                    </p>

                    <div className="text-xs text-slate-400 space-y-1 mb-5">
                      <div>الصف: {quiz.gradeTitle}</div>
                      <div>عدد الأسئلة: {quiz.questions.length} أسئلة</div>
                      <div>نسبة النجاح: {quiz.passingScore}%</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-700/60">
                    <button
                      onClick={() => onSelectQuiz(quiz.id)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors text-center"
                    >
                      معاينة الاختبار
                    </button>

                    <button
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      className="p-2 bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition-colors"
                      title="حذف الاختبار"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: REGISTERED STUDENTS & GRADEBOOK */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 overflow-hidden shadow-lg">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-700">
                  <tr>
                    <th className="py-3.5 px-4">كود الطالب</th>
                    <th className="py-3.5 px-4">اسم الطالب</th>
                    <th className="py-3.5 px-4">الهواتف (طالب / ولي أمر)</th>
                    <th className="py-3.5 px-4">الصف والمحافظة</th>
                    <th className="py-3.5 px-4">الامتحانات المكتملة</th>
                    <th className="py-3.5 px-4">تاريخ التسجيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {students.map(st => (
                    <tr key={st.id} className="hover:bg-slate-750/50">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">{st.studentCode}</td>
                      <td className="py-3 px-4 font-semibold text-white">{st.name}</td>
                      <td className="py-3 px-4 text-slate-300 tabular-nums">
                        <div>طالب: {st.phone}</div>
                        <div className="text-[11px] text-slate-400">ولي الأمر: {st.parentPhone || 'غير مسجل'}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {st.grade === 'sec3' ? 'ثالثة ثانوي' : st.grade === 'sec2' ? 'ثانية ثانوي' : 'أولى ثانوي'}
                        <div className="text-[11px] text-slate-400">{st.governorate || 'القاهرة'}</div>
                      </td>
                      <td className="py-3 px-4">
                        {st.examAttempts && st.examAttempts.length > 0 ? (
                          <div className="space-y-1">
                            {st.examAttempts.slice(0, 2).map(att => (
                              <div key={att.id} className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${att.isPassed ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                <span className="text-white font-medium truncate max-w-[150px]">{att.quizTitle}</span>
                                <span className="font-bold text-emerald-400 tabular-nums">({att.percentage}%)</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500">لم يختبر بعد</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 tabular-nums">{st.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL: ADD NEW QUIZ */}
        {showAddQuizModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 my-auto space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-lg text-white">إضافة اختبار أو كويز جديد</h3>
                <button
                  onClick={() => setShowAddQuizModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateQuiz} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">عنوان الامتحان:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: كويز تضاعف الـ DNA والإنزيمات"
                    value={newQuizTitle}
                    onChange={e => setNewQuizTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">الصف الدراسي:</label>
                    <select
                      value={newQuizGrade}
                      onChange={e => setNewQuizGrade(e.target.value as GradeLevel)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="sec3">الصف الثالث الثانوي</option>
                      <option value="sec2">الصف الثاني الثانوي</option>
                      <option value="sec1">الصف الأول الثانوي</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">نوع الاختبار:</label>
                    <select
                      value={isComprehensive ? 'comp' : 'lesson'}
                      onChange={e => setIsComprehensive(e.target.value === 'comp')}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="lesson">كويز درس سريع</option>
                      <option value="comp">امتحان شامل على الباب</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">المدة الزمنية (بالدقائق):</label>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={newQuizDuration}
                      onChange={e => setNewQuizDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">نسبة النجاح المقررة (%):</label>
                    <input
                      type="number"
                      min={40}
                      max={100}
                      value={newQuizPassing}
                      onChange={e => setNewQuizPassing(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-2">
                  <span className="font-bold text-emerald-400 block">أسئلة الاختبار (تم ضبط السؤال الأول تلقائياً):</span>
                  <div className="text-slate-300">
                    س: {newQuestions[0].prompt}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddQuizModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md"
                  >
                    حفظ ونشر الاختبار
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
