import { useState } from 'react';
import { Share2, MessageCircle, Copy, ShieldCheck } from 'lucide-react';
import '../styles/Trust.css';

const today = () => new Date().toISOString().slice(0, 10);
const nice = (d) => new Date(`${d}T00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * "Share my stay": tell family or a friend who you're staying with, where and when — on WhatsApp or by copying.
 * Nothing is sent to FestiveGuest; the message is built here and handed to WhatsApp.
 */
export default function ShareStay({ host }) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [copied, setCopied] = useState(false);

  const link = `${window.location.origin}/profile/${encodeURIComponent(host.name)}`;
  const message = [
    `I’m planning to stay with ${host.name}, a host on FestiveGuest${host.location ? ` in ${host.location}` : ''}.`,
    from && (to ? `Dates: ${nice(from)} to ${nice(to)}.` : `From ${nice(from)}.`),
    `Their profile: ${link}`,
    'I’ll keep you posted.',
  ].filter(Boolean).join('\n');

  const copy = async () => {
    try { await navigator.clipboard.writeText(message); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ }
  };

  if (!open) {
    return <button type="button" className="rg-btn rg-btn-ghost rg-btn-sm tg-share-btn" onClick={() => setOpen(true)}><Share2 size={14} /> Share my stay</button>;
  }
  return (
    <div className="tg-share">
      <p className="tg-share-title"><ShieldCheck size={15} /> Let someone you trust know where you’ll be</p>
      <div className="tg-share-dates">
        <label>From<input type="date" className="rg-input" value={from} min={today()} onChange={(e) => { setFrom(e.target.value); if (to && e.target.value > to) setTo(''); }} /></label>
        <label>To<input type="date" className="rg-input" value={to} min={from || today()} onChange={(e) => setTo(e.target.value)} /></label>
      </div>
      <pre className="tg-preview">{message}</pre>
      <div className="tg-share-actions">
        <button type="button" className="rg-btn rg-btn-ghost rg-btn-sm" onClick={() => setOpen(false)}>Close</button>
        <button type="button" className="rg-btn rg-btn-ghost rg-btn-sm" onClick={copy}><Copy size={14} /> {copied ? 'Copied' : 'Copy'}</button>
        <a className="rg-btn rg-btn-primary rg-btn-sm tg-wa" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
          <MessageCircle size={14} /> Send on WhatsApp
        </a>
      </div>
    </div>
  );
}
