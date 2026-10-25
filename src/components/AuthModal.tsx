/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, GradeLevel } from '../types';
import { registerOrUpdateStudent, saveStoredCurrentUser, defaultStudentUser, defaultTeacherUser } from '../utils/storage';
import { UserCheck, Shield, Phone, Mail, User as UserIcon, MapPin, GraduationCap, X, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  currentUser: User;
  onClose: () => void;
  onUserChanged: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  onClose,
  onUserChanged,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Form states
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [parentPhone, setParentPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [grade, setGrade] = useState<GradeLevel>('sec3');
  const [governorate, setGovernorate] = useState<string>('القاهرة');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 9) {
      setErrorMsg('يرجى إدخال رقم هاتف صحيح');
      return;
    }

    // Register or find student with this phone
    const student = registerOrUpdateStudent({
      name: name.trim() || 'طالب مسجل',
      phone: phone.trim(),
      parentPhone: parentPhone.trim() || '01000000000',
      email: email.trim() || undefined,
      grade,
      governorate,
      role: 'student',
      createdAt: new Date().toISOString().split('T')[0],
    });

    onUserChanged(student);
    setSuccessMsg('تم تسجيل الدخول بنجاح! مرحباً بك يا ' + student.name);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('يرجى إدخال اسم الطالب ثلاثي');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMsg('يرجى إدخال رقم هاتف الطالب المكون من 11 رقماً');
      return;
    }
    if (!parentPhone.trim() || parentPhone.trim().length < 10) {
      setErrorMsg('يرجى إدخال رقم هاتف ولي الأمر لمتابعة الدرجات والغياب');
      return;
    }

    const newStudent = registerOrUpdateStudent({
      name: name.trim(),
      phone: phone.trim(),
      parentPhone: parentPhone.trim(),
      email: email.trim() || undefined,
      grade,
      governorate,
      role: 'student',
      createdAt: new Date().toISOString().split('T')[0],
    });

    onUserChanged(newStudent);
    setSuccessMsg(`تم إنشاء حساب الطالب بنجاح! كود الطالب: ${newStudent.studentCode}`);
    setTimeout(() => {
      onClose();
    }, 1100);
  };

  const switchDemo = (user: User) => {
    saveStoredCurrentUser(user);
    onUserChanged(user);
    setSuccessMsg(`تم التبديل إلى حساب: ${user.name}`);
    setTimeout(() => {
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧬</span>
            <h2 className="text-base font-bold text-white">
              {authMode === 'login' ? 'تسجيل دخول الطالب' : 'تسجيل حساب طالب جديد'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-900/50">
          <button
            onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-3 text-xs font-bold transition-colors ${
              authMode === 'login'
                ? 'text-emerald-400 border-b-2 border-emerald-500 bg-slate-800/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            onClick={() => { setAuthMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-3 text-xs font-bold transition-colors ${
              authMode === 'register'
                ? 'text-emerald-400 border-b-2 border-emerald-500 bg-slate-800/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            إنشاء حساب طالب جديد
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  رقم هاتف الطالب أو كود الاشتراك:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="010XXXXXXXX"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full pl-3 pr-9 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  كلمة المرور / الرمز السري:
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                تسجيل الدخول للمنصة
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  اسم الطالب ثلاثي:
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="مثال: زياد حسام محمود"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    هاتف الطالب:
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="010XXXXXXXX"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    هاتف ولي الأمر:
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="01XXXXXXXXX"
                    value={parentPhone}
                    onChange={e => setParentPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    الصف الدراسي:
                  </label>
                  <select
                    value={grade}
                    onChange={e => setGrade(e.target.value as GradeLevel)}
                    className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="sec3">الصف الثالث الثانوي</option>
                    <option value="sec2">الصف الثاني الثانوي</option>
                    <option value="sec1">الصف الأول الثانوي</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    المحافظة:
                  </label>
                  <input
                    type="text"
                    placeholder="القاهرة، الإسكندرية..."
                    value={governorate}
                    onChange={e => setGovernorate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors mt-2"
              >
                تأكيد التسجيل وحفظ بيانات الطالب
              </button>
            </form>
          )}

          {/* Quick Demo Switchers */}
          <div className="pt-4 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block mb-2 text-center">
              حسابات تجريبية سريعة للفحص:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => switchDemo(defaultStudentUser)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>طالب: أحمد رضوان</span>
              </button>

              <button
                onClick={() => switchDemo(defaultTeacherUser)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>حساب المدرس / الأدمن</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
