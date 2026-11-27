import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Luggage, Users, Search, Inbox, CalendarCheck, History } from 'lucide-react';
import api from '../utils/api';
import { LoadError } from '../components/Feedback';
import TripCard from '../components/TripCard';
import useSEO from '../hooks/useSEO';
import '../styles/Register.css';
import '../styles/PostsBoard.css';
import '../styles/Profile.css';
import '../styles/Trust.css';

const me = () => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } };

/**
 * "My trips" for travellers, "My guests" for hosts: a stay’s life as three columns side by side, requests, coming up,
 * done, so nothing waits unseen behind a tab. What needs you (an answer, a review) is counted in the column’s head
 * and sits at the top of its column; an empty column says what to do next.
 */
export default function Trips() {
  const user = me();
  const isHost = (user.userType || user.role) === 'Host';
  useSEO({ title: isHost ? 'My guests' : 'My trips', noindex: true });
  const [trips, setTrips] = useState(null);
  const [failed, setFailed] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let live = true;
    api.get('stays/trips').then((res) => { if (live) setTrips(res.data || []); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [reload]);

  const groups = {
    upcoming: (trips || []).filter((t) => t.stay.status === 'Confirmed' && !t.stay.ended).sort((a, b) => a.stay.startDate.localeCompare(b.stay.startDate)),
    requests: (trips || []).filter((t) => t.stay.status === 'Pending')
      .sort((a, b) => Number(b.stay.partnerId === user.userId) - Number(a.stay.partnerId === user.userId)), // waiting for me first
    past: (trips || []).filter((t) => t.stay.ended)
      .sort((a, b) => Number(a.reviewed) - Number(b.reviewed) || b.stay.startDate.localeCompare(a.stay.startDate)), // to review first
  };
  const findLink = (label) => <Link to="/posts" className="rg-btn rg-btn-ghost rg-btn-sm"><Search size={14} /> {label}</Link>;
  const columns = [
    { key: 'requests', icon: Inbox, title: 'Requests', hint: isHost ? 'Travellers asking to stay with you' : 'Stays you’ve asked for, or hosts asking you',
      need: groups.requests.filter((t) => t.stay.partnerId === user.userId).length, needLabel: 'need you',
      empty: isHost ? 'No requests right now. Travellers looking for a stay in your areas are on Posts.' : 'No open requests.', cta: isHost && findLink('See trip requests') },
    { key: 'upcoming', icon: CalendarCheck, title: 'Coming up', hint: isHost ? 'Guests you’ve confirmed' : 'Stays your host confirmed',
      empty: isHost ? 'When you confirm a request, the stay shows here.' : 'No trips coming up. Find a host and ask for a stay from your chat.', cta: !isHost && findLink('Find a host') },
    { key: 'past', icon: History, title: isHost ? 'Hosted' : 'Past stays', hint: isHost ? 'Guests who stayed with you' : 'Places you’ve stayed',
      need: groups.past.filter((t) => !t.reviewed).length, needLabel: 'to review',
      empty: isHost ? 'Guests you’ve hosted show here, with a reminder to review them.' : 'Places you’ve stayed show here, with a reminder to review your host.' },
  ];

  return (
    <div className="pf">
      <div className="rg-aurora" aria-hidden="true"><span className="a1" /><span className="a2" /><span className="a3" /></div>
      <div className="pf-shell tp">
        <header className="tp-head">
          <h1>{isHost ? <Users size={22} /> : <Luggage size={22} />} {isHost ? 'My guests' : 'My trips'}</h1>
          <p>{isHost ? 'Every guest, from their request to your review.' : 'Every stay, from your request to your review.'}</p>
        </header>

        {trips === null && failed ? (
          <LoadError what={isHost ? 'your guests' : 'your trips'} onRetry={() => { setFailed(false); setReload((n) => n + 1); }} />
        ) : (
          <div className="tp-board">
            {columns.map(({ key, icon, title, hint, need, needLabel, empty, cta }) => { const Icon = icon; return (
              <section key={key} className="tp-col" aria-label={title}>
                <header className="tp-col-head">
                  <h2><Icon size={17} aria-hidden="true" /> {title}</h2>
                  {trips && <span className="tp-col-n">{groups[key].length}</span>}
                  {need > 0 && <span className="tp-col-need">{need} {needLabel}</span>}
                </header>
                <p className="tp-col-hint">{hint}</p>
                {trips === null ? (
                  <div className="tc tc--ticket tp-sk" role="status" aria-label="Loading">
                    <span className="pb-sk tc-stub" /><span className="pb-sk tc-pic" />
                    <span className="tc-body"><span className="pb-sk pb-sk--line" /><span className="pb-sk pb-sk--line pb-sk--short" /><span className="pb-sk pb-sk--btn" /></span>
                  </div>
                ) : groups[key].length === 0 ? (
                  <div className="tp-empty"><p>{empty}</p>{cta}</div>
                ) : groups[key].map((t) => <TripCard key={t.stay.id} trip={t} meId={user.userId} onChanged={() => setReload((n) => n + 1)} />)}
              </section>
            ); })}
          </div>
        )}
      </div>
    </div>
  );
}
