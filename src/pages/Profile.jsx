import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import {
  Camera, Pencil, KeyRound, Lock, Eye, EyeOff, MapPin, Mail, Phone, Bell, Check, X, Copy, Share2,
  Gift, ShieldCheck, CalendarDays, Sparkles, CheckCircle2, AlertTriangle, Upload, Ban,
} from 'lucide-react';
import api from '../utils/api';
import ImageWithSas from '../components/ImageWithSas';
import GlassDialog from '../components/posts/GlassDialog';
import ProgressRing from '../components/ProgressRing';
import VerifyPhoneDialog from '../components/VerifyPhoneDialog';
import { VerifiedChip } from '../components/VerifiedBadge';
import { useLanguage } from '../i18n/LanguageContext';
import locationService from '../utils/locationService';
import useSEO from '../hooks/useSEO';
import '../styles/Register.css';
import '../styles/PostsBoard.css';
import '../styles/Profile.css';

const EASE = [0.22, 1, 0.36, 1];
const MAX_AREAS = 5;
const rise = (delay = 0) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, ease: EASE, delay } });
// Email alerts a member can switch on or off; the API defaults any missing one to on.
const EMAIL_DEFAULTS = { email: true, push: false, messages: true, signIns: true };
const ALERT_NAMES = [['email', 'posts'], ['messages', 'messages'], ['signIns', 'sign-ins']];

function Profile() {
  useSEO({ title: 'My Profile', noindex: true });
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [successfulReferrals, setSuccessfulReferrals] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccessCountdown, setPasswordSuccessCountdown] = useState(0);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', state: '', city: '', bio: '', hostingAreas: [], notificationPreferences: EMAIL_DEFAULTS });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [locationData, setLocationData] = useState(null);
  const [toast, setToast] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [showVerify, setShowVerify] = useState(false);
  const fileInputRef = useRef(null);

  const passwordRequirements = [
    { label: t('atLeast8Chars'), test: (pw) => pw.length >= 8 },
    { label: t('oneUppercase'), test: (pw) => /[A-Z]/.test(pw) },
    { label: t('oneLowercase'), test: (pw) => /[a-z]/.test(pw) },
    { label: t('oneNumber'), test: (pw) => /\d/.test(pw) },
    { label: t('oneSpecialChar'), test: (pw) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw) },
  ];

  const showToast = (message, type = 'success') => setToast({ message, type, id: Date.now() });
  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (localStorage.getItem('userId')) fetchUser();
    api.get('safety/blocks').then((res) => setBlocks(res.data || [])).catch(() => {});
    locationService.getLocations().then(setLocationData).catch((err) => console.error('Failed to load locations:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const anyOpen = showChangePassword || isEditingProfile || showVerify;
  useEffect(() => {
    document.body.style.overflow = anyOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [anyOpen]);

  const resetEditForm = (u) => {
    const [city = '', state = ''] = (u.location || '').split(', ');
    setEditFormData({
      name: u.name || '',
      state, city,
      bio: u.bio || '',
      // Copies, so toggling cities in the dialog never mutates the loaded profile.
      hostingAreas: (u.hostingAreas || []).map((a) => ({ ...a, cities: [...(a.cities || [])] })),
      notificationPreferences: { ...EMAIL_DEFAULTS, ...u.notificationPreferences },
    });
  };

  const fetchUser = async () => {
    try {
      const res = await api.get('user/profile');
      const fetchedUser = res.data;
      const savedUser = JSON.parse(localStorage.getItem('user'));
      const updatedUser = { ...fetchedUser, token: savedUser?.token, role: fetchedUser.userType || savedUser?.role };
      setUser(updatedUser);
      setSuccessfulReferrals(fetchedUser.successfulReferrals || 0);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      resetEditForm(updatedUser);
      setReferralCode(updatedUser.referralCode || '');
      window.dispatchEvent(new Event('storage')); // sync App.jsx state
    } catch {
      console.error('User not found');
    }
  };

  // ── Photo ──
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };
  const cancelPhoto = () => { setSelectedFile(null); setPreviewUrl(''); };

  const compressImage = (file) => new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const maxSize = 800;
      if (width > height) { if (width > maxSize) { height = (height * maxSize) / width; width = maxSize; } }
      else if (height > maxSize) { width = (width * maxSize) / height; height = maxSize; }
      canvas.width = width; canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
    };
    img.src = URL.createObjectURL(file);
  });

  const uploadProfileImage = async () => {
    if (!selectedFile || !user) return;
    setUploading(true);
    try {
      const compressedFile = await compressImage(selectedFile);
      const tokenRes = await api.get('user/upload-sas-token');
      const { sasUrl } = tokenRes.data;
      const uploadResponse = await fetch(sasUrl, { method: 'PUT', headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': 'image/jpeg' }, body: compressedFile });
      if (!uploadResponse.ok) throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      await api.post('user/confirm-upload', { imageUrl: sasUrl.split('?')[0] });
      cancelPhoto();
      showToast('Profile photo updated');
      await fetchUser();
    } catch (err) {
      showToast('Photo upload failed: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setUploading(false);
    }
  };

  const unblock = async (b) => {
    try {
      await api.delete(`safety/block/${encodeURIComponent(b.userId)}`);
      setBlocks((list) => list.filter((x) => x.userId !== b.userId));
      showToast(`${b.name || 'Member'} unblocked`);
    } catch {
      showToast('Could not unblock. Please try again.', 'error');
    }
  };

  // ── Referral ──
  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const shareReferral = () => {
    const shareText = `Join me on FestiveGuest — trusted local hosts for life's important trips. Use my referral code ${referralCode} when you register.`;
    if (navigator.share) navigator.share({ text: shareText }).catch(() => {});
    else { navigator.clipboard.writeText(shareText); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  // ── Edit profile ──
  const openEdit = () => { resetEditForm(user); setUpdateError(''); setIsEditingProfile(true); };
  const setField = (key, value) => { setEditFormData((p) => ({ ...p, [key]: value })); setUpdateError(''); };

  const toggleHostingCity = (state, city) => {
    const areas = editFormData.hostingAreas;
    const area = areas.find((a) => a.state === state);
    if (!area) {
      if (areas.length >= MAX_AREAS) { setUpdateError(`You can select up to ${MAX_AREAS} locations only`); return; }
      setField('hostingAreas', [...areas, { state, cities: [city] }]);
      return;
    }
    const cities = area.cities.includes(city) ? area.cities.filter((c) => c !== city) : [...area.cities, city];
    setField('hostingAreas', cities.length ? areas.map((a) => (a.state === state ? { ...a, cities } : a)) : areas.filter((a) => a.state !== state));
  };

  const updateProfile = async () => {
    if (!editFormData.name || editFormData.name.trim().length < 2) { setUpdateError('Name must be at least 2 characters'); return; }
    if (!editFormData.bio || editFormData.bio.trim().length < 10) { setUpdateError('Bio must be at least 10 characters'); return; }
    setUpdatingProfile(true);
    setUpdateError('');
    try {
      const location = editFormData.city && editFormData.state ? `${editFormData.city}, ${editFormData.state}` : user.location;
      const payload = {
        name: editFormData.name.trim(),
        location,
        bio: editFormData.bio,
        notificationPreferences: editFormData.notificationPreferences,
        ...(user.userType === 'Host' && {
          hostingAreas: editFormData.hostingAreas.length > 0 ? JSON.stringify(editFormData.hostingAreas.filter((area) => area.cities.length > 0)) : '',
        }),
      };
      const res = await api.put('user/profile', payload);
      if (res.data.success) {
        setIsEditingProfile(false);
        showToast('Profile updated');
        await fetchUser();
      }
    } catch (err) {
      setUpdateError(err.response?.data?.message || err.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  // ── Password ──
  const closeChangePasswordModal = () => {
    if (passwordSuccessCountdown > 0) return;
    setShowChangePassword(false);
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    setPasswordError('');
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { setPasswordError('Please fill all password fields'); return; }
    if (!passwordRequirements.every((req) => req.test(newPassword))) { setPasswordError('New password must meet all requirements'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('New passwords do not match'); return; }
    setChangingPassword(true);
    setPasswordError('');
    try {
      const res = await api.post('auth/change-password', { currentPassword, newPassword });
      if (res.data.success) {
        setPasswordSuccessCountdown(5);
        const countdownInterval = setInterval(() => {
          setPasswordSuccessCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              setShowChangePassword(false);
              setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
              setPasswordError('');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="pf pf--loading">
        <div className="rg-aurora" aria-hidden="true"><span className="a1" /><span className="a2" /><span className="a3" /></div>
        <span className="rg-spinner pb-spinner-light" /> <p>{t('loadingProfile')}</p>
      </div>
    );
  }

  const isHost = user.userType === 'Host';
  const areas = (user.hostingAreas || []).filter((a) => a.state && a.cities?.length > 0);
  const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '';

  // Profile strength: each missing item is a one-tap fix.
  const checklist = [
    { done: !!user.profileImageUrl, label: 'Add a photo', fix: () => fileInputRef.current?.click() },
    { done: (user.bio || '').trim().length >= 10, label: isHost ? 'Describe what you offer' : 'Write a short bio', fix: openEdit },
    { done: !!user.isVerified, label: 'Verify your phone', fix: () => setShowVerify(true) },
    { done: !!user.location, label: 'Add your city', fix: openEdit },
    ...(isHost ? [{ done: areas.length > 0, label: 'Pick hosting areas', fix: openEdit }] : []),
  ];
  const strength = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);
  const missing = checklist.filter((c) => !c.done);

  const pwFormInvalid = !currentPassword || !newPassword || !confirmPassword || !passwordRequirements.every((req) => req.test(newPassword)) || newPassword !== confirmPassword;
  const pwLocked = passwordSuccessCountdown > 0;

  return (
    <MotionConfig reducedMotion="user">
      <div className="pf">
        <div className="rg-aurora" aria-hidden="true"><span className="a1" /><span className="a2" /><span className="a3" /></div>
        <input ref={fileInputRef} id="pf-file" type="file" accept="image/*" onChange={handleFileChange} hidden />

        <div className="pf-shell">
          {/* ═════ Hero ═════ */}
          <motion.section className="pf-hero" {...rise()}>
            <div className="pf-cover" aria-hidden="true"><span className="pf-cover-lights" /></div>
            <div className="pf-hero-body">
              <div className="pf-avatar-wrap">
                {previewUrl || user.profileImageUrl
                  ? <ImageWithSas src={previewUrl || user.profileImageUrl} alt={user.name} className="pf-avatar" fallbackText={user.name?.charAt(0) || 'U'} />
                  : <span className={`pf-avatar pf-avatar--initial pf-avatar--${isHost ? 'host' : 'guest'}`} aria-hidden="true">{(user.name || '?').charAt(0).toUpperCase()}</span>}
                <button type="button" className="pf-camera" onClick={() => fileInputRef.current?.click()} aria-label="Change photo" title="Change photo"><Camera size={15} /></button>
              </div>

              <div className="pf-id">
                <h1>{user.name}</h1>
                <p className="pf-meta">
                  <span className={`pf-role pf-role--${isHost ? 'host' : 'guest'}`}>{isHost ? '🏡 Local host' : '🧳 Traveller'}</span>
                  {user.location && <span><MapPin size={13} /> {user.location}</span>}
                  {joined && <span><CalendarDays size={13} /> Joined {joined}</span>}
                </p>
                <p className="pf-chips">
                  <span className={`pf-chip${user.status === 'Active' ? ' is-green' : ' is-amber'}`}><span className="pf-dot" /> {user.status || 'Active'}</span>
                  {user.isVerified && <VerifiedChip />}
                </p>
              </div>

              <div className="pf-hero-actions">
                <button type="button" className="rg-btn rg-btn-primary pf-btn" onClick={openEdit}>
                  <Pencil size={15} /> {t('editProfile')}
                </button>
                <button type="button" className="rg-btn rg-btn-ghost pf-btn" onClick={() => setShowChangePassword(true)}><KeyRound size={15} /> {t('changePassword')}</button>
              </div>
            </div>

            <AnimatePresence>
              {selectedFile && (
                <motion.div className="pf-upload" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <div className="pf-upload-inner">
                    <span><Camera size={15} /> New photo selected — looks good?</span>
                    <div>
                      <button type="button" className="rg-btn rg-btn-ghost rg-btn-sm" onClick={cancelPhoto} disabled={uploading}><X size={14} /> {t('cancel')}</button>
                      <button type="button" className="rg-btn rg-btn-primary rg-btn-sm" onClick={uploadProfileImage} disabled={uploading}>
                        {uploading ? <><span className="rg-spinner" /> Saving…</> : <><Upload size={14} /> Save photo</>}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          <div className="pf-grid">
            {/* ═════ Main column ═════ */}
            <div className="pf-col">
              <motion.section className="pf-card pf-strength" {...rise(0.05)}>
                <ProgressRing pct={strength} />
                <div className="pf-strength-text">
                  <h2>{strength === 100 ? 'Your profile is complete' : 'Profile strength'}</h2>
                  <p>{strength === 100 ? 'Hosts and travellers can see who you are — great for trust.' : 'Complete profiles get more replies. Finish these:'}</p>
                  {missing.length > 0 && (
                    <div className="pf-fixes">
                      {missing.map((m) => <button key={m.label} type="button" className="pb-chip pb-chip--accent" onClick={m.fix}>+ {m.label}</button>)}
                    </div>
                  )}
                </div>
              </motion.section>

              <motion.section className="pf-card" {...rise(0.1)}>
                <header className="pf-card-head">
                  <h2>{isHost ? 'What I offer' : 'About me'}</h2>
                  <button type="button" className="pb-icon-btn" onClick={openEdit} aria-label={t('editProfile')}><Pencil size={14} /></button>
                </header>
                {user.bio
                  ? <p className="pf-bio">{user.bio}</p>
                  : <p className="pf-empty">{isHost ? t('describeOfferings') : 'Tell hosts a little about yourself and why you travel.'}</p>}
              </motion.section>

              {isHost && (
                <motion.section className="pf-card" {...rise(0.15)}>
                  <header className="pf-card-head">
                    <h2>{t('myHostingAreas')}</h2>
                    <span className="pf-count">{areas.reduce((s, a) => s + a.cities.length, 0)} cities</span>
                  </header>
                  {areas.length > 0 ? (
                    <div className="pf-areas">
                      {areas.map((area) => (
                        <div key={area.state} className="pf-area">
                          <strong>{area.state}</strong>
                          <div>{area.cities.map((city) => <span key={city} className="pb-area">{city}</span>)}</div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="pf-empty">{t('noHostingAreas')}</p>}
                </motion.section>
              )}
            </div>

            {/* ═════ Side column ═════ */}
            <div className="pf-col">
              <motion.section className="pf-card" {...rise(0.08)}>
                <header className="pf-card-head"><h2>Contact &amp; alerts</h2></header>
                <ul className="pf-rows">
                  <li><Mail size={15} /><span>Email</span><strong title={user.email}>{user.email}</strong></li>
                  <li>
                    <Phone size={15} /><span>Phone</span>
                    {/* Already masked by the API (98******10). */}
                    <strong className={user.isVerified ? 'is-on' : ''}>{user.phone ? `+91 ${user.phone}` : '—'}{user.isVerified && ' ✓'}</strong>
                    <button type="button" className="sa-btn pf-verify-btn" onClick={() => setShowVerify(true)}>{user.isVerified ? 'Change' : 'Verify'}</button>
                  </li>
                  <li><MapPin size={15} /><span>City</span><strong>{user.location || '—'}</strong></li>
                  <li><Bell size={15} /><span>Email alerts</span>{(() => {
                    const on = ALERT_NAMES.filter(([key]) => user.notificationPreferences?.[key] !== false).map(([, name]) => name);
                    return <strong className={on.length ? 'is-on' : ''}>{on.length ? on.join(', ').replace(/^./, (c) => c.toUpperCase()) : 'Off'}</strong>;
                  })()}</li>
                </ul>
                <p className="pf-private"><ShieldCheck size={13} /> Your email and phone are never shown on posts.</p>
              </motion.section>

              <motion.section className="pf-card pf-free" {...rise(0.12)}>
                <span className="pf-free-icon" aria-hidden="true"><Sparkles size={18} /></span>
                <div>
                  <h2>Free during our launch</h2>
                  <p>Every feature is free right now — no subscriptions, no fees.</p>
                </div>
              </motion.section>

              {blocks.length > 0 && (
                <motion.section className="pf-card" {...rise(0.14)}>
                  <header className="pf-card-head"><h2><Ban size={16} /> Blocked members</h2><span className="pf-count">{blocks.length}</span></header>
                  <ul className="pf-blocks">
                    {blocks.map((b) => (
                      <li key={b.userId}>
                        <span>{b.name || 'Member'}</span>
                        <button type="button" className="sa-btn" onClick={() => unblock(b)}>Unblock</button>
                      </li>
                    ))}
                  </ul>
                </motion.section>
              )}

              <motion.section className="pf-card pf-refer" {...rise(0.16)}>
                <header className="pf-card-head">
                  <h2><Gift size={16} /> Invite friends</h2>
                  {successfulReferrals > 0 && <span className="pf-count">{successfulReferrals} joined with your code</span>}
                </header>
                <p className="pf-sub">Know someone who travels for exams, hospital visits or interviews? Share your code for when they sign up.</p>
                <div className="pf-code">
                  <code>{referralCode || '—'}</code>
                  <button type="button" className="pb-icon-btn" onClick={copyReferralCode} disabled={!referralCode} aria-label="Copy code" title="Copy">{copied ? <Check size={15} /> : <Copy size={15} />}</button>
                  <button type="button" className="pb-icon-btn" onClick={shareReferral} disabled={!referralCode} aria-label="Share" title="Share"><Share2 size={15} /></button>
                </div>
                {copied && <p className="pf-copied">Copied to clipboard</p>}
              </motion.section>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {toast && (
            <motion.div key={toast.id} className={`rg-toast is-${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}
              initial={{ x: 120, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 120, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}>
              <span className="rg-toast-icon">{toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}</span>
              <span>{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═════ Edit profile ═════ */}
        <GlassDialog open={isEditingProfile} onClose={() => !updatingProfile && setIsEditingProfile(false)} size="lg"
          icon={<Pencil size={17} />} title={t('editProfile')} subtitle="This is what hosts and travellers see on your profile."
          footer={(
            <>
              <button type="button" className="rg-btn rg-btn-ghost" onClick={() => setIsEditingProfile(false)} disabled={updatingProfile}>{t('cancel')}</button>
              <button type="button" className="rg-btn rg-btn-primary pb-submit" onClick={updateProfile} disabled={updatingProfile}>
                {updatingProfile ? <><span className="rg-spinner" /> {t('updating')}</> : t('saveChanges')}
              </button>
            </>
          )}>
          {updateError && <div className="rg-alert" role="alert"><AlertTriangle size={17} /> {updateError}</div>}
          <div className="rg-field">
            <label className="rg-label" htmlFor="pf-name">{t('name')}</label>
            <input id="pf-name" className="rg-input" value={editFormData.name} onChange={(e) => setField('name', e.target.value)} />
            <p className="pb-hint">To change your phone number, use “{user.isVerified ? 'Change' : 'Verify'}” next to Phone — new numbers are confirmed by SMS.</p>
          </div>
          {locationData && (
            <>
              <div className="rg-field">
                <span className="rg-label" id="pf-state-label">State</span>
                <div className="rg-chips" role="group" aria-labelledby="pf-state-label">
                  {Object.keys(locationData).map((state) => (
                    <button key={state} type="button" className={`rg-chip-btn${editFormData.state === state ? ' is-on' : ''}`} aria-pressed={editFormData.state === state}
                      onClick={() => setEditFormData((p) => ({ ...p, state, city: '' }))}>{state}</button>
                  ))}
                </div>
              </div>
              {editFormData.state && locationData[editFormData.state] && (
                <div className="rg-field">
                  <span className="rg-label" id="pf-city-label">City</span>
                  <div className="rg-chips" role="group" aria-labelledby="pf-city-label">
                    {locationData[editFormData.state].map((city) => (
                      <button key={city} type="button" className={`rg-chip-btn${editFormData.city === city ? ' is-on' : ''}`} aria-pressed={editFormData.city === city}
                        onClick={() => setField('city', city)}>{city}</button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          <div className="rg-field">
            <label className="rg-label" htmlFor="pf-bio">{isHost ? 'What you offer as a host' : 'About you'}</label>
            <textarea id="pf-bio" rows={4} className="rg-input rg-textarea" value={editFormData.bio}
              placeholder={isHost ? t('describeOfferings') : 'Who you are, what you do, why you travel…'} onChange={(e) => setField('bio', e.target.value)} />
            <p className="pb-hint">{editFormData.bio.trim().length < 10 ? `At least 10 characters (${editFormData.bio.trim().length}/10)` : `${editFormData.bio.trim().length} characters`}</p>
          </div>
          {isHost && locationData && (
            <div className="rg-field">
              <span className="rg-label">{t('hostingAreas')} <small>({editFormData.hostingAreas.length}/{MAX_AREAS} {t('locations')})</small></span>
              <div className="pf-areas-picker">
                {Object.entries(locationData).map(([state, cities]) => {
                  const selected = editFormData.hostingAreas.find((a) => a.state === state)?.cities || [];
                  return (
                    <div key={state} className="rg-area-state">
                      <h4>{state} {selected.length > 0 && <span>{selected.length} selected</span>}</h4>
                      <div className="rg-chips">
                        {cities.map((city) => (
                          <button key={city} type="button" className={`rg-chip-btn${selected.includes(city) ? ' is-on' : ''}`} aria-pressed={selected.includes(city)}
                            onClick={() => toggleHostingCity(state, city)}>{city}</button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {[
            ['email', <Bell size={16} />, isHost ? 'Email me when a traveller posts in my hosting areas' : 'Email me when a host posts in my city', 'Email me about new posts'],
            ['messages', <Mail size={16} />, 'Email me when someone sends me a message', 'Email me about new messages'],
            ['signIns', <ShieldCheck size={16} />, 'Email me when someone signs in to my account or changes my password', 'Email me about sign-ins'],
          ].map(([key, icon, label, aria]) => (
            <div key={key} className="pf-toggle-row">
              <span>{icon} {label}</span>
              <button type="button" role="switch" aria-checked={!!editFormData.notificationPreferences[key]} aria-label={aria}
                className={`pf-switch${editFormData.notificationPreferences[key] ? ' is-on' : ''}`}
                onClick={() => setEditFormData((p) => ({ ...p, notificationPreferences: { ...p.notificationPreferences, [key]: !p.notificationPreferences[key] } }))}>
                <span />
              </button>
            </div>
          ))}
        </GlassDialog>

        <VerifyPhoneDialog open={showVerify} onClose={() => setShowVerify(false)}
          onVerified={() => { setShowVerify(false); showToast('Phone verified — you now have a ✓ badge'); fetchUser(); }} />

        {/* ═════ Change password ═════ */}
        <GlassDialog open={showChangePassword} onClose={closeChangePasswordModal} size="sm"
          icon={<KeyRound size={17} />} title={t('changePassword')} subtitle={t('manageAccountSecurity')}
          footer={(
            <>
              <button type="button" className="rg-btn rg-btn-ghost" onClick={closeChangePasswordModal} disabled={pwLocked}>{t('cancel')}</button>
              <button type="button" className="rg-btn rg-btn-primary pb-submit" onClick={changePassword} disabled={changingPassword || pwFormInvalid || pwLocked}>
                {changingPassword ? <><span className="rg-spinner" /> {t('changingPassword')}</> : t('changePassword')}
              </button>
            </>
          )}>
          {pwLocked ? (
            <div className="pf-pw-done" role="status">
              <span className="pf-pw-done-icon"><Check size={28} /></span>
              <strong>Password changed</strong>
              <p>Closing in {passwordSuccessCountdown}…</p>
            </div>
          ) : (
            <>
              {passwordError && <div className="rg-alert" role="alert"><AlertTriangle size={17} /> {passwordError}</div>}
              <div className="rg-field">
                <label className="rg-label" htmlFor="pf-pw-current">{t('currentPasswordLabel')}</label>
                <div className="rg-inline">
                  <span className="rg-input-icon"><Lock size={15} /></span>
                  <input id="pf-pw-current" type={showCurrentPassword ? 'text' : 'password'} autoComplete="current-password" className="rg-input rg-input--iconed" style={{ paddingRight: '3rem' }}
                    value={currentPassword} placeholder={t('enterCurrentPassword')} onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(''); }} />
                  <button type="button" className="rg-eye" onClick={() => setShowCurrentPassword((v) => !v)} aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}>{showCurrentPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                </div>
              </div>
              <div className="rg-field">
                <label className="rg-label" htmlFor="pf-pw-new">{t('newPasswordLabel')}</label>
                <div className="rg-inline">
                  <span className="rg-input-icon"><Lock size={15} /></span>
                  <input id="pf-pw-new" type={showNewPassword ? 'text' : 'password'} autoComplete="new-password" className="rg-input rg-input--iconed" style={{ paddingRight: '3rem' }}
                    value={newPassword} placeholder={t('enterNewPassword')} onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }} />
                  <button type="button" className="rg-eye" onClick={() => setShowNewPassword((v) => !v)} aria-label={showNewPassword ? 'Hide password' : 'Show password'}>{showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                </div>
                <ul className="rg-reqs">
                  {passwordRequirements.map((req) => (
                    <li key={req.label} className={req.test(newPassword) ? 'is-met' : ''}>{req.test(newPassword) ? <Check size={12} strokeWidth={3} /> : <span className="rg-dot" />} {req.label}</li>
                  ))}
                </ul>
              </div>
              <div className="rg-field">
                <label className="rg-label" htmlFor="pf-pw-confirm">{t('confirmNewPassword')}</label>
                <div className="rg-inline">
                  <span className="rg-input-icon"><Lock size={15} /></span>
                  <input id="pf-pw-confirm" type="password" autoComplete="new-password" className="rg-input rg-input--iconed"
                    value={confirmPassword} placeholder={t('confirmNewPasswordPlaceholder')} onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }} />
                </div>
                {confirmPassword && (
                  <p className={`pf-match${newPassword === confirmPassword ? ' is-ok' : ''}`}>
                    {newPassword === confirmPassword ? <Check size={13} /> : <X size={13} />} {newPassword === confirmPassword ? t('passwordsMatch') : t('passwordsDoNotMatch')}
                  </p>
                )}
              </div>
            </>
          )}
        </GlassDialog>

      </div>
    </MotionConfig>
  );
}

export default Profile;
