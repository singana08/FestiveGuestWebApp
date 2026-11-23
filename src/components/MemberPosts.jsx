import { useState } from 'react';
import { ChevronDown, MapPin, CalendarDays, Users, FileText } from 'lucide-react';
import '../styles/Trust.css';

const day = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const csv = (v) => (Array.isArray(v) ? v : (v || '').split(',')).map((x) => x.trim()).filter(Boolean);

/** "Their posts" on a profile: what the member has up right now. Tap one to read it here. */
export default function MemberPosts({ posts = [], isHost, name }) {
  const [open, setOpen] = useState(null);
  const first = (name || '').split(' ')[0] || 'They';
  if (!posts.length) return <p className="tr-muted">{first} has no posts up right now.</p>;

  return (
    <ul className="mp">
      {posts.map((p) => {
        const id = p.rowKey || p.id;
        const isOpen = open === id;
        const when = isHost
          ? (p.pricePerNight > 0 ? `₹${Number(p.pricePerNight).toLocaleString('en-IN')} / night` : 'Price on request')
          : (p.planningDate ? day(p.planningDate) : 'Flexible dates');
        const tags = csv(isHost ? p.amenities : p.facilities);
        return (
          <li key={id} className={isOpen ? 'is-open' : ''}>
            <button type="button" className="mp-row" onClick={() => setOpen(isOpen ? null : id)} aria-expanded={isOpen}>
              <FileText size={15} aria-hidden="true" />
              <span className="mp-text">
                <strong>{p.title}</strong>
                <small>{p.location && <><MapPin size={11} /> {p.location} · </>}{isHost ? when : <><CalendarDays size={11} /> {when}</>}</small>
              </span>
              <ChevronDown size={16} className="mp-chev" aria-hidden="true" />
            </button>
            {isOpen && (
              <div className="mp-body">
                {p.content && <p>{p.content}</p>}
                <p className="mp-facts">
                  {isHost && p.maxGuests > 0 && <span><Users size={12} /> Up to {p.maxGuests} guest{p.maxGuests === 1 ? '' : 's'}</span>}
                  {!isHost && p.visitors > 0 && <span><Users size={12} /> {p.visitors} {p.visitors === 1 ? 'person' : 'people'}</span>}
                  {!isHost && p.days > 0 && <span>{p.days} day{p.days === 1 ? '' : 's'}</span>}
                </p>
                {tags.length > 0 && <div className="pb-tags">{tags.map((t) => <span key={t} className="pb-tag">{t}</span>)}</div>}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
