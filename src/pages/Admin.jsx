import { useState, useEffect, useMemo, useRef } from 'react';
import { Flag, Users, MapPin, Search, ShieldCheck, Ban, RotateCcw, Check, AlertTriangle, Plus, X, Phone, MessageCircle, Copy, EyeOff, Star } from 'lucide-react';
import api from '../utils/api';
import locationService from '../utils/locationService';
import ImageWithSas from '../components/ImageWithSas';
import useSEO from '../hooks/useSEO';
import '../styles/Register.css'; // the shared aurora background
import '../styles/Admin.css';

const REASONS = {
  fake_profile: 'Fake profile', harassment: 'Harassment', scam: 'Scam / asking for money',
  inappropriate: 'Inappropriate content', safety: 'Safety concern', other: 'Other',
};
const day = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const errText = (err) => err.response?.data?.message || err.message;

const StatusChip = ({ status }) => (
  <span className={`ad-chip ad-chip--${(status || 'unknown').toLowerCase()}`}>{status || 'Unknown'}</span>
);

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

  const setMemberStatus = async (userId, name, status) => {
    const verb = status === 'Suspended' ? 'Suspend' : 'Reactivate';
    const what = status === 'Suspended'
      ? `${name} will be signed out, can’t sign in or send messages, and their posts will be hidden. They’ll get an email saying their account is suspended (not who reported them).`
      : `${name} will be able to sign in and use FestiveGuest again. They’ll get an email saying their account is active.`;
    if (!window.confirm(`${verb} ${name}?\n\n${what}`)) return;
    setBusy(userId); setError('');
    try {
      await api.post(`admin/users/${encodeURIComponent(userId)}/status`, { status });
      setUsers((list) => list.map((u) => (u.userId === userId ? { ...u, status } : u)));
      setReports((list) => list.map((r) => (r.reportedUserId === userId ? { ...r, reportedStatus: status } : r)));
    } catch (err) {
      setError(`${verb} failed: ${errText(err)}`);
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
    <div className="ad">
      <div className="rg-aurora" aria-hidden="true"><span className="a1" /><span className="a2" /><span className="a3" /></div>
      <div className="ad-shell">
      <header className="ad-head">
        <div>
          <h1><ShieldCheck size={22} /> Admin</h1>
          <p>Reports, members and cities</p>
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
        {[['reports', <Flag size={15} />, 'Reports', openReports], ['members', <Users size={15} />, 'Members'], ['cities', <MapPin size={15} />, 'Cities']].map(([key, icon, label, count]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? 'is-on' : ''} onClick={() => setTab(key)}>
            {icon} {label} {count > 0 && <span className="ad-count">{count}</span>}
          </button>
        ))}
      </nav>

      {loading && tab !== 'cities' ? <p className="ad-empty">Loading…</p>
        : tab === 'reports' ? <Reports reports={reports} users={users} busy={busy} onMember={setMemberStatus} onReport={setReportStatus} onOpen={setOpenId} />
          : tab === 'members' ? <Members users={users} busy={busy} onMember={setMemberStatus} onOpen={setOpenId} />
            : <Cities />}

      {openMember && (
        <MemberDialog key={openMember.userId} member={openMember} reports={reports} busy={busy}
          onMember={setMemberStatus} onClose={() => setOpenId('')} />
      )}
      </div>
    </div>
  );
}

function MemberDialog({ member, reports, busy, onMember, onClose }) {
  const ref = useRef(null);
  const [phone, setPhone] = useState(null); // the full number, only after "View"
  const [loadingPhone, setLoadingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState(null); // photo, bio and rating — what other members see

  useEffect(() => { ref.current?.showModal(); }, []);
  useEffect(() => {
    let live = true;
    api.post('user/public-profile', { userId: member.userId })
      .then((res) => { if (live) setProfile(res.data || {}); })
      .catch(() => { if (live) setProfile({}); });
    return () => { live = false; };
  }, [member.userId]);
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

        <div className="ad-actions">
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
                  <button type="button" className="ad-btn ad-btn--danger" disabled={busy === r.reportedUserId} onClick={() => onMember(r.reportedUserId, r.reportedName, 'Suspended')}><Ban size={14} /> Suspend member</button>
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
                <td><button type="button" className="ad-name" onClick={() => onOpen(u.userId)}>{u.name}</button>{u.isVerified && <span className="ad-tick" title="Phone verified"> ✓</span>}</td>
                <td>{u.userType}</td>
                <td>{day(u.createdDate)}</td>
                <td>{u.successfulReferrals || 0}</td>
                <td><StatusChip status={u.status} /></td>
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
    if (!window.confirm(`Remove ${city}, ${state}? Members can no longer pick it.`)) return;
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

export default Admin;
