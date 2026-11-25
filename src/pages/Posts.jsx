import { Fragment, useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import {
  Plus, Search, X, LayoutGrid, Map as MapIcon, HelpCircle, Gift, Megaphone,
  MapPin, Sparkles, RefreshCw, Trash2, CheckCircle2, AlertTriangle, Compass,
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
import UpcomingTrip from '../components/UpcomingTrip';
import PostFormModal from '../components/posts/PostFormModal';
import ProfileModal from '../components/posts/ProfileModal';
import GlassDialog from '../components/posts/GlassDialog';
import VerifyPhoneBanner from '../components/VerifyPhoneBanner';
import SponsoredCard, { HouseCard } from '../components/SponsoredCard';
import InviteFriendsModal from '../components/InviteFriendsModal';
import api from '../utils/api';
import { CITY_COORDS } from '../components/posts/cityCoords';
import { fmt, daysUntil, citiesInLocation, splitCsv } from '../components/posts/postUtils';
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

  const [query, setQuery] = useState('');
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [timeFilter, setTimeFilter] = useState('any');
  const [priceFilter, setPriceFilter] = useState(0);
  const [guideOnly, setGuideOnly] = useState(false);
  const [sort, setSort] = useState(null);
  const [view, setView] = useState('cards');
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);

  const [form, setForm] = useState({ open: false, key: 0 });
  const [deletingPost, setDeletingPost] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [profile, setProfile] = useState(null);
  const [detail, setDetail] = useState(null); // post opened in full
  const [activeChat, setActiveChat] = useState(null);
  const [toast, setToast] = useState(null);
  const fetchId = useRef(0);
  const searchWrap = useRef(null);

  // Trip requests (guest posts) are what hosts browse and what guests own.
  const viewingTrips = showMyPosts ? !isHost : isHost;
  const effectiveSort = sort || (viewingTrips ? 'soonest' : 'newest');

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  };
  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

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

  useEffect(() => {
    const close = (e) => { if (!searchWrap.current?.contains(e.target)) setSuggestOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // ── Derived lists ──
  const hostingCities = useMemo(() => (user?.hostingAreas || []).flatMap((a) => a.cities || []), [user]);

  // Sponsored cards for the cities being browsed, else the member's own city and hosting cities.
  const [ads, setAds] = useState([]);
  const adCities = [...new Set(selectedLocations.length ? selectedLocations : [...citiesInLocation(user?.location), ...hostingCities])].join(',');
  useEffect(() => {
    let live = true;
    api.get('sponsored', { params: { cities: adCities } }).then((r) => { if (live) setAds(Array.isArray(r.data) ? r.data : []); }).catch(() => {});
    return () => { live = false; };
  }, [adCities]);

  const baseFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (q && ![p.title, p.content, p.location, p.userName].some((v) => v?.toLowerCase().includes(q))) return false;
      if (viewingTrips && guideOnly && p.needType === 'stay') return false;
      if (viewingTrips && timeFilter !== 'any') {
        const d = daysUntil(p.planningDate);
        if (d === null || d < 0) return false;
        if (timeFilter === 'week' && d > 6) return false;
        if (timeFilter === 'month' && d > 30) return false;
        if (timeFilter === 'later' && d <= 30) return false;
      }
      if (!viewingTrips && priceFilter && !(p.pricePerNight > 0 && p.pricePerNight <= priceFilter)) return false;
      return true;
    });
  }, [posts, query, viewingTrips, timeFilter, priceFilter, guideOnly]);

  const results = useMemo(() => {
    const list = selectedLocations.length
      ? baseFiltered.filter((p) => selectedLocations.some((loc) => p.location?.toLowerCase().includes(loc.toLowerCase())))
      : baseFiltered;
    return [...list].sort(SORTERS[effectiveSort]);
  }, [baseFiltered, selectedLocations, effectiveSort]);

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

  const suggestions = useMemo(() => {
    const all = [...new Set([...hostingCities, ...Object.values(locationData).flat()])].filter((ci) => ci && ci !== 'Other' && !selectedLocations.includes(ci));
    const q = query.trim().toLowerCase();
    const list = q
      ? all.filter((ci) => ci.toLowerCase().includes(q))
      : all.filter((ci) => cityCounts[ci]).sort((a, b) => cityCounts[b] - cityCounts[a]);
    return list.slice(0, 6);
  }, [hostingCities, locationData, selectedLocations, query, cityCounts]);

  const filtersActive = query || selectedLocations.length || timeFilter !== 'any' || priceFilter || guideOnly;

  // ── Actions ──
  const toggleLocation = (city) => setSelectedLocations((prev) => (prev.includes(city) ? prev.filter((l) => l !== city) : [...prev, city]));
  const addCity = (city) => { if (!selectedLocations.includes(city)) setSelectedLocations((p) => [...p, city]); setQuery(''); setSuggestOpen(false); };
  const clearFilters = () => { setQuery(''); setSelectedLocations([]); setTimeFilter('any'); setPriceFilter(0); setGuideOnly(false); };
  const allHostingSelected = hostingCities.length > 0 && hostingCities.every((ci) => selectedLocations.includes(ci));
  const toggleHostingAreas = () => setSelectedLocations(allHostingSelected ? selectedLocations.filter((ci) => !hostingCities.includes(ci)) : [...new Set([...selectedLocations, ...hostingCities])]);

  const switchTab = (mine) => { if (mine !== showMyPosts) { setShowMyPosts(mine); setSort(null); } };

  const openCreate = () => setForm({ open: true, key: Date.now(), kind: isHost ? 'Host' : 'Guest', isEditing: false, initialData: null });
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

  const openChat = (id, name) => {
    setActiveChat(null);
    setTimeout(() => setActiveChat({ id, name, imageUrl: null }), 50);
  };

  const onSearchKey = (e) => {
    if (!suggestOpen || !suggestions.length) { if (e.key === 'ArrowDown') setSuggestOpen(true); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveSuggestion((i) => (i + 1) % suggestions.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveSuggestion((i) => (i - 1 + suggestions.length) % suggestions.length); }
    else if (e.key === 'Enter' && query.trim()) { e.preventDefault(); addCity(suggestions[activeSuggestion] || suggestions[0]); }
    else if (e.key === 'Escape') setSuggestOpen(false);
  };

  // ── View helpers ──
  const hour = new Date().getHours();
  const greeting = hour < 12 ? c.morning : hour < 17 ? c.afternoon : c.evening;
  const firstName = (user?.name || '').split(' ')[0];
  // Next to the greeting: what's on the board, or how many match once filters are on.
  const subtitle = filtersActive || showMyPosts
    ? (results.length === 1 ? c.oneResult : fmt(c.results, { n: results.length }))
    : [fmt(c.statAvailable, { n: stats.total }), stats.fresh > 0 && fmt(c.statNew, { n: stats.fresh }),
      stats.cities > 0 && (stats.cities === 1 ? c.statCity : fmt(c.statCities, { n: stats.cities }))].filter(Boolean).join(' · ');
  const quickFilters = viewingTrips
    ? [['any', c.any], ['week', c.thisWeek], ['month', c.thisMonth], ['later', c.later]]
    : [[0, c.anyPrice], [500, c.under500], [1000, c.under1000], [2000, c.under2000]];
  const quickValue = viewingTrips ? timeFilter : priceFilter;
  const setQuick = viewingTrips ? setTimeFilter : setPriceFilter;
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
    if (filtersActive && posts.length) {
      return { icon: <Compass size={28} />, title: c.emptyFilteredTitle, text: c.emptyFilteredText, action: <button type="button" className="rg-btn rg-btn-ghost" onClick={clearFilters}>{c.clearAll}</button> };
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
                <button type="button" className="pb-howto" onClick={() => setShowHowItWorks(true)}><HelpCircle size={16} /> {c.howTitle}</button>
                <button type="button" className="rg-btn rg-btn-primary pb-cta" onClick={openCreate}><Plus size={17} /> {isHost ? c.ctaHost : c.ctaGuest}</button>
              </div>
            </motion.section>

            <VerifyPhoneBanner />
            {user && !showMyPosts && <UpcomingTrip meId={user.userId} isHost={isHost} />}
          </div>

          <main className="pb-main">
            {/* ═════ Toolbar: search, filters, sort and view in one wrapping row ═════ */}
            <div className="pb-toolbar">
              <div className="pb-search" ref={searchWrap}>
                <Search size={16} className="pb-search-icon" aria-hidden="true" />
                <input
                  type="search" value={query} placeholder={c.search} aria-label={c.search}
                  role="combobox" aria-expanded={suggestOpen && suggestions.length > 0} aria-controls="pb-suggest" aria-autocomplete="list"
                  onChange={(e) => { setQuery(e.target.value); setSuggestOpen(true); setActiveSuggestion(0); }}
                  onFocus={() => setSuggestOpen(true)} onKeyDown={onSearchKey}
                />
                {query && <button type="button" className="pb-search-clear" onClick={() => setQuery('')} aria-label="Clear search"><X size={16} /></button>}
                <AnimatePresence>
                  {suggestOpen && suggestions.length > 0 && (
                    <motion.ul id="pb-suggest" role="listbox" className="pb-suggest"
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                      <li className="pb-suggest-head" role="presentation">{c.citiesHeading}</li>
                      {suggestions.map((city, i) => (
                        <li key={city} role="option" aria-selected={i === activeSuggestion}
                          className={i === activeSuggestion ? 'is-active' : ''}
                          onMouseEnter={() => setActiveSuggestion(i)}
                          onMouseDown={(e) => { e.preventDefault(); addCity(city); }}>
                          <MapPin size={14} /> <span>{city}</span>
                          {cityCounts[city] > 0 && <span className="pb-suggest-n">{cityCounts[city]}</span>}
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>

              <div className="pb-toolbar-row">
                <div className="pb-quick" role="group" aria-label={viewingTrips ? c.any : c.anyPrice}>
                  {isHost && !showMyPosts && hostingCities.length > 0 && (
                    <button type="button" className={`pb-chip pb-chip--accent${allHostingSelected ? ' is-on' : ''}`} aria-pressed={allHostingSelected} onClick={toggleHostingAreas}>
                      <MapPin size={13} /> {c.myAreas}
                    </button>
                  )}
                  {viewingTrips && (
                    <button type="button" className={`pb-chip pb-chip--guide${guideOnly ? ' is-on' : ''}`} aria-pressed={guideOnly} onClick={() => setGuideOnly((v) => !v)}>
                      <span aria-hidden="true">🧭</span> {c.filterGuide}
                    </button>
                  )}
                  {quickFilters.map(([value, label]) => (
                    <button key={value} type="button" className={`pb-chip${quickValue === value ? ' is-on' : ''}`} aria-pressed={quickValue === value} onClick={() => setQuick(value)}>{label}</button>
                  ))}
                </div>
                <div className="pb-toolbar-end">
                  <SortMenu value={effectiveSort} options={sortOptions} onChange={setSort} />
                  <div className="pb-view" role="group" aria-label="View">
                    <button type="button" aria-pressed={view === 'cards'} onClick={() => setView('cards')} title={c.cards} aria-label={c.cards}><LayoutGrid size={16} /></button>
                    <button type="button" aria-pressed={view === 'map'} onClick={() => setView('map')} title={c.map} aria-label={c.map}><MapIcon size={16} /></button>
                  </div>
                </div>
              </div>

              {selectedLocations.length > 0 && (
                <div className="pb-selected">
                  {selectedLocations.map((city) => (
                    <button key={city} type="button" className="pb-chip is-on pb-chip--removable" onClick={() => toggleLocation(city)} aria-label={`Remove ${city}`}>
                      <MapPin size={13} /> {city} <X size={13} />
                    </button>
                  ))}
                  <button type="button" className="rg-link-btn" onClick={clearFilters}>{c.clearAll}</button>
                </div>
              )}
            </div>

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
                <CityMap counts={cityCounts} selected={selectedLocations} onToggle={toggleLocation} c={c} />
                {selectedLocations.length > 0 && results.length > 0 && (
                  <div className={`pb-grid pb-grid--below-map${viewingTrips ? ' pb-grid--tickets' : ''}`}>
                    {results.map((post, i) => (
                      <PostCard key={post.id} index={i} post={post} c={c} locale={locale} isOwn={user && post.userId === user.userId}
                        onOpen={setDetail} onContact={(p) => openChat(p.userId, p.userName)} onProfile={openProfile} onEdit={openEdit} onDelete={setDeletingPost} />
                    ))}
                  </div>
                )}
              </>
            ) : results.length === 0 ? (() => {
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
                  // Below 1280px (no right column): an ad after every 6 posts, or after the last one when there are fewer.
                  const slot = (i + 1) % 6 === 0 ? (i + 1) / 6 - 1 : results.length < 6 && i === results.length - 1 ? 0 : -1;
                  const ad = !showMyPosts && slot >= 0 ? feedCards[slot % feedCards.length] : null;
                  return (
                    <Fragment key={post.id}>
                      <PostCard index={i} post={post} c={c} locale={locale} isOwn={user && post.userId === user.userId}
                        onOpen={setDetail} onContact={(p) => openChat(p.userId, p.userName)} onProfile={openProfile} onEdit={openEdit} onDelete={setDeletingPost} />
                      {ad && adCard(ad)}
                    </Fragment>
                  );
                })}
              </div>
            )}
          </main>

          {/* ═════ Right column (1280px and up): two ads, topped up with our own cards ═════ */}
          <aside className="pb-rail" aria-label={c.sponsored}>
            {railCards.map(adCard)}
          </aside>
        </div>

        {/* Mobile: create button always within reach */}
        {!activeChat && (
          <button type="button" className="pb-fab" onClick={openCreate} aria-label={isHost ? c.ctaHost : c.ctaGuest}><Plus size={24} /></button>
        )}

        {activeChat && (
          <div className="pb-chat-window">
            <ChatWidget recipientId={activeChat.id} recipientName={activeChat.name} recipientImageUrl={activeChat.imageUrl} onClose={() => setActiveChat(null)} />
          </div>
        )}

        <AnimatePresence>
          {toast && (
            <motion.div key={toast.id} className={`rg-toast is-${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}
              initial={{ x: 120, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 120, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}>
              <span className="rg-toast-icon">{toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}</span>
              <span>{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

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
            <PostCard post={detail} c={c} locale={locale} full isOwn={user && detail.userId === user.userId}
              onContact={(p) => { setDetail(null); openChat(p.userId, p.userName); }}
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
