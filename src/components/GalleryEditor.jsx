import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2, ArrowLeft, ArrowRight, Star, ShieldCheck, MapPin } from 'lucide-react';
import api from '../utils/api';
import { toJpeg, putJpeg } from '../utils/image';
import '../styles/Trust.css';

const PER_PLACE = 6;
const ALL = ''; // "All places": photos shown on every listing (also every photo from before cities existed)
const samePlace = (a, b) => (a || '').toLowerCase() === (b || '').toLowerCase();

/**
 * A host's own photos on their profile, kept per city they host in plus "All places": add, caption,
 * reorder within a place (its first photo is that place's cover), move to another place, remove.
 * places: the cities on their profile.
 */
export default function GalleryEditor({ userId, places = [], onToast, onCount }) {
  const [photos, setPhotos] = useState(null); // null while loading
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState(places[0] || ALL);
  const [confirming, setConfirming] = useState(''); // the photo whose "Remove?" is showing
  const saved = useRef([]); // what the server has, to restore on failure and skip no-op saves
  const fileRef = useRef(null);

  const show = (list, fromServer = true) => {
    if (fromServer) saved.current = list;
    setPhotos(list);
    onCount?.(list.length);
  };

  useEffect(() => {
    let live = true;
    api.get(`gallery/${encodeURIComponent(userId)}`)
      .then((res) => { if (live) show(res.data || []); })
      .catch(() => { if (live) show([]); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per member
  }, [userId]);

  // Tabs: the profile's cities, any city a photo still has (one since taken off the profile), then "All places".
  const cities = [...places];
  (photos || []).forEach((p) => { if (p.city && !cities.some((c) => samePlace(c, p.city))) cities.push(p.city); });
  const placeOf = (p) => p.city || ALL;
  const countIn = (place) => (photos || []).filter((p) => samePlace(placeOf(p), place)).length;
  const shown = (photos || []).filter((p) => samePlace(placeOf(p), tab));
  const tabName = tab || 'All places';

  const fail = (err, fallback) => onToast(err.response?.data?.message || err.message || fallback, 'error');

  const add = async (fileList) => {
    const files = [...(fileList || [])];
    const chosen = files.slice(0, PER_PLACE - shown.length);
    if (!chosen.length) return;
    const city = tab || null;
    setBusy(true);
    try {
      for (const file of chosen) {
        const jpeg = await toJpeg(file, 1600, 0.82);
        const { photoId, uploadUrl } = (await api.post('gallery/upload-url', { city })).data;
        await putJpeg(uploadUrl, jpeg);
        show((await api.post('gallery', { photoId, caption: '', city })).data);
      }
      onToast(chosen.length > 1 ? `${chosen.length} photos added to ${tabName}` : `Photo added to ${tabName}`);
      if (files.length > chosen.length) onToast(`Only ${PER_PLACE} photos fit in ${tabName}, so the rest weren’t added.`, 'error');
    } catch (err) {
      fail(err, 'Couldn’t add the photo.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const save = async (next) => {
    const same = next.length === saved.current.length && next.every((p, i) => p.id === saved.current[i].id
      && p.caption === saved.current[i].caption && samePlace(p.city, saved.current[i].city));
    if (same) return;
    const before = saved.current;
    show(next, false);
    try {
      show((await api.put('gallery', { photos: next.map(({ id, caption, city }) => ({ id, caption: caption.trim(), city: city || null })) })).data);
    } catch (err) {
      show(before);
      fail(err, 'Couldn’t save the change.');
    }
  };

  // Swap with the previous / next photo of the same place.
  const move = (p, by) => {
    const other = shown[shown.indexOf(p) + by];
    if (!other) return;
    const next = [...photos];
    const a = next.indexOf(p), b = next.indexOf(other);
    [next[a], next[b]] = [next[b], next[a]];
    save(next);
  };

  const relocate = (p, place) => save(photos.map((x) => (x.id === p.id ? { ...x, city: place || null } : x)));

  const remove = async (photo) => {
    setConfirming('');
    try {
      await api.delete(`gallery/${encodeURIComponent(photo.id)}`);
      show(saved.current.filter((p) => p.id !== photo.id));
      onToast('Photo removed');
    } catch (err) {
      fail(err, 'Couldn’t remove the photo.');
    }
  };

  return (
    <>
      <header className="pf-card-head">
        <h2><ImagePlus size={16} /> {cities.length > 1 ? 'Photos of your places' : 'Photos of your place'}</h2>
        <span className="pf-count">{photos ? shown.length : '…'} / {PER_PLACE}</span>
      </header>

      {cities.length > 0 && (
        <div className="tg-places" role="tablist" aria-label="Where these photos are">
          {[...cities, ALL].map((place) => (
            <button key={place || 'all'} type="button" role="tab" aria-selected={samePlace(tab, place)} className={samePlace(tab, place) ? 'is-on' : undefined}
              onClick={() => { setTab(place); setConfirming(''); }}>
              {place ? <><MapPin size={12} /> {place}</> : 'All places'} <small>{photos ? countIn(place) : ''}</small>
            </button>
          ))}
        </div>
      )}
      <p className="tg-hint">
        {cities.length === 0
          ? 'Guests message hosts they can picture staying with. Show the room, bathroom and the view. Your first photo is the cover.'
          : tab
            ? `These show on your listings in ${tab}: the room, bathroom and the view there. The first one is ${tab}’s cover.`
            : 'These show on every listing — you, your family or the neighbourhood. Photos of one home go under its city.'}
      </p>

      {shown.length > 0 && (
        <ul className="tg-edit">
          {shown.map((p, i) => (
            <li key={p.id}>
              <div className="tg-edit-img">
                <img src={p.url} alt={p.caption || `Photo ${i + 1}`} />
                {i === 0 && <span className="tg-cover"><Star size={11} /> Cover</span>}
              </div>
              <input className="rg-input tg-caption" value={p.caption} maxLength={80} placeholder="Add a caption" aria-label={`Caption for photo ${i + 1}`}
                onChange={(e) => setPhotos((list) => list.map((x) => (x.id === p.id ? { ...x, caption: e.target.value } : x)))}
                onBlur={() => save(photos)} />
              {cities.length > 0 && (
                <label className="tg-place-pick">
                  <span>Place</span>
                  <select value={placeOf(p)} onChange={(e) => relocate(p, e.target.value)} disabled={busy} aria-label={`Place for photo ${i + 1}`}>
                    {[...cities, ALL].map((place) => (
                      <option key={place || 'all'} value={place} disabled={!samePlace(place, placeOf(p)) && countIn(place) >= PER_PLACE}>
                        {place || 'All places'}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {confirming === p.id ? (
                <div className="tg-edit-actions tg-confirm">
                  <span>Remove this photo?</span>
                  <button type="button" className="tg-confirm-yes" onClick={() => remove(p)}>Remove</button>
                  <button type="button" className="tg-confirm-no" onClick={() => setConfirming('')}>Keep</button>
                </div>
              ) : (
                <div className="tg-edit-actions">
                  <button type="button" className="pb-icon-btn" onClick={() => move(p, -1)} disabled={i === 0 || busy} aria-label={`Move photo ${i + 1} earlier`}><ArrowLeft size={14} /></button>
                  <button type="button" className="pb-icon-btn" onClick={() => move(p, 1)} disabled={i === shown.length - 1 || busy} aria-label={`Move photo ${i + 1} later`}><ArrowRight size={14} /></button>
                  <button type="button" className="pb-icon-btn pb-icon-btn--danger" onClick={() => setConfirming(p.id)} disabled={busy} aria-label={`Remove photo ${i + 1}`}><Trash2 size={14} /></button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {photos && shown.length < PER_PLACE && (
        <button type="button" className="tg-add" onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? <><span className="rg-spinner" /> Uploading…</> : <><ImagePlus size={18} /> {cities.length ? `Add photos to ${tabName}` : 'Add photos'}</>}
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" multiple hidden aria-label="Choose photos" onChange={(e) => add(e.target.files)} />
      <p className="tg-safety"><ShieldCheck size={13} /> Location data is removed from your photos automatically. Don’t show your house number, street signs or children.</p>
    </>
  );
}
