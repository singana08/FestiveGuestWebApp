import { useState } from 'react';
import { Smartphone, AlertTriangle, ShieldCheck } from 'lucide-react';
import api from '../utils/api';
import GlassDialog from './posts/GlassDialog';

const digitsOnly = (v) => (v || '').replace(/\D/g, '').slice(0, 10);
const message = (err, fallback) => err.response?.data?.message || (err.response ? fallback : 'Couldn’t reach FestiveGuest. Check your connection and try again.');

/** Saves the verified state into the stored session so banners/badges update at once. */
const markVerified = (phone) => {
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem('user', JSON.stringify({ ...u, phone, isVerified: true }));
    window.dispatchEvent(new Event('storage'));
  } catch { /* ignore */ }
};

/**
 * Verify the signed-in member's mobile number by SMS code.
 * initialPhone is only used when it's a plain number (the profile endpoint returns a masked one).
 */
export default function VerifyPhoneDialog({ open, onClose, initialPhone, onVerified }) {
  const [phone, setPhone] = useState(/^\d{10}$/.test(initialPhone || '') ? initialPhone : '');
  const [sessionId, setSessionId] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const close = () => { if (!busy) { setSessionId(''); setCode(''); setError(''); onClose(); } };

  const sendCode = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) { setError('Enter your 10-digit mobile number'); return; }
    setBusy(true); setError('');
    try {
      const res = await api.post('phone-otp/send', { phone });
      setSessionId(res.data.sessionId);
    } catch (err) {
      console.error('Phone OTP send failed:', err.response?.data?.message || err.message);
      setError('We couldn’t send the code right now. Please try again in a little while.');
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (code.length !== 6) { setError('Enter the 6-digit code'); return; }
    setBusy(true); setError('');
    try {
      const check = await api.post('phone-otp/verify', { sessionId, otp: code, phone, purpose: 'verify' });
      await api.post('user/verify-phone', { phone, verificationToken: check.data.verificationToken });
      markVerified(phone);
      setSessionId(''); setCode('');
      onVerified?.(phone);
    } catch (err) {
      setError(message(err, 'That code didn’t work. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassDialog open={open} onClose={close} size="sm" icon={<Smartphone size={17} />} title="Verify your phone"
      subtitle="Verified members get a ✓ badge — people reply to them more readily."
      footer={(
        <>
          <button type="button" className="rg-btn rg-btn-ghost" onClick={close} disabled={busy}>Later</button>
          {sessionId
            ? <button type="button" className="rg-btn rg-btn-primary pb-submit" onClick={verify} disabled={busy || code.length !== 6}>{busy ? <><span className="rg-spinner" /> Verifying…</> : 'Verify'}</button>
            : <button type="button" className="rg-btn rg-btn-primary pb-submit" onClick={sendCode} disabled={busy}>{busy ? <><span className="rg-spinner" /> Sending…</> : 'Send code'}</button>}
        </>
      )}>
      {error && <div className="rg-alert" role="alert"><AlertTriangle size={17} /> {error}</div>}
      <div className="rg-field">
        <label className="rg-label" htmlFor="vp-phone">Mobile number</label>
        <div className="rg-inline">
          <span className="rg-prefix" aria-hidden="true" style={{ color: 'rgba(255,240,230,0.74)' }}>+91</span>
          <input id="vp-phone" type="tel" inputMode="numeric" autoComplete="tel-national" className="rg-input rg-input--prefixed"
            value={phone} disabled={!!sessionId || busy} placeholder="10-digit mobile number"
            onChange={(e) => { setPhone(digitsOnly(e.target.value)); setError(''); }} />
        </div>
      </div>
      {sessionId && (
        <div className="rg-field">
          <label className="rg-label" htmlFor="vp-code">Code sent by SMS to +91 {phone}</label>
          <input id="vp-code" className="rg-input vp-code" inputMode="numeric" autoComplete="one-time-code" placeholder="••••••" maxLength={6}
            value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }} />
          <button type="button" className="rg-link-btn vp-resend" onClick={sendCode} disabled={busy}>Resend code</button>
        </div>
      )}
      <p className="vp-note"><ShieldCheck size={14} /> Your number is never shown to other members.</p>
    </GlassDialog>
  );
}
