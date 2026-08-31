import React, { useState, useEffect } from 'react';
import useSEO from '../hooks/useSEO';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import api from '../utils/api';
import locationService from '../utils/locationService';

const Registration = ({ setUser }) => {
  useSEO({ title: 'Join FestiveGuest', description: 'Create your FestiveGuest account as a traveller or local host.' });
  const navigate = useNavigate();
  const location = useLocation();

  const [currentStep, setCurrentStep] = useState(1);
  const [locationData, setLocationData] = useState({});

  const [formData, setFormData] = useState({
    userId: crypto.randomUUID(),
    name: '',
    email: '',
    password: '',
    phone: '',
    state: '',
    city: '',
    otherCity: '',
    bio: '',
    role: 'Guest',
    status: 'Active',
    hostingAreas: [],
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [verificationOTP, setVerificationOTP] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [serverError, setServerError] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [registrationSuccessCountdown, setRegistrationSuccessCountdown] = useState(0);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [showHostingModal, setShowHostingModal] = useState(false);
  const [tempHostingAreas, setTempHostingAreas] = useState([]);
  const [tempCityCount, setTempCityCount] = useState(0);

  const passwordRequirements = [
    { label: 'At least 8 characters', test: pw => pw.length >= 8 },
    { label: 'One uppercase letter', test: pw => /[A-Z]/.test(pw) },
    { label: 'One lowercase letter', test: pw => /[a-z]/.test(pw) },
    { label: 'One number', test: pw => /\d/.test(pw) },
    { label: 'One special character', test: pw => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw) },
  ];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const indianPhoneRegex = /^[6-9]\d{9}$/;

  const validateEmail = email => {
    if (!email) { setEmailError(''); return true; }
    if (!emailRegex.test(email)) { setEmailError('Please enter a valid email address'); return false; }
    setEmailError(''); return true;
  };

  const validatePhone = phone => {
    if (!phone) { setPhoneError(''); return true; }
    const digits = phone.replace(/\D/g, '');
    if (!indianPhoneRegex.test(digits)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number (starting with 6-9)');
      return false;
    }
    setPhoneError(''); return true;
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    const duration = type === 'success' ? 5000 : 4000;
    setTimeout(() => {
      setToast(prev => prev ? { ...prev, hiding: true } : null);
      setTimeout(() => setToast(null), 300);
    }, duration);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    let referralCodeParam = params.get('referralCode') || params.get('ref');
    const disclaimerAcceptedParam = params.get('disclaimerAccepted');

    const pendingCode = sessionStorage.getItem('pendingReferralCode');
    if (pendingCode) { referralCodeParam = pendingCode; sessionStorage.removeItem('pendingReferralCode'); }

    const storedAcceptance = sessionStorage.getItem('disclaimerAcceptance');
    if (!storedAcceptance || !disclaimerAcceptedParam) { navigate('/'); return; }

    try {
      const acceptanceData = JSON.parse(storedAcceptance);
      const timeDiff = Date.now() - acceptanceData.timestamp;
      if (timeDiff > 600000 || acceptanceData.timestamp.toString() !== disclaimerAcceptedParam) {
        sessionStorage.removeItem('disclaimerAcceptance');
        navigate('/');
        return;
      }
    } catch {
      navigate('/'); return;
    }

    if (roleParam === 'Guest' || roleParam === 'Host') setFormData(prev => ({ ...prev, role: roleParam }));
    if (referralCodeParam) setFormData(prev => ({ ...prev, ReferredBy: referralCodeParam.toUpperCase() }));
  }, [location.search, navigate]);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const locations = await locationService.getLocations();
        setLocationData(locations);
      } catch (error) {
        showToast('Failed to load location data', 'error');
      }
    };
    loadLocations();
  }, []);

  const handleEmailChange = e => {
    const newEmail = e.target.value;
    handleInputChange(e);
    validateEmail(newEmail);
    if (newEmail !== verifiedEmail) { setEmailVerified(false); setOtpSent(false); setVerificationOTP(''); }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'state') newData.city = '';
      return newData;
    });
  };

  const handleSubmit = e => {
    e.preventDefault();
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!isGoogleUser && !formData.password.trim()) errors.password = 'Password is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.state) errors.state = 'State is required';
    if (!formData.city) errors.city = 'City is required';
    if (!formData.bio.trim()) errors.bio = 'Bio is required';
    if (!ageConfirmed) errors.ageConfirmed = 'You must confirm you are at least 18 years old';
    if (formData.role === 'Host' && !formData.hostingAreas.some(a => a.cities?.length > 0)) {
      errors.hostingAreas = 'Please select at least one hosting area';
      showToast('Hosts must select at least one hosting area', 'error');
    }
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) { showToast('Please fill in all required fields', 'error'); return; }
    registerUser();
  };

  const registerUser = async () => {
    setLoading(true);
    setServerError(null);
    try {
      if (!emailVerified) {
        setServerError('Please verify your email before completing registration.');
        showToast('Please verify your email before registering', 'error');
        setLoading(false);
        return;
      }

      const storedAcceptance = sessionStorage.getItem('disclaimerAcceptance');
      if (!storedAcceptance) {
        showToast('Please accept the disclaimer again', 'error');
        navigate('/'); return;
      }

      try {
        const acceptanceData = JSON.parse(storedAcceptance);
        if (Date.now() - acceptanceData.timestamp > 600000) {
          sessionStorage.removeItem('disclaimerAcceptance');
          showToast('Disclaimer acceptance expired', 'error');
          navigate('/'); return;
        }
      } catch { navigate('/'); return; }

      const finalLocation = formData.city === 'Other' ? formData.otherCity : formData.city;
      const googlePassword = isGoogleUser
        ? Array.from(crypto.getRandomValues(new Uint8Array(18))).map(b => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'[b % 65]).join('')
        : null;
      const payload = {
        email: verifiedEmail,
        password: isGoogleUser ? googlePassword : formData.password,
        name: formData.name,
        phone: formData.phone,
        userType: formData.role,
        location: `${finalLocation}, ${formData.state}`,
        bio: formData.bio,
        ReferredBy: formData.ReferredBy || null,
        hostingAreas: formData.role === 'Host'
          ? (formData.hostingAreas.some(a => a.cities.length > 0) ? JSON.stringify(formData.hostingAreas.filter(a => a.cities.length > 0)) : '')
          : null,
      };

      const res = await api.post('auth/register', payload);
      const userData = res.data;

      if (userData.success || userData.message === 'User registered successfully') {
        sessionStorage.removeItem('disclaimerAcceptance');
        showToast('🎉 Registration successful!', 'success');
        setRegistrationSuccessCountdown(5);
        const countdown = setInterval(() => {
          setRegistrationSuccessCountdown(prev => {
            if (prev <= 1) { clearInterval(countdown); navigate('/login'); return 0; }
            return prev - 1;
          });
        }, 1000);
      } else {
        throw new Error(userData.message || 'Registration failed');
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || error.message;
      if (error.response?.status === 429) {
        const m = 'Too many attempts. Please wait 15 minutes.';
        setServerError(m); showToast(m, 'error');
      } else {
        setServerError(msg); showToast('Registration failed: ' + msg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const sendRegistrationOtp = async () => {
    if (!formData.email) { showToast('Please enter an email address first', 'error'); return; }
    setOtpSending(true);
    try {
      const res = await api.post('email/send-otp', { email: formData.email, purpose: 'registration' });
      if (res.data.success) { setOtpSent(true); setRegisteredEmail(formData.email); showToast('OTP sent to your email', 'success'); }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      showToast('Failed to send OTP: ' + msg, 'error');
    } finally {
      setOtpSending(false);
    }
  };

  const verifyRegistrationOtp = async () => {
    if (!verificationOTP || verificationOTP.length !== 6) { setOtpError('Please enter a valid 6-digit OTP'); return; }
    setLoading(true); setOtpError('');
    try {
      const res = await api.post('email/validate-otp', { email: formData.email, otpCode: verificationOTP });
      if (res.data.success) {
        setVerifiedEmail(formData.email); setEmailVerified(true); setOtpSent(false); setVerificationOTP(''); setOtpError('');
        showToast(res.data?.message || 'Email verified', 'success');
      }
    } catch (err) {
      setOtpError('Verification failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const [isGoogleUser, setIsGoogleUser] = useState(false);

  const handleGoogleVerify = async idToken => {
    try {
      const res = await api.post('auth/google-verify', { idToken });
      if (res?.data?.success) {
        const { email, name } = res.data;
        setFormData(prev => ({ ...prev, name: name || prev.name, email }));
        setVerifiedEmail(email);
        setEmailVerified(true);
        setIsGoogleUser(true);
        showToast('Google account verified! Please complete your profile.', 'success');
      } else {
        showToast(res.data?.message || 'Google verification failed', 'error');
      }
    } catch (err) {
      showToast('Google verification failed: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  // ── Style helpers ──
  const labelStyle = { display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' };
  const inputStyle = hasError => ({
    width: '100%', padding: '0.875rem 1rem',
    border: `1.5px solid ${hasError ? 'var(--error)' : 'var(--border-strong)'}`,
    borderRadius: 'var(--radius-sm)', fontSize: '0.95rem',
    fontFamily: 'Inter, sans-serif', outline: 'none',
    background: 'var(--background)', color: 'var(--text)',
    transition: 'all 0.2s', boxSizing: 'border-box',
  });
  const errorStyle = { margin: '0.35rem 0 0', color: 'var(--error)', fontSize: '0.78rem' };

  const steps = [{ num: 1, label: 'Account' }, { num: 2, label: 'Profile' }, { num: 3, label: 'Confirm' }];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FF6B35 0%, #E55A2B 40%, #2D1B69 100%)',
      display: 'flex', position: 'relative', overflow: 'hidden',
      padding: '2rem 1.5rem', alignItems: 'flex-start',
    }}>

      {/* Background decoration */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(6)].map((_, i) => (
          <motion.div key={i}
            style={{ position: 'absolute', width: `${80 + i * 40}px`, height: `${80 + i * 40}px`, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', left: `${10 + i * 15}%`, top: `${5 + i * 12}%` }}
            animate={{ y: [0, -15, 0], rotate: [0, 360] }}
            transition={{ duration: 6 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
          />
        ))}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ x: 120, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 120, opacity: 0 }}
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
            <span style={{ fontWeight: 500, color: 'var(--text)' }}>
              {toast.message}
              {registrationSuccessCountdown > 0 && (
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Redirecting in {registrationSuccessCountdown}s…
                </span>
              )}
            </span>
            {toast.type !== 'success' && (
              <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginLeft: 'auto', padding: 0, fontSize: '1.1rem' }}>×</button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Server error banner */}
      {serverError && (
        <div style={{ position: 'fixed', top: '5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 9998, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius)', maxWidth: '480px', width: '90%', fontSize: '0.875rem' }}>
          ⚠️ {serverError}
        </div>
      )}

      {/* Main card */}
      <div style={{ margin: 'auto', width: '100%', maxWidth: '560px', position: 'relative', zIndex: 1, paddingTop: '0.5rem', paddingBottom: '2rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ background: 'white', borderRadius: 'var(--radius-xl)', boxShadow: '0 30px 80px rgba(0,0,0,0.22)', padding: '2.5rem 2rem' }}
        >
          {/* Logo + heading */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
              style={{ width: 64, height: 64, background: 'var(--gradient-primary)', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', margin: '0 auto 1rem', boxShadow: '0 8px 24px rgba(255,107,53,0.3)' }}
            >
              🎉
            </motion.div>
            <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'var(--text)' }}>
              Join Festive Guest
            </h1>
            <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', margin: 0 }}>
              Connect with local hosts across India
            </p>
          </div>

          {/* Google Sign-In */}
          {!isGoogleUser ? (
            <>
              {/* OpenID Connect — id_token for identity verification */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <GoogleLogin
                  onSuccess={credentialResponse => handleGoogleVerify(credentialResponse.credential)}
                  onError={() => showToast('Google sign-in failed', 'error')}
                  useOneTap={false}
                  text="continue_with"
                  shape="rectangular"
                  theme="outline"
                  size="large"
                  width="320"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>or register with email</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem 1rem', background: 'rgba(22,163,74,0.06)', border: '1.5px solid rgba(22,163,74,0.25)', borderRadius: 'var(--radius)', marginBottom: '1.5rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              <div style={{ flex: 1, fontSize: '0.85rem' }}>
                <span style={{ color: '#15803d', fontWeight: 600 }}>✓ Google account verified</span>
                <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{verifiedEmail}</span>
              </div>
              <button type="button" onClick={() => { setIsGoogleUser(false); setEmailVerified(false); setVerifiedEmail(''); setFormData(prev => ({ ...prev, name: '', email: '' })); }}
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-light)', cursor: 'pointer' }}>
                Change
              </button>
            </div>
          )}

          {/* Step indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '2rem' }}>
            {steps.map((step, i) => (
              <React.Fragment key={step.num}>
                {i > 0 && (
                  <div style={{ flex: 1, height: '2px', background: currentStep > i ? 'var(--primary)' : 'var(--border)', maxWidth: '64px', minWidth: '20px', marginBottom: '1.25rem', transition: 'background 0.3s' }} />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: currentStep >= step.num ? 'var(--gradient-primary)' : 'var(--border)',
                    color: currentStep >= step.num ? 'white' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.875rem', transition: 'all 0.3s',
                    boxShadow: currentStep >= step.num ? '0 4px 12px rgba(255,107,53,0.35)' : 'none',
                  }}>
                    {currentStep > step.num ? '✓' : step.num}
                  </div>
                  <span style={{ fontSize: '0.68rem', fontWeight: currentStep === step.num ? 700 : 400, color: currentStep === step.num ? 'var(--primary)' : 'var(--text-muted)', whiteSpace: 'nowrap', transition: 'all 0.3s' }}>
                    {step.label}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>

          <form onSubmit={handleSubmit}>

            {/* ── Step 1: Account ── */}
            {currentStep === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>

                {/* Role selector */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={labelStyle}>I want to join as</label>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    {[
                      { value: 'Guest', emoji: '🎒', title: 'Traveler', desc: 'Looking for hosts' },
                      { value: 'Host', emoji: '🏠', title: 'Local Host', desc: 'Welcoming guests' },
                    ].map(role => (
                      <button key={role.value} type="button"
                        onClick={() => setFormData(prev => ({ ...prev, role: role.value }))}
                        style={{
                          flex: 1, padding: '0.875rem 0.5rem', borderRadius: 'var(--radius)',
                          border: `2px solid ${formData.role === role.value ? 'var(--primary)' : 'var(--border)'}`,
                          background: formData.role === role.value ? 'rgba(255,107,53,0.06)' : 'var(--background)',
                          cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
                          boxShadow: formData.role === role.value ? '0 4px 16px rgba(255,107,53,0.15)' : 'none',
                        }}
                      >
                        <div style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>{role.emoji}</div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: formData.role === role.value ? 'var(--primary)' : 'var(--text)', marginBottom: '0.1rem' }}>{role.title}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{role.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Full Name</label>
                  <input type="text" name="name" value={formData.name}
                    onChange={e => { handleInputChange(e); if (validationErrors.name) setValidationErrors(p => ({ ...p, name: '' })); }}
                    placeholder="Enter your full name" required
                    style={inputStyle(!!validationErrors.name)}
                    onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.1)'; e.target.style.background = 'white'; }}
                    onBlur={e => { e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--background)'; }}
                  />
                  {validationErrors.name && <p style={errorStyle}>⚠️ {validationErrors.name}</p>}
                </div>

                {/* Email + OTP */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Email Address</label>
                  <input type="email" name="email" value={formData.email}
                    onChange={e => { handleEmailChange(e); if (validationErrors.email) setValidationErrors(p => ({ ...p, email: '' })); }}
                    onBlur={e => validateEmail(e.target.value)}
                    placeholder="you@example.com" required disabled={emailVerified}
                    style={{ ...inputStyle(!!(emailError || validationErrors.email)), background: emailVerified ? '#f8fafc' : 'var(--background)', cursor: emailVerified ? 'not-allowed' : 'text' }}
                    onFocus={e => { if (!emailVerified) { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.1)'; e.target.style.background = 'white'; } }}
                    onBlurCapture={e => { e.target.style.boxShadow = 'none'; e.target.style.background = emailVerified ? '#f8fafc' : 'var(--background)'; }}
                  />
                  {(emailError || validationErrors.email) && <p style={errorStyle}>⚠️ {emailError || validationErrors.email}</p>}

                  <div style={{ marginTop: '0.625rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {!emailVerified && !otpSent && (
                      <button type="button" onClick={sendRegistrationOtp} disabled={otpSending || !!emailError || !formData.email}
                        style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--gradient-primary)', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', opacity: (otpSending || !!emailError || !formData.email) ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                        {otpSending ? 'Sending…' : 'Send OTP'}
                      </button>
                    )}
                    {otpSent && (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <div>
                          <input type="text" value={verificationOTP}
                            onChange={e => { setVerificationOTP(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError(''); }}
                            placeholder="6-digit OTP" maxLength={6}
                            style={{ padding: '0.5rem 0.75rem', border: `1.5px solid ${otpError ? 'var(--error)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', fontSize: '1rem', letterSpacing: '0.2em', width: '140px', background: 'var(--background)', color: 'var(--text)', outline: 'none' }}
                          />
                          {otpError && <p style={errorStyle}>⚠️ {otpError}</p>}
                        </div>
                        <button type="button" onClick={verifyRegistrationOtp} disabled={loading || verificationOTP.length !== 6}
                          style={{ padding: '0.5rem 0.875rem', borderRadius: 'var(--radius-sm)', background: 'var(--gradient-primary)', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', opacity: (loading || verificationOTP.length !== 6) ? 0.5 : 1 }}>
                          Verify
                        </button>
                      </div>
                    )}
                    {emailVerified && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.875rem' }}>✓ Email verified</span>
                        <button type="button"
                          onClick={() => { setEmailVerified(false); setVerifiedEmail(''); setOtpSent(false); setVerificationOTP(''); }}
                          style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-light)', cursor: 'pointer' }}>
                          Change
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Password — hidden for Google users */}
                {!isGoogleUser && <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password}
                      onChange={e => { handleInputChange(e); if (validationErrors.password) setValidationErrors(p => ({ ...p, password: '' })); }}
                      placeholder="Create a strong password" required
                      style={{ ...inputStyle(!!validationErrors.password), paddingRight: '2.75rem' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.1)'; e.target.style.background = 'white'; }}
                      onBlur={e => { e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--background)'; }}
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}>
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {validationErrors.password && <p style={errorStyle}>⚠️ {validationErrors.password}</p>}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem', marginTop: '0.625rem' }}>
                    {passwordRequirements.map((req, i) => (
                      <div key={i} style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: req.test(formData.password) ? '#16a34a' : 'var(--text-muted)', transition: 'color 0.2s' }}>
                        {req.test(formData.password) ? '✓' : '○'} {req.label}
                      </div>
                    ))}
                  </div>
                </div>}

                {/* Phone */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Phone Number</label>
                  <input type="tel" name="phone" value={formData.phone}
                    onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); handleInputChange({ target: { name: 'phone', value: v } }); validatePhone(v); if (validationErrors.phone) setValidationErrors(p => ({ ...p, phone: '' })); }}
                    onBlur={e => validatePhone(e.target.value)}
                    placeholder="10-digit mobile number" required maxLength={10}
                    style={inputStyle(!!(phoneError || validationErrors.phone))}
                    onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.1)'; e.target.style.background = 'white'; }}
                    onBlurCapture={e => { e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--background)'; }}
                  />
                  {(phoneError || validationErrors.phone) && <p style={errorStyle}>⚠️ {phoneError || validationErrors.phone}</p>}
                </div>

                {/* Age confirmation */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                    padding: '1rem', borderRadius: 'var(--radius)',
                    background: validationErrors.ageConfirmed ? '#fef2f2' : 'rgba(255,107,53,0.05)',
                    border: `1.5px solid ${validationErrors.ageConfirmed ? 'var(--error)' : 'rgba(255,107,53,0.2)'}`,
                    transition: 'all 0.2s',
                  }}>
                    <input type="checkbox" id="ageConfirm" checked={ageConfirmed}
                      onChange={e => { setAgeConfirmed(e.target.checked); if (validationErrors.ageConfirmed) setValidationErrors(p => ({ ...p, ageConfirmed: '' })); }}
                      style={{ marginTop: '0.2rem', width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--primary)', flexShrink: 0 }}
                    />
                    <label htmlFor="ageConfirm" style={{ fontWeight: 600, color: 'var(--text)', cursor: 'pointer', lineHeight: 1.5, fontSize: '0.875rem' }}>
                      I confirm I am at least <strong style={{ color: 'var(--primary)' }}>18 years old</strong> and can enter legally binding agreements.
                    </label>
                  </div>
                  {validationErrors.ageConfirmed && <p style={errorStyle}>⚠️ {validationErrors.ageConfirmed}</p>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const errors = {};
                      if (!formData.name.trim()) errors.name = 'Name is required';
                      if (!formData.email.trim() || !emailVerified) errors.email = emailVerified ? 'Email is required' : 'Please verify your email';
                      if (!isGoogleUser && (!formData.password.trim() || !passwordRequirements.every(r => r.test(formData.password)))) errors.password = 'Password must meet all requirements';
                      if (!formData.phone.trim() || phoneError) errors.phone = phoneError || 'Phone number is required';
                      if (!ageConfirmed) errors.ageConfirmed = 'You must confirm you are at least 18 years old';
                      setValidationErrors(prev => ({ ...prev, ...errors }));
                      if (Object.keys(errors).length > 0) { showToast('Please complete all required fields', 'error'); return; }
                      setCurrentStep(2);
                    }}
                    style={{ padding: '0.875rem 2rem', background: 'var(--gradient-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}
                  >
                    Next: Profile <ArrowRight size={18} />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Profile ── */}
            {currentStep === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>

                {/* State */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={labelStyle}>State</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {Object.keys(locationData || {}).map(state => (
                      <button key={state} type="button"
                        onClick={() => { setFormData(prev => ({ ...prev, state, city: '' })); if (validationErrors.state) setValidationErrors(p => ({ ...p, state: '' })); }}
                        style={{ padding: '0.45rem 0.875rem', borderRadius: 'var(--radius-sm)', border: `1.5px solid ${formData.state === state ? 'var(--primary)' : 'var(--border)'}`, background: formData.state === state ? 'rgba(255,107,53,0.08)' : 'var(--surface)', color: formData.state === state ? 'var(--primary)' : 'var(--text)', fontWeight: formData.state === state ? 700 : 500, fontSize: '0.825rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                        {state}
                      </button>
                    ))}
                  </div>
                  {validationErrors.state && <p style={errorStyle}>⚠️ {validationErrors.state}</p>}
                </div>

                {/* City */}
                {formData.state && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={labelStyle}>City</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                      {(locationData[formData.state] || []).map(city => (
                        <button key={city} type="button"
                          onClick={() => { setFormData(prev => ({ ...prev, city })); if (validationErrors.city) setValidationErrors(p => ({ ...p, city: '' })); }}
                          style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', border: `1.5px solid ${formData.city === city ? 'var(--primary)' : 'var(--border)'}`, background: formData.city === city ? 'var(--primary)' : 'var(--surface)', color: formData.city === city ? 'white' : 'var(--text)', fontSize: '0.8rem', fontWeight: formData.city === city ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s', boxShadow: formData.city === city ? '0 3px 10px rgba(255,107,53,0.25)' : 'none' }}>
                          {city}
                        </button>
                      ))}
                    </div>
                    {validationErrors.city && <p style={errorStyle}>⚠️ {validationErrors.city}</p>}
                  </div>
                )}

                {formData.city === 'Other' && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={labelStyle}>Your City Name</label>
                    <input type="text" name="otherCity" value={formData.otherCity} onChange={handleInputChange} placeholder="Enter city name"
                      style={inputStyle(false)}
                      onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.1)'; e.target.style.background = 'white'; }}
                      onBlur={e => { e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--background)'; }}
                    />
                  </div>
                )}

                {/* Bio */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={labelStyle}>
                    {formData.role === 'Host' ? 'What You Offer as a Host' : "What You're Looking For"}
                  </label>
                  <textarea name="bio" value={formData.bio}
                    onChange={e => { handleInputChange(e); if (validationErrors.bio) setValidationErrors(p => ({ ...p, bio: '' })); }}
                    placeholder={formData.role === 'Host' ? 'Describe what you offer to travelers (accommodation, local experiences, cultural insights…)' : "Tell hosts what you're looking for (cultural exchange, business travel, local food, festivals…)"}
                    required rows={3} maxLength={250}
                    style={{ ...inputStyle(!!validationErrors.bio), resize: 'vertical', minHeight: '88px', paddingLeft: '1rem', fontFamily: 'Inter, sans-serif' }}
                    onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.1)'; e.target.style.background = 'white'; }}
                    onBlur={e => { e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--background)'; }}
                  />
                  {validationErrors.bio && <p style={errorStyle}>⚠️ {validationErrors.bio}</p>}
                  <p style={{ textAlign: 'right', fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>{formData.bio.length}/250</p>
                </div>

                {/* Hosting areas (Host only) */}
                {formData.role === 'Host' && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={labelStyle}>
                      Areas Where You Can Host{' '}
                      <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(up to 3 states)</span>
                    </label>
                    <button type="button"
                      onClick={() => { const c = [...formData.hostingAreas]; setTempHostingAreas(c); setTempCityCount(c.reduce((t, a) => t + a.cities.length, 0)); setShowHostingModal(true); }}
                      style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: 'var(--radius)', border: `1.5px solid ${validationErrors.hostingAreas ? 'var(--error)' : 'var(--border)'}`, background: 'var(--surface)', color: 'var(--text)', fontWeight: 500, cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem', transition: 'all 0.2s' }}>
                      🗺️ Select Hosting Areas ({formData.hostingAreas.reduce((t, a) => t + a.cities.length, 0)} cities selected)
                    </button>
                    {validationErrors.hostingAreas && <p style={errorStyle}>⚠️ {validationErrors.hostingAreas}</p>}
                    {formData.hostingAreas.some(a => a.cities.length > 0) && (
                      <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 'var(--radius-sm)' }}>
                        {formData.hostingAreas.filter(a => a.cities.length > 0).map(area => (
                          <div key={area.state} style={{ fontSize: '0.825rem', color: '#15803d', marginBottom: '0.125rem' }}>
                            <strong>{area.state}:</strong> {area.cities.join(', ')}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Referral */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={labelStyle}>
                    Referral Code{' '}
                    <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
                  </label>
                  <input type="text" name="ReferredBy" value={formData.ReferredBy || ''}
                    onChange={e => setFormData(prev => ({ ...prev, ReferredBy: e.target.value.toUpperCase() }))}
                    placeholder="Friend's referral code"
                    style={inputStyle(false)}
                    onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.1)'; e.target.style.background = 'white'; }}
                    onBlur={e => { e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--background)'; }}
                  />
                  {formData.ReferredBy && (
                    <p style={{ fontSize: '0.75rem', color: '#16a34a', margin: '0.25rem 0 0' }}>✓ Referral code applied: {formData.ReferredBy}</p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <motion.button type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => setCurrentStep(1)}
                    style={{ padding: '0.875rem 1.5rem', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                    ← Back
                  </motion.button>
                  <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const errors = {};
                      if (!formData.state) errors.state = 'State is required';
                      if (!formData.city) errors.city = 'City is required';
                      if (!formData.bio.trim()) errors.bio = 'Description is required';
                      if (formData.role === 'Host' && !formData.hostingAreas.some(a => a.cities?.length > 0)) errors.hostingAreas = 'Please select at least one hosting area';
                      setValidationErrors(prev => ({ ...prev, ...errors }));
                      if (Object.keys(errors).length > 0) { showToast('Please complete all required fields', 'error'); return; }
                      setCurrentStep(3);
                    }}
                    style={{ flex: 1, padding: '0.875rem 2rem', background: 'var(--gradient-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                    Next: Confirm <ArrowRight size={18} />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Confirm ── */}
            {currentStep === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>

                {/* Review summary */}
                <div style={{ background: 'rgba(255,107,53,0.04)', border: '1px solid rgba(255,107,53,0.15)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1rem' }}>
                  <p style={{ margin: '0 0 0.875rem', fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>Review your details</p>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {[
                      { label: 'Name', value: formData.name },
                      { label: 'Email', value: verifiedEmail + ' ✓' },
                      { label: 'Phone', value: formData.phone },
                      { label: 'Role', value: formData.role === 'Host' ? '🏠 Local Host' : '🎒 Traveler' },
                      { label: 'Location', value: formData.city && formData.state ? `${formData.city === 'Other' ? formData.otherCity : formData.city}, ${formData.state}` : '—' },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--text-muted)', minWidth: '72px', flexShrink: 0 }}>{row.label}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', padding: '0.875rem', background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 'var(--radius)', fontSize: '0.825rem', color: '#15803d', alignItems: 'flex-start' }}>
                  <span style={{ flexShrink: 0, marginTop: '0.05rem' }}>✓</span>
                  <span>Age confirmed (18+) · Terms &amp; Privacy accepted · Email verified</span>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <motion.button type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => setCurrentStep(2)}
                    style={{ padding: '0.875rem 1.5rem', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                    ← Back
                  </motion.button>
                  <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    disabled={loading || registrationSuccessCountdown > 0}
                    style={{ flex: 1, padding: '0.9rem 2rem', background: 'var(--gradient-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: (loading || registrationSuccessCountdown > 0) ? 0.65 : 1, fontSize: '0.95rem' }}>
                    {loading ? (
                      <><div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Registering…</>
                    ) : registrationSuccessCountdown > 0 ? (
                      <>🎉 Redirecting in {registrationSuccessCountdown}s</>
                    ) : (
                      <>Create Account <CheckCircle size={18} /></>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}

          </form>

          {/* Sign-in link */}
          <div style={{ textAlign: 'center', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>Already have an account? </span>
            <motion.button onClick={() => navigate('/login')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', padding: 0 }}>
              Sign In →
            </motion.button>
          </div>

        </motion.div>
      </div>

      {/* ── Hosting Areas Modal ── */}
      {showHostingModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,8,0,0.55)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
          onClick={() => setShowHostingModal(false)}
        >
          <div
            style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: '0 30px 80px rgba(0,0,0,0.22)', maxWidth: '680px', width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text)' }}>🗺️ Select Hosting Areas</h3>
              <button onClick={() => setShowHostingModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-muted)', lineHeight: 1, padding: 0 }}>×</button>
            </div>
            <div style={{ overflowY: 'auto', padding: '1.25rem 1.5rem', flex: 1 }}>
              {Object.entries(locationData || {}).map(([state, cities]) => {
                const selectedCities = tempHostingAreas.find(a => a.state === state)?.cities || [];
                return (
                  <div key={state} style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.825rem', color: 'var(--text)', marginBottom: '0.5rem', paddingBottom: '0.25rem', borderBottom: '1px solid var(--border)' }}>{state}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                      {cities.map(city => {
                        const selected = selectedCities.includes(city);
                        return (
                          <button key={city} type="button"
                            onClick={() => {
                              const newAreas = [...tempHostingAreas];
                              const idx = newAreas.findIndex(a => a.state === state);
                              if (idx >= 0) {
                                if (selected) {
                                  newAreas[idx].cities = newAreas[idx].cities.filter(c => c !== city);
                                  if (newAreas[idx].cities.length === 0) newAreas.splice(idx, 1);
                                } else {
                                  newAreas[idx].cities.push(city);
                                }
                              } else {
                                if (newAreas.length >= 3) { showToast('Free users can select up to 3 hosting areas only', 'error'); return; }
                                newAreas.push({ state, cities: [city] });
                              }
                              setTempHostingAreas(newAreas);
                              setTempCityCount(newAreas.reduce((t, a) => t + a.cities.length, 0));
                            }}
                            style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', border: `1.5px solid ${selected ? 'var(--primary)' : 'var(--border)'}`, background: selected ? 'var(--primary)' : 'var(--surface)', color: selected ? 'white' : 'var(--text)', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s', fontWeight: selected ? 600 : 400 }}>
                            {city}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setFormData(prev => ({ ...prev, hostingAreas: tempHostingAreas })); setShowHostingModal(false); }}
                style={{ padding: '0.75rem 2rem', background: 'var(--gradient-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                ✓ Done ({tempCityCount} cities selected)
              </motion.button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Registration;
