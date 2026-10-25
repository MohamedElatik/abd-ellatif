/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Teacher, Course, GradeLevel } from '../types';
import { mockCourses, mockLectures, mockQuizzes } from '../data/mockData';
import {
  Star,
  Users,
  Video,
  Clock,
  BookOpen,
  Award,
  CheckCircle,
  FileText,
  Play,
  ExternalLink,
  MessageCircle,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';

interface TeacherProfileViewProps {
  teacher: Teacher;
  onSelectLecture: (lectureId: string) => void;
  onSelectQuiz: (quizId: string) => void;
  onEnrollCourse?: (courseId: string) => void;
}

export const TeacherProfileView: React.FC<TeacherProfileViewProps> = ({
  teacher,
  onSelectLecture,
  onSelectQuiz,
  onEnrollCourse,
}) => {
  // Tabs matching Bassthalk teacher page
  const [activeSubTab, setActiveSubTab] = useState<'courses' | 'videos' | 'revisions' | 'quizzes' | 'about'>('courses');
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | 'all'>('all');

  const filteredCourses = selectedGrade === 'all'
    ? mockCourses
    : mockCourses.filter(c => c.grade === selectedGrade);

  const filteredLectures = selectedGrade === 'all'
    ? mockLectures
    : mockLectures.filter(l => l.grade === selectedGrade);

  const filteredQuizzes = selectedGrade === 'all'
    ? mockQuizzes
    : mockQuizzes.filter(q => q.grade === selectedGrade);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 pb-20 transition-colors">
      
      {/* 1. Bassthalk Teacher Header / Profile Banner */}
      <div className="relative bg-gradient-to-b from-emerald-100/70 via-slate-50 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 pt-8 pb-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Teacher Avatar Portrait */}
            <div className="relative shrink-0">
              <div className="w-36 h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden border-3 border-emerald-500 shadow-xl shadow-emerald-950/20 bg-slate-100 dark:bg-slate-800">
                <img
                  src={teacher.avatar}
                  alt={teacher.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-2 -left-2 bg-emerald-600 text-white p-1.5 rounded-lg shadow-md">
                <Award className="w-5 h-5" />
              </div>
            </div>

            {/* Teacher Details & Bio */}
            <div className="flex-1 text-center md:text-right">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {teacher.name}
                </h1>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  {teacher.specialization}
                </span>
              </div>

              <p className="text-sm sm:text-base font-semibold text-emerald-700 dark:text-emerald-400/90 mb-3">
                {teacher.title}
              </p>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mb-6">
                {teacher.bio}
              </p>

              {/* Bassthalk Metric Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl py-3 px-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 mb-6 text-center shadow-xs">
                <div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">+{teacher.totalStudents.toLocaleString('ar-EG')}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">طالب مشترك</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">+{mockCourses.length}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">كورسات متخصصة</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-amber-500 dark:text-amber-400 tabular-nums flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{teacher.rating}</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">تقييم الطلاب ({teacher.reviewsCount})</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">+{teacher.experienceYears} عاماً</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">خبرة تدريسية</div>
                </div>
              </div>

              {/* Direct Social & WhatsApp Contact */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <a
                  href={teacher.socials.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>تواصل عبر واتساب للمتابعة</span>
                </a>

                <button
                  onClick={() => setActiveSubTab('videos')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-lg transition-colors shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>استعراض المحاضرات والدروس</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* 2. Navigation Tabs (Identical to Bassthalk teacher/3 system) */}
      <div className="sticky top-18 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto py-2.5 text-sm font-semibold">
            <button
              onClick={() => setActiveSubTab('courses')}
              className={`pb-2 pt-1 border-b-2 transition-colors whitespace-nowrap px-2 ${
                activeSubTab === 'courses'
                  ? 'border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              الكورسات والصفوف
            </button>

            <button
              onClick={() => setActiveSubTab('videos')}
              className={`pb-2 pt-1 border-b-2 transition-colors whitespace-nowrap px-2 ${
                activeSubTab === 'videos'
                  ? 'border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              الفيديوهات والمحاضرات ({mockLectures.length})
            </button>

            <button
              onClick={() => setActiveSubTab('quizzes')}
              className={`pb-2 pt-1 border-b-2 transition-colors whitespace-nowrap px-2 ${
                activeSubTab === 'quizzes'
                  ? 'border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              بنك الامتحانات والكويزات ({mockQuizzes.length})
            </button>

            <button
              onClick={() => setActiveSubTab('revisions')}
              className={`pb-2 pt-1 border-b-2 transition-colors whitespace-nowrap px-2 ${
                activeSubTab === 'revisions'
                  ? 'border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              المراجعات النهائية وليالي الامتحان
            </button>

            <button
              onClick={() => setActiveSubTab('about')}
              className={`pb-2 pt-1 border-b-2 transition-colors whitespace-nowrap px-2 ${
                activeSubTab === 'about'
                  ? 'border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              عن المدرس والشهادات
            </button>
          </div>
        </div>
      </div>

      {/* 3. Grade Filter Pill-Bar (Bassthalk Grade Level Filter) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center gap-2 mb-8 overflow-x-auto p-1 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 w-fit shadow-xs">
          <button
            onClick={() => setSelectedGrade('all')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              selectedGrade === 'all'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            جميع الصفوف
          </button>
          <button
            onClick={() => setSelectedGrade('sec3')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              selectedGrade === 'sec3'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            الصف الثالث الثانوي (الثانوية العامة)
          </button>
          <button
            onClick={() => setSelectedGrade('sec2')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              selectedGrade === 'sec2'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            الصف الثاني الثانوي
          </button>
          <button
            onClick={() => setSelectedGrade('sec1')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              selectedGrade === 'sec1'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            الصف الأول الثانوي
          </button>
        </div>

        {/* Tab 1: Courses (الكورسات) */}
        {activeSubTab === 'courses' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => (
              <div
                key={course.id}
                className="rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 overflow-hidden hover:border-emerald-500/50 transition-all flex flex-col group shadow-sm hover:shadow-lg"
              >
                {/* Course Cover Image */}
                <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-900">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 shadow-xs">
                    {course.gradeTitle}
                  </div>
                </div>

                {/* Course Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                      {course.subtitle}
                    </p>

                    {/* Metadata indicators */}
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4 pb-4 border-b border-slate-100 dark:border-slate-700/60">
                      <div className="flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{course.totalLectures} محاضرة</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                        <span>{course.totalHours} ساعة شرح</span>
                      </div>
                    </div>

                    {/* Units Checklist */}
                    <div className="space-y-1.5 mb-5 text-xs text-slate-700 dark:text-slate-300">
                      <div className="font-semibold text-slate-500 dark:text-slate-400 mb-1">الأبواب والوحدات المشمولة:</div>
                      {course.units.map(u => (
                        <div key={u.id} className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate">{u.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions & Price */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/60">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">قيمة الاشتراك</span>
                      <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {course.price} ج.م <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ للترم</span>
                      </span>
                    </div>

                    <button
                      onClick={() => setActiveSubTab('videos')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <span>عرض المحتوى</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Videos (الفيديوهات والمحاضرات) */}
        {activeSubTab === 'videos' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-xs">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">المحاضرات والشروحات التفاعلية</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">تصفح محاضرات المنهج مرتبة حسب تسلسل الأبواب والوحدات.</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                {filteredLectures.length} محاضرة متاحة
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLectures.map(lec => (
                <div
                  key={lec.id}
                  className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/40 transition-all flex flex-col justify-between shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                        {lec.unitTitle}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 tabular-nums">
                        <Clock className="w-3.5 h-3.5" />
                        {lec.videoDuration}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base mb-2">
                      {lec.title}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                      {lec.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                    {lec.pdfAttachment ? (
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                        <span>ملزمة الشرح PDF مرفقة</span>
                      </span>
                    ) : <span />}

                    <div className="flex items-center gap-2">
                      {lec.associatedQuizId && (
                        <button
                          onClick={() => onSelectQuiz(lec.associatedQuizId!)}
                          className="px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded border border-emerald-300 dark:border-emerald-800/60 transition-colors"
                        >
                          كويز الدرس
                        </button>
                      )}

                      <button
                        onClick={() => onSelectLecture(lec.id)}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded shadow-sm transition-colors flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>مشاهدة الشرح</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Quizzes (بنك الامتحانات) */}
        {activeSubTab === 'quizzes' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-xs">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">بنك الامتحانات والكويزات الإلكترونية</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">امتحانات محددة بوقت مع تصحيح فوري وتحليل نقاط الضعف.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredQuizzes.map(quiz => (
                <div
                  key={quiz.id}
                  className={`p-5 rounded-2xl border flex flex-col justify-between shadow-xs ${
                    quiz.isComprehensiveExam
                      ? 'bg-gradient-to-b from-emerald-50/60 to-white dark:from-slate-800 dark:to-emerald-950/30 border-emerald-300 dark:border-emerald-500/40 shadow-md'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        quiz.isComprehensiveExam
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
                      }`}>
                        {quiz.isComprehensiveExam ? 'امتحان شامل' : 'كويز درس'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 tabular-nums">
                        <Clock className="w-3.5 h-3.5" />
                        {quiz.timeLimitMinutes} دقيقة
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                      {quiz.title}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                      {quiz.description}
                    </p>

                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 mb-5">
                      <div>عدد الأسئلة: {quiz.questions.length} أسئلة (MCQ ومقالي)</div>
                      <div>نسبة النجاح المقررة: {quiz.passingScore}%</div>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectQuiz(quiz.id)}
                    className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <span>ابدأ الاختبار الآن</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Revisions (المراجعات النهائية) */}
        {activeSubTab === 'revisions' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-700/50 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <span className="text-xs font-bold text-amber-400 mb-2 inline-block">معسكر الإنقاذ السريع</span>
                <h3 className="text-xl font-bold text-white mb-2">معسكر مراجعة ليلة الامتحان الشاملة للثانوية العامة</h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  مراجعة مركزة في 6 أيام فقط تضم حل أكثر من 1500 فكرة امتحان، ملخصات القوانين والرسومات البيانية والمقارنات الهامة لكافة أبواب المنهج.
                </p>
              </div>
              <button
                onClick={() => setActiveSubTab('quizzes')}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shrink-0 transition-transform active:scale-95"
              >
                دخول بنك الأسئلة الشامل
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700">
                <h4 className="font-bold text-emerald-400 text-base mb-2">مراجعة الباب الأول والثاني</h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  الدعامة في النبات، الهيكل العظمي، الانقباض العضلي، والغدد الصماء والهرمونات.
                </p>
                <button
                  onClick={() => setActiveSubTab('videos')}
                  className="text-xs text-emerald-400 font-semibold hover:underline"
                >
                  استعراض المحاضرات الخاصة ←
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700">
                <h4 className="font-bold text-cyan-400 text-base mb-2">مراجعة التكاثر والمناعة</h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  التكاثر اللاجنسي والجنسي، تعاقب الأجيال، التكاثر في الإنسان، وآليات خطوط الدفاع المناعية.
                </p>
                <button
                  onClick={() => setActiveSubTab('videos')}
                  className="text-xs text-cyan-400 font-semibold hover:underline"
                >
                  استعراض المحاضرات الخاصة ←
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700">
                <h4 className="font-bold text-purple-400 text-base mb-2">معسكر البيولوجيا الجزيئية</h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  أسرار تركيب DNA وRNA، الطفرات الجينية، الهندسة الوراثية وتخليق البروتين.
                </p>
                <button
                  onClick={() => setActiveSubTab('videos')}
                  className="text-xs text-purple-400 font-semibold hover:underline"
                >
                  استعراض المحاضرات الخاصة ←
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: About (عن المدرس والشهادات) */}
        {activeSubTab === 'about' && (
          <div className="p-8 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-6">
            <h3 className="text-xl font-bold text-white mb-4">السيرة الذاتية والخبرات الأكاديمية</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-slate-300 leading-relaxed">
              <div className="space-y-4">
                <h4 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-400" />
                  المؤهلات والدرجات العلمية
                </h4>
                <ul className="space-y-2.5 text-xs sm:text-sm">
                  <li>• بكالوريوس العلوم والتربية (قسم البيولوجيا وعلم الحيوان) بتقدير امتياز مع مرتبة الشرف.</li>
                  <li>• ماجستير في البيولوجيا الجزيئية وتطبيقات الهندسة الوراثية الحديثة.</li>
                  <li>• استشاري معتمد لتطوير مناهج الأحياء للمرحلة الثانوية.</li>
                  <li>• أكثر من 15 عاماً في التدريس وتخريج أوائل الثانوية العامة على مستوى الجمهورية.</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-base font-bold text-cyan-400 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-cyan-400" />
                  فلسفة التدريس ونظام المتابعة
                </h4>
                <p className="text-xs sm:text-sm text-slate-300">
                  نؤمن في منصتنا بأن علم الأحياء ليس مادة للحفظ والتلقين، بل هو فهم تطبيقي دقيق لأعجاز الخلق وفسيولوجيا الكائنات الحية. نعتمد على الرسوم ثلاثية الأبعاد التفاعلية والربط بين الدروس ومتابعة أسبوعية دقيقة للحضور والغياب مع ولي الأمر.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
