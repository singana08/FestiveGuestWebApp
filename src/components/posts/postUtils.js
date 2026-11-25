// Shared helpers for the Posts board.

// How an admin checked a member before marking them "Verified by FestiveGuest" (keys match the API's AdminVerification).
export const VERIFY_HOW = { id: 'ID checked', video: 'Video call', in_person: 'Met in person' };

export const AMENITY_OPTIONS = [
  { name: 'WiFi', icon: '📶' },
  { name: 'Parking', icon: '🚗' },
  { name: 'Meals', icon: '🍽️' },
  { name: 'AC', icon: '❄️' },
  { name: 'Kitchen', icon: '👨‍🍳' },
  { name: 'Laundry', icon: '👕' },
  { name: 'TV', icon: '📺' },
  { name: 'Hot Water', icon: '🚿' },
];

// Guide requests (a local for a few hours). Keys must match the API's HelpTypes.
export const GUIDE_HELP_OPTIONS = [
  { key: 'hospital_visit', emoji: '🏥', label: 'Hospital / clinic visit' },
  { key: 'govt_office', emoji: '🏛️', label: 'Government office' },
  { key: 'exam_centre', emoji: '📝', label: 'Exam centre' },
  { key: 'interview', emoji: '💼', label: 'Interview' },
  { key: 'court', emoji: '⚖️', label: 'Court' },
  { key: 'university_admission', emoji: '🎓', label: 'University / admission' },
  { key: 'bank_paperwork', emoji: '🏦', label: 'Bank paperwork' },
  { key: 'translation', emoji: '🗣️', label: 'Translation' },
  { key: 'form_filling', emoji: '📋', label: 'Form filling' },
  { key: 'city_orientation', emoji: '🧭', label: 'City orientation' },
  { key: 'elderly_companion', emoji: '🧓', label: 'Elderly companion' },
];
export const GUIDE_HELP = Object.fromEntries(GUIDE_HELP_OPTIONS.map((o) => [o.key, o]));
export const GUIDE_LANGUAGES = ['Telugu', 'English', 'Hindi', 'Tamil', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Urdu'];
export const splitCsv = (v) => (Array.isArray(v) ? v : (v || '').split(',').map((x) => x.trim()).filter(Boolean));

export const fmt = (str, vars = {}) => str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
/** Whole days from today until `date` (negative = past), or null if no date. */
export const daysUntil = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return Math.round((startOfDay(d) - startOfDay(new Date())) / 86400000);
};

export const isNewPost = (createdAt) => Date.now() - new Date(createdAt).getTime() < 48 * 3600 * 1000;

/** 'YYYY-MM-DD' for <input type="date">, from an ISO string or date-only string. */
export const toDateInput = (value) => (value ? String(value).slice(0, 10) : '');

/**
 * Host listings store their areas as "CityA, CityB (State) | CityC (State)";
 * trip posts store "City, State". Returns the individual city names.
 */
export const citiesInLocation = (location = '') => {
  if (!location) return [];
  if (location.includes('(')) {
    return location.split('|').flatMap((part) => part.replace(/\(.*?\)/g, '').split(',')).map((s) => s.trim()).filter(Boolean);
  }
  return [location.split(',')[0].trim()].filter(Boolean);
};
