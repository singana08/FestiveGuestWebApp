import { Check, ShieldCheck } from 'lucide-react';
import { VERIFY_HOW } from './posts/postUtils';

// Two levels of trust (styles: .vf-* in PostsBoard.css):
//  • green tick — the member confirmed their phone number by SMS;
//  • amber shield — "Verified by FestiveGuest": someone on the team checked who they are.


export const VerifiedTick = () => (
  <span className="vf-tick" title="Phone verified" aria-label="Phone verified" role="img"><Check size={10} strokeWidth={3.5} /></span>
);

export const VerifiedChip = () => (
  <span className="vf-chip"><ShieldCheck size={12} /> Phone verified</span>
);

const trustText = (how, since) => [
  'Verified by FestiveGuest',
  VERIFY_HOW[how],
  since && `since ${new Date(since).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`,
].filter(Boolean).join(' · ');

/** The small shield next to a name. */
export const TrustShield = ({ how, since }) => {
  const text = trustText(how, since);
  return <span className="vf-shield" title={text} aria-label={text} role="img"><ShieldCheck size={11} strokeWidth={2.6} /></span>;
};

/** The labelled version, for profiles. */
export const TrustChip = ({ how, since }) => (
  <span className="vf-chip vf-chip--team" title={trustText(how, since)}><ShieldCheck size={12} /> Verified by FestiveGuest{VERIFY_HOW[how] && <small> · {VERIFY_HOW[how]}</small>}</span>
);
