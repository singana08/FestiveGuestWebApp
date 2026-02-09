import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { User, Search, ShieldCheck, Menu, X, LayoutDashboard, HelpCircle, LogOut, Crown, Globe } from 'lucide-react';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import api from './utils/api';
import Logo from './components/Logo';
import Loader from './components/Loader';
import ApiTest from './components/ApiTest';
import ChatDebug from './components/ChatDebug';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Registration from './pages/Registration';
import GuestDashboard from './pages/GuestDashboard';
import HostDashboard from './pages/HostDashboard';
import Chat from './pages/Chat';
import Chats from './pages/Chats';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import Help from './pages/Help';
import Posts from './pages/Posts';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Subscription from './pages/Subscription';
import Referrals from './pages/Referrals';
import ReferralRedirect from './pages/ReferralRedirect';
import TermsOfService from './pages/TermsOfService';
import SafetyGuidelines from './pages/SafetyGuidelines';
import './styles/App.css';

const AppContent = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [referralPoints, setReferralPoints] = useState(0);

  // Initialize user from localStorage immediately
  useEffect(() => {
    try {
      const saved = localStorage.getItem('user');
      if (saved) {
        const userData = JSON.parse(saved);
        if (userData && userData.token && userData.email && (userData.role || userData.userType)) {
          setUser(userData);
          // Set referral points from stored user data
          setReferralPoints(userData.referralPoints || 0);
        }
      }
    } catch (e) {
      console.warn('Invalid user data in localStorage');
      localStorage.removeItem('user');
    }
  }, []);
  const { unreadCount, clearUnreadCount } = useNotifications();
  const { language, toggleLanguage, t } = useLanguage();
  const location = useLocation();

  // Set lang attribute on body element
  useEffect(() => {
    document.body.setAttribute('lang', language);
  }, [language]);

  // Sync with localStorage on mount and listen for changes
  useEffect(() => {
    // Only show loader if no user is found, otherwise load immediately
    const timer = setTimeout(() => {
      setLoading(false);
    }, user ? 0 : 3000);

    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('user');
        if (saved) {
          const userData = JSON.parse(saved);
          // Validate user data structure - accept both role and userType
          if (userData && userData.token && userData.email && (userData.role || userData.userType)) {
            setUser(userData);
            setReferralPoints(userData.referralPoints || 0);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (e) {
        console.warn('Invalid user data in localStorage');
        localStorage.removeItem('user');
        setUser(null);
      }
    };

    // Listen for storage changes from other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

  const getDashboardRoute = (u) => {
    const role = u?.role || u?.userType || u?.partitionKey;
    if (role === 'Host') return '/posts';
    if (role === 'Guest') return '/guest-dashboard';
    if (role === 'Admin') return '/admin';
    return '/login';
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.clear();
    setUser(null);
    setMenuOpen(false);
    setShowLogoutModal(false);
    window.location.href = '/';
  };

  const handleChatsClick = () => {
    clearUnreadCount();
    setMenuOpen(false);
  };

  const isActivePage = (path) => {
    if (path === '/dashboard') {
      return location.pathname === getDashboardRoute(user) || location.pathname === '/browse';
    }
    return location.pathname === path;
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="app-container" style={{ animation: 'fadeIn 0.8s ease-out' }}>
      <nav className="navbar">
        <Link to="/" className="nav-logo" onClick={() => setMenuOpen(false)}>
          <Logo className="nav-logo-img" style={{ height: '65px' }} />
        </Link>
        
        <button 
          className="menu-toggle" 
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        <div className={`nav-links ${menuOpen ? 'mobile-open' : ''}`} data-lang={language}>
          {!user ? (
            <>
              <Link to="/help" className="nav-item" onClick={() => setMenuOpen(false)}><HelpCircle size={20} /> {t('help')}</Link>
              <Link to="/login" className="nav-item" onClick={() => setMenuOpen(false)}>{t('login')}</Link>
              <Link to="/?register=true" className="nav-item btn btn-primary" style={{ color: 'white', padding: '0.5rem 1rem' }} onClick={() => setMenuOpen(false)}>{t('register')}</Link>
              <button onClick={toggleLanguage} className="nav-item" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Globe size={20} /> {language === 'en' ? 'తెలుగు' : 'English'}
              </button>
            </>
          ) : (
            <>
              <div className="user-badge">
                <span className="user-badge-text">
                  <strong>{user.name}</strong> <span className="user-badge-role">({user.role || user.userType || user.partitionKey})</span>
                </span>
              </div>
              <Link to={getDashboardRoute(user)} className={`nav-item ${isActivePage('/dashboard') ? 'active' : ''}`} onClick={() => setMenuOpen(false)} style={{ display: 'none' }}><LayoutDashboard size={20} /> Dashboard</Link>
              <Link to="/posts" className={`nav-item ${isActivePage('/posts') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>📝 {t('posts')}</Link>
              <Link to="/chats" className={`nav-item chat-nav-item ${isActivePage('/chats') ? 'active' : ''}`} onClick={handleChatsClick}>
                💬 {t('chats')}
                {unreadCount > 0 && (
                  <span className={`unread-badge ${unreadCount > 9 ? 'large-count' : ''}`}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link to="/profile" className={`nav-item ${isActivePage('/profile') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}><User size={20} /> {t('profile')}</Link>
              <Link to="/referrals" className={`nav-item ${isActivePage('/referrals') ? 'active' : ''}`} onClick={() => setMenuOpen(false)} style={{ position: 'relative' }}>
                🎁 {t('referEarnNav')}
              </Link>
              <Link to="/help" className={`nav-item ${isActivePage('/help') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}><HelpCircle size={20} /> {t('help')}</Link>
              {(user.role === 'Admin' || user.userType === 'Admin') && <Link to="/admin" className={`nav-item ${isActivePage('/admin') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}><ShieldCheck size={20} /> Admin</Link>}
              <button onClick={toggleLanguage} className="nav-item" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Globe size={20} /> {language === 'en' ? 'తెలుగు' : 'English'}
              </button>
              <button onClick={handleLogout} className="nav-item logout-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LogOut size={20} /> {t('logout')}
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Promotional Banner */}
      {user && (
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
          padding: '0.75rem 0.5rem',
          textAlign: 'center',
          fontSize: 'clamp(0.65rem, 2.5vw, 0.9rem)',
          fontWeight: '600',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          lineHeight: '1.4'
        }}>
          🎉 <strong>Limited Time Offer!</strong> All users can now access premium features FREE during our promotional period! 🎁
        </div>
      )}

      <main className="content full-width">
        <Routes>
          <Route path="/" element={<LandingPage user={user} />} />
          <Route path="/r/:code" element={<ReferralRedirect />} />
          <Route path="/home" element={<LandingPage user={user} />} />
          <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/posts" />} />
          <Route path="/register" element={!user ? <Registration setUser={setUser} /> : <Navigate to="/home" />} />
          <Route path="/browse" element={(user?.role === 'Guest' || user?.userType === 'Guest') ? <GuestDashboard user={user} /> : <Navigate to="/login" />} />
          
          <Route path="/guest-dashboard" element={(user?.role === 'Guest' || user?.userType === 'Guest') ? <GuestDashboard user={user} /> : <Navigate to="/login" />} />
          <Route path="/host-dashboard" element={(user?.role === 'Host' || user?.userType === 'Host') ? <HostDashboard user={user} /> : <Navigate to="/login" />} />
          <Route path="/chats" element={user ? <Chats /> : <Navigate to="/login" />} />
          <Route path="/posts" element={user ? <Posts /> : <Navigate to="/login" />} />
          
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/referrals" element={user ? <Referrals /> : <Navigate to="/login" />} />
          <Route path="/subscription" element={user ? <Subscription /> : <Navigate to="/login" />} />
          <Route path="/profile/:userName" element={<PublicProfile />} />
          <Route path="/admin" element={(user?.role === 'Admin' || user?.userType === 'Admin') ? <Admin /> : <Navigate to="/login" />} />
          <Route path="/chat/:recipientId" element={user ? <Chat user={user} /> : <Navigate to="/login" />} />
          <Route path="/help" element={<Help />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/safety-guidelines" element={<SafetyGuidelines />} />
          <Route path="/api-test" element={<ApiTest />} />
          <Route path="/chat-debug" element={<ChatDebug />} />
        </Routes>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LogOut size={20} />
                Confirm Logout
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ margin: '0 0 1rem 0', color: 'var(--text)' }}>
                Are you sure you want to logout?
              </p>
              <p style={{ margin: '0', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                You will need to login again to access your account.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', padding: '1rem' }}>
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="btn btn-outline"
                style={{ minWidth: '80px' }}
              >
                {t('cancel')}
              </button>
              <button 
                onClick={confirmLogout}
                className="btn"
                style={{ 
                  minWidth: '80px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: '1px solid #dc2626'
                }}
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <Router>
      <NotificationProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;