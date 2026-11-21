import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, LifeBuoy, Compass } from 'lucide-react';
import useSEO from '../hooks/useSEO';
import '../styles/Register.css';
import '../styles/InfoPages.css';

function NotFound() {
  const navigate = useNavigate();
  useSEO({ title: 'Page Not Found', noindex: true });
  const signedIn = !!localStorage.getItem('user');

  return (
    <div className="ip ip--center">
      <div className="rg-aurora" aria-hidden="true"><span className="a1" /><span className="a2" /><span className="a3" /></div>
      <div className="ip-404">
        <div className="ip-404-art" aria-hidden="true">
          <span className="ip-404-num">4</span>
          <span className="ip-404-compass"><Compass size={54} strokeWidth={1.6} /></span>
          <span className="ip-404-num">4</span>
        </div>
        <p className="ip-404-kicker">This page took a wrong turn</p>
        <h1>Page not found</h1>
        <p>The page you’re looking for doesn’t exist or may have moved. Let’s get you back on the road.</p>
        <div className="ip-404-actions">
          <button type="button" className="rg-btn rg-btn-primary" onClick={() => navigate(signedIn ? '/posts' : '/')}><Home size={16} /> {signedIn ? 'Go to Posts' : 'Back to Home'}</button>
          <button type="button" className="rg-btn rg-btn-ghost" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Go back</button>
        </div>
        <Link to="/help" className="ip-404-help"><LifeBuoy size={14} /> Need help? Visit Help &amp; Support</Link>
      </div>
    </div>
  );
}

export default NotFound;
