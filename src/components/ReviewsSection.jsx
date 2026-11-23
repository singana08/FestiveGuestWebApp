import { useEffect, useState } from 'react';
import { Star, AlertTriangle, Reply, Flag, Clock, Sparkles } from 'lucide-react';
import api from '../utils/api';
import '../styles/Trust.css';

const firstName = (name) => (name || '').split(' ')[0] || 'They';
const day = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const Stars = ({ value, size = 13 }) => (
  <span className="tr-stars" aria-label={`${value} out of 5 stars`}>
    {Array.from({ length: 5 }, (_, i) => <Star key={i} size={size} className={i < Math.round(value) ? 'is-on' : ''} aria-hidden="true" />)}
  </span>
);

/**
 * Published reviews, plus writing/editing your own (only after you've both messaged each other)
 * and one public reply from the person reviewed. The rules live in the API (ReviewService).
 */
export default function ReviewsSection({ userId, name, reviews = [], meId, onChanged }) {
  const isOwner = !!meId && meId === userId;
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState(null); // { rating, comment } while writing
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [replying, setReplying] = useState(null); // { id, text }
  const [reported, setReported] = useState({});
  const [statusKey, setStatusKey] = useState(0); // bump to re-check after saving

  useEffect(() => {
    if (!meId || isOwner) return undefined;
    let live = true;
    api.get(`review/status/${encodeURIComponent(userId)}`)
      .then((res) => { if (live) setStatus(res.data); })
      .catch(() => { if (live) setStatus(null); });
    return () => { live = false; };
  }, [userId, meId, isOwner, statusKey]);

  const mine = status?.mine;
  const first = firstName(name);

  const submit = async () => {
    if (!form.rating) { setError('Choose a star rating.'); return; }
    if (form.comment.trim().length < 10) { setError('Please write a few words about your experience.'); return; }
    setBusy(true); setError('');
    try {
      const res = await api.post('review', { userId, rating: form.rating, comment: form.comment.trim() });
      setForm(null);
      setNotice(res.data?.message || 'Thanks for your review!');
      setStatusKey((k) => k + 1);
      onChanged?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Couldn’t save your review. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async () => {
    if (!replying.text.trim()) return;
    setBusy(true);
    try {
      await api.post(`review/${encodeURIComponent(replying.id)}/reply`, { text: replying.text.trim() });
      setReplying(null);
      onChanged?.();
    } catch (err) {
      window.alert(err.response?.data?.message || 'Couldn’t post your reply.');
    } finally {
      setBusy(false);
    }
  };

  const report = async (review) => {
    if (!window.confirm(`Report ${review.reviewerName}’s review to the FestiveGuest team?`)) return;
    try {
      await api.post('safety/report', {
        reportedUserId: review.reviewerId, reason: 'inappropriate', context: 'review',
        details: `Review ${review.id} on ${name}’s profile: “${(review.comment || '').slice(0, 300)}”`,
      });
      setReported((r) => ({ ...r, [review.id]: true }));
    } catch {
      window.alert('Couldn’t send the report. Please try again.');
    }
  };

  return (
    <div className="tr">
      <div className="tr-head">
        <h3><Star size={16} /> Reviews <span className="tr-count">{reviews.length}</span></h3>
        {status?.canReview && !form && (
          <button type="button" className="rg-link-btn" onClick={() => { setForm({ rating: mine?.rating || 0, comment: mine?.comment || '' }); setError(''); setNotice(''); }}>
            {mine ? 'Edit your review' : 'Write a review'}
          </button>
        )}
      </div>

      {status?.theyReviewedYou && !mine && (
        <p className="tr-nudge"><Sparkles size={14} /> {first} has reviewed you. Write yours to see it, and both appear together.</p>
      )}
      {status && !status.canReview && status.reason && !mine?.visible && <p className="tr-muted">{status.reason}</p>}
      {mine && !mine.visible && !form && (mine.legacy ? (
        <p className="tr-pending"><Clock size={14} /> Your earlier review isn’t shown, because reviews now need a stay you’ve both confirmed. Confirm your stay in chat, then update it.</p>
      ) : (
        <p className="tr-pending"><Clock size={14} /> Your {mine.rating}-star review is saved. It appears when {first} reviews you too, or after 14 days. You can still edit it.</p>
      ))}
      {notice && !form && <p className="tr-notice">{notice}</p>}

      {form && (
        <div className="tr-form">
          {error && <div className="rg-alert" role="alert"><AlertTriangle size={16} /> {error}</div>}
          <div className="tr-picker" role="radiogroup" aria-label="Rating">
            {Array.from({ length: 5 }, (_, i) => (
              <button key={i} type="button" role="radio" aria-checked={form.rating === i + 1} aria-label={`${i + 1} star${i ? 's' : ''}`}
                className={i < form.rating ? 'is-on' : ''} onClick={() => { setForm((f) => ({ ...f, rating: i + 1 })); setError(''); }}>
                <Star size={24} />
              </button>
            ))}
          </div>
          <textarea className="rg-input rg-textarea" rows={3} maxLength={1000} aria-label="Your review"
            placeholder={`How was it with ${first}? What should others know?`} value={form.comment}
            onChange={(e) => { setForm((f) => ({ ...f, comment: e.target.value })); setError(''); }} />
          <p className="tr-muted">Your review stays hidden until {first} reviews you too, or for 14 days, so neither of you sees the other’s first.</p>
          <div className="tr-form-actions">
            <button type="button" className="rg-btn rg-btn-ghost rg-btn-sm" onClick={() => setForm(null)} disabled={busy}>Cancel</button>
            <button type="button" className="rg-btn rg-btn-primary rg-btn-sm" onClick={submit} disabled={busy}>{busy ? 'Saving…' : mine ? 'Save changes' : 'Post review'}</button>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="tr-muted">No reviews yet. Reviews appear after members have met through FestiveGuest.</p>
      ) : (
        <ul className="tr-list">
          {reviews.map((r) => (
            <li key={r.id || r.reviewerId}>
              <div className="tr-meta">
                <strong>{r.reviewerName}</strong>
                {r.reviewerRole && <span className={`tr-role tr-role--${r.reviewerRole === 'Host' ? 'host' : 'guest'}`}>{r.reviewerRole === 'Host' ? 'Host' : 'Guest'}</span>}
                <Stars value={r.rating} />
                <small>{day(r.createdAt)}</small>
                {meId && r.id && r.reviewerId !== meId && (
                  <button type="button" className="tr-flag" onClick={() => report(r)} disabled={reported[r.id]}
                    aria-label={`Report ${r.reviewerName}’s review`} title={reported[r.id] ? 'Reported' : 'Report this review'}><Flag size={12} /></button>
                )}
              </div>
              <p>{r.comment}</p>
              {r.reply && (
                <div className="tr-reply"><strong>{isOwner ? 'Your reply' : `Reply from ${first}`}</strong><p>{r.reply}</p></div>
              )}
              {isOwner && !r.reply && r.id && (replying?.id === r.id ? (
                <div className="tr-reply-form">
                  <textarea className="rg-input rg-textarea" rows={2} maxLength={500} aria-label="Your reply" placeholder="Thank them, or add context. One reply, shown publicly."
                    value={replying.text} onChange={(e) => setReplying({ id: r.id, text: e.target.value })} />
                  <div className="tr-form-actions">
                    <button type="button" className="rg-btn rg-btn-ghost rg-btn-sm" onClick={() => setReplying(null)} disabled={busy}>Cancel</button>
                    <button type="button" className="rg-btn rg-btn-primary rg-btn-sm" onClick={sendReply} disabled={busy || !replying.text.trim()}>Post reply</button>
                  </div>
                </div>
              ) : (
                <button type="button" className="rg-link-btn tr-reply-btn" onClick={() => setReplying({ id: r.id, text: '' })}><Reply size={13} /> Reply</button>
              ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
