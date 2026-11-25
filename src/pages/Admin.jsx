import { useState, useEffect, useMemo, useRef, createContext, useContext } from 'react';
import { Flag, Users, MapPin, Search, ShieldCheck, ShieldOff, Ban, RotateCcw, Check, AlertTriangle, Plus, X, Phone, MessageCircle, Copy, EyeOff, Star, Megaphone, ImagePlus } from 'lucide-react';
import api from '../utils/api';
import locationService from '../utils/locationService';
import { toJpeg, putJpeg } from '../utils/image';
import ImageWithSas from '../components/ImageWithSas';
import { VERIFY_HOW } from '../components/posts/postUtils';
import useSEO from '../hooks/useSEO';
import '../styles/Register.css'; // the shared aurora background
import '../styles/Admin.css';

const REASONS = {
  fake_profile: 'Fake profile', harassment: 'Harassment', scam: 'Scam / asking for money',
  inappropriate: 'Inappropriate content', safety: 'Safety concern', other: 'Other',
};
const day = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const errText = (err) => err.response?.data?.message || err.message;

const StatusChip = ({ status, why }) => (
  <span className={`ad-chip ad-chip--${(status || 'unknown').toLowerCase()}`} title={why}>{status || 'Unknown'}</span>
);
const suspendedWhy = (u) => (u.status === 'Suspended' && u.suspendedReason ? `Suspended for ${REASONS[u.suspendedReason] || u.suspendedReason}` : undefined);

// Every "are you sure?" on this page goes through one styled dialog (the browser's confirm box can't be themed).
const AskContext = createContext(async () => null);
const useAsk = () => useContext(AskContext);

/**
 * The confirm dialog. With `reasons` it also asks why (required) and for a private note, and resolves to
 * { reason, note }; otherwise it resolves to true. Cancel, Esc or a click outside resolve to null.
 */
function ConfirmDialog({ req, onDone }) {
  const ref = useRef(null);
  const done = useRef(false);
  const [reason, setReason] = useState(req.reasons?.[req.reason] ? req.reason : '');
  const [note, setNote] = useState('');
  useEffect(() => { ref.current?.showModal(); }, []);
  const finish = (value) => {
    if (done.current) return;
    done.current = true;
    ref.current?.close();
    onDone(value);
  };
  const submit = (e) => {
    e.preventDefault();
    if (req.reasons && !reason) return;
    finish(req.reasons ? { reason, note: note.trim() } : true);
  };
  return (
    <dialog ref={ref} className="ad-dialog ad-confirm" aria-labelledby="ad-confirm-title" onClose={() => finish(null)}
      onClick={(e) => { if (e.target === ref.current) finish(null); }}>
      <form className="ad-confirm-body" onSubmit={submit}>
        <div className="ad-confirm-head">
          <span className={`ad-confirm-icon${req.danger ? ' is-danger' : ''}`} aria-hidden="true">{req.icon || <AlertTriangle size={20} />}</span>
          <h2 id="ad-confirm-title">{req.title}</h2>
        </div>
        {req.text && <p className="ad-confirm-text">{req.text}</p>}
        {req.reasons && (
          <>
            <fieldset className={`ad-confirm-reasons${req.danger ? '' : ' is-calm'}`}>
              <legend>{req.pickLabel || 'Reason'} <span>{req.pickHint ?? '— we tell them this, never who reported them'}</span></legend>
              {Object.entries(req.reasons).map(([key, label]) => (
                <label key={key} className={reason === key ? 'is-on' : undefined}>
                  <input type="radio" name="ad-confirm-reason" value={key} checked={reason === key} onChange={() => setReason(key)} />{label}
                </label>
              ))}
            </fieldset>
            <label className="ad-confirm-note">
              <span>Note for admins <small>(optional · never shown to them)</small></span>
              <textarea rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened, what you checked…" />
            </label>
          </>
        )}
        <div className="ad-confirm-actions">
          {!req.noCancel && <button type="button" className="ad-btn" onClick={() => finish(null)}>Cancel</button>}
          <button type="submit" className={`ad-btn ${req.danger ? 'ad-btn--danger-solid' : 'ad-btn--primary'}`} disabled={!!req.reasons && !reason}>{req.confirmLabel || 'OK'}</button>
        </div>
      </form>
    </dialog>
  );
}

const PHONE_SHOWN_FOR = 60_000; // the full number hides itself again after a minute
const waNumber = (phone) => { const d = (phone || '').replace(/\D/g, ''); return d.length === 10 ? `91${d}` : d; };
const spaced = (phone) => (/^\d{10}$/.test(phone) ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}` : phone);

/** A name that opens the member popup (plain text if the member no longer exists). */
const MemberName = ({ id, name, users, onOpen }) => (users.some((u) => u.userId === id)
  ? <button type="button" className="ad-name" onClick={() => onOpen(id)}>{name}</button>
  : <strong>{name || 'A member'}</strong>);

function Admin() {
  useSEO({ title: 'Admin', noindex: true });
  const [tab, setTab] = useState('reports');
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [openId, setOpenId] = useState('');
  const openMember = users.find((u) => u.userId === openId);
  const [asking, setAsking] = useState(null);
  const ask = (opts) => new Promise((resolve) => setAsking({ ...opts, resolve }));

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [u, r] = await Promise.all([api.get('admin/users'), api.get('admin/reports')]);
      setUsers(u.data || []); setReports(r.data || []);
    } catch (err) {
      setError(`Couldn’t load admin data: ${errText(err)}`);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  // presetReason: when suspending from a report, that report's reason is picked already.
  const setMemberStatus = async (userId, name, status, presetReason) => {
    const suspending = status === 'Suspended';
    const verb = suspending ? 'Suspend' : 'Reactivate';
    const answer = await ask(suspending
      ? {
        title: `Suspend ${name}?`, danger: true, icon: <Ban size={20} />, confirmLabel: 'Suspend', reasons: REASONS, reason: presetReason,
        text: 'They’ll be signed out, can’t sign in or send messages, and their posts will be hidden. We’ll email them that their account is suspended, and why.',
      }
      : {
        title: `Reactivate ${name}?`, icon: <RotateCcw size={20} />, confirmLabel: 'Reactivate',
        text: 'They’ll be able to sign in and use FestiveGuest again. We’ll email them that their account is active.',
      });
    if (!answer) return;
    setBusy(userId); setError('');
    try {
      await api.post(`admin/users/${encodeURIComponent(userId)}/status`, suspending ? { status, reason: answer.reason, note: answer.note } : { status });
      const why = suspending
        ? { suspendedReason: answer.reason, suspendedNote: answer.note, suspendedAt: new Date().toISOString() }
        : { suspendedReason: '', suspendedNote: '', suspendedAt: null };
      setUsers((list) => list.map((u) => (u.userId === userId ? { ...u, status, ...why } : u)));
      setReports((list) => list.map((r) => (r.reportedUserId === userId ? { ...r, reportedStatus: status } : r)));
    } catch (err) {
      setError(`${verb} failed: ${errText(err)}`);
    } finally {
      setBusy('');
    }
  };

  // "Verified by FestiveGuest": say how you checked them (and a private note); members see the shield.
  const setTrust = async (member, verified) => {
    const answer = await ask(verified
      ? {
        title: `Verify ${member.name}?`, icon: <ShieldCheck size={20} />, confirmLabel: 'Mark as verified', reasons: VERIFY_HOW,
        pickLabel: 'How did you check?', pickHint: '— members see this next to the badge',
        text: 'They get the “Verified by FestiveGuest” shield on their posts and profile. Only do this once you’ve checked who they are.',
      }
      : {
        title: `Remove ${member.name}’s verification?`, icon: <ShieldOff size={20} />, danger: true, confirmLabel: 'Remove',
        text: 'The “Verified by FestiveGuest” shield disappears from their posts and profile.',
      });
    if (!answer) return;
    setBusy(member.userId); setError('');
    try {
      const res = await api.post(`admin/users/${encodeURIComponent(member.userId)}/verify`,
        verified ? { verified: true, how: answer.reason, note: answer.note } : { verified: false });
      setUsers((list) => list.map((u) => (u.userId === member.userId ? {
        ...u, adminVerified: verified, adminVerifiedHow: verified ? answer.reason : '', adminVerifiedNote: verified ? answer.note : '',
        adminVerifiedAt: verified ? (res.data?.adminVerifiedAt || new Date().toISOString()) : null,
      } : u)));
    } catch (err) {
      setError(`${verified ? 'Verifying' : 'Removing the verification'} failed: ${errText(err)}`);
    } finally {
      setBusy('');
    }
  };

  const setReportStatus = async (id, status) => {
    setBusy(id); setError('');
    try {
      await api.post(`admin/reports/${encodeURIComponent(id)}/status`, { status });
      setReports((list) => list.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (err) {
      setError(`Couldn’t update the report: ${errText(err)}`);
    } finally {
      setBusy('');
    }
  };

  const openReports = reports.filter((r) => r.status !== 'Resolved').length;
  const stats = [
    ['Members', users.length], ['Hosts', users.filter((u) => u.userType === 'Host').length],
    ['Guests', users.filter((u) => u.userType === 'Guest').length], ['Verified phones', users.filter((u) => u.isVerified).length],
    ['Suspended', users.filter((u) => u.status === 'Suspended').length], ['Open reports', openReports],
  ];

  return (
    <AskContext.Provider value={ask}>
    <div className="ad">
      <div className="rg-aurora" aria-hidden="true"><span className="a1" /><span className="a2" /><span className="a3" /></div>
      <div className="ad-shell">
      <header className="ad-head">
        <div>
          <h1><ShieldCheck size={22} /> Admin</h1>
          <p>Reports, members, cities and sponsored cards</p>
        </div>
        <button type="button" className="ad-btn" onClick={load} disabled={loading}><RotateCcw size={14} /> Refresh</button>
      </header>

      {error && <div className="ad-alert" role="alert"><AlertTriangle size={16} /> {error}</div>}

      <div className="ad-stats">
        {stats.map(([label, value]) => (
          <div key={label} className={`ad-stat${label === 'Open reports' && value > 0 ? ' is-hot' : ''}`}><strong>{loading ? '…' : value}</strong><span>{label}</span></div>
        ))}
      </div>

      <nav className="ad-tabs" role="tablist">
        {[['reports', <Flag size={15} />, 'Reports', openReports], ['members', <Users size={15} />, 'Members'], ['cities', <MapPin size={15} />, 'Cities'], ['sponsored', <Megaphone size={15} />, 'Sponsored']].map(([key, icon, label, count]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? 'is-on' : ''} onClick={() => setTab(key)}>
            {icon} {label} {count > 0 && <span className="ad-count">{count}</span>}
          </button>
        ))}
      </nav>

      {loading && (tab === 'reports' || tab === 'members') ? <p className="ad-empty">Loading…</p>
        : tab === 'reports' ? <Reports reports={reports} users={users} busy={busy} onMember={setMemberStatus} onReport={setReportStatus} onOpen={setOpenId} />
          : tab === 'members' ? <Members users={users} busy={busy} onMember={setMemberStatus} onOpen={setOpenId} />
            : tab === 'cities' ? <Cities /> : <Sponsored />}

      {openMember && (
        <MemberDialog key={openMember.userId} member={openMember} reports={reports} busy={busy}
          onMember={setMemberStatus} onVerify={setTrust} onClose={() => setOpenId('')} />
      )}
      {asking && <ConfirmDialog req={asking} onDone={(value) => { asking.resolve(value); setAsking(null); }} />}
      </div>
    </div>
    </AskContext.Provider>
  );
}

function MemberDialog({ member, reports, busy, onMember, onVerify, onClose }) {
  const ref = useRef(null);
  const [phone, setPhone] = useState(null); // the full number, only after "View"
  const [loadingPhone, setLoadingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState(null); // photo, bio, gallery and rating — what other members see
  const [memberReviews, setMemberReviews] = useState(null); // about and by them, including hidden ones

  useEffect(() => { ref.current?.showModal(); }, []);
  useEffect(() => {
    let live = true;
    api.post('user/public-profile', { userId: member.userId })
      .then((res) => { if (live) setProfile(res.data || {}); })
      .catch(() => { if (live) setProfile({}); });
    api.get(`admin/users/${encodeURIComponent(member.userId)}/reviews`)
      .then((res) => { if (live) setMemberReviews(res.data); })
      .catch(() => { if (live) setMemberReviews({ about: [], by: [] }); });
    return () => { live = false; };
  }, [member.userId]);

  const ask = useAsk();
  const failed = (title, err) => ask({ title, text: errText(err), confirmLabel: 'OK', noCancel: true });
  const removePhoto = async (photo, n) => {
    if (!await ask({ title: `Remove photo ${n}?`, text: `It’s deleted from ${member.name}’s gallery.`, danger: true, confirmLabel: 'Remove' })) return;
    try {
      await api.delete(`admin/users/${encodeURIComponent(member.userId)}/gallery/${encodeURIComponent(photo.id)}`);
      setProfile((p) => ({ ...p, gallery: p.gallery.filter((x) => x.id !== photo.id) }));
    } catch (err) { failed('Couldn’t remove the photo', err); }
  };
  const removeReview = async (review) => {
    if (!await ask({ title: `Remove ${review.reviewerName}’s review?`, text: `The ${review.rating}-star review is deleted.`, danger: true, confirmLabel: 'Remove' })) return;
    try {
      await api.delete(`admin/reviews/${encodeURIComponent(review.revieweeId)}/${encodeURIComponent(review.id)}`);
      const keep = (r) => r.id !== review.id;
      setMemberReviews((m) => ({ about: (m.about || []).filter(keep), by: (m.by || []).filter(keep) }));
    } catch (err) { failed('Couldn’t remove the review', err); }
  };
  const allReviews = [...(memberReviews?.about || []).map((r) => ({ ...r, about: true })), ...(memberReviews?.by || [])];
  useEffect(() => {
    if (!phone) return undefined;
    const timer = setTimeout(() => setPhone(null), PHONE_SHOWN_FOR);
    return () => clearTimeout(timer);
  }, [phone]);

  const viewPhone = async () => {
    setLoadingPhone(true); setPhoneError('');
    try {
      const res = await api.get(`admin/users/${encodeURIComponent(member.userId)}/phone`);
      if (res.data.phone) setPhone(res.data.phone);
      else setPhoneError('No phone number on this account.');
    } catch (err) {
      setPhoneError(`Couldn’t load the number: ${errText(err)}`);
    } finally {
      setLoadingPhone(false);
    }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(phone); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ }
  };

  const about = reports.filter((r) => r.reportedUserId === member.userId);
  const made = reports.filter((r) => r.reporterId === member.userId).length;
  const waText = `Hi ${member.name}, this is the FestiveGuest team. `;

  return (
    // Native modal: focus is trapped and Esc closes it. Clicking the dimmed backdrop closes it too.
    <dialog ref={ref} className="ad-dialog" aria-labelledby="ad-member-name" onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) ref.current.close(); }}>
      <header className="ad-dialog-head">
        {profile?.profileImageUrl
          ? <ImageWithSas src={profile.profileImageUrl} alt="" className="ad-avatar" fallbackText={member.name?.charAt(0) || '?'} />
          : <span className="ad-avatar ad-avatar--initial" aria-hidden="true">{member.name?.charAt(0) || '?'}</span>}
        <div className="ad-dialog-title">
          <h2 id="ad-member-name">{member.name}</h2>
          <p className="ad-muted">{member.userType} · joined {day(member.createdDate)} · <StatusChip status={member.status} /></p>
          {member.status === 'Suspended' && member.suspendedReason && (
            <p className="ad-suspended-why">
              <Ban size={13} aria-hidden="true" /> Suspended{member.suspendedAt ? ` on ${day(member.suspendedAt)}` : ''} for <strong>{REASONS[member.suspendedReason] || member.suspendedReason}</strong>
              {member.suspendedNote && <span> · “{member.suspendedNote}”</span>}
            </p>
          )}
          {member.adminVerified && (
            <p className="ad-trust-why">
              <ShieldCheck size={13} aria-hidden="true" /> Verified by FestiveGuest{member.adminVerifiedAt ? ` on ${day(member.adminVerifiedAt)}` : ''} · <strong>{VERIFY_HOW[member.adminVerifiedHow] || member.adminVerifiedHow}</strong>
              {member.adminVerifiedNote && <span> · “{member.adminVerifiedNote}”</span>}
            </p>
          )}
        </div>
        <button type="button" className="ad-x" onClick={() => ref.current.close()} aria-label="Close"><X size={18} /></button>
      </header>

      <div className="ad-dialog-body">
        {profile === null ? <p className="ad-muted">Loading profile…</p> : (
          <div className="ad-bio">
            {profile.bio ? <p>“{profile.bio}”</p> : <p className="ad-muted">No bio yet.</p>}
            {profile.totalReviews > 0 && (
              <p className="ad-rating"><Star size={13} /> {Number(profile.averageRating).toFixed(1)} · {profile.totalReviews} review{profile.totalReviews > 1 ? 's' : ''}</p>
            )}
          </div>
        )}
        <dl className="ad-facts">
          <dt>Email</dt><dd>{member.email || '—'}</dd>
          <dt>City</dt><dd>{member.location || '—'}</dd>
          <dt>Phone</dt><dd>{member.isVerified ? <span className="ad-tick">Verified ✓</span> : 'Not verified'}</dd>
          <dt>Invited</dt><dd>{member.successfulReferrals || 0} joined{member.referralCode && <span className="ad-muted"> · code {member.referralCode}</span>}</dd>
        </dl>

        <div className="ad-phone">
          {phone ? (
            <>
              <strong aria-live="polite">{spaced(phone)}</strong>
              <a className="ad-btn ad-btn--sm ad-btn--wa" href={`https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} /> WhatsApp</a>
              <a className="ad-btn ad-btn--sm" href={`tel:+${waNumber(phone)}`}><Phone size={14} /> Call</a>
              <button type="button" className="ad-btn ad-btn--sm" onClick={copy}><Copy size={14} /> {copied ? 'Copied' : 'Copy'}</button>
              <button type="button" className="ad-btn ad-btn--sm" onClick={() => setPhone(null)}><EyeOff size={14} /> Hide</button>
              <p className="ad-muted ad-phone-note">Hides again after a minute. Each view is recorded.</p>
            </>
          ) : (
            <>
              <strong>{member.maskedPhone ? `+91 ${member.maskedPhone}` : 'No phone number'}</strong>
              {member.maskedPhone && (
                <button type="button" className="ad-btn ad-btn--sm ad-btn--primary" onClick={viewPhone} disabled={loadingPhone}>
                  <Phone size={14} /> {loadingPhone ? 'Loading…' : 'View number'}
                </button>
              )}
              {phoneError && <p className="ad-phone-note ad-error" role="alert">{phoneError}</p>}
            </>
          )}
        </div>

        <section>
          <h3 className="ad-subhead">Reports about {member.name} {about.length > 0 && <span className="ad-count">{about.length}</span>}</h3>
          {about.length === 0 ? <p className="ad-muted">None.</p> : (
            <ul className="ad-mini">
              {about.map((r) => (
                <li key={r.id}><strong>{REASONS[r.reason] || r.reason}</strong> · {day(r.createdAt)} · by {r.reporterName || 'a member'}{r.status === 'Resolved' && ' · resolved'}</li>
              ))}
            </ul>
          )}
          {made > 0 && <p className="ad-muted">{member.name} has made {made} report{made > 1 ? 's' : ''}.</p>}
        </section>

        {profile?.gallery?.length > 0 && (
          <section>
            <h3 className="ad-subhead">Photos of their place <span className="ad-count">{profile.gallery.length}</span></h3>
            <ul className="ad-photos">
              {profile.gallery.map((p, i) => (
                <li key={p.id}>
                  <a href={p.url} target="_blank" rel="noopener noreferrer"><img src={p.url} alt={p.caption || `Photo ${i + 1}`} /></a>
                  <button type="button" className="ad-photo-x" onClick={() => removePhoto(p, i + 1)} aria-label={`Remove photo ${i + 1}`}><X size={13} /></button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {allReviews.length > 0 && (
          <section>
            <h3 className="ad-subhead">Reviews about and by {member.name}</h3>
            <ul className="ad-mini">
              {allReviews.map((r) => (
                <li key={`${r.revieweeId}-${r.id}`} className="ad-review">
                  <span><strong>{'★'.repeat(r.rating)}</strong> {r.about ? `from ${r.reviewerName}` : `written by ${member.name}`}{!r.visible && <em className="ad-muted"> · {r.legacy ? 'hidden: written before Confirm stay' : 'not published yet'}</em>}</span>
                  <span className="ad-review-text">“{r.comment}”</span>
                  <button type="button" className="ad-btn ad-btn--sm ad-btn--danger" onClick={() => removeReview(r)}>Remove</button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="ad-actions">
          {member.adminVerified
            ? <button type="button" className="ad-btn" disabled={busy === member.userId} onClick={() => onVerify(member, false)}><ShieldOff size={14} /> Remove verification</button>
            : <button type="button" className="ad-btn ad-btn--trust" disabled={busy === member.userId} onClick={() => onVerify(member, true)}><ShieldCheck size={14} /> Mark as verified</button>}
          {member.userType !== 'Admin' && (member.status === 'Suspended'
            ? <button type="button" className="ad-btn" disabled={busy === member.userId} onClick={() => onMember(member.userId, member.name, 'Active')}><RotateCcw size={14} /> Reactivate</button>
            : <button type="button" className="ad-btn ad-btn--danger" disabled={busy === member.userId} onClick={() => onMember(member.userId, member.name, 'Suspended')}><Ban size={14} /> Suspend</button>)}
        </div>
      </div>
    </dialog>
  );
}

function Reports({ reports, users, busy, onMember, onReport, onOpen }) {
  const [show, setShow] = useState('Open');
  const list = reports.filter((r) => show === 'All' || (show === 'Open' ? r.status !== 'Resolved' : r.status === 'Resolved'));

  return (
    <section>
      <div className="ad-seg">
        {['Open', 'Resolved', 'All'].map((s) => <button key={s} type="button" className={show === s ? 'is-on' : ''} onClick={() => setShow(s)}>{s}</button>)}
      </div>
      {list.length === 0 ? <p className="ad-empty">{show === 'Open' ? 'No open reports. 🎉' : 'Nothing here.'}</p> : (
        <ul className="ad-reports">
          {list.map((r) => (
            <li key={r.id} className={r.status === 'Resolved' ? 'is-done' : ''}>
              <div className="ad-report-top">
                <span className="ad-reason">{REASONS[r.reason] || r.reason}</span>
                <span className="ad-muted">{day(r.createdAt)}{r.context && ` · from ${r.context}`}</span>
                {r.status === 'Resolved' && <span className="ad-chip ad-chip--resolved">Resolved</span>}
              </div>
              <p className="ad-who">
                <MemberName id={r.reporterId} name={r.reporterName} users={users} onOpen={onOpen} /> reported{' '}
                <MemberName id={r.reportedUserId} name={r.reportedName} users={users} onOpen={onOpen} />{' '}
                <StatusChip status={r.reportedStatus} />
              </p>
              {r.details ? <p className="ad-details">“{r.details}”</p> : <p className="ad-muted">No details given.</p>}
              <div className="ad-actions">
                {r.reportedStatus === 'Active' && (
                  <button type="button" className="ad-btn ad-btn--danger" disabled={busy === r.reportedUserId} onClick={() => onMember(r.reportedUserId, r.reportedName, 'Suspended', r.reason)}><Ban size={14} /> Suspend member</button>
                )}
                {r.reportedStatus === 'Suspended' && (
                  <button type="button" className="ad-btn" disabled={busy === r.reportedUserId} onClick={() => onMember(r.reportedUserId, r.reportedName, 'Active')}><RotateCcw size={14} /> Reactivate</button>
                )}
                {r.status === 'Resolved'
                  ? <button type="button" className="ad-btn" disabled={busy === r.id} onClick={() => onReport(r.id, 'Open')}>Reopen</button>
                  : <button type="button" className="ad-btn ad-btn--primary" disabled={busy === r.id} onClick={() => onReport(r.id, 'Resolved')}><Check size={14} /> Mark resolved</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Members({ users, busy, onMember, onOpen }) {
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return users
      .filter((u) => (role === 'all' || u.userType === role) && (status === 'all' || u.status === status))
      .filter((u) => !term || [u.name, u.email, u.location].some((v) => (v || '').toLowerCase().includes(term)))
      .sort((a, b) => new Date(b.createdDate || 0) - new Date(a.createdDate || 0));
  }, [users, q, role, status]);

  return (
    <section>
      <div className="ad-filters">
        <label className="ad-search"><Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or city" aria-label="Search members" /></label>
        <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role">
          <option value="all">All roles</option><option value="Guest">Guests</option><option value="Host">Hosts</option><option value="Admin">Admins</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="all">Any status</option><option value="Active">Active</option><option value="Suspended">Suspended</option>
        </select>
        <span className="ad-muted">{list.length} shown</span>
      </div>
      <div className="ad-table-wrap">
        <table className="ad-table">
          {/* Only what's needed to scan the list — contact details live in the member popup. */}
          <thead><tr><th>Name</th><th>Role</th><th>Joined</th><th>Invited</th><th>Status</th><th aria-label="Actions" /></tr></thead>
          <tbody>
            {list.length === 0 ? <tr><td colSpan={6} className="ad-empty">No members match.</td></tr> : list.map((u) => (
              <tr key={u.userId}>
                <td><button type="button" className="ad-name" onClick={() => onOpen(u.userId)}>{u.name}</button>{u.isVerified && <span className="ad-tick" title="Phone verified"> ✓</span>}{u.adminVerified && <span className="ad-shield" title={`Verified by FestiveGuest · ${VERIFY_HOW[u.adminVerifiedHow] || ""}`}><ShieldCheck size={12} /></span>}</td>
                <td>{u.userType}</td>
                <td>{day(u.createdDate)}</td>
                <td>{u.successfulReferrals || 0}</td>
                <td><StatusChip status={u.status} why={suspendedWhy(u)} /></td>
                <td>
                  {u.userType !== 'Admin' && (u.status === 'Suspended'
                    ? <button type="button" className="ad-btn ad-btn--sm" disabled={busy === u.userId} onClick={() => onMember(u.userId, u.name, 'Active')}>Reactivate</button>
                    : <button type="button" className="ad-btn ad-btn--sm ad-btn--danger" disabled={busy === u.userId} onClick={() => onMember(u.userId, u.name, 'Suspended')}>Suspend</button>)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Cities() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState('');
  const [newCity, setNewCity] = useState('');
  const ask = useAsk();

  const load = async () => {
    setLoading(true); setError('');
    locationService.clearCache(); // so city pickers elsewhere in this session see the change
    try { setData((await api.get('location/states-with-cities')).data || {}); }
    catch (err) { setError(`Couldn’t load cities: ${errText(err)}`); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const add = async (state) => {
    if (!newCity.trim()) return;
    try { await api.post('location/add', { state, city: newCity.trim() }); setNewCity(''); load(); }
    catch (err) { setError(`Couldn’t add the city: ${errText(err)}`); }
  };
  const remove = async (state, city) => {
    if (!await ask({ title: `Remove ${city}?`, text: `Members can no longer pick ${city}, ${state}.`, danger: true, confirmLabel: 'Remove' })) return;
    try { await api.delete(`location/delete?state=${encodeURIComponent(state)}&city=${encodeURIComponent(city)}`); load(); }
    catch (err) { setError(`Couldn’t remove the city: ${errText(err)}`); }
  };

  if (loading) return <p className="ad-empty">Loading…</p>;
  return (
    <section>
      {error && <div className="ad-alert" role="alert"><AlertTriangle size={16} /> {error}</div>}
      <ul className="ad-states">
        {Object.keys(data).sort().map((state) => (
          <li key={state}>
            <button type="button" className="ad-state" aria-expanded={open === state} onClick={() => { setOpen(open === state ? '' : state); setNewCity(''); }}>
              <span>{state}</span><span className="ad-muted">{data[state].length} cities</span>
            </button>
            {open === state && (
              <div className="ad-cities">
                {[...data[state]].sort().map((city) => (
                  <span key={city} className="ad-city">{city}<button type="button" onClick={() => remove(state, city)} aria-label={`Remove ${city}`}><X size={13} /></button></span>
                ))}
                <form className="ad-add" onSubmit={(e) => { e.preventDefault(); add(state); }}>
                  <input value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="New city" aria-label={`New city in ${state}`} />
                  <button type="submit" className="ad-btn ad-btn--primary ad-btn--sm" disabled={!newCity.trim()}><Plus size={13} /> Add</button>
                </form>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── Sponsored cards ──
const isoDay = (d) => (d ? String(d).slice(0, 10) : '');
const inDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const cardBody = (s) => ({ title: s.title, text: s.text, link: s.link, imageId: s.imageId, cities: s.cities, startDate: isoDay(s.startDate), endDate: isoDay(s.endDate), paused: s.paused });

function Sponsored() {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // {} = new card
  const ask = useAsk();

  const load = () => api.get('sponsored/admin')
    .then((r) => { setList(r.data || []); setError(''); })
    .catch((err) => { setList((l) => l || []); setError(`Couldn’t load sponsored cards: ${errText(err)}`); });
  useEffect(() => { load(); }, []);

  const togglePause = async (s) => {
    try { await api.put(`sponsored/admin/${encodeURIComponent(s.id)}`, { ...cardBody(s), paused: !s.paused }); load(); }
    catch (err) { setError(`Couldn’t update “${s.title}”: ${errText(err)}`); }
  };
  const remove = async (s) => {
    if (!await ask({ title: `Delete “${s.title}”?`, text: 'Its image and view / click counts are deleted too. To stop it for now, use Pause instead.', danger: true, confirmLabel: 'Delete' })) return;
    try { await api.delete(`sponsored/admin/${encodeURIComponent(s.id)}`); setList((l) => l.filter((x) => x.id !== s.id)); }
    catch (err) { setError(`Couldn’t delete “${s.title}”: ${errText(err)}`); }
  };

  if (!list) return <p className="ad-empty">Loading…</p>;
  return (
    <section>
      {error && <div className="ad-alert" role="alert"><AlertTriangle size={16} /> {error}</div>}
      <div className="ad-filters">
        <span className="ad-muted ad-grow">Shown on Posts to members in the cities you pick, labelled “Sponsored”. Never in chats, profiles, reviews or stay requests. Views and clicks are totals only.</span>
        <button type="button" className="ad-btn ad-btn--primary" onClick={() => setEditing({})}><Plus size={14} /> New card</button>
      </div>
      {list.length === 0 ? <p className="ad-empty">No sponsored cards yet.</p> : (
        <ul className="ad-sp-list">
          {list.map((s) => (
            <li key={s.id} className="ad-sp">
              <img src={s.imageUrl} alt="" />
              <div className="ad-sp-info">
                <strong>{s.title} <span className={`ad-chip ad-chip--${s.state.toLowerCase()}`}>{s.state}</span></strong>
                <span className="ad-muted">{s.cities.length ? s.cities.join(', ') : 'Every city'} · {day(s.startDate)} – {day(s.endDate)}</span>
                <span className="ad-muted">{s.views} views · {s.clicks} clicks{s.views > 0 ? ` · ${((s.clicks * 100) / s.views).toFixed(1)}% clicked` : ''}</span>
              </div>
              <div className="ad-actions">
                <button type="button" className="ad-btn ad-btn--sm" onClick={() => setEditing(s)}>Edit</button>
                <button type="button" className="ad-btn ad-btn--sm" onClick={() => togglePause(s)}>{s.paused ? 'Resume' : 'Pause'}</button>
                <button type="button" className="ad-btn ad-btn--sm ad-btn--danger" onClick={() => remove(s)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && <SponsoredDialog key={editing.id || 'new'} card={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </section>
  );
}

function SponsoredDialog({ card, onClose, onSaved }) {
  const ref = useRef(null);
  const [f, setF] = useState({
    title: card.title || '', text: card.text || '', link: card.link || 'https://', cities: card.cities || [],
    startDate: isoDay(card.startDate) || inDays(0), endDate: isoDay(card.endDate) || inDays(30), paused: !!card.paused,
  });
  const [image, setImage] = useState({ id: card.imageId || '', url: card.imageUrl || '' });
  const [cityOptions, setCityOptions] = useState([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const set = (key) => (e) => setF((x) => ({ ...x, [key]: e.target.value }));

  useEffect(() => { ref.current?.showModal(); }, []);
  useEffect(() => {
    locationService.getLocations()
      .then((d) => setCityOptions([...new Set(Object.values(d || {}).flat())].filter((ci) => ci && ci !== 'Other').sort()))
      .catch(() => {});
  }, []);

  // ponytail: an image uploaded and then abandoned (Cancel) stays in storage; sweep the "sponsored" container if it ever matters.
  const pickImage = async (file) => {
    if (!file) return;
    setBusy('image'); setError('');
    try {
      const jpeg = await toJpeg(file, 1200, 0.82);
      const { data } = await api.post('sponsored/admin/upload-url');
      await putJpeg(data.uploadUrl, jpeg);
      setImage({ id: data.imageId, url: URL.createObjectURL(jpeg) });
    } catch (err) { setError(`Couldn’t upload the image: ${errText(err)}`); }
    finally { setBusy(''); }
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy('save'); setError('');
    try {
      const body = { ...f, imageId: image.id };
      if (card.id) await api.put(`sponsored/admin/${encodeURIComponent(card.id)}`, body);
      else await api.post('sponsored/admin', body);
      onSaved();
    } catch (err) { setError(errText(err)); setBusy(''); }
  };

  return (
    <dialog ref={ref} className="ad-dialog" aria-labelledby="ad-sp-title" onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) ref.current.close(); }}>
      <header className="ad-dialog-head">
        <div className="ad-dialog-title"><h2 id="ad-sp-title">{card.id ? 'Edit sponsored card' : 'New sponsored card'}</h2></div>
        <button type="button" className="ad-x" onClick={() => ref.current.close()} aria-label="Close"><X size={18} /></button>
      </header>
      <form className="ad-dialog-body ad-form" onSubmit={save}>
        <label className="ad-sp-img">
          {image.url ? <img src={image.url} alt="Card image" /> : <span><ImagePlus size={22} /> {busy === 'image' ? 'Uploading…' : 'Add an image (wide works best)'}</span>}
          <input type="file" accept="image/*" aria-label="Card image" disabled={busy === 'image'} onChange={(e) => pickImage(e.target.files?.[0])} />
        </label>
        <label>Title<input value={f.title} onChange={set('title')} maxLength={60} required /></label>
        <label><span>Text <span className="ad-muted">(optional, {160 - f.text.length} left)</span></span><textarea value={f.text} onChange={set('text')} maxLength={160} /></label>
        <label>Link<input type="url" value={f.link} onChange={set('link')} placeholder="https://" pattern="https://.+" required /></label>
        <div className="ad-form-row">
          <label>Starts<input type="date" value={f.startDate} onChange={set('startDate')} required /></label>
          <label>Ends<input type="date" value={f.endDate} min={f.startDate} onChange={set('endDate')} required /></label>
        </div>
        <div className="ad-form-cities">
          <label><span>Cities <span className="ad-muted">(none = every city)</span></span>
            <select value="" onChange={(e) => e.target.value && setF((x) => ({ ...x, cities: [...x.cities, e.target.value] }))}>
              <option value="">Add a city…</option>
              {cityOptions.filter((ci) => !f.cities.includes(ci)).map((ci) => <option key={ci} value={ci}>{ci}</option>)}
            </select>
          </label>
          {f.cities.length > 0 && (
            <div className="ad-cities">
              {f.cities.map((ci) => (
                <span key={ci} className="ad-city">{ci}<button type="button" onClick={() => setF((x) => ({ ...x, cities: x.cities.filter((y) => y !== ci) }))} aria-label={`Remove ${ci}`}><X size={13} /></button></span>
              ))}
            </div>
          )}
        </div>
        {error && <div className="ad-alert" role="alert"><AlertTriangle size={16} /> {error}</div>}
        <div className="ad-actions">
          <button type="submit" className="ad-btn ad-btn--primary" disabled={!!busy || !image.id}>{busy === 'save' ? 'Saving…' : card.id ? 'Save changes' : 'Add card'}</button>
          <button type="button" className="ad-btn" onClick={() => ref.current.close()}>Cancel</button>
        </div>
      </form>
    </dialog>
  );
}

export default Admin;
