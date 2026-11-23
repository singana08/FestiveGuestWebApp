// Stay dates are date-only (UTC midnight), so they're formatted in UTC to avoid shifting a day.
const fmt = (iso, withYear) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', ...(withYear && { year: 'numeric' }), timeZone: 'UTC' });

/** "20 Dec – 23 Dec 2026", or "20 Dec 2026" for one day. */
export const stayDates = (s) => (s.startDate.slice(0, 10) === s.endDate.slice(0, 10) ? fmt(s.startDate, true) : `${fmt(s.startDate)} – ${fmt(s.endDate, true)}`);

export const stayWord = (s) => (s.kind === 'meetup' ? 'meet-up' : 'stay');

const DAY = 86400000;
const todayUtc = () => { const d = new Date(); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); };
/** Whole days from today to the stay's start (negative once it has started). */
export const daysUntil = (s) => Math.round((Date.parse(s.startDate.slice(0, 10)) - todayUtc()) / DAY);
export const inProgress = (s) => daysUntil(s) <= 0 && Date.parse(s.endDate.slice(0, 10)) >= todayUtc();
/** "starts today" / "starts tomorrow" / "starts in 3 days" / "happening now". */
export const whenLabel = (s) => {
  const d = daysUntil(s);
  if (d > 1) return `starts in ${d} days`;
  if (d === 1) return 'starts tomorrow';
  if (d === 0) return 'starts today';
  return inProgress(s) ? 'happening now' : '';
};
