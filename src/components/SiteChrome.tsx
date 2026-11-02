import React, { useState } from 'react';
import type { User } from '../types';
import { LogIn, Menu, Moon, Sun, X, ShieldCheck } from 'lucide-react';
import { signOut } from '../utils/auth';
import { useAvatar, initialOf } from '../utils/profile';
import './site.css';

export type Tab = 'home' | 'videos' | 'exams' | 'admin' | 'account' | 'attendance' | 'courses';
export const LOGO = `${import.meta.env.BASE_URL}landing/logo.png`;

/** Scrolls to a landing-page section, switching to the home tab first when needed. */
function useSectionNav(activeTab: Tab, onNavigate: (t: Tab) => void) {
  return (id: string) => {
    const scroll = () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    if (activeTab === 'home') scroll();
    else { onNavigate('home'); setTimeout(scroll, 120); }
  };
}

export function Avatar({ user, size = 44 }: { user: User; size?: number }) {
  const { avatar } = useAvatar(user.id);
  return (
    <span className="sx-av" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {avatar ? <img src={avatar} alt="" /> : initialOf(user.name)}
    </span>
  );
}

interface HeaderProps {
  activeTab: Tab;
  currentUser: User;
  onNavigate: (t: Tab) => void;
  onOpenAuth: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function SiteHeader({ activeTab, currentUser, onNavigate, onOpenAuth, isDark, onToggleTheme }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const isGuest = currentUser.id === 'guest';
  const isStaff = currentUser.role === 'teacher' || currentUser.role === 'admin';
  const isSecretary = currentUser.role === 'secretary';
  const section = useSectionNav(activeTab, onNavigate);
  const go = (t: Tab) => { setOpen(false); onNavigate(t); };
  const myPage: Tab = isSecretary ? 'attendance' : 'account';

  const links: { label: string; tab?: Tab; section?: string }[] = [
    { label: 'الرئيسية', tab: 'home' },
    { label: 'الفيديوهات', tab: 'videos' },
    { label: 'الامتحانات', tab: 'exams' },
    { label: 'المتفوقون', section: 'lp-students' },
    ...(isStaff ? [{ label: 'لوحة المدرس', tab: 'admin' as Tab }] : []),
    ...(isSecretary || isStaff ? [{ label: 'إدارة الكورسات', tab: 'courses' as Tab }] : []),
    ...(isSecretary || isStaff ? [{ label: 'تسجيل الغياب', tab: 'attendance' as Tab }] : []),
  ];
  const renderLinks = () => links.map(l => (
    <button key={l.label} className="sx-link" aria-current={l.tab && l.tab === activeTab ? 'page' : undefined}
      onClick={() => { setOpen(false); l.tab ? onNavigate(l.tab) : section(l.section!); }}>
      {l.label}
    </button>
  ));

  return (
    <header className="sx-header">
      {isSecretary && <div className="sx-staff">وضع السكرتير — تسجيل الحضور والغياب بالكود ({currentUser.name})</div>}
      {isStaff && <div className="sx-staff"><ShieldCheck style={{ width: 14, height: 14, display: 'inline', verticalAlign: '-2px' }} /> وضع المعلم مفعّل — {currentUser.name}</div>}
      <div className="sx-wrap sx-nav">
        <button className="sx-brand" onClick={() => go('home')} aria-label="الصفحة الرئيسية">
          <img src={LOGO} alt="منصة عبد اللطيف الجمل — Biology" />
        </button>
        <nav className="sx-links" aria-label="التنقل الرئيسي">{renderLinks()}</nav>
        <div className="sx-actions">
          <button className="sx-icon-btn" onClick={onToggleTheme} aria-label={isDark ? 'الوضع الفاتح' : 'الوضع الليلي'}>
            {isDark ? <Sun /> : <Moon />}
          </button>
          {isGuest ? (
            <button className="sx-btn sx-btn-primary" onClick={onOpenAuth}><LogIn />تسجيل الدخول</button>
          ) : (
            <button className="sx-avatar-btn" onClick={() => go(myPage)} aria-label={`${isSecretary ? 'تسجيل الغياب' : 'لوحتي'} — ${currentUser.name}`} title={isSecretary ? 'تسجيل الغياب' : 'لوحتي ودرجاتي'}>
              <Avatar user={currentUser} size={42} />
              <span className="sx-dot" aria-hidden="true" />
            </button>
          )}
          <button className="sx-icon-btn sx-menu-toggle" onClick={() => setOpen(o => !o)} aria-label="القائمة" aria-expanded={open}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      <div className={`sx-wrap sx-mobile${open ? ' open' : ''}`}>
        {renderLinks()}
        {!isGuest && !isSecretary && <button className="sx-link" onClick={() => go('account')}>لوحتي ودرجاتي</button>}
        {!isGuest && <button className="sx-link" onClick={() => { setOpen(false); void signOut(); }}>تسجيل الخروج</button>}
      </div>
    </header>
  );
}

export function PageBanner({ eyebrow, title, text, side }: { eyebrow: string; title: string; text?: string; side?: React.ReactNode }) {
  return (
    <section className="sx-banner">
      <div className="sx-wrap">
        <div>
          <span className="sx-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          {text && <p>{text}</p>}
        </div>
        {side && <div className="sx-banner-side">{side}</div>}
      </div>
    </section>
  );
}

export function SiteFooter({ activeTab, currentUser, onNavigate, onOpenAuth }: { activeTab: Tab; currentUser: User; onNavigate: (t: Tab) => void; onOpenAuth: () => void }) {
  const section = useSectionNav(activeTab, onNavigate);
  const isGuest = currentUser.id === 'guest';
  const isSecretary = currentUser.role === 'secretary';
  return (
    <footer className="sx-footer">
      <div className="sx-wrap">
        <div className="sx-foot-cta">
          <div>
            <h3>{isGuest ? 'ابدأ رحلتك مع الأحياء الآن' : `أهلًا ${currentUser.name.split(' ')[0]} 👋`}</h3>
            <p>{isGuest ? 'سجّل دخولك وتابع دروسك وامتحاناتك من مكان واحد.' : isSecretary ? 'سجّل حضور الطلاب بالكود من صفحة الغياب.' : 'كمّل دروسك وتابع درجاتك من لوحتك.'}</p>
          </div>
          {isGuest
            ? <button className="sx-btn sx-btn-gold" onClick={onOpenAuth}><LogIn />تسجيل الدخول</button>
            : isSecretary
              ? <button className="sx-btn sx-btn-gold" onClick={() => onNavigate('attendance')}>تسجيل الغياب</button>
              : <button className="sx-btn sx-btn-gold" onClick={() => onNavigate('account')}>لوحتي ودرجاتي</button>}
        </div>
        <div className="sx-foot">
          <div>
            <img src={LOGO} alt="منصة عبد اللطيف الجمل — Biology" />
            <p>منصة الأستاذ عبد اللطيف الجمل — متخصصة في تدريس الأحياء لطلاب الثانوية العامة بأسلوب حديث وممتع.</p>
          </div>
          <div><h4>المنصة</h4><ul>
            <li><button onClick={() => onNavigate('home')}>الرئيسية</button></li>
            <li><button onClick={() => onNavigate('videos')}>الفيديوهات والدروس</button></li>
            <li><button onClick={() => onNavigate('exams')}>بنك الامتحانات</button></li>
          </ul></div>
          <div><h4>اكتشف</h4><ul>
            <li><button onClick={() => section('lp-about')}>نبذة عن المنصة</button></li>
            <li><button onClick={() => section('lp-visual')}>شروحات مرئية</button></li>
            <li><button onClick={() => section('lp-students')}>المتفوقون</button></li>
          </ul></div>
        </div>
        <div className="sx-copy">© {new Date().getFullYear()} منصة الأستاذ عبد اللطيف الجمل — جميع الحقوق محفوظة.</div>
      </div>
    </footer>
  );
}
