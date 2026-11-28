import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { X, ShieldAlert, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import '../styles/JoinModal.css';

const EASE = [0.22, 1, 0.36, 1];

// The legal wording itself comes from translations.js (t(key)) and is shown in
// full; the short titles here only make the list scannable.
const POINTS = [
  { key: 'notResponsible', icon: '🛡️' },
  { key: 'noGuarantee', icon: '🤝' },
  { key: 'platformOnly', icon: '🔎' },
  { key: 'ownRisk', icon: '🧭' },
  { key: 'paymentCaution', icon: '💳' },
  { key: 'meetPublic', icon: '☕' },
  { key: 'fullResponsibility', icon: '✅' },
];

const COPY = {
  en: {
    title: 'Important Disclaimer',
    subtitle: 'Please read carefully — this is how FestiveGuest works.',
    pointTitles: [
      "We're not liable for incidents",
      'No guaranteed match',
      "Members aren't background-checked",
      'Your own discretion',
      'Be careful with money',
      'Meet in public first',
      'Your safety is your call',
    ],
    hint: 'Tick the consent box to continue',
    ready: "You're all set",
    close: 'Close',
  },
  te: {
    title: 'ముఖ్యమైన నిరాకరణ',
    subtitle: 'దయచేసి జాగ్రత్తగా చదవండి — ఫెస్టివ్ గెస్ట్ ఇలా పనిచేస్తుంది.',
    pointTitles: [
      'ఘటనలకు మేము బాధ్యులం కాదు',
      'సరిపోయే వ్యక్తి దొరుకుతారని హామీ లేదు',
      'సభ్యుల నేపథ్యాన్ని మేము తనిఖీ చేయము',
      'మీ స్వంత నిర్ణయం',
      'డబ్బు విషయంలో జాగ్రత్త',
      'ముందు బహిరంగ ప్రదేశంలో కలవండి',
      'మీ భద్రత మీ బాధ్యత',
    ],
    hint: 'కొనసాగడానికి అంగీకార పెట్టెను టిక్ చేయండి',
    ready: 'అంతా సిద్ధం',
    close: 'మూసివేయండి',
  },
};

const JoinSheet = ({ initialRole, onClose }) => {
  const { language, t } = useLanguage();
  const c = COPY[language] || COPY.en;
  const navigate = useNavigate();
  // The role only pre-selects the sign-up form's own "I want to join as" picker; the disclaimer is the same for both.
  const role = initialRole;
  const [agreed, setAgreed] = useState(false);
  const [isSheet] = useState(() => window.matchMedia('(max-width: 600px)').matches);
  const sheetRef = useRef(null);
  const checkRef = useRef(null);

  // The consent box sits after the full disclaimer, usually below the fold;
  // the footer hint takes the user straight to it.
  const goToConsent = () => {
    checkRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    checkRef.current?.focus({ preventScroll: true });
  };

  // Lock page scroll and make the page behind inert (no tabbing or screen
  // reader focus behind the dialog); remember focus so it returns on close.
  useEffect(() => {
    const { body, documentElement: html } = document;
    const appRoot = document.getElementById('root');
    const prevFocus = document.activeElement;
    const prev = { overflow: body.style.overflow, paddingRight: body.style.paddingRight, htmlOverflow: html.style.overflow };
    const scrollbar = window.innerWidth - html.clientWidth;
    body.style.overflow = 'hidden';
    body.style.paddingRight = `${scrollbar}px`;
    html.style.overflow = 'hidden';
    appRoot?.setAttribute('inert', '');
    // iOS ignores overflow:hidden for touch scrolling.
    const blockTouch = (e) => { if (!e.target.closest('.jm-body')) e.preventDefault(); };
    document.addEventListener('touchmove', blockTouch, { passive: false });
    sheetRef.current?.focus();
    return () => {
      body.style.overflow = prev.overflow;
      body.style.paddingRight = prev.paddingRight;
      html.style.overflow = prev.htmlOverflow;
      appRoot?.removeAttribute('inert');
      document.removeEventListener('touchmove', blockTouch);
      if (prevFocus instanceof HTMLElement && prevFocus.isConnected) prevFocus.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Navigate only — don't also call onClose. The page unmounts on the route
  // change anyway, and onClose updates the URL itself, which would override
  // this navigation and leave the user on the home page.
  const accept = () => {
    if (!agreed) return;
    const timestamp = Date.now();
    sessionStorage.setItem('disclaimerAcceptance', JSON.stringify({
      accepted: true,
      timestamp,
      role,
      userAgent: navigator.userAgent,
      sessionId: crypto.randomUUID(),
    }));
    navigate(`/register?role=${role}&disclaimerAccepted=${timestamp}`);
  };

  const sheetMotion = isSheet
    ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' }, transition: { duration: 0.45, ease: EASE } }
    : {
        initial: { opacity: 0, y: 48, scale: 0.94, rotateX: 12 },
        animate: { opacity: 1, y: 0, scale: 1, rotateX: 0 },
        exit: { opacity: 0, y: 24, scale: 0.97 },
        transition: { duration: 0.5, ease: EASE },
      };

  return (
    <motion.div
      className="jm-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        ref={sheetRef}
        className="jm-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="jm-title"
        tabIndex={-1}
        {...sheetMotion}
      >
        <div className="jm-glow" aria-hidden="true" />
        <div className="jm-handle" aria-hidden="true" />

        <header className="jm-head">
          <div className="jm-title-row">
            <span className="jm-badge-icon" aria-hidden="true"><ShieldAlert size={26} /></span>
            <div>
              <h2 id="jm-title" className="jm-title">{c.title}</h2>
              <p className="jm-sub">{c.subtitle}</p>
            </div>
            <button type="button" className="jm-close" onClick={onClose} aria-label={c.close}>
              <X size={19} />
            </button>
          </div>
        </header>

        <div className="jm-body">
          <p className="jm-intro"><strong>FestiveGuest</strong> {t('disclaimerIntro')}</p>

          <ul className="jm-points">
            {POINTS.map((p, i) => (
              <motion.li
                key={p.key}
                className="jm-point"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05, duration: 0.4, ease: EASE }}
              >
                <span className="jm-point-icon" aria-hidden="true">{p.icon}</span>
                <div>
                  <h3>{c.pointTitles[i]}</h3>
                  <p>{t(p.key)}</p>
                </div>
              </motion.li>
            ))}
          </ul>

          <label className={`jm-consent${agreed ? ' is-on' : ''}`}>
            <input
              ref={checkRef}
              type="checkbox"
              className="jm-check"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span className="jm-consent-text">
              {t('iAgree')}{' '}
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">{t('privacyPolicy')}</a>
              {' '}{t('and')}{' '}
              <a href="/terms-of-service" target="_blank" rel="noopener noreferrer">{t('termsOfService')}</a>.
            </span>
          </label>
        </div>

        <footer className="jm-foot">
          {agreed ? (
            <span className="jm-hint is-ready" aria-live="polite"><CheckCircle2 size={15} /> {c.ready}</span>
          ) : (
            <button type="button" className="jm-hint" onClick={goToConsent}><Lock size={14} /> {c.hint}</button>
          )}
          <div className="jm-actions">
            <button type="button" className="jm-btn jm-btn-ghost" onClick={onClose}>{t('cancel')}</button>
            <button type="button" className="jm-btn jm-btn-primary" onClick={accept} disabled={!agreed}>
              {t('agreeContinue')} <ArrowRight size={17} />
            </button>
          </div>
        </footer>
      </motion.div>
    </motion.div>
  );
};

// Rendered into <body> so no page-level stacking context (the home page
// isolates its own) can put the sticky navbar on top of the overlay.
const DisclaimerModal = ({ isOpen, onClose, selectedRole }) => createPortal(
  <MotionConfig reducedMotion="user">
    <AnimatePresence>
      {isOpen && (
        <JoinSheet key="join" initialRole={selectedRole === 'Host' ? 'Host' : 'Guest'} onClose={onClose} />
      )}
    </AnimatePresence>
  </MotionConfig>,
  document.body,
);

export default DisclaimerModal;
