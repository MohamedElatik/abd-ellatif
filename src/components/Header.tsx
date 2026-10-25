/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User } from '../types';
import { Sun, Moon, LogIn, UserCheck, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: 'home' | 'teacher' | 'videos' | 'exams' | 'admin';
  setActiveTab: (tab: 'home' | 'teacher' | 'videos' | 'exams' | 'admin') => void;
  currentUser: User;
  onOpenAuth: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  isDark,
  onToggleTheme,
}) => {
  const isAdminOrTeacher = currentUser.role === 'teacher' || currentUser.role === 'admin';

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
      {/* Teacher/Admin Mode Status Banner */}
      {isAdminOrTeacher && (
        <div className="bg-emerald-600 text-white text-[11px] font-semibold py-1 px-4 flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>وضع المعلم والأدمن مفعل ({currentUser.name})</span>
            </span>
            <span className="text-[10px] text-emerald-100 bg-emerald-700/60 px-2 py-0.5 rounded">
              لوحة التحكم متاحة فقط لحسابك
            </span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 text-right whitespace-nowrap shrink-0 group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-900/20">
            🧬
          </div>
          <div className="flex flex-col text-right">
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              BioMaster
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400/90 font-medium">
              د. محمد الأحمدي
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => setActiveTab('home')}
            className={`transition-colors whitespace-nowrap hover:text-emerald-600 dark:hover:text-emerald-400 ${
              activeTab === 'home' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''
            }`}
          >
            الرئيسية
          </button>

          <button
            onClick={() => setActiveTab('teacher')}
            className={`transition-colors whitespace-nowrap hover:text-emerald-600 dark:hover:text-emerald-400 ${
              activeTab === 'teacher' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''
            }`}
          >
            صفحة المدرس
          </button>

          <button
            onClick={() => setActiveTab('videos')}
            className={`transition-colors whitespace-nowrap hover:text-emerald-600 dark:hover:text-emerald-400 ${
              activeTab === 'videos' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''
            }`}
          >
            الفيديوهات والدروس
          </button>

          <button
            onClick={() => setActiveTab('exams')}
            className={`transition-colors whitespace-nowrap hover:text-emerald-600 dark:hover:text-emerald-400 ${
              activeTab === 'exams' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''
            }`}
          >
            بنك الامتحانات والكويزات
          </button>

          {/* Admin Control Panel - Visible ONLY to Admin / Teacher */}
          {isAdminOrTeacher && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 transition-colors whitespace-nowrap px-3 py-1 rounded-lg border ${
                activeTab === 'admin'
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                  : 'border-emerald-300 dark:border-emerald-800/80 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>لوحة تحكم المدرس</span>
            </button>
          )}
        </nav>

        {/* Zone 3: 1 Primary Action + Theme Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            title={isDark ? 'التبديل إلى الوضع الفاتح (Light Mode)' : 'التبديل إلى الوضع الليلي (Dark Mode)'}
            aria-label="تبديل وضع الإضاءة"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* Student Profile / Login Button */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm shadow-emerald-900/30 transition-colors whitespace-nowrap shrink-0"
          >
            {currentUser.role === 'teacher' ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-100" />
                <span>حساب المعلم</span>
              </>
            ) : currentUser.name ? (
              <>
                <UserCheck className="w-4 h-4 text-emerald-100" />
                <span className="max-w-[120px] truncate">{currentUser.name}</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>تسجيل الدخول</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 border-t border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('home')}
          className={`px-2 py-1 whitespace-nowrap ${activeTab === 'home' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}
        >
          الرئيسية
        </button>
        <button
          onClick={() => setActiveTab('teacher')}
          className={`px-2 py-1 whitespace-nowrap ${activeTab === 'teacher' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}
        >
          المدرس
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`px-2 py-1 whitespace-nowrap ${activeTab === 'videos' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}
        >
          الفيديوهات
        </button>
        <button
          onClick={() => setActiveTab('exams')}
          className={`px-2 py-1 whitespace-nowrap ${activeTab === 'exams' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}
        >
          الامتحانات
        </button>
        {isAdminOrTeacher && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-2 py-1 whitespace-nowrap ${activeTab === 'admin' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-emerald-600/80 dark:text-emerald-400/80'}`}
          >
            لوحة المدرس
          </button>
        )}
      </div>
    </header>
  );
};
