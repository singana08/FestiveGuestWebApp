import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Luggage, Users, Search } from 'lucide-react';
import api from '../utils/api';
import { LoadError } from '../components/Feedback';
import TripCard from '../components/TripCard';
import useSEO from '../hooks/useSEO';
import '../styles/Register.css';
import '../styles/PostsBoard.css';
import '../styles/Profile.css';
import '../styles/Trust.css';

const me = () => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } };

/** "My trips" for travellers, "My guests" for hosts: upcoming, requests (either way) and past stays. */
export default function Trips() {
  const user = me();
  const isHost = (user.userType || user.role) === 'Host';
  useSEO({ title: isHost ? 'My guests' : 'My trips', noindex: true });
  const [trips, setTrips] = useState(null);
  const [failed, setFailed] = useState(false);
  const [reload, setReload] = useState(0);
  const [tab, setTab] = useState(null); // picked once the trips load

  useEffect(() => {
    let live = true;
    api.get('stays/trips').then((res) => { if (live) setTrips(res.data || []); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [reload]);

  const groups = {
    upcoming: (trips || []).filter((t) => t.stay.status === 'Confirmed' && !t.stay.ended).sort((a, b) => a.stay.startDate.localeCompare(b.stay.startDate)),
    requests: (trips || []).filter((t) => t.stay.status === 'Pending')
      .sort((a, b) => Number(b.stay.partnerId === user.userId) - Number(a.stay.partnerId === user.userId)), // waiting for me first
    past: (trips || []).filter((t) => t.stay.ended).sort((a, b) => b.stay.startDate.localeCompare(a.stay.startDate)),
  };
  const active = tab || (groups.requests.some((t) => t.stay.partnerId === user.userId) ? 'requests' : groups.upcoming.length ? 'upcoming' : groups.requests.length ? 'requests' : 'past');
  const list = groups[active];
  const empty = {
    upcoming: isHost ? 'No upcoming guests yet. When you confirm a traveller’s stay request, it shows here.' : 'No upcoming trips yet. Find a host and request a stay from your chat.',
    requests: 'No open requests.',
    past: isHost ? 'Guests you’ve hosted will show here, with a reminder to review them.' : 'Your past stays will show here, with a reminder to review your host.',
  }[active];

  return (
    <div className="pf">
      <div className="rg-aurora" aria-hidden="true"><span className="a1" /><span className="a2" /><span className="a3" /></div>
      <div className="pf-shell tp">
        <header className="tp-head">
          <h1>{isHost ? <Users size={22} /> : <Luggage size={22} />} {isHost ? 'My guests' : 'My trips'}</h1>
          <p>{isHost ? 'Travellers staying with you, requests waiting for an answer, and guests you’ve hosted.' : 'Your upcoming stays, requests you’ve sent, and places you’ve stayed.'}</p>
        </header>

        <div className="rg-seg tp-tabs" role="tablist">
          {[['upcoming', 'Upcoming'], ['requests', 'Requests'], ['past', 'Past']].map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={active === key} className={active === key ? 'is-on' : ''} onClick={() => setTab(key)}>
              {label} {groups[key].length > 0 && <span className="tp-count">{groups[key].length}</span>}
            </button>
          ))}
        </div>

        {trips === null && failed ? (
          <LoadError what="your trips" onRetry={() => { setFailed(false); setReload((n) => n + 1); }} />
        ) : trips === null ? (
          <div className="tp-list" role="status" aria-label="Loading your trips">
            {[0, 1].map((i) => (
              <div key={i} className="tc tc--ticket tp-sk" aria-hidden="true">
                <span className="pb-sk tc-stub" /><span className="pb-sk tc-pic" />
                <span className="tc-body"><span className="pb-sk pb-sk--line" /><span className="pb-sk pb-sk--line pb-sk--short" /><span className="pb-sk pb-sk--btn" /></span>
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="tp-empty">
            <p>{empty}</p>
            {!isHost && active === 'upcoming' && <Link to="/posts" className="rg-btn rg-btn-primary rg-btn-sm"><Search size={14} /> Find a host</Link>}
          </div>
        ) : (
          <div className="tp-list">
            {list.map((t) => <TripCard key={t.stay.id} trip={t} meId={user.userId} onChanged={() => setReload((n) => n + 1)} />)}
          </div>
        )}
      </div>
    </div>
  );
}
