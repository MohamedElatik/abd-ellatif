/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Quiz } from './types';
import { currentAuthUser, AUTH_CHANGED } from './utils/auth';
import {
  getStoredTheme,
  saveStoredTheme,
  getStoredQuizzes,
} from './utils/storage';
import { mockTeacher, mockCourses, mockLectures } from './data/mockData';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { TeacherProfileView } from './components/TeacherProfileView';
import { VideosPageView } from './components/VideosPageView';
import { QuizEngineModal } from './components/QuizEngineModal';
import { AuthModal } from './components/AuthModal';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';
import {
  BookOpen,
  Sparkles,
  ArrowLeft,
  Video,
  Award,
  Clock,
  Play,
  CheckCircle,
  FileQuestion,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'teacher' | 'videos' | 'exams' | 'admin'>('home');
  const [currentUser, setCurrentUser] = useState<User>(() => currentAuthUser());
  useEffect(() => {
    const sync = () => setCurrentUser(currentAuthUser());
    window.addEventListener(AUTH_CHANGED, sync);
    return () => window.removeEventListener(AUTH_CHANGED, sync);
  }, []);
  const [isDark, setIsDark] = useState<boolean>(() => getStoredTheme() === 'dark');

  // Modals & Active selections
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [selectedLectureId, setSelectedLectureId] = useState<string | undefined>(undefined);

  // Sync theme with HTML document class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    saveStoredTheme(next ? 'dark' : 'light');
  };

  // Find active quiz object
  const allQuizzes = getStoredQuizzes();
  const currentQuiz = activeQuizId ? allQuizzes.find(q => q.id === activeQuizId) || allQuizzes[0] : null;

  const handleStartQuiz = (quizId: string) => {
    setActiveQuizId(quizId);
  };

  const handleSelectLecture = (lectureId: string) => {
    setSelectedLectureId(lectureId);
    setActiveTab('videos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors`}>
      
      {/* 1. Header (Top Bar Contract) */}
      <Header
        activeTab={activeTab}
        setActiveTab={tab => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentUser={currentUser}
        onOpenAuth={() => setShowAuthModal(true)}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* 2. Main Page Views */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <div>
            {/* Hero Section with 3D DNA Canvas (Ahmed El-Gohary inspired) */}
            <HeroSection
              onStartLearning={() => {
                setActiveTab('teacher');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onExploreVideos={() => {
                setActiveTab('videos');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onGoToTeacher={() => {
                setActiveTab('teacher');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              isDark={isDark}
            />

            {/* Courses Showcase (Secondary Rest Section) */}
            <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                <div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                    المناهج والصفوف الدراسية
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    كورسات الأحياء المتخصصة للثانوية العامة
                  </h2>
                </div>

                <button
                  onClick={() => setActiveTab('teacher')}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1 transition-colors self-start md:self-auto"
                >
                  <span>عرض جميع الكورسات في صفحة المدرس</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {mockCourses.map(course => (
                  <div
                    key={course.id}
                    className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 transition-all overflow-hidden flex flex-col group shadow-sm hover:shadow-lg"
                  >
                    <div className="relative aspect-video bg-slate-100 dark:bg-slate-950 overflow-hidden">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 shadow-xs">
                        {course.gradeTitle}
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                          {course.subtitle}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <Video className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>{course.totalLectures} محاضرة</span>
                        </div>

                        <button
                          onClick={() => {
                            setActiveTab('teacher');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          تفاصيل الكورس
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick Feature Teaser: Biological DNA & Interactive Quizzes */}
            <section className="py-12 bg-slate-100/70 dark:bg-slate-900/60 border-t border-b border-slate-200 dark:border-slate-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-right">
                  <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold mb-3 mx-auto md:mx-0">
                        🧬
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base mb-2">محاكاة DNA والتشريح ثلاثي الأبعاد</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        استبدلنا الطرق التقليدية بمجسمات بصرية تفاعلية تجعل استيعاب تضاعف الأحماض النووية وانقباض العضلات في غاية السهولة.
                      </p>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 flex items-center justify-center font-bold mb-3 mx-auto md:mx-0">
                        ⚡
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base mb-2">نظام امتحانات وكويزات فورية</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        تصحيح إلكتروني ذكي فوري لكل سؤال مع التفسير العلمي الكامل، وإمكانية حل أسئلة مقالية ومسائل البيولوجيا الجزيئية.
                      </p>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold mb-3 mx-auto md:mx-0">
                        📱
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base mb-2">متابعة الحضور والغياب مع ولي الأمر</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        لوحة تحكم خاصة بالمدرس لتوثيق حضور كل جلسة دراسية وإرسال إشعارات فورية عبر واتساب لولي أمر الطالب لضمان الالتزام.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 2. Teacher Profile View (Bassthalk teacher/3 format) */}
        {activeTab === 'teacher' && (
          <TeacherProfileView
            teacher={mockTeacher}
            onSelectLecture={handleSelectLecture}
            onSelectQuiz={handleStartQuiz}
          />
        )}

        {/* 3. Videos Page View (Bassthalk format) */}
        {activeTab === 'videos' && (
          <VideosPageView
            onSignIn={() => setShowAuthModal(true)}
            onStartQuiz={handleStartQuiz}
            selectedLectureId={selectedLectureId}
            onClearSelectedLecture={() => setSelectedLectureId(undefined)}
          />
        )}

        {/* 4. Exams & Quizzes Bank */}
        {activeTab === 'exams' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">
                  بنك الامتحانات الشاملة والكويزات
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  اختبر مستواك الآن في كويزات فصول المنهج والامتحانات التجريبية المطابقة للثانوية العامة.
                </p>
              </div>

              <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 self-start md:self-auto">
                {allQuizzes.length} امتحانات متوفرة
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allQuizzes.map(quiz => (
                <div
                  key={quiz.id}
                  className={`p-6 rounded-2xl border flex flex-col justify-between shadow-xs hover:shadow-lg transition-all ${
                    quiz.isComprehensiveExam
                      ? 'bg-gradient-to-b from-emerald-50/50 to-white dark:from-slate-900 dark:to-emerald-950/40 border-emerald-300 dark:border-emerald-500/50'
                      : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800'
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
                      <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 font-mono tabular-nums">
                        <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                        {quiz.timeLimitMinutes} دقيقة
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                      {quiz.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                      {quiz.description}
                    </p>

                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 mb-5">
                      <div>الصف: {quiz.gradeTitle}</div>
                      <div>عدد الأسئلة: {quiz.questions.length} أسئلة (MCQ ومقالي)</div>
                      <div>نسبة النجاح المقررة: {quiz.passingScore}%</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartQuiz(quiz.id)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>ابدأ الاختبار الآن</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Admin & Teacher Control Panel (Protected by Admin Gate) */}
        {activeTab === 'admin' && (
          currentUser.role === 'teacher' || currentUser.role === 'admin' ? (
            <AdminPanel
              onSelectQuiz={handleStartQuiz}
              onExitAdmin={() => setActiveTab('home')}
            />
          ) : (
            /* Protected Admin Gate for Student or Guest */
            <div className="max-w-2xl mx-auto my-16 px-4">
              <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xl space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-3xl shadow-inner">
                  🔒
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2">
                    منطقة مقيدة: لوحة تحكم المعلم
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    هذه الصفحة مخصصة للمدرس والإدارة فقط لمتابعة الحضور والغياب وسجلات الطلاب والامتحانات. حسابك الحالي مسجل كـ ({currentUser.name} - طالب).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                  تفعيل اشتراكات الفيديو يتم بواسطة إدارة المنصة.
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  {import.meta.env.DEV && <button
                    onClick={() => {
                      const teacherUser = {
                        id: 'teacher_1',
                        name: 'د. محمد الأحمدي (المدرس)',
                        phone: '01012345678',
                        email: 'dr.alahmady.biology@gmail.com',
                        role: 'teacher' as const,
                        createdAt: '2026-01-01',
                      };
                      setCurrentUser(teacherUser);
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                  >
                    معاينة لوحة المدرس التجريبية محليًا
                  </button>}

                  <button
                    onClick={() => setActiveTab('home')}
                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors"
                  >
                    العودة لصفحات الطلاب
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </main>

      {/* 3. Footer */}
      <Footer
        onNavigate={tab => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* 4. Active Quiz Engine Modal */}
      {currentQuiz && (
        <QuizEngineModal
          quiz={currentQuiz}
          currentUser={currentUser}
          onClose={() => setActiveQuizId(null)}
        />
      )}

      {/* 5. Student Auth & Registration Modal */}
      {showAuthModal && (
        <AuthModal
          currentUser={currentUser}
          onClose={() => setShowAuthModal(false)}
          onUserChanged={u => setCurrentUser(u)}
        />
      )}

    </div>
  );
}
