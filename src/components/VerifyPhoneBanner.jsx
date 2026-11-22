import { useState } from 'react';
import { Smartphone, X } from 'lucide-react';
import VerifyPhoneDialog from './VerifyPhoneDialog';

const DISMISS_KEY = 'verifyPhoneLater';
const storedUser = () => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } };

/**
 * Nudge for members who signed up without verifying their phone.
 * "Later" hides it for this browser session only.
 */
export default function VerifyPhoneBanner() {
  const [user] = useState(storedUser);
  const [hidden, setHidden] = useState(() => sessionStorage.getItem(DISMISS_KEY) === '1');
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  // Only explicit false: older sessions without the field shouldn't be nagged.
  if (user.isVerified !== false || hidden || done) return null;
  const later = () => { sessionStorage.setItem(DISMISS_KEY, '1'); setHidden(true); };

  return (
    <>
      <div className="vp-banner" role="status">
        <span className="vp-banner-icon" aria-hidden="true"><Smartphone size={18} /></span>
        <p><strong>Verify your phone number</strong> — verified members get a ✓ badge and more replies.</p>
        <button type="button" className="rg-btn rg-btn-primary rg-btn-sm vp-banner-btn" onClick={() => setOpen(true)}>Verify now</button>
        <button type="button" className="vp-banner-close" onClick={later} aria-label="Remind me later" title="Remind me later"><X size={16} /></button>
      </div>
      <VerifyPhoneDialog open={open} onClose={() => setOpen(false)}
        onVerified={() => { setOpen(false); setDone(true); }} />
    </>
  );
}
