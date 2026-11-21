import { motion } from 'framer-motion';
import { MapPin, Users, Moon, CalendarDays, MessageCircle, Pencil, Trash2, Compass } from 'lucide-react';
import { AMENITY_ICON, GUIDE_HELP, fmt, daysUntil, isNewPost, citiesInLocation } from './postUtils';

const EASE = [0.22, 1, 0.36, 1];

const Tags = ({ items }) => {
  if (!items?.length) return null;
  const shown = items.slice(0, 5);
  return (
    <div className="pb-tags">
      {shown.map((tag) => (
        <span key={tag} className="pb-tag">{AMENITY_ICON[tag] && <span aria-hidden="true">{AMENITY_ICON[tag]}</span>}{tag}</span>
      ))}
      {items.length > shown.length && <span className="pb-tag pb-tag--more">+{items.length - shown.length}</span>}
    </div>
  );
};

const OwnActions = ({ c, post, onEdit, onDelete }) => (
  <div className="pb-own-actions">
    <button type="button" className="pb-icon-btn" onClick={() => onEdit(post)} aria-label={c.edit} title={c.edit}><Pencil size={15} /></button>
    <button type="button" className="pb-icon-btn pb-icon-btn--danger" onClick={() => onDelete(post)} aria-label={c.delete} title={c.delete}><Trash2 size={15} /></button>
  </div>
);

const postedLabel = (c, createdAt) => {
  const ago = -daysUntil(createdAt);
  return ago <= 0 ? c.postedToday : fmt(c.postedDaysAgo, { n: ago });
};

/** A traveller's trip request (what hosts browse). */
const TripCard = ({ post, c, locale, isOwn, onContact, onProfile, onEdit, onDelete }) => {
  const d = daysUntil(post.planningDate);
  const date = post.planningDate ? new Date(post.planningDate) : null;
  const tone = d === null ? 'flex' : d < 0 ? 'past' : d <= 3 ? 'soon' : 'later';
  const when = d === null ? c.flexible : d < 0 ? c.past : d === 0 ? c.today : d === 1 ? c.tomorrow : fmt(c.inDays, { n: d });
  const needsGuide = post.needType === 'guide' || post.needType === 'both';
  const needsStay = post.needType !== 'guide';
  return (
    <>
      <div className="pb-card-top">
        <div className={`pb-date pb-date--${tone}`} aria-hidden="true">
          {date ? (
            <>
              <span className="pb-date-mon">{date.toLocaleDateString(locale, { month: 'short' })}</span>
              <span className="pb-date-day">{date.getDate()}</span>
            </>
          ) : <span className="pb-date-flex">✦</span>}
        </div>
        <div className="pb-card-head">
          <div className="pb-badges">
            {needsGuide && <span className="pb-badge pb-badge--guide">🧭 {post.needType === 'both' ? c.badgeBoth : c.badgeGuide}</span>}
            {isNewPost(post.createdAt) && <span className="pb-badge pb-badge--new">{c.newBadge}</span>}
            {d !== null && d >= 0 && d <= 3 && <span className="pb-badge pb-badge--soon">{c.soonBadge}</span>}
            {isOwn && <span className="pb-badge">{c.yours}</span>}
          </div>
          <h3 className="pb-card-title" title={post.title}>{post.title}</h3>
          <p className={`pb-when pb-when--${tone}`}>{when}{date && ` · ${date.toLocaleDateString(locale, { weekday: 'short' })}`}</p>
        </div>
      </div>

      <ul className="pb-facts">
        <li><MapPin size={14} /> {post.location || '—'}</li>
        <li><Users size={14} /> {post.visitors === 1 ? c.person : fmt(c.people, { n: post.visitors })}</li>
        {needsStay && <li><Moon size={14} /> {post.days === 1 ? c.day : fmt(c.days, { n: post.days })}</li>}
        {needsGuide && post.guideHours && <li><Compass size={14} /> {post.guideHours === 1 ? c.guideHour : fmt(c.guideHours, { n: post.guideHours })}</li>}
      </ul>

      {post.content && <p className="pb-desc">{post.content}</p>}
      {needsGuide && (
        <div className="pb-guide">
          {post.guideHelpWith?.length > 0 && (
            <div className="pb-tags">
              {post.guideHelpWith.map((k) => (
                <span key={k} className="pb-tag pb-tag--guide"><span aria-hidden="true">{GUIDE_HELP[k]?.emoji || '✦'}</span>{c.helpLabels?.[k] || GUIDE_HELP[k]?.label || k}</span>
              ))}
            </div>
          )}
          <p className="pb-guide-meta">
            <span>{post.guideBudgetPerHour != null ? fmt(c.guideBudget, { n: post.guideBudgetPerHour }) : c.guideBudgetDiscuss}</span>
            {post.guideLanguages?.length > 0 && <span>{c.guideLangs}: {post.guideLanguages.join(', ')}</span>}
          </p>
        </div>
      )}
      {needsStay && <Tags items={post.facilities} />}

      <footer className="pb-card-foot">
        <button type="button" className="pb-author" onClick={() => onProfile(post)}>
          <span className="pb-avatar pb-avatar--guest" aria-hidden="true">{(post.userName || '?').charAt(0).toUpperCase()}</span>
          <span className="pb-author-text"><strong>{post.userName}</strong><small>{postedLabel(c, post.createdAt)}</small></span>
        </button>
        {isOwn
          ? <OwnActions c={c} post={post} onEdit={onEdit} onDelete={onDelete} />
          : <button type="button" className="pb-contact" onClick={() => onContact(post)}><MessageCircle size={15} /> {needsGuide ? c.offerToHelp : c.offerToHost}</button>}
      </footer>
    </>
  );
};

/** A host's listing (what guests browse). */
const HostCard = ({ post, c, locale, isOwn, onContact, onProfile, onEdit, onDelete }) => {
  const cities = citiesInLocation(post.location);
  const since = post.commenceDate ? new Date(post.commenceDate) : null;
  return (
    <>
      <div className="pb-card-top">
        <button type="button" className="pb-avatar pb-avatar--host pb-avatar--lg" onClick={() => onProfile(post)} aria-label={post.userName}>
          {(post.userName || '?').charAt(0).toUpperCase()}
        </button>
        <div className="pb-card-head">
          <div className="pb-badges">
            {isNewPost(post.createdAt) && <span className="pb-badge pb-badge--new">{c.newBadge}</span>}
            {isOwn && <span className="pb-badge">{c.yours}</span>}
          </div>
          <h3 className="pb-card-title" title={post.title}>{post.title}</h3>
          <p className="pb-host-line">
            <button type="button" className="pb-author-link" onClick={() => onProfile(post)}>{post.userName}</button>
            <span aria-hidden="true"> · </span>{postedLabel(c, post.createdAt)}
          </p>
        </div>
      </div>

      {cities.length > 0 && (
        <div className="pb-areas">
          <MapPin size={14} aria-hidden="true" />
          {cities.slice(0, 4).map((city) => <span key={city} className="pb-area">{city}</span>)}
          {cities.length > 4 && <span className="pb-area pb-area--more">+{cities.length - 4}</span>}
        </div>
      )}

      <ul className="pb-facts">
        <li><Users size={14} /> {post.maxGuests === 1 ? c.upToOne : fmt(c.upTo, { n: post.maxGuests })}</li>
        {since && <li><CalendarDays size={14} /> {fmt(c.availableFrom, { date: since.toLocaleDateString(locale, { day: 'numeric', month: 'short' }) })}</li>}
      </ul>

      {post.content && <p className="pb-desc">{post.content}</p>}
      <Tags items={post.amenities} />

      <footer className="pb-card-foot">
        {post.pricePerNight > 0
          ? <div className="pb-price"><strong>₹{Number(post.pricePerNight).toLocaleString('en-IN')}</strong><span>{c.perNight}</span></div>
          : <span className="pb-posted">{c.priceOnRequest}</span>}
        {isOwn
          ? <OwnActions c={c} post={post} onEdit={onEdit} onDelete={onDelete} />
          : <button type="button" className="pb-contact" onClick={() => onContact(post)}><MessageCircle size={15} /> {c.messageHost}</button>}
      </footer>
    </>
  );
};

const PostCard = ({ index = 0, ...props }) => (
  <motion.article
    className={`pb-card pb-card--${props.post.userType === 'Guest' ? 'trip' : 'host'}${props.post.needType === 'guide' || props.post.needType === 'both' ? ' is-guide' : ''}`}
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, ease: EASE, delay: Math.min(index, 8) * 0.05 }}
  >
    {props.post.userType === 'Guest' ? <TripCard {...props} /> : <HostCard {...props} />}
  </motion.article>
);

export default PostCard;
