import { useMemo } from 'react';
import { CITY_COORDS } from './cityCoords';
import { fmt } from './postUtils';

// Simple equirectangular projection over the region the app serves.
const project = (lat, lon) => [(lon - 72.2) * 40, (21.9 - lat) * 40];
const STATE_COLORS = ['255,122,61', '139,108,255', '255,79,139', '255,193,99', '52,211,153', '96,165,250'];

// Andrew's monotone chain; the state "regions" are drawn as the rounded hull
// of that state's cities, so they always line up with the pins.
const hull = (pts) => {
  if (pts.length < 3) return pts;
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = []; const upper = [];
  for (const pt of p) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pt) <= 0) lower.pop(); lower.push(pt); }
  for (const pt of [...p].reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pt) <= 0) upper.pop(); upper.push(pt); }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
};

const REGIONS = (() => {
  const byState = {};
  for (const [lat, lon, state] of Object.values(CITY_COORDS)) (byState[state] ||= []).push(project(lat, lon));
  return Object.entries(byState).map(([state, pts], i) => {
    const points = hull(pts);
    const cx = points.reduce((s, q) => s + q[0], 0) / points.length;
    const cy = points.reduce((s, q) => s + q[1], 0) / points.length;
    return { state, color: STATE_COLORS[i % STATE_COLORS.length], d: points.map((q) => q.join(',')).join(' '), cx, cy };
  });
})();

/**
 * counts: { [city]: number } for the current results (before city filters).
 * selected: city names currently used as filters. onToggle(city).
 */
const CityMap = ({ counts, selected, onToggle, c }) => {
  const cities = useMemo(() => Object.entries(CITY_COORDS).map(([name, [lat, lon]]) => {
    const [x, y] = project(lat, lon);
    return { name, x, y, n: counts[name] || 0, on: selected.includes(name) };
  }), [counts, selected]);
  const ranked = cities.filter((ci) => ci.n > 0).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));

  return (
    <div className="pb-map">
      <div className="pb-map-canvas">
        <svg viewBox="0 0 495 560" role="img" aria-label={c.mapHint}>
          <defs>
            <radialGradient id="pb-pin" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#fff3dc" />
              <stop offset="45%" stopColor="#ffb054" />
              <stop offset="100%" stopColor="#ff6b35" />
            </radialGradient>
          </defs>
          {REGIONS.map((r) => (
            <g key={r.state}>
              {/* Group opacity keeps fill + wide stroke one even tone (no ring). */}
              <g opacity="0.13"><polygon points={r.d} fill={`rgb(${r.color})`} stroke={`rgb(${r.color})`} strokeWidth="46" strokeLinejoin="round" /></g>
              <text x={r.cx} y={r.cy} className="pb-map-state">{r.state}</text>
            </g>
          ))}
          {cities.filter((ci) => ci.n === 0).map((ci) => (
            <circle key={ci.name} cx={ci.x} cy={ci.y} r="2.4" className="pb-map-dot"><title>{ci.name}</title></circle>
          ))}
          {cities.filter((ci) => ci.n > 0).map((ci) => {
            const r = 8 + Math.sqrt(ci.n) * 3.2;
            return (
              <g
                key={ci.name}
                className={`pb-pin${ci.on ? ' is-on' : ''}`}
                role="button" tabIndex={0} aria-pressed={ci.on}
                aria-label={`${ci.name}: ${ci.n}`}
                onClick={() => onToggle(ci.name)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(ci.name); } }}
              >
                <circle cx={ci.x} cy={ci.y} r={r + 7} className="pb-pin-halo" />
                <circle cx={ci.x} cy={ci.y} r={r} fill="url(#pb-pin)" className="pb-pin-core" />
                <text x={ci.x} y={ci.y + 3.5} className="pb-pin-count">{ci.n}</text>
                <text x={ci.x + r + 5} y={ci.y + 4} className="pb-pin-label">{ci.name}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <aside className="pb-map-list">
        <p className="pb-map-hint">{c.mapHint}</p>
        {ranked.length === 0 ? (
          <p className="pb-map-empty">{c.mapEmpty}</p>
        ) : (
          <ul>
            {ranked.map((ci) => (
              <li key={ci.name}>
                <button type="button" className={`pb-map-city${ci.on ? ' is-on' : ''}`} aria-pressed={ci.on} onClick={() => onToggle(ci.name)}>
                  <span>{ci.name}</span>
                  <span className="pb-map-count">{ci.n === 1 ? c.oneResult : fmt(c.results, { n: ci.n })}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
};

export default CityMap;
