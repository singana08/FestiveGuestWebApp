// Runs before the app loads (a separate file because the CSP blocks inline
// scripts). Every page is dark except a few legacy ones, so paint the first
// frame dark instead of flashing the light default background. index.html's
// html.boot-dark rule stops applying once the app shell (.app-container) renders.
// Keep in sync with LIGHT_PAGES in src/App.jsx.
if (!/^\/(admin|browse|guest-dashboard|host-dashboard|subscription|chat|api-test|chat-debug)(\/|$)/.test(location.pathname)) document.documentElement.classList.add('boot-dark');
