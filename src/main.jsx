import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './styles/index.css'
import App from './App.jsx'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

// Older logins saved the member's full phone number in the browser; the API now sends it masked (98******10), so drop a full one.
try {
  const saved = JSON.parse(localStorage.getItem('user'))
  if (saved && /^\d+$/.test(saved.phone || '')) {
    delete saved.phone
    localStorage.setItem('user', JSON.stringify(saved))
  }
} catch { /* nothing saved, or unreadable */ }

// Cloudflare Web Analytics (cookie-free). Live site only, so local runs and tests aren't counted.
if (location.hostname === 'www.festiveguest.com') {
  const beacon = document.createElement('script')
  beacon.type = 'module'
  beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js'
  beacon.dataset.cfBeacon = '{"token": "770e98793c8e4ba784329514dc4e77e4"}'
  document.head.appendChild(beacon)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
)
