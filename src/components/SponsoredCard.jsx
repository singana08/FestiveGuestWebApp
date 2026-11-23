import { ExternalLink } from 'lucide-react';
import api from '../utils/api';

/**
 * A sponsored card — always labelled. "rail" sits in the right column on wide screens, "feed" between
 * posts on smaller ones (CSS shows one or the other). A click only bumps the card's total; nothing about the member is sent.
 */
function SponsoredCard({ ad, variant, label = 'Sponsored', visit = 'Visit' }) {
  return (
    <a className={`sp sp--${variant}`} href={ad.link} target="_blank" rel="noopener noreferrer sponsored"
      onClick={() => api.post(`sponsored/${encodeURIComponent(ad.id)}/click`).catch(() => {})}>
      <span className="sp-pic"><img src={ad.imageUrl} alt="" loading="lazy" /></span>
      <span className="sp-body">
        <span className="sp-label">{label}</span>
        <strong className="sp-title">{ad.title}</strong>
        {ad.text && <span className="sp-text">{ad.text}</span>}
        <span className="sp-go">{visit} <ExternalLink size={13} aria-hidden="true" /></span>
      </span>
    </a>
  );
}

export default SponsoredCard;
