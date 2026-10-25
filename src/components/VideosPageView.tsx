/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Lecture, GradeLevel } from '../types';
import { mockLectures } from '../data/mockData';
import {
  Play,
  Clock,
  FileText,
  Search,
  CheckCircle,
  HelpCircle,
  X,
  FastForward,
  Download,
  BookOpen,
} from 'lucide-react';

interface VideosPageViewProps {
  onStartQuiz: (quizId: string) => void;
  selectedLectureId?: string;
  onClearSelectedLecture?: () => void;
}

export const VideosPageView: React.FC<VideosPageViewProps> = ({
  onStartQuiz,
  selectedLectureId,
  onClearSelectedLecture,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | 'all'>('sec3');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeVideo, setActiveVideo] = useState<Lecture | null>(() => {
    if (selectedLectureId) {
      return mockLectures.find(l => l.id === selectedLectureId) || mockLectures[0];
    }
    return null;
  });

  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, activeVideo]);

  const filteredLectures = mockLectures.filter(lec => {
    const matchesGrade = selectedGrade === 'all' || lec.grade === selectedGrade;
    const matchesSearch =
      searchQuery.trim() === '' ||
      lec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lec.unitTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGrade && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header / Intro matching Bassthalk video layout */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">
              مكتبة الفيديوهات والمحاضرات
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              شروحات وافية مقسمة حسب الوحدات، مع ملازم PDF مرفقة وكويزات قياس الفهم الفوري.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث عن درس أو فكرة..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-9 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-xs transition-colors"
            />
          </div>
        </div>

        {/* Grade Selector Tabs (Bassthalk style) */}
        <div className="flex items-center gap-2 overflow-x-auto p-1 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 w-fit shadow-xs">
          <button
            onClick={() => setSelectedGrade('sec3')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              selectedGrade === 'sec3'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            الصف الثالث الثانوي (الثانوية العامة)
          </button>
          <button
            onClick={() => setSelectedGrade('sec2')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              selectedGrade === 'sec2'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            الصف الثاني الثانوي
          </button>
          <button
            onClick={() => setSelectedGrade('sec1')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              selectedGrade === 'sec1'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            الصف الأول الثانوي
          </button>
          <button
            onClick={() => setSelectedGrade('all')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              selectedGrade === 'all'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            جميع الدروس
          </button>
        </div>

        {/* Video Player Modal/Theater (When a video is active) */}
        {activeVideo && (
          <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-emerald-500/40 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  {activeVideo.title}
                </h3>
              </div>
              <button
                onClick={() => {
                  setActiveVideo(null);
                  if (onClearSelectedLecture) onClearSelectedLecture();
                }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="إغلاق مشغل الفيديو"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Canvas Container */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-inner">
              <video
                ref={videoRef}
                src={activeVideo.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            {/* Playback Controls & Lesson Meta */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <FastForward className="w-4 h-4 text-emerald-400" />
                <span>سرعة الفيديو:</span>
                {[1, 1.25, 1.5, 2].map(sp => (
                  <button
                    key={sp}
                    onClick={() => setPlaybackSpeed(sp)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      playbackSpeed === sp
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {sp}x
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                {activeVideo.pdfAttachment && (
                  <button
                    onClick={() => alert('تم بدء تحميل ملزمة الشرح بصيغة PDF')}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>تحميل الملزمة ({activeVideo.pdfAttachment.size})</span>
                  </button>
                )}

                {activeVideo.associatedQuizId && (
                  <button
                    onClick={() => onStartQuiz(activeVideo.associatedQuizId!)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-emerald-200" />
                    <span>ابدأ كويز المحاضرة الفوري</span>
                  </button>
                )}
              </div>
            </div>

            {/* Chapter Timestamps */}
            {activeVideo.chapters && activeVideo.chapters.length > 0 && (
              <div className="pt-3 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-400 block mb-2">أقسام المحاضرة وفهرس الشرح:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {activeVideo.chapters.map((ch, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center justify-between"
                    >
                      <span className="text-slate-300 truncate">{ch.title}</span>
                      <span className="text-[11px] font-mono text-emerald-400 tabular-nums ml-1">{ch.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Video Grid (Bassthalk clean presentation cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLectures.map(lec => (
            <div
              key={lec.id}
              className="rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500/50 transition-all overflow-hidden flex flex-col group shadow-xs hover:shadow-lg"
            >
              {/* Thumbnail Container */}
              <div
                onClick={() => setActiveVideo(lec)}
                className="relative aspect-video bg-slate-100 dark:bg-slate-950 cursor-pointer overflow-hidden"
              >
                <img
                  src={lec.thumbnail}
                  alt={lec.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                  referrerPolicy="no-referrer"
                />

                {/* Duration Badge */}
                <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[11px] font-mono font-bold text-white flex items-center gap-1 tabular-nums">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span>{lec.videoDuration}</span>
                </div>

                {/* Free Preview Tag */}
                {lec.isFreePreview && (
                  <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded bg-emerald-600 text-[11px] font-bold text-white shadow">
                    معاينة مجانية
                  </div>
                )}

                {/* Hover Play Icon Overlay */}
                <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-white mr-0.5" />
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                    {lec.unitTitle}
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mb-2 leading-snug line-clamp-2">
                    {lec.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-4">
                    {lec.description}
                  </p>
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActiveVideo(lec)}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>مشاهدة الفيديو</span>
                  </button>

                  {lec.associatedQuizId && (
                    <button
                      onClick={() => onStartQuiz(lec.associatedQuizId!)}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                      title="حل كويز الدرس"
                    >
                      كويز الدرس
                    </button>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
