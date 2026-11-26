import { useEffect, useState } from 'react';
import { MapPin, Clock, CalendarCheck } from 'lucide-react';
import api from '../../utils/api';
import GlassDialog from './GlassDialog';
import SafetyActions from '../SafetyActions';
import Gallery from '../Gallery';
import ReviewsSection, { Stars } from '../ReviewsSection';
import ShareStay from '../ShareStay';
import SaveButton from '../SaveButton';
import MemberPosts from '../MemberPosts';
import { LoadError } from '../Feedback';
import { VerifiedChip, TrustChip } from '../VerifiedBadge';

/** A post author's profile: photos of their place, reviews, reply speed, and safety tools. */
const ProfileModal = ({ open, userId, userName, onClose, onBlockChange }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const me = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchProfile = async () => {
    setLoading(true); setLoadFailed(false);
    try {
      setProfile((await api.post('user/public-profile', { userId })).data);
    } catch (error) {
      if (error.response?.status !== 404) setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  // The page keys this component by userId, so each person starts fresh.
  useEffect(() => {
    if (open && userId) fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  const name = profile?.name || userName || 'Profile';
  const joined = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '';
  const reviewCount = profile?.totalReviews || 0;
  const isHost = profile?.userType === 'Host';
  const isMe = profile?.userId === me?.userId;

  return (
    <GlassDialog
      open={open}
      onClose={onClose}
      size="md"
      title={name}
      subtitle={profile ? `${isHost ? '🏡 Local host' : '🧳 Traveller'}${joined ? ` · Joined ${joined}` : ''}` : undefined}
    >
      {loading ? (
        <div className="pb-profile-loading"><span className="rg-spinner pb-spinner-light" /> Loading profile…</div>
      ) : loadFailed ? (
        <LoadError what="this profile" onRetry={fetchProfile} />
      ) : !profile ? (
        <p className="pb-muted">Profile not found.</p>
      ) : (
        <div className="pb-profile">
          <div className="pb-profile-top">
            {profile.profileImageUrl && !imgFailed ? (
              <img className="pb-profile-photo" src={profile.profileImageUrl} alt={profile.name} onError={() => setImgFailed(true)} />
            ) : (
              <span className={`pb-avatar pb-avatar--xl pb-avatar--${isHost ? 'host' : 'guest'}`} aria-hidden="true">{profile.name.charAt(0).toUpperCase()}</span>
            )}
            <div>
              {(profile.isVerified || profile.adminVerified || (isHost && !isMe)) && (
                <p className="pb-profile-verified">{profile.adminVerified && <TrustChip how={profile.verifiedHow} since={profile.verifiedSince} />}{profile.isVerified && <VerifiedChip />}{isHost && !isMe && me?.userId && <SaveButton userId={profile.userId} name={profile.name} />}</p>
              )}
              {profile.location && <p className="pb-profile-loc"><MapPin size={14} /> {profile.location}</p>}
              <p className="pb-profile-rating">
                <Stars value={profile.averageRating || 0} size={15} />
                <span>{profile.averageRating > 0 ? `${profile.averageRating.toFixed(1)} · ` : ''}{reviewCount} review{reviewCount === 1 ? '' : 's'}</span>
              </p>
              {profile.confirmedStays > 0 && <p className="tg-reply tg-stays"><CalendarCheck size={13} /> {profile.confirmedStays} confirmed stay{profile.confirmedStays === 1 ? '' : 's'}</p>}
              {profile.responseBadge && <p className="tg-reply"><Clock size={13} /> {profile.responseBadge}</p>}
            </div>
          </div>

          {isHost && profile.gallery?.length > 0 && (
            <section className="pb-profile-section">
              <h4>Their place</h4>
              <Gallery photos={profile.gallery} ownerId={profile.userId} ownerName={profile.name} canReport={!isMe && !!me?.userId} />
            </section>
          )}

          {profile.bio && (
            <section className="pb-profile-section">
              <h4>{isHost ? 'About my hosting' : 'About me'}</h4>
              <p>{profile.bio}</p>
            </section>
          )}

          {isHost && profile.hostingAreas?.length > 0 && (
            <section className="pb-profile-section">
              <h4>Hosting areas</h4>
              <div className="pb-areas pb-areas--wrap">
                {profile.hostingAreas.flatMap((area) => area.cities.map((city) => <span key={`${area.state}-${city}`} className="pb-area">{city}<small> · {area.state}</small></span>))}
              </div>
            </section>
          )}

          <section className="pb-profile-section">
            <h4>{isHost ? 'Their listings' : 'Their trips'}</h4>
            <MemberPosts posts={profile.posts || []} isHost={isHost} name={profile.name} />
          </section>

          <section className="pb-profile-section">
            <ReviewsSection userId={profile.userId} name={profile.name} reviews={profile.reviews || []} meId={me?.userId} onChanged={fetchProfile} />
          </section>

          {!isMe && (
            <section className="pb-profile-section pb-profile-safety">
              {isHost && <ShareStay host={profile} />}
              <SafetyActions userId={profile.userId} userName={profile.name} context="profile" onBlockChange={onBlockChange} />
            </section>
          )}
        </div>
      )}
    </GlassDialog>
  );
};

export default ProfileModal;
