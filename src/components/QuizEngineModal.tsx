/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Quiz, Question, User, ExamAttempt } from '../types';
import { calculateExamScore } from '../utils/rules';
import { saveQuizAttempt } from '../utils/storage';
import confetti from 'canvas-confetti';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Award,
  ChevronRight,
  ChevronLeft,
  X,
  RotateCcw,
  BookOpen,
} from 'lucide-react';

interface QuizEngineModalProps {
  quiz: Quiz;
  currentUser: User;
  onClose: () => void;
}

export const QuizEngineModal: React.FC<QuizEngineModalProps> = ({
  quiz,
  currentUser,
  onClose,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(quiz.timeLimitMinutes * 60);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [result, setResult] = useState<ReturnType<typeof calculateExamScore> | null>(null);

  // Timer effect
  useEffect(() => {
    if (isSubmitted) return;

    const timer = setInterval(() => {
      setTimeRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted]);

  const handleSelectOption = (questionId: string, option: string) => {
    if (isSubmitted) return;
    setAnswers(prev => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleEssayChange = (questionId: string, text: string) => {
    if (isSubmitted) return;
    setAnswers(prev => ({
      ...prev,
      [questionId]: text,
    }));
  };

  const handleSubmitExam = () => {
    const calc = calculateExamScore(answers, quiz.questions);
    setResult(calc);
    setIsSubmitted(true);

    if (calc.isPassed) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }

    // Record attempt
    const attempt: ExamAttempt = {
      id: 'att_' + Date.now(),
      quizId: quiz.id,
      quizTitle: quiz.title,
      studentId: currentUser.id || 'std_guest',
      studentName: currentUser.name || 'طالب زائر',
      studentPhone: currentUser.phone || '01000000000',
      grade: quiz.grade,
      score: calc.score,
      totalPoints: calc.totalPoints,
      percentage: calc.percentage,
      isPassed: calc.isPassed,
      completedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      answers,
    };
    saveQuizAttempt(attempt);
  };

  const currentQ = quiz.questions[currentQuestionIndex];

  // Format time mm:ss
  const minutes = Math.floor(timeRemainingSeconds / 60);
  const seconds = timeRemainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                quiz.isComprehensiveExam
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {quiz.isComprehensiveExam ? 'امتحان شامل' : 'كويز درس'}
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">
                {quiz.title}
              </h2>
            </div>
            <span className="text-xs text-slate-400 mt-0.5 block">{quiz.unitTitle}</span>
          </div>

          <div className="flex items-center gap-4">
            {!isSubmitted && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold tabular-nums border ${
                timeRemainingSeconds < 300
                  ? 'bg-rose-950/80 text-rose-300 border-rose-800 animate-pulse'
                  : 'bg-slate-800 text-emerald-400 border-slate-700'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{formattedTime}</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!isSubmitted ? (
            <>
              {/* Question Navigator Dots */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
                {quiz.questions.map((q, idx) => {
                  const isAnswered = answers[q.id] && answers[q.id].trim() !== '';
                  const isCurrent = idx === currentQuestionIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center justify-center ${
                        isCurrent
                          ? 'ring-2 ring-emerald-400 bg-emerald-600 text-white'
                          : isAnswered
                          ? 'bg-slate-700 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Current Question View */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>السؤال {currentQuestionIndex + 1} من {quiz.questions.length}</span>
                  <span className="font-semibold text-emerald-400">({currentQ.points} درجات)</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-sm sm:text-base font-bold text-white leading-relaxed">
                  {currentQ.prompt}
                </div>

                {/* Biological Diagram if available */}
                {currentQ.diagramUrl && (
                  <div className="rounded-xl overflow-hidden border border-slate-700 max-h-56 bg-slate-950 flex items-center justify-center">
                    <img
                      src={currentQ.diagramUrl}
                      alt="رسم توضيحي للسؤال"
                      className="max-h-56 object-contain"
                    />
                  </div>
                )}

                {/* Answer Options: MCQ or Essay */}
                {currentQ.type === 'mcq' && currentQ.options ? (
                  <div className="space-y-2.5">
                    {currentQ.options.map((opt, oIdx) => {
                      const isSelected = answers[currentQ.id] === opt;
                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleSelectOption(currentQ.id, opt)}
                          className={`w-full p-3.5 rounded-xl text-right text-xs sm:text-sm font-semibold transition-all border flex items-center justify-between ${
                            isSelected
                              ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 shadow-md'
                              : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <span>{opt}</span>
                          <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
                            isSelected
                              ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                              : 'border-slate-600'
                          }`}>
                            {isSelected ? '✓' : String.fromCharCode(65 + oIdx)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400">
                      اكتب إجابتك المقالية بالتفصيل والتعليل العلمي:
                    </label>
                    <textarea
                      rows={5}
                      value={answers[currentQ.id] || ''}
                      onChange={e => handleEssayChange(currentQ.id, e.target.value)}
                      placeholder="اكتب إجابتك هنا..."
                      className="w-full p-3.5 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Navigation & Submit Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>

                {currentQuestionIndex < quiz.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1 transition-colors"
                  >
                    <span>التالي</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitExam}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white shadow-lg shadow-emerald-900/50 flex items-center gap-1.5 transition-transform active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>إنهاء وتسليم الامتحان</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Result Screen */
            result && (
              <div className="space-y-6">
                
                {/* Score Hero Banner */}
                <div className={`p-6 rounded-2xl border text-center flex flex-col items-center justify-center ${
                  result.isPassed
                    ? 'bg-gradient-to-b from-emerald-950/60 to-slate-900 border-emerald-500/50'
                    : 'bg-gradient-to-b from-rose-950/60 to-slate-900 border-rose-500/50'
                }`}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 bg-slate-800 shadow-inner">
                    {result.isPassed ? (
                      <Award className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-8 h-8 text-rose-400" />
                    )}
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-white mb-1">
                    {result.isPassed ? 'مبارك! اجتزت الاختبار بنجاح' : 'لم توفق هذه المرة، راجع أخطاءك'}
                  </h3>

                  <p className="text-xs text-slate-300 mb-4">
                    {result.isPassed
                      ? 'أداء متميز في استيعاب مفاهيم علم الأحياء والتفكير العلمي.'
                      : 'راجع التفسيرات العلمية أدناه وأعد المحاولة لترسيخ المفاهيم.'}
                  </p>

                  <div className="flex items-center gap-6 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                    <div>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums">
                        {result.percentage}%
                      </div>
                      <div className="text-[11px] text-slate-400">النسبة المئوية</div>
                    </div>
                    <div className="w-px h-8 bg-slate-800" />
                    <div>
                      <div className="text-2xl sm:text-3xl font-black text-white tabular-nums">
                        {result.score} / {result.totalPoints}
                      </div>
                      <div className="text-[11px] text-slate-400">الدرجة الكلية</div>
                    </div>
                    <div className="w-px h-8 bg-slate-800" />
                    <div>
                      <div className="text-2xl sm:text-3xl font-black text-cyan-400 tabular-nums">
                        {result.correctCount}
                      </div>
                      <div className="text-[11px] text-slate-400">إجابات صحيحة</div>
                    </div>
                  </div>
                </div>

                {/* Detailed Correction Review */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span>التصحيح النموذجي والتفسير العلمي للأسئلة</span>
                  </h4>

                  {quiz.questions.map((q, idx) => {
                    const studentAns = answers[q.id];
                    const isCorrect = q.type === 'mcq'
                      ? studentAns === q.correctAnswer
                      : (studentAns && studentAns.trim().length >= 10);

                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-xl border space-y-2 text-xs sm:text-sm ${
                          isCorrect
                            ? 'bg-emerald-950/20 border-emerald-800/50'
                            : 'bg-rose-950/20 border-rose-800/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">س {idx + 1}: {q.prompt}</span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            isCorrect ? 'text-emerald-400 bg-emerald-950' : 'text-rose-400 bg-rose-950'
                          }`}>
                            {isCorrect ? 'إجابة صحيحة' : 'بحاجة لمراجعة'}
                          </span>
                        </div>

                        {q.type === 'mcq' ? (
                          <div className="space-y-1 text-xs">
                            <div className="text-slate-300">
                              إجابتك: <span className={isCorrect ? 'text-emerald-300 font-semibold' : 'text-rose-300 font-semibold'}>{studentAns || 'لم تتم الإجابة'}</span>
                            </div>
                            {!isCorrect && (
                              <div className="text-emerald-400 font-semibold">
                                الإجابة الصحيحة: {q.correctAnswer}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1 text-xs">
                            <div className="text-slate-300">
                              إجابتك: {studentAns || 'لم تتم الإجابة'}
                            </div>
                          </div>
                        )}

                        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                          <span className="font-bold text-cyan-400 block mb-0.5">التفسير العلمي:</span>
                          {q.explanation}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Retake or Close */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setAnswers({});
                      setTimeRemainingSeconds(quiz.timeLimitMinutes * 60);
                      setCurrentQuestionIndex(0);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>إعادة الاختبار</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    إغلاق و العودة للمنصة
                  </button>
                </div>
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
};
