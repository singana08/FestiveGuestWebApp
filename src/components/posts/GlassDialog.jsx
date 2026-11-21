import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1];

// Dialog shell for the Posts board: rendered into <body> (above the sticky
// navbar), closes on Escape or a backdrop click. The page locks body scroll.
const GlassDialog = ({ open, onClose, title, subtitle, icon, size = 'md', children, footer }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="dialog"
          className="rg-modal-overlay rg-portal"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            className={`rg-modal pb-dialog pb-dialog--${size}`}
            role="dialog" aria-modal="true" aria-label={title}
            initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.32, ease: EASE }}
          >
            <header className="rg-modal-head">
              <h3>{icon}{title}</h3>
              {subtitle && <p>{subtitle}</p>}
              <button type="button" className="rg-icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
            </header>
            <div className="rg-modal-body">{children}</div>
            {footer && <footer className="rg-modal-foot">{footer}</footer>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default GlassDialog;
