import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, X, Upload, Key, Eye, EyeOff, Crown, MapPin, Mail, Phone, Bell, Lock, Check } from 'lucide-react';
import api from '../utils/api';
import ImageWithSas from '../components/ImageWithSas';
import { useLanguage } from '../i18n/LanguageContext';
import locationService from '../utils/locationService';
import useSEO from '../hooks/useSEO';

const InfoRow = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9', minWidth: 0 }}>
    <span style={{ color: 'var(--primary)', display: 'flex', flexShrink: 0 }}>{icon}</span>
    <span style={{ fontSize: '0.8rem', color: '#94a3b8', flexShrink: 0, whiteSpace: 'nowrap' }}>{label}</span>
    <span title={value} style={{ fontSize: '0.875rem', color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{value}</span>
  </div>
);

const StatBox = ({ value, label, color }) => (
  <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.625rem', textAlign: 'center' }}>
    <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{value}</div>
    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem' }}>{label}</div>
  </div>
);

function Profile() {
  useSEO({ title: 'My Profile', noindex: true });
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState('free');
  const [successfulReferrals, setSuccessfulReferrals] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [showReferralInfo, setShowReferralInfo] = useState(false);
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
  const [editFormData, setEditFormData] = useState({ name: '', phone: '', state: '', city: '', bio: '', hostingAreas: [], notificationPreferences: { email: true, push: false } });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [locationData, setLocationData] = useState(null);
  const errorMessageRef = React.useRef(null);
  
  const passwordRequirements = [
    { label: t('atLeast8Chars'), test: (pw) => pw.length >= 8 },
    { label: t('oneUppercase'), test: (pw) => /[A-Z]/.test(pw) },
    { label: t('oneLowercase'), test: (pw) => /[a-z]/.test(pw) },
    { label: t('oneNumber'), test: (pw) => /\d/.test(pw) },
    { label: t('oneSpecialChar'), test: (pw) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw) }
  ];

  // Shared styling for the Change Password modal's inputs, so the icon +
  // focus-ring treatment stays consistent across all three fields.
  const pwInputStyle = (disabled) => ({
    fontSize: '0.95rem', padding: '0.75rem 2.5rem 0.75rem 2.5rem', width: '100%',
    border: '1.5px solid var(--border-strong)', borderRadius: 'var(--radius-sm)',
    background: 'var(--background)', color: 'var(--text)', outline: 'none',
    transition: 'all 0.2s', boxSizing: 'border-box', opacity: disabled ? 0.5 : 1,
  });
  const pwInputFocus = (e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.1)'; };
  const pwInputBlur = (e) => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; };

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      fetchUser();
    }
    locationService.getLocations()
      .then(data => setLocationData(data))
      .catch(err => console.error('Failed to load locations:', err));
  }, []);

  useEffect(() => {
    const anyOpen = showReferralInfo || showChangePassword || isEditingProfile;
    document.body.style.overflow = anyOpen ? 'hidden' : '';
    document.documentElement.style.overflow = anyOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [showReferralInfo, showChangePassword, isEditingProfile]);

  const fetchUser = async () => {
    try {
      const res = await api.get('user/profile');
      let fetchedUser = res.data;

      const savedUser = JSON.parse(localStorage.getItem('user'));
      const updatedUser = { 
        ...fetchedUser, 
        token: savedUser?.token,
        role: fetchedUser.userType || savedUser?.role
      };

      setUser(updatedUser);
      setSubscriptionStatus(fetchedUser.subscriptionStatus || 'free');
      setSuccessfulReferrals(fetchedUser.successfulReferrals || 0);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Initialize edit form data
      const loc = updatedUser.location || '';
      const locParts = loc.split(', ');
      setEditFormData({
        name: updatedUser.name || '',
        phone: updatedUser.phone || '',
        state: locParts[1] || '',
        city: locParts[0] || '',
        bio: updatedUser.bio || '',
        hostingAreas: updatedUser.hostingAreas || [],
        notificationPreferences: updatedUser.notificationPreferences || { email: true, push: false }
      });
      
      // Use referral code from API response
      setReferralCode(updatedUser.referralCode || 'Loading...');
      
      // Dispatch storage event to sync with App.jsx state
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('User not found');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadProfileImage = async () => {
    if (!selectedFile || !user) {
      alert('Please select a file and ensure your profile is loaded before uploading.');
      return;
    }
    try {
      const compressedFile = await compressImage(selectedFile);
      const tokenRes = await api.get('user/upload-sas-token');
      const { sasUrl } = tokenRes.data;
      const uploadResponse = await fetch(sasUrl, {
        method: 'PUT',
        headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': 'image/jpeg' },
        body: compressedFile
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      const imageUrl = sasUrl.split('?')[0];
      await api.post('user/confirm-upload', { imageUrl });

      alert('Profile image uploaded successfully!');
      setSelectedFile(null);
      setPreviewUrl('');
      setIsEditing(false);
      await fetchUser();
    } catch (err) {
      alert('Image upload failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        let { width, height } = img;
        const maxSize = 800;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.8);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = () => {
    const shareText = `🎉 Join FestiveGuest and celebrate festivals with locals! Use my referral code: ${referralCode} when registering to get special benefits!`;
    if (navigator.share) {
      navigator.share({ text: shareText });
    } else {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const updateProfile = async () => {
    if (!editFormData.name || editFormData.name.trim().length < 2) {
      setUpdateError('Name must be at least 2 characters');
      setTimeout(() => errorMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
      return;
    }
    if (!editFormData.bio || editFormData.bio.trim().length < 10) {
      setUpdateError('Bio must be at least 10 characters');
      setTimeout(() => errorMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
      return;
    }
    
    setUpdatingProfile(true);
    setUpdateError('');
    try {
      const location = editFormData.city && editFormData.state 
        ? `${editFormData.city}, ${editFormData.state}` 
        : user.location;
      const payload = {
        name: editFormData.name.trim(),
        phone: editFormData.phone,
        location,
        bio: editFormData.bio,
        notificationPreferences: editFormData.notificationPreferences,
        ...(user.userType === 'Host' && {
          hostingAreas: editFormData.hostingAreas.length > 0 
            ? JSON.stringify(editFormData.hostingAreas.filter(area => area.cities.length > 0)) 
            : ''
        })
      };
      const res = await api.put('user/profile', payload);
      if (res.data.success) {
        setUpdateError('✅ Profile updated successfully!');
        setTimeout(() => errorMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
        await fetchUser();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setUpdateError(msg);
      setTimeout(() => errorMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Single close path for the Change Password modal so every way of
  // dismissing it (X button, clicking the overlay, Cancel) resets the
  // form the same way — previously only Cancel did, so closing via X or
  // the overlay left the old fields/error still showing next time it opened.
  const closeChangePasswordModal = () => {
    setShowChangePassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill all password fields');
      return;
    }
    const allRequirementsMet = passwordRequirements.every(req => req.test(newPassword));
    if (!allRequirementsMet) {
      setPasswordError('New password must meet all requirements');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    setChangingPassword(true);
    setPasswordError('');
    try {
      const res = await api.post('auth/change-password', {
        currentPassword,
        newPassword
      });
      if (res.data.success) {
        setPasswordError('✅ Password changed successfully!');
        setPasswordSuccessCountdown(5);
        const countdownInterval = setInterval(() => {
          setPasswordSuccessCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              setShowChangePassword(false);
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setPasswordError('');
              setPasswordSuccessCountdown(0);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setPasswordError(msg);
    } finally {
      setChangingPassword(false);
    }
  };



  if (!user) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ width: 44, height: 44, borderRadius: '50%', border: '4px solid rgba(255,107,53,0.15)', borderTop: '4px solid var(--primary)' }}
      />
      <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>{t('loadingProfile')}</p>
    </div>
  );

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 1rem 3rem' }}>

      {/* Cover + Avatar hero */}
      <div style={{ position: 'relative', marginBottom: isEditing ? '6rem' : '4rem' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ height: 140, borderRadius: '1rem', background: 'var(--gradient-primary, linear-gradient(135deg, #FF6B35 0%, #FF8C5E 50%, #FFB347 100%))', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', right: '-2rem', top: '-2rem', width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', right: '5rem', bottom: '-3rem', width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'absolute', left: '10rem', top: '-1rem', width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        </motion.div>

        {/* Avatar overlapping the banner */}
        <div style={{ position: 'absolute', bottom: '-40px', left: '2rem' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <ImageWithSas
              src={previewUrl || user.profileImageUrl}
              alt="Profile"
              fallbackText={user.name?.charAt(0) || 'U'}
              style={{ width: 88, height: 88, borderRadius: '50%', border: '4px solid white', objectFit: 'cover', background: '#e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'block' }}
            />
            <button
              onClick={() => setIsEditing(!isEditing)}
              title="Change photo"
              style={{ position: 'absolute', bottom: 2, right: 2, background: 'var(--primary)', color: 'white', border: '2px solid white', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
            >
              <Edit size={12} />
            </button>
          </div>
        </div>

        {/* Photo editor controls */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{ position: 'absolute', bottom: '-76px', left: '2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}
            >
              <label htmlFor="profile-file-input" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', background: 'white', border: '1px solid var(--border)', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                📁 {t('chooseFile')}
              </label>
              <input id="profile-file-input" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              {selectedFile && (
                <motion.button initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={uploadProfileImage} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                  <Upload size={13} /> {t('upload')}
                </motion.button>
              )}
              <button onClick={() => { setIsEditing(false); setSelectedFile(null); setPreviewUrl(''); }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', background: 'none', border: '1px solid var(--border)', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                <X size={13} /> {t('cancel')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Name + badges */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ paddingLeft: '2rem', marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}
      >
        <div>
          <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 800 }}>{user.name}</h2>
          <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.875rem' }}>
            {user.userType === 'Host' ? '🏠 Host' : '🎉 Guest'}{user.location ? ` · ${user.location}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ padding: '0.35rem 0.85rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 700, background: subscriptionStatus === 'paid' ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : '#f1f5f9', color: subscriptionStatus === 'paid' ? 'white' : '#64748b' }}>
            {subscriptionStatus === 'paid' ? '👑 Premium' : subscriptionStatus === 'pending' ? '⏳ Pending' : '✦ Free'}
          </span>
          <span style={{ padding: '0.35rem 0.85rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 600, background: user.status === 'Active' ? '#dcfce7' : '#fef3c7', color: user.status === 'Active' ? '#166534' : '#92400e' }}>
            {user.status === 'Active' ? '● Active' : user.status}
          </span>
        </div>
      </motion.div>

      {/* Two-column grid */}
      <div className="profile-grid-two-col" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.25rem', alignItems: 'start' }}>
      
        {/* LEFT sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Contact info */}
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} style={{ background: 'white', borderRadius: '0.875rem', border: '1px solid var(--border)', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 0.875rem', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contact</h4>
            <InfoRow icon={<Mail size={14} />} label="Email" value={user.email} />
            <InfoRow icon={<Phone size={14} />} label="Phone" value={user.phone || '—'} />
            <InfoRow icon={<MapPin size={14} />} label="Location" value={user.location || '—'} />
            <InfoRow icon={<Bell size={14} />} label="Email alerts" value={user.notificationPreferences?.email !== false ? 'On' : 'Off'} />
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} style={{ background: 'white', borderRadius: '0.875rem', border: '1px solid var(--border)', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 0.875rem', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Activity</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <StatBox value={successfulReferrals} label="Referrals" color="var(--primary)" />
              <StatBox value={user.referralPoints || 0} label="Points" color="#10b981" />
            </div>
          </motion.div>

          {/* Account actions */}
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} style={{ background: 'white', borderRadius: '0.875rem', border: '1px solid var(--border)', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 0.875rem', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Account</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(subscriptionStatus === 'paid' || successfulReferrals >= 3) ? (
                <button onClick={() => setIsEditingProfile(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.6rem 0.75rem', background: 'rgba(255,107,53,0.08)', border: 'none', borderRadius: '0.5rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }}>
                  <Edit size={14} /> {t('editProfile')}
                </button>
              ) : (
                <div style={{ padding: '0.6rem 0.75rem', background: '#fef9c3', borderRadius: '0.5rem', fontSize: '0.78rem', color: '#854d0e', lineHeight: 1.5 }}>
                  ⭐ {successfulReferrals}/3 referrals to unlock editing ·{' '}
                  <a href="/referrals" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>{t('referEarnNav')}</a>
                </div>
              )}
              <button onClick={() => setShowChangePassword(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.6rem 0.75rem', background: 'rgba(100,116,139,0.08)', border: 'none', borderRadius: '0.5rem', color: '#475569', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }}>
                <Key size={14} /> {t('changePassword')}
              </button>
            </div>
          </motion.div>
        </div>

        {/* RIGHT main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Bio */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ background: 'white', borderRadius: '0.875rem', border: '1px solid var(--border)', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {user.userType === 'Host' ? t('myOfferings') : t('myFestivalWishes')}
            </h4>
            <p style={{ margin: 0, color: user.bio ? 'var(--text)' : '#94a3b8', lineHeight: 1.65, fontSize: '0.925rem', fontStyle: user.bio ? 'normal' : 'italic' }}>
              {user.bio || (user.userType === 'Host' ? t('describeOfferings') : t('describeFestivalWishes'))}
            </p>
          </motion.div>

          {/* Hosting areas (hosts only) */}
          {user.userType === 'Host' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ background: 'white', borderRadius: '0.875rem', border: '1px solid var(--border)', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <h4 style={{ margin: '0 0 0.875rem', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🗺️ {t('myHostingAreas')}</h4>
              {user.hostingAreas && user.hostingAreas.filter(a => a.state && a.cities?.length > 0).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {user.hostingAreas.filter(a => a.state && a.cities?.length > 0).map((area, i) => (
                    <div key={i}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem' }}>{area.state}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {area.cities.map(city => (
                          <span key={city} style={{ padding: '0.2rem 0.65rem', background: '#f0fdf4', color: '#166534', borderRadius: '2rem', fontSize: '0.78rem', fontWeight: 500, border: '1px solid #86efac' }}>{city}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' }}>{t('noHostingAreas')}</p>
              )}
            </motion.div>
          )}

          {/* Subscription */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={{ background: 'white', borderRadius: '0.875rem', border: '1px solid var(--border)', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('subscription')}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Free plan */}
              <div style={{ padding: '1rem', border: (subscriptionStatus === 'free' || !subscriptionStatus) ? '2px solid var(--primary)' : '1px solid var(--border)', borderRadius: '0.75rem', background: (subscriptionStatus === 'free' || !subscriptionStatus) ? 'rgba(255,107,53,0.03)' : 'white' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{t('freePlan')}</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.3rem 0' }}>₹0</div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.75rem' }}>{t('foreverFree')}</div>
                {(subscriptionStatus === 'free' || !subscriptionStatus) && <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)' }}>✓ {t('currentPlan')}</div>}
              </div>
              {/* Premium plan */}
              <div style={{ padding: '1rem', borderRadius: '0.75rem', background: 'var(--gradient-primary, linear-gradient(135deg,#FF6B35,#FFB347))', color: 'white', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: '-1rem', top: '-1rem', width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                {subscriptionStatus === 'paid' && <div style={{ position: 'absolute', top: '-8px', right: '12px', background: '#f59e0b', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 700 }}>ACTIVE</div>}
                <div style={{ fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Crown size={14} /> {t('premium')}</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.3rem 0' }}>₹{user.userType === 'Host' ? 299 : 199}</div>
                <div style={{ fontSize: '0.78rem', opacity: 0.85, marginBottom: '0.75rem' }}>3 {t('months')} · {t('nonRefundable')}</div>
                {subscriptionStatus !== 'paid' && subscriptionStatus !== 'pending' && (
                  <button onClick={() => window.open(`https://wa.me/919966888484?text=${encodeURIComponent('I want to upgrade my subscription.')}`, '_blank')} style={{ width: '100%', padding: '0.45rem', background: 'white', color: 'var(--primary)', border: 'none', borderRadius: '0.375rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                    {t('upgradeViaWhatsApp')}
                  </button>
                )}
                {subscriptionStatus === 'pending' && <div style={{ padding: '0.45rem', background: 'rgba(255,255,255,0.2)', borderRadius: '0.375rem', textAlign: 'center', fontWeight: 600, fontSize: '0.82rem' }}>⏳ {t('pendingApproval')}</div>}
                {subscriptionStatus === 'paid' && <div style={{ padding: '0.45rem', background: 'rgba(255,255,255,0.2)', borderRadius: '0.375rem', textAlign: 'center', fontWeight: 600, fontSize: '0.82rem' }}>✓ {t('youArePremium')}</div>}
              </div>
            </div>
          </motion.div>

          {/* Referral card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ background: 'white', borderRadius: '0.875rem', border: '1px solid var(--border)', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Refer &amp; Earn</h4>
              <button onClick={() => setShowReferralInfo(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', padding: '0.2rem 0.5rem', borderRadius: '0.375rem', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                How it works
              </button>
            </div>
            <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--text-light)', lineHeight: 1.5 }}>
              Share your code to earn profile-editing access · {successfulReferrals}/3 successful referrals
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
              <div style={{ flex: 1, padding: '0.7rem 1rem', background: '#f8fafc', borderRadius: '0.5rem', fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.1em', border: '1px dashed var(--border)', textAlign: 'center' }}>
                {referralCode || '—'}
              </div>
              <button onClick={copyReferralCode} style={{ padding: '0.7rem 1rem', background: copied ? '#dcfce7' : 'rgba(255,107,53,0.08)', color: copied ? '#166534' : 'var(--primary)', border: 'none', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
              <button onClick={shareReferral} style={{ padding: '0.7rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Share
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* How Referrals Work popup */}
      <AnimatePresence>
        {showReferralInfo && (
          <motion.div
            className="modal-overlay"
            onClick={() => setShowReferralInfo(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.div
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', maxWidth: 380, width: '100%', overflow: 'hidden' }}
            >
              {/* Header */}
              <div style={{ background: 'var(--gradient-primary, linear-gradient(135deg,#FF6B35,#FFB347))', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '1.25rem', marginBottom: '0.15rem' }}>🎁</div>
                  <h3 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>How Referrals Work</h3>
                </div>
                <button onClick={() => setShowReferralInfo(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>

              {/* Steps */}
              <div style={{ padding: '1.5rem' }}>
                {[
                  { step: '1', icon: '📤', title: 'Share your code', desc: 'Copy your unique referral code and share it with friends or family.' },
                  { step: '2', icon: '📝', title: 'Friend registers', desc: 'They sign up on FestiveGuest using your referral code.' },
                  { step: '3', icon: '🔓', title: 'Unlock editing', desc: '3 successful referrals unlocks profile editing — no subscription needed.' },
                ].map(({ step, icon, title, desc }) => (
                  <div key={step} style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,107,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{title}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', lineHeight: 1.5 }}>{desc}</div>
                    </div>
                  </div>
                ))}

                {/* Progress */}
                <div style={{ background: '#f8fafc', borderRadius: '0.75rem', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-light)', fontWeight: 500 }}>Your progress</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i < successfulReferrals ? 'var(--primary)' : '#e2e8f0', transition: 'background 0.3s' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: successfulReferrals >= 3 ? '#10b981' : 'var(--text)' }}>
                      {successfulReferrals >= 3 ? '✓ Unlocked!' : `${successfulReferrals}/3`}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowReferralInfo(false)}
                  style={{ width: '100%', marginTop: '1rem', padding: '0.7rem', background: 'var(--gradient-primary, linear-gradient(135deg,#FF6B35,#FFB347))', color: 'white', border: 'none', borderRadius: '0.625rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  Got it!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showChangePassword && (
          <motion.div className="modal-overlay" onClick={closeChangePasswordModal} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <motion.div className="modal-content" onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 14, scale: 0.97 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }} style={{ maxWidth: '420px' }}>
              <div className="modal-header" style={{ alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '0.75rem', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(255,107,53,0.3)', flexShrink: 0 }}>
                    <Key size={18} color="white" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{t('changePassword')}</h3>
                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 400 }}>{t('manageAccountSecurity')}</p>
                  </div>
                </div>
                <button onClick={closeChangePasswordModal} className="modal-close">×</button>
              </div>
              <div className="modal-body">
                {passwordError && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: passwordError.includes('✅') ? '#16a34a' : '#dc2626', background: passwordError.includes('✅') ? '#dcfce7' : '#fee2e2', border: `1px solid ${passwordError.includes('✅') ? 'rgba(22,163,74,0.25)' : 'rgba(220,38,38,0.25)'}`, padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.875rem', textAlign: passwordError.includes('✅') ? 'center' : 'left', justifyContent: passwordError.includes('✅') ? 'center' : 'flex-start' }}>
                    {passwordError.includes('✅') ? (<div>{passwordError}{passwordSuccessCountdown > 0 && <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{passwordSuccessCountdown}</div>}</div>) : (<><span>⚠️</span><span>{passwordError}</span></>)}
                  </div>
                )}
                <div className="form-group" style={{ marginBottom: '1.1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.85rem' }}>{t('currentPasswordLabel')}</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(''); }} placeholder={t('enterCurrentPassword')} disabled={passwordSuccessCountdown > 0} onFocus={pwInputFocus} onBlur={pwInputBlur} style={pwInputStyle(passwordSuccessCountdown > 0)} />
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>{showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: '1.1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.85rem' }}>{t('newPasswordLabel')}</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }} placeholder={t('enterNewPassword')} disabled={passwordSuccessCountdown > 0} onFocus={pwInputFocus} onBlur={pwInputBlur} style={pwInputStyle(passwordSuccessCountdown > 0)} />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>{showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                  <div style={{ marginTop: '0.6rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {passwordRequirements.map((req, index) => {
                      const isMet = req.test(newPassword);
                      return (
                        <span key={index} style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                          padding: '0.22rem 0.55rem', borderRadius: '1rem', fontSize: '0.68rem', fontWeight: 600,
                          background: isMet ? 'rgba(22,163,74,0.1)' : 'var(--surface-2)',
                          color: isMet ? '#16a34a' : 'var(--text-muted)',
                          border: `1px solid ${isMet ? 'rgba(22,163,74,0.25)' : 'var(--border)'}`,
                          transition: 'all 0.2s',
                        }}>
                          {isMet && <Check size={10} />} {req.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: '0.25rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.85rem' }}>{t('confirmNewPassword')}</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }} placeholder={t('confirmNewPasswordPlaceholder')} disabled={passwordSuccessCountdown > 0} onFocus={pwInputFocus} onBlur={pwInputBlur} style={{ ...pwInputStyle(passwordSuccessCountdown > 0), paddingRight: '1rem' }} />
                  </div>
                  {confirmPassword.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 600, color: newPassword === confirmPassword ? '#16a34a' : '#dc2626' }}>
                      {newPassword === confirmPassword ? <Check size={13} /> : <X size={13} />}
                      {newPassword === confirmPassword ? t('passwordsMatch') : t('passwordsDoNotMatch')}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                  <button onClick={closeChangePasswordModal} className="btn btn-secondary" disabled={passwordSuccessCountdown > 0} style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', whiteSpace: 'nowrap', opacity: passwordSuccessCountdown > 0 ? 0.5 : 1 }}>{t('cancel')}</button>
                  {(() => {
                    const formInvalid = !currentPassword || !newPassword || !confirmPassword
                      || !passwordRequirements.every(req => req.test(newPassword))
                      || newPassword !== confirmPassword;
                    const isDisabled = changingPassword || formInvalid || passwordSuccessCountdown > 0;
                    return (
                      <button onClick={changePassword} disabled={isDisabled} className="btn btn-primary" style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.9rem', whiteSpace: 'nowrap', opacity: isDisabled ? 0.5 : 1, cursor: isDisabled ? 'not-allowed' : 'pointer' }}>
                        {!changingPassword && <Key size={15} />}
                        {changingPassword ? t('changingPassword') : t('changePassword')}
                      </button>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditingProfile && (
          <motion.div className="modal-overlay" onClick={() => setIsEditingProfile(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <motion.div className="modal-content" onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 14, scale: 0.97 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }} style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Edit size={18} /> {t('editProfile')}</h3>
                <button onClick={() => setIsEditingProfile(false)} className="modal-close">×</button>
              </div>
              <div className="modal-body">
              {updateError && (
                <div ref={errorMessageRef} style={{ 
                  color: updateError.includes('✅') ? '#16a34a' : '#dc2626', 
                  background: updateError.includes('✅') ? '#dcfce7' : '#fee2e2', 
                  padding: '0.75rem', 
                  borderRadius: '0.375rem', 
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                  textAlign: 'center'
                }}>
                  {updateError.includes('✅') ? updateError : `⚠️ ${updateError}`}
                </div>
              )}
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>📝 {t('name')}</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => { setEditFormData({ ...editFormData, name: e.target.value }); setUpdateError(''); }}
                  style={{ fontSize: '1rem', padding: '0.75rem', width: '100%' }}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>📱 {t('phone')}</label>
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => { setEditFormData({ ...editFormData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }); setUpdateError(''); }}
                  maxLength={10}
                  style={{ fontSize: '1rem', padding: '0.75rem', width: '100%' }}
                />
              </div>
              {locationData && (
                <>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>📍 State</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {Object.keys(locationData).map(state => (
                        <button
                          key={state}
                          type="button"
                          onClick={() => setEditFormData({ ...editFormData, state, city: '' })}
                          style={{
                            padding: '0.4rem 0.8rem',
                            border: editFormData.state === state ? '2px solid var(--primary)' : '1px solid #cbd5e1',
                            background: editFormData.state === state ? 'var(--primary)' : 'white',
                            color: editFormData.state === state ? 'white' : 'var(--text)',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          {state}
                        </button>
                      ))}
                    </div>
                  </div>
                  {editFormData.state && locationData[editFormData.state] && (
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>📍 City</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {locationData[editFormData.state].map(city => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => setEditFormData({ ...editFormData, city })}
                            style={{
                              padding: '0.4rem 0.6rem',
                              border: editFormData.city === city ? '2px solid var(--primary)' : '1px solid #cbd5e1',
                              background: editFormData.city === city ? 'var(--primary)' : 'white',
                              color: editFormData.city === city ? 'white' : 'var(--text)',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              fontSize: '0.8rem'
                            }}
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  {user.userType === 'Host' ? `🏠 ${t('myOfferings')}` : `✨ ${t('myFestivalWishes')}`}
                </label>
                <textarea
                  value={editFormData.bio}
                  onChange={(e) => {
                    setEditFormData({ ...editFormData, bio: e.target.value });
                    setUpdateError('');
                  }}
                  placeholder={user.userType === 'Host' ? t('describeOfferings') : t('describeFestivalWishes')}
                  rows={4}
                  style={{ fontSize: '1rem', padding: '0.75rem', width: '100%', resize: 'vertical' }}
                />
              </div>
              {user.userType === 'Host' && (
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    🗺️ {t('hostingAreas')} <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'normal' }}>({editFormData.hostingAreas.length}/5 {t('locations')})</span>
                  </label>
                  <div style={{ 
                    maxHeight: '300px', 
                    overflow: 'auto', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '0.5rem', 
                    padding: '1rem',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#cbd5e1 #f1f5f9'
                  }}>
                    {locationData && Object.entries(locationData).map(([state, cities]) => {
                      const selectedCities = editFormData.hostingAreas.find(area => area.state === state)?.cities || [];
                      return (
                        <div key={state} style={{ marginBottom: '1rem' }}>
                          <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>{state}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {cities.map(city => {
                              const citySelected = selectedCities.includes(city);
                              return (
                                <button
                                  key={city}
                                  type="button"
                                  onClick={() => {
                                    const newAreas = [...editFormData.hostingAreas];
                                    const existingAreaIndex = newAreas.findIndex(area => area.state === state);
                                    if (existingAreaIndex >= 0) {
                                      if (citySelected) {
                                        newAreas[existingAreaIndex].cities = newAreas[existingAreaIndex].cities.filter(c => c !== city);
                                        if (newAreas[existingAreaIndex].cities.length === 0) {
                                          newAreas.splice(existingAreaIndex, 1);
                                        }
                                      } else {
                                        newAreas[existingAreaIndex].cities.push(city);
                                      }
                                      setEditFormData({ ...editFormData, hostingAreas: newAreas });
                                    } else {
                                      if (newAreas.length >= 5) {
                                        setUpdateError('You can select up to 5 locations only');
                                        setTimeout(() => errorMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
                                        return;
                                      }
                                      newAreas.push({ state, cities: [city] });
                                      setEditFormData({ ...editFormData, hostingAreas: newAreas });
                                    }
                                  }}
                                  style={{
                                    padding: '0.4rem 0.6rem',
                                    border: citySelected ? '2px solid var(--primary)' : '1px solid #cbd5e1',
                                    background: citySelected ? 'var(--primary)' : 'white',
                                    color: citySelected ? 'white' : 'var(--text)',
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {city}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="form-group" style={{ 
                padding: '1rem', 
                background: '#f8fafc', 
                borderRadius: '0.75rem', 
                border: '1px solid #e2e8f0'
              }}>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>🔔 Notifications</label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.9rem', color: '#475569' }}>Email notifications for new messages</span>
                  <button
                    type="button"
                    onClick={() => setEditFormData(prev => ({
                      ...prev,
                      notificationPreferences: {
                        ...prev.notificationPreferences,
                        email: !prev.notificationPreferences.email
                      }
                    }))}
                    style={{
                      width: '48px',
                      height: '26px',
                      borderRadius: '13px',
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 0.3s',
                      background: editFormData.notificationPreferences.email ? '#10b981' : '#cbd5e1',
                      flexShrink: 0
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: '3px',
                      left: editFormData.notificationPreferences.email ? '25px' : '3px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'white',
                      transition: 'left 0.3s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button onClick={() => { setIsEditingProfile(false); setUpdateError(''); }} className="btn btn-secondary" disabled={updatingProfile} style={{ flex: 1, padding: '0.75rem' }}>{t('cancel')}</button>
                <button onClick={updateProfile} disabled={updatingProfile} className="btn btn-primary" style={{ flex: 1, padding: '0.75rem', opacity: updatingProfile ? 0.5 : 1 }}>
                  {updatingProfile ? t('updating') : t('saveChanges')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default Profile;
