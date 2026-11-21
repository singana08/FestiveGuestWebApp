import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import {
  Mail, MessageCircle, Users, CheckCircle2, AlertCircle, Send, Shield, Lock, FileText, ChevronDown, Copy,
  Search, X, LifeBuoy, Wrench, AlertTriangle, Check,
} from 'lucide-react';
import useSEO from '../hooks/useSEO';
import { useLanguage } from '../i18n/LanguageContext';
import api from '../utils/api';
import '../styles/Register.css';
import '../styles/PostsBoard.css';
import '../styles/Help.css';

const EASE = [0.22, 1, 0.36, 1];
const SUPPORT_EMAIL = 'customer-support@festiveguest.com';

const AccordionItem = ({ icon, question, children, open, onToggle }) => (
  <div className={`hp-acc${open ? ' is-open' : ''}`}>
    <button type="button" className="hp-acc-btn" aria-expanded={open} onClick={onToggle}>
      <span className="hp-acc-icon" aria-hidden="true">{icon}</span>
      <span className="hp-acc-q">{question}</span>
      <ChevronDown size={16} className="hp-acc-chev" aria-hidden="true" />
    </button>
    <AnimatePresence initial={false}>
      {open && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: EASE }} style={{ overflow: 'hidden' }}>
          <div className="hp-acc-body">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const Help = () => {
  useSEO({ title: 'Help & Support', description: 'Get help using FestiveGuest to find or become a trusted local host in India — registration, safety, payments, and more.' });
  const { t } = useLanguage();
  const [feedback, setFeedback] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [emailCopied, setEmailCopied] = useState(false);
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('all');
  const [openKey, setOpenKey] = useState(null);

  // mailto: opens whatever the OS has as its default mail app, which may not
  // be what people use — copying the address is the reliable fallback.
  const copySupportEmail = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('user');
      if (saved) {
        const u = JSON.parse(saved);
        setUser(u);
        setFeedback((prev) => ({ ...prev, name: u.name || '', email: u.email || '' }));
      }
    } catch { /* ignore */ }
  }, []);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.name || !feedback.email || !feedback.message) { setError('Please fill all fields'); return; }
    setSending(true);
    setError('');
    try {
      await api.post('feedback', { name: feedback.name, email: feedback.email, message: feedback.message, userType: user?.userType || user?.role || 'Guest' });
      setSent(true);
      setFeedback((prev) => ({ ...prev, message: '' }));
      setTimeout(() => setSent(false), 5000);
    } catch (err) {
      let msg = 'Failed to send feedback. Please try again.';
      if (err.response?.status === 404) msg = 'Feedback service not found. Please contact support.';
      else if (err.response?.status === 500) msg = 'Server error. Please try again later.';
      else if (err.response?.data?.message) msg = err.response.data.message;
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  const handleWhatsAppClick = () => {
    const cc = '91', p1 = '9966', p2 = '888', p3 = '484';
    window.open(`https://wa.me/${cc}${p1}${p2}${p3}`, '_blank', 'noopener,noreferrer');
  };

  // topic: start | safety | money | account — drives the quick chips.
  const faqs = [
    { key: 'host', topic: 'start', icon: <CheckCircle2 size={15} />, q: t('faqHowBecomeHost'), a: t('faqHowBecomeHostAnswer') },
    { key: 'free', topic: 'money', icon: <AlertCircle size={15} />, q: t('faqIsFree'), a: t('faqIsFreeAnswer') },
    { key: 'find', topic: 'start', icon: <Users size={15} />, q: t('faqHowFindHosts'), a: t('faqHowFindHostsAnswer') },
    { key: 'ref', topic: 'account', icon: <MessageCircle size={15} />, q: t('faqReferralSystem'), a: t('faqReferralSystemAnswer') },
    { key: 'safe', topic: 'safety', icon: <Shield size={15} />, q: t('faqSafetyMeasures'), a: t('faqSafetyMeasuresAnswer') },
    { key: 'report', topic: 'safety', icon: <AlertCircle size={15} />, q: t('faqReportSuspicious'), a: t('faqReportSuspiciousAnswer') },
    { key: 'dispute', topic: 'safety', icon: <CheckCircle2 size={15} />, q: t('faqDispute'), a: t('faqDisputeAnswer') },
    { key: 'pay', topic: 'money', icon: <AlertCircle size={15} />, q: t('faqPayments'), a: t('faqPaymentsAnswer') },
    { key: 'verify', topic: 'account', icon: <CheckCircle2 size={15} />, q: t('faqVerifyIdentity'), a: t('faqVerifyIdentityAnswer') },
    { key: 'exp', topic: 'start', icon: <Users size={15} />, q: t('faqExperiences'), a: t('faqExperiencesAnswer') },
    { key: 'info', topic: 'account', icon: <Lock size={15} />, q: t('faqInfoSafe'), a: t('faqInfoSafeAnswer') },
  ];
  const trouble = [
    { key: 'login', topic: 'account', steps: 5 },
    { key: 'loading', topic: 'start', steps: 6 },
    { key: 'payment', topic: 'money', steps: 6 },
    { key: 'email', topic: 'account', steps: 5 },
  ].map((tr) => {
    const id = tr.key.charAt(0).toUpperCase() + tr.key.slice(1);
    const steps = Array.from({ length: tr.steps }, (_, i) => t(`trouble${id}Step${i + 1}`));
    return { ...tr, key: `tr-${tr.key}`, q: t(`trouble${id}Title`), desc: t(`trouble${id}Desc`), steps };
  });

  const q = query.trim().toLowerCase();
  const matches = (item, text) => (topic === 'all' || item.topic === topic) && (!q || text.toLowerCase().includes(q));
  const shownFaqs = faqs.filter((f) => matches(f, `${f.q} ${f.a}`));
  const shownTrouble = trouble.filter((tr) => matches(tr, `${tr.q} ${tr.desc} ${tr.steps.join(' ')}`));
  const nothing = shownFaqs.length === 0 && shownTrouble.length === 0;
  const toggle = (key) => setOpenKey((k) => (k === key ? null : key));

  const topics = [['all', 'All topics'], ['start', 'Getting started'], ['safety', 'Safety'], ['money', 'Payments'], ['account', 'Account']];
  const policies = [
    { to: '/terms-of-service', icon: <FileText size={17} />, label: t('termsOfService'), desc: t('termsDesc') },
    { to: '/privacy-policy', icon: <Lock size={17} />, label: t('privacyPolicy'), desc: t('privacyDesc') },
    { to: '/safety-guidelines', icon: <Shield size={17} />, label: t('safetyGuidelines'), desc: t('safetyDesc') },
  ];
  const socials = [
    { href: 'https://twitter.com/festiveguest', label: 'X', svg: <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg> },
    { href: 'https://instagram.com/festiveguest', label: 'Instagram', svg: <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg> },
    { href: 'https://youtube.com/@festiveguest', label: 'YouTube', svg: <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg> },
    { href: 'https://facebook.com/festiveguest', label: 'Facebook', svg: <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg> },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="hp">
        <div className="rg-aurora" aria-hidden="true"><span className="a1" /><span className="a2" /><span className="a3" /></div>
        <div className="hp-shell">
          {/* ═════ Hero + search ═════ */}
          <motion.section className="hp-hero" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }}>
            <span className="hp-hero-icon" aria-hidden="true"><LifeBuoy size={22} /></span>
            <h1>{t('helpSupport')}</h1>
            <p>{t('helpDescription')}</p>
            <div className="hp-search">
              <Search size={17} aria-hidden="true" />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search help — e.g. password, payment, safety" aria-label="Search help" />
              {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={15} /></button>}
            </div>
            <div className="hp-topics" role="group" aria-label="Topics">
              {topics.map(([value, label]) => (
                <button key={value} type="button" className={`pb-chip${topic === value ? ' is-on' : ''}`} aria-pressed={topic === value} onClick={() => setTopic(value)}>{label}</button>
              ))}
            </div>
          </motion.section>

          <div className="hp-grid">
            {/* ═════ Answers ═════ */}
            <div className="hp-main">
              {nothing ? (
                <div className="hp-card hp-none">
                  <strong>No answers match “{query}”.</strong>
                  <p>Try another word, or message us — we usually reply within a day.</p>
                  <button type="button" className="rg-btn rg-btn-ghost rg-btn-sm" onClick={() => { setQuery(''); setTopic('all'); }}>Show all answers</button>
                </div>
              ) : (
                <>
                  {shownFaqs.length > 0 && (
                    <section className="hp-card">
                      <header className="hp-card-head"><h2>{t('faq')}</h2><span>{shownFaqs.length}</span></header>
                      {shownFaqs.map((f) => (
                        <AccordionItem key={f.key} icon={f.icon} question={f.q} open={openKey === f.key || (!!q && shownFaqs.length === 1)} onToggle={() => toggle(f.key)}>{f.a}</AccordionItem>
                      ))}
                    </section>
                  )}
                  {shownTrouble.length > 0 && (
                    <section className="hp-card">
                      <header className="hp-card-head"><h2><Wrench size={16} /> {t('troubleshooting')}</h2><span>{shownTrouble.length}</span></header>
                      {shownTrouble.map((tr) => (
                        <AccordionItem key={tr.key} icon={<AlertCircle size={15} />} question={tr.q} open={openKey === tr.key} onToggle={() => toggle(tr.key)}>
                          <p>{tr.desc}</p>
                          <ol>{tr.steps.map((s) => <li key={s}>{s}</li>)}</ol>
                        </AccordionItem>
                      ))}
                    </section>
                  )}
                </>
              )}

              <section className="hp-warning" role="note">
                <AlertTriangle size={20} aria-hidden="true" />
                <div>
                  <strong>{t('bewareImpersonators')}</strong>
                  <p><b>{t('officialContactOnly')}:</b> {t('warningMessage')}</p>
                </div>
              </section>
            </div>

            {/* ═════ Contact + feedback ═════ */}
            <aside className="hp-side">
              <section className="hp-card hp-contact">
                <div className="hp-channel">
                  <span className="hp-ch-icon hp-ch-icon--mail" aria-hidden="true"><Mail size={18} /></span>
                  <div>
                    <h3>{t('emailSupport')}</h3>
                    <p>{t('emailSupportDesc')}</p>
                    <div className="hp-ch-actions">
                      <a className="rg-btn rg-btn-primary rg-btn-sm hp-link-btn" href={`mailto:${SUPPORT_EMAIL}`}><Mail size={14} />{t('customerSupport')}</a>
                      <button type="button" className="rg-btn rg-btn-ghost rg-btn-sm" onClick={copySupportEmail} title={`Copy ${SUPPORT_EMAIL}`}>
                        {emailCopied ? <Check size={14} /> : <Copy size={14} />}{emailCopied ? 'Copied!' : 'Copy email'}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="hp-channel">
                  <span className="hp-ch-icon hp-ch-icon--wa" aria-hidden="true"><MessageCircle size={18} /></span>
                  <div>
                    <h3>{t('whatsappSupport')}</h3>
                    <p>{t('whatsappSupportDesc')}</p>
                    <div className="hp-ch-actions">
                      <button type="button" className="rg-btn rg-btn-sm hp-wa-btn" onClick={handleWhatsAppClick}><MessageCircle size={14} />{t('chatOnWhatsapp')}</button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="hp-card">
                <header className="hp-card-head"><h2>{t('sendFeedback')}</h2></header>
                <p className="hp-sub">{t('sendFeedbackDesc')}</p>
                <AnimatePresence mode="wait">
                  {sent ? (
                    <motion.div key="done" className="hp-sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                      <span><Check size={26} /></span>
                      <strong>{t('feedbackSent')}</strong>
                      <p>{t('feedbackThanks')}</p>
                    </motion.div>
                  ) : (
                    <motion.form key="form" onSubmit={handleFeedbackSubmit} noValidate className="hp-form">
                      {error && <div className="rg-alert" role="alert"><AlertTriangle size={16} /> {error}</div>}
                      <div className="hp-form-row">
                        <input className="rg-input" type="text" placeholder={t('yourName')} aria-label={t('yourName')} value={feedback.name}
                          onChange={(e) => setFeedback({ ...feedback, name: e.target.value })} disabled={!!user} />
                        <input className="rg-input" type="email" placeholder={t('yourEmail')} aria-label={t('yourEmail')} value={feedback.email}
                          onChange={(e) => setFeedback({ ...feedback, email: e.target.value })} disabled={!!user} />
                      </div>
                      <textarea className="rg-input rg-textarea" rows={4} placeholder={t('yourFeedback')} aria-label={t('yourFeedback')} value={feedback.message}
                        onChange={(e) => { setFeedback({ ...feedback, message: e.target.value }); setError(''); }} />
                      <button type="submit" className="rg-btn rg-btn-primary" disabled={sending}>
                        {sending ? <><span className="rg-spinner" /> {t('sending')}</> : <><Send size={15} /> {t('sendFeedback')}</>}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </section>

              <section className="hp-card">
                <header className="hp-card-head"><h2>{t('importantPolicies')}</h2></header>
                <ul className="hp-policies">
                  {policies.map(({ to, icon, label, desc }) => (
                    <li key={to}>
                      <Link to={to}>
                        <span className="hp-pol-icon" aria-hidden="true">{icon}</span>
                        <span><strong>{label}</strong><small>{desc}</small></span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="hp-socials">
                  <span>{t('connectWithUs')}</span>
                  {socials.map(({ href, label, svg }) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>{svg}</a>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
};

export default Help;
