import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';

const Login = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [emailError, setEmailError] = useState('');
  const [loginLogoUrl, setLoginLogoUrl] = useState('');
  const navigate = useNavigate();

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

    // Fetch login logo
    const fetchLoginLogo = async () => {
      try {
        const res = await api.get('getimageurl', { params: { logo: 'true', type: 'login' } });
        if (res.data && res.data.imageUrl) {
          setLoginLogoUrl(res.data.imageUrl);
        }
      } catch (err) {
        console.error('Failed to fetch login logo:', err);
      }
    };
    fetchLoginLogo();
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
      const res = await api.post('login', { email, password });
      if (res?.data?.token) {
        const { token, ...user } = res.data;
        const userWithToken = { ...user, token };
        localStorage.setItem('user', JSON.stringify(userWithToken));
        localStorage.setItem('userId', user.rowKey);
        localStorage.setItem('token', token);
        setUser(userWithToken);
        showToast('Login successful! Redirecting...', 'success');
        setTimeout(() => navigate('/'), 1000);
        return;
      }
      showToast('Login failed', 'error');
    } catch (err) {
      if (err.response?.status === 429) {
        showToast('Too many login attempts. Please wait 15 minutes and try again.', 'error');
      } else {
        showToast('Login failed: ' + (err.response?.data?.error || err.message), 'error');
      }
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
      <div className="card" style={{ maxWidth: '450px', margin: '50px auto', textAlign: 'center' }}>
        <div style={{ marginBottom: '2rem' }}>
          {loginLogoUrl && (
            <img 
              src={loginLogoUrl} 
              alt="Festive Guest Logo" 
              style={{ height: '150px', width: 'auto', marginBottom: '1.5rem' }} 
            />
          )}
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Connect Guests and Hosts for memorable experiences</p>
        </div>
        
        <form onSubmit={handleLogin} style={{ marginTop: '30px' }}>
          <div className="form-group">
            <input
              type="email"
              className="form-control"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                validateEmail(e.target.value);
              }}
              onBlur={(e) => validateEmail(e.target.value)}
              required
              style={{ fontSize: '1rem', padding: '1rem', borderColor: emailError ? '#dc2626' : '#cbd5e1' }}
            />
            {emailError && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#dc2626', fontSize: '0.875rem' }}>⚠️ {emailError}</p>
            )}
          </div>
          <div className="form-group" style={{ position: 'relative' }}>
            <input
              type={showPassword ? "text" : "password"}
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ fontSize: '1rem', padding: '1rem', paddingRight: '3rem' }}
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
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} disabled={loading || emailError !== ''}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: '0', color: '#64748b', fontSize: '1.05rem' }}>
            New user? <button className="btn btn-primary" onClick={() => navigate('/register')} style={{ marginLeft: '0.5rem', padding: '0.5rem 1.5rem' }}>Register</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
