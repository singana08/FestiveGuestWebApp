import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { House, MessageCircle, Luggage, Users, Heart, User, HelpCircle, ShieldCheck, UserPlus, Globe, LogOut, ChevronsLeft, ChevronsRight, Menu, X } from 'lucide-react';
import Logo from './Logo';
import '../styles/Shell.css';

/**
 * The signed-in app's navigation: a left sidebar on desktop (collapses to icons, names on hover),
 * collapsed by default on tablets, and on phones a slim top bar plus a bottom tab bar.
 */
export default function SideNav(props) {
  const { user, isAdmin, collapsed, onToggle, unread, language, onLanguage, onInvite, onLogout } = props;
  const Avatar = props.Avatar;
  const isHost = (user.userType || user.role) === 'Host';
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  // eslint-disable-next-line react-hooks/set-state-in-effect -- closing the phone menu when the page changes is the point
  useEffect(() => { setMoreOpen(false); }, [location.pathname]);

  const items = [
    { to: '/posts', icon: House, label: 'Home' },
    { to: '/chats', icon: MessageCircle, label: 'Chats', badge: unread },
    { to: '/trips', icon: isHost ? Users : Luggage, label: isHost ? 'My guests' : 'My trips', short: isHost ? 'Guests' : 'Trips' },
    { to: '/saved', icon: Heart, label: 'Saved' },
    { to: '/profile', icon: User, label: 'Profile', end: true },
    { to: '/help', icon: HelpCircle, label: 'Help' },
    ...(isAdmin ? [{ to: '/admin', icon: ShieldCheck, label: 'Admin' }] : []),
  ];
  const badge = (n) => (n > 0 ? <span className="sn-badge">{n > 99 ? '99+' : n}</span> : null);
  const langLabel = language === 'en' ? 'తెలుగు' : 'English';
  const extras = [
    { key: 'invite', icon: UserPlus, label: 'Invite friends', onClick: onInvite },
    { key: 'lang', icon: Globe, label: langLabel, onClick: onLanguage },
  ];

  return (
    <>
      {/* ── Desktop & tablet sidebar ── */}
      <aside className={`sn${collapsed ? ' is-collapsed' : ''}`} aria-label="Main menu">
        <div className="sn-head">
          <Link to="/posts" className="sn-logo" aria-label="FestiveGuest home">
            {collapsed ? <span className="sn-mark"><img src="/assets/login-logo.png" alt="" /></span> : <Logo className="sn-logo-img" />}
          </Link>
          <button type="button" className="sn-toggle" onClick={onToggle} aria-label={collapsed ? 'Expand menu' : 'Collapse menu'} aria-expanded={!collapsed}>
            {collapsed ? <ChevronsRight size={17} /> : <ChevronsLeft size={17} />}
          </button>
        </div>

        <nav className="sn-items">
          {items.map(({ to, icon, label, badge: n, end }) => { const Icon = icon; return (
            <NavLink key={to} to={to} end={end} className="sn-item" data-tip={label} aria-label={collapsed ? label : undefined}>
              <Icon size={19} aria-hidden="true" />
              <span className="sn-label">{label}</span>
              {badge(n)}
            </NavLink>
          ); })}
        </nav>

        <div className="sn-foot">
          {extras.map(({ key, icon, label, onClick }) => { const Icon = icon; return (
            <button key={key} type="button" className="sn-item" data-tip={label} aria-label={collapsed ? label : undefined} onClick={onClick}>
              <Icon size={18} aria-hidden="true" /><span className="sn-label">{label}</span>
            </button>
          ); })}
          <Link to="/profile" className="sn-me" data-tip={user.name} aria-label={collapsed ? `${user.name}, your profile` : undefined}>
            <Avatar user={user} />
            <span className="sn-label"><strong>{user.name}</strong><small>{isAdmin ? 'Admin' : isHost ? 'Local host' : 'Traveller'}</small></span>
          </Link>
          <button type="button" className="sn-item sn-logout" data-tip="Log out" aria-label={collapsed ? 'Log out' : undefined} onClick={onLogout}>
            <LogOut size={18} aria-hidden="true" /><span className="sn-label">Log out</span>
          </button>
        </div>
      </aside>

      {/* ── Phone: slim top bar + bottom tabs ── */}
      <header className="sn-phone-top">
        <Link to="/posts" className="sn-logo" aria-label="FestiveGuest home"><Logo className="sn-logo-img" /></Link>
        <button type="button" className="sn-more-btn" onClick={() => setMoreOpen((o) => !o)} aria-label="More" aria-expanded={moreOpen}>
          {moreOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        {moreOpen && (
          <div className="sn-more" role="menu">
            <Link to="/help" role="menuitem"><HelpCircle size={17} /> Help</Link>
            {isAdmin && <Link to="/admin" role="menuitem"><ShieldCheck size={17} /> Admin</Link>}
            {extras.map(({ key, icon, label, onClick }) => { const Icon = icon; return (
              <button key={key} type="button" role="menuitem" onClick={() => { setMoreOpen(false); onClick(); }}><Icon size={17} /> {label}</button>
            ); })}
            <button type="button" role="menuitem" className="sn-logout" onClick={() => { setMoreOpen(false); onLogout(); }}><LogOut size={17} /> Log out</button>
          </div>
        )}
      </header>
      <nav className="sn-tabs" aria-label="Main menu">
        {items.filter((i) => ['/posts', '/chats', '/trips', '/saved', '/profile'].includes(i.to)).map(({ to, icon, label, short, badge: n, end }) => { const Icon = icon; return (
          <NavLink key={to} to={to} end={end} className="sn-tab">
            <span className="sn-tab-icon"><Icon size={21} aria-hidden="true" />{badge(n)}</span>
            <span>{short || label}</span>
          </NavLink>
        ); })}
      </nav>
    </>
  );
}
