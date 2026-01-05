import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';
import locationService from '../utils/locationService';

const API_BASE = 'https://api.festiveguest.com/api';

const Registration = ({ setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
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
    status: 'Active'
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [verificationOTP, setVerificationOTP] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [serverError, setServerError] = useState(null);
  const [devOtpVisible, setDevOtpVisible] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [testResult, setTestResult] = useState('');
  const [testing, setTesting] = useState(false);

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
    { label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
    { label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
    { label: 'One number', test: (pw) => /\d/.test(pw) },
    { label: 'One special character', test: (pw) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw) }
  ];

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Indian mobile number regex (10 digits, starting with 6-9)
  const indianPhoneRegex = /^[6-9]\d{9}$/;

  const validateEmail = (email) => {
    if (!email) {
      setEmailError('');
      return true;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePhone = (phone) => {
    if (!phone) {
      setPhoneError('');
      return true;
    }
    const digitsOnly = phone.replace(/\D/g, '');
    if (!indianPhoneRegex.test(digitsOnly)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number (starting with 6-9). This helps other users contact you accurately.');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    if (type === 'success') {
      setTimeout(() => {
        setToast(prev => prev ? { ...prev, hiding: true } : null);
        setTimeout(() => setToast(null), 300);
      }, 5000);
    }
  };

  const testAndSeedLocations = async () => {
    setTesting(true);
    try {
      const seedResponse = await api.post('seedlocations');
      const getResponse = await api.get('getlocations');
      setTestResult(`✅ Success! Seeded ${seedResponse.data.count} locations. Retrieved ${Object.keys(getResponse.data).length} states.`);
      locationService.clearCache();
      const newLocations = await locationService.getLocations();
      setLocationData(newLocations);
    } catch (error) {
      setTestResult(`❌ Error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    if (roleParam === 'Guest' || roleParam === 'Host') {
      setFormData(prev => ({ ...prev, role: roleParam }));
    }
  }, [location.search]);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const locations = await locationService.getLocations();
        setLocationData(locations);
      } catch (error) {
        console.error('DEBUG: Failed to load locations:', error);
        showToast('Registration Error: ' + error.message, 'error');
      }
    };
    loadLocations().catch(err => console.error('CRITICAL: loadLocations failed', err));
  }, []);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'state') newData.city = ''; // Reset city when state changes
      return newData;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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

      const finalLocation = formData.city === 'Other' ? formData.otherCity : formData.city;
      const payload = {
        ...formData,
        location: `${finalLocation}, ${formData.state}`,
        status: 'Active',
        contactEnabled: true,
        emailVerified: true, // Use literal true since we check it above
      };

      // Upload image if selected and add to payload before registration
      if (selectedFile) {
        try {
          const compressedFile = await compressImage(selectedFile);
          const imageFormData = new FormData();
          imageFormData.append('file', compressedFile);
          imageFormData.append('userId', formData.userId);
          
          const uploadRes = await api.post(`uploadimage`, imageFormData);
          payload.profileImageUrl = uploadRes.data.imageUrl;
        } catch (imgErr) {
          console.error('Image upload failed:', imgErr);
        }
      }

      console.log('Sending registration payload:', payload);
      const registrationRes = await api.post(`createupdateuser`, payload);
      let userData = registrationRes.data;

      console.log('Registration response:', userData);
      showToast('🎉 Registration successful! Welcome to FestiveGuest!', 'success');
      
      if (userData && userData.token) {
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userId', userData.rowKey || formData.userId);
        localStorage.setItem('token', userData.token);
        
        // Force update the user state immediately
        if (setUser) {
          setUser(userData);
        }
        
        // Clear registration state
        setRegisteredEmail('');
        setEmailVerified(false);
        setOtpSent(false);
        setDevOtpVisible('');
        
        // Show success message for 3 seconds before redirecting
        const redirectPath = userData.role === 'Host' ? '/host-dashboard' : '/guest-dashboard';
        showToast(`Redirecting to your ${userData.role.toLowerCase()} dashboard...`, 'success');
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 3000);
      } else {
        console.error('No token received from registration');
        showToast('Registration completed but login failed. Please login manually.', 'warning');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error) {
      const msg = error.response?.data?.error || error.message;
      if (error.response?.status === 429) {
        const rateLimitMsg = 'Too many attempts. Please wait 15 minutes and try again.';
        setServerError(rateLimitMsg);
        showToast(rateLimitMsg, 'error');
      } else {
        setServerError(msg);
        showToast('Registration failed: ' + msg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const sendRegistrationOtp = async () => {
    if (!formData.email) {
      showToast('Please enter an email address first', 'error');
      return;
    }
    setOtpSending(true);
    try {
      const res = await api.post('verifyregistrationemail', { email: formData.email, userId: formData.userId });
      setOtpSent(true);
      setRegisteredEmail(formData.email);
      if (res?.data?.otp) {
        setDevOtpVisible(res.data.otp);
        showToast('DEV OTP: ' + res.data.otp, 'success');
      } else {
        setDevOtpVisible('');
      }
      showToast('OTP sent to your email', 'success');
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setServerError(msg);
      showToast('Failed to send OTP: ' + msg, 'error');
    } finally {
      setOtpSending(false);
    }
  };

  const verifyRegistrationOtp = async () => {
    if (!verificationOTP || verificationOTP.length !== 6) {
      showToast('Please enter a valid 6-digit code', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('confirmregistrationemail', { email: formData.email, otp: verificationOTP, userId: formData.userId });
      setEmailVerified(true);
      setOtpSent(false);
      setDevOtpVisible('');
      showToast(res.data?.message || 'Email verified', 'success');
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      showToast('Verification failed: ' + msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type} ${toast.hiding ? 'hiding' : ''}`}>
            <span className="toast-icon">
              {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <div className="toast-content">
              <p className="toast-message">{toast.message}</p>
            </div>
            {toast.type !== 'success' && (
              <button 
                onClick={() => setToast(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}
      {serverError && (
        <div style={{ maxWidth: '550px', margin: '10px auto', color: '#b91c1c', background: '#fee2e2', padding: '10px', borderRadius: '6px' }}>
          <strong>Error:</strong> {serverError}
        </div>
      )}
      <div className="card" style={{ maxWidth: '550px', margin: '50px auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>
            Complete Your Registration
          </h2>
          <p style={{ color: '#64748b' }}>
            Join our community of festival enthusiasts
          </p>
        </div>
        
        {/* Disclaimer */}
        <div style={{ 
          marginBottom: '2rem', 
          padding: '1.5rem', 
          background: '#fef3c7', 
          border: '1px solid #f59e0b', 
          borderRadius: '0.75rem',
          borderLeft: '4px solid #f59e0b'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#92400e', fontSize: '1rem', fontWeight: '600' }}>⚠️ Important Disclaimer</h4>
          <div style={{ color: '#92400e', fontSize: '0.9rem', lineHeight: '1.5' }}>
            <p style={{ margin: '0 0 0.75rem 0' }}>
              <strong>FestiveGuest</strong> is a platform that connects like-minded people for festival celebrations. By registering, you acknowledge and agree that:
            </p>
            <ul style={{ margin: '0', paddingLeft: '1.25rem' }}>
              <li style={{ marginBottom: '0.5rem' }}>We are <strong>not responsible</strong> for any incidents, damages, or issues that may occur during your interactions or meetings.</li>
              <li style={{ marginBottom: '0.5rem' }}>We do <strong>not guarantee</strong> that you will find suitable hosts or guests, as this depends on availability and mutual compatibility.</li>
              <li style={{ marginBottom: '0.5rem' }}>We act solely as a <strong>platform for introductions</strong> and do not verify the background, intentions, or authenticity of users.</li>
              <li style={{ marginBottom: '0.5rem' }}>All interactions, arrangements, and meetings are <strong>at your own risk and discretion</strong>.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Payment & Financial Caution:</strong> Hosts may request payment for services (accommodation, food, etc.). It is entirely your responsibility to decide whether to pay in advance or after services are rendered. Both hosts and guests should exercise caution and verify each other's authenticity before any financial transactions.</li>
              <li>We <strong>strongly recommend</strong> meeting in public places first and taking necessary safety precautions.</li>
            </ul>
            <p style={{ margin: '0.75rem 0 0 0', fontWeight: '600' }}>
              By proceeding with registration, you accept full responsibility for your safety and interactions.
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label style={{ fontWeight: '600', color: '#374151' }}>Choose Your Role</label>
            <select 
              name="role" 
              value={formData.role} 
              onChange={handleInputChange}
              required
              style={{ fontSize: '1rem', padding: '1rem' }}
            >
              <option value="Guest">🎉 Guest</option>
              <option value="Host">🏠 Host</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{ fontWeight: '600', color: '#374151' }}>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              required
              style={{ fontSize: '1rem', padding: '1rem' }}
            />
          </div>

          <div className="form-group">
            <label style={{ fontWeight: '600', color: '#374151' }}>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => {
                handleInputChange(e);
                validateEmail(e.target.value);
              }}
              onBlur={(e) => validateEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              style={{ fontSize: '1rem', padding: '1rem', borderColor: emailError ? '#dc2626' : '#cbd5e1' }}
            />
            {emailError && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#dc2626', fontSize: '0.875rem' }}>⚠️ {emailError}</p>
            )}
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {!emailVerified && !otpSent && (
                <button type="button" className="btn btn-secondary" onClick={sendRegistrationOtp} disabled={otpSending || emailError !== ''}>
                  {otpSending ? 'Sending OTP...' : 'Send OTP'}
                </button>
              )}

              {otpSent && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={verificationOTP}
                    onChange={(e) => setVerificationOTP(e.target.value.replace(/\D/g, '').slice(0,6))}
                    placeholder="Enter OTP"
                    maxLength={6}
                    style={{ padding: '0.5rem', fontSize: '1rem', width: '160px' }}
                  />
                  <button type="button" className="btn btn-primary" onClick={verifyRegistrationOtp} disabled={loading || verificationOTP.length !== 6}>
                    Verify
                  </button>
                </div>
              )}

              {emailVerified && (
                <span style={{ color: '#16a34a', fontWeight: '600' }}>✓ Email verified</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontWeight: '600', color: '#374151' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a strong password"
                required
                style={{ fontSize: '1rem', padding: '1rem', paddingRight: '2.5rem', width: '100%', boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0'
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {passwordRequirements.map((req, index) => {
                const isMet = req.test(formData.password);
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
            <label style={{ fontWeight: '600', color: '#374151' }}>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={(e) => {
                handleInputChange(e);
                validatePhone(e.target.value);
              }}
              onBlur={(e) => validatePhone(e.target.value)}
              placeholder="Enter your 10-digit mobile number"
              required
              style={{ fontSize: '1rem', padding: '1rem', borderColor: phoneError ? '#dc2626' : '#cbd5e1' }}
            />
            {phoneError && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#dc2626', fontSize: '0.875rem' }}>⚠️ {phoneError}</p>
            )}
          </div>

          <div className="form-group">
            <label style={{ fontWeight: '600', color: '#374151' }}>State</label>
            <select 
              name="state" 
              value={formData.state} 
              onChange={handleInputChange}
              required
              style={{ fontSize: '1rem', padding: '1rem' }}
            >
              <option value="">Select State</option>
              {Object.keys(locationData || {}).map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label style={{ fontWeight: '600', color: '#374151' }}>City</label>
            <select 
              name="city" 
              value={formData.city} 
              onChange={handleInputChange}
              required
              disabled={!formData.state}
              style={{ fontSize: '1rem', padding: '1rem' }}
            >
              <option value="">Select City</option>
              {formData.state && locationData[formData.state] && locationData[formData.state].map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {formData.city === 'Other' && (
            <div className="form-group">
              <label style={{ fontWeight: '600', color: '#374151' }}>Enter Your City</label>
              <input
                type="text"
                name="otherCity"
                value={formData.otherCity}
                onChange={handleInputChange}
                placeholder="Name of your city"
                required
                style={{ fontSize: '1rem', padding: '1rem' }}
              />
            </div>
          )}

          <div className="form-group">
            <label style={{ fontWeight: '600', color: '#374151' }}>
              {formData.role === 'Host' ? 'Your Offerings' : 'Your Festival Wishes'}
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder={formData.role === 'Host' ? 'Tell guests what you offer (e.g., accommodation, traditional food, local tours)...' : 'Tell hosts what you are looking for (e.g., specific festivals, types of food, culture)...'}
              required
              rows="4"
              maxLength={250}
              style={{ fontSize: '1rem', padding: '1rem', width: '100%', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
            />
            <div style={{ textAlign: 'right', fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
              {formData.bio.length}/250 characters
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontWeight: '600', color: '#374151' }}>Profile Photo (Optional)</label>
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              style={{ 
                fontSize: '1rem', 
                padding: '1rem',
                border: '2px dashed #e2e8f0',
                borderRadius: '0.5rem',
                background: '#f8fafc',
                width: '100%'
              }}
            />
            {selectedFile && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#10b981', fontSize: '0.875rem' }}>
                ✓ {selectedFile.name} selected
              </p>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
            {loading ? 'Registering...' : 'Register Now'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: '0', color: '#64748b', fontSize: '1.05rem' }}>
            Already have an account? <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ marginLeft: '0.5rem', padding: '0.5rem 1.5rem' }}>Login</button>
          </p>
        </div>
        
        {/* Debug section - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#f3f4f6', borderRadius: '0.5rem', fontSize: '0.8rem' }}>
            <p><strong>Debug Info:</strong></p>
            <p>Location Data Keys: {Object.keys(locationData || {}).length > 0 ? Object.keys(locationData || {}).join(', ') : 'No locations loaded'}</p>
            <button type="button" onClick={testAndSeedLocations} disabled={testing} style={{ padding: '0.5rem', fontSize: '0.8rem' }}>
              {testing ? 'Testing...' : 'Test & Seed Locations'}
            </button>
            {testResult && <p style={{ marginTop: '0.5rem', color: testResult.includes('✅') ? 'green' : 'red' }}>{testResult}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Registration;
