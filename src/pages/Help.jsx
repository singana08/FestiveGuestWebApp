import React, { useState, useEffect, useRef } from 'react';
import {
  Mail, MessageCircle, HelpCircle, Users, CheckCircle,
  AlertCircle, Send, Shield, Lock, FileText, ChevronDown,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import api from '../utils/api';

// ── Scroll-reveal wrapper ──
const AnimSection = ({ children, delay = 0 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.42, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
};

// ── Collapsible accordion item ──
const AccordionItem = ({ icon, question, children, defaultOpen = false, accent = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      background: 'white',
      borderRadius: 'var(--radius-sm)',
      border: `1.5px solid ${open && accent ? 'rgba(255,107,53,0.25)' : 'var(--border)'}`,
      marginBottom: '0.5rem',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'none', border: 'none',
          padding: '1rem 1.125rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{
          color: open ? 'var(--primary)' : 'var(--text-light)',
          transition: 'color 0.2s', flexShrink: 0, lineHeight: 0,
        }}>
          {icon}
        </span>
        <span style={{
          flex: 1, fontSize: '0.9rem', fontWeight: 600,
          color: 'var(--text)', lineHeight: 1.4,
        }}>
          {question}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ color: 'var(--text-muted)', flexShrink: 0, lineHeight: 0 }}
        >
          <ChevronDown size={16} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '0 1.125rem 1rem 3rem',
              color: 'var(--text-light)', fontSize: '0.85rem', lineHeight: 1.7,
            }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Section heading pill ──
const SectionLabel = ({ emoji, label }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
    background: 'var(--primary-subtle)', color: 'var(--primary-dark)',
    borderRadius: 'var(--radius-xl)', padding: '0.25rem 0.875rem',
    fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em',
    textTransform: 'uppercase', marginBottom: '0.6rem',
  }}>
    {emoji} {label}
  </span>
);

const Help = () => {
  const { t } = useLanguage();
  const [feedback, setFeedback] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('user');
      if (saved) {
        const u = JSON.parse(saved);
        setUser(u);
        setFeedback(prev => ({ ...prev, name: u.name || '', email: u.email || '' }));
      }
    } catch {}
  }, []);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.name || !feedback.email || !feedback.message) {
      setError('Please fill all fields');
      return;
    }
    setSending(true);
    setError('');
    try {
      await api.post('feedback', {
        name: feedback.name,
        email: feedback.email,
        message: feedback.message,
        userType: user?.userType || user?.role || 'Guest',
      });
      setSent(true);
      setFeedback(prev => ({ ...prev, message: '' }));
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

  const faqs = [
    { icon: <CheckCircle size={15} />, q: t('faqHowBecomeHost'),    a: t('faqHowBecomeHostAnswer') },
    { icon: <AlertCircle size={15} />, q: t('faqIsFree'),           a: t('faqIsFreeAnswer') },
    { icon: <Users size={15} />,       q: t('faqHowFindHosts'),     a: t('faqHowFindHostsAnswer') },
    { icon: <MessageCircle size={15} />, q: t('faqReferralSystem'), a: t('faqReferralSystemAnswer') },
    { icon: <Shield size={15} />,      q: t('faqSafetyMeasures'),   a: t('faqSafetyMeasuresAnswer') },
    { icon: <AlertCircle size={15} />, q: t('faqReportSuspicious'), a: t('faqReportSuspiciousAnswer') },
    { icon: <CheckCircle size={15} />, q: t('faqDispute'),          a: t('faqDisputeAnswer') },
    { icon: <AlertCircle size={15} />, q: t('faqPayments'),         a: t('faqPaymentsAnswer') },
    { icon: <CheckCircle size={15} />, q: t('faqVerifyIdentity'),   a: t('faqVerifyIdentityAnswer') },
    { icon: <Users size={15} />,       q: t('faqExperiences'),      a: t('faqExperiencesAnswer') },
    { icon: <CheckCircle size={15} />, q: t('faqInfoSafe'),         a: t('faqInfoSafeAnswer') },
  ];

  const troubleshoot = [
    {
      q: t('troubleLoginTitle'),
      body: <><p style={{ margin: '0 0 0.5rem' }}>{t('troubleLoginDesc')}</p>
        <ol style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.8 }}>
          {[1,2,3,4,5].map(n => <li key={n}>{t(`troubleLoginStep${n}`)}</li>)}
        </ol></>,
    },
    {
      q: t('troubleLoadingTitle'),
      body: <><p style={{ margin: '0 0 0.5rem' }}>{t('troubleLoadingDesc')}</p>
        <ol style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.8 }}>
          {[1,2,3,4,5,6].map(n => <li key={n}>{t(`troubleLoadingStep${n}`)}</li>)}
        </ol></>,
    },
    {
      q: t('troublePaymentTitle'),
      body: <><p style={{ margin: '0 0 0.5rem' }}>{t('troublePaymentDesc')}</p>
        <ol style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.8 }}>
          {[1,2,3,4,5,6].map(n => <li key={n}>{t(`troublePaymentStep${n}`)}</li>)}
        </ol></>,
    },
    {
      q: t('troubleEmailTitle'),
      body: <><p style={{ margin: '0 0 0.5rem' }}>{t('troubleEmailDesc')}</p>
        <ol style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.8 }}>
          {[1,2,3,4,5].map(n => <li key={n}>{t(`troubleEmailStep${n}`)}</li>)}
        </ol></>,
    },
  ];

  const policies = [
    { to: '/terms-of-service',   icon: <FileText size={20} />, label: t('termsOfService'),   desc: t('termsDesc'),   color: '#4F8EF7' },
    { to: '/privacy-policy',     icon: <Lock size={20} />,     label: t('privacyPolicy'),    desc: t('privacyDesc'),  color: '#8B5CF6' },
    { to: '/safety-guidelines',  icon: <Shield size={20} />,   label: t('safetyGuidelines'), desc: t('safetyDesc'),   color: '#10B981' },
  ];

  const socials = [
    { href: 'https://twitter.com/festiveguest', label: 'X',
      svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
    { href: 'https://instagram.com/festiveguest', label: 'Instagram',
      svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> },
    { href: 'https://youtube.com/@festiveguest', label: 'YouTube',
      svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
    { href: 'https://facebook.com/festiveguest', label: 'Facebook',
      svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
  ];

  const inputBase = {
    padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--border)', width: '100%',
    boxSizing: 'border-box', fontSize: '0.9rem',
    fontFamily: 'inherit', outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh', paddingBottom: '4rem' }}>

      {/* ── Hero ── */}
      <div style={{
        background: 'var(--gradient-hero)',
        padding: '3.5rem 1.5rem 4.5rem',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {[180, 300, 440].map((sz, i) => (
          <motion.div key={i}
            animate={{ scale: [1, 1.1, 1], opacity: [0.06, 0.1, 0.06] }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.7 }}
            style={{
              position: 'absolute', width: sz, height: sz, borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.15)',
              top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            }}
          />
        ))}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <div style={{
            width: 64, height: 64, borderRadius: '1.25rem',
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}>
            <HelpCircle size={32} color="white" />
          </div>
          <h1 style={{
            color: 'white', margin: '0 0 0.5rem',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 'clamp(1.6rem, 4vw, 2.25rem)', fontWeight: 800,
          }}>
            {t('helpSupport')}
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.82)', margin: 0,
            fontSize: '0.95rem', maxWidth: 460, marginInline: 'auto',
          }}>
            {t('helpDescription')}
          </p>
        </motion.div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 1.25rem' }}>

        {/* ── Support cards – overlap hero ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginTop: '-2rem',
          position: 'relative', zIndex: 2,
        }}>
          {/* Email */}
          <AnimSection delay={0}>
            <div style={{
              background: 'white', borderRadius: 'var(--radius)',
              padding: '1.5rem', border: '1.5px solid var(--border)',
              boxShadow: 'var(--shadow-lg)',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '0.75rem',
                background: 'var(--gradient-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '0.875rem',
              }}>
                <Mail size={20} color="white" />
              </div>
              <h3 style={{ margin: '0 0 0.35rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>
                {t('emailSupport')}
              </h3>
              <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: 'var(--text-light)', lineHeight: 1.6 }}>
                {t('emailSupportDesc')}
              </p>
              <a
                href="mailto:customer-support@festiveguest.com"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  background: 'var(--gradient-primary)', color: 'white',
                  padding: '0.55rem 1.1rem', borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600,
                }}
              >
                <Mail size={14} />{t('customerSupport')}
              </a>
            </div>
          </AnimSection>

          {/* WhatsApp */}
          <AnimSection delay={0.07}>
            <div style={{
              background: 'white', borderRadius: 'var(--radius)',
              padding: '1.5rem', border: '1.5px solid var(--border)',
              boxShadow: 'var(--shadow-lg)',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '0.75rem',
                background: 'linear-gradient(135deg,#25D366,#128C7E)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '0.875rem',
              }}>
                <MessageCircle size={20} color="white" />
              </div>
              <h3 style={{ margin: '0 0 0.35rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>
                {t('whatsappSupport')}
              </h3>
              <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: 'var(--text-light)', lineHeight: 1.6 }}>
                {t('whatsappSupportDesc')}
              </p>
              <button
                onClick={handleWhatsAppClick}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  background: 'linear-gradient(135deg,#25D366,#128C7E)', color: 'white',
                  padding: '0.55rem 1.1rem', borderRadius: 'var(--radius-sm)',
                  border: 'none', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                <MessageCircle size={14} />{t('chatOnWhatsapp')}
              </button>
            </div>
          </AnimSection>
        </div>

        {/* ── FAQs ── */}
        <AnimSection>
          <div style={{ marginTop: '2.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <SectionLabel emoji="✦" label="FAQ" />
              <h2 style={{ margin: '0 0 0.3rem', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(1.2rem, 2.5vw, 1.55rem)', fontWeight: 800 }}>
                {t('faq')}
              </h2>
              <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '0.85rem' }}>{t('faqDesc')}</p>
            </div>
            {faqs.map((item, i) => (
              <AccordionItem key={i} icon={item.icon} question={item.q} accent>
                {item.a}
              </AccordionItem>
            ))}
          </div>
        </AnimSection>

        {/* ── Troubleshooting ── */}
        <AnimSection>
          <div style={{ marginTop: '2.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <SectionLabel emoji="⚠" label="Troubleshooting" />
              <h2 style={{ margin: '0 0 0.3rem', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(1.2rem, 2.5vw, 1.55rem)', fontWeight: 800 }}>
                {t('troubleshooting')}
              </h2>
              <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '0.85rem' }}>{t('troubleshootingDesc')}</p>
            </div>
            {troubleshoot.map((item, i) => (
              <AccordionItem key={i} icon={<AlertCircle size={15} />} question={item.q}>
                {item.body}
              </AccordionItem>
            ))}
          </div>
        </AnimSection>

        {/* ── Feedback form ── */}
        <AnimSection>
          <div style={{ marginTop: '2.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <SectionLabel emoji="✉" label="Feedback" />
              <h2 style={{ margin: '0 0 0.3rem', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(1.2rem, 2.5vw, 1.55rem)', fontWeight: 800 }}>
                {t('sendFeedback')}
              </h2>
              <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '0.85rem' }}>{t('sendFeedbackDesc')}</p>
            </div>

            <div style={{
              maxWidth: 480, margin: '0 auto',
              background: 'white', borderRadius: 'var(--radius)',
              padding: '1.75rem', border: '1.5px solid var(--border)',
              boxShadow: 'var(--shadow-card)',
            }}>
              <AnimatePresence mode="wait">
                {sent ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ textAlign: 'center', padding: '1rem 0' }}
                  >
                    <CheckCircle size={48} color="var(--success)" style={{ marginBottom: '0.875rem' }} />
                    <h3 style={{ color: 'var(--success)', margin: '0 0 0.4rem', fontWeight: 700 }}>{t('feedbackSent')}</h3>
                    <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '0.875rem' }}>{t('feedbackThanks')}</p>
                  </motion.div>
                ) : (
                  <motion.form key="form" onSubmit={handleFeedbackSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                      {error && (
                        <div style={{
                          background: '#fee2e2', color: '#dc2626',
                          border: '1px solid #fecaca',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.65rem 0.875rem', fontSize: '0.82rem',
                        }}>
                          ⚠ {error}
                        </div>
                      )}
                      <input
                        type="text" placeholder={t('yourName')}
                        value={feedback.name}
                        onChange={e => setFeedback({ ...feedback, name: e.target.value })}
                        disabled={!!user}
                        style={{ ...inputBase, background: user ? 'var(--surface-2)' : 'white', color: 'var(--text)' }}
                      />
                      <input
                        type="email" placeholder={t('yourEmail')}
                        value={feedback.email}
                        onChange={e => setFeedback({ ...feedback, email: e.target.value })}
                        disabled={!!user}
                        style={{ ...inputBase, background: user ? 'var(--surface-2)' : 'white', color: 'var(--text)' }}
                      />
                      <textarea
                        placeholder={t('yourFeedback')}
                        value={feedback.message}
                        onChange={e => { setFeedback({ ...feedback, message: e.target.value }); setError(''); }}
                        rows={4}
                        style={{ ...inputBase, resize: 'vertical' }}
                      />
                      <motion.button
                        type="submit"
                        disabled={sending}
                        whileTap={{ scale: 0.97 }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
                          background: sending ? 'var(--border-strong)' : 'var(--gradient-primary)',
                          color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
                          padding: '0.75rem 1.5rem', fontSize: '0.9rem', fontWeight: 700,
                          cursor: sending ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <Send size={15} />
                        {sending ? t('sending') : t('sendFeedback')}
                      </motion.button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </AnimSection>

        {/* ── Policies ── */}
        <AnimSection>
          <div style={{ marginTop: '2.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <SectionLabel emoji="📋" label="Policies" />
              <h2 style={{ margin: '0 0 0.3rem', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(1.2rem, 2.5vw, 1.55rem)', fontWeight: 800 }}>
                {t('importantPolicies')}
              </h2>
              <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '0.85rem' }}>{t('policiesDesc')}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem' }}>
              {policies.map(({ to, icon, label, desc, color }) => (
                <Link key={to} to={to} style={{ textDecoration: 'none' }}>
                  <motion.div
                    whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.09)' }}
                    transition={{ duration: 0.18 }}
                    style={{
                      background: 'white', padding: '1.25rem',
                      borderRadius: 'var(--radius)', border: '1.5px solid var(--border)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: '0.75rem',
                      background: `${color}18`, color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 0.75rem',
                    }}>
                      {icon}
                    </div>
                    <h4 style={{ margin: '0 0 0.25rem', color: 'var(--text)', fontSize: '0.88rem', fontWeight: 700 }}>{label}</h4>
                    <p style={{ margin: 0, fontSize: '0.77rem', color: 'var(--text-light)', lineHeight: 1.5 }}>{desc}</p>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </AnimSection>

        {/* ── Warning ── */}
        <AnimSection>
          <div style={{
            marginTop: '2.5rem', background: '#fff1f2',
            borderRadius: 'var(--radius)', border: '1.5px solid #fecdd3',
            padding: '1.125rem 1.25rem',
            display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
          }}>
            <AlertCircle size={22} color="#e11d48" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ margin: '0 0 0.25rem', color: '#9f1239', fontWeight: 700, fontSize: '0.9rem' }}>
                {t('bewareImpersonators')}
              </p>
              <p style={{ margin: 0, color: '#881337', lineHeight: 1.6, fontSize: '0.82rem' }}>
                <strong>{t('officialContactOnly')}:</strong> {t('warningMessage')}
              </p>
            </div>
          </div>
        </AnimSection>

        {/* ── Social ── */}
        <AnimSection>
          <div style={{
            marginTop: '2.5rem',
            background: 'var(--gradient-hero)',
            borderRadius: 'var(--radius)', padding: '2rem 1.5rem',
            textAlign: 'center',
          }}>
            <h2 style={{
              color: 'white', margin: '0 0 0.35rem',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', fontWeight: 800,
            }}>
              {t('connectWithUs')}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.78)', margin: '0 0 1.5rem', fontSize: '0.85rem' }}>
              {t('socialMediaDesc')}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              {socials.map(({ href, label, svg }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', color: 'white', textDecoration: 'none' }}
                >
                  <motion.div
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.94 }}
                    style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.18)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.28)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {svg}
                  </motion.div>
                  <span style={{ fontSize: '0.76rem', fontWeight: 600 }}>{label}</span>
                </a>
              ))}
            </div>
          </div>
        </AnimSection>

      </div>
    </div>
  );
};

export default Help;
