import { ExternalLink, ArrowRight } from 'lucide-react';
import api from '../utils/api';

/**
 * A sponsored card between posts — always labelled. A click only bumps the card's total; nothing about the member is sent.
 */
function SponsoredCard({ ad, label = 'Sponsored', visit = 'Visit' }) {
  return (
    <a className="sp" href={ad.link} target="_blank" rel="noopener noreferrer sponsored"
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

/** Our own card in an ad spot no advertiser has taken: same look, labelled as from FestiveGuest, not "Sponsored". */
export function HouseCard({ card, label }) {
  const { icon: Icon, title, text, cta, href, onClick } = card;
  const body = (
    <>
      <span className="sp-pic sp-pic--house" aria-hidden="true"><Icon size={30} /></span>
      <span className="sp-body">
        <span className="sp-label">{label}</span>
        <strong className="sp-title">{title}</strong>
        <span className="sp-text">{text}</span>
        <span className="sp-go">{cta} <ArrowRight size={13} aria-hidden="true" /></span>
      </span>
    </>
  );
  return href
    ? <a className="sp sp--house" href={href}>{body}</a>
    : <button type="button" className="sp sp--house" onClick={onClick}>{body}</button>;
}

export default SponsoredCard;
