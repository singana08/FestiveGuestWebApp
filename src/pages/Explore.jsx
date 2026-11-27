import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, MotionConfig } from 'framer-motion';
import { MapPin, X, Star, Check, ShieldCheck, Users, MessageCircle, Megaphone, Home as HomeIcon, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import DisclaimerModal from '../components/DisclaimerModal';
import { LoadError } from '../components/Feedback';
import { useLanguage } from '../i18n/LanguageContext';
import { homeCopy } from '../i18n/homeCopy';
import { fmt, citiesInLocation, iconFor } from '../components/posts/postUtils';
import useSEO from '../hooks/useSEO';
import '../styles/Home.css';

const EASE = [0.22, 1, 0.36, 1];
const same = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Browse hosts before joining. The server sends a brief, cached preview (api/public/preview): each listing's first name,
 * place, price, one photo and rating, plus how many upcoming trips each city has — never who is travelling or when.
 * Anything past looking (messaging, profiles, posting) opens the same sign-up as the home page.
 */
export default function Explore() {
  const { language } = useLanguage();
  const home = homeCopy[language] || homeCopy.en;
  const e = home.explore;
  useSEO({ title: e.seoTitle, description: e.seoDesc });

  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [city, setCity] = useState('');
  const [joinAs, setJoinAs] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    api.get('public/preview').then((r) => setData(r.data)).catch(() => setFailed(true));
  }, [attempt]);
  const retry = () => { setFailed(false); setAttempt((n) => n + 1); };

  const hosts = useMemo(() => (data?.hosts || []).map((h) => ({ ...h, cities: citiesInLocation(h.location) })), [data]);
  const cities = useMemo(
    () => [...new Set([...hosts.flatMap((h) => h.cities), ...(data?.trips || []).map((t) => t.city)])].sort((a, b) => a.localeCompare(b)),
    [hosts, data],
  );
  const wanted = city.trim();
  const shown = wanted ? hosts.filter((h) => h.cities.some((c) => same(c, wanted)) || h.location.toLowerCase().includes(wanted.toLowerCase())) : hosts;
  const count = wanted
    ? fmt(shown.length === 1 ? e.countOneIn : e.countIn, { n: shown.length, city: wanted })
    : fmt(shown.length === 1 ? e.countOne : e.countAll, { n: shown.length });

  return (
    <MotionConfig reducedMotion="user">
      <div className="hm ex">
        <div className="hm-aurora" aria-hidden="true"><span className="a1" /><span className="a2" /><span className="a3" /><span className="a4" /></div>
        <div className="hm-wrap">
          <section className="hm-section ex-top">
            <div className="hm-container">
              <div className="hm-head ex-head">
                <h1 className="hm-h2">{e.title}</h1>
                <p className="hm-lead">{e.sub}</p>
              </div>

              <form className="hm-glass ex-search" role="search" onSubmit={(ev) => ev.preventDefault()}>
                <MapPin size={18} aria-hidden="true" />
                <input aria-label={e.searchLabel} list="ex-cities" value={city} placeholder={e.searchPh} autoComplete="off" onChange={(ev) => setCity(ev.target.value)} />
                <datalist id="ex-cities">{cities.map((c) => <option key={c} value={c} />)}</datalist>
                {city && <button type="button" className="ex-clear" onClick={() => setCity('')} aria-label={e.clear}><X size={16} /></button>}
              </form>

              {failed ? (
                <LoadError what={e.loadWhat} onRetry={retry} />
              ) : !data ? (
                <div className="ex-grid" aria-busy="true">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="hm-glass ex-card ex-skel" />)}</div>
              ) : (
                <>
                  <p className="ex-count" aria-live="polite">{count}</p>
                  {shown.length ? (
                    <div className="ex-grid">
                      {shown.map((h, i) => <HostPreview key={h.id} h={h} e={e} i={i} onJoin={() => setJoinAs('Guest')} />)}
                    </div>
                  ) : (
                    <div className="hm-glass ex-empty">
                      <Megaphone size={22} aria-hidden="true" />
                      <div><strong>{fmt(e.emptyTitle, { city: wanted })}</strong><p>{e.emptyText}</p></div>
                      <button type="button" className="hm-btn hm-btn-primary" onClick={() => setJoinAs('Guest')}>{e.emptyCta}</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {data && (
            <section className="hm-section">
              <div className="hm-container">
                <div className="hm-glass ex-demand">
                  <div>
                    <h2 className="hm-h2">{e.demandTitle}</h2>
                    <p className="hm-lead">{e.demandSub}</p>
                    <button type="button" className="hm-btn hm-btn-glass" onClick={() => setJoinAs('Host')}><HomeIcon size={18} /> {home.hostWhyCta}</button>
                  </div>
                  {data.trips.length ? (
                    <ul className="ex-cities">
                      {data.trips.slice(0, 10).map((t) => (
                        <li key={t.city}>
                          <button type="button" className={same(t.city, wanted) ? 'is-on' : undefined} onClick={() => setCity(t.city)}>
                            <span>{t.city}</span><strong>{fmt(t.count === 1 ? e.demandTrip : e.demandTrips, { n: t.count })}</strong>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="ex-none">{e.demandEmpty}</p>}
                </div>
              </div>
            </section>
          )}

          <section className="hm-section">
            <div className="hm-container hm-head ex-join">
              <h2 className="hm-h2">{e.joinTitle}</h2>
              <p className="hm-lead">{e.joinText}</p>
              <div className="hm-cta-row">
                <button type="button" className="hm-btn hm-btn-primary" onClick={() => setJoinAs('Guest')}>{home.ctaGuest} <ArrowRight size={18} /></button>
                <button type="button" className="hm-btn hm-btn-glass" onClick={() => setJoinAs('Host')}><HomeIcon size={18} /> {home.ctaHost}</button>
              </div>
              <p className="hm-login">{home.loginPrompt}<Link to="/login">{home.loginLink}</Link></p>
            </div>
          </section>
        </div>
        <DisclaimerModal isOpen={!!joinAs} onClose={() => setJoinAs(null)} selectedRole={joinAs || ''} />
      </div>
    </MotionConfig>
  );
}

function HostPreview({ h, e, i, onJoin }) {
  const tags = (h.amenities || '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 4);
  return (
    <motion.article className="hm-glass ex-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE, delay: Math.min(i, 8) * 0.04 }}>
      <div className="ex-photo">
        {h.photo ? <img src={h.photo} alt="" loading="lazy" /> : <span className="ex-initial" aria-hidden="true">{h.name.charAt(0)}</span>}
        <span className="ex-price">{h.pricePerNight > 0 ? <>₹{h.pricePerNight.toLocaleString('en-IN')} <small>{e.perNight}</small></> : e.askPrice}</span>
      </div>
      <div className="ex-body">
        <div className="ex-who">
          <strong>{h.name}</strong>
          {h.phoneVerified && <span className="ex-tick" title={e.phoneVerified} aria-label={e.phoneVerified} role="img"><Check size={11} strokeWidth={3.5} /></span>}
          {h.teamVerified && <span className="ex-shield" title={e.teamVerified} aria-label={e.teamVerified} role="img"><ShieldCheck size={13} strokeWidth={2.4} /></span>}
          <span className="ex-rating">{h.reviewCount ? <><Star size={13} aria-hidden="true" /> {h.rating.toFixed(1)} <small>({h.reviewCount})</small></> : e.newHost}</span>
        </div>
        <p className="ex-place"><MapPin size={13} aria-hidden="true" /> {h.cities.join(', ') || h.location}</p>
        <h3 className="ex-title">{h.title}</h3>
        <div className="ex-tags">
          {h.maxGuests > 0 && <span><Users size={13} aria-hidden="true" />{fmt(e.upTo, { n: h.maxGuests })}</span>}
          {tags.map((t) => { const Icon = iconFor(t); return <span key={t}><Icon size={13} aria-hidden="true" />{t}</span>; })}
        </div>
        <button type="button" className="hm-btn hm-btn-glass ex-cta" onClick={onJoin}><MessageCircle size={16} /> {fmt(e.message, { name: h.name })}</button>
      </div>
    </motion.article>
  );
}
