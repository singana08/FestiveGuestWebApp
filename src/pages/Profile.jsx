import React, { useState, useEffect } from 'react';
import { Edit, X, Upload, Share, Copy, Users, Key, Eye, EyeOff, Crown } from 'lucide-react';
import api from '../utils/api';
import ImageWithSas from '../components/ImageWithSas';
import { useLanguage } from '../i18n/LanguageContext';
import locationService from '../utils/locationService';

function Profile() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState('free');
  const [successfulReferrals, setSuccessfulReferrals] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [showReferralLink, setShowReferralLink] = useState(false);
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
  const [editFormData, setEditFormData] = useState({ bio: '', hostingAreas: [] });
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
  
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      fetchUser();
    }
    locationService.getLocations()
      .then(data => setLocationData(data))
      .catch(err => console.error('Failed to load locations:', err));
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get('user/profile');
      console.log('DEBUG: Full API response:', res);
      let fetchedUser = res.data;
      console.log('DEBUG: Fetched user data:', fetchedUser);
      console.log('DEBUG: HostingAreas:', fetchedUser.hostingAreas);

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
      setEditFormData({
        bio: updatedUser.bio || '',
        hostingAreas: updatedUser.hostingAreas || []
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
      console.log('Step 1: Compressing image...');
      const compressedFile = await compressImage(selectedFile);
      
      console.log('Step 2: Getting SAS token from API...');
      const tokenRes = await api.get('user/upload-sas-token');
      console.log('SAS token response:', tokenRes.data);
      const { sasUrl } = tokenRes.data;
      
      console.log('Step 3: Uploading to blob storage...', sasUrl);
      const uploadResponse = await fetch(sasUrl, {
        method: 'PUT',
        headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': 'image/jpeg' },
        body: compressedFile
      });
      console.log('Upload response status:', uploadResponse.status);
      
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }
      
      console.log('Step 4: Confirming upload with API...');
      const imageUrl = sasUrl.split('?')[0];
      await api.post('user/confirm-upload', { imageUrl });

      alert('Profile image uploaded successfully!');
      setSelectedFile(null);
      setPreviewUrl('');
      setIsEditing(false);
      await fetchUser();
    } catch (err) {
      console.error('Upload failed:', err);
      console.error('Error details:', err.response?.data);
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
    if (!editFormData.bio || editFormData.bio.trim().length < 10) {
      setUpdateError('Bio must be at least 10 characters');
      setTimeout(() => errorMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
      return;
    }
    
    setUpdatingProfile(true);
    setUpdateError('');
    try {
      const payload = user.userType === 'Host' 
        ? { 
            bio: editFormData.bio, 
            hostingAreas: editFormData.hostingAreas.length > 0 
              ? JSON.stringify(editFormData.hostingAreas.filter(area => area.cities.length > 0)) 
              : ''
          }
        : { bio: editFormData.bio };
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
    <div className="profile-container text-center" style={{ padding: '3rem' }}>
      <div className="loading">{t('loadingProfile')}</div>
    </div>
  );

  return (
    <div className="profile-container">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0' }}>
          👤 {t('myProfile')}
        </h2>
        <p style={{ color: '#64748b', margin: '0 0 1rem 0' }}>{t('viewProfileInfo')}</p>
        {(subscriptionStatus === 'paid' || successfulReferrals >= 3) && (
          <button 
            onClick={() => setIsEditingProfile(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Edit size={16} />
            {t('editProfile')}
          </button>
        )}
        {subscriptionStatus !== 'paid' && successfulReferrals < 3 && (
          <p style={{ color: '#f59e0b', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            ⭐ {t('upgradeToPremium')} ({successfulReferrals}/3 {t('referrals')}) •{' '}
            <a href="/referrals" style={{ color: '#3b82f6', textDecoration: 'underline', fontWeight: '600' }}>
              {t('referEarnNav')}
            </a>
          </p>
        )}
      </div>
      
      <div className="profile-card">
        <div className="profile-image-section">
          <ImageWithSas 
            src={previewUrl || user.profileImageUrl} 
            alt="Profile" 
            className="profile-img-preview"
            fallbackText="Profile"
          />
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
            {!isEditing ? (
              <button 
                className="btn btn-secondary" 
                onClick={() => setIsEditing(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
              >
                <Edit size={14} /> {t('editPhoto')}
              </button>
            ) : (
              <>
                <label 
                  htmlFor="file-input" 
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
                >
                  📁 {t('chooseFile')}
                </label>
                <input 
                  id="file-input"
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }}
                />
                <button 
                  className="btn btn-primary" 
                  onClick={uploadProfileImage} 
                  disabled={!selectedFile}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
                >
                  <Upload size={14} /> {t('upload')}
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedFile(null);
                    setPreviewUrl('');
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
                >
                  <X size={14} /> {t('cancel')}
                </button>
              </>
            )}
          </div>
          <p style={{ color: '#64748b', fontSize: '0.875rem', textAlign: 'center' }}>{t('uploadProfilePhoto')}</p>
        </div>
        
        <div className="profile-details">
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', borderLeft: '4px solid #3b82f6' }}>
              <p style={{ margin: '0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong>📧 {t('email')}:</strong> {user.email}
              </p>
            </div>

            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', borderLeft: '4px solid #ef4444' }}>
              <p style={{ margin: '0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong>📱 {t('phone')}:</strong> {user.phone}
              </p>
            </div>

            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', borderLeft: '4px solid #6366f1' }}>
              <p style={{ margin: '0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong>📝 {t('name')}:</strong> {user.name}
              </p>
            </div>
            
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', borderLeft: '4px solid #10b981' }}>
              <p style={{ margin: '0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong>🎭 {t('role')}:</strong> {user.userType === 'Host' ? `🏠 ${t('host')}` : `🎉 ${t('guest')}`}
              </p>
            </div>
            
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', borderLeft: '4px solid #f59e0b' }}>
              <p style={{ margin: '0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong>📍 {t('location')}:</strong> {user.location}
              </p>
            </div>

            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', borderLeft: '4px solid #ec4899' }}>
              <p style={{ margin: '0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <strong>{user.userType === 'Host' ? `🏠 ${t('myOfferings')}:` : `✨ ${t('myFestivalWishes')}:`}</strong>
                <span style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.5' }}>{user.bio || t('notSpecified')}</span>
              </p>
            </div>

            {console.log('DEBUG: Checking hosting areas display:', { userType: user.userType, hostingAreas: user.hostingAreas, hasAreas: user.hostingAreas && user.hostingAreas.length > 0 })}
            {user.userType === 'Host' && (
              <div style={{ 
                padding: '1rem', 
                background: '#f0fdf4', 
                borderRadius: '0.75rem', 
                borderLeft: '4px solid #16a34a'
              }}>
                <p style={{ 
                  margin: '0 0 0.75rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 'bold'
                }}>
                  🗺️ {t('myHostingAreas')}:
                </p>
                {user.hostingAreas && user.hostingAreas.length > 0 ? (
                  user.hostingAreas
                    .filter(area => area.state && area.state.trim() !== '' && area.cities && area.cities.length > 0)
                    .length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {user.hostingAreas
                          .filter(area => area.state && area.state.trim() !== '' && area.cities && area.cities.length > 0)
                          .map((area, index) => (
                            <div key={`${area.state}-${index}`} style={{ 
                              color: '#15803d', 
                              fontSize: '0.9rem',
                              lineHeight: '1.4'
                            }}>
                              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{area.state}</div>
                              <div style={{ paddingLeft: '1rem', fontSize: '0.85rem' }}>
                                {area.cities.join(', ')}
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    ) : (
                      <div style={{ 
                        color: '#64748b', 
                        fontSize: '0.9rem', 
                        fontStyle: 'italic',
                        lineHeight: '1.4'
                      }}>
                        {t('noHostingAreas')}
                      </div>
                    )
                ) : (
                  <div style={{ 
                    color: '#64748b', 
                    fontSize: '0.9rem', 
                    fontStyle: 'italic',
                    lineHeight: '1.4'
                  }}>
                    {t('noHostingAreas')}
                  </div>
                )}
              </div>
            )}

            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', borderLeft: '4px solid #f59e0b' }}>
              <p style={{ margin: '0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong>🟢 {t('status')}:</strong> 
                <span style={{ 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '1rem', 
                  fontSize: '0.875rem',
                  background: user.status === 'Active' ? '#dcfce7' : '#fef3c7',
                  color: user.status === 'Active' ? '#166534' : '#92400e'
                }}>
                  {user.status}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div style={{ marginTop: '2rem', background: 'var(--surface)', padding: '2rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', border: '1px solid var(--border)', textAlign: 'center' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0' }}>
          <Key size={24} style={{ color: 'var(--primary)' }} />
          {t('security')}
        </h3>
        <p style={{ color: '#64748b', margin: '0 0 1rem 0' }}>{t('manageAccountSecurity')}</p>
        <button 
          onClick={() => setShowChangePassword(true)}
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Key size={16} />
          {t('changePassword')}
        </button>
      </div>

      {/* Subscription Section */}
      <div style={{ marginTop: '2rem', background: 'var(--surface)', padding: '2rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 0 1rem 0' }}>
          <Crown size={24} style={{ color: subscriptionStatus === 'paid' ? '#f59e0b' : '#64748b' }} />
          {t('subscription')}
        </h3>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '1.5rem' }}>
          {t('currentStatus')}: 
          <span style={{ 
            fontWeight: 'bold', 
            color: subscriptionStatus === 'paid' ? '#10b981' : subscriptionStatus === 'pending' ? '#f59e0b' : '#64748b',
            padding: '0.25rem 0.75rem',
            borderRadius: '1rem',
            background: subscriptionStatus === 'paid' ? '#dcfce7' : subscriptionStatus === 'pending' ? '#fef3c7' : '#f1f5f9',
            marginLeft: '0.5rem'
          }}>
            {subscriptionStatus === 'paid' ? `✓ ${t('premium')}` : subscriptionStatus === 'pending' ? t('pendingApproval') : t('free')}
          </span>
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Free Plan */}
          <div style={{
            background: 'white',
            border: '2px solid #e2e8f0',
            borderRadius: '0.75rem',
            padding: '1.5rem'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>{t('freePlan')}</h4>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>₹0</div>
            <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>{t('foreverFree')}</div>
            {subscriptionStatus === 'free' && (
              <div style={{ padding: '0.5rem', background: '#f1f5f9', borderRadius: '0.375rem', textAlign: 'center', color: '#64748b', fontWeight: '600', fontSize: '0.9rem' }}>
                {t('currentPlan')}
              </div>
            )}
          </div>

          {/* Premium Plan */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: '2px solid #667eea',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            color: 'white',
            position: 'relative'
          }}>
            {subscriptionStatus === 'paid' && (
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: '15px',
                background: '#f59e0b',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '1rem',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>
                ACTIVE
              </div>
            )}
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Crown size={20} style={{ color: '#f59e0b' }} />
              {t('premium')}
            </h4>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>₹{user.userType === 'Host' ? 299 : 199}</div>
            <div style={{ opacity: 0.8, fontSize: '0.85rem', marginBottom: '1rem' }}>3 {t('months')} • {t('nonRefundable')}</div>
            {subscriptionStatus !== 'paid' && subscriptionStatus !== 'pending' && (
              <button
                onClick={() => window.open(`https://wa.me/919966888484?text=${encodeURIComponent('I want to upgrade my subscription.')}`, '_blank')}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'white',
                  color: '#667eea',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.95rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {t('upgradeViaWhatsApp')}
              </button>
            )}
            {subscriptionStatus === 'pending' && (
              <div style={{ padding: '0.75rem', background: 'rgba(251, 191, 36, 0.2)', borderRadius: '0.375rem', textAlign: 'center', fontWeight: '600', fontSize: '0.9rem' }}>
                ⏳ {t('pendingApproval')}
              </div>
            )}
            {subscriptionStatus === 'paid' && (
              <div style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '0.375rem', textAlign: 'center', fontWeight: '600', fontSize: '0.9rem' }}>
                ✓ {t('youArePremium')}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="modal-overlay" onClick={() => setShowChangePassword(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3><Key size={20} /> {t('changePassword')}</h3>
              <button onClick={() => setShowChangePassword(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              {passwordError && (
                <div style={{ 
                  color: passwordError.includes('✅') ? '#16a34a' : '#dc2626', 
                  background: passwordError.includes('✅') ? '#dcfce7' : '#fee2e2', 
                  padding: '0.75rem', 
                  borderRadius: '0.375rem', 
                  marginBottom: '1rem',
                  fontSize: '0.875rem'
                }}>
                  {passwordError.includes('✅') ? (
                    <div style={{ textAlign: 'center' }}>
                      {passwordError}
                      {passwordSuccessCountdown > 0 && (
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                          {passwordSuccessCountdown}
                        </div>
                      )}
                    </div>
                  ) : (
                    `⚠️ ${passwordError}`
                  )}
                </div>
              )}
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>{t('currentPasswordLabel')}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setPasswordError('');
                    }}
                    placeholder={t('enterCurrentPassword')}
                    disabled={passwordSuccessCountdown > 0}
                    style={{ fontSize: '1rem', padding: '0.75rem', width: '100%', paddingRight: '2.5rem', opacity: passwordSuccessCountdown > 0 ? 0.5 : 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b'
                    }}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>{t('newPasswordLabel')}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError('');
                    }}
                    placeholder={t('enterNewPassword')}
                    disabled={passwordSuccessCountdown > 0}
                    style={{ fontSize: '1rem', padding: '0.75rem', width: '100%', paddingRight: '2.5rem', opacity: passwordSuccessCountdown > 0 ? 0.5 : 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b'
                    }}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {passwordRequirements.map((req, index) => {
                    const isMet = req.test(newPassword);
                    return (
                      <div key={index} style={{ 
                        fontSize: '0.75rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.25rem',
                        color: isMet ? '#16a34a' : '#dc2626',
                        transition: 'color 0.2s'
                      }}>
                        <span style={{ fontSize: '0.9rem' }}>{isMet ? '✓' : '○'}</span>
                        {req.label}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>{t('confirmNewPassword')}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder={t('confirmNewPasswordPlaceholder')}
                  disabled={passwordSuccessCountdown > 0}
                  style={{ fontSize: '1rem', padding: '0.75rem', width: '100%', opacity: passwordSuccessCountdown > 0 ? 0.5 : 1 }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button 
                  onClick={() => {
                    setShowChangePassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError('');
                  }}
                  className="btn btn-secondary"
                  disabled={passwordSuccessCountdown > 0}
                  style={{ flex: 1, padding: '0.75rem', opacity: passwordSuccessCountdown > 0 ? 0.5 : 1 }}
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={changePassword}
                  disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword || passwordSuccessCountdown > 0}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.75rem', opacity: (changingPassword || passwordSuccessCountdown > 0) ? 0.5 : 1 }}
                >
                  {changingPassword ? t('changingPassword') : t('changePassword')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="modal-overlay" onClick={() => setIsEditingProfile(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3><Edit size={20} /> {t('editProfile')}</h3>
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
                      const hasState = selectedCities.length > 0;
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
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button 
                  onClick={() => {
                    setIsEditingProfile(false);
                    setUpdateError('');
                  }}
                  className="btn btn-secondary"
                  disabled={updatingProfile}
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={updateProfile}
                  disabled={updatingProfile}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.75rem', opacity: updatingProfile ? 0.5 : 1 }}
                >
                  {updatingProfile ? t('updating') : t('saveChanges')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Profile;
