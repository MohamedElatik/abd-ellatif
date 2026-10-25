/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DnaHeroScene } from './DnaHeroScene';
import { Play, Sparkles, BookOpen, Award, CheckCircle2, ArrowLeft } from 'lucide-react';
import { mockTeacher } from '../data/mockData';

interface HeroSectionProps {
  onStartLearning: () => void;
  onExploreVideos: () => void;
  onGoToTeacher: () => void;
  isDark: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartLearning,
  onExploreVideos,
  onGoToTeacher,
  isDark,
}) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 bg-gradient-to-b from-emerald-50/70 via-slate-50 to-white text-slate-900 border-b border-slate-200 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 dark:text-white dark:border-slate-800 transition-colors">
      {/* Background ambient biology gradients */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column (Content & Copywriting) */}
          <div className="lg:col-span-7 flex flex-col items-start text-right">
            
            {/* Subject Kicker */}
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-400 mb-4 bg-emerald-100/90 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/60 px-3.5 py-1.5 rounded-full shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>المنصة الرسمية لمادة الأحياء للثانوية العامة واللغات</span>
            </div>

            {/* Display Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-tight mb-6">
              طريقك نحو <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-600 via-teal-600 to-cyan-700 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400">الدرجة النهائية</span> في علم الأحياء
            </h1>

            {/* Sub-Headline Body Prose */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8 max-w-2xl">
              مع <span className="font-bold text-slate-900 dark:text-white">{mockTeacher.name}</span>، بسّطنا أعقد مفاهيم البيولوجيا الجزيئية والفسيولوجيا والتشريح بمجسمات تفاعلية ثلاثية الأبعاد وشروحات حصرية تواكب أعلى معايير أسئلة الفهم والتفكير الناقد.
            </p>

            {/* Key Value Props with subtle icon glyphs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 w-full max-w-xl text-sm text-slate-700 dark:text-slate-200">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>شريط DNA ثلاثي الأبعاد تفاعلي</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>كويزات إلكترونية وامتحانات شاملة</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>متابعة الغياب والحضور مع أولياء الأمور</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>ملازم PDF وتطبيقات رسومية لكل محاضرة</span>
              </div>
            </div>

            {/* CTA Buttons Row */}
            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
              <button
                onClick={onStartLearning}
                className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 transition-transform active:scale-95 whitespace-nowrap"
              >
                <span>ابدأ التعلم الآن</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreVideos}
                className="px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:hover:text-white font-medium border border-slate-300 dark:border-slate-700/80 rounded-xl flex items-center justify-center gap-2 transition-colors whitespace-nowrap shadow-xs"
              >
                <Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400" />
                <span>مشاهدة الدروس المجانية</span>
              </button>

              <button
                onClick={onGoToTeacher}
                className="px-4 py-3 text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 font-medium text-sm transition-colors whitespace-nowrap"
              >
                نبذة عن المدرس والشهادات ←
              </button>
            </div>
          </div>

          {/* Right Column (Interactive 3D DNA Helix - Replacing Ahmed El-Gohary's Brain) */}
          <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
            <div className="w-full rounded-2xl bg-white dark:bg-gradient-to-b dark:from-slate-900/90 dark:to-slate-950/90 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
              {/* Top Bar for 3D Visualizer */}
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">البيولوجيا الجزيئية: لولب DNA المزدوج</span>
                </div>
                <span className="text-[11px] text-slate-500">3D Interactive Helix</span>
              </div>

              {/* Three.js Canvas Scene */}
              <DnaHeroScene isDark={isDark} />
            </div>
          </div>
        </div>

        {/* Live Academic Proof Strip (Full-width 4-column strip below hero split) */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-2xl bg-white/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
          <div className="flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              +14,800
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              طالب مسجل بالمنصة
            </span>
          </div>

          <div className="flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-cyan-600 dark:text-cyan-400 tabular-nums">
              +180
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              ساعة شرح تفاعلي
            </span>
          </div>

          <div className="flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
              98.4%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              نسبة تفوق أوائل الثانوية
            </span>
          </div>

          <div className="flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              +450
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              كويز وامتحان شامل مصحح
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};
