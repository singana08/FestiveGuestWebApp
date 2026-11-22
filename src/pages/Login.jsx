import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useSEO from '../hooks/useSEO';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Key, ArrowRight, Check, CheckCircle2, AlertTriangle, X, Sparkles } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import api from '../utils/api';
import { useLanguage } from '../i18n/LanguageContext';
import '../styles/Register.css';

const passwordRequirements = [
  { label: 'At least 8 characters', test: pw => pw.length >= 8 },
  { label: 'One uppercase letter', test: pw => /[A-Z]/.test(pw) },
  { label: 'One lowercase letter', test: pw => /[a-z]/.test(pw) },
  { label: 'One number',            test: pw => /\d/.test(pw) },
  { label: 'One special character', test: pw => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw) },
];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EASE = [0.22, 1, 0.36, 1];

const TILES = [
  { icon: '💬', title: 'Pick up your conversations', desc: 'Your chats with hosts and guests are waiting.' },
  { icon: '🧳', title: 'Find your next stay', desc: 'Browse trip posts and local hosts across India.' },
  { icon: '🏡', title: 'Host someone new', desc: 'Update where you host and reply to requests.' },
];

// Two-option pill switch (login method / reset channel).
const Seg = ({ id, options, value, onChange }) => (
  <div className="rg-seg">
    {options.map(o => (
      <button key={o.key} type="button" aria-pressed={value === o.key} onClick={() => onChange(o.key)}>
        {value === o.key && <motion.span layoutId={id} className="rg-seg-pill" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
        {o.label}
      </button>
    ))}
  </div>
);

const Login = ({ setUser }) => {
  useSEO({ title: 'Log In', description: 'Log in to FestiveGuest to connect with a trusted local host in India, or manage your host profile.' });
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/posts';

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [emailError, setEmailError] = useState('');
  const [toast, setToast]           = useState(null);

  // Login with phone OTP (alternative to password)
  const [loginMethod, setLoginMethod]           = useState('password'); // 'password' | 'phone'
  const [loginPhone, setLoginPhone]             = useState('');
  const [loginPhoneOtpSent, setLoginPhoneOtpSent] = useState(false);
  const [loginPhoneOtpSending, setLoginPhoneOtpSending] = useState(false);
  const [loginPhoneOtpSessionId, setLoginPhoneOtpSessionId] = useState('');
  const [loginPhoneOtp, setLoginPhoneOtp]       = useState('');
  const [loginPhoneError, setLoginPhoneError]   = useState('');

  // Forgot-password flow
  const [showForgot, setShowForgot]       = useState(false);
  const [resetChannel, setResetChannel]   = useState('email'); // 'email' | 'phone'
  const [forgotEmail, setForgotEmail]     = useState('');
  const [forgotPhone, setForgotPhone]     = useState('');
  const [resetSessionId, setResetSessionId] = useState('');
  const [otpSent, setOtpSent]             = useState(false);
  const [otp, setOtp]                     = useState('');
  const [newPw, setNewPw]                 = useState('');
  const [confirmPw, setConfirmPw]         = useState('');
  const [otpSending, setOtpSending]       = useState(false);
  const [resetting, setResetting]         = useState(false);
  const [modalError, setModalError]       = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    if (type === 'success') setTimeout(() => setToast(null), 4500);
  };

  const validateEmail = (val) => {
    if (!val) { setEmailError(''); return true; }
    if (!emailRegex.test(val)) { setEmailError('Please enter a valid email address'); return false; }
    setEmailError('');
    return true;
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!validateEmail(email)) return;
    setLoading(true);
    try {
      const res = await api.post('auth/login', { email, password });
      if (res?.data?.success && res?.data?.token) {
        const { token, user } = res.data;
        const userWithToken = { ...user, token };
        localStorage.setItem('user', JSON.stringify(userWithToken));
        localStorage.setItem('userId', user.userId);
        localStorage.setItem('token', token);
        setUser(userWithToken);
        showToast('Login successful! Redirecting…', 'success');
        navigate(redirectTo);
      } else {
        showToast('Login failed', 'error');
      }
    } catch (err) {
      if (err.response?.status === 429) {
        showToast('Too many attempts. Please wait 15 minutes.', 'error');
      } else {
        showToast('Login failed: ' + (err.response?.data?.message || err.message), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (idToken) => {
    setLoading(true);
    try {
      const res = await api.post('auth/google-login', { idToken });
      if (res?.data?.success && res?.data?.token) {
        const { token, user, isNewGoogleUser } = res.data;
        const userWithToken = { ...user, token };
        localStorage.setItem('user', JSON.stringify(userWithToken));
        localStorage.setItem('userId', user.userId);
        localStorage.setItem('token', token);
        setUser(userWithToken);
        if (isNewGoogleUser) {
          showToast('Welcome! Please complete your profile in Settings.', 'success');
        } else {
          showToast('Signed in with Google!', 'success');
        }
        navigate(redirectTo);
      } else {
        showToast('Google sign-in failed', 'error');
      }
    } catch (err) {
      showToast('Google sign-in failed: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    setModalError('');
    if (resetChannel === 'phone') {
      if (!forgotPhone.trim() || forgotPhone.length !== 10) { setModalError('Please enter a valid 10-digit phone number'); return; }
      setOtpSending(true);
      try {
        const res = await api.post('phone-otp/send', { phone: forgotPhone });
        if (res.data.success) { setOtpSent(true); setResetSessionId(res.data.sessionId); }
      } catch (err) {
        const msg = err.response?.data?.message || err.message;
        if (msg?.includes('not configured')) {
          setModalError('Phone-based reset isn\'t available yet. Please use email instead.');
          setResetChannel('email');
        } else {
          setModalError('Failed to send OTP: ' + msg);
        }
      } finally {
        setOtpSending(false);
      }
      return;
    }

    if (!forgotEmail.trim()) { setModalError('Please enter your email address'); return; }
    if (!emailRegex.test(forgotEmail)) { setModalError('Please enter a valid email address'); return; }
    setOtpSending(true);
    try {
      const res = await api.post('email/send-otp', { email: forgotEmail, purpose: 'password-reset' });
      if (res.data.success) setOtpSent(true);
    } catch (err) {
      setModalError('Failed to send OTP: ' + (err.response?.data?.message || err.message));
    } finally {
      setOtpSending(false);
    }
  };

  const resetForgotModal = () => {
    setShowForgot(false); setOtpSent(false); setResetChannel('email');
    setOtp(''); setNewPw(''); setConfirmPw(''); setForgotEmail(''); setForgotPhone(''); setResetSessionId(''); setModalError('');
  };

  const resetPassword = async () => {
    setModalError('');
    if (!otp.trim() || otp.length !== 6) { setModalError('Please enter a valid 6-digit OTP'); return; }
    if (!newPw.trim()) { setModalError('Please enter a new password'); return; }
    if (!confirmPw.trim()) { setModalError('Please confirm your password'); return; }
    if (!passwordRequirements.every(r => r.test(newPw))) { setModalError('Password must meet all requirements'); return; }
    if (newPw !== confirmPw) { setModalError('Passwords do not match'); return; }
    setResetting(true);
    try {
      if (resetChannel === 'phone') {
        const verify = await api.post('phone-otp/verify', { sessionId: resetSessionId, otp, phone: forgotPhone, purpose: 'reset' });
        if (!verify.data.success) throw new Error(verify.data.message || 'Invalid OTP');
        const res = await api.post('auth/reset-password-phone', { phone: forgotPhone, verificationToken: verify.data.verificationToken, newPassword: newPw });
        if (res.data.success) { showToast('Password reset successful! Please sign in.', 'success'); resetForgotModal(); }
        return;
      }

      const res = await api.post('auth/reset-password', { email: forgotEmail, otpCode: otp, newPassword: newPw });
      if (res.data.success) { showToast('Password reset successful! Please sign in.', 'success'); resetForgotModal(); }
    } catch (err) {
      setModalError('Reset failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setResetting(false);
    }
  };

  const sendLoginPhoneOtp = async () => {
    setLoginPhoneError('');
    if (!loginPhone.trim() || loginPhone.length !== 10) { setLoginPhoneError('Please enter a valid 10-digit phone number'); return; }
    setLoginPhoneOtpSending(true);
    try {
      const res = await api.post('phone-otp/send', { phone: loginPhone });
      if (res.data.success) { setLoginPhoneOtpSent(true); setLoginPhoneOtpSessionId(res.data.sessionId); }
    } catch (err) {
      console.error('Phone OTP send failed:', err.response?.data?.message || err.message);
      showToast('We couldn’t send a code right now. Please sign in with your password.', 'error');
      setLoginMethod('password');
    } finally {
      setLoginPhoneOtpSending(false);
    }
  };

  const loginWithPhoneOtp = async () => {
    setLoginPhoneError('');
    if (!loginPhoneOtp.trim() || loginPhoneOtp.length !== 6) { setLoginPhoneError('Please enter a valid 6-digit OTP'); return; }
    setLoading(true);
    try {
      const verify = await api.post('phone-otp/verify', { sessionId: loginPhoneOtpSessionId, otp: loginPhoneOtp, phone: loginPhone, purpose: 'login' });
      if (!verify.data.success) throw new Error(verify.data.message || 'Invalid OTP');

      const res = await api.post('auth/login-with-phone', { phone: loginPhone, verificationToken: verify.data.verificationToken });
      if (res?.data?.success && res?.data?.token) {
        const { token, user } = res.data;
        const userWithToken = { ...user, token };
        localStorage.setItem('user', JSON.stringify(userWithToken));
        localStorage.setItem('userId', user.userId);
        localStorage.setItem('token', token);
        setUser(userWithToken);
        showToast('Login successful! Redirecting…', 'success');
        navigate(redirectTo);
      } else {
        setLoginPhoneError(res?.data?.message || 'Login failed');
      }
    } catch (err) {
      setLoginPhoneError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset dialog: lock page scroll, close on Escape.
  useEffect(() => {
    if (!showForgot) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = e => { if (e.key === 'Escape') resetForgotModal(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prevOverflow; document.removeEventListener('keydown', onKey); };
  }, [showForgot]);

  const busy = { opacity: loading ? 0.65 : 1, pointerEvents: loading ? 'none' : 'auto' };

  return (
    <MotionConfig reducedMotion="user">
      <div className="rg">
        <div className="rg-aurora" aria-hidden="true"><span className="a1" /><span className="a2" /><span className="a3" /></div>

        <div className="rg-shell lg-shell">
          {/* ═════════ Left: what's waiting (desktop) ═════════ */}
          <aside className="rg-side lg-side">
            <span className="rg-chip"><Sparkles size={14} /> FestiveGuest members</span>
            <h2 className="rg-title">Good to see you <span className="rg-grad">again.</span></h2>
            <p className="rg-lead">Sign in to pick up where you left off — your chats, trip posts and hosting are all here.</p>
            <div className="lg-tiles">
              {TILES.map((tile, i) => (
                <motion.div key={tile.title} className="lg-tile"
                  initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.1, duration: 0.55, ease: EASE }}>
                  <span className="rg-role-icon" aria-hidden="true">{tile.icon}</span>
                  <div><strong>{tile.title}</strong><p>{tile.desc}</p></div>
                </motion.div>
              ))}
            </div>
          </aside>

          {/* ═════════ Right: sign-in card ═════════ */}
          <motion.section className="rg-card"
            initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }}>
            <h1 className="rg-card-title">Welcome Back</h1>
            <p className="rg-card-sub">Sign in to your FestiveGuest account</p>

            <div style={{ margin: '1.4rem 0 1.25rem' }}>
              <Seg id="lg-method" value={loginMethod}
                options={[{ key: 'password', label: 'Password' }, { key: 'phone', label: 'Phone OTP' }]}
                onChange={key => { setLoginMethod(key); setLoginPhoneError(''); }} />
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {loginMethod === 'phone' ? (
                <motion.div key="phone" style={busy}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25, ease: EASE }}>
                  <div className="rg-field">
                    <label className="rg-label" htmlFor="lg-phone">Mobile number</label>
                    <div className="rg-inline">
                      <span className="rg-prefix" aria-hidden="true">+91</span>
                      <input id="lg-phone" type="tel" inputMode="numeric" autoComplete="tel-national"
                        className={`rg-input rg-input--prefixed${loginPhoneError ? ' has-error' : ''}${loginPhoneOtpSent ? ' is-verified' : ''}`}
                        placeholder="10-digit mobile number" value={loginPhone} maxLength={10} disabled={loginPhoneOtpSent}
                        onChange={e => { setLoginPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setLoginPhoneError(''); }} />
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {loginPhoneOtpSent && (
                      <motion.div className="rg-otp" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: EASE }}>
                        <div className="rg-otp-inner" style={{ marginTop: 0, marginBottom: '1.1rem' }}>
                          <p className="rg-otp-hint">Enter the 6-digit code sent by SMS to <strong>+91 {loginPhone}</strong></p>
                          <input className="rg-input rg-otp-input" inputMode="numeric" autoComplete="one-time-code" aria-label="Login code"
                            value={loginPhoneOtp} placeholder="••••••" maxLength={6}
                            onChange={e => { setLoginPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setLoginPhoneError(''); }} />
                          <div className="lg-otp-actions">
                            <button type="button" className="rg-link-btn" onClick={() => { setLoginPhoneOtp(''); sendLoginPhoneOtp(); }} disabled={loginPhoneOtpSending}>
                              {loginPhoneOtpSending ? 'Resending…' : 'Resend OTP'}
                            </button>
                            <button type="button" className="rg-link-btn" onClick={() => { setLoginPhoneOtpSent(false); setLoginPhoneOtp(''); }}>
                              Use a different number
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {loginPhoneError && <p className="rg-error" style={{ marginTop: '-0.5rem', marginBottom: '0.9rem' }}>{loginPhoneError}</p>}

                  <button type="button" className="rg-btn rg-btn-primary" style={{ width: '100%' }}
                    disabled={loading || loginPhoneOtpSending}
                    onClick={loginPhoneOtpSent ? loginWithPhoneOtp : sendLoginPhoneOtp}>
                    {loginPhoneOtpSent
                      ? (loading ? <><span className="rg-spinner" /> Signing in…</> : <>Verify &amp; Sign In <ArrowRight size={18} /></>)
                      : (loginPhoneOtpSending ? 'Sending…' : 'Send OTP')}
                  </button>
                </motion.div>
              ) : (
                <motion.form key="password" onSubmit={handleLogin} style={busy}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25, ease: EASE }}>
                  <div className="rg-field">
                    <label className="rg-label" htmlFor="lg-email">Email address</label>
                    <div className="rg-inline">
                      <span className="rg-input-icon" aria-hidden="true"><Mail size={17} /></span>
                      <input id="lg-email" type="email" autoComplete="email" required
                        className={`rg-input rg-input--iconed${emailError ? ' has-error' : ''}`}
                        placeholder="you@example.com" value={email}
                        onChange={e => { setEmail(e.target.value); validateEmail(e.target.value); }}
                        onBlur={e => validateEmail(e.target.value)} />
                    </div>
                    {emailError && <p className="rg-error">{emailError}</p>}
                  </div>

                  <div className="rg-field">
                    <label className="rg-label" htmlFor="lg-password">Password</label>
                    <div className="rg-inline">
                      <span className="rg-input-icon" aria-hidden="true"><Lock size={17} /></span>
                      <input id="lg-password" type={showPw ? 'text' : 'password'} autoComplete="current-password" required
                        className="rg-input rg-input--iconed" style={{ paddingRight: '3rem' }}
                        placeholder="Your password" value={password}
                        onChange={e => setPassword(e.target.value)} />
                      <button type="button" className="rg-eye" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                        {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="lg-forgot">
                    <button type="button" className="rg-link-btn" style={{ textDecoration: 'none' }} onClick={() => setShowForgot(true)}>
                      Forgot Password?
                    </button>
                  </div>

                  <button type="submit" className="rg-btn rg-btn-primary" style={{ width: '100%' }} disabled={loading || !!emailError}>
                    {loading ? <><span className="rg-spinner" /> Signing in…</> : <>Sign In <ArrowRight size={18} /></>}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="rg-divider" style={{ marginTop: '1.5rem' }}>or continue with</div>
            <div className="rg-google">
              <GoogleLogin
                onSuccess={credentialResponse => handleGoogleLogin(credentialResponse.credential)}
                onError={() => showToast('Google sign-in failed', 'error')}
                useOneTap={false}
                text="continue_with"
                shape="pill"
                theme="outline"
                size="large"
                width="320"
              />
            </div>

            <p className="lg-or">{t('dontHaveAccount')}</p>
            <button type="button" className="rg-btn rg-btn-ghost lg-create" onClick={() => navigate('/?register=true')}>
              {t('createAccount')}
            </button>
          </motion.section>
        </div>

        {createPortal(
          <AnimatePresence>
            {toast && (
              <motion.div key="toast" className={`rg-toast is-${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}
                initial={{ x: 120, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 120, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}>
                <span className="rg-toast-icon">{toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}</span>
                <span>{toast.message}</span>
                {toast.type !== 'success' && (
                  <button type="button" className="rg-toast-close" onClick={() => setToast(null)} aria-label="Dismiss"><X size={16} /></button>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}

        {/* ── Reset password dialog ── */}
        {createPortal(
          <AnimatePresence>
            {showForgot && (
              <motion.div key="forgot" className="rg-modal-overlay rg-portal"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onMouseDown={e => { if (e.target === e.currentTarget) resetForgotModal(); }}>
                <motion.div className="rg-modal rg-modal--narrow" role="dialog" aria-modal="true" aria-labelledby="lg-reset-title"
                  initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }}
                  transition={{ duration: 0.35, ease: EASE }}>
                  <header className="rg-modal-head">
                    <h3 id="lg-reset-title"><Key size={18} /> Reset Password</h3>
                    <p>{otpSent ? 'Enter the code and choose a new password.' : "We'll send you a one-time code."}</p>
                    <button type="button" className="rg-icon-btn" onClick={resetForgotModal} aria-label="Close"><X size={18} /></button>
                  </header>

                  <div className="rg-modal-body">
                    {modalError && <div className="rg-alert" role="alert"><AlertTriangle size={17} /> {modalError}</div>}

                    {!otpSent ? (
                      <>
                        <div style={{ marginBottom: '1.1rem' }}>
                          <Seg id="lg-reset-channel" value={resetChannel}
                            options={[{ key: 'email', label: 'Via Email' }, { key: 'phone', label: 'Via Phone' }]}
                            onChange={key => { setResetChannel(key); setModalError(''); }} />
                        </div>
                        {resetChannel === 'phone' ? (
                          <div className="rg-field">
                            <label className="rg-label" htmlFor="lg-reset-phone">Mobile number</label>
                            <div className="rg-inline">
                              <span className="rg-prefix" aria-hidden="true" style={{ color: 'rgba(255,240,230,0.74)' }}>+91</span>
                              <input id="lg-reset-phone" type="tel" inputMode="numeric" className="rg-input rg-input--prefixed"
                                value={forgotPhone} maxLength={10} placeholder="10-digit mobile number"
                                onChange={e => { setForgotPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setModalError(''); }} />
                            </div>
                          </div>
                        ) : (
                          <div className="rg-field">
                            <label className="rg-label" htmlFor="lg-reset-email">Email address</label>
                            <input id="lg-reset-email" type="email" className="rg-input" autoComplete="email"
                              value={forgotEmail} placeholder="your@email.com"
                              onChange={e => { setForgotEmail(e.target.value); setModalError(''); }} />
                          </div>
                        )}
                        <button type="button" className="rg-btn rg-btn-primary" style={{ width: '100%' }} onClick={sendOtp}
                          disabled={otpSending || (resetChannel === 'phone' ? forgotPhone.length !== 10 : !forgotEmail)}>
                          {otpSending ? 'Sending…' : 'Send OTP'}
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="rg-modal-text">
                          Code sent to <strong>{resetChannel === 'phone' ? `+91 ${forgotPhone}` : forgotEmail}</strong>.
                        </p>
                        <div className="rg-field">
                          <label className="rg-label" htmlFor="lg-reset-otp">6-digit code</label>
                          <input id="lg-reset-otp" className="rg-input rg-otp-input" inputMode="numeric" autoComplete="one-time-code"
                            value={otp} placeholder="••••••" maxLength={6}
                            onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setModalError(''); }} />
                          <button type="button" className="rg-link-btn" style={{ marginTop: '0.6rem' }}
                            onClick={() => { setOtp(''); setModalError(''); sendOtp(); }} disabled={otpSending}>
                            {otpSending ? 'Resending…' : 'Resend OTP'}
                          </button>
                        </div>
                        <div className="rg-field">
                          <label className="rg-label" htmlFor="lg-new-pw">New password</label>
                          <input id="lg-new-pw" type="password" className="rg-input" autoComplete="new-password"
                            value={newPw} placeholder="Strong password"
                            onChange={e => { setNewPw(e.target.value); setModalError(''); }} />
                          <ul className="rg-reqs">
                            {passwordRequirements.map(req => {
                              const met = req.test(newPw);
                              return (
                                <li key={req.label} className={met ? 'is-met' : ''}>
                                  {met ? <Check size={12} strokeWidth={3} /> : <span className="rg-dot" />} {req.label}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                        <div className="rg-field">
                          <label className="rg-label" htmlFor="lg-confirm-pw">Confirm password</label>
                          <input id="lg-confirm-pw" type="password" className="rg-input" autoComplete="new-password"
                            value={confirmPw} placeholder="Repeat password"
                            onChange={e => { setConfirmPw(e.target.value); setModalError(''); }} />
                        </div>
                        <div className="rg-actions" style={{ marginTop: '0.5rem' }}>
                          <button type="button" className="rg-btn rg-btn-ghost"
                            onClick={() => { setOtpSent(false); setOtp(''); setNewPw(''); setConfirmPw(''); setResetSessionId(''); setModalError(''); }}>
                            Back
                          </button>
                          <button type="button" className="rg-btn rg-btn-primary" onClick={resetPassword} disabled={resetting}>
                            {resetting ? 'Resetting…' : 'Reset Password'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
      </div>
    </MotionConfig>
  );
};

export default Login;
