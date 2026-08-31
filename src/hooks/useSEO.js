import { useEffect } from 'react';

const SITE_NAME = 'FestiveGuest';
const DEFAULT_DESCRIPTION = "A community network for interviews, hospital visits, job joining, exams, festivals, and life transitions — not tourism. Connect with a trusted local host anywhere in India.";

function setMetaTag(attr, key, content) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Sets the document title + meta description/robots/OG tags for the
 * current page. This is a plain SPA (react-router `Routes`, no SSR), so
 * every route otherwise shares the same static index.html <head> — this
 * hook is what actually differentiates pages for both the browser tab
 * and anything that reads the rendered DOM (most modern crawlers do).
 *
 * ponytail: no react-helmet — a few DOM writes in a useEffect cover this
 * app's needs. Reach for a real library only if pages start needing to
 * inject many more tag types than title/description/robots/OG.
 */
export default function useSEO({ title, description, noindex = false } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Find a Local Host`;
    const desc = description || DEFAULT_DESCRIPTION;
    document.title = fullTitle;
    setMetaTag('name', 'description', desc);
    setMetaTag('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', desc);
  }, [title, description, noindex]);
}
