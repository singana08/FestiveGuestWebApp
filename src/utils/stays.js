// Stay dates are date-only (UTC midnight), so they're formatted in UTC to avoid shifting a day.
const fmt = (iso, withYear) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', ...(withYear && { year: 'numeric' }), timeZone: 'UTC' });

/** "20 Dec – 23 Dec 2026", or "20 Dec 2026" for one day. */
export const stayDates = (s) => (s.startDate.slice(0, 10) === s.endDate.slice(0, 10) ? fmt(s.startDate, true) : `${fmt(s.startDate)} – ${fmt(s.endDate, true)}`);

export const stayWord = (s) => (s.kind === 'meetup' ? 'meet-up' : 'stay');
