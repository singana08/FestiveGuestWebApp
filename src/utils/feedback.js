// The app's toasts and "are you sure?" boxes. <FeedbackHost /> (mounted once in App) draws them,
// so any page or component can call these without its own toast state.
let host = null;
export const connectFeedback = (fn) => { host = fn; return () => { if (host === fn) host = null; }; };

/** A short note in the corner. type: 'success' | 'error'. */
export const toast = (message, type = 'success') => host?.({ toast: { message, type, id: Date.now() } });

/**
 * A styled confirm box; resolves true when confirmed, false on Cancel / Esc / a click outside.
 * opts: { title, text?, confirmLabel?, cancelLabel?, danger? }
 */
export const ask = (opts) => new Promise((resolve) => {
  if (!host) { resolve(window.confirm(opts.title)); return; }
  host({ ask: { ...opts, id: Date.now(), resolve } });
});
