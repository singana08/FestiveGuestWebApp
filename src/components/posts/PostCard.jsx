import { motion } from 'framer-motion';
import { MapPin, Users, Moon, CalendarDays, MessageCircle, Pencil, Trash2, Compass, Star, Clock } from 'lucide-react';
import { AMENITY_ICON, GUIDE_HELP, fmt, daysUntil, isNewPost, citiesInLocation } from './postUtils';
import { VerifiedTick } from '../VerifiedBadge';
import SaveButton from '../SaveButton';

const EASE = [0.22, 1, 0.36, 1];

const Tags = ({ items, all }) => {
  if (!items?.length) return null;
  const shown = all ? items : items.slice(0, 5);
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

/** "★ 4.5 (2) · 3 stays" — published reviews and confirmed stays, when there are any. */
const Rating = ({ poster }) => (
  <>
    {poster?.reviewCount > 0 && <span className="pb-rating" title={`${poster.rating.toFixed(1)} from ${poster.reviewCount} review${poster.reviewCount === 1 ? '' : 's'}`}><Star size={12} /> {poster.rating.toFixed(1)} <small>({poster.reviewCount})</small></span>}
    {poster?.stays > 0 && <span className="pb-stays" title="Stays both people confirmed on FestiveGuest">· {poster.stays} stay{poster.stays === 1 ? '' : 's'}</span>}
  </>
);

const ReplyBadge = ({ poster }) => (poster?.responseBadge ? <p className="pb-reply"><Clock size={12} /> {poster.responseBadge}</p> : null);

/** The host's gallery as a strip at the top of their card: cover large, two small, "+N". Opens their profile. */
const Photos = ({ post, onProfile }) => {
  const photos = post.poster?.photos || [];
  if (!photos.length) return null;
  const shown = photos.slice(0, 3);
  const more = (post.poster.photoCount || photos.length) - shown.length;
  return (
    <button type="button" className={`pb-photos pb-photos--${shown.length}`} onClick={() => onProfile(post)} aria-label={`See photos of ${post.userName}’s place`}>
      {shown.map((url, i) => <img key={url} src={url} alt="" loading="lazy" className={i === 0 ? 'is-cover' : ''} />)}
      {more > 0 && <span className="pb-photos-more">+{more}</span>}
    </button>
  );
};

const postedLabel = (c, createdAt) => {
  const ago = -daysUntil(createdAt);
  return ago <= 0 ? c.postedToday : fmt(c.postedDaysAgo, { n: ago });
};

// Title and long descriptions open the full post (onOpen); in the full view they're plain text.
const Title = ({ post, onOpen }) => (onOpen
  ? <h3 className="pb-card-title"><button type="button" className="pb-title-btn" onClick={() => onOpen(post)} title={post.title}>{post.title}</button></h3>
  : <h3 className="pb-card-title">{post.title}</h3>);
const Desc = ({ post, c, onOpen }) => {
  if (!post.content) return null;
  const long = onOpen && post.content.length > 150;
  return (
    <>
      <p className="pb-desc">{post.content}</p>
      {long && <button type="button" className="pb-more" onClick={() => onOpen(post)}>{c.readMore}</button>}
    </>
  );
};

/** A traveller's trip request (what hosts browse). */
const TripCard = ({ post, c, locale, isOwn, full, onOpen, onContact, onProfile, onEdit, onDelete }) => {
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
          <Title post={post} onOpen={onOpen} />
          <p className={`pb-when pb-when--${tone}`}>{when}{date && ` · ${date.toLocaleDateString(locale, { weekday: 'short' })}`}</p>
          <ReplyBadge poster={post.poster} />
        </div>
      </div>

      <ul className="pb-facts">
        <li><MapPin size={14} /> {post.location || '—'}</li>
        <li><Users size={14} /> {post.visitors === 1 ? c.person : fmt(c.people, { n: post.visitors })}</li>
        {needsStay && <li><Moon size={14} /> {post.days === 1 ? c.day : fmt(c.days, { n: post.days })}</li>}
        {needsGuide && post.guideHours && <li><Compass size={14} /> {post.guideHours === 1 ? c.guideHour : fmt(c.guideHours, { n: post.guideHours })}</li>}
      </ul>

      <Desc post={post} c={c} onOpen={onOpen} />
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
      {needsStay && <Tags items={post.facilities} all={full} />}

      <footer className="pb-card-foot">
        <button type="button" className="pb-author" onClick={() => onProfile(post)}>
          <span className="pb-avatar pb-avatar--guest" aria-hidden="true">{(post.userName || '?').charAt(0).toUpperCase()}</span>
          <span className="pb-author-text"><strong>{post.userName}{post.userVerified && <VerifiedTick />}</strong><small>{postedLabel(c, post.createdAt)} <Rating poster={post.poster} /></small></span>
        </button>
        {isOwn
          ? <OwnActions c={c} post={post} onEdit={onEdit} onDelete={onDelete} />
          : <button type="button" className="pb-contact" onClick={() => onContact(post)}><MessageCircle size={15} /> {needsGuide ? c.offerToHelp : c.offerToHost}</button>}
      </footer>
    </>
  );
};

/** A host's listing (what guests browse). */
const HostCard = ({ post, c, locale, isOwn, full, onOpen, onContact, onProfile, onEdit, onDelete }) => {
  const cities = citiesInLocation(post.location);
  const since = post.commenceDate ? new Date(post.commenceDate) : null;
  return (
    <>
      <Photos post={post} onProfile={onProfile} />
      {!isOwn && post.userId && <div className="pb-save"><SaveButton userId={post.userId} name={post.userName} compact /></div>}
      <div className="pb-card-top">
        <button type="button" className="pb-avatar pb-avatar--host pb-avatar--lg" onClick={() => onProfile(post)} aria-label={post.userName}>
          {(post.userName || '?').charAt(0).toUpperCase()}
        </button>
        <div className="pb-card-head">
          <div className="pb-badges">
            {isNewPost(post.createdAt) && <span className="pb-badge pb-badge--new">{c.newBadge}</span>}
            {isOwn && <span className="pb-badge">{c.yours}</span>}
          </div>
          <Title post={post} onOpen={onOpen} />
          <p className="pb-host-line">
            <button type="button" className="pb-author-link" onClick={() => onProfile(post)}>{post.userName}</button>{post.userVerified && <VerifiedTick />}
            <span aria-hidden="true"> · </span>{postedLabel(c, post.createdAt)} <Rating poster={post.poster} />
          </p>
          <ReplyBadge poster={post.poster} />
        </div>
      </div>

      {cities.length > 0 && (
        <div className="pb-areas">
          <MapPin size={14} aria-hidden="true" />
          {(full ? cities : cities.slice(0, 4)).map((city) => <span key={city} className="pb-area">{city}</span>)}
          {!full && cities.length > 4 && <span className="pb-area pb-area--more">+{cities.length - 4}</span>}
        </div>
      )}

      <ul className="pb-facts">
        <li><Users size={14} /> {post.maxGuests === 1 ? c.upToOne : fmt(c.upTo, { n: post.maxGuests })}</li>
        {since && <li><CalendarDays size={14} /> {fmt(c.availableFrom, { date: since.toLocaleDateString(locale, { day: 'numeric', month: 'short' }) })}</li>}
      </ul>

      <Desc post={post} c={c} onOpen={onOpen} />
      <Tags items={post.amenities} all={full} />

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
    className={`pb-card pb-card--${props.post.userType === 'Guest' ? 'trip' : 'host'}${props.post.needType === 'guide' || props.post.needType === 'both' ? ' is-guide' : ''}${props.full ? ' pb-card--full' : ''}`}
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, ease: EASE, delay: Math.min(index, 8) * 0.05 }}
  >
    {props.post.userType === 'Guest' ? <TripCard {...props} /> : <HostCard {...props} />}
  </motion.article>
);

export default PostCard;
