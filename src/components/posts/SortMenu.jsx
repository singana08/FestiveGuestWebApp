import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/** The sort picker: a styled menu, because a native <select>'s open list can't be themed. options = [[value, label], …]. */
export default function SortMenu({ value, options, onChange, label = 'Sort' }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrap = useRef(null);
  const current = options.find(([v]) => v === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!wrap.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  const show = () => { setActive(Math.max(0, options.findIndex(([v]) => v === value))); setOpen(true); };
  const pick = (v) => { onChange(v); setOpen(false); };
  const onKey = (e) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); show(); }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % options.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i - 1 + options.length) % options.length); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(options[active][0]); }
    else if (e.key === 'Escape' || e.key === 'Tab') setOpen(false);
  };

  return (
    <div className="pb-sort" ref={wrap}>
      <button type="button" className="pb-sort-btn" aria-haspopup="listbox" aria-expanded={open} aria-label={`${label}: ${current[1]}`}
        aria-activedescendant={open ? `pb-sort-${options[active][0]}` : undefined}
        onClick={() => (open ? setOpen(false) : show())} onKeyDown={onKey}>
        {current[1]} <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <ul className="pb-sort-menu" role="listbox" aria-label={label}>
          {options.map(([v, text], i) => (
            <li key={v} id={`pb-sort-${v}`} role="option" aria-selected={v === value} className={i === active ? 'is-active' : undefined}
              onPointerEnter={() => setActive(i)} onClick={() => pick(v)}>
              {text}{v === value && <Check size={14} aria-hidden="true" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
