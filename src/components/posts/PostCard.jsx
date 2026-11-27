import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Users, Moon, CalendarDays, MessageCircle, Pencil, Trash2, Compass, Star, Clock, Sparkle,
  CheckCircle2, BellRing, Send, History, Eye,
} from 'lucide-react';
import { GUIDE_HELP, fmt, daysUntil, isNewPost, citiesInLocation, iconFor } from './postUtils';
import { VerifiedTick, TrustShield } from '../VerifiedBadge';
import SaveButton from '../SaveButton';

const EASE = [0.22, 1, 0.36, 1];


// All 8 amenity types fit on one card row; "+N" only covers anything beyond that.
const MAX_ICONS = 8;
const STEP_MS = 1800;
const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * A card's amenity icons take turns: every STEP_MS the next one grows and shows its name, as if hovered.
 * Each card starts at a random moment so a page of cards doesn't pulse in step; off with reduced motion.
 * ponytail: one timer per card; pause off-screen cards (IntersectionObserver) if a page ever holds hundreds.
 */
const AmenityIcons = ({ items, max = MAX_ICONS }) => {
  const shown = items.slice(0, max);
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
            <Icon size={17} aria-hidden="true" />
            <span className="pb-amen-tip" aria-hidden="true">{tag}</span>
          </span>
        );
      })}
      {items.length > max && <span className="pb-amen-more">+{items.length - max}</span>}
    </span>
  );
};

/** Amenities: named chips in the full post, taking-turns icons on a card (at most `max`, then "+N"). */
const Tags = ({ items, all, max }) => {
  if (!all) return <AmenityIcons items={items || []} max={max} />;
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

/**
 * The host's photos for this listing's cities (then "All places") as a strip: cover large, two small, "+N".
 * When the guest has picked cities, those cities' photos lead. Opens their profile.
 */
const Photos = ({ post, onProfile, focusCities = [] }) => {
  const photos = post.poster?.photos || [];
  if (!photos.length) return null;
  const cityOf = post.poster.photoCities || [];
  const focused = (i) => focusCities.some((f) => f.toLowerCase() === (cityOf[i] || '').toLowerCase());
  const shown = photos.map((url, i) => ({ url, i })).sort((a, b) => focused(b.i) - focused(a.i)).slice(0, 3).map((x) => x.url);
  const more = (post.poster.photoCount || photos.length) - shown.length;
  return (
    <button type="button" className={`pb-photos pb-photos--${shown.length}`} onClick={() => onProfile(post)} aria-label={`See photos of ${post.userName}’s place`}>
      {shown.map((url, i) => <img key={url} src={url} alt="" loading="lazy" className={i === 0 ? 'is-cover' : ''} />)}
      {more > 0 && <span className="pb-photos-more">+{more}</span>}
    </button>
  );
};

const CONTACT_ICONS = { confirmed: CheckCircle2, asked: BellRing, requested: Send, stayed: History, messaged: MessageCircle };
/**
 * Where you already stand with this member (from your chats and stays): "Confirmed", "Waiting for you", "Request sent",
 * "Stayed before" or "Messaged" (+ "2 new"). Shown in place of when the post went up.
 */
const ContactTag = ({ contact, c }) => {
  const Icon = CONTACT_ICONS[contact.kind];
  return (
    <span className={`pb-contact-tag is-${contact.kind}`}>
      <Icon size={13} aria-hidden="true" />{c.contact[contact.kind]}
      {contact.unread > 0 && <span className="pb-contact-new">{fmt(c.contactUnread, { n: contact.unread })}</span>}
    </span>
  );
};

/**
 * On your own trip (My posts): how often hosts opened it, and who messaged you about it, with where you stand with
 * each ("Confirmed", "Waiting for you"…). A name opens your chat with them.
 */
const TripActivity = ({ post, c, contacts = {}, onChatWith }) => {
  const { views = 0, contactedBy = [] } = post.activity;
  return (
    <div className="pb-tk-activity" aria-label={c.activityLabel}>
      <span className="pb-tk-views" title={c.activityViewsTip}>
        <Eye size={14} aria-hidden="true" /> {views === 0 ? c.activityNoViews : fmt(views === 1 ? c.activityView : c.activityViews, { n: views })}
      </span>
      {contactedBy.length === 0
        ? <span className="pb-tk-nobody">{c.activityNobody}</span>
        : contactedBy.map(({ id, name }) => (
          <button key={id} type="button" className={`pb-tk-who is-${contacts[id]?.kind || 'messaged'}`} title={fmt(c.activityChat, { name })} onClick={() => onChatWith?.(id, name, post)}>
            <span className="pb-tk-who-name">{name.split(' ')[0]}</span>
            {contacts[id] ? <ContactTag contact={contacts[id]} c={c} /> : <MessageCircle size={13} aria-hidden="true" />}
          </button>
        ))}
    </div>
  );
};

const postedLabel = (c, createdAt, short = false) => {
  const ago = -daysUntil(createdAt);
  if (short) return ago <= 0 ? c.agoToday : fmt(c.agoDays, { n: ago }); // "2d ago" at the end of a ticket's name line
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
 * A traveller's trip request (what hosts browse), drawn as a travel ticket: a date stub, then the trip —
 * kind · people · days · when posted, the title, where · who, the note (plus what help they need),
 * and a bar with the amenities and the button. Slim enough for 3 across.
 */
const TripCard = ({ post, c, locale, isOwn, full, contact, contacts, onOpen, onContact, onChatWith, onProfile, onEdit, onDelete }) => {
  const d = daysUntil(post.planningDate);
  const date = post.planningDate ? new Date(post.planningDate) : null;
  const tone = d === null ? 'flex' : d < 0 ? 'past' : d <= 3 ? 'soon' : 'later';
  const when = d === null ? c.flexible : d < 0 ? c.past : d === 0 ? c.today : d === 1 ? c.tomorrow : fmt(c.inDays, { n: d });
  const needsGuide = post.needType === 'guide' || post.needType === 'both';
  const needsStay = post.needType !== 'guide';
  const kind = post.needType === 'both' ? c.badgeBoth : needsGuide ? c.badgeGuide : c.badgeStay;
  const city = (post.location || '').split(',')[0].trim() || '—';
  const people = post.visitors === 1 ? c.person : fmt(c.people, { n: post.visitors });
  const hours = post.guideHours && fmt(post.guideHours === 1 ? c.guideHour : c.guideHours, { n: post.guideHours });
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
        <p className="pb-tk-top">
          <span className={`pb-tk-kind${needsGuide ? ' is-guide' : ''}`}>{kind}</span>
          <span className="pb-tk-facts">
            {/* On a card: "👥 2" and "🧭 4h" (the words are the tooltip, and read out); the full post spells them out */}
            <span title={people}><Users size={14} aria-hidden="true" /> {full ? people : <>{post.visitors}<span className="pb-sr"> {people}</span></>}</span>
            {needsStay && <span><Moon size={14} aria-hidden="true" /> {post.days === 1 ? c.day : fmt(c.days, { n: post.days })}</span>}
            {needsGuide && post.guideHours && (
              <span className="is-guide" title={hours}>
                <Compass size={14} aria-hidden="true" /> {full ? hours : <>{post.guideHours}h<span className="pb-sr"> {hours}</span></>}
              </span>
            )}
          </span>
          {/* where you stand with them, or else when it was posted: at the end of the top line */}
          <span className="pb-tk-posted">{contact ? <ContactTag contact={contact} c={c} /> : isNewPost(post.createdAt) ? <span className="pb-badge pb-badge--new">{c.newBadge}</span> : postedLabel(c, post.createdAt, !full)}</span>
        </p>
        <Title post={post} onOpen={onOpen} />
        {/* place first, so it's never the part that gets cut off */}
        <p className="pb-host-line">
          <MapPin size={14} className="pb-tk-pin" aria-hidden="true" /> <span className="pb-tk-place">{full ? post.location : city}</span><span aria-hidden="true"> · </span>
          <button type="button" className="pb-author-link" onClick={() => onProfile(post)}>{post.userName}</button>{post.userVerified && <VerifiedTick />}{post.poster?.verifiedHow && <TrustShield how={post.poster.verifiedHow} since={post.poster.verifiedSince} />} <Rating poster={post.poster} />
        </p>
        <div className="pb-tk-note">
          <Desc post={post} onOpen={onOpen} />
          {guideLine && <p className="pb-tk-guide"><Compass size={15} aria-hidden="true" /><span>{guideLine}</span></p>}
        </div>
        {isOwn && post.activity && <TripActivity post={post} c={c} contacts={contacts} onChatWith={onChatWith} />}
        {full && <ReplyBadge poster={post.poster} />}
        <div className="pb-tk-bar">
          <Tags items={needsStay ? post.facilities : []} all={full} max={5} />
          {isOwn
            ? <OwnActions c={c} post={post} onEdit={onEdit} onDelete={onDelete} />
            : <button type="button" className="pb-contact" onClick={() => onContact(post)}><MessageCircle size={15} /> {contact ? c.openChat : needsGuide ? c.offerToHelp : c.offerToHost}</button>}
        </div>
      </div>
    </>
  );
};

/** A host's listing (what guests browse). */
const HostCard = ({ post, c, locale, isOwn, full, contact, onOpen, onContact, onProfile, onEdit, onDelete, focusCities }) => {
  const cities = citiesInLocation(post.location);
  const since = post.commenceDate ? new Date(post.commenceDate) : null;
  return (
    <>
      <Photos post={post} onProfile={onProfile} focusCities={focusCities} />
      <div className="pb-card-top">
        <button type="button" className="pb-avatar pb-avatar--host pb-avatar--lg" onClick={() => onProfile(post)} aria-label={post.userName}>
          {(post.userName || '?').charAt(0).toUpperCase()}
        </button>
        <div className="pb-card-head">
          <Title post={post} onOpen={onOpen} />
          <p className="pb-host-line">
            <button type="button" className="pb-author-link" onClick={() => onProfile(post)}>{post.userName}</button>{post.userVerified && <VerifiedTick />}{post.poster?.verifiedHow && <TrustShield how={post.poster.verifiedHow} since={post.poster.verifiedSince} />}
            <span aria-hidden="true"> · </span>
            {contact ? <ContactTag contact={contact} c={c} /> : isNewPost(post.createdAt) ? <span className="pb-badge pb-badge--new">{c.newBadge}</span> : postedLabel(c, post.createdAt)}
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
          : <button type="button" className="pb-contact" onClick={() => onContact(post)}><MessageCircle size={15} /> {contact ? c.openChat : full ? c.messageHost : c.message}</button>}
      </footer>
    </>
  );
};

const PostCard = ({ index = 0, ...props }) => (
  <motion.article
    className={`pb-card pb-card--${props.post.userType === 'Guest' ? 'trip' : 'host'}${props.post.needType === 'guide' || props.post.needType === 'both' ? ' is-guide' : ''}${props.full ? ' pb-card--full' : ''}${props.contact && !props.isOwn ? ` is-contact is-${props.contact.kind}` : ''}`}
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, ease: EASE, delay: Math.min(index, 8) * 0.05 }}
  >
    {props.post.userType === 'Guest' ? <TripCard {...props} /> : <HostCard {...props} />}
  </motion.article>
);

export default PostCard;
