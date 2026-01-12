import React, { useState, useEffect } from 'react';
import { Edit, X, Upload, Share, Copy, Users, Key, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';
import ImageWithSas from '../components/ImageWithSas';

function Profile() {
  const [user, setUser] = useState(null);
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
  
  const passwordRequirements = [
    { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
    { label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
    { label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
    { label: 'One number', test: (pw) => /\d/.test(pw) },
    { label: 'One special character', test: (pw) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw) }
  ];
  
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const fetchUser = async () => {
    try {
      const res = await api.get('user/profile');
      let fetchedUser = res.data;

      // Preserve token from localStorage
      const savedUser = JSON.parse(localStorage.getItem('user'));
      const updatedUser = { 
        ...fetchedUser, 
        token: savedUser?.token,
        role: fetchedUser.userType || savedUser?.role
      };

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
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
      <div className="loading">Loading profile...</div>
    </div>
  );

  return (
    <div className="profile-container">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0' }}>
          👤 My Profile
        </h2>
        <p style={{ color: '#64748b', margin: '0' }}>View your profile information</p>
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
                <Edit size={14} /> Edit Photo
              </button>
            ) : (
              <>
                <label 
                  htmlFor="file-input" 
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
                >
                  📁 Choose File
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
                  <Upload size={14} /> Upload
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
                  <X size={14} /> Cancel
                </button>
              </>
            )}
          </div>
          <p style={{ color: '#64748b', fontSize: '0.875rem', textAlign: 'center' }}>Upload a profile photo</p>
        </div>
        
        <div className="profile-details">
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', borderLeft: '4px solid #3b82f6' }}>
              <p style={{ margin: '0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong>📧 Email:</strong> {user.email}
              </p>
            </div>

            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', borderLeft: '4px solid #ef4444' }}>
              <p style={{ margin: '0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong>📱 Phone:</strong> {user.phone}
              </p>
            </div>

            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', borderLeft: '4px solid #6366f1' }}>
              <p style={{ margin: '0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong>📝 Name:</strong> {user.name}
              </p>
            </div>
            
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', borderLeft: '4px solid #10b981' }}>
              <p style={{ margin: '0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong>🎭 Role:</strong> {user.userType === 'Host' ? '🏠 Host' : '🎉 Guest'}
              </p>
            </div>
            
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', borderLeft: '4px solid #f59e0b' }}>
              <p style={{ margin: '0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong>📍 Location:</strong> {user.location}
              </p>
            </div>

            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', borderLeft: '4px solid #ec4899' }}>
              <p style={{ margin: '0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <strong>{user.userType === 'Host' ? '🏠 My Offerings:' : '✨ My Festival Wishes:'}</strong>
                <span style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.5' }}>{user.bio || 'Not specified'}</span>
              </p>
            </div>

            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', borderLeft: '4px solid #f59e0b' }}>
              <p style={{ margin: '0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong>🟢 Status:</strong> 
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
            
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', borderLeft: '4px solid #8b5cf6' }}>
              <p style={{ margin: '0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong>📞 Contact Enabled:</strong> 
                <span style={{ 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '1rem', 
                  fontSize: '0.875rem',
                  background: user.isVerified ? '#dcfce7' : '#fee2e2',
                  color: user.isVerified ? '#166534' : '#dc2626'
                }}>
                  {user.isVerified ? '✓ Yes' : '✗ No'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="profile-card" style={{ marginTop: '2rem' }}>
        <div className="security-section">
          <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0' }}>
            <Key size={24} style={{ color: 'var(--primary)' }} />
            Security
          </h3>
          <p style={{ color: '#64748b', margin: '0 0 1rem 0' }}>Manage your account security</p>
          <button 
            onClick={() => setShowChangePassword(true)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
          >
            <Key size={16} />
            Change Password
          </button>
        </div>
      </div>

      {/* Refer a Friend Section */}
      <div className="referral-card" style={{ marginTop: '2rem' }}>
        <div className="referral-header">
          <h3 className="referral-title">
            <Users size={24} />
            Invite Friends & Earn Together
          </h3>
          <p className="referral-subtitle">Share FestiveGuest and unlock exclusive rewards for both of you</p>
        </div>
        
        <div className="referral-content">
          <div className="referral-code-section">
            <p className="code-label">Your Personal Referral Code</p>
            <div className="referral-code" style={{ fontSize: '1rem', padding: '0.5rem' }}>{referralCode}</div>
            <div className="referral-actions">
              <button 
                onClick={copyReferralCode}
                className="referral-btn"
              >
                <Copy size={14} style={{ marginRight: '0.25rem' }} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button 
                onClick={shareReferral}
                className="referral-btn"
              >
                <Share size={14} style={{ marginRight: '0.25rem' }} />
                Share
              </button>
            </div>
          </div>
          
          <div className="referral-benefits">
            <div className="benefit-item">
              <span className="benefit-icon">🎁</span>
              <p className="benefit-text">
                <strong>Premium Access</strong>
                Invite 3 friends and unlock 1 month of premium features including priority support and advanced search filters.
              </p>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">⭐</span>
              <p className="benefit-text">
                <strong>Mutual Rewards</strong>
                Both you and your friend receive special perks and discounts when they complete their first booking.
              </p>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">🚀</span>
              <p className="benefit-text">
                <strong>Easy Process</strong>
                Simply share your code, they register with it, and rewards activate automatically after their first booking.
              </p>
            </div>
          </div>
        </div>
      </div>



      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="modal-overlay" onClick={() => setShowChangePassword(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3><Key size={20} /> Change Password</h3>
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Current Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setPasswordError('');
                    }}
                    placeholder="Enter current password"
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError('');
                    }}
                    placeholder="Enter new password (min 8 characters)"
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="Confirm new password"
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
                  Cancel
                </button>
                <button 
                  onClick={changePassword}
                  disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword || passwordSuccessCountdown > 0}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.75rem', opacity: (changingPassword || passwordSuccessCountdown > 0) ? 0.5 : 1 }}
                >
                  {changingPassword ? 'Changing...' : 'Change Password'}
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
