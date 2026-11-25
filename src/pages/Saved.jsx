import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Star, CalendarCheck, FileText, Search } from 'lucide-react';
import api from '../utils/api';
import SaveButton from '../components/SaveButton';
import { useSavedIds } from '../utils/saved';
import { VerifiedTick, TrustShield } from '../components/VerifiedBadge';
import useSEO from '../hooks/useSEO';
import '../styles/Register.css';
import '../styles/PostsBoard.css';
import '../styles/Profile.css';
import '../styles/Trust.css';

/** Saved hosts: each opens their profile, where their current posts are listed. */
export default function Saved() {
  useSEO({ title: 'Saved hosts', noindex: true });
  const [hosts, setHosts] = useState(null);
  const savedIds = useSavedIds();

  useEffect(() => {
    let live = true;
    api.get('saved').then((res) => { if (live) setHosts(res.data || []); }).catch(() => { if (live) setHosts([]); });
    return () => { live = false; };
  }, []);

  // Un-saving here removes the card straight away (the ♡ store is the source of truth).
  const shown = (hosts || []).filter((h) => !savedIds || savedIds.has(h.id));

  return (
    <div className="pf">
      <div className="rg-aurora" aria-hidden="true"><span className="a1" /><span className="a2" /><span className="a3" /></div>
      <div className="pf-shell tp">
        <header className="tp-head">
          <h1><Heart size={22} /> Saved hosts</h1>
          <p>Hosts you’ve saved with ♡. Open one to see their place, reviews and current posts.</p>
        </header>

        {hosts === null ? (
          <p className="tp-empty"><span className="rg-spinner pb-spinner-light" /> Loading…</p>
        ) : shown.length === 0 ? (
          <div className="tp-empty">
            <p>No saved hosts yet. Tap ♡ on a host’s post or profile to keep them here.</p>
            <Link to="/posts" className="rg-btn rg-btn-primary rg-btn-sm"><Search size={14} /> Browse hosts</Link>
          </div>
        ) : (
          <ul className="sv-grid">
            {shown.map((h) => (
              <li key={h.id} className="sv-card">
                <Link to={`/profile/${encodeURIComponent(h.name)}`} className="sv-pic" aria-label={`${h.name}’s profile`}>
                  {h.coverUrl || h.photoUrl ? <img src={h.coverUrl || h.photoUrl} alt="" loading="lazy" /> : <span className="tc-initial">{h.name.charAt(0).toUpperCase()}</span>}
                </Link>
                <div className="sv-heart"><SaveButton userId={h.id} name={h.name} compact /></div>
                <div className="sv-body">
                  <Link to={`/profile/${encodeURIComponent(h.name)}`} className="sv-name">{h.name}{h.isVerified && <VerifiedTick />}{h.adminVerified && <TrustShield />}</Link>
                  {h.location && <p className="sv-meta"><MapPin size={13} /> {h.location}</p>}
                  <p className="sv-meta">
                    {h.reviewCount > 0 && <span className="sv-rating"><Star size={13} /> {h.rating.toFixed(1)} ({h.reviewCount})</span>}
                    {h.stays > 0 && <span><CalendarCheck size={13} /> {h.stays} stay{h.stays === 1 ? '' : 's'}</span>}
                  </p>
                  <Link to={`/profile/${encodeURIComponent(h.name)}`} className="sv-posts">
                    <FileText size={13} /> {h.activePosts > 0 ? `${h.activePosts} post${h.activePosts === 1 ? '' : 's'} up now` : 'No posts right now'}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
