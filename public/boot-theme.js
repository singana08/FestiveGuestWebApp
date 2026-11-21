// Runs before the app loads (a separate file because the CSP blocks inline
// scripts). Home and registration are dark pages, so paint the first frame
// dark instead of flashing the light default background. index.html's
// html.boot-dark rule stops applying once the app shell (.app-container) renders.
if (/^\/(home|register)?$/.test(location.pathname)) document.documentElement.classList.add('boot-dark');
