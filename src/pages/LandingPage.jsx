import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import { useRef } from 'react';
import DisclaimerModal from '../components/DisclaimerModal';
import { useLanguage } from '../i18n/LanguageContext';
const HeroScene3D = lazy(() => import('../components/HeroScene3D'));
import {
  MapPin, Users, Home, Star, Shield, MessageCircle,
  ArrowRight, Sparkles, Globe, Heart, Zap, CheckCircle
} from 'lucide-react';

// ── 3D card tilt (mouse-following, desktop only) ──
const useMotionEffectsEnabled = () => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setEnabled(!coarse && !reduced);
  }, []);
  return enabled;
};

const TiltCard3D = ({ children, className, style, intensity = 11, ...rest }) => {
  const motionEnabled = useMotionEffectsEnabled();
  const ref = useRef(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const sX = useSpring(rotX, { stiffness: 280, damping: 24 });
  const sY = useSpring(rotY, { stiffness: 280, damping: 24 });
  const [glarePos, setGlarePos] = useState({ x: 50, y: 0 });
  const [hovered, setHovered] = useState(false);

  if (!motionEnabled) {
    return (
      <div ref={ref} className={className} style={style} {...rest}>
        {children}
      </div>
    );
  }

  const onMove = (e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const cx = (e.clientX - r.left) / r.width - 0.5;
    const cy = (e.clientY - r.top)  / r.height - 0.5;
    rotY.set(cx * intensity * 2);
    rotX.set(-cy * intensity);
    setGlarePos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };
  const onLeave = () => { rotX.set(0); rotY.set(0); setHovered(false); };
  const onEnter = () => setHovered(true);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ ...style, rotateX: sX, rotateY: sY, transformStyle: 'preserve-3d', position: 'relative' }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onMouseEnter={onEnter}
      {...rest}
    >
      {children}
      {/* Light glare */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none', zIndex: 10,
        background: hovered
          ? `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.13) 0%, transparent 60%)`
          : 'none',
        transition: 'opacity 0.2s',
      }} />
    </motion.div>
  );
};

// ── Animation helpers ──
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};
const stagger = (delay = 0) => ({
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut', delay } },
});
const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
};

const AnimSection = ({ children, className = '', style = {} }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px', amount: 0.12 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
};

// ── Stat counter ──
const StatCard = ({ num, label, delay }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      className="stat-item"
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.45 }}
    >
      <div className="stat-number">{num}</div>
      <div className="stat-label">{label}</div>
    </motion.div>
  );
};

// ── Features 3D coverflow carousel ──
const FeaturesCarousel = ({ features }) => {
  const [active, setActive] = useState(0);
  const stageRef = useRef(null);
  const [stageW, setStageW] = useState(800);
  const n = features.length;

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => setStageW(el.getBoundingClientRect().width);
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const narrow = stageW < 560;
  const CARD_W = narrow ? 240 : 280;

  // Circular offset: shortest path around the ring
  const getOffset = (i) => {
    let off = ((i - active) % n + n) % n;
    if (off > n / 2) off -= n;
    return off;
  };

  // 3D slot config per offset distance
  const getSlot = (offset) => {
    if (offset === 0) return { x: 0,   ry: 0,   s: 1,    o: 1,    z: 5 };
    const a = Math.abs(offset), sign = Math.sign(offset);
    if (a === 1) return { x: sign * (narrow ? 158 : 230), ry: sign * 42, s: 0.82, o: 0.82, z: 4 };
    if (a === 2) return { x: sign * (narrow ? 262 : 390), ry: sign * 56, s: 0.63, o: 0.42, z: 3 };
    return   { x: sign * (narrow ? 340 : 520), ry: sign * 68, s: 0.48, o: 0,    z: 0 };
  };

  const prev = () => setActive(p => (p - 1 + n) % n);
  const next = () => setActive(p => (p + 1) % n);

  const handleDragEnd = (_, { offset: { x }, velocity: { x: vx } }) => {
    if (x < -60 || vx < -400) next();
    else if (x > 60 || vx > 400) prev();
  };

  return (
    <div style={{ position: 'relative', padding: '0 16px' }}>
      {/* 3D stage — also the drag target */}
      <motion.div
        ref={stageRef}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0}
        onDragEnd={handleDragEnd}
        style={{ position: 'relative', height: narrow ? '300px' : '350px', overflow: 'hidden', cursor: 'grab' }}
      >
        {features.map((f, i) => {
          const offset = getOffset(i);
          const { x, ry, s, o, z } = getSlot(offset);
          const isCenter = offset === 0;
          return (
            <motion.div
              key={i}
              initial={{ x, rotateY: ry, scale: s, opacity: o }}
              animate={{ x, rotateY: ry, scale: s, opacity: o }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              onClick={() => !isCenter && Math.abs(offset) <= 2 && setActive(i)}
              style={{
                position: 'absolute', inset: 0, margin: 'auto',
                width: CARD_W, height: 'fit-content',
                zIndex: z, transformPerspective: 1200,
                background: isCenter
                  ? '#FFFAF6'
                  : 'linear-gradient(145deg,#FFFAF6 0%,#FFF3E8 100%)',
                borderRadius: '1.375rem', padding: '1.75rem',
                border: `1.5px solid ${isCenter ? 'rgba(255,107,53,0.4)' : 'rgba(200,120,60,0.12)'}`,
                boxShadow: isCenter
                  ? '0 28px 64px rgba(255,107,53,0.24), 0 6px 20px rgba(0,0,0,0.1)'
                  : '0 4px 16px rgba(0,0,0,0.07)',
                cursor: isCenter ? 'grab' : Math.abs(offset) <= 2 ? 'pointer' : 'default',
                textAlign: 'left',
                pointerEvents: Math.abs(offset) > 2 ? 'none' : 'auto',
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: '0.875rem', background: f.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.6rem', marginBottom: '1rem',
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text)' }}>
                {f.title}
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-light)', lineHeight: 1.6, margin: 0 }}>
                {f.desc}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Dot strip */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
        {features.map((_, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            width: i === active ? 28 : 8, height: 8, borderRadius: 4,
            background: i === active ? 'var(--primary)' : 'rgba(0,0,0,0.18)',
            border: 'none', padding: 0, cursor: 'pointer',
            transition: 'width 0.3s ease, background 0.3s ease',
          }} />
        ))}
      </div>
    </div>
  );
};

const LandingPage = ({ user }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    if (searchParams.get('register') === 'true') handleRoleSelection('Guest');
  }, [searchParams]);

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) sessionStorage.setItem('pendingReferralCode', refCode.toUpperCase());
  }, [searchParams]);

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
    setShowDisclaimerModal(true);
  };

  return (
    <div className="landing-page">

      {/* ══════════════ HERO ══════════════ */}
      <section className="hero">
        {/* 3D WebGL background — lazy loaded, transparent over CSS gradient */}
        <Suspense fallback={null}>
          <HeroScene3D />
        </Suspense>

        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '2rem', padding: '0.4rem 1rem',
              fontSize: '0.82rem', color: 'rgba(255,255,255,0.92)',
              marginBottom: '1.5rem', fontWeight: 600
            }}
          >
            <Sparkles size={14} /> {t('heroBadge')}
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {t('connectWithLocalHosts')}
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {t('experienceAuthentic')}
          </motion.p>

          <motion.div
            className="hero-buttons"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {!user ? (
              <>
                <motion.button
                  className="btn"
                  onClick={() => handleRoleSelection('Guest')}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    background: 'white', color: 'var(--primary)',
                    fontWeight: 700, padding: '0.875rem 2rem',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
                  }}
                >
                  {t('joinAsGuest')} <ArrowRight size={17} />
                </motion.button>
                <motion.button
                  className="btn btn-ghost"
                  onClick={() => handleRoleSelection('Host')}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  style={{ padding: '0.875rem 2rem', fontWeight: 600 }}
                >
                  {t('joinAsHost')}
                </motion.button>
              </>
            ) : (
              <motion.button
                className="btn"
                onClick={() => navigate('/posts')}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                style={{ background: 'white', color: 'var(--primary)', fontWeight: 700, padding: '0.875rem 2rem' }}
              >
                {t('goToPosts')} <ArrowRight size={17} />
              </motion.button>
            )}
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}
          >
            {[t('trustVerifiedHosts'), t('trustSafeSecure'), t('trustFreeJoin')].map((item, i) => (
              <span key={i} style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{item}</span>
            ))}
          </motion.div>
        </motion.div>

        {/* Floating card */}
        <motion.div
          className="hero-image"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.7, ease: 'easeOut' }}
          style={{ marginTop: '3rem' }}
        >
          <TiltCard3D
            className="festival-card"
            intensity={8}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <h3>🌟 {t('travelConnect')}</h3>
            <p>{t('stayWithLocals')}</p>
            <br />
            <p>{t('heroCardPoint1')}</p>
            <p>{t('heroCardPoint2')}</p>
            <p>{t('heroCardPoint3')}</p>
            <p>{t('heroCardPoint4')}</p>
          </TiltCard3D>
        </motion.div>
      </section>

      {/* ══════════════ STATS ══════════════ */}
      <div className="stats-bar">
        <div className="stats-bar-inner">
          <StatCard num={t('statStatesNum')} label={t('statStatesLabel')} delay={0} />
          <StatCard num={t('statHostsNum')} label={t('statHostsLabel')} delay={0.1} />
          <StatCard num={t('statGuestsNum')} label={t('statGuestsLabel')} delay={0.2} />
          <StatCard num={t('statRatingNum')} label={t('statRatingLabel')} delay={0.3} />
        </div>
      </div>

      {/* ══════════════ FEATURES ══════════════ */}
      <section className="features" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Floating depth blobs — visible on white background */}
        <motion.div aria-hidden="true" style={{
          position: 'absolute', width: 650, height: 650, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,53,0.07) 0%, transparent 70%)',
          top: -180, right: -120, pointerEvents: 'none', zIndex: 0, filter: 'blur(70px)',
        }} animate={{ y: [0, -45, 0], x: [0, 20, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div aria-hidden="true" style={{
          position: 'absolute', width: 450, height: 450, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,179,71,0.08) 0%, transparent 70%)',
          bottom: 60, left: -100, pointerEvents: 'none', zIndex: 0, filter: 'blur(55px)',
        }} animate={{ y: [0, 35, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }} />
        <motion.div aria-hidden="true" style={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,140,94,0.06) 0%, transparent 70%)',
          top: '40%', left: '50%', pointerEvents: 'none', zIndex: 0, filter: 'blur(45px)',
        }} animate={{ y: [0, -25, 0], x: [0, -20, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />

        <AnimSection>
          {/* pill badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              background: 'var(--primary-subtle)',
              color: 'var(--primary-dark)',
              border: '1px solid rgba(255,107,53,0.2)',
              borderRadius: '2rem',
              padding: '0.3rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              {t('whyChoosePill')}
            </span>
          </div>

          {/* split headline — accent word on separate line */}
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', lineHeight: 1.15, marginBottom: '0.75rem' }}>
            {t('whyChooseHeadlinePre')}
            <span style={{
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {t('whyChooseHeadlineHighlight')}
            </span>
            {t('whyChooseHeadlinePost')}
          </h2>

          <p className="section-subtitle">
            {t('whyChooseSubtitle')}
          </p>
        </AnimSection>
        <div style={{ margin: '0 -2rem' }}>
          <FeaturesCarousel features={[
            { icon: '🏷️', title: t('purposeBasedStays'),    desc: t('purposeBasedStaysDesc'),    accent: 'linear-gradient(135deg,#FF6B35,#FFB347)' },
            { icon: '🆕', title: t('firstTimeIndicator'),   desc: t('firstTimeIndicatorDesc'),   accent: 'linear-gradient(135deg,#4F8EF7,#7BB8FF)' },
            { icon: '🤝', title: t('hostComfortPrefs'),     desc: t('hostComfortPrefsDesc'),     accent: 'linear-gradient(135deg,#8B5CF6,#A78BFA)' },
            { icon: '🗣️', title: t('languageComfort'),      desc: t('languageComfortDesc'),      accent: 'linear-gradient(135deg,#06B6D4,#38BDF8)' },
            { icon: '🚨', title: t('emergencyStays'),       desc: t('emergencyStaysDesc'),       accent: 'linear-gradient(135deg,#F43F5E,#FB7185)' },
            { icon: '🍽️', title: t('authenticCuisine'),    desc: t('authenticCuisineDesc'),     accent: 'linear-gradient(135deg,#F59E0B,#FCD34D)' },
          ]} />
        </div>
      </section>

      {/* ══════════════ TRAVEL TYPES ══════════════ */}
      <section className="testimonials">
        <AnimSection>
          <h2>{t('perfectForTitle')}</h2>
          <p className="section-subtitle">{t('perfectForSubtitle')}</p>
        </AnimSection>
        <div className="travel-types-grid">
          {[
            { icon: '💼', title: t('businessWork'), desc: t('businessWorkDesc') },
            { icon: '🏥', title: t('adventureLeisure'), desc: t('adventureLeisureDesc') },
            { icon: '🎉', title: t('festivalsEvents'), desc: t('festivalsEventsDesc') },
            { icon: '🎓', title: t('educationResearch'), desc: t('educationResearchDesc') },
            { icon: '📊', title: t('familyVisits'), desc: t('familyVisitsDesc') },
            { icon: '⚡', title: t('culturalExchange'), desc: t('culturalExchangeDesc') },
          ].map((item, i) => {
            const ref = useRef(null);
            const inView = useInView(ref, { once: true, margin: '-60px' });
            return (
              <motion.div
                key={i} ref={ref}
                className="travel-card"
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                whileHover={{
                  y: -14,
                  rotateX: 8,
                  rotateY: i % 2 === 0 ? -12 : 12,
                  scale: 1.04,
                  boxShadow: '0 32px 56px rgba(0,0,0,0.16), 0 8px 20px rgba(255,107,53,0.14)',
                  transition: { duration: 0.28 }
                }}
                style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
              >
                <div className="feature-icon-wrap">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ══════════════ WHO IS THIS FOR ══════════════ */}
      <section className="features">
        <AnimSection>
          <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'left' }}>
            <h2 style={{ textAlign: 'center' }}>{t('whoIsThisForTitle')}</h2>
            <p style={{ textAlign: 'center', fontSize: '1.05rem', marginBottom: '2rem', color: 'var(--text-light)' }}>
              {t('whoIsThisForBody')}
            </p>
            <p style={{ fontSize: '1.05rem', marginBottom: '1rem', fontWeight: 600 }}>{t('whoIsThisForIntro')}</p>
            <ul style={{ fontSize: '1rem', lineHeight: 2, marginBottom: '1.5rem', paddingLeft: '1.5rem' }}>
              {[1, 2, 3, 4].map(n => (
                <li key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', listStyle: 'none', marginLeft: '-1rem' }}>
                  <CheckCircle size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                  <span>{t(`whoIsThisForPoint${n}`)}</span>
                </li>
              ))}
            </ul>
            <p style={{ fontSize: '1.05rem', fontStyle: 'italic', textAlign: 'center', color: 'var(--primary)', fontWeight: 600 }}>
              {t('whoIsThisForClosing')}
            </p>
          </div>
        </AnimSection>
      </section>

      {/* ══════════════ HOW IT WORKS ══════════════ */}
      <section className="how-it-works">
        <AnimSection>
          <h2>{t('howItWorksTitle')}</h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 0 }}>{t('howItWorksSubtitle')}</p>
        </AnimSection>
        <div className="steps">
          {[
            { num: '1', title: t('howItWorksStep1'), desc: t('howItWorksStep1Desc') },
            { num: '2', title: t('howItWorksStep2'), desc: t('howItWorksStep2Desc') },
            { num: '3', title: t('howItWorksStep3'), desc: t('howItWorksStep3Desc') },
          ].map((step, i) => {
            const ref = useRef(null);
            const inView = useInView(ref, { once: true });
            return (
              <motion.div
                key={i} ref={ref} className="step"
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              >
                <div className="step-number">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ══════════════ TESTIMONIALS ══════════════ */}
      <section className="testimonials" style={{ position: 'relative', overflow: 'hidden' }}>
        <motion.div aria-hidden="true" style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,53,0.08) 0%, transparent 70%)',
          top: -100, left: -80, pointerEvents: 'none', zIndex: 0, filter: 'blur(60px)',
        }} animate={{ y: [0, -30, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
        <AnimSection>
          <h2>{t('testimonialsTitle')}</h2>
          <p className="section-subtitle">{t('testimonialsSubtitle')}</p>
        </AnimSection>
        <div className="testimonials-compact-grid">
          {[1, 2, 3, 4].map((n, i) => {
            const ref = useRef(null);
            const inView = useInView(ref, { once: true, margin: '-40px' });
            return (
              <motion.div
                key={n} ref={ref}
                className="testimonial-compact"
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1, duration: 0.45 }}
                whileHover={{
                  y: -14,
                  rotateX: 8,
                  rotateY: i % 2 === 0 ? -12 : 12,
                  scale: 1.04,
                  boxShadow: '0 32px 56px rgba(0,0,0,0.16), 0 8px 20px rgba(255,107,53,0.14)',
                  transition: { duration: 0.28 }
                }}
                style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
              >
                <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{"⭐".repeat(5)}</div>
                <p style={{ margin: 0, color: 'var(--text)' }}>{t(`testimonial${n}`)}</p>
                <div className="testimonial-author">— {t(`testimonial${n}Author`)}</div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ══════════════ REAL LIFE STORY ══════════════ */}
      <section className="how-it-works">
        <AnimSection>
          <h2>{t('realLifeStoryTitle')}</h2>
          <div style={{ maxWidth: 680, margin: '1.5rem auto 0', textAlign: 'center' }}>
            {[1, 2, 3].map(n => (
              <p key={n} style={{ fontSize: '1.05rem', lineHeight: 1.8, marginBottom: '1rem', color: 'rgba(255,255,255,0.88)', fontWeight: n === 3 ? 600 : 400 }}>
                {t(`realLifeStoryPara${n}`)}
              </p>
            ))}
            <p style={{ fontSize: '1.1rem', fontStyle: 'italic', marginTop: '1.5rem', fontWeight: 600, color: 'var(--accent)' }}>
              {t('realLifeStoryClosing')}
            </p>
          </div>
        </AnimSection>
      </section>

      {/* ══════════════ SAFETY & TRUST ══════════════ */}
      <section className="features" style={{ position: 'relative', overflow: 'hidden' }}>
        <motion.div aria-hidden="true" style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,179,71,0.07) 0%, transparent 70%)',
          bottom: -100, right: -120, pointerEvents: 'none', zIndex: 0, filter: 'blur(65px)',
        }} animate={{ y: [0, 40, 0], x: [0, -20, 0] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
        <AnimSection>
          <h2>{t('safetyTrustTitle')}</h2>
          <p className="section-subtitle">{t('safetyTrustSubtitle')}</p>
        </AnimSection>
        <div className="safety-grid">
          {[
            { icon: '📝', title: t('shareYourPlans'), desc: t('shareYourPlansDesc') },
            { icon: '⭐', title: t('meetPublicFirst'), desc: t('meetPublicFirstDesc') },
            { icon: '💬', title: t('videoCallBefore'), desc: t('videoCallBeforeDesc') },
            { icon: '🤝', title: t('keepEmergencyContacts'), desc: t('keepEmergencyContactsDesc') },
            { icon: '✅', title: t('trustInstincts'), desc: t('trustInstinctsDesc') },
            { icon: '🔒', title: t('securePayment'), desc: t('securePaymentDesc') },
          ].map((item, i) => {
            const ref = useRef(null);
            const inView = useInView(ref, { once: true, margin: '-50px' });
            return (
              <motion.div
                key={i} ref={ref} className="safety-card"
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                whileHover={{
                  y: -14,
                  rotateX: 8,
                  rotateY: i % 2 === 0 ? -12 : 12,
                  scale: 1.04,
                  boxShadow: '0 32px 56px rgba(0,0,0,0.16), 0 8px 20px rgba(255,107,53,0.14)',
                  transition: { duration: 0.28 }
                }}
                style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
              >
                <div className="feature-icon-wrap">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
        <AnimSection style={{ marginTop: '2.5rem' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', padding: '1.5rem 2rem', background: 'var(--primary-subtle)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '1rem', lineHeight: 1.8, fontStyle: 'italic', color: 'var(--text)', margin: 0 }}>
              {t('dignityStatement')}
            </p>
          </div>
        </AnimSection>
      </section>

      {/* ══════════════ HOST BENEFITS ══════════════ */}
      <section className="how-it-works">
        <AnimSection>
          <h2>{t('hostBenefitsTitle')}</h2>
        </AnimSection>
        <div className="steps">
          {[
            { icon: '🤝', title: t('earnIncome'), desc: t('earnIncomeDesc') },
            { icon: '🧭', title: t('meetPeople'), desc: t('meetPeopleDesc') },
            { icon: '🌐', title: t('shareCulture'), desc: t('shareCultureDesc') },
          ].map((step, i) => {
            const ref = useRef(null);
            const inView = useInView(ref, { once: true });
            return (
              <motion.div
                key={i} ref={ref} className="step"
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              >
                <div className="step-number">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ══════════════ HOST ELIGIBILITY ══════════════ */}
      <section className="features">
        <AnimSection>
          <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'left' }}>
            <h2 style={{ textAlign: 'center' }}>{t('hostEligibilityTitle')}</h2>
            <p style={{ textAlign: 'center', fontSize: '1.05rem', marginBottom: '2rem', color: 'var(--text-light)' }}>
              {t('hostEligibilityIntro')}
            </p>
            <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>{t('hostEligibilitySubtitle')}</p>
            <ul style={{ lineHeight: 2, paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
              {[1, 2, 3].map(n => (
                <li key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', listStyle: 'none', marginLeft: '-1rem' }}>
                  <CheckCircle size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
                  <span>{t(`hostEligibilityPoint${n}`)}</span>
                </li>
              ))}
            </ul>
            <div style={{ textAlign: 'center' }}>
              <p style={{ lineHeight: 1.8 }}>{t('hostEligibilityClosing1')}</p>
              <p style={{ lineHeight: 1.8 }}>{t('hostEligibilityClosing2')}</p>
              <p style={{ lineHeight: 1.8, fontWeight: 600, color: 'var(--primary)' }}>{t('hostEligibilityClosing3')}</p>
            </div>
          </div>
        </AnimSection>
      </section>

      {/* ══════════════ HOW HOSTS EARN ══════════════ */}
      <section className="how-it-works">
        <AnimSection>
          <h2>{t('howHostsEarnTitle')}</h2>
          <div style={{ maxWidth: 680, margin: '1.5rem auto 0', textAlign: 'center' }}>
            {[1, 2, 3, 4, 5].map(n => (
              <p key={n} style={{ fontSize: '1.05rem', lineHeight: 1.8, marginBottom: '1rem', color: 'rgba(255,255,255,0.88)' }}>
                {t(`howHostsEarnPara${n}`)}
              </p>
            ))}
            <p style={{ fontSize: '1.1rem', fontStyle: 'italic', fontWeight: 600, color: 'var(--accent)' }}>
              {t('howHostsEarnClosing')}
            </p>
          </div>
        </AnimSection>
      </section>

      {/* ══════════════ CTA ══════════════ */}
      <section className="cta">
        <AnimSection>
          <h2>{t('ctaTitle')}</h2>
          <p>{t('ctaSubtitle')}</p>
          <p style={{ fontSize: '1.05rem', fontStyle: 'italic', opacity: 0.85 }}>{t('ctaIntentText')}</p>
          <div className="cta-buttons">
            {!user ? (
              <>
                <motion.button
                  className="btn"
                  onClick={() => handleRoleSelection('Guest')}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  style={{ background: 'white', color: 'var(--primary)', fontWeight: 700, padding: '0.875rem 2rem' }}
                >
                  {t('findHomeNewCity')} <ArrowRight size={17} />
                </motion.button>
                <motion.button
                  className="btn btn-ghost"
                  onClick={() => navigate('/login')}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  style={{ padding: '0.875rem 2rem' }}
                >
                  {t('alreadyHaveAccount')}
                </motion.button>
              </>
            ) : (
              <motion.button
                className="btn"
                onClick={() => navigate('/posts')}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                style={{ background: 'white', color: 'var(--primary)', fontWeight: 700, padding: '0.875rem 2rem' }}
              >
                {t('goToPosts')} <ArrowRight size={17} />
              </motion.button>
            )}
          </div>
        </AnimSection>
      </section>

      {/* ══════════════ MOBILE APPS ══════════════ */}
      <section className="features">
        <AnimSection>
          <h2>{t('mobileAppsTitle')}</h2>
          <p className="section-subtitle">{t('mobileAppsSubtitle')}</p>
        </AnimSection>
        <div className="mobile-apps-grid">
          <div className="mobile-app-card">
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🍎</div>
            <h3>{t('iosAppTitle')}</h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>{t('iosAppDesc')}</p>
            <button className="btn btn-outline" disabled style={{ opacity: 0.5, cursor: 'not-allowed', marginTop: '0.75rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
              {t('appStoreBtn')}
            </button>
          </div>
          <div className="mobile-app-card">
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🤖</div>
            <h3>{t('androidAppTitle')}</h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>{t('androidAppDesc')}</p>
            <button className="btn btn-outline" disabled style={{ opacity: 0.5, cursor: 'not-allowed', marginTop: '0.75rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
              {t('googlePlayBtn')}
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="footer">
        <div className="container">
          <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🎉</div>
          <p style={{ fontWeight: 600, fontSize: '1.1rem', color: 'white', margin: '0 0 0.25rem' }}>Festive Guest</p>
          <p style={{ fontSize: '0.875rem', margin: '0 0 1.5rem' }}>{t('footerTagline')}</p>
          <div className="footer-links">
            <Link to="/privacy-policy">{t('privacyPolicy')}</Link>
            <Link to="/terms-of-service">{t('termsOfService')}</Link>
            <Link to="/help">{t('helpSupport')}</Link>
            <Link to="/safety-guidelines">{t('safetyGuidelines')}</Link>
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1.25rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{t('footerFollowUs')}</span>
            <a href="https://twitter.com/festiveguest" target="_blank" rel="noopener noreferrer" title="X (Twitter)" style={{ display: 'flex' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://instagram.com/_festiveguest" target="_blank" rel="noopener noreferrer" title="Instagram" style={{ display: 'flex' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <a href="https://youtube.com/@festiveguest" target="_blank" rel="noopener noreferrer" title="YouTube" style={{ display: 'flex' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
          </div>
          <p style={{ marginTop: '2rem', fontSize: '0.8rem', opacity: 0.5 }}>{t('footerCopyright')}</p>
        </div>
      </footer>

      <DisclaimerModal
        isOpen={showDisclaimerModal}
        onClose={() => setShowDisclaimerModal(false)}
        selectedRole={selectedRole}
      />
    </div>
  );
};

export default LandingPage;
