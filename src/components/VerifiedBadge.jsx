import { Check, ShieldCheck } from 'lucide-react';

// Shown when the member confirmed their phone number by SMS (styles: .vf-* in PostsBoard.css).
export const VerifiedTick = () => (
  <span className="vf-tick" title="Phone verified" aria-label="Phone verified" role="img"><Check size={10} strokeWidth={3.5} /></span>
);

export const VerifiedChip = () => (
  <span className="vf-chip"><ShieldCheck size={12} /> Phone verified</span>
);
