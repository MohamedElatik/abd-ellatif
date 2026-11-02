/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useQuizzes, publishQuiz, archiveQuiz, legacyQuizDrafts } from '../utils/quizzes';
import { CourseManager } from './CourseManager';
import { useAttempts, saveAttendance } from '../utils/records';
import { databaseRequest } from '../utils/quizzes';
import { ResultsManager } from './ResultsManager';
import { CodeAttendance, savedSession } from './CodeAttendance';
import { SecretaryManager } from './SecretaryManager';
import { ConfirmDelete } from './ConfirmDelete';
import { deleteStudent } from '../utils/admin';
import { QuestionEditor } from './QuestionEditor';
import React, { useState, useEffect } from 'react';
import { fetchRegisteredStudents, RegisteredStudent } from '../utils/students';
import { Student, AttendanceRecord, Quiz, Question, GradeLevel, AttendanceStatus } from '../types';

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
  const [activeTab, setActiveTab] = useState<'attendance' | 'quizzes' | 'students' | 'courses' | 'results' | 'secretaries'>('attendance');
  const [studentMessage, setStudentMessage] = useState<{ text: string; err?: boolean } | null>(null);

  // Dynamic state loaded from persistent storage
  const [students, setStudents] = useState<RegisteredStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState('');
  const [reloadStudents, setReloadStudents] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setStudentsLoading(true); setStudentsError(''); setStudents([]);
    fetchRegisteredStudents(controller.signal).then(data => { if (!controller.signal.aborted) setStudents(data); })
      .catch(error => { if (!controller.signal.aborted) setStudentsError(error.message || 'تعذر تحميل الطلاب.'); })
      .finally(() => { if (!controller.signal.aborted) setStudentsLoading(false); });
    return () => controller.abort();
  }, [reloadStudents]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const { quizzes, error: quizzesError } = useQuizzes();
  const [quizError,setQuizError]=useState('');
  const [savingQuiz,setSavingQuiz]=useState(false);

  const {attempts,error:attemptsError}=useAttempts();
  const [recordsError,setRecordsError]=useState('');
  useEffect(()=>{let alive=true;databaseRequest('platform_attendance?select=document').then(rows=>{if(alive)setAttendanceRecords(rows.map((r:{document:AttendanceRecord})=>r.document));}).catch(e=>{if(alive)setRecordsError(e.message);});return()=>{alive=false;};},[reloadStudents]);
  // Filter states
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | 'all'>('sec3');
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [currentSessionTitle, setCurrentSessionTitle] = useState<string>(() => savedSession().title);
  const [currentSessionDate, setCurrentSessionDate] = useState<string>(() => savedSession().date);

  const [attendanceRevision, setAttendanceRevision] = useState(0);

  // Quiz creation modal state
  const [showAddQuizModal, setShowAddQuizModal] = useState<boolean>(false);
  const [newQuizTitle, setNewQuizTitle] = useState<string>('');
  const [newQuizGrade, setNewQuizGrade] = useState<GradeLevel>('sec3');
  const [newQuizUnit, setNewQuizUnit] = useState<string>('الباب الأول: الدعامة والحركة');
  const [newQuizDuration, setNewQuizDuration] = useState<number>(20);
  const [newQuizPassing, setNewQuizPassing] = useState<number>(60);
  const [isComprehensive, setIsComprehensive] = useState<boolean>(false);
  const [newQuestions, setNewQuestions] = useState<Question[]>([]);

  // Calculate high-level metrics
  const totalStudentsCount = students.length;
  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const overallAttendanceRate = attendanceRecords.length > 0
    ? Math.round((presentCount / attendanceRecords.length) * 100)
    : 0;

  // Handler: Update attendance for a student
  const handleUpdateAttendance = async (student: Student, status: AttendanceStatus) => {
    // Check if record exists for this session & student
    const existingIndex = attendanceRecords.findIndex(
      r => r.studentId === student.id && (r.sessionTitle === currentSessionTitle && r.date === currentSessionDate)
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
        id: [student.id,currentSessionDate,currentSessionTitle].join('|'),
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

    const record=updated.find(r=>r.studentId===student.id && r.date===currentSessionDate && r.sessionTitle===currentSessionTitle)!;
    try{await saveAttendance(record);setAttendanceRevision(n=>n+1);setAttendanceRecords(prev=>[record,...prev.filter(r=>r.id!==record.id)]);setRecordsError('');}catch(e){setRecordsError((e as Error).message);}
  };

  const getStudentStatusForSession = (studentId: string): AttendanceStatus | 'unrecorded' => {
    const rec = attendanceRecords.find(
      r => r.studentId === studentId && (r.sessionTitle === currentSessionTitle && r.date === currentSessionDate)
    );
    return rec ? rec.status : 'unrecorded';
  };

  // Handler: Delete Quiz
  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('إلغاء نشر الامتحان للطلاب؟')) return;
    try { await archiveQuiz(quizId); } catch(e) { setQuizError(e instanceof Error?e.message:'تعذر إلغاء النشر.'); }
  };

  // Handler: Save New Quiz
  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingQuiz) return;
    setQuizError('');

    const created: Quiz = {
      id: 'quiz_' + Date.now(),
      title: newQuizTitle.trim(),
      grade: newQuizGrade,
      gradeTitle: 'الصف الثالث الثانوي',
      unitTitle: newQuizUnit,
      description: isComprehensive ? 'امتحان شامل مطابق للثانوية العامة' : 'كويز تقييمي سريع لمتابعة الاستيعاب',
      isComprehensiveExam: isComprehensive,
      timeLimitMinutes: newQuizDuration,
      passingScore: newQuizPassing,
      createdAt: new Date().toISOString().split('T')[0],
      questions: newQuestions,
    };

    setSavingQuiz(true);
    try { await publishQuiz(created); setShowAddQuizModal(false);setNewQuizTitle('');setNewQuestions([]); }
    catch(e) {setQuizError(e instanceof Error?e.message:'تعذر نشر الامتحان.');}
    finally {setSavingQuiz(false);}
  };

  const filteredStudents = students.map(s=>({...s,examAttempts:attempts.filter(a=>a.studentId===s.id)})).filter(s => {
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
        {(quizzesError || (!showAddQuizModal && quizError)) && <p role="alert" className="text-rose-400">{quizzesError || quizError}</p>}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <button className="rounded-lg bg-emerald-600 px-4 py-2 text-white disabled:opacity-50" disabled={studentsLoading} onClick={() => setReloadStudents(n => n + 1)}>تحديث سجل الطلاب</button>
          {studentsLoading && <span role="status">جارٍ تحميل الطلاب من قاعدة البيانات…</span>}
          {studentsError && <span role="alert" className="text-rose-400">{studentsError}</span>}
          {!studentsLoading && !studentsError && <span>الطلاب المسجلون فعليًا: {students.length} — حساب المعلم غير محسوب.</span>}
          {!studentsLoading && !studentsError && students.length === 0 && <span>لا يوجد طلاب مسجلون بعد.</span>}
          {students.length === 1000 && <span>يظهر أحدث 1000 طالب.</span>}
        </div>
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 text-xs font-bold">
                لوحة المدرس والأدمن (منطقة مقيدة)
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                إدارة المنصة والطلاب
              </h2>
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
              {attempts.length ? Math.round(attempts.reduce((sum,a)=>sum+a.percentage,0)/attempts.length) : 0}%
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">مستوى تفوق ممتاز</span>
          </div>
        </div>

        {(recordsError||attemptsError)&&<p role="alert">{recordsError||attemptsError}</p>}
        <div className="flex gap-3"><button className="rounded-xl bg-emerald-700 text-white p-3" onClick={()=>setActiveTab('courses')}>إدارة الكورسات والفيديوهات</button><button className="rounded-xl bg-cyan-700 text-white p-3" onClick={()=>setActiveTab('results')}>نتائج الطلاب وتصحيح المقالي</button><button className="rounded-xl bg-amber-600 text-white p-3" onClick={()=>setActiveTab('secretaries')}>حسابات السكرتارية</button></div>
        {activeTab==='courses'&&<CourseManager/>}{activeTab==='results'&&<ResultsManager/>}{activeTab==='secretaries'&&<SecretaryManager/>}
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
            <div>
              <h3 className="text-xl font-black mb-1">تسجيل سريع بكود الطالب</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">نفس الصفحة اللي بيستخدمها السكرتير. أو استخدم الجدول تحت لتسجيل كل طالب بالاسم.</p>
              <CodeAttendance
                session={{ title: currentSessionTitle, date: currentSessionDate }}
                onSessionChange={s => { setCurrentSessionTitle(s.title); setCurrentSessionDate(s.date); }}
                revision={attendanceRevision}
                onRowsChange={(rows, session) => setAttendanceRecords(prev => [...rows, ...prev.filter(r => r.sessionTitle !== session.title.trim() || r.date !== session.date)])}
              />
            </div>
            
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
                    
                    <option value="sec3">الصف الثالث الثانوي</option>
                    
                    
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
            {studentMessage && <p role="status" className={studentMessage.err ? 'sx-alert' : 'sx-ok'}>{studentMessage.text}</p>}
            <div className="rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 overflow-x-auto shadow-lg">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3.5 px-4">كود الطالب</th>
                    <th className="py-3.5 px-4">اسم الطالب</th>
                    <th className="py-3.5 px-4">الهواتف (طالب / ولي أمر)</th>
                    <th className="py-3.5 px-4">الصف والمحافظة</th>
                    <th className="py-3.5 px-4">الامتحانات المكتملة</th>
                    <th className="py-3.5 px-4">تاريخ التسجيل</th>
                    <th className="py-3.5 px-4">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                  {students.map(st => (
                    <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-mono font-black text-base tracking-widest text-emerald-600 dark:text-emerald-400" dir="ltr">{st.studentCode}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{st.name}<div className="text-xs text-slate-400" dir="ltr">{st.email}</div><div className="text-xs">{st.confirmed ? 'البريد مؤكد' : 'بانتظار تأكيد البريد'} · {st.enrolledCourses.length ? 'اشتراك فعال' : 'بدون اشتراك فعال'}</div></td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 tabular-nums">
                        <div>طالب: {st.phone}</div>
                        <div className="text-[11px] text-slate-400">ولي الأمر: {st.parentPhone || 'غير مسجل'}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {st.grade === 'sec3' ? 'ثالثة ثانوي' : st.grade === 'sec2' ? 'ثانية ثانوي' : 'أولى ثانوي'}
                        <div className="text-[11px] text-slate-400">{st.governorate || 'غير مسجلة'}</div>
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
                          <span className="text-slate-500">لا توجد نتائج محفوظة في قاعدة البيانات</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 tabular-nums">{st.createdAt}</td>
                      <td className="py-3 px-4">
                        <ConfirmDelete label="حذف الحساب" question={`تحذف حساب ${st.name} وكل درجاته وغيابه؟`} onConfirm={async () => {
                          try {
                            const r = await deleteStudent(st.id);
                            if (r === 'deleted') { setStudents(list => list.filter(x => x.id !== st.id)); setStudentMessage({ text: `اتحذف حساب ${st.name}.` }); window.dispatchEvent(new Event('attempts_changed')); }
                            else setStudentMessage({ text: r === 'not_found' ? 'الحساب ده اتحذف قبل كده.' : 'مينفعش تحذف حساب معلم أو سكرتير من هنا.', err: true });
                          } catch (e) { setStudentMessage({ text: (e as Error).message, err: true }); }
                        }} />
                      </td>
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
                {legacyQuizDrafts().length>0&&<label>استيراد مسودة امتحان قديم من هذا الجهاز<select className="bg-slate-800 text-white p-2 w-full" defaultValue="" onChange={e=>{const q=legacyQuizDrafts().find(q=>q.id===e.target.value);if(q){setNewQuizTitle(q.title);setNewQuestions(q.questions);setNewQuizDuration(q.timeLimitMinutes);setNewQuizPassing(q.passingScore);}}}><option value="">ابدأ امتحانًا جديدًا أو اختر مسودة لمراجعتها ونشرها</option>{legacyQuizDrafts().map(q=><option key={q.id} value={q.id}>{q.title}</option>)}</select></label>}
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

                <QuestionEditor questions={newQuestions} onChange={setNewQuestions} />
                {quizError && <p role="alert" className="text-rose-300">{quizError}</p>}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddQuizModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit" disabled={savingQuiz}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md"
                  >
                    {savingQuiz ? 'جارٍ الحفظ…' : 'حفظ ونشر الاختبار'}
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

