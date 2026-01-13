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
    status: 'Active',
    hostingAreas: [] // New field for hosting areas
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [verificationOTP, setVerificationOTP] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [serverError, setServerError] = useState(null);
  const [devOtpVisible, setDevOtpVisible] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [testResult, setTestResult] = useState('');
  const [testing, setTesting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [registrationSuccessCountdown, setRegistrationSuccessCountdown] = useState(0);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [showHostingModal, setShowHostingModal] = useState(false);
  const [tempHostingAreas, setTempHostingAreas] = useState([]);
  const [tempCityCount, setTempCityCount] = useState(0);

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
      const seedResponse = await locationService.seedLocations();
      const getResponse = await locationService.getLocations();
      setTestResult(`✅ Success! Seeded ${seedResponse.count || 'some'} locations. Retrieved ${Object.keys(getResponse).length} states.`);
      setLocationData(getResponse);
    } catch (error) {
      setTestResult(`❌ Error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    const referralCodeParam = params.get('referralCode');
    const disclaimerAcceptedParam = params.get('disclaimerAccepted');
    
    // Security check for disclaimer acceptance
    const storedAcceptance = sessionStorage.getItem('disclaimerAcceptance');
    if (!storedAcceptance || !disclaimerAcceptedParam) {
      navigate('/');
      return;
    }
    
    try {
      const acceptanceData = JSON.parse(storedAcceptance);
      const timeDiff = Date.now() - acceptanceData.timestamp;
      
      // Check if acceptance is recent (within 10 minutes) and matches URL param
      if (timeDiff > 600000 || acceptanceData.timestamp.toString() !== disclaimerAcceptedParam) {
        sessionStorage.removeItem('disclaimerAcceptance');
        navigate('/');
        return;
      }
    } catch (error) {
      navigate('/');
      return;
    }
    
    if (roleParam === 'Guest' || roleParam === 'Host') {
      setFormData(prev => ({ ...prev, role: roleParam }));
    }
    
    if (referralCodeParam) {
      setFormData(prev => ({ ...prev, ReferredBy: referralCodeParam }));
    }
  }, [location.search, navigate]);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        console.log('Loading locations using locationService...');
        const locations = await locationService.getLocations();
        console.log('Locations loaded successfully:', locations);
        setLocationData(locations);
      } catch (error) {
        console.error('DEBUG: Failed to load locations:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          url: error.config?.url
        });
        showToast('Registration Error: ' + error.message, 'error');
      }
    };
    loadLocations().catch(err => console.error('CRITICAL: loadLocations failed', err));
  }, []);



  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    handleInputChange(e);
    validateEmail(newEmail);
    
    // Reset verification if email changes
    if (newEmail !== verifiedEmail) {
      setEmailVerified(false);
      setOtpSent(false);
      setVerificationOTP('');
    }
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
    
    // Validate required fields
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.password.trim()) errors.password = 'Password is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.state) errors.state = 'State is required';
    if (!formData.city) errors.city = 'City is required';
    if (!formData.bio.trim()) errors.bio = 'Bio is required';
    if (!ageConfirmed) errors.ageConfirmed = 'You must confirm that you are at least 18 years old';
    
    // Validate hosting areas for hosts
    if (formData.role === 'Host') {
      const hasValidAreas = formData.hostingAreas.some(area => area.cities && area.cities.length > 0);
      if (!hasValidAreas) {
        errors.hostingAreas = 'Please select at least one hosting area';
        showToast('Hosts must select at least one hosting area', 'error');
      }
    }
    
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    
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

      // Validate disclaimer acceptance from session
      const storedAcceptance = sessionStorage.getItem('disclaimerAcceptance');
      if (!storedAcceptance) {
        setServerError('Disclaimer acceptance expired. Please start registration again.');
        showToast('Please accept the disclaimer again', 'error');
        navigate('/');
        return;
      }

      try {
        const acceptanceData = JSON.parse(storedAcceptance);
        const timeDiff = Date.now() - acceptanceData.timestamp;
        
        if (timeDiff > 600000) { // 10 minutes
          setServerError('Disclaimer acceptance expired. Please start registration again.');
          sessionStorage.removeItem('disclaimerAcceptance');
          showToast('Disclaimer acceptance expired', 'error');
          navigate('/');
          return;
        }
      } catch (error) {
        setServerError('Invalid disclaimer acceptance. Please start registration again.');
        navigate('/');
        return;
      }

      const finalLocation = formData.city === 'Other' ? formData.otherCity : formData.city;
      const payload = {
        email: verifiedEmail, // Use verified email, not current form email
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        userType: formData.role,
        location: `${finalLocation}, ${formData.state}`,
        bio: formData.bio,
        ReferredBy: formData.ReferredBy || null,
        hostingAreas: formData.role === 'Host' ? (formData.hostingAreas.length > 0 && formData.hostingAreas.some(area => area.cities.length > 0) ? JSON.stringify(formData.hostingAreas.filter(area => area.cities.length > 0)) : '') : null
      };

      console.log('Sending registration payload:', payload);
      const registrationRes = await api.post(`auth/register`, payload);
      let userData = registrationRes.data;
      console.log('Registration response:', userData);

      if (userData.success || userData.message === 'User registered successfully') {
        // Clear disclaimer acceptance after successful registration
        sessionStorage.removeItem('disclaimerAcceptance');
        showToast('🎉 Registration successful!', 'success');
        setRegistrationSuccessCountdown(5);
        const countdownInterval = setInterval(() => {
          setRegistrationSuccessCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              navigate('/login');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        throw new Error(userData.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response?.data);
      const msg = error.response?.data?.message || error.response?.data?.error || error.message;
      if (error.response?.status === 429) {
        const rateLimitMsg = 'Too many attempts. Please wait 15 minutes and try again.';
        setServerError(rateLimitMsg);
        showToast(rateLimitMsg, 'error');
      } else if (error.response?.status === 500) {
        const serverMsg = 'Server error occurred. Please try again later or contact support if the issue persists.';
        setServerError(`Server Error: ${msg || 'Internal server error'}`);
        showToast(serverMsg, 'error');
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
      console.log('Sending OTP request:', { email: formData.email, purpose: 'registration' });
      const res = await api.post('email/send-otp', { 
        email: formData.email,
        purpose: 'registration'
      });
      console.log('OTP response:', res.data);
      if (res.data.success) {
        setOtpSent(true);
        setRegisteredEmail(formData.email);
        showToast('OTP sent to your email', 'success');
      }
    } catch (err) {
      console.error('OTP Error Details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        fullResponse: err.response
      });
      console.error('Full error object:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.response?.data || err.message;
      setServerError(JSON.stringify(err.response?.data) || msg);
      showToast('Failed to send OTP: ' + msg, 'error');
    } finally {
      setOtpSending(false);
    }
  };

  const verifyRegistrationOtp = async () => {
    if (!verificationOTP || verificationOTP.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP code');
      return;
    }
    setLoading(true);
    setOtpError('');
    try {
      const res = await api.post('email/validate-otp', { email: formData.email, otpCode: verificationOTP });
      if (res.data.success) {
        setVerifiedEmail(formData.email);
        setEmailVerified(true);
        setOtpSent(false);
        setDevOtpVisible('');
        setOtpError('');
        showToast(res.data?.message || 'Email verified', 'success');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setOtpError('Verification failed: ' + msg);
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
              {toast.type === 'success' && registrationSuccessCountdown > 0 && (
                <div style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center', marginTop: '0.5rem' }}>
                  {registrationSuccessCountdown}
                </div>
              )}
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
        <div style={{ maxWidth: '1200px', margin: '10px auto', color: '#b91c1c', background: '#fee2e2', padding: '10px', borderRadius: '6px' }}>
          <strong>Error:</strong> {serverError}
        </div>
      )}
      
      {/* Desktop Layout */}
      <div className="registration-layout">
        
        {/* Disclaimer Section - Left Side */}
        <div className="disclaimer-section">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>
              Welcome to Local Host Connect
            </h2>
            <p style={{ color: '#64748b' }}>
              Connect with local hosts and travelers anywhere
            </p>
          </div>
          
          {/* Privacy & Terms Links */}
          <div style={{ 
            padding: '1.5rem', 
            background: '#f0f9ff', 
            border: '1px solid #0ea5e9', 
            borderRadius: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#0c4a6e', fontSize: '1rem', fontWeight: '600' }}>✅ Terms Accepted</h4>
            <div style={{ color: '#0c4a6e', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <p style={{ margin: '0 0 0.75rem 0' }}>
                By proceeding to this page, you have already read and agreed to our:
              </p>
              <ul style={{ margin: '0', paddingLeft: '1.25rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <button 
                    type="button"
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#0ea5e9', 
                      textDecoration: 'underline', 
                      cursor: 'pointer',
                      padding: 0,
                      font: 'inherit'
                    }}
                    onClick={() => window.open('/privacy-policy', '_blank')}
                  >
                    Privacy Policy
                  </button> - How we handle your personal information
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <button 
                    type="button"
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#0ea5e9', 
                      textDecoration: 'underline', 
                      cursor: 'pointer',
                      padding: 0,
                      font: 'inherit'
                    }}
                    onClick={() => window.open('/terms-of-service', '_blank')}
                  >
                    Terms of Service
                  </button> - Platform usage guidelines
                </li>
                <li>
                  <button 
                    type="button"
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#0ea5e9', 
                      textDecoration: 'underline', 
                      cursor: 'pointer',
                      padding: 0,
                      font: 'inherit'
                    }}
                    onClick={() => window.open('/safety-guidelines', '_blank')}
                  >
                    Safety Guidelines
                  </button> - Important safety recommendations
                </li>
              </ul>
            </div>
          </div>
          
        </div>
        
        {/* Registration Form - Right Side */}
        <div className="registration-form-section">
          <div className="card" style={{ margin: '0', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>
                Complete Your Registration
              </h3>
              <p style={{ color: '#64748b' }}>
                Join our community of travelers and local hosts
              </p>
            </div>
            
            <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label style={{ fontWeight: '600', color: '#374151' }}>Choose Your Role</label>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, role: 'Guest' }))}
                className={`btn ${formData.role === 'Guest' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, padding: '1rem', fontSize: '1rem' }}
              >
                🎒 Traveler (Guest)
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, role: 'Host' }))}
                className={`btn ${formData.role === 'Host' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, padding: '1rem', fontSize: '1rem' }}
              >
                🏠 Local Host
              </button>
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontWeight: '600', color: '#374151' }}>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={(e) => {
                handleInputChange(e);
                if (validationErrors.name) {
                  setValidationErrors(prev => ({ ...prev, name: '' }));
                }
              }}
              placeholder="Enter your full name"
              required
              style={{ 
                fontSize: '1rem', 
                padding: '1rem',
                border: validationErrors.name ? '2px solid #dc2626 !important' : '2px solid #cbd5e1'
              }}
            />
            {validationErrors.name && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#dc2626', fontSize: '0.875rem' }}>⚠️ {validationErrors.name}</p>
            )}
          </div>

          <div className="form-group">
            <label style={{ fontWeight: '600', color: '#374151' }}>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => {
                handleEmailChange(e);
                if (validationErrors.email) {
                  setValidationErrors(prev => ({ ...prev, email: '' }));
                }
              }}
              onBlur={(e) => validateEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              disabled={emailVerified}
              style={{ 
                fontSize: '1rem', 
                padding: '1rem', 
                border: (emailError || validationErrors.email) ? '2px solid #dc2626 !important' : '2px solid #cbd5e1',
                backgroundColor: emailVerified ? '#f3f4f6' : 'white',
                cursor: emailVerified ? 'not-allowed' : 'text'
              }}
            />
            {(emailError || validationErrors.email) && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#dc2626', fontSize: '0.875rem' }}>⚠️ {emailError || validationErrors.email}</p>
            )}
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {!emailVerified && !otpSent && (
                <button type="button" className="btn btn-secondary" onClick={sendRegistrationOtp} disabled={otpSending || emailError !== ''}>
                  {otpSending ? 'Sending OTP...' : 'Send OTP'}
                </button>
              )}

              {otpSent && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <input
                      type="text"
                      value={verificationOTP}
                      onChange={(e) => {
                        setVerificationOTP(e.target.value.replace(/\D/g, '').slice(0,6));
                        setOtpError(''); // Clear error when user types
                      }}
                      placeholder="Enter OTP"
                      maxLength={6}
                      style={{ 
                        padding: '0.5rem', 
                        fontSize: '1rem', 
                        width: '160px',
                        borderColor: otpError ? '#dc2626' : '#cbd5e1'
                      }}
                    />
                    {otpError && (
                      <p style={{ margin: '0', color: '#dc2626', fontSize: '0.75rem' }}>⚠️ {otpError}</p>
                    )}
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={verifyRegistrationOtp} 
                    disabled={loading || verificationOTP.length !== 6}
                    style={{ 
                      opacity: verificationOTP.length !== 6 ? 0.5 : 1,
                      cursor: verificationOTP.length !== 6 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Verify
                  </button>
                </div>
              )}

              {emailVerified && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#16a34a', fontWeight: '600' }}>✓ Email verified</span>
                  <button 
                    type="button" 
                    onClick={() => {
                      setEmailVerified(false);
                      setVerifiedEmail('');
                      setOtpSent(false);
                      setVerificationOTP('');
                    }}
                    className="btn btn-outline"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  >
                    Change Email
                  </button>
                </div>
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
                onChange={(e) => {
                  handleInputChange(e);
                  if (validationErrors.password) {
                    setValidationErrors(prev => ({ ...prev, password: '' }));
                  }
                }}
                placeholder="Create a strong password"
                required
                style={{ 
                  fontSize: '1rem', 
                  padding: '1rem', 
                  paddingRight: '2.5rem', 
                  width: '100%', 
                  boxSizing: 'border-box',
                  border: validationErrors.password ? '2px solid #dc2626 !important' : '2px solid #cbd5e1'
                }}
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
            {validationErrors.password && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#dc2626', fontSize: '0.875rem' }}>⚠️ {validationErrors.password}</p>
            )}
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
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                handleInputChange({ target: { name: 'phone', value } });
                validatePhone(value);
                if (validationErrors.phone) {
                  setValidationErrors(prev => ({ ...prev, phone: '' }));
                }
              }}
              onBlur={(e) => validatePhone(e.target.value)}
              placeholder="Enter your 10-digit mobile number"
              required
              maxLength={10}
              style={{ 
                fontSize: '1rem', 
                padding: '1rem', 
                border: (phoneError || validationErrors.phone) ? '2px solid #dc2626 !important' : '2px solid #cbd5e1'
              }}
            />
            {(phoneError || validationErrors.phone) && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#dc2626', fontSize: '0.875rem' }}>⚠️ {phoneError || validationErrors.phone}</p>
            )}
          </div>

          <div className="form-group">
            <label style={{ fontWeight: '600', color: '#374151' }}>State</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {Object.keys(locationData || {}).map(state => (
                <button
                  key={state}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, state, city: '' }));
                    if (validationErrors.state) {
                      setValidationErrors(prev => ({ ...prev, state: '' }));
                    }
                  }}
                  className={`btn ${formData.state === state ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '0.75rem 1rem', fontSize: '0.9rem' }}
                >
                  {state}
                </button>
              ))}
            </div>
            {validationErrors.state && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#dc2626', fontSize: '0.875rem' }}>⚠️ {validationErrors.state}</p>
            )}
          </div>

          {formData.state && (
            <div className="form-group">
              <label style={{ fontWeight: '600', color: '#374151' }}>City</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {locationData[formData.state] && locationData[formData.state].map(city => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, city }));
                      if (validationErrors.city) {
                        setValidationErrors(prev => ({ ...prev, city: '' }));
                      }
                    }}
                    className={`btn ${formData.city === city ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '0.75rem 1rem', fontSize: '0.9rem' }}
                  >
                    {city}
                  </button>
                ))}
              </div>
              {validationErrors.city && (
                <p style={{ margin: '0.5rem 0 0 0', color: '#dc2626', fontSize: '0.875rem' }}>⚠️ {validationErrors.city}</p>
              )}
            </div>
          )}

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
              {formData.role === 'Host' ? 'What You Offer as a Host' : 'What You\'re Looking For'}
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={(e) => {
                handleInputChange(e);
                if (validationErrors.bio) {
                  setValidationErrors(prev => ({ ...prev, bio: '' }));
                }
              }}
              placeholder={formData.role === 'Host' ? 'Describe what you offer to travelers (e.g., accommodation, local experiences, cultural insights, authentic cuisine, city tours)...' : 'Tell hosts what you\'re looking for (e.g., local experiences, cultural exchange, authentic food, business travel accommodation, educational opportunities)...'}
              required
              rows="4"
              maxLength={250}
              style={{ 
                fontSize: '1rem', 
                padding: '1rem', 
                width: '100%', 
                borderRadius: '0.5rem', 
                border: validationErrors.bio ? '2px solid #dc2626 !important' : '2px solid #cbd5e1'
              }}
            />
            {validationErrors.bio && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#dc2626', fontSize: '0.875rem' }}>⚠️ {validationErrors.bio}</p>
            )}
            <div style={{ textAlign: 'right', fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
              {formData.bio.length}/250 characters
            </div>
          </div>

          {/* Hosting Areas Section - Only for Hosts */}
          {formData.role === 'Host' && (
            <div className="form-group">
              <label style={{ fontWeight: '600', color: '#374151' }}>Areas Where You Can Host</label>
              <p style={{ margin: '0.5rem 0', color: '#64748b', fontSize: '0.9rem' }}>
                Select all states and cities where you can provide hosting services to travelers.
              </p>
              
              <button
                type="button"
                onClick={() => {
                  const currentAreas = [...formData.hostingAreas];
                  setTempHostingAreas(currentAreas);
                  setTempCityCount(currentAreas.reduce((total, area) => total + area.cities.length, 0));
                  setShowHostingModal(true);
                }}
                className="btn btn-outline"
                style={{ 
                  padding: '1rem', 
                  fontSize: '1rem', 
                  width: '100%', 
                  marginBottom: '1rem',
                  borderColor: validationErrors.hostingAreas ? '#dc2626' : '#cbd5e1'
                }}
              >
                🗺️ Select Hosting Areas ({formData.hostingAreas.reduce((total, area) => total + area.cities.length, 0)} cities selected)
              </button>
              
              {validationErrors.hostingAreas && (
                <p style={{ margin: '0 0 1rem 0', color: '#dc2626', fontSize: '0.875rem' }}>⚠️ {validationErrors.hostingAreas}</p>
              )}
              
              {formData.hostingAreas.length > 0 && formData.hostingAreas.some(area => area.cities.length > 0) && (
                <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #16a34a' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: '#15803d' }}>Selected Hosting Areas:</p>
                  {formData.hostingAreas.filter(area => area.cities.length > 0).map(area => (
                    <div key={area.state} style={{ marginBottom: '0.25rem', color: '#15803d', fontSize: '0.9rem' }}>
                      <strong>{area.state}:</strong> {area.cities.join(', ')}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label style={{ fontWeight: '600', color: '#374151' }}>Referral Code (Optional)</label>
            <input
              type="text"
              name="ReferredBy"
              value={formData.ReferredBy || ''}
              onChange={(e) => {
                const upperValue = e.target.value.toUpperCase();
                setFormData(prev => ({ ...prev, ReferredBy: upperValue }));
              }}
              placeholder="Enter referral code if you have one"
              style={{ fontSize: '1rem', padding: '1rem' }}
            />
            {formData.ReferredBy && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#16a34a', fontSize: '0.875rem' }}>✓ Referral code applied</p>
            )}
          </div>



          {/* Age Confirmation */}
          <div className="form-group">
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '0.75rem',
              padding: '1rem',
              background: '#fef3c7',
              border: '2px solid #f59e0b',
              borderRadius: '0.75rem',
              marginBottom: '1rem'
            }}>
              <input
                type="checkbox"
                id="ageConfirmation"
                checked={ageConfirmed}
                onChange={(e) => {
                  setAgeConfirmed(e.target.checked);
                  if (validationErrors.ageConfirmed) {
                    setValidationErrors(prev => ({ ...prev, ageConfirmed: '' }));
                  }
                }}
                style={{ 
                  marginTop: '0.25rem',
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              <label 
                htmlFor="ageConfirmation" 
                style={{ 
                  fontWeight: '600', 
                  color: '#92400e',
                  cursor: 'pointer',
                  lineHeight: '1.5',
                  fontSize: '0.95rem'
                }}
              >
                <strong>Age Verification Required:</strong> I confirm that I am at least 18 years of age and have the legal capacity to enter into binding agreements. Users under 18 are not permitted to use this platform.
              </label>
            </div>
            {validationErrors.ageConfirmed && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#dc2626', fontSize: '0.875rem', fontWeight: '600' }}>⚠️ {validationErrors.ageConfirmed}</p>
            )}
          </div>

          {/* Agreement Checkbox - Removed since disclaimer was already accepted */}
          <div style={{ 
            marginTop: '2rem',
            padding: '1rem', 
            background: '#f0fdf4', 
            border: '2px solid #16a34a', 
            borderRadius: '0.75rem',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0', color: '#15803d', fontWeight: '500', fontSize: '0.95rem' }}>
              ✓ Disclaimer accepted. You may now complete your registration.
            </p>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading || registrationSuccessCountdown > 0 || !ageConfirmed} 
            style={{ 
              width: '100%', 
              padding: '1rem', 
              fontSize: '1.1rem',
              marginTop: '1.5rem',
              opacity: (loading || registrationSuccessCountdown > 0 || !ageConfirmed) ? 0.5 : 1
            }}
          >
            {loading ? 'Registering...' : 'Register Now'}
          </button>
          

            </form>

            <div style={{ marginTop: '2rem', textAlign: 'center', padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: '0', color: '#64748b', fontSize: '1.05rem' }}>
                Already have an account? <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ marginLeft: '0.5rem', padding: '0.5rem 1.5rem' }}>Login</button>
              </p>
            </div>
            

          </div>
        </div>
      </div>
      
      {/* Hosting Areas Modal */}
      {showHostingModal && (
        <div className="modal-overlay" onClick={() => setShowHostingModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: '800px' }}>
            <div className="modal-header">
              <h3>🗺️ Select Hosting Areas</h3>
              <button className="modal-close" onClick={() => setShowHostingModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {Object.entries(locationData || {}).map(([state, cities]) => {
                const selectedCities = tempHostingAreas.find(area => area.state === state)?.cities || [];
                
                return (
                  <div key={state} className="state-section">
                    <div className="state-header">
                      {state}
                    </div>
                    
                    <div className="cities-grid">
                      {cities.map(city => {
                        const citySelected = selectedCities.includes(city);
                        return (
                          <button
                            key={city}
                            type="button"
                            onClick={() => {
                              const newAreas = [...tempHostingAreas];
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
                              } else {
                                newAreas.push({ state, cities: [city] });
                              }
                              
                              setTempHostingAreas(newAreas);
                              setTempCityCount(newAreas.reduce((total, area) => total + area.cities.length, 0));
                            }}
                            className={`city-btn ${citySelected ? 'selected' : ''}`}
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
            
            <div className="modal-footer">
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setFormData(prev => ({ ...prev, hostingAreas: tempHostingAreas }));
                  setShowHostingModal(false);
                }}
                style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}
              >
                ✓ Done ({tempCityCount} cities selected)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Registration;
