import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Menu, X, HelpCircle, Globe, MessageSquare, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import Logo from './components/Logo';
import InviteFriendsModal from './components/InviteFriendsModal';
import SideNav from './components/SideNav';
// Not lazy: it's the landing page, so it renders straight away on a first
// visit instead of showing a loading spinner while its chunk downloads.
import Home from './pages/Home';
import './styles/App.css';

// ── Lazy-loaded pages (code splitting for faster initial load) ──
const Login           = lazy(() => import('./pages/Login'));
const Registration    = lazy(() => import('./pages/Registration'));
const Chats           = lazy(() => import('./pages/Chats'));
const Admin           = lazy(() => import('./pages/Admin'));
const Profile         = lazy(() => import('./pages/Profile'));
const PublicProfile   = lazy(() => import('./pages/PublicProfile'));
const Help            = lazy(() => import('./pages/Help'));
const Posts           = lazy(() => import('./pages/Posts'));
const PrivacyPolicy   = lazy(() => import('./pages/PrivacyPolicy'));
const ReferralRedirect = lazy(() => import('./pages/ReferralRedirect'));
const TermsOfService  = lazy(() => import('./pages/TermsOfService'));
const SafetyGuidelines = lazy(() => import('./pages/SafetyGuidelines'));
const NotFound        = lazy(() => import('./pages/NotFound'));
const Trips           = lazy(() => import('./pages/Trips'));
const Saved           = lazy(() => import('./pages/Saved'));

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

// ── Suspense fallback for lazily loaded pages ──
// Transparent so it suits light and dark pages, and it only fades in after a
// short delay, so a quick chunk load shows nothing at all.
const PageLoader = () => (
  <div className="page-loader" role="status" aria-label="Loading">
    <span className="page-loader-spin" />
  </div>
);

// Saved session, or null (a corrupt entry is cleared). Read synchronously so
// the first render already knows who's logged in — no splash screen needed.
const readStoredUser = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('user'));
    return saved?.token && saved?.email && (saved.role || saved.userType) ? saved : null;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

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
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [user, setUser] = useState(readStoredUser);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  // Persisted so the "Limited-time offer" banner stays dismissed across
  // reloads/navigations instead of nagging the user every single visit.
  const [promoDismissed, setPromoDismissed] = useState(() => localStorage.getItem('promoDismissed') === 'true');
  // Sidebar: remembered per browser; starts collapsed on tablet-sized screens.
  const [navCollapsed, setNavCollapsed] = useState(() => {
    const saved = localStorage.getItem('navCollapsed');
    return saved ? saved === '1' : window.innerWidth < 1200;
  });
  const toggleNav = () => setNavCollapsed((c) => { localStorage.setItem('navCollapsed', c ? '0' : '1'); return !c; });

  const { unreadCount, toast: msgToast, dismissToast } = useNotifications();
  const { language, toggleLanguage, t } = useLanguage();
  const location = useLocation();
  // Where /login sends an already-logged-in visitor (or Login itself
  // navigates to, after signing in). Must be the SAME target both places
  // read from a single query param — Login.jsx's own `navigate()` call and
  // this route's declarative <Navigate> both fire off the same `setUser`
  // update, so if they disagreed on the destination, whichever happened to
  // win that race would silently drop the other's redirect (this is how a
  // /login?redirect=/profile/x link used to land back on /posts instead).
  const postLoginRedirect = new URLSearchParams(location.search).get('redirect') || '/posts';

  // "Modal with a real URL behind it" (e.g. clicking a profile card pushes
  // /profile/:userName over the current page). The pusher stashes the page
  // it was on as location.state.backgroundLocation; as long as that's set,
  // Routes below matches against the OLD location so the underlying page
  // stays mounted (and its own popup keeps rendering on top of it) while
  // the address bar shows the new URL.
  //
  // A hard reload/direct visit has no in-memory app state driving a popup,
  // even though the browser preserves history.state (and so this same
  // backgroundLocation) across reloads. We only want to honor it for
  // location entries reached by an in-app navigate() *after* this app
  // instance booted, not the one we happened to boot on — so capture the
  // key of whichever entry was current at mount (lazy initializer, runs
  // once) and ignore backgroundLocation until location.key moves past it.
  const [bootLocationKey] = useState(() => location.key);
  const backgroundLocation = location.key === bootLocationKey ? undefined : location.state?.backgroundLocation;

  useEffect(() => {
    document.body.setAttribute('lang', language);
  }, [language]);

  // Follow logins/logouts made in other tabs.
  useEffect(() => {
    const handleStorage = () => setUser(readStoredUser());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Close mobile menu and avatar dropdown on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to navigation is what this effect is for
    setMenuOpen(false);
    window.scrollTo(0, 0);

    // Safety net for Chats.jsx's own cleanup of the body-scroll-lock class
    // it adds on mount (see App.css "body.chat-active"). That cleanup runs
    // on normal unmount, but bfcache restores and other non-standard exits
    // from /chats can leave it stuck, silently locking scroll on every page
    // visited afterward — including ones with no chat UI at all, like
    // Profile. Idempotent, so it's safe to call even when already removed.
    if (!location.pathname.startsWith('/chats')) {
      document.body.classList.remove('chat-active');
    }
  }, [location.pathname]);

  // Native mouse-wheel scrolling can go silently inert after certain
  // navigations (confirmed repro: visit /chats, then SPA-navigate to
  // Profile — programmatic scrollTo still works, CSS/overflow is healthy,
  // no listener calls preventDefault, but wheel-triggered scroll just stops
  // doing anything). Root cause still not found after an exhaustive check
  // (not CSS, not an explicit listener, not a stray overlay/iframe stealing
  // focus) — revisit if a real cause surfaces, then this can be deleted.
  //
  // Scoped to only arm right after leaving /chats, the one confirmed repro:
  // applying it on every route unconditionally double-scrolled EVERY page
  // (this scrollBy stacking on top of the native scroll, which had already
  // happened by the time this listener ran — Chrome applies passive wheel
  // listeners' default scroll on the compositor thread without waiting on
  // JS, so there's no reliable way to detect "did it already scroll" here).
  const prevPathRef = useRef(location.pathname);
  useEffect(() => {
    const cameFromChats = prevPathRef.current.startsWith('/chats');
    prevPathRef.current = location.pathname;
    if (!cameFromChats) return;
    const handleWheelFallback = (e) => {
      if (document.documentElement.scrollHeight > document.documentElement.clientHeight) {
        window.scrollBy(0, e.deltaY);
      }
    };
    window.addEventListener('wheel', handleWheelFallback, { passive: true });
    return () => window.removeEventListener('wheel', handleWheelFallback);
  }, [location.pathname]);

  const isAdmin = user?.role === 'Admin' || user?.userType === 'Admin';
  const isActive = (path) => location.pathname === path;

  const confirmLogout = () => {
    localStorage.clear();
    setUser(null);
    setShowLogoutModal(false);
    window.location.href = '/login';
  };

  return (
    <div className={`app-container theme-dark${user ? ' has-shell' : ''}${user && navCollapsed ? ' nav-collapsed' : ''}`}>
      <AppBackground />
      {/* ── Navigation: sidebar when signed in, top bar for visitors ── */}
      {user ? (
        <SideNav user={user} isAdmin={isAdmin} collapsed={navCollapsed} onToggle={toggleNav} unread={unreadCount}
          language={language} onLanguage={toggleLanguage} onInvite={() => setShowInviteModal(true)}
          onLogout={() => setShowLogoutModal(true)} Avatar={NavAvatar} />
      ) : (
      <nav className="navbar navbar--glass">
        <Link to="/" className="nav-logo">
          <Logo className="nav-logo-img" />
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
              <Link to="/help" className={`nav-item ${isActive('/help') ? 'active' : ''}`}>
                <HelpCircle size={17} /> {t('help')}
              </Link>
              <Link to="/login" className={`nav-item ${isActive('/login') ? 'active' : ''}`}>
                {t('login')}
              </Link>
              <Link to="/?register=true" className="nav-item nav-cta">
                {t('register')}
              </Link>
              <button onClick={toggleLanguage} className="nav-item nav-lang">
                <Globe size={17} /> {language === 'en' ? 'తెలుగు' : 'English'}
              </button>
            </div>
      </nav>
      )}

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
            className="promo-wrap"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              background: 'linear-gradient(90deg, #7C3AED 0%, #FF6B35 50%, #F59E0B 100%)',
              padding: '0.38rem 1.5rem',
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
              <p style={{ margin: 0, color: 'white', fontSize: '0.8rem', fontWeight: 500, letterSpacing: '0.01em' }}>
                <strong style={{ fontWeight: 700 }}>FestiveGuest is completely free</strong> during our launch — no subscriptions, no fees.
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
            <Routes location={backgroundLocation || location}>
              <Route path="/" element={<PageTransition><Home user={user} /></PageTransition>} />
              <Route path="/home" element={<PageTransition><Home user={user} /></PageTransition>} />
              <Route path="/r/:code" element={<PageTransition><ReferralRedirect /></PageTransition>} />
              <Route path="/login" element={!user ? <PageTransition><Login setUser={setUser} /></PageTransition> : <Navigate to={postLoginRedirect} />} />
              <Route path="/register" element={!user ? <PageTransition><Registration /></PageTransition> : <Navigate to="/home" />} />
              <Route path="/chats" element={user ? <PageTransition><Chats /></PageTransition> : <Navigate to="/login" />} />
              <Route path="/posts" element={user ? <PageTransition><Posts /></PageTransition> : <Navigate to="/login" />} />
              <Route path="/profile" element={user ? <PageTransition><Profile /></PageTransition> : <Navigate to="/login" />} />
              <Route path="/trips" element={user ? <PageTransition><Trips /></PageTransition> : <Navigate to="/login" />} />
              <Route path="/saved" element={user ? <PageTransition><Saved /></PageTransition> : <Navigate to="/login" />} />
              <Route path="/profile/:userName" element={<PageTransition><PublicProfile /></PageTransition>} />
              <Route path="/admin" element={isAdmin ? <PageTransition><Admin /></PageTransition> : <Navigate to="/login" />} />
              <Route path="/help" element={<PageTransition><Help /></PageTransition>} />
              <Route path="/privacy-policy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
              <Route path="/terms-of-service" element={<PageTransition><TermsOfService /></PageTransition>} />
              <Route path="/safety-guidelines" element={<PageTransition><SafetyGuidelines /></PageTransition>} />
              {/* Old addresses people may have bookmarked */}
              {['/browse', '/guest-dashboard', '/host-dashboard'].map((p) => <Route key={p} path={p} element={<Navigate to="/posts" replace />} />)}
              {['/subscription', '/referrals'].map((p) => <Route key={p} path={p} element={<Navigate to="/profile" replace />} />)}
              <Route path="/chat/:recipientId" element={<Navigate to="/chats" replace />} />
              <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
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
