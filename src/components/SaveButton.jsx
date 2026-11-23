import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useSavedIds, toggleSaved } from '../utils/saved';
import '../styles/Trust.css';

/** ♡ Save a host (icon-only on cards, with a word on profiles). */
export default function SaveButton({ userId, name, compact = false }) {
  const ids = useSavedIds();
  const [busy, setBusy] = useState(false);
  const saved = !!ids?.has(userId);

  const click = async (e) => {
    e.stopPropagation();
    setBusy(true);
    try { await toggleSaved(userId); }
    catch (err) { window.alert(err.response?.data?.message || 'Couldn’t update your saved hosts. Please try again.'); }
    finally { setBusy(false); }
  };

  return (
    <button type="button" className={`sv-btn${saved ? ' is-on' : ''}${compact ? ' sv-btn--icon' : ''}`} onClick={click}
      disabled={busy || ids === null} aria-pressed={saved} aria-label={saved ? `Remove ${name} from saved` : `Save ${name}`}
      title={saved ? 'Saved. Tap to remove' : 'Save this host'}>
      <Heart size={compact ? 16 : 15} />
      {!compact && <span>{saved ? 'Saved' : 'Save'}</span>}
    </button>
  );
}
