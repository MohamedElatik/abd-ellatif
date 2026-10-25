/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mockTeacher } from '../data/mockData';
import { Phone, Mail, MapPin } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: 'home' | 'teacher' | 'videos' | 'exams' | 'admin') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-slate-950 text-slate-400 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧬</span>
              <span className="text-base font-bold text-white">
                BioMaster | {mockTeacher.name}
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-md text-xs sm:text-sm">
              المنصة التعليمية المتخصصة في تدريس مادة الأحياء للثانوية العامة واللغات. نجمع بين أحدث تقنيات المحاكاة ثلاثية الأبعاد وشريط DNA التفاعلي، ونظام متابعة مستمر مع أولياء الأمور لتأهيل الطلاب لأعلى الدرجات.
            </p>
          </div>

          {/* Quick Navigation Links */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-sm mb-3">أقسام المنصة</h4>
            <div>
              <button onClick={() => onNavigate('home')} className="hover:text-emerald-400 transition-colors">
                الصفحة الرئيسية
              </button>
            </div>
            <div>
              <button onClick={() => onNavigate('teacher')} className="hover:text-emerald-400 transition-colors">
                صفحة المدرس والكورسات
              </button>
            </div>
            <div>
              <button onClick={() => onNavigate('videos')} className="hover:text-emerald-400 transition-colors">
                مكتبة الفيديوهات والمحاضرات
              </button>
            </div>
            <div>
              <button onClick={() => onNavigate('exams')} className="hover:text-emerald-400 transition-colors">
                بنك الامتحانات الشاملة
              </button>
            </div>
            <div>
              <button onClick={() => onNavigate('admin')} className="hover:text-emerald-400 transition-colors">
                لوحة تحكم المعلم والغياب
              </button>
            </div>
          </div>

          {/* Contact & Support */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-sm mb-3">الدعم والمتابعة</h4>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>خدمة الطلاب: {mockTeacher.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <span>{mockTeacher.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>متاح لجميع محافظات جمهورية مصر العربية</span>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} BioMaster التعليمية. جميع الحقوق محفوظة لـ {mockTeacher.name}.
          </div>
          <div className="flex items-center gap-4">
            <span>مستوحى من معايير بسطتهالك وأحمد الجوهري التعليمية</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
