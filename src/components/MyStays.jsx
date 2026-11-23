import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Check, Star } from 'lucide-react';
import api from '../utils/api';
import { stayDates, stayWord } from '../utils/stays';
import '../styles/Trust.css';

const today = () => new Date().toISOString().slice(0, 10);

/** "Your stays" on your own profile: requests waiting for you first, then upcoming, then past (with a review link). */
export default function MyStays({ meId }) {
  const [stays, setStays] = useState(null);
  const [busy, setBusy] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let live = true;
    api.get('stays/mine')
      .then((res) => { if (live) setStays(res.data || []); })
      .catch(() => { if (live) setStays([]); });
    return () => { live = false; };
  }, [reload]);

  const answer = async (s, what) => {
    setBusy(s.id);
    try { await api.post(`stays/${encodeURIComponent(s.id)}/${what}`); setReload((n) => n + 1); }
    catch (err) { window.alert(err.response?.data?.message || 'Something went wrong. Please try again.'); }
    finally { setBusy(''); }
  };

  const shown = (stays || []).filter((s) => s.status === 'Pending' || s.status === 'Confirmed');
  if (!shown.length) return null;
  const rank = (s) => (s.status === 'Pending' && s.partnerId === meId ? 0 : s.status === 'Confirmed' && !s.ended ? 1 : s.status === 'Pending' ? 2 : 3);
  const sorted = [...shown].sort((a, b) => rank(a) - rank(b));

  return (
    <section className="pf-card">
      <header className="pf-card-head"><h2><CalendarCheck size={16} /> Your stays</h2><span className="pf-count">{shown.length}</span></header>
      <ul className="ts-list">
        {sorted.map((s) => {
          const other = s.requesterId === meId ? s.partnerName : s.requesterName;
          const askingMe = s.status === 'Pending' && s.partnerId === meId;
          return (
            <li key={s.id} className={askingMe ? 'is-ask' : ''}>
              <span><strong>{s.kind === 'meetup' ? 'Meet-up' : 'Stay'} with {other}</strong> · {stayDates(s)}</span>
              <span className={`ts-status ts-status--${s.status.toLowerCase()}`}>{s.ended ? 'Done' : askingMe ? 'Waiting for you' : s.status}</span>
              <span className="ts-actions">
                {askingMe && (
                  <>
                    <button type="button" className="rg-btn rg-btn-primary rg-btn-sm" onClick={() => answer(s, 'accept')} disabled={busy === s.id}><Check size={14} /> Confirm</button>
                    <button type="button" className="rg-btn rg-btn-ghost rg-btn-sm" onClick={() => answer(s, 'decline')} disabled={busy === s.id}>Decline</button>
                  </>
                )}
                {s.status === 'Pending' && !askingMe && <button type="button" className="rg-link-btn" onClick={() => answer(s, 'cancel')} disabled={busy === s.id}>Cancel request</button>}
                {s.status === 'Confirmed' && !s.ended && s.startDate.slice(0, 10) > today() && (
                  <button type="button" className="rg-link-btn" onClick={() => { if (window.confirm(`Cancel your ${stayWord(s)} with ${other}?`)) answer(s, 'cancel'); }} disabled={busy === s.id}>Cancel</button>
                )}
                {s.ended && <Link className="rg-btn rg-btn-ghost rg-btn-sm" to={`/profile/${encodeURIComponent(other)}`}><Star size={14} /> Review</Link>}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
