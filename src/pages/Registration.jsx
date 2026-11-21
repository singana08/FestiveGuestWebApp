import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useSEO from '../hooks/useSEO';
import {
  motion, AnimatePresence, MotionConfig,
  useMotionValue, useSpring, useTransform, useReducedMotion,
} from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Eye, EyeOff, ArrowRight, ArrowLeft, Check, CheckCircle2, Mail, Smartphone,
  ShieldCheck, Gift, Map as MapIcon, X, Sparkles, AlertTriangle, MessageCircle, Lock,
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import api from '../utils/api';
import locationService from '../utils/locationService';
import '../styles/Register.css';

const EASE = [0.22, 1, 0.36, 1];
const ROLES = [
  { value: 'Guest', emoji: '🧳', title: 'I need a stay', desc: 'Looking for a local host' },
  { value: 'Host', emoji: '🏡', title: 'I can host', desc: 'Welcoming guests to my city' },
];

const Stamp = ({ done, icon, label }) => (
  <span className={`rg-stamp${done ? ' is-done' : ''}`}>
    <motion.span
      className="rg-stamp-ring"
      initial={false}
      animate={done ? { scale: [1.7, 0.9, 1], rotate: [-20, -6, -6] } : { scale: 1, rotate: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      {done ? <Check size={14} strokeWidth={3} /> : icon}
    </motion.span>
    <span className="rg-stamp-label">{label}</span>
  </span>
);

// Live preview of the account being created; tilts gently with the pointer.
const PassCard = ({ name, role, place, since, code, stamps, interactive }) => {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 110, damping: 18, mass: 0.6 };
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [9, -5]), spring);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 8]), spring);

  useEffect(() => {
    if (!interactive) return undefined;
    const onMove = (e) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [interactive, mx, my]);

  return (
    <div className="rg-pass-stage" aria-hidden="true">
      <motion.div className="rg-pass" style={{ rotateX, rotateY }}>
        <div className="rg-pass-top">
          <span className="rg-pass-brand">🪔 FestiveGuest</span>
          <span className="rg-pass-kind">Member pass</span>
        </div>
        <div className="rg-pass-main">
          <span className={`rg-avatar${role === 'Host' ? ' rg-avatar--host' : ''}`}>{(name.trim() || '?').charAt(0).toUpperCase()}</span>
          <div>
            <div className={`rg-pass-name${name.trim() ? '' : ' is-empty'}`}>{name.trim() || 'Your name'}</div>
            <span className="rg-role-tag">{role === 'Host' ? '🏡 Local host' : '🧳 Guest'}</span>
          </div>
        </div>
        <dl className="rg-pass-grid">
          <div><dt>Home city</dt><dd className={place ? '' : 'is-empty'}>{place || 'Add in step 2'}</dd></div>
          <div><dt>Member since</dt><dd>{since}</dd></div>
        </dl>
        <div className="rg-perf" />
        <div className="rg-stamps">{stamps.map((s) => <Stamp key={s.label} {...s} />)}</div>
        <div className="rg-pass-foot">
          <span className="rg-barcode" />
          <span className="rg-pass-code">No. {code}</span>
        </div>
      </motion.div>
    </div>
  );
};

const Registration = ({ setUser }) => {
  useSEO({ title: 'Sign Up', description: 'Create your free FestiveGuest account to find a trusted local host in India, or register as a verified host yourself.' });
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
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpSending, setPhoneOtpSending] = useState(false);
  const [phoneOtpSessionId, setPhoneOtpSessionId] = useState('');
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [phoneOtpError, setPhoneOtpError] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneVerificationToken, setPhoneVerificationToken] = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');
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
  // 'email' | 'google' when the server says that address already has an account.
  const [accountExists, setAccountExists] = useState(null);

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
    setAccountExists(null);
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
        phoneVerificationToken: phoneVerificationToken || undefined,
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
        // Count down in a local variable: navigating from inside a state
        // updater runs a side effect during render (React warns about it).
        let remaining = 5;
        setRegistrationSuccessCountdown(remaining);
        const countdown = setInterval(() => {
          remaining -= 1;
          if (remaining <= 0) { clearInterval(countdown); navigate('/login'); return; }
          setRegistrationSuccessCountdown(remaining);
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
      // 409: the email already has an account — say so on the field itself.
      if (err.response?.status === 409) { setAccountExists('email'); setEmailError(msg); return; }
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

  const sendPhoneOtp = async () => {
    if (!formData.phone || phoneError) { showToast('Please enter a valid phone number first', 'error'); return; }
    setPhoneOtpSending(true); setPhoneOtpError('');
    try {
      const res = await api.post('phone-otp/send', { phone: formData.phone });
      if (res.data.success) { setPhoneOtpSent(true); setPhoneOtpSessionId(res.data.sessionId); showToast('OTP sent to your phone', 'success'); }
    } catch (err) {
      // Sign-up isn't blocked when SMS fails — the number is saved unverified and can be verified later.
      setPhoneOtpError("We couldn't send the code right now. You can continue and verify your number later from your profile.");
      console.error('Phone OTP send failed:', err.response?.data?.message || err.message);
    } finally {
      setPhoneOtpSending(false);
    }
  };

  const verifyPhoneOtp = async () => {
    if (!phoneOtpCode || phoneOtpCode.length !== 6) { setPhoneOtpError('Please enter a valid 6-digit OTP'); return; }
    setLoading(true); setPhoneOtpError('');
    try {
      const res = await api.post('phone-otp/verify', { sessionId: phoneOtpSessionId, otp: phoneOtpCode, phone: formData.phone, purpose: 'register' });
      if (res.data.success) {
        setPhoneVerificationToken(res.data.verificationToken); setVerifiedPhone(formData.phone);
        setPhoneVerified(true); setPhoneOtpSent(false); setPhoneOtpCode('');
        showToast(res.data?.message || 'Phone verified', 'success');
      }
    } catch (err) {
      setPhoneOtpError('Verification failed: ' + (err.response?.data?.message || err.message));
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
      if (err.response?.status === 409) { setAccountExists('google'); return; }
      showToast('Google verification failed: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  // ── Step navigation (same validation as before, pulled out of inline handlers) ──
  const nextFromAccount = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim() || !emailVerified) errors.email = emailVerified ? 'Email is required' : 'Please verify your email';
    if (!isGoogleUser && (!formData.password.trim() || !passwordRequirements.every(r => r.test(formData.password)))) errors.password = 'Password must meet all requirements';
    if (!formData.phone.trim() || phoneError) errors.phone = phoneError || 'Phone number is required';
    if (!ageConfirmed) errors.ageConfirmed = 'You must confirm you are at least 18 years old';
    setValidationErrors(prev => ({ ...prev, ...errors }));
    if (Object.keys(errors).length > 0) { showToast('Please complete all required fields', 'error'); return; }
    setCurrentStep(2);
  };

  const nextFromProfile = () => {
    const errors = {};
    if (!formData.state) errors.state = 'State is required';
    if (!formData.city) errors.city = 'City is required';
    if (!formData.bio.trim()) errors.bio = 'Description is required';
    if (formData.role === 'Host' && !formData.hostingAreas.some(a => a.cities?.length > 0)) errors.hostingAreas = 'Please select at least one hosting area';
    setValidationErrors(prev => ({ ...prev, ...errors }));
    if (Object.keys(errors).length > 0) { showToast('Please complete all required fields', 'error'); return; }
    setCurrentStep(3);
  };

  // ── Hosting-areas picker ──
  // Works on a deep copy: the previous version pushed into the saved areas'
  // city arrays in place, so closing the picker without "Done" still changed
  // the selection.
  const openHostingModal = () => {
    const copy = formData.hostingAreas.map(a => ({ ...a, cities: [...a.cities] }));
    setTempHostingAreas(copy);
    setTempCityCount(copy.reduce((t, a) => t + a.cities.length, 0));
    setShowHostingModal(true);
  };

  const toggleHostingCity = (state, city, selected) => {
    const newAreas = tempHostingAreas.map(a => ({ ...a, cities: [...a.cities] }));
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
  };

  useEffect(() => {
    if (!showHostingModal) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = e => { if (e.key === 'Escape') setShowHostingModal(false); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prevOverflow; document.removeEventListener('keydown', onKey); };
  }, [showHostingModal]);

  // ── View helpers ──
  const reduceMotion = useReducedMotion();
  const [finePointer] = useState(() => window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  const [since] = useState(() => new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }));
  const steps = [{ num: 1, label: 'Account' }, { num: 2, label: 'Profile' }, { num: 3, label: 'Confirm' }];
  const place = formData.city && formData.state
    ? `${formData.city === 'Other' ? (formData.otherCity || 'Other') : formData.city}, ${formData.state}`
    : '';
  const stamps = [
    { label: 'Email', done: emailVerified, icon: <Mail size={13} /> },
    { label: 'Phone', done: phoneVerified, icon: <Smartphone size={13} /> },
    { label: '18+', done: ageConfirmed, icon: <ShieldCheck size={13} /> },
  ];
  const pwMet = passwordRequirements.filter(r => r.test(formData.password)).length;
  const selectedCityCount = formData.hostingAreas.reduce((t, a) => t + a.cities.length, 0);
  const isHost = formData.role === 'Host';
  const clearError = key => { if (validationErrors[key]) setValidationErrors(p => ({ ...p, [key]: '' })); };
  const inputCls = (error, verified) => `rg-input${error ? ' has-error' : ''}${verified ? ' is-verified' : ''}`;
  const stepMotion = {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
    transition: { duration: 0.3, ease: EASE },
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="rg">
        <div className="rg-aurora" aria-hidden="true"><span className="a1" /><span className="a2" /><span className="a3" /></div>

        <div className="rg-shell">
          {/* ═════════ Left: intro + live pass ═════════ */}
          <aside className="rg-side">
            <span className="rg-chip">
              {registrationSuccessCountdown > 0
                ? <><CheckCircle2 size={14} /> All done · Welcome aboard</>
                : <><Sparkles size={14} /> Step {currentStep} of 3 · Free to join</>}
            </span>
            <h1 className="rg-title">
              {isHost ? <>Open your door to <span className="rg-grad">someone who needs it.</span></> : <>Your trusted local, <span className="rg-grad">wherever you go.</span></>}
            </h1>
            <p className="rg-lead">
              {isHost
                ? 'Create your host account, tell guests where you can host, and help someone at an important moment.'
                : 'Create your account, verify your email and phone, and connect with local hosts across India.'}
            </p>

            <PassCard
              name={formData.name}
              role={formData.role}
              place={place}
              since={since}
              code={formData.userId.slice(0, 8).toUpperCase()}
              stamps={stamps}
              interactive={finePointer && !reduceMotion}
            />

            <div className="rg-strip" aria-hidden="true">
              <span className={`rg-avatar${isHost ? ' rg-avatar--host' : ''}`}>{(formData.name.trim() || '?').charAt(0).toUpperCase()}</span>
              <div className="rg-strip-text">
                <div className={`rg-pass-name${formData.name.trim() ? '' : ' is-empty'}`}>{formData.name.trim() || 'Your name'}</div>
                <span className="rg-role-tag">{isHost ? '🏡 Local host' : '🧳 Guest'}</span>
              </div>
              <div className="rg-stamps">{stamps.map(s => <Stamp key={s.label} {...s} />)}</div>
            </div>

            <ul className="rg-perks">
              <li><Lock size={16} /> Your phone number and email stay hidden</li>
              <li><MessageCircle size={16} /> Chat privately inside the app</li>
              <li><CheckCircle2 size={16} /> Free to join — no booking fees</li>
            </ul>
          </aside>

          {/* ═════════ Right: form ═════════ */}
          <motion.section
            className="rg-card"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            {registrationSuccessCountdown > 0 ? (
              <div className="rg-success" role="status">
                <motion.div className="rg-success-icon" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }}>
                  <Check size={42} strokeWidth={3} />
                </motion.div>
                <h2>You're in! 🎉</h2>
                <p>Your FestiveGuest account is ready — taking you to the sign-in page ({registrationSuccessCountdown}s)…</p>
              </div>
            ) : (
              <>
                <h2 className="rg-card-title">Create your account</h2>
                <p className="rg-card-sub">Takes a few minutes — we verify every member's email and phone.</p>

                <div className="rg-stepper">
                  <div className="rg-steps-track" aria-hidden="true">
                    <motion.span className="rg-steps-fill" initial={false} animate={{ width: `${((currentStep - 1) / 2) * 100}%` }} transition={{ duration: 0.45, ease: EASE }} />
                  </div>
                  <ol className="rg-steps">
                    {steps.map(s => (
                      <li key={s.num} className={`rg-step${currentStep === s.num ? ' is-current' : ''}${currentStep > s.num ? ' is-done' : ''}`}>
                        <button type="button" disabled={s.num >= currentStep} onClick={() => setCurrentStep(s.num)} aria-current={currentStep === s.num ? 'step' : undefined}>
                          <span className="rg-step-dot">{currentStep > s.num ? <Check size={15} strokeWidth={3} /> : s.num}</span>
                          {s.label}
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>

                {serverError && (
                  <div className="rg-alert" role="alert"><AlertTriangle size={17} /> {serverError}</div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  <AnimatePresence mode="wait" initial={false}>
                    {/* ── Step 1: Account ── */}
                    {currentStep === 1 && (
                      <motion.div key="step1" {...stepMotion}>
                        {!isGoogleUser ? (
                          <>
                            <div className="rg-google">
                              <GoogleLogin
                                onSuccess={credentialResponse => handleGoogleVerify(credentialResponse.credential)}
                                onError={() => showToast('Google sign-in failed', 'error')}
                                useOneTap={false}
                                text="continue_with"
                                shape="pill"
                                theme="outline"
                                size="large"
                                width="320"
                              />
                            </div>
                            {accountExists === 'google' && (
                              <div className="rg-alert" role="alert" style={{ marginTop: '1rem', marginBottom: 0 }}>
                                <AlertTriangle size={17} />
                                <span>
                                  That Google account is already registered.{' '}
                                  <button type="button" className="rg-link-btn" onClick={() => navigate('/login')}>Sign in instead</button>
                                </span>
                              </div>
                            )}
                            <div className="rg-divider">or sign up with email</div>
                          </>
                        ) : (
                          <div className="rg-google-ok">
                            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <strong>Google account verified</strong>{' '}
                              <span className="rg-mute">{verifiedEmail}</span>
                            </div>
                            <button type="button" className="rg-link-btn" onClick={() => { setIsGoogleUser(false); setEmailVerified(false); setVerifiedEmail(''); setFormData(prev => ({ ...prev, name: '', email: '' })); }}>
                              Change
                            </button>
                          </div>
                        )}

                        <div className="rg-field">
                          <span className="rg-label" id="rg-role-label">I want to join as</span>
                          <div className="rg-roles" role="radiogroup" aria-labelledby="rg-role-label">
                            {ROLES.map(r => (
                              <button key={r.value} type="button" role="radio" aria-checked={formData.role === r.value}
                                className={`rg-role${formData.role === r.value ? ' is-on' : ''}`}
                                onClick={() => setFormData(prev => ({ ...prev, role: r.value }))}>
                                <span className="rg-role-icon" aria-hidden="true">{r.emoji}</span>
                                <span className="rg-role-title">{r.title}</span>
                                <span className="rg-role-desc">{r.desc}</span>
                                {formData.role === r.value && (
                                  <motion.span layoutId="rg-role-check" className="rg-role-check" aria-hidden="true"><Check size={13} strokeWidth={3} /></motion.span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="rg-field">
                          <label className="rg-label" htmlFor="rg-name">Full name</label>
                          <input id="rg-name" className={inputCls(validationErrors.name)} type="text" name="name" autoComplete="name"
                            value={formData.name} placeholder="Enter your full name" required
                            onChange={e => { handleInputChange(e); clearError('name'); }} />
                          {validationErrors.name && <p className="rg-error">{validationErrors.name}</p>}
                        </div>

                        {/* Email + OTP */}
                        <div className="rg-field">
                          <label className="rg-label" htmlFor="rg-email">Email address</label>
                          <div className="rg-inline">
                            <input id="rg-email" type="email" name="email" autoComplete="email" required
                              className={`${inputCls(emailError || validationErrors.email, emailVerified)}${!otpSent || emailVerified ? ' has-action' : ''}`}
                              value={formData.email} placeholder="you@example.com" disabled={emailVerified}
                              onChange={e => { handleEmailChange(e); clearError('email'); }}
                              onBlur={e => validateEmail(e.target.value)} />
                            {emailVerified ? (
                              <span className="rg-verified">
                                <CheckCircle2 size={15} /> Verified
                                {!isGoogleUser && (
                                  <button type="button" className="rg-link-btn" onClick={() => { setEmailVerified(false); setVerifiedEmail(''); setOtpSent(false); setVerificationOTP(''); }}>Change</button>
                                )}
                              </span>
                            ) : !otpSent && (
                              <button type="button" className="rg-send" onClick={sendRegistrationOtp} disabled={otpSending || !!emailError || !formData.email}>
                                {otpSending ? 'Sending…' : 'Send code'}
                              </button>
                            )}
                          </div>
                          {(emailError || validationErrors.email) && (
                            <p className="rg-error" role={accountExists === 'email' ? 'alert' : undefined}>
                              {emailError || validationErrors.email}
                              {accountExists === 'email' && (
                                <> <button type="button" className="rg-link-btn" onClick={() => navigate('/login')}>Sign in instead</button></>
                              )}
                            </p>
                          )}
                          <AnimatePresence initial={false}>
                            {otpSent && !emailVerified && (
                              <motion.div className="rg-otp" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: EASE }}>
                                <div className="rg-otp-inner">
                                  <p className="rg-otp-hint">Enter the 6-digit code sent to <strong>{formData.email}</strong></p>
                                  <div className="rg-otp-row">
                                    <input className={`rg-input rg-otp-input${otpError ? ' has-error' : ''}`} inputMode="numeric" autoComplete="one-time-code"
                                      aria-label="Email verification code" placeholder="••••••" maxLength={6} value={verificationOTP}
                                      onChange={e => { setVerificationOTP(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError(''); }} />
                                    <button type="button" className="rg-btn rg-btn-primary rg-btn-sm" onClick={verifyRegistrationOtp} disabled={loading || verificationOTP.length !== 6}>Verify</button>
                                  </div>
                                  {otpError && <p className="rg-error">{otpError}</p>}
                                  <button type="button" className="rg-link-btn" onClick={() => { setVerificationOTP(''); setOtpError(''); sendRegistrationOtp(); }} disabled={otpSending}>
                                    {otpSending ? 'Resending…' : 'Resend code'}
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Password — hidden for Google users */}
                        {!isGoogleUser && (
                          <div className="rg-field">
                            <label className="rg-label" htmlFor="rg-password">Password</label>
                            <div className="rg-inline">
                              <input id="rg-password" name="password" autoComplete="new-password" required
                                className={inputCls(validationErrors.password)} style={{ paddingRight: '3rem' }}
                                type={showPassword ? 'text' : 'password'} value={formData.password} placeholder="Create a strong password"
                                onChange={e => { handleInputChange(e); clearError('password'); }} />
                              <button type="button" className="rg-eye" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>
                            {validationErrors.password && <p className="rg-error">{validationErrors.password}</p>}
                            {/* Rules appear once typing starts (or on a validation error), keeping the empty form short. */}
                            {(formData.password || validationErrors.password) && (
                              <>
                                <div className="rg-strength" aria-hidden="true"><span className={`lvl-${pwMet}`} style={{ width: `${(pwMet / passwordRequirements.length) * 100}%` }} /></div>
                                <ul className="rg-reqs">
                                  {passwordRequirements.map(req => {
                                    const met = req.test(formData.password);
                                    return (
                                      <li key={req.label} className={met ? 'is-met' : ''}>
                                        {met ? <Check size={12} strokeWidth={3} /> : <span className="rg-dot" />} {req.label}
                                      </li>
                                    );
                                  })}
                                </ul>
                              </>
                            )}
                          </div>
                        )}

                        {/* Phone + OTP */}
                        <div className="rg-field">
                          <label className="rg-label" htmlFor="rg-phone">Mobile number</label>
                          <div className="rg-inline">
                            <span className="rg-prefix" aria-hidden="true">+91</span>
                            <input id="rg-phone" type="tel" name="phone" autoComplete="tel-national" required maxLength={10} inputMode="numeric"
                              className={`${inputCls(phoneError || validationErrors.phone, phoneVerified)} rg-input--prefixed${!phoneOtpSent || phoneVerified ? ' has-action' : ''}`}
                              value={formData.phone} placeholder="10-digit mobile number" disabled={phoneVerified}
                              onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); handleInputChange({ target: { name: 'phone', value: v } }); validatePhone(v); clearError('phone'); setPhoneOtpError(''); }}
                              onBlur={e => validatePhone(e.target.value)} />
                            {phoneVerified ? (
                              <span className="rg-verified">
                                <CheckCircle2 size={15} /> Verified
                                <button type="button" className="rg-link-btn" onClick={() => { setPhoneVerified(false); setVerifiedPhone(''); setPhoneOtpSent(false); setPhoneOtpCode(''); setPhoneVerificationToken(''); }}>Change</button>
                              </span>
                            ) : !phoneOtpSent && (
                              <button type="button" className="rg-send" onClick={sendPhoneOtp} disabled={phoneOtpSending || !!phoneError || !formData.phone}>
                                {phoneOtpSending ? 'Sending…' : 'Send code'}
                              </button>
                            )}
                          </div>
                          {(phoneError || validationErrors.phone) && <p className="rg-error">{phoneError || validationErrors.phone}</p>}
                          {!phoneVerified && !phoneOtpSent && (
                            phoneOtpError
                              ? <p className="rg-error" role="alert">{phoneOtpError}</p>
                              : <p className="rg-note rg-note--soft">Verifying now is optional — you can do it later from your profile to get a ✓ Verified badge.</p>
                          )}
                          <AnimatePresence initial={false}>
                            {phoneOtpSent && !phoneVerified && (
                              <motion.div className="rg-otp" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: EASE }}>
                                <div className="rg-otp-inner">
                                  <p className="rg-otp-hint">Enter the 6-digit code sent by SMS to <strong>+91 {formData.phone}</strong></p>
                                  <div className="rg-otp-row">
                                    <input className={`rg-input rg-otp-input${phoneOtpError ? ' has-error' : ''}`} inputMode="numeric" autoComplete="one-time-code"
                                      aria-label="Phone verification code" placeholder="••••••" maxLength={6} value={phoneOtpCode}
                                      onChange={e => { setPhoneOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setPhoneOtpError(''); }} />
                                    <button type="button" className="rg-btn rg-btn-primary rg-btn-sm" onClick={verifyPhoneOtp} disabled={loading || phoneOtpCode.length !== 6}>Verify</button>
                                  </div>
                                  {phoneOtpError && <p className="rg-error">{phoneOtpError}</p>}
                                  <button type="button" className="rg-link-btn" onClick={() => { setPhoneOtpCode(''); setPhoneOtpError(''); sendPhoneOtp(); }} disabled={phoneOtpSending}>
                                    {phoneOtpSending ? 'Resending…' : 'Resend code'}
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="rg-field">
                          <label className={`rg-check-row${ageConfirmed ? ' is-on' : ''}${validationErrors.ageConfirmed ? ' has-error' : ''}`}>
                            <input type="checkbox" id="ageConfirm" className="rg-check" checked={ageConfirmed}
                              onChange={e => { setAgeConfirmed(e.target.checked); clearError('ageConfirmed'); }} />
                            <span>I confirm I am at least <strong>18 years old</strong> and can enter legally binding agreements.</span>
                          </label>
                          {validationErrors.ageConfirmed && <p className="rg-error">{validationErrors.ageConfirmed}</p>}
                        </div>

                        <div className="rg-actions">
                          <button type="button" className="rg-btn rg-btn-primary" onClick={nextFromAccount}>
                            Next: Profile <ArrowRight size={18} />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* ── Step 2: Profile ── */}
                    {currentStep === 2 && (
                      <motion.div key="step2" {...stepMotion}>
                        <div className="rg-field">
                          <span className="rg-label">Which state do you live in?</span>
                          <div className="rg-chips rg-chips--scroll">
                            {Object.keys(locationData || {}).map(state => (
                              <button key={state} type="button" className={`rg-chip-btn${formData.state === state ? ' is-on' : ''}`} aria-pressed={formData.state === state}
                                onClick={() => { setFormData(prev => ({ ...prev, state, city: '' })); clearError('state'); }}>
                                {state}
                              </button>
                            ))}
                          </div>
                          {validationErrors.state && <p className="rg-error">{validationErrors.state}</p>}
                        </div>

                        {formData.state && (
                          <div className="rg-field">
                            <span className="rg-label">City</span>
                            <div className="rg-chips rg-chips--scroll">
                              {(locationData[formData.state] || []).map(city => (
                                <button key={city} type="button" className={`rg-chip-btn${formData.city === city ? ' is-on' : ''}`} aria-pressed={formData.city === city}
                                  onClick={() => { setFormData(prev => ({ ...prev, city })); clearError('city'); }}>
                                  {city}
                                </button>
                              ))}
                            </div>
                            {validationErrors.city && <p className="rg-error">{validationErrors.city}</p>}
                          </div>
                        )}

                        {formData.city === 'Other' && (
                          <div className="rg-field">
                            <label className="rg-label" htmlFor="rg-other-city">Your city name</label>
                            <input id="rg-other-city" className="rg-input" type="text" name="otherCity" value={formData.otherCity} onChange={handleInputChange} placeholder="Enter city name" />
                          </div>
                        )}

                        <div className="rg-field">
                          <label className="rg-label" htmlFor="rg-bio">{isHost ? 'What you offer as a host' : "What you're looking for"}</label>
                          <textarea id="rg-bio" name="bio" className={`${inputCls(validationErrors.bio)} rg-textarea`} required rows={3} maxLength={250}
                            value={formData.bio}
                            placeholder={isHost ? 'Describe what you offer to travelers (a room, local guidance, help getting around…)' : 'Tell hosts why you are travelling (an interview, a hospital visit, an exam…)'}
                            onChange={e => { handleInputChange(e); clearError('bio'); }} />
                          {validationErrors.bio && <p className="rg-error">{validationErrors.bio}</p>}
                          <p className="rg-counter">{formData.bio.length}/250</p>
                        </div>

                        {isHost && (
                          <div className="rg-field">
                            <span className="rg-label">Areas where you can host <small>(up to 3 states)</small></span>
                            <button type="button" className={`rg-area-btn${validationErrors.hostingAreas ? ' has-error' : ''}`} onClick={openHostingModal}>
                              <MapIcon size={18} /> Choose hosting areas
                              <span className="rg-area-count">{selectedCityCount} {selectedCityCount === 1 ? 'city' : 'cities'}</span>
                            </button>
                            {validationErrors.hostingAreas && <p className="rg-error">{validationErrors.hostingAreas}</p>}
                            {formData.hostingAreas.some(a => a.cities.length > 0) && (
                              <div className="rg-areas-sum">
                                {formData.hostingAreas.filter(a => a.cities.length > 0).map(area => (
                                  <div key={area.state}><strong>{area.state}:</strong> {area.cities.join(', ')}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="rg-field">
                          <label className="rg-label" htmlFor="rg-ref">Referral code <small>(optional)</small></label>
                          <div className="rg-inline">
                            <span className="rg-input-icon" aria-hidden="true"><Gift size={17} /></span>
                            <input id="rg-ref" className="rg-input rg-input--iconed" type="text" name="ReferredBy" value={formData.ReferredBy || ''}
                              placeholder="Friend's referral code"
                              onChange={e => setFormData(prev => ({ ...prev, ReferredBy: e.target.value.toUpperCase() }))} />
                          </div>
                          {formData.ReferredBy && <p className="rg-note">✓ Referral code applied: {formData.ReferredBy}</p>}
                        </div>

                        <div className="rg-actions">
                          <button type="button" className="rg-btn rg-btn-ghost" onClick={() => setCurrentStep(1)}><ArrowLeft size={17} /> Back</button>
                          <button type="button" className="rg-btn rg-btn-primary" onClick={nextFromProfile}>Next: Confirm <ArrowRight size={18} /></button>
                        </div>
                      </motion.div>
                    )}

                    {/* ── Step 3: Confirm ── */}
                    {currentStep === 3 && (
                      <motion.div key="step3" {...stepMotion}>
                        <dl className="rg-review">
                          {[
                            { label: 'Name', value: formData.name },
                            { label: 'Email', value: verifiedEmail + ' ✓' },
                            { label: 'Phone', value: phoneVerified ? `+91 ${formData.phone} · verified ✓` : `+91 ${formData.phone} · verify later from your profile` },
                            { label: 'Joining as', value: isHost ? '🏡 Local host' : '🧳 Guest' },
                            { label: 'Location', value: place || '—' },
                          ].map(row => (
                            <div key={row.label} className="rg-review-row"><dt>{row.label}</dt><dd>{row.value}</dd></div>
                          ))}
                        </dl>

                        <div className="rg-review-ok">
                          <CheckCircle2 size={16} />
                          <span>Age confirmed (18+) · Terms &amp; Privacy accepted · Email verified</span>
                        </div>

                        <div className="rg-actions">
                          <button type="button" className="rg-btn rg-btn-ghost" onClick={() => setCurrentStep(2)}><ArrowLeft size={17} /> Back</button>
                          <button type="submit" className="rg-btn rg-btn-primary" disabled={loading || registrationSuccessCountdown > 0}>
                            {loading ? <><span className="rg-spinner" /> Creating account…</> : <>Create account <CheckCircle2 size={18} /></>}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>

                <div className="rg-signin">
                  Already have an account?
                  <button type="button" className="rg-link-btn" onClick={() => navigate('/login')}>Sign in →</button>
                </div>
              </>
            )}
          </motion.section>
        </div>

        {/* Toast + hosting-areas dialog render into <body> so they sit above everything. */}
        {createPortal(
          <AnimatePresence>
            {toast && (
              <motion.div
                key="toast"
                className={`rg-toast is-${toast.type}`}
                role={toast.type === 'error' ? 'alert' : 'status'}
                initial={{ x: 120, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 120, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              >
                <span className="rg-toast-icon">{toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}</span>
                <span>
                  {toast.message}
                  {registrationSuccessCountdown > 0 && <small>Redirecting in {registrationSuccessCountdown}s…</small>}
                </span>
                {toast.type !== 'success' && (
                  <button type="button" className="rg-toast-close" onClick={() => setToast(null)} aria-label="Dismiss"><X size={16} /></button>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}

        {showHostingModal && createPortal(
          <div className="rg-modal-overlay rg-portal" onMouseDown={e => { if (e.target === e.currentTarget) setShowHostingModal(false); }}>
            <motion.div className="rg-modal" role="dialog" aria-modal="true" aria-labelledby="rg-areas-title"
              initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.35, ease: EASE }}>
              <header className="rg-modal-head">
                <h3 id="rg-areas-title"><MapIcon size={19} /> Where can you host?</h3>
                <p>Pick the cities you can host in — up to 3 states.</p>
                <button type="button" className="rg-icon-btn" onClick={() => setShowHostingModal(false)} aria-label="Close"><X size={18} /></button>
              </header>
              <div className="rg-modal-body">
                {Object.entries(locationData || {}).map(([state, cities]) => {
                  const selectedCities = tempHostingAreas.find(a => a.state === state)?.cities || [];
                  return (
                    <div key={state} className="rg-area-state">
                      <h4>{state}{selectedCities.length > 0 && <span>{selectedCities.length} selected</span>}</h4>
                      <div className="rg-chips">
                        {cities.map(city => {
                          const selected = selectedCities.includes(city);
                          return (
                            <button key={city} type="button" className={`rg-chip-btn${selected ? ' is-on' : ''}`} aria-pressed={selected}
                              onClick={() => toggleHostingCity(state, city, selected)}>
                              {city}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <footer className="rg-modal-foot">
                <span>{tempCityCount} {tempCityCount === 1 ? 'city' : 'cities'} selected</span>
                <button type="button" className="rg-btn rg-btn-primary"
                  onClick={() => { setFormData(prev => ({ ...prev, hostingAreas: tempHostingAreas })); setShowHostingModal(false); }}>
                  <Check size={17} /> Done
                </button>
              </footer>
            </motion.div>
          </div>,
          document.body,
        )}
      </div>
    </MotionConfig>
  );
};

export default Registration;
