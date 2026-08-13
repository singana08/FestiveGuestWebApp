import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { X, Search, UserPlus, Send, Users } from 'lucide-react';
import api from '../utils/api';

const InviteFriendsModal = ({ user, onClose }) => {
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState('');
  const [step, setStep] = useState('connect'); // connect | pick | sending | done
  const [sentCount, setSentCount] = useState(0);
  const [error, setError] = useState('');

  const fetchContacts = async (accessToken) => {
    setStep('loading');
    setError('');
    try {
      const res = await fetch(
        'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses&pageSize=500',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await res.json();
      const list = (data.connections || [])
        .map(p => ({
          name: p.names?.[0]?.displayName || '',
          email: p.emailAddresses?.[0]?.value || '',
        }))
        .filter(c => c.email)
        .sort((a, b) => a.name.localeCompare(b.name));

      if (list.length === 0) {
        setError('No contacts with email addresses found in your Google account.');
        setStep('connect');
        return;
      }
      setContacts(list);
      setStep('pick');
    } catch {
      setError('Failed to load contacts. Please try again.');
      setStep('connect');
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: t => fetchContacts(t.access_token),
    onError: () => { setError('Google sign-in failed.'); setStep('connect'); },
    scope: 'openid email profile https://www.googleapis.com/auth/contacts.readonly',
  });

  const toggle = email => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  };

  const selectAll = () => {
    const visible = filtered.map(c => c.email);
    const allSelected = visible.every(e => selected.has(e));
    setSelected(prev => {
      const next = new Set(prev);
      allSelected ? visible.forEach(e => next.delete(e)) : visible.forEach(e => next.add(e));
      return next;
    });
  };

  const sendInvitations = async () => {
    if (selected.size === 0) return;
    setStep('sending');
    setError('');
    try {
      const res = await api.post('email/send-invitations', {
        emails: [...selected],
        inviterName: user.name,
        referralCode: user.referralCode,
      });
      if (res.data.success) {
        setSentCount(selected.size);
        setStep('done');
      } else {
        setError(res.data.message || 'Failed to send invitations.');
        setStep('pick');
      }
    } catch (err) {
      setError('Failed to send: ' + (err.response?.data?.message || err.message));
      setStep('pick');
    }
  };

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const visibleAllSelected = filtered.length > 0 && filtered.every(c => selected.has(c.email));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,8,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 24 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        style={{ background: 'white', borderRadius: 'var(--radius-xl)', boxShadow: '0 30px 80px rgba(0,0,0,0.22)', width: '100%', maxWidth: '520px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>Invite Friends</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>They join → you both get rewarded</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>

          {/* Connect step */}
          {(step === 'connect' || step === 'loading') && (
            <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📬</div>
              <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Import Google Contacts</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
                Sign in with Google to see your contacts and pick who to invite. We only read their names and emails — nothing else.
              </p>
              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  {error}
                </div>
              )}
              <button
                onClick={() => {
                  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
                    setError('Google Sign-In not configured. Add VITE_GOOGLE_CLIENT_ID to .env and restart.');
                    return;
                  }
                  googleLogin();
                }}
                disabled={step === 'loading'}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.75rem', background: 'white', border: '1.5px solid #dadce0', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 600, color: '#3c4043', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', opacity: step === 'loading' ? 0.6 : 1 }}
              >
                {step === 'loading' ? (
                  <><div style={{ width: 18, height: 18, border: '2px solid #dadce0', borderTopColor: '#4285F4', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Loading contacts…</>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Connect Google Contacts
                  </>
                )}
              </button>
              <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Your referral code: <strong style={{ color: 'var(--primary)' }}>{user?.referralCode || '—'}</strong>
              </p>
            </div>
          )}

          {/* Pick contacts step */}
          {step === 'pick' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Search + select all */}
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search contacts…"
                    style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.25rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', outline: 'none', background: 'var(--background)', boxSizing: 'border-box' }}
                  />
                </div>
                <button
                  onClick={selectAll}
                  style={{ padding: '0.5rem 0.875rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text)', whiteSpace: 'nowrap' }}
                >
                  {visibleAllSelected ? 'Deselect all' : 'Select all'}
                </button>
              </div>

              {error && (
                <div style={{ margin: '0.75rem 1.5rem 0', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.625rem', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
                  {error}
                </div>
              )}

              {/* Contact list */}
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    No contacts match "{search}"
                  </div>
                ) : (
                  filtered.map(c => (
                    <label
                      key={c.email}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.75rem 1.5rem', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: selected.has(c.email) ? 'rgba(255,107,53,0.04)' : 'transparent', transition: 'background 0.15s' }}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(c.email)}
                        onChange={() => toggle(c.email)}
                        style={{ width: 17, height: 17, accentColor: 'var(--primary)', flexShrink: 0, cursor: 'pointer' }}
                      />
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                        {c.name ? c.name[0].toUpperCase() : c.email[0].toUpperCase()}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name || c.email}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.email}</div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Done step */}
          {step === 'done' && (
            <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
              <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Invitations Sent!</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
                {sentCount} friend{sentCount !== 1 ? 's' : ''} received your invite with referral code <strong style={{ color: 'var(--primary)' }}>{user?.referralCode}</strong>.
              </p>
              <button
                onClick={onClose}
                style={{ padding: '0.75rem 2.5rem', background: 'var(--gradient-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Footer (only on pick step) */}
        {step === 'pick' && (
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--background)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <Users size={14} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />
              {selected.size} selected
              {selected.size > 20 && <span style={{ color: '#dc2626', marginLeft: '0.5rem' }}>max 20</span>}
            </div>
            <motion.button
              onClick={sendInvitations}
              disabled={selected.size === 0 || selected.size > 20}
              whileHover={{ scale: selected.size > 0 && selected.size <= 20 ? 1.02 : 1 }}
              whileTap={{ scale: 0.98 }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.5rem', background: 'var(--gradient-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 700, cursor: selected.size === 0 || selected.size > 20 ? 'not-allowed' : 'pointer', opacity: selected.size === 0 || selected.size > 20 ? 0.5 : 1, fontSize: '0.9rem' }}
            >
              <Send size={16} /> Send {selected.size > 0 ? selected.size : ''} Invite{selected.size !== 1 ? 's' : ''}
            </motion.button>
          </div>
        )}

        {/* Sending overlay */}
        {step === 'sending' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <div style={{ width: 36, height: 36, border: '3px solid rgba(255,107,53,0.2)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>Sending invitations…</span>
          </div>
        )}
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
};

export default InviteFriendsModal;
