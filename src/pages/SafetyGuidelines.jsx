import { Link } from 'react-router-dom';
import { motion, MotionConfig } from 'framer-motion';
import { ShieldCheck, AlertTriangle, LifeBuoy, ArrowRight } from 'lucide-react';
import useSEO from '../hooks/useSEO';
import '../styles/Register.css';
import '../styles/InfoPages.css';

const TIPS = [
  ['📱', 'Share Your Plans', 'Always inform family/friends about your travel plans, host details, and expected return time. Share your location and keep them updated.'],
  ['🌍', 'Meet in Public First', 'Arrange initial meetings in public places like cafes or restaurants before going to private locations. This helps build trust and ensures safety.'],
  ['📞', 'Video Call Before Meeting', 'Have a video conversation to verify identity and get comfortable before meeting in person. This is an important step for both parties.'],
  ['📲', 'Keep Emergency Contacts', 'Save local emergency numbers and keep your phone charged. Share live location with trusted contacts during your stay.'],
  ['👥', 'Trust Your Instincts', "If something feels wrong, don't hesitate to leave. Your safety is more important than being polite. Listen to your gut feeling."],
  ['💳', 'Secure Payment Methods', 'Use secure payment methods and avoid carrying large amounts of cash. Keep copies of important documents in a safe place.'],
];
const REMINDERS = [
  'Never share sensitive personal information (bank details, passwords) with anyone',
  "Verify the identity of the person you're meeting through video calls",
  'Keep your family/friends informed about your whereabouts at all times',
  'Report any suspicious behavior or safety concerns immediately',
  'Use the in-app messaging system for all communications',
  'Read reviews and check profiles carefully before making arrangements',
];

const SafetyGuidelines = () => {
  useSEO({ title: 'Safety Guidelines', description: 'Safety guidelines for staying with or becoming a trusted local host in India — verification, best practices, and guest safety tips.' });
  return (
    <MotionConfig reducedMotion="user">
      <div className="ip">
        <div className="rg-aurora" aria-hidden="true"><span className="a1" /><span className="a2" /><span className="a3" /></div>
        <div className="ip-shell">
          <header className="ip-hero">
            <span className="ip-hero-icon" aria-hidden="true"><ShieldCheck size={24} /></span>
            <h1>Safety Guidelines</h1>
            <p>Please read these guidelines carefully before meeting hosts or guests</p>
          </header>

          <ol className="ip-tips">
            {TIPS.map(([emoji, title, text], i) => (
              <motion.li key={title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}>
                <span className="ip-tip-emoji" aria-hidden="true">{emoji}</span>
                <span className="ip-tip-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <h2>{title}</h2>
                <p>{text}</p>
              </motion.li>
            ))}
          </ol>

          <section className="ip-remind">
            <h2><AlertTriangle size={18} /> Important Reminders</h2>
            <ul>{REMINDERS.map((r) => <li key={r}>{r}</li>)}</ul>
          </section>

          <section className="ip-cta">
            <span className="ip-cta-icon" aria-hidden="true"><LifeBuoy size={20} /></span>
            <div>
              <h2>Need Help?</h2>
              <p>If you experience any safety concerns or need assistance, please contact us immediately.</p>
            </div>
            <Link to="/help" className="rg-btn rg-btn-primary ip-cta-btn">Contact Support <ArrowRight size={16} /></Link>
          </section>
        </div>
      </div>
    </MotionConfig>
  );
};

export default SafetyGuidelines;
