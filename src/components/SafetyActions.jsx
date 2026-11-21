import { useState } from 'react';
import { Flag, Ban, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import api from '../utils/api';
import GlassDialog from './posts/GlassDialog';
import useIsBlocked from '../hooks/useIsBlocked';

const REASONS = [
  ['fake_profile', 'Fake profile', 'Pretending to be someone else, or not a real person'],
  ['harassment', 'Harassment or abuse', 'Threats, insults, unwanted advances'],
  ['scam', 'Scam or asking for money', 'Advance payments, OTPs, bank details, suspicious links'],
  ['inappropriate', 'Inappropriate content', 'Offensive messages, photos or posts'],
  ['safety', 'Safety concern', 'Something about meeting them feels unsafe'],
  ['other', 'Something else', ''],
];

const apiMessage = (err, fallback) => err.response?.data?.message || (err.response ? fallback : 'Couldn’t reach FestiveGuest. Check your connection and try again.');

/**
 * "Report" and "Block / Unblock" for another member, with their dialogs.
 * onBlockChange(isBlocked) lets the parent react (e.g. close a chat).
 */
export default function SafetyActions({ userId, userName, context, className = '', onBlockChange }) {
  const [blocked, setBlocked] = useIsBlocked(userId);
  const [dialog, setDialog] = useState(null); // 'report' | 'block' | 'reported'
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const first = (userName || 'this member').split(' ')[0];

  const open = (which) => { setError(''); setReason(''); setDetails(''); setDialog(which); };
  const close = () => !busy && setDialog(null);

  const sendReport = async () => {
    if (!reason) { setError('Pick a reason'); return; }
    setBusy(true); setError('');
    try {
      await api.post('safety/report', { reportedUserId: userId, reason, details: details.trim(), context });
      setDialog('reported');
    } catch (err) {
      setError(apiMessage(err, 'Could not send the report. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const setBlock = async (block) => {
    setBusy(true); setError('');
    try {
      if (block) await api.post(`safety/block/${encodeURIComponent(userId)}`);
      else await api.delete(`safety/block/${encodeURIComponent(userId)}`);
      setBlocked(block);
      setDialog(null);
      onBlockChange?.(block);
    } catch (err) {
      setError(apiMessage(err, block ? 'Could not block. Please try again.' : 'Could not unblock. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  if (!userId) return null;
  return (
    <>
      <div className={`sa-actions ${className}`}>
        <button type="button" className="sa-btn" onClick={() => open('report')}><Flag size={14} /> Report</button>
        {blocked
          ? <button type="button" className="sa-btn" onClick={() => setBlock(false)} disabled={busy}><Ban size={14} /> Unblock</button>
          : <button type="button" className="sa-btn sa-btn--danger" onClick={() => open('block')} disabled={blocked === null}><Ban size={14} /> Block</button>}
      </div>

      <GlassDialog open={dialog === 'report'} onClose={close} size="md" icon={<Flag size={17} style={{ color: '#fca5a5' }} />}
        title={`Report ${first}`} subtitle="Reports are private — they won’t know it was you."
        footer={(
          <>
            <button type="button" className="rg-btn rg-btn-ghost" onClick={close} disabled={busy}>Cancel</button>
            <button type="button" className="rg-btn pb-btn-danger" onClick={sendReport} disabled={busy}>{busy ? 'Sending…' : 'Send report'}</button>
          </>
        )}>
        {error && <div className="rg-alert" role="alert"><AlertTriangle size={17} /> {error}</div>}
        <div className="sa-reasons" role="radiogroup" aria-label="Reason">
          {REASONS.map(([value, label, hint]) => (
            <button key={value} type="button" role="radio" aria-checked={reason === value} className={`sa-reason${reason === value ? ' is-on' : ''}`}
              onClick={() => { setReason(value); setError(''); }}>
              <span className="sa-radio" aria-hidden="true" />
              <span><strong>{label}</strong>{hint && <small>{hint}</small>}</span>
            </button>
          ))}
        </div>
        <div className="rg-field" style={{ marginTop: '0.9rem', marginBottom: 0 }}>
          <label className="rg-label" htmlFor="sa-details">What happened? <small>(optional)</small></label>
          <textarea id="sa-details" className="rg-input rg-textarea" rows={3} maxLength={1000} value={details}
            placeholder="Anything that helps our team understand" onChange={(e) => setDetails(e.target.value)} />
        </div>
      </GlassDialog>

      <GlassDialog open={dialog === 'reported'} onClose={() => setDialog(null)} size="sm" icon={<CheckCircle2 size={17} style={{ color: '#6ee7b7' }} />}
        title="Thanks for telling us"
        footer={(
          <>
            {!blocked && <button type="button" className="rg-btn rg-btn-ghost" onClick={() => setDialog('block')}><Ban size={15} /> Block {first}</button>}
            <button type="button" className="rg-btn rg-btn-primary" onClick={() => setDialog(null)}>Done</button>
          </>
        )}>
        <p className="rg-modal-text">Our team will review your report. If you feel unsafe right now, stop replying and block {first}. In an emergency, call <strong>112</strong>.</p>
      </GlassDialog>

      <GlassDialog open={dialog === 'block'} onClose={close} size="sm" icon={<Ban size={17} style={{ color: '#fca5a5' }} />}
        title={`Block ${first}?`}
        footer={(
          <>
            <button type="button" className="rg-btn rg-btn-ghost" onClick={close} disabled={busy}>Cancel</button>
            <button type="button" className="rg-btn pb-btn-danger" onClick={() => setBlock(true)} disabled={busy}>{busy ? 'Blocking…' : 'Block'}</button>
          </>
        )}>
        {error && <div className="rg-alert" role="alert"><AlertTriangle size={17} /> {error}</div>}
        <ul className="sa-block-list">
          <li><ShieldCheck size={15} /> {first} won’t be able to message you.</li>
          <li><ShieldCheck size={15} /> You won’t see each other’s posts or chats.</li>
          <li><ShieldCheck size={15} /> They aren’t told. You can unblock anytime from your profile.</li>
        </ul>
      </GlassDialog>
    </>
  );
}
