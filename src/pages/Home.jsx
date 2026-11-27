import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  motion, AnimatePresence, MotionConfig,
  useMotionValue, useSpring, useTransform, useReducedMotion,
} from 'framer-motion';
import {
  ArrowRight, Sparkles, MapPin, CalendarDays, CheckCircle2, BadgeCheck, ShieldCheck, Home as HomeIcon,
  Briefcase, Hospital, NotebookPen, Luggage, Flame, Building2, Smartphone, MessageCircle, Star,
  Handshake, Compass, CalendarCheck, IndianRupee, IdCard,
} from 'lucide-react';
import DisclaimerModal from '../components/DisclaimerModal';
import { useLanguage } from '../i18n/LanguageContext';
import { homeCopy } from '../i18n/homeCopy';
import useSEO from '../hooks/useSEO';
import '../styles/Home.css';

// Line icons for the tiles (the copy keeps its emoji as the key, so both languages share them).
const TILE_ICONS = { '💼': Briefcase, '🏥': Hospital, '📝': NotebookPen, '🧳': Luggage, '🪔': Flame, '🏙️': Building2, '📱': Smartphone, '💬': MessageCircle, '⭐': Star, '🛡️': ShieldCheck, '🏡': HomeIcon, '🤝': Handshake, '🧭': Compass, '🗓️': CalendarCheck, '₹': IndianRupee, '🪪': IdCard };
const TileIcon = ({ icon }) => { const Icon = TILE_ICONS[icon]; return Icon ? <Icon size={26} strokeWidth={1.75} /> : icon; };

const EASE = [0.22, 1, 0.36, 1];
const TILT_SPRING = { stiffness: 110, damping: 18, mass: 0.6 };

// ── Map data: rough lat/long → SVG coords (x = (lon-68)*14, y = (37-lat)*14) ──
const HUB = { x: 147, y: 274 }; // Hyderabad
const CITIES = [
  { n: 'Delhi', x: 129, y: 118, label: true },
  { n: 'Jaipur', x: 109, y: 141 },
  { n: 'Lucknow', x: 181, y: 143 },
  { n: 'Ahmedabad', x: 64, y: 196 },
  { n: 'Kolkata', x: 286, y: 202, label: true, end: true },
  { n: 'Mumbai', x: 69, y: 251, label: true, end: true },
  { n: 'Pune', x: 83, y: 259 },
  { n: 'Vijayawada', x: 176, y: 287 },
  { n: 'Bengaluru', x: 134, y: 336, label: true, end: true },
  { n: 'Chennai', x: 172, y: 335, label: true },
  { n: 'Kochi', x: 116, y: 379 },
];
const ARCS = ['Delhi', 'Kolkata', 'Mumbai', 'Bengaluru', 'Chennai', 'Vijayawada'].map((name) => {
  const a = CITIES.find((c) => c.n === name);
  const dx = HUB.x - a.x, dy = HUB.y - a.y;
  const cx = (a.x + HUB.x) / 2 + dy * 0.28;
  const cy = (a.y + HUB.y) / 2 - dx * 0.28;
  return `M${a.x} ${a.y} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${HUB.x} ${HUB.y}`;
});

const SOCIALS = [
  { href: 'https://twitter.com/festiveguest', label: 'X (Twitter)', d: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
  { href: 'https://instagram.com/_festiveguest', label: 'Instagram', d: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
  { href: 'https://youtube.com/@festiveguest', label: 'YouTube', d: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
];

const Reveal = ({ children, delay = 0, className }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.65, ease: EASE, delay }}
  >
    {children}
  </motion.div>
);

// Outgoing and incoming phrases share one grid cell so they cross-fade in
// place; the suffix ("?") rides along with each phrase instead of jumping.
const RotatingWord = ({ words, suffix }) => {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return undefined;
    const id = setInterval(() => setI((n) => (n + 1) % words.length), 2600);
    return () => clearInterval(id);
  }, [words, reduce]);

  return (
    <span className="hm-rot">
      <AnimatePresence initial={false}>
        <motion.span
          key={words[i]}
          className="hm-rot-word hm-gradient-text"
          initial={{ y: '0.6em', opacity: 0, filter: 'blur(8px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: '-0.6em', opacity: 0, filter: 'blur(8px)' }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          {words[i]}<span className="hm-rot-suffix">{suffix}</span>
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

const IndiaMap = () => (
  <svg viewBox="40 95 280 310">
    <defs>
      <linearGradient id="hm-arc-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#8b6cff" />
        <stop offset="100%" stopColor="#ffc163" />
      </linearGradient>
    </defs>
    {ARCS.map((d) => <path key={d} d={d} className="hm-map-arc" />)}
    {CITIES.map((c) => (
      <g key={c.n}>
        <circle cx={c.x} cy={c.y} r="2.6" className="hm-map-dot" />
        {c.label && (
          <text x={c.end ? c.x - 6 : c.x + 6} y={c.y + 3} textAnchor={c.end ? 'end' : 'start'} className="hm-map-label">{c.n}</text>
        )}
      </g>
    ))}
    <circle cx={HUB.x} cy={HUB.y} r="5" className="hm-map-pulse" />
    <circle cx={HUB.x} cy={HUB.y} r="4.5" className="hm-map-hub" />
    <text x={HUB.x + 9} y={HUB.y - 8} className="hm-map-label hm-map-label--hub">Hyderabad</text>
  </svg>
);

// Layered glass cards at different Z depths; the whole scene tilts with the
// pointer on desktop. It acts out the product: a trip post, a local host
// replying, a chat starting.
const HeroScene = ({ s, interactive }) => {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [17, 1]), TILT_SPRING);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-24, -2]), TILT_SPRING);

  useEffect(() => {
    if (!interactive) return undefined;
    const onMove = (e) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [interactive, mx, my]);

  const pop = (delay) => ({
    initial: { opacity: 0, y: 26, scale: 0.94 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { delay, duration: 0.75, ease: EASE },
  });

  return (
    <div className="hm-stage" aria-hidden="true">
      <div className="hm-scale">
        <motion.div className="hm-scene" style={{ rotateX, rotateY }}>
          <div className="hm-layer hm-layer--map">
            <motion.div className="hm-glass hm-map" {...pop(0.1)}><IndiaMap /></motion.div>
          </div>

          <div className="hm-layer hm-layer--ring"><div className="hm-ring" /></div>
          <div className="hm-layer hm-layer--orb2">
            <div className="hm-float hm-float--c"><div className="hm-orb hm-orb--violet" /></div>
          </div>

          <div className="hm-layer hm-layer--post">
            <div className="hm-float">
              <motion.div className="hm-glass hm-card" {...pop(0.35)}>
                <div className="hm-card-head">
                  <span className="hm-avatar hm-avatar--guest">{s.postName.charAt(0)}</span>
                  <div>
                    <div className="hm-name">{s.postName} <span className="hm-role">{s.postRole}</span></div>
                    <div className="hm-meta"><MapPin size={12} /> {s.postCity}</div>
                  </div>
                  <span className="hm-tag"><Briefcase size={11} aria-hidden="true" /> {s.postTag}</span>
                </div>
                <p className="hm-card-text">{s.postText}</p>
                <div className="hm-card-foot"><CalendarDays size={13} /> {s.postDates}</div>
              </motion.div>
            </div>
          </div>

          <div className="hm-layer hm-layer--reply">
            <div className="hm-float hm-float--b">
              <motion.div className="hm-glass hm-card" {...pop(1.05)}>
                <div className="hm-card-head">
                  <span className="hm-avatar hm-avatar--host">{s.replyName.charAt(0)}</span>
                  <div>
                    <div className="hm-name">{s.replyName} <BadgeCheck size={15} className="hm-verified" /></div>
                    <div className="hm-meta">{s.replyRole}</div>
                  </div>
                </div>
                <div className="hm-bubble">{s.replyText}</div>
              </motion.div>
            </div>
          </div>

          <div className="hm-layer hm-layer--badge">
            <div className="hm-float hm-float--c">
              <motion.div
                className="hm-badge"
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.75, type: 'spring', stiffness: 260, damping: 15 }}
              >
                <CheckCircle2 size={17} /> {s.badge}
              </motion.div>
            </div>
          </div>

          <div className="hm-layer hm-layer--orb1">
            <div className="hm-float hm-float--b"><div className="hm-orb" /></div>
          </div>
        </motion.div>
      </div>
      <span className="hm-scene-note">{s.example}</span>
    </div>
  );
};

const Home = ({ user }) => {
  useSEO({
    title: 'Find a Trusted Local Host Across India',
    description: 'A community network for interviews, hospital visits, job joining, exams, festivals, and life transitions. Connect with a trusted local host anywhere in India.',
  });
  const { language, t } = useLanguage();
  const c = homeCopy[language] || homeCopy.en;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const reduce = useReducedMotion();
  const [finePointer] = useState(() => window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  const [modalRole, setModalRole] = useState(null);
  const [howRole, setHowRole] = useState('guest');

  // The navbar's "Register" link lands here as /?register=true. Deriving the
  // modal from the URL (instead of copying it into state in an effect) means
  // re-clicking Register always reopens it once the param is cleared on close.
  // closeModal is only for dismissing — accepting navigates to /register on
  // its own, and calling this too would override that navigation.
  const paramRole = searchParams.get('register') === 'true' ? 'Guest' : null;
  const activeRole = modalRole || paramRole;
  const closeModal = () => {
    setModalRole(null);
    if (paramRole) {
      const next = new URLSearchParams(searchParams);
      next.delete('register');
      setSearchParams(next, { replace: true });
    }
  };

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) sessionStorage.setItem('pendingReferralCode', refCode.toUpperCase());
  }, [searchParams]);

  const steps = howRole === 'guest' ? c.guestSteps : c.hostSteps;
  const enter = (delay) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.7, ease: EASE },
  });

  return (
    <MotionConfig reducedMotion="user">
      <div className="hm">
        <div className="hm-aurora" aria-hidden="true">
          <span className="a1" /><span className="a2" /><span className="a3" /><span className="a4" />
        </div>

        <div className="hm-wrap">
          {/* ═════════ HERO ═════════ */}
          <section className="hm-hero">
            <div className="hm-stars" aria-hidden="true" />
            <div className="hm-container hm-hero-grid">
              <div className="hm-hero-copy">
                <motion.span className="hm-eyebrow hm-glass" {...enter(0.05)}>
                  <Sparkles size={14} /> {c.eyebrow}
                </motion.span>

                <motion.h1 className="hm-h1" {...enter(0.15)}>
                  <span className="hm-sr">{c.heroSrOnly}</span>
                  <span aria-hidden="true">
                    {c.heroPre && <span className="hm-h1-quiet">{c.heroPre}</span>}
                    <span className="hm-h1-rot-line">
                      <RotatingWord key={language} words={c.purposes} suffix={c.heroPost} />
                    </span>
                    <span className="hm-h1-line">{c.heroLine2}</span>
                  </span>
                </motion.h1>

                <motion.p className="hm-sub" {...enter(0.28)}>{c.heroSub}</motion.p>

                <motion.div className="hm-cta-row" {...enter(0.4)}>
                  {user ? (
                    <button className="hm-btn hm-btn-primary" onClick={() => navigate('/posts')}>
                      {t('goToPosts')} <ArrowRight size={18} />
                    </button>
                  ) : (
                    <>
                      <button className="hm-btn hm-btn-primary" onClick={() => setModalRole('Guest')}>
                        {c.ctaGuest} <ArrowRight size={18} />
                      </button>
                      <button className="hm-btn hm-btn-glass" onClick={() => setModalRole('Host')}>
                        <HomeIcon size={18} /> {c.ctaHost}
                      </button>
                    </>
                  )}
                </motion.div>
                {!user && (
                  <motion.div {...enter(0.46)}>
                    <Link to="/explore" className="hm-link hm-browse">{c.browseLink} <ArrowRight size={16} /></Link>
                  </motion.div>
                )}

                <motion.ul className="hm-trust" {...enter(0.52)}>
                  {c.trust.map((item) => (
                    <li key={item}><CheckCircle2 size={16} /> {item}</li>
                  ))}
                </motion.ul>
              </div>

              <HeroScene s={c.scene} interactive={finePointer && !reduce} />
            </div>
          </section>

          {/* ═════════ PURPOSES ═════════ */}
          <section className="hm-section">
            <div className="hm-container">
              <Reveal className="hm-head">
                <h2 className="hm-h2">{c.purposeTitle}</h2>
                <p className="hm-lead">{c.purposeSub}</p>
              </Reveal>
              <div className="hm-purpose-grid">
                {c.purposeCards.map((p, i) => (
                  <Reveal key={i} delay={(i % 3) * 0.08}>
                    <motion.article
                      className="hm-glass hm-pc"
                      style={{ transformPerspective: 900 }}
                      whileHover={finePointer ? { y: -8, rotateX: 7, rotateY: i % 2 ? 7 : -7 } : undefined}
                      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    >
                      <span className="hm-icon-tile" aria-hidden="true"><TileIcon icon={p.icon} /></span>
                      <h3>{p.title}</h3>
                      <p>{p.desc}</p>
                    </motion.article>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ═════════ HOW IT WORKS ═════════ */}
          <section className="hm-section">
            <div className="hm-container">
              <Reveal className="hm-head">
                <h2 className="hm-h2">{c.howTitle}</h2>
                <p className="hm-lead">{c.howSub}</p>
              </Reveal>
              <Reveal className="hm-seg-wrap">
                <div className="hm-seg hm-glass" role="tablist" aria-label={c.howTitle}>
                  {[['guest', c.roleGuest], ['host', c.roleHost]].map(([key, label]) => (
                    <button key={key} role="tab" aria-selected={howRole === key} onClick={() => setHowRole(key)}>
                      {howRole === key && (
                        <motion.span layoutId="hm-seg-pill" className="hm-seg-pill" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                      )}
                      {label}
                    </button>
                  ))}
                </div>
              </Reveal>
              <div className="hm-steps">
                <div className="hm-steps-line" aria-hidden="true" />
                <AnimatePresence mode="wait" initial={false}>
                  <motion.ol
                    key={howRole}
                    className="hm-steps-grid"
                    style={{ listStyle: 'none', margin: 0, padding: 0 }}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3, ease: EASE }}
                  >
                    {steps.map((st, i) => (
                      <li key={i} className="hm-glass hm-step">
                        <span className="hm-step-num" aria-hidden="true">{i + 1}</span>
                        <h3>{st.title}</h3>
                        <p>{st.desc}</p>
                      </li>
                    ))}
                  </motion.ol>
                </AnimatePresence>
              </div>
            </div>
          </section>

          {/* ═════════ WHY HOST ═════════ */}
          <section className="hm-section">
            <div className="hm-container">
              <Reveal className="hm-head">
                <h2 className="hm-h2">{c.hostWhyTitle}</h2>
                <p className="hm-lead">{c.hostWhySub}</p>
              </Reveal>
              <div className="hm-purpose-grid hm-why-grid">
                {c.hostWhy.map((p, i) => (
                  <Reveal key={i} delay={i * 0.08}>
                    <article className="hm-glass hm-pc">
                      <span className="hm-icon-tile" aria-hidden="true"><TileIcon icon={p.icon} /></span>
                      <h3>{p.title}</h3>
                      <p>{p.desc}</p>
                    </article>
                  </Reveal>
                ))}
              </div>
              {!user && (
                <Reveal className="hm-seg-wrap hm-why-cta">
                  <button className="hm-btn hm-btn-glass" onClick={() => setModalRole('Host')}>
                    <HomeIcon size={18} /> {c.hostWhyCta}
                  </button>
                </Reveal>
              )}
            </div>
          </section>

          {/* ═════════ SAFETY ═════════ */}
          <section className="hm-section">
            <div className="hm-container">
              <Reveal className="hm-glass hm-safety">
                <div className="hm-safety-intro">
                  <div className="hm-shield" aria-hidden="true"><ShieldCheck size={32} /></div>
                  <h2 className="hm-h2">{c.safetyTitle}</h2>
                  <p className="hm-lead">{c.safetySub}</p>
                  <Link to="/safety-guidelines" className="hm-link">{c.safetyLink} <ArrowRight size={16} /></Link>
                </div>
                <ul className="hm-safety-list">
                  {c.safety.map((item) => (
                    <li key={item.icon} className="hm-safety-item">
                      <span className="hm-icon-tile" aria-hidden="true"><TileIcon icon={item.icon} /></span>
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </section>

          {/* ═════════ STORIES ═════════ */}
          <section className="hm-section">
            <div className="hm-container">
              <Reveal className="hm-head">
                <h2 className="hm-h2">{c.storiesTitle}</h2>
                <p className="hm-lead">{c.storiesSub}</p>
              </Reveal>
              <div className="hm-stories">
                {[1, 2, 3, 4].map((n, i) => (
                  <Reveal key={n} delay={(i % 2) * 0.1}>
                    <figure className="hm-glass hm-story" style={{ margin: 0 }}>
                      <div className="hm-story-top"><span className="hm-story-mark" aria-hidden="true">“</span><span className="hm-story-tag">{c.storyTag}</span></div>
                      <blockquote style={{ margin: 0 }}>
                        <p>{t(`testimonial${n}`).replace(/^"|"$/g, '')}</p>
                      </blockquote>
                      <figcaption className="hm-story-author">— {t(`testimonial${n}Author`).replace(/^[-–—]\s*/, '')}</figcaption>
                    </figure>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ═════════ FINAL CTA ═════════ */}
          <section className="hm-section">
            <div className="hm-container">
              <Reveal className="hm-head">
                <h2 className="hm-h2">{c.finalTitle}</h2>
                {!user && <p className="hm-lead">{c.finalSub}</p>}
              </Reveal>
              {user ? (
                <Reveal className="hm-seg-wrap">
                  <button className="hm-btn hm-btn-primary" onClick={() => navigate('/posts')}>
                    {t('goToPosts')} <ArrowRight size={18} />
                  </button>
                </Reveal>
              ) : (
                <>
                  <div className="hm-final-grid">
                    <Reveal>
                      <button className="hm-glass hm-choice hm-choice--guest" onClick={() => setModalRole('Guest')}>
                        <span className="hm-icon-tile" aria-hidden="true"><TileIcon icon="🧳" /></span>
                        <span className="hm-choice-title">{c.finalGuestTitle}</span>
                        <span className="hm-choice-desc">{c.finalGuestDesc}</span>
                        <span className="hm-choice-go">{c.ctaGuest} <ArrowRight size={17} /></span>
                      </button>
                    </Reveal>
                    <Reveal delay={0.1}>
                      <button className="hm-glass hm-choice hm-choice--host" onClick={() => setModalRole('Host')}>
                        <span className="hm-icon-tile" aria-hidden="true"><TileIcon icon="🏡" /></span>
                        <span className="hm-choice-title">{c.finalHostTitle}</span>
                        <span className="hm-choice-desc">{c.finalHostDesc}</span>
                        <span className="hm-choice-go">{c.ctaHost} <ArrowRight size={17} /></span>
                      </button>
                    </Reveal>
                  </div>
                  <p className="hm-login">{c.loginPrompt}<Link to="/login">{c.loginLink}</Link></p>
                </>
              )}
            </div>
          </section>

          {/* ═════════ FOOTER ═════════ */}
          <footer className="hm-footer">
            <div className="hm-container">
              <div className="hm-footer-brand">🪔 FestiveGuest</div>
              <p className="hm-footer-tag">{c.footerTagline}</p>
              <nav className="hm-footer-links" aria-label="Footer">
                <Link to="/privacy-policy">{t('privacyPolicy')}</Link>
                <Link to="/terms-of-service">{t('termsOfService')}</Link>
                <Link to="/help">{t('helpSupport')}</Link>
                <Link to="/safety-guidelines">{t('safetyGuidelines')}</Link>
              </nav>
              <div className="hm-social">
                <span className="hm-social-label">{c.followUs}</span>
                {SOCIALS.map((so) => (
                  <a key={so.href} href={so.href} target="_blank" rel="noopener noreferrer" aria-label={so.label} title={so.label}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={so.d} /></svg>
                  </a>
                ))}
              </div>
              <p className="hm-copy">{c.copyright.replace('{year}', new Date().getFullYear())}</p>
            </div>
          </footer>
        </div>

        <DisclaimerModal isOpen={!!activeRole} onClose={closeModal} selectedRole={activeRole || ''} />
      </div>
    </MotionConfig>
  );
};

export default Home;
