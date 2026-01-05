import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function Profile() {
  const [user, setUser] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const fetchUser = async () => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('user'));
      const role = savedUser?.role || savedUser?.partitionKey;
      const params = { userId };
      if (role) params.role = role;
      const res = await api.get('getuser', { params });
      let fetchedUser = res.data;

      // Always get fresh SAS token for profile image
      if (fetchedUser.profileImageUrl && fetchedUser.profileImageUrl.includes('blob.core.windows.net')) {
        try {
          const imgRes = await api.get('getimageurl', { params: { userId } });
          if (imgRes.data && imgRes.data.imageUrl) {
            fetchedUser.profileImageUrl = imgRes.data.imageUrl;
          }
        } catch (e) {
          console.warn('Could not obtain SAS for profile image', e?.response?.data || e.message);
        }
      }

      // Preserve token and ensure role is present
      const updatedUser = { 
        ...fetchedUser, 
        token: savedUser?.token,
        role: fetchedUser.role || fetchedUser.partitionKey || savedUser?.role
      };

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
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
    console.log('uploadProfileImage called', { selectedFile, user });
    if (!selectedFile || !user) {
      alert('Please select a file and ensure your profile is loaded before uploading.');
      return;
    }
    try {
      const compressedFile = await compressImage(selectedFile);
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('userId', user.rowKey || localStorage.getItem('userId'));

      const res = await api.post(`uploadImage`, formData);
      const imageUrl = res.data.imageUrl;

      // Save image URL to user entity
      await api.post(`createUpdateUser`, {
        userId: user.rowKey,
        role: user.partitionKey || user.role,
        profileImageUrl: imageUrl
      });

      // Refresh local state while preserving token
      const savedUser = JSON.parse(localStorage.getItem('user'));
      const updatedUser = { 
        ...user, 
        profileImageUrl: imageUrl,
        token: savedUser?.token 
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Dispatch storage event to sync with App.jsx state
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Upload failed', err);
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
        const maxSize = 400;
        
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
        
        let quality = 0.8;
        const compress = () => {
          canvas.toBlob((blob) => {
            if (blob.size > 100000 && quality > 0.1) {
              quality -= 0.1;
              compress();
            } else {
              resolve(blob);
            }
          }, 'image/jpeg', quality);
        };
        compress();
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  if (!user) return (
    <div className="profile-container text-center" style={{ padding: '3rem' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😕</div>
      <h3>Profile Not Found</h3>
      <p style={{ color: '#64748b' }}>Please register or login first to view your profile.</p>
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
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <button className="btn btn-primary" onClick={uploadProfileImage} disabled={!selectedFile}>
              Upload
            </button>
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
                <strong>🎭 Role:</strong> {user.role === 'Host' ? '🏠 Host' : '🎉 Guest'}
              </p>
            </div>
            
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', borderLeft: '4px solid #f59e0b' }}>
              <p style={{ margin: '0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong>📍 Location:</strong> {user.location}
              </p>
            </div>

            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', borderLeft: '4px solid #ec4899' }}>
              <p style={{ margin: '0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <strong>{user.role === 'Host' ? '🏠 My Offerings:' : '✨ My Festival Wishes:'}</strong>
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
                  background: user.contactEnabled ? '#dcfce7' : '#fee2e2',
                  color: user.contactEnabled ? '#166534' : '#dc2626'
                }}>
                  {user.contactEnabled ? '✓ Yes' : '✗ No'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
