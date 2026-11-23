import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck } from 'lucide-react';
import api from '../utils/api';
import { daysUntil } from '../utils/stays';
import TripCard from './TripCard';
import '../styles/Trust.css';

/**
 * The top-of-page reminder: requests waiting for your answer, and your next confirmed stay
 * when it's within 14 days (or happening now). Shows nothing when there's nothing to say.
 */
export default function UpcomingTrip({ meId, isHost }) {
  const [trips, setTrips] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let live = true;
    api.get('stays/trips').then((res) => { if (live) setTrips(res.data || []); }).catch(() => { if (live) setTrips([]); });
    return () => { live = false; };
  }, [reload]);

  if (!trips?.length) return null;
  const waiting = trips.filter((t) => t.stay.status === 'Pending' && t.stay.partnerId === meId);
  const next = trips
    .filter((t) => t.stay.status === 'Confirmed' && !t.stay.ended && daysUntil(t.stay) <= 14)
    .sort((a, b) => a.stay.startDate.localeCompare(b.stay.startDate))[0];
  if (!waiting.length && !next) return null;

  return (
    <section className="ut" aria-label={isHost ? 'Your upcoming guests' : 'Your upcoming trip'}>
      <header className="ut-head">
        <h2><CalendarCheck size={16} /> {next ? (isHost ? 'Your next guest' : 'Your upcoming trip') : 'Waiting for your answer'}</h2>
        <Link to="/trips" className="ut-all">{isHost ? 'My guests' : 'My trips'} <ArrowRight size={14} /></Link>
      </header>
      {waiting.map((t) => <TripCard key={t.stay.id} trip={t} meId={meId} compact onChanged={() => setReload((n) => n + 1)} />)}
      {next && <TripCard trip={next} meId={meId} compact onChanged={() => setReload((n) => n + 1)} />}
    </section>
  );
}
