import { useState } from 'react';
import { House, Compass, Sparkles, MapPin, CalendarDays, Users, Moon, Pencil, Search, Megaphone, Globe, CheckCircle2, X } from 'lucide-react';
import { Stepper } from './PostFormModal';
import { fmt } from './postUtils';

/**
 * Home's search. A guest says what they need (a stay, a guide or both), where, when and for how many;
 * a host says which trip requests to see. The answers drive the results below and are remembered, and a
 * guest's search is also a ready-made trip request (see PostTripNudge).
 */
const WHAT_ICONS = { stay: House, guide: Compass, both: Sparkles };
const dayLabel = (iso, locale) => new Date(`${iso}T00:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' });

/** A row of toggle buttons where exactly one is on. */
const Choice = ({ label, options, value, onChange }) => (
  <div className="nd-choice" role="radiogroup" aria-label={label}>
    {options.map(([key, text, Icon]) => (
      <button key={key} type="button" role="radio" aria-checked={value === key} className={value === key ? 'is-on' : undefined} onClick={() => onChange(key)}>
        {Icon && <Icon size={17} aria-hidden="true" />}{text}
      </button>
    ))}
  </div>
);

/** The guest's questions. `onCancel` only when editing an earlier search. */
export function NeedCard({ c, initial, cities, onSubmit, onCancel }) {
  const [f, setF] = useState({ what: 'stay', city: '', date: '', people: 1, nights: 1, ...initial });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form className={`nd-card${onCancel ? ' is-edit' : ''}`} onSubmit={(e) => { e.preventDefault(); onSubmit({ ...f, city: f.city.trim() }); }}>
      <h2>{c.needTitle}</h2>
      {!onCancel && <p className="nd-intro">{c.needIntro}</p>}
      <Choice label={c.needTitle} value={f.what} onChange={(v) => set('what', v)}
        options={['stay', 'guide', 'both'].map((k) => [k, c.needKinds[k], WHAT_ICONS[k]])} />
      <div className="nd-fields">
        <label className="nd-field nd-field--where">
          <span><MapPin size={14} aria-hidden="true" /> {c.needWhere}</span>
          <input className="rg-input" list="nd-cities" value={f.city} placeholder={c.needWherePh} autoComplete="off" onChange={(e) => set('city', e.target.value)} />
          <datalist id="nd-cities">{cities.map((ci) => <option key={ci} value={ci} />)}</datalist>
        </label>
        <label className="nd-field">
          <span><CalendarDays size={14} aria-hidden="true" /> {c.needWhen}</span>
          <input className="rg-input" type="date" min={today} value={f.date} onChange={(e) => set('date', e.target.value)} />
          {/* the browser's date box has no clear button of its own */}
          {f.date
            ? <button type="button" className="nd-clear" onClick={() => set('date', '')}><X size={13} aria-hidden="true" /> {c.needClearDate}</button>
            : <small>{c.needWhenHint}</small>}
        </label>
        <div className="nd-field">
          <span id="nd-people"><Users size={14} aria-hidden="true" /> {c.needPeople}</span>
          <Stepper id="nd-people" label="people" value={f.people} min={1} max={10} onChange={(v) => set('people', v)} />
        </div>
        {f.what !== 'guide' && (
          <div className="nd-field">
            <span id="nd-nights"><Moon size={14} aria-hidden="true" /> {c.needNights}</span>
            <Stepper id="nd-nights" label="nights" value={f.nights} min={1} max={30} onChange={(v) => set('nights', v)} />
          </div>
        )}
      </div>
      <div className="nd-actions">
        {onCancel && <button type="button" className="rg-btn rg-btn-ghost" onClick={onCancel}>{c.needCancel}</button>}
        <button type="submit" className="rg-btn rg-btn-primary"><Search size={17} aria-hidden="true" /> {f.what === 'guide' ? c.needFindLocals : c.needFindHosts}</button>
      </div>
    </form>
  );
}

/** The host's questions: which trip requests (stays, guide requests or all), in which of their cities, and when. */
export function HostNeedCard({ c, initial, hostingCities, onSubmit, onCancel }) {
  const [f, setF] = useState(initial);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const toggleCity = (ci) => set('cities', f.cities.includes(ci) ? f.cities.filter((x) => x !== ci) : [...f.cities, ci]);
  return (
    <form className="nd-card is-edit" onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}>
      <h2>{c.hostNeedTitle}</h2>
      <Choice label={c.hostNeedTitle} value={f.what} onChange={(v) => set('what', v)}
        options={[['any', c.needAll], ['stay', c.needStays, House], ['guide', c.needGuides, Compass]]} />
      <div className="nd-field">
        <span><MapPin size={14} aria-hidden="true" /> {c.needWhere}</span>
        <div className="nd-choice nd-choice--multi" role="group" aria-label={c.needWhere}>
          {hostingCities.map((ci) => (
            <button key={ci} type="button" aria-pressed={f.cities.includes(ci)} className={f.cities.includes(ci) ? 'is-on' : undefined} onClick={() => toggleCity(ci)}>{ci}</button>
          ))}
          <button type="button" aria-pressed={f.cities.length === 0} className={f.cities.length === 0 ? 'is-on' : undefined} onClick={() => set('cities', [])}><Globe size={15} aria-hidden="true" />{c.anywhere}</button>
        </div>
      </div>
      <div className="nd-field">
        <span><CalendarDays size={14} aria-hidden="true" /> {c.needWhen}</span>
        <Choice label={c.needWhen} value={f.when} onChange={(v) => set('when', v)}
          options={[['any', c.any], ['week', c.thisWeek], ['month', c.thisMonth], ['later', c.later]]} />
      </div>
      <div className="nd-actions">
        <button type="button" className="rg-btn rg-btn-ghost" onClick={onCancel}>{c.needCancel}</button>
        <button type="submit" className="rg-btn rg-btn-primary"><Search size={17} aria-hidden="true" /> {c.needShowTrips}</button>
      </div>
    </form>
  );
}

/** The search in one line, with Edit: "A stay · Guntur · 29 Nov · 2 people · 2 nights". */
export function NeedSummary({ c, need, isHost, locale, onEdit }) {
  const Icon = isHost ? Search : WHAT_ICONS[need.what];
  const parts = isHost
    ? [{ any: c.needAllTrips, stay: c.needStays, guide: c.needGuides }[need.what], need.cities.length ? need.cities.join(', ') : c.anywhere,
      { any: c.any, week: c.thisWeek, month: c.thisMonth, later: c.later }[need.when]]
    : [c.needKinds[need.what], need.city || c.anywhere, need.date ? dayLabel(need.date, locale) : c.needFlexible,
      need.people === 1 ? c.person : fmt(c.people, { n: need.people }),
      need.what !== 'guide' && (need.nights === 1 ? c.needNight : fmt(c.needNightsN, { n: need.nights }))];
  return (
    <div className="nd-summary">
      <Icon size={17} aria-hidden="true" />
      <p>{parts.filter(Boolean).map((p, i) => <span key={i}>{p}</span>)}</p>
      <button type="button" className="nd-edit" onClick={onEdit}><Pencil size={14} aria-hidden="true" /> {c.edit}</button>
    </div>
  );
}

/**
 * "Post this trip": the guest's search, already filled in, as a trip request local hosts can answer.
 * If that trip is already posted (`posted`), it says so and opens it instead of offering to post it again.
 */
export function PostTripNudge({ c, need, big, posted, onPost, onOpenPosted }) {
  const where = need.city || c.anywhereLower;
  const title = posted ? c.nudgePostedTitle : need.what === 'guide' ? fmt(c.nudgeGuideTitle, { city: where }) : big ? fmt(c.nudgeEmptyTitle, { city: where }) : fmt(c.nudgeTitle, { city: where });
  return (
    <div className={`nd-nudge${big ? ' is-big' : ''}${posted ? ' is-posted' : ''}`}>
      <span className="nd-nudge-icon" aria-hidden="true">{posted ? <CheckCircle2 size={20} /> : <Megaphone size={20} />}</span>
      <div><strong>{title}</strong><p>{fmt(posted ? c.nudgePostedText : c.nudgeText, { city: where })}</p></div>
      {posted
        ? <button type="button" className="rg-btn rg-btn-ghost" onClick={onOpenPosted}>{c.nudgePostedCta}</button>
        : <button type="button" className="rg-btn rg-btn-primary" onClick={onPost}>{c.nudgeCta}</button>}
    </div>
  );
}
