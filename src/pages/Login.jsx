import React, { useState } from 'react';
import useSEO from '../hooks/useSEO';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Key, ArrowRight, CheckCircle, Circle, Phone } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import api from '../utils/api';
import { useLanguage } from '../i18n/LanguageContext';

const passwordRequirements = [
  { label: 'At least 8 characters', test: pw => pw.length >= 8 },
  { label: 'One uppercase letter', test: pw => /[A-Z]/.test(pw) },
  { label: 'One lowercase letter', test: pw => /[a-z]/.test(pw) },
  { label: 'One number',            test: pw => /\d/.test(pw) },
  { label: 'One special character', test: pw => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw) },
];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
      const msg = err.response?.data?.message || err.message;
      if (msg?.includes('not configured')) {
        showToast('Login with OTP isn\'t available yet. Please use your password.', 'error');
        setLoginMethod('password');
      } else {
        setLoginPhoneError('Failed to send OTP: ' + msg);
      }
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

  // ── Styles ──
  const inputStyle = (hasError) => ({
    width: '100%', padding: '0.9rem 1rem 0.9rem 2.75rem',
    border: `1.5px solid ${hasError ? 'var(--error)' : 'var(--border-strong)'}`,
    borderRadius: 'var(--radius-sm)', fontSize: '0.95rem',
    fontFamily: 'Inter, sans-serif', outline: 'none',
    background: 'var(--background)', color: 'var(--text)',
    transition: 'all 0.2s',
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FF6B35 0%, #E55A2B 40%, #2D1B69 100%)',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: `${80 + i * 40}px`, height: `${80 + i * 40}px`,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
              left: `${10 + i * 15}%`, top: `${5 + i * 12}%`,
            }}
            animate={{ y: [0, -15, 0], rotate: [0, 360] }}
            transition={{ duration: 6 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
          />
        ))}
      </div>

      {/* Left panel — branding (desktop only) */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '3rem 2rem', color: 'white',
        display: 'none',
      }} className="login-left-panel">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          style={{ maxWidth: 420, textAlign: 'center' }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ color: 'white', fontSize: '2rem', marginBottom: '1rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Welcome to Festive Guest
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', lineHeight: 1.7 }}>
            India's platform for meaningful stays during festivals, business trips, and life events.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginTop: '2rem', textAlign: 'left' }}>
            {['Verified local hosts across 20+ states', 'Safe, authentic cultural experiences', '100% free to join and connect'].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem' }}>
                <CheckCircle size={18} color="#FFD700" />
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: '0 0 auto', width: '100%', maxWidth: '480px',
        margin: 'auto',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem 1.5rem',
        minHeight: '100vh',
      }}>
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ x: 120, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 120, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              style={{
                position: 'fixed', top: '1.5rem', right: '1.5rem',
                padding: '0.875rem 1.25rem',
                background: toast.type === 'success' ? '#ecfdf5' : '#fef2f2',
                borderRadius: 'var(--radius)', zIndex: 9999,
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                maxWidth: '320px', fontSize: '0.875rem',
                borderLeft: `4px solid ${toast.type === 'success' ? '#10b981' : '#ef4444'}`,
              }}
            >
              <span>{toast.type === 'success' ? '✅' : '❌'}</span>
              <span style={{ fontWeight: 500, color: 'var(--text)' }}>{toast.message}</span>
              {toast.type !== 'success' && (
                <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginLeft: 'auto', padding: 0, fontSize: '1rem', lineHeight: 1 }}>×</button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            background: 'white',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.22)',
            padding: '2.5rem 2rem',
            width: '100%',
          }}
        >
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
              style={{
                width: 72, height: 72,
                background: 'var(--gradient-primary)',
                borderRadius: '1.25rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', margin: '0 auto 1.25rem',
                boxShadow: '0 8px 24px rgba(255,107,53,0.3)',
              }}
            >
              🎉
            </motion.div>
            <h1 style={{ margin: '0 0 0.3rem', fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'var(--text)' }}>
              Welcome Back
            </h1>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', margin: 0 }}>Sign in to your Festive Guest account</p>
          </div>

          {/* Login method toggle */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: 'var(--background)', borderRadius: 'var(--radius-sm)', padding: '0.25rem' }}>
            {[{ key: 'password', label: 'Password' }, { key: 'phone', label: 'Phone OTP' }].map(m => (
              <button key={m.key} type="button"
                onClick={() => { setLoginMethod(m.key); setLoginPhoneError(''); }}
                style={{
                  flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.2s', boxShadow: 'none',
                  background: loginMethod === m.key ? 'white' : 'transparent',
                  color: loginMethod === m.key ? 'var(--primary)' : 'var(--text-muted)',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {loginMethod === 'phone' ? (
            <div style={{ opacity: loading ? 0.65 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.875rem', color: 'var(--text)' }}>
                  Phone Number
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={loginPhone} maxLength={10} disabled={loginPhoneOtpSent}
                    onChange={e => { setLoginPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setLoginPhoneError(''); }}
                    style={{ ...inputStyle(!!loginPhoneError), background: loginPhoneOtpSent ? '#f8fafc' : 'var(--background)' }}
                  />
                </div>
                {loginPhoneError && <p style={{ margin: '0.35rem 0 0', color: 'var(--error)', fontSize: '0.78rem' }}>⚠️ {loginPhoneError}</p>}
              </div>

              {loginPhoneOtpSent && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.875rem', color: 'var(--text)' }}>
                    6-digit OTP
                  </label>
                  <input type="text" value={loginPhoneOtp}
                    onChange={e => { setLoginPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setLoginPhoneError(''); }}
                    placeholder="000000" maxLength={6}
                    style={{ ...inputStyle(false), letterSpacing: '0.3em', textAlign: 'center' }}
                  />
                </div>
              )}

              <motion.button
                type="button"
                className="btn btn-primary"
                disabled={loading || loginPhoneOtpSending}
                onClick={loginPhoneOtpSent ? loginWithPhoneOtp : sendLoginPhoneOtp}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {loginPhoneOtpSent ? (loading ? 'Signing in…' : 'Verify & Sign In') : (loginPhoneOtpSending ? 'Sending…' : 'Send OTP')}
              </motion.button>
              {loginPhoneOtpSent && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                  <button type="button" onClick={() => { setLoginPhoneOtp(''); sendLoginPhoneOtp(); }} disabled={loginPhoneOtpSending}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, padding: 0, boxShadow: 'none', opacity: loginPhoneOtpSending ? 0.5 : 1 }}>
                    {loginPhoneOtpSending ? 'Resending…' : 'Resend OTP'}
                  </button>
                  <button type="button" onClick={() => { setLoginPhoneOtpSent(false); setLoginPhoneOtp(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '0.8rem', padding: 0, boxShadow: 'none' }}>
                    Use a different number
                  </button>
                </div>
              )}
            </div>
          ) : (
          <form onSubmit={handleLogin} style={{ opacity: loading ? 0.65 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
            {/* Email */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.875rem', color: 'var(--text)' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); validateEmail(e.target.value); }}
                  onBlur={e => validateEmail(e.target.value)}
                  required
                  style={inputStyle(!!emailError)}
                  onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.1)'; e.target.style.background = 'white'; }}
                  onBlurCapture={e => { e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--background)'; }}
                />
              </div>
              <AnimatePresence>
                {emailError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ margin: '0.35rem 0 0', color: 'var(--error)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    ⚠️ {emailError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.875rem', color: 'var(--text)' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ ...inputStyle(false), paddingRight: '3rem' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.1)'; e.target.style.background = 'white'; }}
                  onBlur={e => { e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--background)'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0, boxShadow: 'none' }}
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Forgot password link */}
            <div style={{ textAlign: 'right', marginBottom: '1.25rem', marginTop: '-0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, padding: 0, boxShadow: 'none' }}
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !!emailError}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {loading ? (
                <>
                  <div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Signing in…
                </>
              ) : (
                <> Sign In <ArrowRight size={18} /> </>
              )}
            </motion.button>
          </form>
          )}

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0 1rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>or continue with</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          {/* Google Sign-In — OpenID Connect (id_token) */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <GoogleLogin
              onSuccess={credentialResponse => handleGoogleLogin(credentialResponse.credential)}
              onError={() => showToast('Google sign-in failed', 'error')}
              useOneTap={false}
              text="continue_with"
              shape="rectangular"
              theme="outline"
              size="large"
              width="320"
            />
          </div>

          {/* Register link */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
              {t('dontHaveAccount')}
            </p>
            <motion.button
              onClick={() => navigate('/?register=true')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%', padding: '0.875rem',
                background: 'var(--background)',
                border: '2px solid var(--primary)',
                borderRadius: 'var(--radius)',
                color: 'var(--primary)',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif',
                boxShadow: 'none',
              }}
            >
              {t('createAccount')}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* ── Forgot Password Modal ── */}
      <AnimatePresence>
        {showForgot && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={resetForgotModal}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '420px' }}
            >
              <div className="modal-header">
                <h3><Key size={18} /> Reset Password</h3>
                <button className="modal-close" onClick={resetForgotModal}>×</button>
              </div>
              <div className="modal-body">
                {!otpSent && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', background: 'var(--background)', borderRadius: 'var(--radius-sm)', padding: '0.25rem' }}>
                    {[{ key: 'email', label: 'Via Email' }, { key: 'phone', label: 'Via Phone' }].map(c => (
                      <button key={c.key} type="button"
                        onClick={() => { setResetChannel(c.key); setModalError(''); }}
                        style={{
                          flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                          fontWeight: 600, fontSize: '0.82rem', boxShadow: 'none',
                          background: resetChannel === c.key ? 'white' : 'transparent',
                          color: resetChannel === c.key ? 'var(--primary)' : 'var(--text-muted)',
                        }}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
                <AnimatePresence>
                  {modalError && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{ background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--error)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}
                    >
                      ⚠️ {modalError}
                    </motion.div>
                  )}
                </AnimatePresence>

                {!otpSent ? (
                  <div>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                      {resetChannel === 'phone' ? 'Enter your phone number to receive a password reset OTP.' : 'Enter your email to receive a password reset OTP.'}
                    </p>
                    {resetChannel === 'phone' ? (
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input type="tel" className="form-control" value={forgotPhone} maxLength={10}
                          onChange={e => { setForgotPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setModalError(''); }} placeholder="10-digit mobile number" />
                      </div>
                    ) : (
                      <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" className="form-control" value={forgotEmail} onChange={e => { setForgotEmail(e.target.value); setModalError(''); }} placeholder="your@email.com" />
                      </div>
                    )}
                    <button
                      onClick={sendOtp}
                      disabled={otpSending || (resetChannel === 'phone' ? forgotPhone.length !== 10 : !forgotEmail)}
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '0.8rem' }}
                    >
                      {otpSending ? 'Sending…' : 'Send OTP'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                      OTP sent to <strong>{resetChannel === 'phone' ? forgotPhone : forgotEmail}</strong>. Enter it below with your new password.
                    </p>
                    <div className="form-group">
                      <label>6-digit OTP</label>
                      <input
                        type="text" className="form-control"
                        value={otp}
                        onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setModalError(''); }}
                        placeholder="000000" maxLength={6}
                        style={{ letterSpacing: '0.3em', textAlign: 'center', fontSize: '1.2rem' }}
                      />
                      <button type="button" onClick={() => { setOtp(''); setModalError(''); sendOtp(); }} disabled={otpSending}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, marginTop: '0.5rem', padding: 0, boxShadow: 'none', opacity: otpSending ? 0.5 : 1 }}>
                        {otpSending ? 'Resending…' : 'Resend OTP'}
                      </button>
                    </div>
                    <div className="form-group">
                      <label>New Password</label>
                      <input type="password" className="form-control" value={newPw} onChange={e => { setNewPw(e.target.value); setModalError(''); }} placeholder="Strong password" />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', marginTop: '0.75rem' }}>
                        {passwordRequirements.map((req, i) => (
                          <div key={i} style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: req.test(newPw) ? '#16a34a' : 'var(--text-muted)', transition: 'color 0.2s' }}>
                            {req.test(newPw) ? <CheckCircle size={12} /> : <Circle size={12} />}
                            {req.label}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Confirm Password</label>
                      <input type="password" className="form-control" value={confirmPw} onChange={e => { setConfirmPw(e.target.value); setModalError(''); }} placeholder="Repeat password" />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        onClick={() => { setOtpSent(false); setOtp(''); setNewPw(''); setConfirmPw(''); setResetSessionId(''); setModalError(''); }}
                        className="btn btn-outline"
                        style={{ flex: 1, padding: '0.75rem' }}
                      >
                        Back
                      </button>
                      <button
                        onClick={resetPassword}
                        disabled={resetting}
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '0.75rem' }}
                      >
                        {resetting ? 'Resetting…' : 'Reset Password'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 900px) {
          .login-left-panel { display: flex !important; }
          .login-right { max-width: 440px !important; }
        }
      `}</style>
    </div>
  );
};

export default Login;
