import React, { useState, useEffect } from 'react';
import { Edit, X, Upload, Share, Copy, Users, MessageSquare, Send } from 'lucide-react';
import api from '../utils/api';

function Profile() {
  const [user, setUser] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState({ subject: '', message: '' });
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  
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
    const shareText = `Join FestiveGuest and celebrate festivals with locals! Use my referral code: ${referralCode}`;
    if (navigator.share) {
      navigator.share({ text: shareText });
    } else {
      copyReferralCode();
    }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!feedback.subject || !feedback.message) {
      alert('Please fill all fields');
      return;
    }
    
    setSendingFeedback(true);
    try {
      await api.post('feedback', {
        name: user.name,
        email: user.email,
        subject: feedback.subject,
        message: feedback.message,
        userType: user.userType
      });
      setFeedbackSent(true);
      setFeedback({ subject: '', message: '' });
      setTimeout(() => setFeedbackSent(false), 3000);
    } catch (error) {
      console.error('Failed to send feedback:', error);
      alert('Failed to send feedback. Please try again.');
    } finally {
      setSendingFeedback(false);
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
          <img 
            src={previewUrl || user.profileImageUrl || 'https://via.placeholder.com/150'} 
            alt="Profile" 
            className="profile-img-preview"
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

      {/* Refer a Friend Section */}
      <div className="profile-card" style={{ marginTop: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0' }}>
            <Users size={24} style={{ color: 'var(--primary)' }} />
            Refer a Friend
          </h3>
          <p style={{ color: '#64748b', margin: '0' }}>Share FestiveGuest with friends and earn rewards!</p>
        </div>
        
        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem', border: '2px dashed var(--primary)' }}>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>Your Referral Code:</p>
            <div style={{ 
              background: 'white', 
              padding: '0.75rem 1rem', 
              borderRadius: '0.5rem', 
              border: '1px solid var(--border)',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: 'var(--primary)',
              letterSpacing: '2px'
            }}>
              {referralCode}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={copyReferralCode}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
            >
              <Copy size={16} />
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
            <button 
              onClick={shareReferral}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
            >
              <Share size={16} />
              Share
            </button>
          </div>
          
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <p style={{ margin: '0', fontSize: '0.875rem', color: '#64748b' }}>
              When friends join using your code, you both get special benefits!
            </p>
          </div>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="profile-card" style={{ marginTop: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0' }}>
            <MessageSquare size={24} style={{ color: 'var(--primary)' }} />
            Send Feedback
          </h3>
          <p style={{ color: '#64748b', margin: '0' }}>
            {user.userType === 'Host' ? 'Share your hosting experience or suggestions' : 'Tell us about your guest experience'}
          </p>
        </div>
        
        {feedbackSent ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--success)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h4>Feedback Sent Successfully!</h4>
            <p>Thank you for your valuable feedback. We'll review it and get back to you if needed.</p>
          </div>
        ) : (
          <form onSubmit={submitFeedback}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Subject</label>
                <select
                  value={feedback.subject}
                  onChange={(e) => setFeedback({...feedback, subject: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', boxSizing: 'border-box' }}
                >
                  <option value="">Select feedback type...</option>
                  {user.userType === 'Host' ? (
                    <>
                      <option value="hosting-experience">Hosting Experience</option>
                      <option value="guest-interaction">Guest Interaction</option>
                      <option value="platform-features">Platform Features</option>
                      <option value="payment-issues">Payment Issues</option>
                      <option value="safety-concerns">Safety Concerns</option>
                      <option value="suggestions">Suggestions for Improvement</option>
                    </>
                  ) : (
                    <>
                      <option value="guest-experience">Guest Experience</option>
                      <option value="host-interaction">Host Interaction</option>
                      <option value="booking-process">Booking Process</option>
                      <option value="app-usability">App Usability</option>
                      <option value="safety-concerns">Safety Concerns</option>
                      <option value="suggestions">Suggestions for Improvement</option>
                    </>
                  )}
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Message</label>
                <textarea
                  placeholder={user.userType === 'Host' ? 'Share your hosting experience, challenges, or suggestions...' : 'Tell us about your experience as a guest, any issues, or suggestions...'}
                  value={feedback.message}
                  onChange={(e) => setFeedback({...feedback, message: e.target.value})}
                  rows={5}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
              
              <button 
                type="submit" 
                disabled={sendingFeedback}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', alignSelf: 'flex-start' }}
              >
                <Send size={16} />
                {sendingFeedback ? 'Sending...' : 'Send Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Profile;
