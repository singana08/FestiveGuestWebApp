import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2, ArrowLeft, ArrowRight, Star, ShieldCheck } from 'lucide-react';
import api from '../utils/api';
import { toJpeg, putJpeg } from '../utils/image';
import '../styles/Trust.css';

const LIMIT = 6;

/** A host's own photo gallery on their profile: add, caption, reorder (first is the cover), remove. */
export default function GalleryEditor({ userId, onToast, onCount }) {
  const [photos, setPhotos] = useState(null); // null while loading
  const [busy, setBusy] = useState(false);
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

  const fail = (err, fallback) => onToast(err.response?.data?.message || err.message || fallback, 'error');

  const add = async (fileList) => {
    const files = [...(fileList || [])];
    const chosen = files.slice(0, LIMIT - photos.length);
    if (!chosen.length) return;
    setBusy(true);
    try {
      for (const file of chosen) {
        const jpeg = await toJpeg(file, 1600, 0.82);
        const { photoId, uploadUrl } = (await api.post('gallery/upload-url')).data;
        await putJpeg(uploadUrl, jpeg);
        show((await api.post('gallery', { photoId, caption: '' })).data);
      }
      onToast(chosen.length > 1 ? `${chosen.length} photos added` : 'Photo added');
      if (files.length > chosen.length) onToast(`Only ${LIMIT} photos fit, so the rest weren’t added.`, 'error');
    } catch (err) {
      fail(err, 'Couldn’t add the photo.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const save = async (next) => {
    const same = next.length === saved.current.length && next.every((p, i) => p.id === saved.current[i].id && p.caption === saved.current[i].caption);
    if (same) return;
    const before = saved.current;
    show(next, false);
    try {
      show((await api.put('gallery', { photos: next.map(({ id, caption }) => ({ id, caption: caption.trim() })) })).data);
    } catch (err) {
      show(before);
      fail(err, 'Couldn’t save the change.');
    }
  };

  const move = (i, by) => {
    const next = [...photos];
    [next[i], next[i + by]] = [next[i + by], next[i]];
    save(next);
  };

  const remove = async (photo) => {
    if (!window.confirm('Remove this photo?')) return;
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
        <h2><ImagePlus size={16} /> Photos of your place</h2>
        <span className="pf-count">{photos ? photos.length : '…'} / {LIMIT}</span>
      </header>
      <p className="tg-hint">Guests message hosts they can picture staying with. Show the room, bathroom and the view. Your first photo is the cover.</p>

      {photos?.length > 0 && (
        <ul className="tg-edit">
          {photos.map((p, i) => (
            <li key={p.id}>
              <div className="tg-edit-img">
                <img src={p.url} alt={p.caption || `Photo ${i + 1}`} />
                {i === 0 && <span className="tg-cover"><Star size={11} /> Cover</span>}
              </div>
              <input className="rg-input tg-caption" value={p.caption} maxLength={80} placeholder="Add a caption" aria-label={`Caption for photo ${i + 1}`}
                onChange={(e) => setPhotos((list) => list.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))}
                onBlur={() => save(photos)} />
              <div className="tg-edit-actions">
                <button type="button" className="pb-icon-btn" onClick={() => move(i, -1)} disabled={i === 0 || busy} aria-label={`Move photo ${i + 1} earlier`}><ArrowLeft size={14} /></button>
                <button type="button" className="pb-icon-btn" onClick={() => move(i, 1)} disabled={i === photos.length - 1 || busy} aria-label={`Move photo ${i + 1} later`}><ArrowRight size={14} /></button>
                <button type="button" className="pb-icon-btn pb-icon-btn--danger" onClick={() => remove(p)} disabled={busy} aria-label={`Remove photo ${i + 1}`}><Trash2 size={14} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {photos && photos.length < LIMIT && (
        <button type="button" className="tg-add" onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? <><span className="rg-spinner" /> Uploading…</> : <><ImagePlus size={18} /> Add photos</>}
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" multiple hidden aria-label="Choose photos" onChange={(e) => add(e.target.files)} />
      <p className="tg-safety"><ShieldCheck size={13} /> Location data is removed from your photos automatically. Don’t show your house number, street signs or children.</p>
    </>
  );
}
