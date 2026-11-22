import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Flag, Users, MapPin, Search, ShieldCheck, Ban, RotateCcw, Check, AlertTriangle, Plus, X } from 'lucide-react';
import api from '../utils/api';
import locationService from '../utils/locationService';
import useSEO from '../hooks/useSEO';
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

function Admin() {
  useSEO({ title: 'Admin', noindex: true });
  const [tab, setTab] = useState('reports');
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

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
      ? `${name} will be signed out, can’t sign in or send messages, and their posts will be hidden.`
      : `${name} will be able to sign in and use FestiveGuest again.`;
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
        : tab === 'reports' ? <Reports reports={reports} busy={busy} onMember={setMemberStatus} onReport={setReportStatus} />
          : tab === 'members' ? <Members users={users} busy={busy} onMember={setMemberStatus} />
            : <Cities />}
    </div>
  );
}

function Reports({ reports, busy, onMember, onReport }) {
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
                <strong>{r.reporterName || 'A member'}</strong> reported{' '}
                <Link to={`/profile/${encodeURIComponent(r.reportedName)}`} target="_blank" rel="noopener noreferrer">{r.reportedName}</Link>{' '}
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

function Members({ users, busy, onMember }) {
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return users
      .filter((u) => (role === 'all' || u.userType === role) && (status === 'all' || u.status === status))
      .filter((u) => !term || [u.name, u.email, u.phone, u.location].some((v) => (v || '').toLowerCase().includes(term)))
      .sort((a, b) => new Date(b.createdDate || 0) - new Date(a.createdDate || 0));
  }, [users, q, role, status]);

  return (
    <section>
      <div className="ad-filters">
        <label className="ad-search"><Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone or city" aria-label="Search members" /></label>
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
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>City</th><th>Joined</th><th>Invited</th><th>Status</th><th /></tr></thead>
          <tbody>
            {list.length === 0 ? <tr><td colSpan={9} className="ad-empty">No members match.</td></tr> : list.map((u) => (
              <tr key={u.userId}>
                <td><Link to={`/profile/${encodeURIComponent(u.name)}`} target="_blank" rel="noopener noreferrer">{u.name}</Link></td>
                <td>{u.email}</td>
                <td>{u.phone ? <>{u.phone}{u.isVerified && <span className="ad-tick" title="Phone verified"> ✓</span>}</> : '—'}</td>
                <td>{u.userType}</td>
                <td>{u.location || '—'}</td>
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
