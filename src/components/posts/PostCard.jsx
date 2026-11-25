import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Users, Moon, CalendarDays, MessageCircle, Pencil, Trash2, Compass, Star, Clock, Sparkle,
  Wifi, SquareParking, Utensils, Snowflake, CookingPot, WashingMachine, Tv, ShowerHead, Check,
} from 'lucide-react';
import { GUIDE_HELP, fmt, daysUntil, isNewPost, citiesInLocation } from './postUtils';
import { VerifiedTick, TrustShield } from '../VerifiedBadge';
import SaveButton from '../SaveButton';

const EASE = [0.22, 1, 0.36, 1];

const AMENITY_ICONS = { WiFi: Wifi, Parking: SquareParking, Meals: Utensils, AC: Snowflake, Kitchen: CookingPot, Laundry: WashingMachine, TV: Tv, 'Hot Water': ShowerHead };
const iconFor = (tag) => AMENITY_ICONS[tag] || Check;

// All 8 amenity types fit on one card row; "+N" only covers anything beyond that.
const MAX_ICONS = 8;
const STEP_MS = 1800;
const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * A card's amenity icons take turns: every STEP_MS the next one grows and shows its name, as if hovered.
 * Each card starts at a random moment so a page of cards doesn't pulse in step; off with reduced motion.
 * ponytail: one timer per card; pause off-screen cards (IntersectionObserver) if a page ever holds hundreds.
 */
const AmenityIcons = ({ items }) => {
  const shown = items.slice(0, MAX_ICONS);
  const [active, setActive] = useState(-1);
  useEffect(() => {
    if (reduceMotion || shown.length === 0) return undefined;
    let timer;
    const start = setTimeout(() => {
      setActive(0);
      timer = setInterval(() => setActive((i) => (i + 1) % shown.length), STEP_MS);
    }, Math.random() * STEP_MS);
    return () => { clearTimeout(start); clearInterval(timer); };
  }, [shown.length]);
  if (!items.length) return <span className="pb-amen" aria-hidden="true" />; // keeps the row, so cards stay the same height
  return (
    <span className="pb-amen" role="img" aria-label={items.join(', ')}>
      {shown.map((tag, i) => {
        const Icon = iconFor(tag);
        // The name slides out beside the icon, inside the icon row (so it never covers the guests line).
        // Icons 6–8 sit near the card's right edge, so theirs opens to the left.
        const side = i >= 5 ? ' is-left' : '';
        return (
          <span key={tag} className={`pb-amen-i${side}${i === active ? ' is-on' : ''}`} title={tag}>
            <Icon size={15} aria-hidden="true" />
            <span className="pb-amen-tip" aria-hidden="true">{tag}</span>
          </span>
        );
      })}
      {items.length > MAX_ICONS && <span className="pb-amen-more">+{items.length - MAX_ICONS}</span>}
    </span>
  );
};

/** Amenities: named chips in the full post, taking-turns icons on a card. */
const Tags = ({ items, all }) => {
  if (!all) return <AmenityIcons items={items || []} />;
  if (!items?.length) return null;
  return (
    <div className="pb-tags">
      {items.map((tag) => { const Icon = iconFor(tag); return <span key={tag} className="pb-tag"><Icon size={13} aria-hidden="true" />{tag}</span>; })}
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
// On a card the description always takes 2 lines, cut with "…" (CSS), so every card is the same height.
const Desc = ({ post, onOpen }) => {
  if (!onOpen && !post.content) return null;
  return <p className="pb-desc">{post.content}</p>;
};

/**
 * A traveller's trip request (what hosts browse), drawn as a travel ticket:
 * date stub | the trip | a stub with people, days, amenities and the button.
 */
const TripCard = ({ post, c, locale, isOwn, full, onOpen, onContact, onProfile, onEdit, onDelete }) => {
  const d = daysUntil(post.planningDate);
  const date = post.planningDate ? new Date(post.planningDate) : null;
  const tone = d === null ? 'flex' : d < 0 ? 'past' : d <= 3 ? 'soon' : 'later';
  const when = d === null ? c.flexible : d < 0 ? c.past : d === 0 ? c.today : d === 1 ? c.tomorrow : fmt(c.inDays, { n: d });
  const needsGuide = post.needType === 'guide' || post.needType === 'both';
  const needsStay = post.needType !== 'guide';
  const kind = post.needType === 'both' ? c.badgeBoth : needsGuide ? c.badgeGuide : c.badgeStay;
  const city = (post.location || '').split(',')[0].trim() || '—';
  // "Hospital visit, Bank paperwork · ₹100/hr · Telugu, English"
  const guideLine = needsGuide ? [
    (post.guideHelpWith || []).map((k) => c.helpLabels?.[k] || GUIDE_HELP[k]?.label || k).join(', '),
    post.guideBudgetPerHour != null ? fmt(c.guideBudget, { n: post.guideBudgetPerHour }) : c.guideBudgetDiscuss,
    post.guideLanguages?.length > 0 && post.guideLanguages.join(', '),
  ].filter(Boolean).join(' · ') : '';
  return (
    <>
      <div className={`pb-tk-stub pb-tk-stub--${tone}`}>
        {date ? (
          <>
            <span className="pb-tk-mon">{date.toLocaleDateString(locale, { month: 'short' })}</span>
            <span className="pb-tk-day">{date.getDate()}</span>
            <span className="pb-tk-wk">{date.toLocaleDateString(locale, { weekday: 'short' })}</span>
          </>
        ) : <Sparkle size={22} aria-hidden="true" />}
        <span className="pb-tk-rule" aria-hidden="true" />
        <span className="pb-tk-when">{when}</span>
        {tone === 'soon' && <span className="pb-tk-soon">{c.soonBadge}</span>}
      </div>

      <div className="pb-tk-main">
        <span className={`pb-tk-kind${needsGuide ? ' is-guide' : ''}`}>{kind}</span>
        <Title post={post} onOpen={onOpen} />
        <p className="pb-host-line">
          <button type="button" className="pb-author-link" onClick={() => onProfile(post)}>{post.userName}</button>{post.userVerified && <VerifiedTick />}{post.poster?.verifiedHow && <TrustShield how={post.poster.verifiedHow} since={post.poster.verifiedSince} />} <Rating poster={post.poster} />
          <span aria-hidden="true"> · </span>
          {isNewPost(post.createdAt) ? <span className="pb-badge pb-badge--new">{c.newBadge}</span> : postedLabel(c, post.createdAt)}
          <span aria-hidden="true"> · </span><MapPin size={12} className="pb-tk-pin" aria-hidden="true" /> <span className="pb-tk-place">{full ? post.location : city}</span>
        </p>
        <Desc post={post} onOpen={onOpen} />
        <p className="pb-tk-guide">{guideLine && <><Compass size={13} aria-hidden="true" /><span>{guideLine}</span></>}</p>
        {full && <ReplyBadge poster={post.poster} />}
      </div>

      <div className="pb-tk-side">
        <ul className="pb-facts">
          <li><Users size={13} /> {post.visitors === 1 ? c.person : fmt(c.people, { n: post.visitors })}</li>
          {needsStay && <li><Moon size={13} /> {post.days === 1 ? c.day : fmt(c.days, { n: post.days })}</li>}
          {needsGuide && post.guideHours && <li className="is-guide"><Compass size={13} /> {post.guideHours === 1 ? c.guideHour : fmt(c.guideHours, { n: post.guideHours })}</li>}
        </ul>
        <Tags items={needsStay ? post.facilities : []} all={full} />
        {isOwn
          ? <OwnActions c={c} post={post} onEdit={onEdit} onDelete={onDelete} />
          : <button type="button" className="pb-contact" onClick={() => onContact(post)}><MessageCircle size={15} /> {needsGuide ? c.offerToHelp : c.offerToHost}</button>}
      </div>
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
      <div className="pb-card-top">
        <button type="button" className="pb-avatar pb-avatar--host pb-avatar--lg" onClick={() => onProfile(post)} aria-label={post.userName}>
          {(post.userName || '?').charAt(0).toUpperCase()}
        </button>
        <div className="pb-card-head">
          <Title post={post} onOpen={onOpen} />
          <p className="pb-host-line">
            <button type="button" className="pb-author-link" onClick={() => onProfile(post)}>{post.userName}</button>{post.userVerified && <VerifiedTick />}{post.poster?.verifiedHow && <TrustShield how={post.poster.verifiedHow} since={post.poster.verifiedSince} />}
            <span aria-hidden="true"> · </span>
            {isNewPost(post.createdAt) ? <span className="pb-badge pb-badge--new">{c.newBadge}</span> : postedLabel(c, post.createdAt)}
            {isOwn && <span className="pb-badge">{c.yours}</span>} <Rating poster={post.poster} />
          </p>
          <ReplyBadge poster={post.poster} />
        </div>
        {!isOwn && post.userId && <SaveButton userId={post.userId} name={post.userName} compact />}
      </div>

      {cities.length > 0 && (
        <div className="pb-areas">
          <MapPin size={14} aria-hidden="true" />
          <span className="pb-areas-list">{(full ? cities : cities.slice(0, 4)).join(' · ')}</span>
          {!full && cities.length > 4 && <span className="pb-areas-more">+{cities.length - 4}</span>}
        </div>
      )}

      <Desc post={post} onOpen={onOpen} />
      {/* Guests, then amenity icons: pinned to the bottom so they line up across cards */}
      <div className="pb-meta">
        <ul className="pb-facts">
          <li><Users size={14} /> {post.maxGuests === 1 ? c.upToOne : fmt(c.upTo, { n: post.maxGuests })}</li>
          {since && <li><CalendarDays size={14} /> {fmt(c.availableFrom, { date: since.toLocaleDateString(locale, { day: 'numeric', month: 'short' }) })}</li>}
        </ul>
        <Tags items={post.amenities} all={full} />
      </div>

      <footer className="pb-card-foot">
        {post.pricePerNight > 0
          ? <div className="pb-price"><strong>₹{Number(post.pricePerNight).toLocaleString('en-IN')}</strong><span>{c.perNight}</span></div>
          : <span className="pb-posted">{c.priceOnRequest}</span>}
        {isOwn
          ? <OwnActions c={c} post={post} onEdit={onEdit} onDelete={onDelete} />
          : <button type="button" className="pb-contact" onClick={() => onContact(post)}><MessageCircle size={15} /> {full ? c.messageHost : c.message}</button>}
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
