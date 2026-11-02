import React, { useState } from 'react';
import type { User } from '../types';
import { LogIn, Menu, Moon, Sun, X } from 'lucide-react';
import './landing.css';

type Tab = 'home' | 'teacher' | 'videos' | 'exams' | 'admin' | 'account';

interface Props {
  currentUser: User;
  onOpenAuth: () => void;
  onNavigate: (tab: Tab) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

const IMG = '/landing';

const STUDENTS = [
  { src: 'stu1.jpg', name: 'اسم الطالب', alt: 'تكريم متفوقة في الأحياء' },
  { src: 'stu2.jpg', name: 'اسم الطالب', alt: 'تكريم متفوقة في الأحياء' },
  { src: 'stu3.jpg', name: 'اسم الطالب', alt: 'تكريم متفوق في الأحياء' },
  { src: 'stu4.jpg', name: 'اسم الطالب', alt: 'تكريم متفوق في الأحياء' },
  { src: 'stu5.jpg', name: 'اسم الطالب', alt: 'تكريم متفوق في الأحياء' },
  { src: 'stu6.jpg', name: 'مجموعة المتفوقين', alt: 'تكريم مجموعة من المتفوقين' },
];

export function LandingPage({ currentUser, onOpenAuth, onNavigate, isDark, onToggleTheme }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isGuest = currentUser.id === 'guest';
  const isStaff = currentUser.role === 'teacher' || currentUser.role === 'admin';

  // Guests get the login modal; signed-in users go straight into the platform.
  const login = () => {
    setMenuOpen(false);
    if (isGuest) onOpenAuth();
    else onNavigate(isStaff ? 'admin' : 'videos');
  };
  const loginLabel = isGuest ? 'تسجيل الدخول' : 'دخول المنصة';

  const go = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };
  const tab = (t: Tab) => { setMenuOpen(false); onNavigate(t); };

  const links: { label: string; run: () => void }[] = [
    { label: 'نبذة عن المنصة', run: () => go('lp-about') },
    { label: 'شروحات مرئية', run: () => go('lp-visual') },
    { label: 'المتفوقون', run: () => go('lp-students') },
    { label: 'الفيديوهات', run: () => tab('videos') },
    { label: 'الامتحانات', run: () => tab('exams') },
    ...(isStaff ? [{ label: 'لوحة المدرس', run: () => tab('admin') }] : []),
  ];

  return (
    <div className="lp">
      <header className="nav">
        <div className="wrap nav-in">
          <button className="brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="منصة الجمل — أعلى الصفحة">
            <img src={`${IMG}/logo.png`} alt="منصة عبد اللطيف الجمل — Biology" className="brand-logo" />
          </button>
          <nav className="nav-links" aria-label="التنقل الرئيسي">
            {links.map(l => <button key={l.label} onClick={l.run}>{l.label}</button>)}
          </nav>
          <div className="nav-actions" style={{ marginInlineStart: 'auto' }}>
            <button className="icon-btn" onClick={onToggleTheme} aria-label="تبديل وضع الإضاءة">
              {isDark ? <Sun /> : <Moon />}
            </button>
            {!isGuest && <button className="btn btn-ghost hide-sm" onClick={() => tab('account')}>حسابي</button>}
            <button className="btn btn-primary" onClick={login}>
              <LogIn style={{ width: 18, height: 18 }} />{loginLabel}
            </button>
            <button className="icon-btn menu-toggle" onClick={() => setMenuOpen(o => !o)} aria-label="القائمة" aria-expanded={menuOpen}>
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        <div className={`mobile-menu wrap${menuOpen ? ' open' : ''}`}>
          {links.map(l => <button key={l.label} onClick={l.run}>{l.label}</button>)}
          {!isGuest && <button onClick={() => tab('account')}>حسابي ودرجاتي</button>}
        </div>
      </header>

      <section className="hero">
        <svg className="dots" viewBox="0 0 800 600" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
          <g fill="var(--hero-dot)">
            {[[80,60,25],[200,120,-15],[340,50,10],[500,100,30],[650,60,-20],[740,150,15],[120,220,-25],[700,260,20],[60,360,10],[760,400,-15],[260,200,35],[560,230,-30]].map(([x,y,r],i) =>
              <ellipse key={i} cx={x} cy={y} rx="5" ry="9" transform={`rotate(${r} ${x} ${y})`} />)}
          </g>
        </svg>
        <div className="wrap">
          <span className="eyebrow">منصة الأستاذ</span>
          <h1>عبد اللطيف الجمل</h1>
          <p className="sub">منصة متخصصة في تدريس مادة الأحياء لطلاب الثانوية العامة</p>
          <div className="hero-cta">
            <button className="btn btn-gold" onClick={login}>{isGuest ? 'سجّل الآن' : 'دخول المنصة'}</button>
            <button className="btn btn-ghost" onClick={() => go('lp-about')}>تعرّف علينا</button>
          </div>
          <div className="photo">
            <span className="ring r1" aria-hidden="true" />
            <span className="ring r2" aria-hidden="true" />
            <img src={`${IMG}/teacher.png`} alt="الأستاذ عبد اللطيف الجمل" className="teacher-img" />
          </div>
        </div>
      </section>

      <section id="lp-about" className="block about">
        <div className="wrap about-in">
          <div className="about-media"><img src={`${IMG}/about.jpg`} alt="الأستاذ عبد اللطيف الجمل" loading="lazy" /></div>
          <div className="about-copy">
            <span className="eyebrow">من نحن</span>
            <h2>نبذة عن منصة أ/ عبد اللطيف الجمل</h2>
            <p>منصة تعليمية متخصصة في مادة الأحياء لطلاب الثانوية العامة، تقدّم شرحًا مبسّطًا ومنظّمًا يساعد كل طالب على فهم المنهج وتحقيق أعلى الدرجات بأسلوب حديث وممتع.</p>
            <div className="feats">
              <div className="feat"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></span><div><b>شرح مبسّط ومنظّم</b><span>دروس مصوّرة تغطّي المنهج كاملًا خطوة بخطوة.</span></div></div>
              <div className="feat"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></span><div><b>اختبارات وتقييم مستمر</b><span>بنك أسئلة وامتحانات بتصحيح فوري.</span></div></div>
              <div className="feat"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 7l10 5 10-5"/></svg></span><div><b>متابعة لكل طالب</b><span>تقارير توضّح مستوى الطالب وتطوّره أولًا بأول.</span></div></div>
            </div>
          </div>
        </div>
      </section>

      <section id="lp-visual" className="block">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">تعلّم بالمشاهدة</span>
            <h2><span className="u">شروحات مرئية متحركة</span></h2>
            <p>مقاطع توضيحية متحركة تبسّط أهم موضوعات الأحياء وتثبّت المعلومة.</p>
          </div>
          <div className="chain">
            <svg className="chain-lines" viewBox="0 0 460 412" fill="none" aria-hidden="true" preserveAspectRatio="none">
              <g stroke="var(--sky)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke">
                <path d="M150 104 V44 Q150 32 162 32 H226 Q238 32 238 44 V60" />
                <path d="M349 130 V152 Q349 164 361 164" />
                <path d="M238 346 H150 Q138 346 138 358 V372" />
              </g>
            </svg>
            <div className="c c-muscle"><img src={`${IMG}/edu3.gif`} alt="الجهاز العضلي في جسم الإنسان" loading="lazy" /></div>
            <div className="c c-seed"><img src={`${IMG}/edu1.gif`} alt="إنبات البذور ونمو النبات" loading="lazy" /></div>
            <div className="c c-dna"><img src={`${IMG}/dna.png`} alt="تركيب الحمض النووي DNA" loading="lazy" /></div>
            <div className="c c-fetus"><img src={`${IMG}/edu2.gif`} alt="مراحل النمو الجنيني للإنسان" loading="lazy" /></div>
          </div>
        </div>
      </section>

      <section id="lp-students" className="block students">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow" style={{ color: 'var(--gold)' }}>فخر المنصة</span>
            <h2>متفوقو الجمل في الأحياء</h2>
            <p>نفتخر بطلابنا المتميزين وإنجازاتهم.</p>
          </div>
          <div className="stu-grid">
            {STUDENTS.map(s => (
              <div className="stu" key={s.src}>
                <div className="pic"><img src={`${IMG}/${s.src}`} alt={s.alt} loading="lazy" /></div>
                <div className="cap"><b>{s.name}</b><span>من متفوقي الأحياء</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <div className="cta-box">
            <span className="eyebrow" style={{ color: 'var(--gold)' }}>ابدأ رحلتك التعليمية</span>
            <h2>جاهز تنضم إلى المنصة؟</h2>
            <p>سجّل دخولك الآن وابدأ أول درس. التفوق في الأحياء على بُعد ضغطة زر.</p>
            <button className="btn btn-gold cta-login" onClick={login}>
              <LogIn style={{ width: 20, height: 20 }} />{isGuest ? 'تسجيل الدخول إلى المنصة' : 'دخول المنصة'}
            </button>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap foot">
          <div>
            <img src={`${IMG}/logo.png`} alt="منصة عبد اللطيف الجمل — Biology" className="brand-logo" style={{ height: 64 }} />
            <p>منصة الأستاذ عبد اللطيف الجمل — متخصصة في تدريس الأحياء لطلاب الثانوية العامة بأسلوب حديث وممتع.</p>
          </div>
          <div><h4>روابط</h4><ul>
            <li><button onClick={() => go('lp-about')}>نبذة عن المنصة</button></li>
            <li><button onClick={() => go('lp-visual')}>شروحات مرئية</button></li>
            <li><button onClick={() => go('lp-students')}>المتفوقون</button></li>
          </ul></div>
          <div><h4>المنصة</h4><ul>
            <li><button onClick={login}>{loginLabel}</button></li>
            <li><button onClick={() => tab('videos')}>الفيديوهات والدروس</button></li>
            <li><button onClick={() => tab('exams')}>بنك الامتحانات</button></li>
          </ul></div>
        </div>
        <div className="copy">© {new Date().getFullYear()} منصة الأستاذ عبد اللطيف الجمل — جميع الحقوق محفوظة.</div>
      </footer>
    </div>
  );
}
