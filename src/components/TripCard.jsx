import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Check, Star, MapPin, CalendarDays, Images } from 'lucide-react';
import api from '../utils/api';
import { ask, toast } from '../utils/feedback';
import { stayDates, stayWord, whenLabel, daysUntil } from '../utils/stays';
import ShareStay from './ShareStay';
import '../styles/Trust.css';

const first = (name) => (name || '').split(' ')[0] || 'them';

/** The ticket's date stub on My trips (same look as the trip cards on Posts). Stay dates are UTC dates. */
function Stub({ stay }) {
  const d = daysUntil(stay);
  const tone = stay.ended ? 'past' : stay.status === 'Pending' ? 'flex' : d <= 3 ? 'soon' : 'later';
  const when = stay.ended ? 'Done' : stay.status === 'Pending' ? 'Requested' : d > 1 ? `in ${d} days` : d === 1 ? 'Tomorrow' : d === 0 ? 'Today' : 'Now';
  const part = (o) => new Date(stay.startDate).toLocaleDateString('en-IN', { ...o, timeZone: 'UTC' });
  return (
    <div className={`pb-tk-stub pb-tk-stub--${tone} tc-stub`} aria-hidden="true">
      <span className="pb-tk-mon">{part({ month: 'short' })}</span>
      <span className="pb-tk-day">{part({ day: 'numeric' })}</span>
      <span className="pb-tk-wk">{part({ weekday: 'short' })}</span>
      <span className="pb-tk-rule" />
      <span className="pb-tk-when">{when}</span>
    </div>
  );
}

/**
 * One trip as both people see it. A traveller sees the host and their place; a host sees the guest and their note.
 * Actions follow the state: confirm/decline a request, cancel, message, share my stay, review once it's over.
 */
export default function TripCard({ trip, meId, onChanged, compact = false }) {
  const { stay, other, nights, reviewed } = trip;
  const [busy, setBusy] = useState(false);
  const iAmHost = stay.hostId === meId;
  const askingMe = stay.status === 'Pending' && stay.partnerId === meId;
  const upcoming = stay.status === 'Confirmed' && !stay.ended;
  const picture = other.coverUrl || other.photoUrl;
  const profile = `/profile/${encodeURIComponent(other.name)}`;
  const chat = `/chats?with=${encodeURIComponent(other.id)}&name=${encodeURIComponent(other.name)}`;
  const word = stayWord(stay);

  const act = async (what) => {
    if (what === 'cancel' && stay.status === 'Confirmed' && !(await ask({ title: `Cancel your ${word} with ${first(other.name)}?`, text: 'We’ll let them know. You can request a new one any time.', confirmLabel: `Cancel ${word}`, cancelLabel: 'Keep it', danger: true }))) return;
    setBusy(true);
    try { await api.post(`stays/${encodeURIComponent(stay.id)}/${what}`); onChanged?.(); }
    catch (err) { toast(err.response?.data?.message || 'Something went wrong. Please try again.', 'error'); }
    finally { setBusy(false); }
  };

  const title = iAmHost
    ? (askingMe ? `${other.name} requested a ${word}` : `${other.name}`)
    : `${stay.kind === 'meetup' ? 'Meet-up' : 'Stay'} with ${other.name}`;
  const status = stay.ended ? (reviewed ? 'Reviewed' : 'Done')
    : stay.status === 'Pending' ? (askingMe ? 'Waiting for you' : `Waiting for ${first(other.name)}`)
      : (compact && whenLabel(stay)) || 'Confirmed';
  // A ticket's date stub already says the day and "Done" / "in 3 days": don't repeat them beside the name.
  const showStatus = compact || !['Done', 'Confirmed'].includes(status);
  const showDates = compact || stay.startDate.slice(0, 10) !== stay.endDate.slice(0, 10);

  return (
    <article className={`tc${compact ? ' tc--compact' : ' tc--ticket'}${askingMe ? ' is-ask' : ''}`}>
      {!compact && <Stub stay={stay} />}
      <Link to={profile} className="tc-pic" aria-label={`${other.name}’s profile`}>
        {picture ? <img src={picture} alt="" loading="lazy" /> : <span className="tc-initial">{(other.name || '?').charAt(0).toUpperCase()}</span>}
        {!iAmHost && other.coverUrl && <span className="tc-pic-tag"><Images size={11} /> Photos</span>}
      </Link>
      <div className="tc-body">
        <div className="tc-top">
          <h3>{title}</h3>
          {showStatus && <span className={`tc-status${upcoming && daysUntil(stay) <= 1 ? ' is-soon' : ''}${stay.ended ? ' is-done' : ''}${stay.status === 'Pending' ? ' is-pending' : ''}${status === 'Confirmed' ? ' is-ok' : ''}`}>{status}</span>}
        </div>
        {(showDates || other.location) && (
          <p className="tc-meta">
            {showDates && <span><CalendarDays size={13} /> {stayDates(stay)}{stay.kind === 'stay' && nights > 0 && ` · ${nights} night${nights === 1 ? '' : 's'}`}</span>}
            {other.location && <span><MapPin size={13} /> {other.location}</span>}
          </p>
        )}
        {stay.note && (iAmHost || stay.requesterId === meId) && <p className="tc-note">“{stay.note}”</p>}
        <div className="tc-actions">
          {askingMe && (
            <>
              <button type="button" className="rg-btn rg-btn-primary rg-btn-sm" onClick={() => act('accept')} disabled={busy}><Check size={14} /> Confirm</button>
              <button type="button" className="rg-btn rg-btn-ghost rg-btn-sm" onClick={() => act('decline')} disabled={busy}>Decline</button>
            </>
          )}
          {stay.ended && !reviewed && <Link className="rg-btn rg-btn-primary rg-btn-sm" to={profile}><Star size={14} /> Write a review</Link>}
          <Link className="rg-btn rg-btn-ghost rg-btn-sm" to={chat}><MessageCircle size={14} /> Message</Link>
          {stay.status === 'Pending' && !askingMe && <button type="button" className="rg-link-btn" onClick={() => act('cancel')} disabled={busy}>Cancel request</button>}
          {upcoming && daysUntil(stay) > 0 && !compact && <button type="button" className="rg-link-btn" onClick={() => act('cancel')} disabled={busy}>Cancel</button>}
        </div>
        {upcoming && !iAmHost && !compact && <ShareStay host={{ name: other.name, location: other.location }} />}
      </div>
    </article>
  );
}
