import { Fragment, useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import {
  Plus, LayoutGrid, Map as MapIcon, HelpCircle, Gift, Megaphone,
  MapPin, Sparkles, RefreshCw, Trash2, AlertTriangle, Compass,
} from 'lucide-react';
import postsService from '../utils/postsService';
import locationService from '../utils/locationService';
import ChatWidget from '../components/ChatWidget';
import { useLanguage } from '../i18n/LanguageContext';
import { postsCopy } from '../i18n/postsCopy';
import useSEO from '../hooks/useSEO';
import PostCard from '../components/posts/PostCard';
import CityMap from '../components/posts/CityMap';
import SortMenu from '../components/posts/SortMenu';
import { NeedCard, HostNeedCard, NeedSummary, PostTripNudge } from '../components/posts/NeedSearch';
import UpcomingTrip from '../components/UpcomingTrip';
import PostFormModal from '../components/posts/PostFormModal';
import ProfileModal from '../components/posts/ProfileModal';
import GlassDialog from '../components/posts/GlassDialog';
import VerifyPhoneBanner from '../components/VerifyPhoneBanner';
import SponsoredCard, { HouseCard } from '../components/SponsoredCard';
import InviteFriendsModal from '../components/InviteFriendsModal';
import api from '../utils/api';
import { toast as showToast } from '../utils/feedback';
import { CITY_COORDS } from '../components/posts/cityCoords';
import { fmt, daysUntil, citiesInLocation, splitCsv, contactStatus } from '../components/posts/postUtils';
import '../styles/Register.css';
import '../styles/PostsBoard.css';

const EASE = [0.22, 1, 0.36, 1];
const toDate = (d) => new Date(`${d}T00:00:00.000Z`).toISOString();

// API rows → the shape the cards use (unchanged from the previous page).
const mapGuestPost = (post, fallbackName) => ({
  id: post.rowKey, title: post.title, content: post.content, location: post.location,
  planningDate: post.planningDate, visitors: post.visitors || 1, days: post.days || 1,
  facilities: post.facilities ? post.facilities.split(',') : [],
  userName: post.userName || fallbackName || 'Unknown', userId: post.userId, userType: 'Guest',
  createdAt: new Date(post.createdAt), status: post.status, userVerified: !!post.userVerified,
  needType: post.needType || 'stay', guideHelpWith: splitCsv(post.guideHelpWith), guideHours: post.guideHours || null,
  guideLanguages: splitCsv(post.guideLanguages), guideBudgetPerHour: post.guideBudgetPerHour ?? null, poster: post.poster || null,
  activity: post.activity || null, // only on your own trips (My posts): { views, contactedBy: [{ id, name }] }
});
const mapHostPost = (post, fallbackName) => ({
  id: post.rowKey, title: post.title, content: post.content, location: post.location,
  maxGuests: post.maxGuests || 1, pricePerNight: post.pricePerNight,
  amenities: post.amenities ? post.amenities.split(',') : [],
  userName: post.userName || fallbackName || 'Unknown', userId: post.userId, userType: 'Host',
  createdAt: new Date(post.createdAt), status: post.status, commenceDate: post.commenceDate, userVerified: !!post.userVerified, poster: post.poster || null,
});

// Upcoming trips by date, then flexible ones, then past trips (most recent first).
const soonestKey = (p) => { const d = daysUntil(p.planningDate); return d === null ? [1, 0] : d >= 0 ? [0, d] : [2, -d]; };
const SORTERS = {
  soonest: (a, b) => { const [ga, da] = soonestKey(a); const [gb, db] = soonestKey(b); return ga - gb || da - db || b.createdAt - a.createdAt; },
  newest: (a, b) => b.createdAt - a.createdAt,
  price: (a, b) => ((a.pricePerNight > 0 ? a.pricePerNight : Infinity) - (b.pricePerNight > 0 ? b.pricePerNight : Infinity)) || b.createdAt - a.createdAt,
};

const SkeletonCard = () => (
  <div className="pb-card pb-skeleton" aria-hidden="true">
    <div className="pb-sk pb-sk--row"><span className="pb-sk pb-sk--tile" /><span className="pb-sk pb-sk--lines" /></div>
    <span className="pb-sk pb-sk--line" /><span className="pb-sk pb-sk--line pb-sk--short" />
    <span className="pb-sk pb-sk--btn" />
  </div>
);

const Posts = () => {
  useSEO({ title: 'Browse Posts', noindex: true });
  const { t, language } = useLanguage();
  const c = postsCopy[language] || postsCopy.en;
  const locale = language === 'te' ? 'te-IN' : 'en-IN';
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useState(() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } });
  const isHost = user?.userType === 'Host';

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  // The tab lives in the address (?tab=mine), so a refresh, Back or a shared link keeps "My posts".
  const [searchParams, setSearchParams] = useSearchParams();
  const showMyPosts = searchParams.get('tab') === 'mine';
  const setShowMyPosts = (mine) => setSearchParams((p) => {
    const next = new URLSearchParams(p);
    if (mine) next.set('tab', 'mine'); else next.delete('tab');
    return next;
  }, { replace: true });
  const [locationData, setLocationData] = useState({});

  // What the member is looking for (Home's search). Remembered per member, so a return visit lands on the results.
  const needKey = `fg-need:${user?.userId}`;
  const [need, setNeed] = useState(() => { try { return JSON.parse(localStorage.getItem(needKey)); } catch { return null; } });
  const [editingNeed, setEditingNeed] = useState(false);
  const [priceFilter, setPriceFilter] = useState(0);
  const [sort, setSort] = useState(null);
  const [view, setView] = useState('cards');

  const [form, setForm] = useState({ open: false, key: 0 });
  const [deletingPost, setDeletingPost] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [profile, setProfile] = useState(null);
  const [detail, setDetail] = useState(null); // post opened in full
  const [activeChat, setActiveChat] = useState(null);
  const [contacts, setContacts] = useState({}); // who you're already in touch with, by member id
  const fetchId = useRef(0);

  // Trip requests (guest posts) are what hosts browse and what guests own.
  const viewingTrips = showMyPosts ? !isHost : isHost;
  const effectiveSort = sort || (viewingTrips ? 'soonest' : 'newest');


  const fetchPosts = async () => {
    // Ignore responses from an earlier tab if the user switched tabs mid-load.
    const id = ++fetchId.current;
    setLoading(true); setLoadError(false);
    try {
      let rows;
      if (showMyPosts) {
        rows = isHost
          ? (await postsService.getMyHostPosts()).map((p) => mapHostPost(p, user?.name))
          : (await postsService.getMyGuestPosts()).map((p) => mapGuestPost(p, user?.name));
      } else {
        rows = isHost
          ? (await postsService.getGuestPosts()).map((p) => mapGuestPost(p))
          : (await postsService.getHostPosts()).map((p) => mapHostPost(p));
      }
      if (id === fetchId.current) setPosts(rows);
    } catch (error) {
      console.error('Error fetching posts:', error);
      if (id === fetchId.current) { setPosts([]); setLoadError(true); }
    } finally {
      if (id === fetchId.current) setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchPosts(); }, [showMyPosts]);

  // Your chats and stays mark the cards of people you're already in touch with ("Messaged", "Confirmed"…).
  // Loaded again each time a chat closes, so a message you just sent shows up.
  const chatOpen = !!activeChat;
  useEffect(() => {
    if (!user?.userId || chatOpen) return undefined;
    let live = true;
    Promise.allSettled([api.get('chat/conversations'), api.get('stays/trips')]).then(([chats, stays]) => {
      if (live) setContacts(contactStatus(user.userId, chats.value?.data || [], stays.value?.data || []));
    });
    return () => { live = false; };
  }, [user?.userId, chatOpen]);

  useEffect(() => {
    locationService.getLocations().then(setLocationData).catch(() => {});
  }, []);

  // Browser back closes the profile popup (its URL is pushed on open).
  useEffect(() => {
    const handlePopState = () => { if (!window.location.pathname.startsWith('/profile/')) setProfile(null); };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const anyDialogOpen = form.open || !!deletingPost || showHowItWorks || !!profile || !!detail;
  useEffect(() => {
    document.body.style.overflow = anyDialogOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [anyDialogOpen]);

  // ── Derived lists ──
  const hostingCities = useMemo(() => (user?.hostingAreas || []).flatMap((a) => a.cities || []), [user]);
  // A host's search starts as "all trip requests in my cities, any time"; a guest's starts empty (the question card).
  const activeNeed = useMemo(() => (showMyPosts ? null : isHost ? (need || { what: 'any', cities: hostingCities, when: 'any' }) : need), [showMyPosts, isHost, need, hostingCities]);
  const needCities = !activeNeed ? [] : isHost ? activeNeed.cities : activeNeed.city ? [activeNeed.city] : [];
  // A guest's own trips, so the search knows when it's already posted (the same rule the API uses to refuse a duplicate:
  // same place, same day or both flexible, same need). Loaded again when the post form closes.
  const [myTrips, setMyTrips] = useState([]);
  useEffect(() => {
    if (isHost || !user || form.open) return;
    postsService.getMyGuestPosts().then((rows) => setMyTrips(rows)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, form.open]);
  const postedTrip = !isHost && need?.city && myTrips.find((p) => (p.needType || 'stay') === need.what
    && (p.location || '').split(',')[0].trim().toLowerCase() === need.city.toLowerCase()
    && String(p.planningDate || p.visitingDate || '').slice(0, 10) === (need.date || ''));
  const saveNeed = (n) => { setNeed(n); setEditingNeed(false); localStorage.setItem(needKey, JSON.stringify(n)); window.scrollTo(0, 0); };

  // Sponsored cards for the cities being browsed, else the member's own city and hosting cities.
  const [ads, setAds] = useState([]);
  const adCities = [...new Set(needCities.length ? needCities : [...citiesInLocation(user?.location), ...hostingCities])].join(',');
  useEffect(() => {
    let live = true;
    api.get('sponsored', { params: { cities: adCities } }).then((r) => { if (live) setAds(Array.isArray(r.data) ? r.data : []); }).catch(() => {});
    return () => { live = false; };
  }, [adCities]);

  // Everything the search asks except the city (the map counts per city from this), then the city.
  const baseFiltered = useMemo(() => posts.filter((p) => {
    if (!activeNeed) return true;
    if (isHost) {
      if (activeNeed.what === 'stay' && p.needType === 'guide') return false;
      if (activeNeed.what === 'guide' && p.needType === 'stay') return false;
      if (activeNeed.when !== 'any') {
        const d = daysUntil(p.planningDate);
        if (d === null || d < 0) return false;
        if (activeNeed.when === 'week' && d > 6) return false;
        if (activeNeed.when === 'month' && d > 30) return false;
        if (activeNeed.when === 'later' && d <= 30) return false;
      }
      return true;
    }
    if ((p.maxGuests || 1) < activeNeed.people) return false; // room for everyone
    if (activeNeed.date && p.commenceDate && String(p.commenceDate).slice(0, 10) > activeNeed.date) return false; // free by then
    if (priceFilter && !(p.pricePerNight > 0 && p.pricePerNight <= priceFilter)) return false;
    return true;
  }), [posts, activeNeed, isHost, priceFilter]);

  const cityKey = needCities.join('|');
  const results = useMemo(() => {
    const cities = cityKey ? cityKey.split('|') : [];
    const list = cities.length
      ? baseFiltered.filter((p) => cities.some((loc) => p.location?.toLowerCase().includes(loc.toLowerCase())))
      : baseFiltered;
    return [...list].sort(SORTERS[effectiveSort]);
  }, [baseFiltered, cityKey, effectiveSort]);

  const cityCounts = useMemo(() => {
    const counts = {};
    for (const p of baseFiltered) for (const city of new Set(citiesInLocation(p.location))) if (CITY_COORDS[city]) counts[city] = (counts[city] || 0) + 1;
    return counts;
  }, [baseFiltered]);

  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86400000;
    const cities = new Set(posts.flatMap((p) => citiesInLocation(p.location)).filter((ci) => CITY_COORDS[ci]));
    return { total: posts.length, fresh: posts.filter((p) => p.createdAt.getTime() > weekAgo).length, cities: cities.size };
  }, [posts]);

  const filtersActive = !!activeNeed || !!priceFilter;

  // ── Actions ──
  // The map picks cities too: a guest's one city (tap again for anywhere), a host's set.
  const toggleLocation = (city) => saveNeed(isHost
    ? { ...activeNeed, cities: activeNeed.cities.includes(city) ? activeNeed.cities.filter((l) => l !== city) : [...activeNeed.cities, city] }
    : { ...activeNeed, city: activeNeed.city === city ? '' : city });
  const allCities = useMemo(() => [...new Set([...hostingCities, ...Object.values(locationData).flat()])].filter((ci) => ci && ci !== 'Other').sort(), [hostingCities, locationData]);

  const switchTab = (mine) => { if (mine !== showMyPosts) { setShowMyPosts(mine); setSort(null); } };

  const openCreate = () => setForm({ open: true, key: Date.now(), kind: isHost ? 'Host' : 'Guest', isEditing: false, initialData: null });
  // "Post this trip": the trip form, filled in from the guest's search.
  const postFromNeed = () => {
    const state = Object.keys(locationData).find((st) => locationData[st]?.includes(need.city));
    setForm({ open: true, key: Date.now(), kind: 'Guest', isEditing: false, initialData: {
      needType: need.what, planningDate: need.date || null, location: state ? `${need.city}, ${state}` : '', visitors: need.people, days: need.nights } });
  };
  const openEdit = (post) => setForm({ open: true, key: Date.now(), kind: post.userType, isEditing: true, initialData: post });
  const closeForm = () => setForm((f) => ({ ...f, open: false }));

  // Rejects on failure so the form can show the error inline.
  const submitForm = async (payload) => {
    if (form.isEditing) {
      const post = form.initialData;
      if (post.userType === 'Guest') await postsService.updateGuestPost(post.id, { ...payload, planningDate: payload.planningDate ? toDate(payload.planningDate) : null });
      else await postsService.updateHostPost(post.id, payload);
      closeForm();
      showToast(post.userType === 'Guest' ? 'Trip updated' : 'Listing updated');
      fetchPosts();
      return;
    }
    const postWithUser = {
      ...payload,
      userName: user?.name || 'Unknown User',
      userId: user?.userId || user?.id,
      planningDate: payload.planningDate ? toDate(payload.planningDate) : null,
    };
    if (user?.userType === 'Guest') await postsService.createGuestPost(postWithUser);
    else await postsService.createHostPost(postWithUser);
    closeForm();
    showToast(isHost ? 'Your listing is live 🎉' : 'Your trip is posted 🎉');
    if (showMyPosts) fetchPosts(); else setShowMyPosts(true);
  };

  const confirmDelete = async () => {
    if (!deletingPost) return;
    setDeleting(true);
    try {
      if (deletingPost.userType === 'Guest') await postsService.deleteGuestPost(deletingPost.id);
      else await postsService.deleteHostPost(deletingPost.id);
      setDeletingPost(null);
      showToast('Post deleted');
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      showToast('Failed to delete post. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const openProfile = (post) => {
    setProfile({ userName: post.userName, userId: post.userId });
    // The URL reflects the popup so it's shareable; backgroundLocation keeps
    // App.jsx rendering Posts underneath while it's open.
    if (post.userName) navigate(`/profile/${encodeURIComponent(post.userName)}`, { state: { backgroundLocation: location } });
  };
  const closeProfile = () => { setProfile(null); navigate(-1); };

  // about: the post it's opened from, so the message says "About: (title)" and the traveller sees who got in touch about their trip.
  const openChat = (id, name, about = null) => {
    setActiveChat(null);
    setTimeout(() => setActiveChat({ id, name, imageUrl: null, about }), 50);
  };
  const aboutPost = (p) => ({ postId: p.id, kind: p.userType === 'Guest' ? 'trip' : 'listing', title: p.title });

  // A host opening a trip in full, or offering on it, counts as a view on the traveller's My posts.
  // Once per trip on this browser; only the total is kept on the server.
  const countView = (p) => {
    if (!isHost || p.userType !== 'Guest' || p.userId === user?.userId) return;
    const key = `fg-viewed:${user?.userId}`;
    try {
      const seen = JSON.parse(localStorage.getItem(key) || '[]');
      if (seen.includes(p.id)) return;
      localStorage.setItem(key, JSON.stringify([...seen, p.id].slice(-300)));
    } catch { /* no storage: count it anyway */ }
    api.post(`guestposts/${encodeURIComponent(p.id)}/view`).catch(() => {});
  };
  const openDetail = (p) => { setDetail(p); countView(p); };
  const contactAbout = (p) => { countView(p); openChat(p.userId, p.userName, aboutPost(p)); };

  // ── View helpers ──
  const hour = new Date().getHours();
  const greeting = hour < 12 ? c.morning : hour < 17 ? c.afternoon : c.evening;
  const firstName = (user?.name || '').split(' ')[0];
  // Next to the greeting: what's on the board, or how many match once filters are on.
  const subtitle = filtersActive || showMyPosts
    ? (results.length === 1 ? c.oneResult : fmt(c.results, { n: results.length }))
    : [fmt(c.statAvailable, { n: stats.total }), stats.fresh > 0 && fmt(c.statNew, { n: stats.fresh }),
      stats.cities > 0 && (stats.cities === 1 ? c.statCity : fmt(c.statCities, { n: stats.cities }))].filter(Boolean).join(' · ');
  const priceChips = [[0, c.anyPrice], [500, c.under500], [1000, c.under1000], [2000, c.under2000]];
  const askingGuest = !isHost && !showMyPosts && !need; // first visit: just the questions
  const showNudge = !isHost && !!activeNeed && !loading && !loadError && (results.length < 3 || activeNeed.what === 'guide');
  const sortOptions = viewingTrips ? [['soonest', c.sortSoonest], ['newest', c.sortNewest]] : [['newest', c.sortNewest], ['price', c.sortPrice]];

  // Ad spots: advertisers' cards first; our own cards fill whatever is left.
  const houseCards = [
    { id: 'house-invite', icon: Gift, title: c.houseInviteTitle, text: c.houseInviteText, cta: c.houseInviteCta, onClick: () => setShowInvite(true) },
    { id: 'house-advertise', icon: Megaphone, title: c.houseAdTitle, text: c.houseAdText, cta: c.houseAdCta, href: 'mailto:customer-support@festiveguest.com?subject=Advertising%20on%20FestiveGuest' },
  ];
  const railCards = [...ads.slice(0, 2), ...houseCards].slice(0, 2);
  const feedCards = ads.length ? ads : houseCards;
  const adCard = (card) => (card.icon
    ? <HouseCard key={card.id} card={card} label={c.houseLabel} />
    : <SponsoredCard key={card.id} ad={card} label={c.sponsored} visit={c.sponsoredVisit} />);

  const emptyState = () => {
    if (isHost && activeNeed) {
      return { icon: <Compass size={28} />, title: c.hostEmptyNeedTitle, text: c.hostEmptyNeedText, action: <button type="button" className="rg-btn rg-btn-ghost" onClick={() => setEditingNeed(true)}>{c.edit}</button> };
    }
    if (showMyPosts) {
      return { icon: <Sparkles size={28} />, title: isHost ? c.emptyMineHost : c.emptyMineGuest, text: c.emptyMineText, action: <button type="button" className="rg-btn rg-btn-primary pb-inline-btn" onClick={openCreate}><Plus size={17} /> {isHost ? c.ctaHost : c.ctaGuest}</button> };
    }
    return isHost
      ? { icon: <MapPin size={28} />, title: c.emptyHostTitle, text: c.emptyHostText, action: <button type="button" className="rg-btn rg-btn-ghost" onClick={openCreate}><Plus size={17} /> {c.ctaHost}</button> }
      : { icon: <MapPin size={28} />, title: c.emptyGuestTitle, text: c.emptyGuestText, action: <button type="button" className="rg-btn rg-btn-primary pb-inline-btn" onClick={openCreate}><Plus size={17} /> {c.ctaGuest}</button> };
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="pb">
        <div className="rg-aurora" aria-hidden="true"><span className="a1" /><span className="a2" /><span className="a3" /></div>

        <div className="pb-shell">
          <div className="pb-top">
            {/* ═════ Greeting, tabs and actions ═════ */}
            <motion.section className="pb-hero" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
              <div className="pb-hero-text">
                <h1>{greeting}{firstName && <>, <span className="pb-grad">{firstName}</span></>}</h1>
                {!loading && <p>{subtitle}</p>}
              </div>
              <div className="pb-hero-actions">
                <div className="rg-seg pb-tabs">
                  {[[false, isHost ? c.tabExploreHost : c.tabExploreGuest], [true, c.tabMine]].map(([mine, label]) => (
                    <button key={String(mine)} type="button" aria-pressed={showMyPosts === mine} onClick={() => switchTab(mine)}>
                      {showMyPosts === mine && <motion.span layoutId="pb-tab-pill" className="rg-seg-pill" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
                      {label}
                    </button>
                  ))}
                </div>
                <button type="button" className="pb-howto" onClick={() => setShowHowItWorks(true)} title={c.howTitle}><HelpCircle size={16} /> <span className="pb-howto-label">{c.howTitle}</span></button>
                <button type="button" className="rg-btn rg-btn-primary pb-cta" onClick={openCreate}><Plus size={17} /> {isHost ? c.ctaHost : c.ctaGuest}</button>
              </div>
            </motion.section>

            <VerifyPhoneBanner />
          </div>

          <main className="pb-main">
            {askingGuest ? (
              <NeedCard c={c} cities={allCities} onSubmit={saveNeed} />
            ) : <>
            {activeNeed && editingNeed && (isHost
              ? <HostNeedCard c={c} initial={activeNeed} hostingCities={hostingCities} onSubmit={saveNeed} onCancel={() => setEditingNeed(false)} />
              : <NeedCard c={c} initial={activeNeed} cities={allCities} onSubmit={saveNeed} onCancel={() => setEditingNeed(false)} />)}

            {/* ═════ Toolbar: the search in one line, then price (guests), sort and view ═════ */}
            <div className="pb-toolbar">
              {activeNeed && !editingNeed && <NeedSummary c={c} need={activeNeed} isHost={isHost} locale={locale} onEdit={() => setEditingNeed(true)} />}
              <div className="pb-toolbar-row">
                {!viewingTrips && !showMyPosts && (
                  <div className="pb-quick" role="group" aria-label={c.anyPrice}>
                    {priceChips.map(([value, label]) => (
                      <button key={value} type="button" className={`pb-chip${priceFilter === value ? ' is-on' : ''}`} aria-pressed={priceFilter === value} onClick={() => setPriceFilter(value)}>{label}</button>
                    ))}
                  </div>
                )}
                <div className="pb-toolbar-end">
                  <SortMenu value={effectiveSort} options={sortOptions} onChange={setSort} />
                  <div className="pb-view" role="group" aria-label="View">
                    <button type="button" aria-pressed={view === 'cards'} onClick={() => setView('cards')} title={c.cards} aria-label={c.cards}><LayoutGrid size={16} /></button>
                    <button type="button" aria-pressed={view === 'map'} onClick={() => setView('map')} title={c.map} aria-label={c.map}><MapIcon size={16} /></button>
                  </div>
                </div>
              </div>
            </div>

            {/* A guide request, or few/no hosts: offer to post the search as a trip, above the results */}
            {showNudge && <PostTripNudge c={c} need={activeNeed} big={results.length === 0} posted={!!postedTrip} onPost={postFromNeed} onOpenPosted={() => setShowMyPosts(true)} />}

            {/* ═════ Results ═════ */}
            {loadError ? (
              <div className="pb-empty">
                <span className="pb-empty-icon"><AlertTriangle size={28} /></span>
                <h2>{c.loadError}</h2>
                <button type="button" className="rg-btn rg-btn-ghost" onClick={fetchPosts}><RefreshCw size={16} /> {c.retry}</button>
              </div>
            ) : loading ? (
              <div className="pb-grid">{Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}</div>
            ) : view === 'map' ? (
              <>
                <CityMap counts={cityCounts} selected={needCities} onToggle={toggleLocation} c={c} />
                {needCities.length > 0 && results.length > 0 && (
                  <div className={`pb-grid pb-grid--below-map${viewingTrips ? ' pb-grid--tickets' : ''}`}>
                    {results.map((post, i) => (
                      <PostCard key={post.id} index={i} post={post} c={c} locale={locale} focusCities={needCities} isOwn={user && post.userId === user.userId} contact={contacts[post.userId]}
                        onOpen={openDetail} onContact={contactAbout} onChatWith={(id, name, p) => openChat(id, name, aboutPost(p))} contacts={contacts} onProfile={openProfile} onEdit={openEdit} onDelete={setDeletingPost} />
                    ))}
                  </div>
                )}
              </>
            ) : results.length === 0 && showNudge ? null : results.length === 0 ? (() => {
              const e = emptyState();
              return (
                <motion.div className="pb-empty" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <span className="pb-empty-icon">{e.icon}</span>
                  <h2>{e.title}</h2>
                  <p>{e.text}</p>
                  {e.action}
                </motion.div>
              );
            })() : (
              <div className={`pb-grid${viewingTrips ? ' pb-grid--tickets' : ''}`}>
                {results.map((post, i) => {
                  // Below 1100px (no right column): an ad after every 6 posts, or after the last one when there are fewer.
                  const slot = (i + 1) % 6 === 0 ? (i + 1) / 6 - 1 : results.length < 6 && i === results.length - 1 ? 0 : -1;
                  const ad = !showMyPosts && slot >= 0 ? feedCards[slot % feedCards.length] : null;
                  return (
                    <Fragment key={post.id}>
                      <PostCard index={i} post={post} c={c} locale={locale} focusCities={needCities} isOwn={user && post.userId === user.userId} contact={contacts[post.userId]}
                        onOpen={openDetail} onContact={contactAbout} onChatWith={(id, name, p) => openChat(id, name, aboutPost(p))} contacts={contacts} onProfile={openProfile} onEdit={openEdit} onDelete={setDeletingPost} />
                      {ad && adCard(ad)}
                    </Fragment>
                  );
                })}
              </div>
            )}
            </>}
          </main>

          {/* ═════ Right column (1100px and up): two ads, topped up with our own cards ═════ */}
          <aside className="pb-rail" aria-label={c.sponsored}>
            {/* "Your upcoming trip" / "Your next guest" tops the right column (above the posts on smaller screens) */}
            {user && !showMyPosts && <UpcomingTrip meId={user.userId} isHost={isHost} />}
            {railCards.map(adCard)}
          </aside>
        </div>

        {/* Mobile: create button always within reach (not over the first-visit questions, whose button is the action) */}
        {!activeChat && !askingGuest && (
          <button type="button" className="pb-fab" onClick={openCreate} aria-label={isHost ? c.ctaHost : c.ctaGuest}><Plus size={24} /></button>
        )}

        {activeChat && (
          <div className="pb-chat-window">
            <ChatWidget recipientId={activeChat.id} recipientName={activeChat.name} recipientImageUrl={activeChat.imageUrl} about={activeChat.about} onClose={() => setActiveChat(null)} />
          </div>
        )}


        {/* ═════ Dialogs ═════ */}
        <PostFormModal key={form.key} open={form.open} kind={form.kind} isEditing={form.isEditing} initialData={form.initialData}
          user={user} locationData={locationData} onClose={closeForm} onSubmit={submitForm} />

        <GlassDialog open={!!deletingPost} onClose={() => setDeletingPost(null)} size="sm"
          icon={<Trash2 size={18} style={{ color: '#fca5a5' }} />} title={t('deletePost')}
          footer={(
            <>
              <button type="button" className="rg-btn rg-btn-ghost" onClick={() => setDeletingPost(null)} disabled={deleting}>{t('cancel')}</button>
              <button type="button" className="rg-btn pb-btn-danger" onClick={confirmDelete} disabled={deleting}>{deleting ? '…' : t('delete')}</button>
            </>
          )}>
          {deletingPost && (
            <p className="rg-modal-text">{t('areYouSureDelete')} <strong>“{deletingPost.title}”</strong>? {t('thisActionCannotBeUndone')}</p>
          )}
        </GlassDialog>

        {showInvite && <InviteFriendsModal user={user} onClose={() => setShowInvite(false)} />}

        <GlassDialog open={showHowItWorks} onClose={() => setShowHowItWorks(false)} size="md"
          icon={<HelpCircle size={18} style={{ color: '#ffc163' }} />} title={c.howTitle}
          footer={<button type="button" className="rg-btn rg-btn-primary" onClick={() => setShowHowItWorks(false)}>{c.gotIt}</button>}>
          <ol className="pb-how">
            {(isHost ? c.howHost : c.howGuest).map(([title, text], i) => (
              <li key={title}><span className="pb-how-num">{i + 1}</span><div><strong>{title}</strong><p>{text}</p></div></li>
            ))}
          </ol>
        </GlassDialog>

        <GlassDialog open={!!detail} onClose={() => setDetail(null)} size="md" title={detail?.userType === 'Host' ? c.detailHost : c.detailTrip}>
          {detail && (
            <PostCard post={detail} c={c} locale={locale} full isOwn={user && detail.userId === user.userId} contact={contacts[detail.userId]}
              onContact={(p) => { setDetail(null); contactAbout(p); }}
              onChatWith={(id, name, p) => { setDetail(null); openChat(id, name, aboutPost(p)); }} contacts={contacts}
              onProfile={(p) => { setDetail(null); openProfile(p); }}
              onEdit={(p) => { setDetail(null); openEdit(p); }}
              onDelete={(p) => { setDetail(null); setDeletingPost(p); }} />
          )}
        </GlassDialog>

        <ProfileModal key={profile?.userId || 'none'} open={!!profile} userId={profile?.userId} userName={profile?.userName} onClose={closeProfile} onBlockChange={fetchPosts} />
      </div>
    </MotionConfig>
  );
};

export default Posts;
