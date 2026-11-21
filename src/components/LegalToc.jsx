import { useEffect, useState } from 'react';
import { List } from 'lucide-react';

/** "On this page" links built from the legal document's section headings. */
const LegalToc = () => {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState('');

  useEffect(() => {
    const heads = [...document.querySelectorAll('.legal-document section > h2')];
    heads.forEach((h, i) => { if (!h.id) h.id = `section-${i + 1}`; });
    // The headings only exist in the DOM after mount, so reading them here is intended.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(heads.map((h) => ({ id: h.id, text: h.textContent.replace(/^\d+\.\s*/, '') })));
    // Highlight the section currently near the top of the screen.
    const io = new IntersectionObserver((entries) => {
      const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (hit) setActive(hit.target.id);
    }, { rootMargin: '-12% 0px -70% 0px' });
    heads.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, []);

  if (!items.length) return null;
  return (
    <nav className="lgl-toc" aria-label="On this page">
      <p><List size={14} aria-hidden="true" /> On this page</p>
      <ol>
        {items.map((it) => (
          <li key={it.id}>
            <a href={`#${it.id}`} className={active === it.id ? 'is-active' : ''}
              onClick={(e) => { e.preventDefault(); setActive(it.id); document.getElementById(it.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
              {it.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default LegalToc;
