// Gradient progress ring (styles: .pf-ring* in Profile.css). r=26 → circumference ≈ 163.4
const ProgressRing = ({ pct, label = `${pct}%`, className = '' }) => (
  <svg className={`pf-ring ${className}`} viewBox="0 0 64 64" aria-hidden="true">
    <defs>
      <linearGradient id="pf-ring-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffd38a" /><stop offset="100%" stopColor="#ff6b35" /></linearGradient>
    </defs>
    <circle cx="32" cy="32" r="26" className="pf-ring-track" />
    <circle cx="32" cy="32" r="26" className="pf-ring-fill" strokeDasharray={`${(Math.min(100, Math.max(0, pct)) / 100) * 163.4} 163.4`} />
    <text x="32" y="36.5" className="pf-ring-text">{label}</text>
  </svg>
);

export default ProgressRing;
