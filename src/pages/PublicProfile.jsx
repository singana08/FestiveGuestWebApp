import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, MotionConfig } from 'framer-motion';
import { ArrowLeft, Star, CalendarDays, MapPin, MessageCircle, UserX, ShieldCheck } from 'lucide-react';
import api from '../utils/api';
import ImageWithSas from '../components/ImageWithSas';
import ChatWidget from '../components/ChatWidget';
import SafetyActions from '../components/SafetyActions';
import useIsBlocked from '../hooks/useIsBlocked';
import { VerifiedChip } from '../components/VerifiedBadge';
import useSEO from '../hooks/useSEO';
import '../styles/Register.css';
import '../styles/PostsBoard.css';
import '../styles/Profile.css';

const EASE = [0.22, 1, 0.36, 1];
const rise = (delay = 0) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, ease: EASE, delay } });
const Stars = ({ value, size = 14 }) => (
  <span className="pb-stars" aria-label={`${value} out of 5`}>
    {Array.from({ length: 5 }, (_, i) => <Star key={i} size={size} className={i < Math.round(value) ? 'is-on' : ''} />)}
  </span>
);
const monthYear = (d) => new Date(d).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

function PublicProfile() {
  const { userName } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [blocked, setBlocked] = useIsBlocked(profile?.userId);
  const me = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  useSEO({
    title: `${userName}'s Profile`,
    description: profile?.bio || `View ${userName}'s trusted host profile on FestiveGuest, India's local hosting community.`,
  });

  useEffect(() => {
    fetchPublicProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName]);

  const fetchPublicProfile = async () => {
    try {
      const [profileRes, reviewsRes] = await Promise.all([
        api.get(`user/public-profile-by-name/${encodeURIComponent(userName)}`),
        api.get(`user/reviews-by-name/${encodeURIComponent(userName)}`),
      ]);
      setProfile(profileRes.data);
      setReviews(reviewsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      // The backend requires auth for these endpoints, so a logged-out visitor
      // gets a 401 — send them to log in and back here afterwards.
      if (error.response?.status === 401) {
        navigate(`/login?redirect=${encodeURIComponent(`/profile/${userName}`)}`);
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  // Opened from a shared link there's no in-app history to go back to.
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/posts'));

  const shell = (children) => (
    <MotionConfig reducedMotion="user">
      <div className="pf">
        <div className="rg-aurora" aria-hidden="true"><span className="a1" /><span className="a2" /><span className="a3" /></div>
        <div className="pf-shell">{children}</div>
      </div>
    </MotionConfig>
  );

  if (loading) return shell(<div className="pf-state"><span className="rg-spinner pb-spinner-light" /> Loading profile…</div>);

  if (!profile) {
    return shell(
      <div className="pf-state pf-card">
        <span className="pf-state-icon"><UserX size={24} /></span>
        <h1>Profile not found</h1>
        <p>This member may have changed their name or left FestiveGuest.</p>
        <button type="button" className="rg-btn rg-btn-primary pf-btn" onClick={goBack}><ArrowLeft size={15} /> Go back</button>
      </div>,
    );
  }

  const isHost = profile.userType === 'Host';
  const isMe = me && (me.userId === profile.userId || me.name === profile.name);
  const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const byStar = [5, 4, 3, 2, 1].map((n) => ({ n, count: reviews.filter((r) => Math.round(r.rating) === n).length }));
  const areas = (profile.hostingAreas || []).filter((a) => a.state && a.cities?.length > 0);
  const firstName = (profile.name || '').split(' ')[0];

  return shell(
    <>
      <button type="button" className="pf-back" onClick={goBack}><ArrowLeft size={15} /> Back</button>

      <motion.section className="pf-hero" {...rise()}>
        <div className="pf-cover" aria-hidden="true"><span className="pf-cover-lights" /></div>
        <div className="pf-hero-body">
          <div className="pf-avatar-wrap">
            {profile.profileImageUrl
              ? <ImageWithSas src={profile.profileImageUrl} alt={profile.name} className="pf-avatar" fallbackText={profile.name?.charAt(0) || 'U'} />
              : <span className={`pf-avatar pf-avatar--initial pf-avatar--${isHost ? 'host' : 'guest'}`} aria-hidden="true">{(profile.name || '?').charAt(0).toUpperCase()}</span>}
          </div>
          <div className="pf-id">
            <h1>{profile.name}</h1>
            <p className="pf-meta">
              <span className={`pf-role pf-role--${isHost ? 'host' : 'guest'}`}>{isHost ? '🏡 Local host' : '🧳 Traveller'}</span>
              {profile.location && <span><MapPin size={13} /> {profile.location}</span>}
              {profile.createdAt && <span><CalendarDays size={13} /> Joined {monthYear(profile.createdAt)}</span>}
            </p>
            <p className="pf-chips">
              {profile.isVerified && <VerifiedChip />}
              {reviews.length > 0
                ? <span className="pf-chip is-gold"><Star size={12} /> {average.toFixed(1)} · {reviews.length} review{reviews.length === 1 ? '' : 's'}</span>
                : <span className="pf-chip">No reviews yet</span>}
            </p>
          </div>
          {me && !isMe && (
            <div className="pf-hero-actions">
              {!blocked && <button type="button" className="rg-btn rg-btn-primary pf-btn" onClick={() => setChatOpen(true)}><MessageCircle size={15} /> Message {firstName}</button>}
              <SafetyActions userId={profile.userId} userName={profile.name} context="profile" onBlockChange={(b) => { setBlocked(b); if (b) setChatOpen(false); }} />
            </div>
          )}
        </div>
      </motion.section>

      <div className="pf-grid">
        <div className="pf-col">
          <motion.section className="pf-card" {...rise(0.05)}>
            <header className="pf-card-head"><h2>{isHost ? 'About my hosting' : 'About me'}</h2></header>
            {profile.bio ? <p className="pf-bio">{profile.bio}</p> : <p className="pf-empty">{firstName} hasn’t written a bio yet.</p>}
          </motion.section>

          {isHost && areas.length > 0 && (
            <motion.section className="pf-card" {...rise(0.1)}>
              <header className="pf-card-head"><h2>Hosts in</h2><span className="pf-count">{areas.reduce((s, a) => s + a.cities.length, 0)} cities</span></header>
              <div className="pf-areas">
                {areas.map((area) => (
                  <div key={area.state} className="pf-area"><strong>{area.state}</strong><div>{area.cities.map((city) => <span key={city} className="pb-area">{city}</span>)}</div></div>
                ))}
              </div>
            </motion.section>
          )}

          <motion.section className="pf-card" {...rise(0.15)}>
            <header className="pf-card-head"><h2><Star size={16} /> Reviews</h2><span className="pf-count">{reviews.length}</span></header>
            {reviews.length === 0 ? (
              <p className="pf-empty">No reviews yet. Reviews appear after members have met through FestiveGuest.</p>
            ) : (
              <ul className="pb-reviews pf-reviews">
                {reviews.map((review, i) => (
                  <li key={i}>
                    <div className="pb-review-head"><strong>{review.reviewerName}</strong><Stars value={review.rating} size={13} /></div>
                    <p>{review.comment}</p>
                    {review.createdAt && <small>{monthYear(review.createdAt)}</small>}
                  </li>
                ))}
              </ul>
            )}
          </motion.section>
        </div>

        <div className="pf-col">
          <motion.section className="pf-card pf-rating" {...rise(0.08)}>
            <header className="pf-card-head"><h2>Rating</h2></header>
            <div className="pf-rating-top">
              <strong>{reviews.length ? average.toFixed(1) : '–'}</strong>
              <div><Stars value={average} size={16} /><small>{reviews.length} review{reviews.length === 1 ? '' : 's'}</small></div>
            </div>
            <ul className="pf-bars">
              {byStar.map(({ n, count }) => (
                <li key={n}>
                  <span>{n}★</span>
                  <span className="pf-bar"><span style={{ width: `${reviews.length ? (count / reviews.length) * 100 : 0}%` }} /></span>
                  <span>{count}</span>
                </li>
              ))}
            </ul>
          </motion.section>

          <motion.section className="pf-card" {...rise(0.12)}>
            <header className="pf-card-head"><h2><ShieldCheck size={16} /> Before you meet</h2></header>
            <ul className="pf-tips">
              <li>Keep chatting inside FestiveGuest until you’re comfortable.</li>
              <li>Meet in a public place first and share plans with family.</li>
              <li>Never pay outside the app or share OTPs.</li>
            </ul>
          </motion.section>
        </div>
      </div>

      {chatOpen && (
        <div className="pb-chat-window">
          <ChatWidget recipientId={profile.userId} recipientName={profile.name} recipientImageUrl={profile.profileImageUrl} onClose={() => setChatOpen(false)} />
        </div>
      )}
    </>,
  );
}

export default PublicProfile;
