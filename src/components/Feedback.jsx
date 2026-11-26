import { Component, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, RotateCw, WifiOff, X } from 'lucide-react';
import { connectFeedback } from '../utils/feedback';
import '../styles/Feedback.css';

const LIFE = { success: 3500, error: 6000 };

/** A popover, so it shows above any open dialog too (the top layer stacks in the order things open). */
function Toast({ note, onClose }) {
  const ref = useRef(null);
  useLayoutEffect(() => { ref.current?.showPopover?.(); }, []);
  return (
    <motion.div ref={ref} popover="manual" className={`fb-toast is-${note.type}`} role={note.type === 'error' ? 'alert' : 'status'}
      style={{ '--fb-life': `${LIFE[note.type]}ms` }}
      initial={{ y: -10, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -6, opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}>
      <span className="fb-toast-icon">{note.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}</span>
      <span className="fb-toast-text">{note.message}</span>
      <button type="button" className="fb-toast-close" onClick={onClose} aria-label="Dismiss"><X size={15} /></button>
    </motion.div>
  );
}

function AskDialog({ req, onDone }) {
  const ref = useRef(null);
  const done = useRef(false);
  useEffect(() => { ref.current?.showModal(); }, []);
  const finish = (yes) => {
    if (done.current) return;
    done.current = true;
    ref.current?.close();
    onDone(yes);
  };
  return (
    <dialog ref={ref} className="fb-ask" aria-labelledby="fb-ask-title" aria-describedby={req.text ? 'fb-ask-text' : undefined}
      onClose={() => finish(false)} onClick={(e) => { if (e.target === ref.current) finish(false); }}>
      <div className="fb-ask-head">
        <span className={`fb-icon${req.danger ? ' is-danger' : ''}`} aria-hidden="true">{req.icon || <AlertTriangle size={20} />}</span>
        <h2 id="fb-ask-title">{req.title}</h2>
      </div>
      {req.text && <p id="fb-ask-text">{req.text}</p>}
      <div className="fb-actions">
        <button type="button" className="fb-btn" onClick={() => finish(false)}>{req.cancelLabel || 'Cancel'}</button>
        <button type="button" className={`fb-btn ${req.danger ? 'is-danger' : 'is-primary'}`} onClick={() => finish(true)}>{req.confirmLabel || 'OK'}</button>
      </div>
    </dialog>
  );
}

/** Draws whatever toast() and ask() from utils/feedback ask for. Mounted once, in App. */
export default function FeedbackHost() {
  const [note, setNote] = useState(null);
  const [asks, setAsks] = useState([]); // one box at a time, in order
  useEffect(() => connectFeedback(({ toast, ask }) => {
    if (toast) setNote(toast);
    if (ask) setAsks((q) => [...q, ask]);
  }), []);
  useEffect(() => {
    if (!note) return undefined;
    const id = setTimeout(() => setNote(null), LIFE[note.type]);
    return () => clearTimeout(id);
  }, [note]);
  const req = asks[0];
  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>{note && <Toast key={note.id} note={note} onClose={() => setNote(null)} />}</AnimatePresence>
      {req && <AskDialog key={req.id} req={req} onDone={(yes) => { req.resolve(yes); setAsks((q) => q.slice(1)); }} />}
    </MotionConfig>
  );
}

/** In place of a list or page that didn't load: says so and offers to try again. */
export function LoadError({ what = 'this', onRetry }) {
  return (
    <div className="fb-load" role="alert">
      <span className="fb-icon" aria-hidden="true"><WifiOff size={20} /></span>
      <p><strong>Couldn’t load {what}.</strong> Check your connection and try again.</p>
      {onRetry && <button type="button" className="fb-btn is-primary" onClick={onRetry}><RotateCw size={14} /> Try again</button>}
    </div>
  );
}

// After a deploy the old page files are gone; one quick reload fetches the new ones.
const STALE_CODE = /dynamically imported module|Importing a module script failed|error loading dynamically imported|Loading chunk/i;

/** Catches a crash below it and shows a way out instead of a blank page. A new `resetKey` (the path) clears it. */
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) { return { error }; }

  componentDidCatch(error) {
    console.error(error);
    const last = Number(sessionStorage.getItem('fb-reloaded')) || 0;
    if (STALE_CODE.test(error?.message || '') && Date.now() - last > 15000) {
      sessionStorage.setItem('fb-reloaded', String(Date.now()));
      window.location.reload();
    }
  }

  componentDidUpdate(prev) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className={`fb-crash${this.props.full ? ' is-full' : ''}`} role="alert">
        <span className="fb-icon is-danger" aria-hidden="true"><AlertTriangle size={24} /></span>
        <h1>Something went wrong</h1>
        <p>This page ran into a problem. Nothing you saved is lost. Try again, or reload the page.</p>
        <div className="fb-actions">
          <button type="button" className="fb-btn" onClick={() => window.location.reload()}><RotateCw size={14} /> Reload page</button>
          <button type="button" className="fb-btn is-primary" onClick={() => this.setState({ error: null })}>Try again</button>
        </div>
      </div>
    );
  }
}
