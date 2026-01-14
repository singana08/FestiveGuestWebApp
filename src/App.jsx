import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { User, Search, ShieldCheck, Menu, X, LayoutDashboard, HelpCircle, LogOut } from 'lucide-react';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
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
import TermsOfService from './pages/TermsOfService';
import './styles/App.css';

const AppContent = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Initialize user from localStorage immediately
  useEffect(() => {
    try {
      const saved = localStorage.getItem('user');
      if (saved) {
        const userData = JSON.parse(saved);
        if (userData && userData.token && userData.email && (userData.role || userData.userType)) {
          setUser(userData);
        }
      }
    } catch (e) {
      console.warn('Invalid user data in localStorage');
      localStorage.removeItem('user');
    }
  }, []);
  const { unreadCount, clearUnreadCount } = useNotifications();
  const location = useLocation();

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
          <Logo className="nav-logo-img" style={{ height: '50px' }} />
        </Link>
        
        <button 
          className="menu-toggle" 
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        <div className={`nav-links ${menuOpen ? 'mobile-open' : ''}`}>
          {!user ? (
            <>
              <Link to="/help" className="nav-item" onClick={() => setMenuOpen(false)}><HelpCircle size={20} /> Help</Link>
              <Link to="/login" className="nav-item" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/?register=true" className="nav-item btn btn-primary" style={{ color: 'white', padding: '0.5rem 1rem' }} onClick={() => setMenuOpen(false)}>Register</Link>
            </>
          ) : (
            <>
              <div className="user-badge">
                <span className="user-badge-text">
                  <strong>{user.name}</strong> <span className="user-badge-role">({user.role || user.userType || user.partitionKey})</span>
                </span>
              </div>
              <Link to={getDashboardRoute(user)} className={`nav-item ${isActivePage('/dashboard') ? 'active' : ''}`} onClick={() => setMenuOpen(false)} style={{ display: 'none' }}><LayoutDashboard size={20} /> Dashboard</Link>
              <Link to="/posts" className={`nav-item ${isActivePage('/posts') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>📝 Posts</Link>
              <Link to="/chats" className={`nav-item chat-nav-item ${isActivePage('/chats') ? 'active' : ''}`} onClick={handleChatsClick}>
                💬 Chats
                {unreadCount > 0 && (
                  <span className={`unread-badge ${unreadCount > 9 ? 'large-count' : ''}`}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link to="/profile" className={`nav-item ${isActivePage('/profile') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}><User size={20} /> Profile</Link>
              <Link to="/help" className={`nav-item ${isActivePage('/help') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}><HelpCircle size={20} /> Help</Link>
              {(user.role === 'Admin' || user.userType === 'Admin') && <Link to="/admin" className={`nav-item ${isActivePage('/admin') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}><ShieldCheck size={20} /> Admin</Link>}
              <button onClick={handleLogout} className="nav-item logout-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LogOut size={20} /> Logout
              </button>
            </>
          )}
        </div>
      </nav>

      <main className="content full-width">
        <Routes>
          <Route path="/" element={<LandingPage user={user} />} />
          <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Registration setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/browse" element={(user?.role === 'Guest' || user?.userType === 'Guest') ? <GuestDashboard user={user} /> : <Navigate to="/login" />} />
          
          <Route path="/guest-dashboard" element={(user?.role === 'Guest' || user?.userType === 'Guest') ? <GuestDashboard user={user} /> : <Navigate to="/login" />} />
          <Route path="/host-dashboard" element={(user?.role === 'Host' || user?.userType === 'Host') ? <HostDashboard user={user} /> : <Navigate to="/login" />} />
          <Route path="/chats" element={user ? <Chats /> : <Navigate to="/login" />} />
          <Route path="/posts" element={user ? <Posts /> : <Navigate to="/login" />} />
          
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/profile/:userName" element={<PublicProfile />} />
          <Route path="/admin" element={(user?.role === 'Admin' || user?.userType === 'Admin') ? <Admin /> : <Navigate to="/login" />} />
          <Route path="/chat/:recipientId" element={user ? <Chat user={user} /> : <Navigate to="/login" />} />
          <Route path="/help" element={<Help />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
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
                Cancel
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
                Logout
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
        <AppContent />
      </NotificationProvider>
    </Router>
  );
}

export default App;