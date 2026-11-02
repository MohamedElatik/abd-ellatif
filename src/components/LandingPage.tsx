import React from 'react';
import type { User } from '../types';
import { LogIn } from 'lucide-react';
import './landing.css';

import type { Tab } from './SiteChrome';

interface Props {
  currentUser: User;
  onOpenAuth: () => void;
  onNavigate: (tab: Tab) => void;
}

const IMG = `${import.meta.env.BASE_URL}landing`;

const STUDENTS = [
  { src: 'stu1.jpg', name: 'اسم الطالب', alt: 'تكريم متفوقة في الأحياء' },
  { src: 'stu2.jpg', name: 'اسم الطالب', alt: 'تكريم متفوقة في الأحياء' },
  { src: 'stu3.jpg', name: 'اسم الطالب', alt: 'تكريم متفوق في الأحياء' },
  { src: 'stu4.jpg', name: 'اسم الطالب', alt: 'تكريم متفوق في الأحياء' },
  { src: 'stu5.jpg', name: 'اسم الطالب', alt: 'تكريم متفوق في الأحياء' },
  { src: 'stu6.jpg', name: 'مجموعة المتفوقين', alt: 'تكريم مجموعة من المتفوقين' },
];

export function LandingPage({ currentUser, onOpenAuth, onNavigate }: Props) {
  const isGuest = currentUser.id === 'guest';
  const isStaff = currentUser.role === 'teacher' || currentUser.role === 'admin';

  // Guests get the login modal; signed-in users go straight into the platform.
  const login = () => {
    if (isGuest) onOpenAuth();
    else onNavigate(isStaff ? 'admin' : 'videos');
  };
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="lp">
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

    </div>
  );
}
