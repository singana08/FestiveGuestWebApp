import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Key } from 'lucide-react';
import api from '../utils/api';

const Login = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [emailError, setEmailError] = useState('');
  const [loginLogoUrl, setLoginLogoUrl] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [modalError, setModalError] = useState('');
  const navigate = useNavigate();

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
    { label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
    { label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
    { label: 'One number', test: (pw) => /\d/.test(pw) },
    { label: 'One special character', test: (pw) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw) }
  ];

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateEmail = (emailValue) => {
    if (!emailValue) {
      setEmailError('');
      return true;
    }
    if (!emailRegex.test(emailValue)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  useEffect(() => {
    // Check if user is already logged in
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (user && token) {
      navigate('/');
    }

    // Use static logo from public folder
    setLoginLogoUrl('/assets/login-logo.png');
  }, [navigate]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    if (type === 'success') {
      setTimeout(() => {
        setToast(prev => prev ? { ...prev, hiding: true } : null);
        setTimeout(() => setToast(null), 300);
      }, 5000);
    }
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('auth/login', { email, password });
      if (res?.data?.success && res?.data?.token) {
        const { token, user } = res.data;
        const userWithToken = { ...user, token };
        localStorage.setItem('user', JSON.stringify(userWithToken));
        localStorage.setItem('userId', user.userId);
        localStorage.setItem('token', token);
        setUser(userWithToken);
        showToast('Login successful! Redirecting...', 'success');
        
        // Redirect all users to posts page after login
        navigate('/posts');
        return;
      }
      showToast('Login failed', 'error');
    } catch (err) {
      if (err.response?.status === 429) {
        showToast('Too many login attempts. Please wait 15 minutes and try again.', 'error');
      } else {
        showToast('Login failed: ' + (err.response?.data?.message || err.message), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const sendForgotPasswordOtp = async () => {
    // Clear previous errors
    setModalError('');
    
    if (!forgotEmail || forgotEmail.trim() === '') {
      setModalError('Please enter your email address');
      return;
    }
    
    if (!emailRegex.test(forgotEmail)) {
      setModalError('Please enter a valid email address');
      return;
    }
    
    setOtpSending(true);
    try {
      const res = await api.post('email/send-otp', { 
        email: forgotEmail,
        purpose: 'password-reset'
      });
      if (res.data.success) {
        setOtpSent(true);
        setModalError('');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setModalError('Failed to send OTP: ' + msg);
    } finally {
      setOtpSending(false);
    }
  };

  const resetPassword = async () => {
    // Clear previous errors
    setModalError('');
    
    // Validate OTP
    if (!otp || otp.trim() === '') {
      setModalError('Please enter the OTP');
      return;
    }
    if (otp.length !== 6) {
      setModalError('OTP must be exactly 6 digits');
      return;
    }
    
    // Validate new password
    if (!newPassword || newPassword.trim() === '') {
      setModalError('Please enter a new password');
      return;
    }
    
    // Validate confirm password
    if (!confirmPassword || confirmPassword.trim() === '') {
      setModalError('Please confirm your new password');
      return;
    }
    
    // Check password requirements
    const allRequirementsMet = passwordRequirements.every(req => req.test(newPassword));
    if (!allRequirementsMet) {
      setModalError('Password must meet all requirements shown below');
      return;
    }
    
    // Check passwords match
    if (newPassword !== confirmPassword) {
      setModalError('New password and confirm password do not match');
      return;
    }
    
    setResettingPassword(true);
    try {
      const res = await api.post('auth/reset-password', {
        email: forgotEmail,
        otpCode: otp,
        newPassword: newPassword
      });
      if (res.data.success) {
        showToast('Password reset successful! Please login with your new password.', 'success');
        setShowForgotPassword(false);
        setOtpSent(false);
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setForgotEmail('');
        setModalError('');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setModalError('Password reset failed: ' + msg);
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      position: 'relative'
    }}>
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
      
      {/* Logo Circle positioned above the card */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, calc(-50% - 260px))',
        width: '140px',
        height: '140px',
        background: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        zIndex: 2,
        padding: '5px',
        overflow: 'hidden'
      }}>
        <img 
          src="/assets/login-logo.png" 
          alt="Festive Guest Logo" 
          style={{ 
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }} 
        />
      </div>
      
      <div style={{ 
        maxWidth: '420px', 
        width: '100%',
        background: 'white',
        borderRadius: '1.5rem',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        padding: '5rem 2rem 2.5rem',
        position: 'relative',
        marginTop: '70px'
      }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ 
            margin: '0 0 0.5rem 0', 
            fontSize: '1.75rem', 
            fontWeight: '700',
            color: '#1e293b'
          }}>Welcome Back</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>Sign in to continue</p>
        </div>
        
        {!showForgotPassword && (
        <form onSubmit={handleLogin} style={{ pointerEvents: loading ? 'none' : 'auto', opacity: loading ? 0.6 : 1 }}>
          <div className="form-group">
            <input
              type="email"
              className="form-control"
              placeholder="Email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                validateEmail(e.target.value);
              }}
              onBlur={(e) => validateEmail(e.target.value)}
              required
              style={{ fontSize: '0.95rem', padding: '0.875rem', borderColor: emailError ? '#dc2626' : '#e2e8f0', transform: 'none' }}
            />
            {emailError && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#dc2626', fontSize: '0.8rem' }}>⚠️ {emailError}</p>
            )}
          </div>
          <div className="form-group" style={{ position: 'relative' }}>
            <input
              type={showPassword ? "text" : "password"}
              className="form-control"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ fontSize: '0.95rem', padding: '0.875rem', paddingRight: '3rem', transform: 'none' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '0.875rem',
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
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ 
              width: '100%', 
              padding: '0.875rem', 
              fontSize: '1rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              marginTop: '0.5rem',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }} 
            disabled={loading || emailError !== ''}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        )}
        
        <div style={{ marginTop: '1rem', textAlign: 'center', pointerEvents: loading ? 'none' : 'auto', opacity: loading ? 0.6 : 1 }}>
          <button 
            type="button" 
            onClick={() => setShowForgotPassword(true)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#667eea', 
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Forgot Password?
          </button>
        </div>
        
        <div style={{ 
          marginTop: '1.5rem', 
          paddingTop: '1.5rem',
          borderTop: '1px solid #e2e8f0',
          textAlign: 'center',
          pointerEvents: loading ? 'none' : 'auto',
          opacity: loading ? 0.6 : 1
        }}>
          <p style={{ margin: '0 0 0.75rem 0', color: '#64748b', fontSize: '0.9rem' }}>
            Don't have an account?
          </p>
          <button 
            onClick={() => navigate('/?register=true')} 
            style={{ 
              width: '100%',
              padding: '0.875rem',
              background: 'white',
              border: '2px solid #667eea',
              borderRadius: 'var(--radius-sm)',
              color: '#667eea',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#667eea';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.color = '#667eea';
            }}
          >
            Create Account
          </button>
        </div>
      </div>
      
      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="modal-overlay" onClick={() => setShowForgotPassword(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3><Key size={20} /> Reset Password</h3>
              <button onClick={() => setShowForgotPassword(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              {modalError && (
                <div style={{ 
                  background: '#fef2f2', 
                  border: '1px solid #fecaca', 
                  color: '#dc2626', 
                  padding: '0.75rem', 
                  borderRadius: '0.5rem', 
                  marginBottom: '1rem',
                  fontSize: '0.875rem'
                }}>
                  ⚠️ {modalError}
                </div>
              )}
              {!otpSent ? (
                <div>
                  <p style={{ marginBottom: '1rem', color: '#64748b' }}>Enter your email to receive a password reset OTP</p>
                  <div className="form-group">
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Enter your email address"
                      style={{ fontSize: '1rem', padding: '0.75rem', width: '100%' }}
                    />
                  </div>
                  <button 
                    onClick={sendForgotPasswordOtp}
                    disabled={otpSending || !forgotEmail}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.75rem' }}
                  >
                    {otpSending ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ marginBottom: '1rem', color: '#64748b' }}>Enter the OTP sent to {forgotEmail} and your new password</p>
                  <div className="form-group">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0,6))}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      style={{ fontSize: '1rem', padding: '0.75rem', width: '100%' }}
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      style={{ fontSize: '1rem', padding: '0.75rem', width: '100%' }}
                    />
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
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      style={{ fontSize: '1rem', padding: '0.75rem', width: '100%' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => {
                        setOtpSent(false);
                        setOtp('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setModalError('');
                      }}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '0.75rem' }}
                    >
                      Back
                    </button>
                    <button 
                      onClick={resetPassword}
                      disabled={resettingPassword}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '0.75rem' }}
                    >
                      {resettingPassword ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
