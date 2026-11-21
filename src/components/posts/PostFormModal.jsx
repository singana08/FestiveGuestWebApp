import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Minus, Plus, MapPin } from 'lucide-react';
import GlassDialog from './GlassDialog';
import { AMENITY_OPTIONS, GUIDE_HELP_OPTIONS, GUIDE_LANGUAGES, splitCsv, toDateInput } from './postUtils';

// Used when the location API is unreachable (same list the page always used).
const FALLBACK_LOCATIONS = {
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Other'],
  'Karnataka': ['Bangalore', 'Mysore', 'Mangalore', 'Other'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Other'],
  'Andhra Pradesh': ['Hyderabad', 'Visakhapatnam', 'Vijayawada', 'Other'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Other'],
  'Delhi': ['New Delhi', 'Other'],
};

const Stepper = ({ id, value, min, max, onChange, label }) => (
  <div className="pb-stepper" role="group" aria-labelledby={id}>
    <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`Fewer ${label}`}><Minus size={16} /></button>
    <output aria-live="polite">{value}</output>
    <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`More ${label}`}><Plus size={16} /></button>
  </div>
);

// Fields with a single input get a <label for>; button groups get a named
// span that the group points at via aria-labelledby.
const Field = ({ label, htmlFor, labelId, required, error, hint, children }) => {
  const Tag = htmlFor ? 'label' : 'span';
  return (
    <div className="rg-field">
      <Tag className="rg-label" htmlFor={htmlFor} id={labelId}>
        {label}{required && <span className="pb-req" aria-hidden="true"> *</span>}
      </Tag>
      {children}
      {hint && <p className="pb-hint">{hint}</p>}
      {error && <p className="rg-error">{error}</p>}
    </div>
  );
};

const ChipGroup = ({ options, selected, onToggle, invalid }) => (
  <div className={`rg-chips${invalid ? ' pb-chips-invalid' : ''}`}>
    {options.map((o) => {
      const value = typeof o === 'string' ? o : o.name;
      const on = Array.isArray(selected) ? selected.includes(value) : selected === value;
      return (
        <button key={value} type="button" className={`rg-chip-btn${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => onToggle(value)}>
          {o.icon && <span aria-hidden="true">{o.icon} </span>}{value}
        </button>
      );
    })}
  </div>
);

/** What the traveller needs — maps to the API's needType. */
const NEEDS = [
  { value: 'stay', emoji: '🏠', title: 'A place to stay', desc: 'A local host for your nights' },
  { value: 'guide', emoji: '🧭', title: 'A local guide', desc: 'Someone by your side for a few hours' },
  { value: 'both', emoji: '✨', title: 'Both', desc: 'A stay and a guide' },
];
const TITLE_HINT = {
  stay: 'e.g., Job interview in Hyderabad — need a stay for 2 nights',
  guide: "e.g., Father's check-up at NIMS — need a Telugu speaker for 3 hours",
  both: 'e.g., Exam in Vijayawada — need a stay and help finding the centre',
};

/** A guest's trip request: a stay, a local guide for a few hours, or both. */
const TripForm = ({ initialData, locationData, onSubmit, setError }) => {
  const [formData, setFormData] = useState({
    needType: initialData?.needType || 'stay',
    title: initialData?.title || '',
    planningDate: toDateInput(initialData?.planningDate),
    state: initialData?.location?.split(', ')[1] || '',
    city: initialData?.location?.split(', ')[0] || '',
    facilities: initialData?.facilities || [],
    visitors: initialData?.visitors || 1,
    days: initialData?.days || 1,
    content: initialData?.content || '',
    guideHelpWith: splitCsv(initialData?.guideHelpWith),
    guideHours: initialData?.guideHours || 2,
    guideLanguages: splitCsv(initialData?.guideLanguages),
    guideBudgetPerHour: initialData?.guideBudgetPerHour ?? '', // '' = to be discussed
  });
  const [errors, setErrors] = useState({});
  const locations = Object.keys(locationData || {}).length ? locationData : FALLBACK_LOCATIONS;
  const set = (key, value) => { setFormData((p) => ({ ...p, [key]: value })); setErrors((p) => ({ ...p, [key]: '' })); };
  const toggleIn = (key, value) => set(key, formData[key].includes(value) ? formData[key].filter((x) => x !== value) : [...formData[key], value]);
  const wantsStay = formData.needType !== 'guide';
  const wantsGuide = formData.needType !== 'stay';

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Title is required';
    else if (formData.title.trim().length < 5) errs.title = 'Title must be at least 5 characters long';
    if (!formData.state) errs.state = 'Please select a state';
    if (!formData.city) errs.city = 'Please select a city';
    if (formData.planningDate) {
      const selected = new Date(formData.planningDate); const today = new Date(); today.setHours(0, 0, 0, 0);
      if (selected < today) errs.planningDate = 'Planning date should be today or in the future';
    }
    if (!formData.visitors || formData.visitors < 1 || formData.visitors > 10) errs.visitors = 'Visitors must be between 1 and 10';
    if (wantsStay && (!formData.days || formData.days < 1 || formData.days > 30)) errs.days = 'Days must be between 1 and 30';
    if (wantsGuide && formData.guideHelpWith.length === 0) errs.guideHelpWith = 'Pick at least one thing you need help with';
    // The API requires a description, so ask for one here rather than failing on submit.
    if (formData.content.trim().length < 10) errs.content = 'Tell locals a little about your trip (at least 10 characters)';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    await onSubmit({
      title: formData.title.trim(),
      planningDate: formData.planningDate,
      location: `${formData.city}, ${formData.state}`,
      facilities: wantsStay ? formData.facilities : [],
      visitors: parseInt(formData.visitors, 10),
      days: wantsStay ? parseInt(formData.days, 10) : null,
      content: formData.content.trim(),
      needType: formData.needType,
      guideHelpWith: wantsGuide ? formData.guideHelpWith : [],
      guideHours: wantsGuide ? formData.guideHours : null,
      guideLanguages: wantsGuide ? formData.guideLanguages : [],
      guideBudgetPerHour: wantsGuide && formData.guideBudgetPerHour !== '' ? Number(formData.guideBudgetPerHour) : null,
    }).catch((err) => setError(err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : '') || 'Failed to save post. Please try again.'));
  };

  return (
    <form id="pb-post-form" onSubmit={submit} noValidate>
      <div className="rg-field">
        <span className="rg-label" id="pb-need-label">What do you need?</span>
        <div className="rg-roles pb-needs" role="radiogroup" aria-labelledby="pb-need-label">
          {NEEDS.map((n) => (
            <button key={n.value} type="button" role="radio" aria-checked={formData.needType === n.value}
              className={`rg-role${formData.needType === n.value ? ' is-on' : ''}`} onClick={() => set('needType', n.value)}>
              <span className="rg-role-icon" aria-hidden="true">{n.emoji}</span>
              <span className="rg-role-title">{n.title}</span>
              <span className="rg-role-desc">{n.desc}</span>
            </button>
          ))}
        </div>
      </div>
      <Field label="What's the trip for?" htmlFor="pb-title" required error={errors.title}>
        <input id="pb-title" className={`rg-input${errors.title ? ' has-error' : ''}`} value={formData.title}
          placeholder={TITLE_HINT[formData.needType]} onChange={(e) => set('title', e.target.value)} />
      </Field>
      <Field label="Which state are you visiting?" required error={errors.state}>
        <ChipGroup options={Object.keys(locations)} selected={formData.state} invalid={!!errors.state}
          onToggle={(state) => { setFormData((p) => ({ ...p, state, city: '' })); setErrors((p) => ({ ...p, state: '', city: '' })); }} />
      </Field>
      {formData.state && (
        <Field label="City" required error={errors.city}>
          <ChipGroup options={locations[formData.state] || []} selected={formData.city} invalid={!!errors.city} onToggle={(city) => set('city', city)} />
        </Field>
      )}
      <div className="pb-form-row">
        <Field label={wantsStay ? 'Date' : 'Which day?'} htmlFor="pb-date" error={errors.planningDate} hint="Leave empty if your dates are flexible">
          <input id="pb-date" type="date" className={`rg-input${errors.planningDate ? ' has-error' : ''}`} value={formData.planningDate}
            min={new Date().toISOString().split('T')[0]} onChange={(e) => set('planningDate', e.target.value)} />
        </Field>
        <Field label="People" labelId="pb-people-label" error={errors.visitors}>
          <Stepper id="pb-people-label" label="people" value={formData.visitors} min={1} max={10} onChange={(v) => set('visitors', v)} />
        </Field>
        {wantsStay ? (
          <Field label="Days" labelId="pb-days-label" error={errors.days}>
            <Stepper id="pb-days-label" label="days" value={formData.days} min={1} max={30} onChange={(v) => set('days', v)} />
          </Field>
        ) : (
          <Field label="Hours with a guide" labelId="pb-hours-label">
            <Stepper id="pb-hours-label" label="hours" value={formData.guideHours} min={1} max={12} onChange={(v) => set('guideHours', v)} />
          </Field>
        )}
      </div>

      {wantsGuide && (
        <div className="pb-guide-box">
          <p className="pb-guide-head">🧭 About the guide you need</p>
          <Field label="Help needed with" required error={errors.guideHelpWith}>
            <div className={`rg-chips${errors.guideHelpWith ? ' pb-chips-invalid' : ''}`}>
              {GUIDE_HELP_OPTIONS.map((o) => (
                <button key={o.key} type="button" className={`rg-chip-btn${formData.guideHelpWith.includes(o.key) ? ' is-on' : ''}`}
                  aria-pressed={formData.guideHelpWith.includes(o.key)} onClick={() => toggleIn('guideHelpWith', o.key)}>
                  <span aria-hidden="true">{o.emoji} </span>{o.label}
                </button>
              ))}
            </div>
          </Field>
          <div className="pb-form-row pb-form-row--guide">
            {wantsStay && (
              <Field label="Hours with a guide" labelId="pb-hours-label">
                <Stepper id="pb-hours-label" label="hours" value={formData.guideHours} min={1} max={12} onChange={(v) => set('guideHours', v)} />
              </Field>
            )}
            <Field label="Budget per hour" htmlFor="pb-budget" hint="Leave empty to discuss in chat">
              <div className="rg-inline">
                <span className="rg-prefix" aria-hidden="true" style={{ color: 'rgba(255,240,230,0.74)' }}>₹</span>
                <input id="pb-budget" inputMode="numeric" className="rg-input" style={{ paddingLeft: '2.1rem' }} placeholder="e.g. 250"
                  value={formData.guideBudgetPerHour}
                  onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 6); set('guideBudgetPerHour', raw === '' ? '' : parseInt(raw, 10)); }} />
              </div>
            </Field>
          </div>
          <Field label="Languages you'd like them to speak">
            <ChipGroup options={GUIDE_LANGUAGES} selected={formData.guideLanguages} onToggle={(l) => toggleIn('guideLanguages', l)} />
          </Field>
        </div>
      )}

      {wantsStay && (
        <Field label="Would be nice to have">
          <ChipGroup options={AMENITY_OPTIONS} selected={formData.facilities} onToggle={(f) => toggleIn('facilities', f)} />
        </Field>
      )}
      <Field label="Tell locals about your trip" htmlFor="pb-content" required error={errors.content}>
        <textarea id="pb-content" rows={3} className={`rg-input rg-textarea${errors.content ? ' has-error' : ''}`} value={formData.content}
          placeholder={wantsGuide ? 'Where exactly, what time, any special help (wheelchair, documents, language)…' : "Why you're travelling, timings, food preferences, anything that helps a host say yes…"}
          onChange={(e) => set('content', e.target.value)} />
      </Field>
    </form>
  );
};

/** A host's listing. Same fields, rules and payload as before. */
const ListingForm = ({ initialData, user, onSubmit, setError }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    commenceDate: toDateInput(initialData?.commenceDate),
    maxGuests: initialData?.maxGuests || 2,
    pricePerNight: initialData?.pricePerNight || 0,
    amenities: initialData?.amenities || [],
    content: initialData?.content || '',
  });
  const [errors, setErrors] = useState({});
  const set = (key, value) => { setFormData((p) => ({ ...p, [key]: value })); setErrors((p) => ({ ...p, [key]: '' })); };
  const hostingAreasText = (user?.hostingAreas || [])
    .filter((area) => area.state && area.cities && area.cities.length > 0)
    .map((area) => `${area.cities.join(', ')} (${area.state})`)
    .join(' | ');

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Title is required';
    else if (formData.title.trim().length < 10) errs.title = 'Title must be at least 10 characters long';
    if (!formData.commenceDate) errs.commenceDate = 'Commence date is required';
    if (!formData.maxGuests || formData.maxGuests < 1 || formData.maxGuests > 20) errs.maxGuests = 'Max guests must be between 1 and 20';
    if (formData.pricePerNight < 0) errs.pricePerNight = 'Price cannot be negative';
    if (formData.content.trim().length > 0 && formData.content.trim().length < 20) errs.content = 'Additional details should be at least 20 characters long';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    await onSubmit({
      ...formData,
      location: hostingAreasText,
      maxGuests: parseInt(formData.maxGuests, 10),
      pricePerNight: parseFloat(formData.pricePerNight),
      content: formData.content.trim(),
      commenceDate: new Date(`${formData.commenceDate}T00:00:00.000Z`).toISOString(),
    }).catch((err) => setError(err.response?.data?.message || err.message || 'Failed to save post. Please try again.'));
  };

  return (
    <form id="pb-post-form" onSubmit={submit} noValidate>
      <Field label="Listing title" htmlFor="pb-title" required error={errors.title}>
        <input id="pb-title" className={`rg-input${errors.title ? ' has-error' : ''}`} value={formData.title}
          placeholder="e.g., Quiet room near the metro, home-cooked meals" onChange={(e) => set('title', e.target.value)} />
      </Field>
      <Field label="Where you host">
        <div className="pb-areas-box">
          <MapPin size={16} aria-hidden="true" />
          <span>{hostingAreasText || 'No hosting areas yet'}</span>
        </div>
        <p className="pb-hint">Change these in your <Link to="/profile">profile</Link>.</p>
      </Field>
      <div className="pb-form-row">
        <Field label="Available from" htmlFor="pb-date" required error={errors.commenceDate}>
          <input id="pb-date" type="date" className={`rg-input${errors.commenceDate ? ' has-error' : ''}`} value={formData.commenceDate}
            onChange={(e) => set('commenceDate', e.target.value)} />
        </Field>
        <Field label="Max guests" labelId="pb-guests-label" error={errors.maxGuests}>
          <Stepper id="pb-guests-label" label="guests" value={formData.maxGuests} min={1} max={20} onChange={(v) => set('maxGuests', v)} />
        </Field>
        <Field label="Price per night" htmlFor="pb-price" error={errors.pricePerNight} hint="0 if you'd rather discuss it">
          <div className="rg-inline">
            <span className="rg-prefix" aria-hidden="true" style={{ color: 'rgba(255,240,230,0.74)' }}>₹</span>
            <input id="pb-price" inputMode="numeric" className="rg-input" style={{ paddingLeft: '2.1rem' }} value={formData.pricePerNight}
              onFocus={(e) => { if (formData.pricePerNight === 0) e.target.select(); }}
              onChange={(e) => { const raw = e.target.value.replace(/[^0-9]/g, ''); set('pricePerNight', raw === '' ? 0 : parseInt(raw, 10)); }} />
          </div>
        </Field>
      </div>
      <Field label="What you offer">
        <ChipGroup options={AMENITY_OPTIONS} selected={formData.amenities}
          onToggle={(a) => set('amenities', formData.amenities.includes(a) ? formData.amenities.filter((x) => x !== a) : [...formData.amenities, a])} />
      </Field>
      <Field label="Tell guests more" htmlFor="pb-content" error={errors.content}>
        <textarea id="pb-content" rows={3} className={`rg-input rg-textarea${errors.content ? ' has-error' : ''}`} value={formData.content}
          placeholder="House rules, nearby landmarks, how you can help someone new to the city…" onChange={(e) => set('content', e.target.value)} />
      </Field>
    </form>
  );
};

/**
 * Create/edit dialog for both post kinds. onSubmit(payload) must return a
 * promise that rejects on failure — the error is shown inside the dialog.
 */
const PostFormModal = ({ open, kind, isEditing, initialData, user, locationData, onClose, onSubmit }) => {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const isTrip = kind === 'Guest';
  const title = isTrip ? (isEditing ? 'Edit your trip' : 'Post your trip') : (isEditing ? 'Edit your listing' : 'Create a listing');
  const subtitle = isTrip ? 'Tell locals where, when and what you need — a stay, a guide, or both.' : 'Show travellers what you can offer in your city.';

  const submit = async (payload) => {
    setSaving(true); setError('');
    try { await onSubmit(payload); } finally { setSaving(false); }
  };

  return (
    <GlassDialog
      open={open}
      onClose={onClose}
      size="lg"
      icon={<span aria-hidden="true" className="pb-dialog-emoji">{isTrip ? '🧳' : '🏡'}</span>}
      title={title}
      subtitle={subtitle}
      footer={(
        <>
          <button type="button" className="rg-btn rg-btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="pb-post-form" className="rg-btn rg-btn-primary pb-submit" disabled={saving}>
            {saving ? <><span className="rg-spinner" /> Saving…</> : isEditing ? 'Save changes' : isTrip ? 'Post trip' : 'Publish listing'}
          </button>
        </>
      )}
    >
      {error && <div className="rg-alert" role="alert"><AlertTriangle size={17} /> {error}</div>}
      {open && (isTrip
        ? <TripForm initialData={initialData} locationData={locationData} onSubmit={submit} setError={setError} />
        : <ListingForm initialData={initialData} user={user} onSubmit={submit} setError={setError} />)}
    </GlassDialog>
  );
};

export default PostFormModal;
