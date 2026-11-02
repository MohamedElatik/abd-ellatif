/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCatalog } from './utils/catalog';
import { StudentDashboard } from './components/StudentDashboard';
import { useQuizzes } from './utils/quizzes';
import React, { useState, useEffect } from 'react';
import { User, Quiz } from './types';
import { currentAuthUser, AUTH_CHANGED, refreshIdentity } from './utils/auth';
import {
  getStoredTheme,
  saveStoredTheme,
} from './utils/storage';
import { mockTeacher } from './data/mockData';
import { SiteHeader, SiteFooter, PageBanner } from './components/SiteChrome';
import { LandingPage } from './components/LandingPage';
import { TeacherProfileView } from './components/TeacherProfileView';
import { VideosPageView } from './components/VideosPageView';
import { QuizEngineModal } from './components/QuizEngineModal';
import { AuthModal } from './components/AuthModal';
import { AdminPanel } from './components/AdminPanel';
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
  const {courses:mockCourses,lectures:mockLectures,error:catalogError}=useCatalog();
  const [activeTab, setActiveTab] = useState<'home' | 'teacher' | 'videos' | 'exams' | 'admin' | 'account'>('home');
  const [currentUser, setCurrentUser] = useState<User>(() => currentAuthUser());
  useEffect(() => {
    const sync = () => {
      const u = currentAuthUser();
      setCurrentUser(u);
      if (u.id === 'guest') setActiveTab(t => (t === 'account' || t === 'admin' ? 'home' : t));
    };
    window.addEventListener(AUTH_CHANGED, sync);
    void refreshIdentity();
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
  const { quizzes: allQuizzes, error: quizzesError } = useQuizzes();
  const currentQuiz = activeQuizId ? allQuizzes.find(q => q.id === activeQuizId) : null;

  const handleStartQuiz = (quizId: string) => {
    setActiveQuizId(quizId);
  };

  const goTo = (tab: typeof activeTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectLecture = (lectureId: string) => {
    setSelectedLectureId(lectureId);
    setActiveTab('videos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors`}>
      
      {/* 1. Site header — same on every page */}
      <SiteHeader
        activeTab={activeTab}
        currentUser={currentUser}
        onNavigate={goTo}
        onOpenAuth={() => setShowAuthModal(true)}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* 2. Main Page Views */}
      <main className="flex-1">
        {catalogError&&activeTab!=='home'&&<p role="alert" className="p-4">{catalogError}</p>}
        {activeTab==='account'&&currentUser.id!=='guest'&&<StudentDashboard user={currentUser} onNavigate={goTo}/>}
        {activeTab === 'home' && (
          <LandingPage
            currentUser={currentUser}
            onOpenAuth={() => setShowAuthModal(true)}
            onNavigate={goTo}
          />
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
        {activeTab === 'videos' && <PageBanner eyebrow="دروسك في مكان واحد" title="الفيديوهات والدروس" text="شروحات المنهج كاملة بالترتيب، مع كويز بعد كل درس." />}
        {activeTab === 'videos' && (
          <VideosPageView
            onSignIn={() => setShowAuthModal(true)}
            onStartQuiz={handleStartQuiz}
            selectedLectureId={selectedLectureId}
            onClearSelectedLecture={() => setSelectedLectureId(undefined)}
          />
        )}

        {/* 4. Exams & Quizzes Bank */}
        {activeTab === 'exams' && <PageBanner eyebrow="اختبر نفسك" title="بنك الامتحانات والكويزات" text="كويزات فصول المنهج وامتحانات تجريبية مطابقة للثانوية العامة، بتصحيح فوري." side={<span className="sx-chip">{allQuizzes.length} امتحانات متوفرة</span>} />}
        {activeTab === 'exams' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzesError && <p role="alert">{quizzesError}</p>}
              {!quizzesError && allQuizzes.length === 0 && <p>لم ينشر المعلم امتحانات بعد.</p>}
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
        {activeTab === 'admin' && <PageBanner eyebrow="للمعلم والإدارة" title="لوحة تحكم المدرس" text="الطلاب والحضور والامتحانات والتصحيح والكورسات." />}
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
                  <button onClick={() => setShowAuthModal(true)} className="rounded-xl bg-emerald-600 px-6 py-3 text-white">تسجيل دخول المعلم</button>

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

      {/* 3. Site footer — same on every page */}
      <SiteFooter activeTab={activeTab} currentUser={currentUser} onNavigate={goTo} onOpenAuth={() => setShowAuthModal(true)} />

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
          onUserChanged={u => {
            setCurrentUser(u);
            // Signing in from the landing page takes the user into the platform.
            if (activeTab === 'home' && u.id !== 'guest') {
              goTo(u.role === 'teacher' || u.role === 'admin' ? 'admin' : 'videos');
            }
          }}
        />
      )}

    </div>
  );
}
