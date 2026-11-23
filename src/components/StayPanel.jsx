import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, CalendarPlus, Check, Star, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
import { stayDates, stayWord } from '../utils/stays';
import '../styles/Trust.css';

const today = () => new Date().toISOString().slice(0, 10);
const started = (s) => s.startDate.slice(0, 10) <= today();
const myType = () => { try { return JSON.parse(localStorage.getItem('user') || '{}').userType; } catch { return ''; } };

/** "Ravi requested a stay" / "Lakshmi offered to host you" — who asked shapes the wording. */
const asked = (s, name) => {
  const byHost = s.requesterId === s.hostId;
  if (s.kind === 'meetup') return byHost ? `${name} offered to meet` : `${name} requested a meet-up`;
  return byHost ? `${name} offered to host you` : `${name} requested a stay`;
};

/**
 * Stay requests in a chat. A traveller requests dates (a host can offer them); only the other person confirms.
 * The request and each answer are also posted into the chat (onMessage), so the conversation carries on around it.
 * Reviews open once a confirmed stay has ended.
 */
export default function StayPanel({ otherUserId, otherName, meId, onMessage }) {
  const [stays, setStays] = useState(null);
  const [form, setForm] = useState(null); // { kind, start, end, note } while requesting
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const first = (otherName || '').split(' ')[0] || 'them';
  const isHost = myType() === 'Host';

  useEffect(() => {
    let live = true;
    api.get(`stays/with/${encodeURIComponent(otherUserId)}`)
      .then((res) => { if (live) setStays(res.data || []); })
      .catch(() => { if (live) setStays([]); });
    return () => { live = false; };
  }, [otherUserId, reload]);

  const act = async (call) => {
    setBusy(true); setError('');
    try {
      const res = await call();
      setForm(null);
      setReload((n) => n + 1);
      if (res.data?.message) onMessage?.(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  const send = () => {
    if (!form.start || !form.end) { setError('Pick the dates.'); return; }
    act(() => api.post('stays', { partnerId: otherUserId, kind: form.kind, startDate: form.start, endDate: form.end, note: form.note.trim() }));
  };
  const answer = (s, what) => act(() => api.post(`stays/${encodeURIComponent(s.id)}/${what}`));

  if (stays === null) return null;
  const open = stays.find((s) => s.status === 'Pending');
  const latest = stays.find((s) => s.status === 'Confirmed');
  const cta = latest ? (isHost ? 'Offer more dates' : 'Request another stay') : (isHost ? `Offer dates to ${first}` : `Request a stay with ${first}`);

  return (
    <div className="ts" aria-live="polite">
      {error && <p className="ts-error" role="alert"><AlertTriangle size={14} /> {error}</p>}

      {open && open.partnerId === meId && (
        <div className="ts-row is-ask">
          <CalendarCheck size={16} />
          <span><strong>{asked(open, first)}</strong>: <strong>{stayDates(open)}</strong></span>
          <span className="ts-actions">
            <button type="button" className="rg-btn rg-btn-primary rg-btn-sm" onClick={() => answer(open, 'accept')} disabled={busy}><Check size={14} /> Confirm</button>
            <button type="button" className="rg-btn rg-btn-ghost rg-btn-sm" onClick={() => answer(open, 'decline')} disabled={busy}>Decline</button>
          </span>
        </div>
      )}
      {open && open.requesterId === meId && (
        <div className="ts-row">
          <CalendarCheck size={16} />
          <span>Your {open.requesterId === open.hostId ? 'offer' : 'request'} is waiting for {first} to confirm: <strong>{stayDates(open)}</strong></span>
          <span className="ts-actions"><button type="button" className="rg-link-btn" onClick={() => answer(open, 'cancel')} disabled={busy}>Cancel request</button></span>
        </div>
      )}

      {!open && latest && (
        <div className={`ts-row ${latest.ended ? 'is-done' : 'is-on'}`}>
          <Check size={16} />
          {latest.ended
            ? <span>You and {first} had a {stayWord(latest)}: <strong>{stayDates(latest)}</strong></span>
            : <span>{latest.kind === 'meetup' ? 'Meet-up' : 'Stay'} confirmed: <strong>{stayDates(latest)}</strong></span>}
          <span className="ts-actions">
            {latest.ended
              ? <Link className="rg-btn rg-btn-primary rg-btn-sm" to={`/profile/${encodeURIComponent(otherName)}`}><Star size={14} /> Write a review</Link>
              : !started(latest) && <button type="button" className="rg-link-btn" onClick={() => { if (window.confirm(`Cancel your ${stayWord(latest)} with ${first}?`)) answer(latest, 'cancel'); }} disabled={busy}>Cancel</button>}
          </span>
        </div>
      )}

      {!open && !form && (
        <button type="button" className={latest ? 'rg-link-btn ts-new' : 'ts-cta'} onClick={() => { setForm({ kind: 'stay', start: '', end: '', note: '' }); setError(''); }}>
          <CalendarPlus size={15} /> {cta}
        </button>
      )}

      {form && (
        <div className="ts-form">
          <div className="ts-kind" role="radiogroup" aria-label="What is it for?">
            {[['stay', 'A stay'], ['meetup', 'A meet-up / guide visit']].map(([k, label]) => (
              <button key={k} type="button" role="radio" aria-checked={form.kind === k} className={form.kind === k ? 'is-on' : ''} onClick={() => setForm((f) => ({ ...f, kind: k }))}>{label}</button>
            ))}
          </div>
          <div className="ts-dates">
            <label>From<input type="date" className="rg-input" value={form.start} onChange={(e) => setForm((f) => ({ ...f, start: e.target.value, end: f.end && f.end < e.target.value ? '' : f.end }))} /></label>
            <label>To<input type="date" className="rg-input" value={form.end} min={form.start || undefined} onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))} /></label>
          </div>
          <textarea className="rg-input rg-textarea ts-note" rows={2} maxLength={300} aria-label={`Note for ${first} (optional)`}
            placeholder={isHost ? 'Anything they should know? (check-in time, house rules…)' : `Anything ${first} should know? (arrival time, how many people…)`}
            value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
          <p className="ts-hint">This goes into your chat, and {first} will be asked to confirm. You can keep chatting meanwhile.</p>
          <div className="ts-actions">
            <button type="button" className="rg-btn rg-btn-ghost rg-btn-sm" onClick={() => setForm(null)} disabled={busy}>Cancel</button>
            <button type="button" className="rg-btn rg-btn-primary rg-btn-sm" onClick={send} disabled={busy}>{busy ? 'Sending…' : 'Send request'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
