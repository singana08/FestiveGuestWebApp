import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { User, ShieldCheck, Menu, X, HelpCircle, LogOut, Globe, MessageSquare, FileText, ChevronDown, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import Logo from './components/Logo';
import Loader from './components/Loader';
import InviteFriendsModal from './components/InviteFriendsModal';
import './styles/App.css';

// ── Lazy-loaded pages (code splitting for faster initial load) ──
const LandingPage     = lazy(() => import('./pages/LandingPage'));
const Login           = lazy(() => import('./pages/Login'));
const Registration    = lazy(() => import('./pages/Registration'));
const GuestDashboard  = lazy(() => import('./pages/GuestDashboard'));
const HostDashboard   = lazy(() => import('./pages/HostDashboard'));
const Chat            = lazy(() => import('./pages/Chat'));
const Chats           = lazy(() => import('./pages/Chats'));
const Admin           = lazy(() => import('./pages/Admin'));
const Profile         = lazy(() => import('./pages/Profile'));
const PublicProfile   = lazy(() => import('./pages/PublicProfile'));
const Help            = lazy(() => import('./pages/Help'));
const Posts           = lazy(() => import('./pages/Posts'));
const PrivacyPolicy   = lazy(() => import('./pages/PrivacyPolicy'));
const Subscription    = lazy(() => import('./pages/Subscription'));
const Referrals       = lazy(() => import('./pages/Referrals'));
const ReferralRedirect = lazy(() => import('./pages/ReferralRedirect'));
const TermsOfService  = lazy(() => import('./pages/TermsOfService'));
const SafetyGuidelines = lazy(() => import('./pages/SafetyGuidelines'));
const ApiTest         = lazy(() => import('./components/ApiTest'));
const ChatDebug       = lazy(() => import('./components/ChatDebug'));

// ── Static ambient background (CSS-only — no scroll-time repaint cost) ──
const AppBackground = () => (
  <div className="app-background" aria-hidden="true" />
);

// ── Fast enter-only page fade (no exit wait blocking navigation) ──
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.12, ease: 'easeOut' }}
    style={{ width: '100%' }}
  >
    {children}
  </motion.div>
);

// ── Inline page-level suspense fallback ──
const PageLoader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 'calc(100vh - 68px)', background: 'var(--background)'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 44, height: 44, border: '3px solid var(--border-strong)',
        borderTopColor: 'var(--primary)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem'
      }} />
      <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', margin: 0 }}>Loading…</p>
    </div>
  </div>
);

// ── Navbar avatar (photo or initial fallback) ──
const NavAvatar = ({ user }) => {
  const [imgError, setImgError] = useState(false);
  const initial = (user.name || user.email || 'U').charAt(0).toUpperCase();
  if (user.profileImageUrl && !imgError) {
    return (
      <img src={user.profileImageUrl} alt={user.name} onError={() => setImgError(true)}
        style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,107,53,0.25)', display: 'block' }} />
    );
  }
  return (
    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--gradient-primary, linear-gradient(135deg,#FF6B35,#FFB347))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
      {initial}
    </div>
  );
};

// ── Main app content ──
const AppContent = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  // Persisted so the "Limited-time offer" banner stays dismissed across
  // reloads/navigations instead of nagging the user every single visit.
  const [promoDismissed, setPromoDismissed] = useState(() => localStorage.getItem('promoDismissed') === 'true');
  const avatarRef = useRef(null);

  // Read user from localStorage immediately
  useEffect(() => {
    try {
      const saved = localStorage.getItem('user');
      if (saved) {
        const userData = JSON.parse(saved);
        if (userData?.token && userData?.email && (userData.role || userData.userType)) {
          setUser(userData);
        }
      }
    } catch {
      localStorage.removeItem('user');
    }
  }, []);

  const { unreadCount, fetchUnreadCount, toast: msgToast, dismissToast } = useNotifications();
  const { language, toggleLanguage, t } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    document.body.setAttribute('lang', language);
  }, [language]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), user ? 0 : 600);
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem('user');
        if (saved) {
          const userData = JSON.parse(saved);
          if (userData?.token && userData?.email && (userData.role || userData.userType)) {
            setUser(userData);
          } else setUser(null);
        } else setUser(null);
      } catch {
        localStorage.removeItem('user');
        setUser(null);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => { clearTimeout(timer); window.removeEventListener('storage', handleStorage); };
  }, [user]);

  // Close mobile menu and avatar dropdown on route change
  useEffect(() => {
    setMenuOpen(false);
    setAvatarOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Close avatar dropdown on outside click
  useEffect(() => {
    if (!avatarOpen) return;
    const handler = (e) => { if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [avatarOpen]);

  const getDashboardRoute = (u) => {
    const role = u?.role || u?.userType;
    if (role === 'Host') return '/posts';
    if (role === 'Guest') return '/guest-dashboard';
    if (role === 'Admin') return '/admin';
    return '/login';
  };

  const isAdmin = user?.role === 'Admin' || user?.userType === 'Admin';
  const isActive = (path) => location.pathname === path;

  const confirmLogout = () => {
    localStorage.clear();
    setUser(null);
    setShowLogoutModal(false);
    window.location.href = '/';
  };

  if (loading) return <Loader />;

  return (
    <div className="app-container">
      <AppBackground />
      {/* ── Navbar ── */}
      <nav className="navbar">
        <Link to="/" className="nav-logo">
          <Logo className="nav-logo-img" style={{ height: '52px' }} />
        </Link>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={menuOpen ? 'close' : 'open'}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ display: 'flex' }}
            >
              {menuOpen ? <X size={26} /> : <Menu size={26} />}
            </motion.span>
          </AnimatePresence>
        </button>

        <div className={`nav-links ${menuOpen ? 'mobile-open' : ''}`} data-lang={language}>
          {!user ? (
            <>
              <Link to="/help" className={`nav-item ${isActive('/help') ? 'active' : ''}`}>
                <HelpCircle size={17} /> {t('help')}
              </Link>
              <Link to="/login" className={`nav-item ${isActive('/login') ? 'active' : ''}`}>
                {t('login')}
              </Link>
              <Link
                to="/?register=true"
                className="nav-item btn-primary"
                style={{ background: 'var(--gradient-primary)', color: 'white', borderRadius: '0.625rem', padding: '0.45rem 1rem', fontWeight: 600, fontSize: '0.875rem', boxShadow: '0 4px 12px rgba(255,107,53,0.3)' }}
              >
                {t('register')}
              </Link>
              <button onClick={toggleLanguage} className="nav-item">
                <Globe size={17} /> {language === 'en' ? 'తెలుగు' : 'English'}
              </button>
            </>
          ) : (
            <>
              {/* Core nav items (desktop + mobile hamburger) */}
              <Link to="/posts" className={`nav-item ${isActive('/posts') ? 'active' : ''}`}>
                <FileText size={17} /> {t('posts')}
              </Link>
              <Link
                to="/chats"
                className={`nav-item chat-nav-item ${isActive('/chats') ? 'active' : ''}`}
                onClick={() => { localStorage.removeItem('chatReadState'); fetchUnreadCount(); }}
              >
                <MessageSquare size={17} /> {t('chats')}
                {unreadCount > 0 && (
                  <span className={`unread-badge ${unreadCount > 9 ? 'large-count' : ''}`}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              {isAdmin && (
                <Link to="/admin" className={`nav-item ${isActive('/admin') ? 'active' : ''}`}>
                  <ShieldCheck size={17} /> Admin
                </Link>
              )}

              {/* Desktop-only avatar dropdown */}
              <div className="nav-avatar-wrapper" ref={avatarRef}>
                <button
                  className="nav-avatar-btn"
                  onClick={() => setAvatarOpen(o => !o)}
                  aria-label="Account menu"
                >
                  <NavAvatar user={user} />
                  <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: avatarOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--text-light)' }} />
                </button>
                <AnimatePresence>
                  {avatarOpen && (
                    <motion.div
                      className="nav-avatar-dropdown"
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                    >
                      {/* User info */}
                      <div className="nav-dropdown-user">
                        <NavAvatar user={user} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>{user.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{user.role || user.userType}</div>
                        </div>
                      </div>
                      <div className="nav-dropdown-items">
                        <Link to="/profile" className="nav-dropdown-item" onClick={() => setAvatarOpen(false)}>
                          <User size={15} /> My Profile
                        </Link>
                        <button className="nav-dropdown-item" onClick={() => { setAvatarOpen(false); setShowInviteModal(true); }}>
                          <UserPlus size={15} /> Invite Friends
                        </button>
                        <Link to="/help" className="nav-dropdown-item" onClick={() => setAvatarOpen(false)}>
                          <HelpCircle size={15} /> {t('help')}
                        </Link>
                        <button className="nav-dropdown-item" onClick={() => { toggleLanguage(); setAvatarOpen(false); }}>
                          <Globe size={15} /> {language === 'en' ? 'తెలుగు' : 'English'}
                        </button>
                      </div>
                      <div className="nav-dropdown-footer">
                        <button className="nav-dropdown-item danger" onClick={() => { setAvatarOpen(false); setShowLogoutModal(true); }}>
                          <LogOut size={15} /> {t('logout')}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile-only section (shown in hamburger menu) */}
              <div className="nav-mobile-section">
                <Link to="/profile" className={`nav-item ${isActive('/profile') ? 'active' : ''}`}>
                  <User size={17} /> My Profile
                </Link>
                <button onClick={() => setShowInviteModal(true)} className="nav-item">
                  <UserPlus size={17} /> Invite Friends
                </button>
                <Link to="/help" className={`nav-item ${isActive('/help') ? 'active' : ''}`}>
                  <HelpCircle size={17} /> {t('help')}
                </Link>
                <button onClick={toggleLanguage} className="nav-item">
                  <Globe size={17} /> {language === 'en' ? 'తెలుగు' : 'English'}
                </button>
                <button onClick={() => setShowLogoutModal(true)} className="nav-item logout-btn">
                  <LogOut size={17} /> {t('logout')}
                </button>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* ── New message toast ── */}
      <AnimatePresence>
        {msgToast && (
          <motion.div
            initial={{ x: 120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={dismissToast}
            style={{
              position: 'fixed', top: '80px', right: '20px',
              background: 'var(--gradient-primary)',
              color: 'white', padding: '0.875rem 1.25rem',
              borderRadius: '1rem',
              boxShadow: '0 8px 30px rgba(255,107,53,0.4)',
              zIndex: 9999, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              maxWidth: '320px', fontSize: '0.875rem'
            }}
          >
            <MessageSquare size={20} />
            <span><strong>{msgToast.senderName}</strong> sent you a message</span>
            <X size={16} style={{ opacity: 0.8, marginLeft: 'auto' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Promo banner ── */}
      <AnimatePresence>
        {user && !promoDismissed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              background: 'linear-gradient(90deg, #7C3AED 0%, #FF6B35 50%, #F59E0B 100%)',
              padding: '0.55rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              position: 'relative'
            }}>
              {/* Subtle shimmer overlay */}
              <motion.div
                animate={{ x: ['−100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear', repeatDelay: 2 }}
                style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
                  pointerEvents: 'none'
                }}
              />
              <span style={{ fontSize: '1rem' }}>🎁</span>
              <p style={{ margin: 0, color: 'white', fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.01em' }}>
                <strong style={{ fontWeight: 700 }}>Limited-time offer</strong> — Premium features are free during our launch period!
              </p>
              <button
                onClick={() => { setPromoDismissed(true); localStorage.setItem('promoDismissed', 'true'); }}
                style={{
                  position: 'absolute', right: '1rem',
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none', color: 'white',
                  width: 24, height: 24, borderRadius: '50%',
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', lineHeight: 1,
                  flexShrink: 0
                }}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Routes ── */}
      <main className="content full-width">
        <Suspense fallback={<PageLoader />}>
            <Routes location={location}>
              <Route path="/" element={<PageTransition><LandingPage user={user} /></PageTransition>} />
              <Route path="/home" element={<PageTransition><LandingPage user={user} /></PageTransition>} />
              <Route path="/r/:code" element={<PageTransition><ReferralRedirect /></PageTransition>} />
              <Route path="/login" element={!user ? <PageTransition><Login setUser={setUser} /></PageTransition> : <Navigate to="/posts" />} />
              <Route path="/register" element={!user ? <PageTransition><Registration setUser={setUser} /></PageTransition> : <Navigate to="/home" />} />
              <Route path="/browse" element={(user?.role === 'Guest' || user?.userType === 'Guest') ? <PageTransition><GuestDashboard user={user} /></PageTransition> : <Navigate to="/login" />} />
              <Route path="/guest-dashboard" element={(user?.role === 'Guest' || user?.userType === 'Guest') ? <PageTransition><GuestDashboard user={user} /></PageTransition> : <Navigate to="/login" />} />
              <Route path="/host-dashboard" element={(user?.role === 'Host' || user?.userType === 'Host') ? <PageTransition><HostDashboard user={user} /></PageTransition> : <Navigate to="/login" />} />
              <Route path="/chats" element={user ? <PageTransition><Chats /></PageTransition> : <Navigate to="/login" />} />
              <Route path="/posts" element={user ? <PageTransition><Posts /></PageTransition> : <Navigate to="/login" />} />
              <Route path="/profile" element={user ? <PageTransition><Profile /></PageTransition> : <Navigate to="/login" />} />
              <Route path="/referrals" element={user ? <PageTransition><Referrals /></PageTransition> : <Navigate to="/login" />} />
              <Route path="/subscription" element={user ? <PageTransition><Subscription /></PageTransition> : <Navigate to="/login" />} />
              <Route path="/profile/:userName" element={<PageTransition><PublicProfile /></PageTransition>} />
              <Route path="/admin" element={isAdmin ? <PageTransition><Admin /></PageTransition> : <Navigate to="/login" />} />
              <Route path="/chat/:recipientId" element={user ? <PageTransition><Chat user={user} /></PageTransition> : <Navigate to="/login" />} />
              <Route path="/help" element={<PageTransition><Help /></PageTransition>} />
              <Route path="/privacy-policy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
              <Route path="/terms-of-service" element={<PageTransition><TermsOfService /></PageTransition>} />
              <Route path="/safety-guidelines" element={<PageTransition><SafetyGuidelines /></PageTransition>} />
              <Route path="/api-test" element={<PageTransition><ApiTest /></PageTransition>} />
              <Route path="/chat-debug" element={<PageTransition><ChatDebug /></PageTransition>} />
            </Routes>
        </Suspense>
      </main>

      {/* ── Logout modal ── */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLogoutModal(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '380px' }}
            >
              <div className="modal-header">
                <h3 style={{ color: 'var(--error)' }}>
                  <LogOut size={20} /> Confirm Logout
                </h3>
                <button className="modal-close" onClick={() => setShowLogoutModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <p style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>
                  Are you sure you want to logout?
                </p>
                <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  You'll need to sign in again to access your account.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="btn btn-outline"
                    style={{ minWidth: '90px', padding: '0.6rem 1.25rem' }}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={confirmLogout}
                    className="btn"
                    style={{ minWidth: '90px', padding: '0.6rem 1.25rem', background: 'var(--error)', color: 'white' }}
                  >
                    {t('logout')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Invite Friends Modal ── */}
      <AnimatePresence>
        {showInviteModal && (
          <InviteFriendsModal user={user} onClose={() => setShowInviteModal(false)} />
        )}
      </AnimatePresence>
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
