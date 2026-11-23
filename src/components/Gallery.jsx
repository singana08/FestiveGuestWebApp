import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Flag } from 'lucide-react';
import api from '../utils/api';
import '../styles/Trust.css';

/** Full-size viewer: arrows / ← → keys to move, Esc or the backdrop to close. */
function Lightbox({ photos, start, ownerId, ownerName, canReport, onClose }) {
  const ref = useRef(null);
  const [i, setI] = useState(start);
  const [reported, setReported] = useState(false);
  const photo = photos[i];

  useEffect(() => { ref.current?.showModal(); }, []);
  const go = (by) => { setI((n) => (n + by + photos.length) % photos.length); setReported(false); };

  const report = async () => {
    if (!window.confirm('Report this photo to the FestiveGuest team?')) return;
    try {
      await api.post('safety/report', {
        reportedUserId: ownerId, reason: 'inappropriate', context: 'photo',
        details: `Gallery photo ${i + 1}${photo.caption ? ` (“${photo.caption}”)` : ''}, id ${photo.id}`,
      });
      setReported(true);
    } catch { window.alert('Couldn’t send the report. Please try again.'); }
  };

  return (
    // A native modal sits above any open dialog; stopping Esc here keeps the profile dialog underneath open.
    <dialog ref={ref} className="tg-lightbox" aria-label={`${ownerName}’s photos`} onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) ref.current.close(); }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') e.stopPropagation();
        if (e.key === 'ArrowRight') go(1);
        if (e.key === 'ArrowLeft') go(-1);
      }}>
      <figure>
        <img src={photo.url} alt={photo.caption || `${ownerName}’s place, photo ${i + 1}`} />
        <figcaption>
          <span>{photo.caption}</span>
          <span className="tg-count">{i + 1} / {photos.length}</span>
        </figcaption>
      </figure>
      {photos.length > 1 && (
        <>
          <button type="button" className="tg-nav tg-nav--prev" onClick={() => go(-1)} aria-label="Previous photo"><ChevronLeft size={22} /></button>
          <button type="button" className="tg-nav tg-nav--next" onClick={() => go(1)} aria-label="Next photo"><ChevronRight size={22} /></button>
        </>
      )}
      <button type="button" className="tg-close" onClick={() => ref.current.close()} aria-label="Close"><X size={20} /></button>
      {canReport && (
        <button type="button" className="tg-report" onClick={report} disabled={reported}>
          <Flag size={13} /> {reported ? 'Reported. Thank you.' : 'Report photo'}
        </button>
      )}
    </dialog>
  );
}

/** A host's photos as a mosaic (cover large); opens the viewer. */
export default function Gallery({ photos, ownerId, ownerName, canReport = false }) {
  const [open, setOpen] = useState(-1);
  if (!photos?.length) return null;
  const shown = photos.slice(0, 5);
  return (
    <>
      <div className={`tg-grid tg-grid--${shown.length}`}>
        {shown.map((p, i) => (
          <button key={p.id} type="button" className="tg-thumb" onClick={() => setOpen(i)}
            aria-label={`Open photo ${i + 1} of ${photos.length}${p.caption ? `: ${p.caption}` : ''}`}>
            <img src={p.url} alt="" loading="lazy" />
            {i === shown.length - 1 && photos.length > shown.length && <span className="tg-more">+{photos.length - shown.length}</span>}
          </button>
        ))}
      </div>
      {open >= 0 && <Lightbox photos={photos} start={open} ownerId={ownerId} ownerName={ownerName} canReport={canReport} onClose={() => setOpen(-1)} />}
    </>
  );
}
