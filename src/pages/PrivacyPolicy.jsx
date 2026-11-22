import React from 'react';
import useSEO from '../hooks/useSEO';
import LegalToc from '../components/LegalToc';
import '../styles/InfoPages.css';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  useSEO({ title: 'Privacy Policy', description: "How FestiveGuest, India's trusted local host platform, collects, uses, and protects your data." });
  return (
    <div className="legal-document">
      <div className="container">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last Updated: 22 November 2026</p>
        <LegalToc />

        <section>
          <h2>1. Introduction</h2>
          <p>FestiveGuest ("we," "our," or "us") operates the FestiveGuest platform that connects travelers with local hosts. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.</p>
          <p>By using our service, you agree to the collection and use of information in accordance with this policy.</p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          
          <h3>2.1 Personal Information</h3>
          <ul>
            <li>Full name, email address, phone number, and state (from registration)</li>
            <li>Reports you submit about other members, and members you block</li>
            <li>Profile photos and accommodation photos</li>
            <li>Address and location information</li>
            <li>Emergency contact details</li>
          </ul>

          <h3>2.2 Usage Information</h3>
          <ul>
            <li>Device information (IP address, browser type, operating system)</li>
            <li>Usage patterns and preferences</li>
            <li>Communication records between users</li>
            <li>Location data when using our services</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>

          <h3>2.3 User-Generated Content</h3>
          <ul>
            <li>Reviews and ratings</li>
            <li>Messages and communications</li>
            <li>Photos and descriptions of accommodations</li>
            <li>Profile information and preferences</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <ul>
            <li>Facilitate connections between hosts and guests</li>
            <li>Communicate with users about their account and support</li>
            <li>Verify user identity and ensure platform safety</li>
            <li>Provide customer support and resolve disputes</li>
            <li>Email you about new posts in your area (you can turn this off in your profile) and send important account and safety notices</li>
            <li>Improve our services and user experience</li>
            <li>Comply with legal obligations and prevent fraud</li>
          </ul>
        </section>

        <section>
          <h2>4. Information Sharing and Disclosure</h2>
          
          <h3>4.1 No Selling or Advertising</h3>
          <p><strong>We do not sell your personal information or share it with advertisers.</strong> We use a small number of service providers only to run the platform: Microsoft Azure (hosting, data storage and error monitoring), our email delivery provider (verification codes and notifications), 2Factor (SMS verification codes) and Cloudflare (aggregate website analytics). They process data only to provide these services to us.</p>

          <h3>4.2 Privacy-First Approach</h3>
          <p>We prioritize user privacy and do NOT share personal contact details (email addresses, phone numbers) directly between users. Instead:</p>
          <ul>
            <li>Contact information is masked/hidden in user profiles</li>
            <li>Users communicate through our secure in-app chat system</li>
            <li>Contact sharing is entirely voluntary and at user discretion</li>
            <li>We collect contact details solely for our reference and emergency purposes</li>
          </ul>

          <h3>4.3 What We Share Between Users</h3>
          <p>We only share non-sensitive information necessary for connections:</p>
          <ul>
            <li>Profile information (name, photo, bio, preferences)</li>
            <li>Accommodation details and photos (for hosts)</li>
            <li>Reviews and ratings</li>
            <li>General location area (not exact addresses)</li>
            <li>Availability and travel dates</li>
          </ul>

          <h3>4.4 Legal Requirements</h3>
          <p>We may disclose your information when required by law, court order, or government request, or to protect our rights, property, or safety.</p>

          <h3>4.5 Business Transfers</h3>
          <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the business transaction.</p>
        </section>

        <section>
          <h2>5. Data Storage and Security</h2>
          
          <h3>5.1 Data Storage</h3>
          <ul>
            <li><strong>User Account Details:</strong> Stored securely in Microsoft Azure data storage</li>
            <li><strong>Access Control:</strong> Access to user data is restricted to authorized admins only</li>
          </ul>

          <h3>5.2 Security Measures</h3>
          <p>We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
          
          <p>Security Measures Include:</p>
          <ul>
            <li><strong>Secure Hosting:</strong> Hosted on Microsoft Azure with enterprise-grade security features</li>
            <li><strong>Encryption:</strong> SSL/TLS encryption for data in transit</li>
            <li><strong>Access Controls:</strong> Role-based access control with restricted admin access</li>
            <li><strong>Limited Access:</strong> Personal data access restricted to authorized personnel only on a need-to-know basis</li>
            <li><strong>Regular Monitoring:</strong> Security monitoring and vulnerability assessments</li>
          </ul>
          
          <h3>5.3 Data Breach Notification</h3>
          <p>In the event of a data breach that may compromise your personal information, we will notify affected users within 72 hours of becoming aware of the breach, as required by applicable law.</p>
        </section>

        <section>
          <h2>6. Data Retention</h2>
          <p>We retain your personal information for as long as necessary to provide our services and comply with legal obligations. Specific retention periods:</p>
          <ul>
            <li>Account information: Until account deletion plus 7 years for legal compliance</li>
            <li>Communication records: 3 years from last communication</li>
          </ul>
        </section>

        <section>
          <h2>7. Your Rights</h2>
          <p>Under applicable data protection laws, you have the following rights:</p>
          <ul>
            <li><strong>Access:</strong> Request copies of your personal information</li>
            <li><strong>Rectification:</strong> Request correction of inaccurate information</li>
            <li><strong>Erasure:</strong> Request deletion of your personal information (your account and its data)</li>
            <li><strong>Portability:</strong> Request transfer of your data to another service</li>
            <li><strong>Restriction:</strong> Request limitation of processing</li>
            <li><strong>Objection:</strong> Object to processing for marketing purposes</li>
            <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing</li>
          </ul>
          <p>To exercise these rights, contact us via WhatsApp at <a href="https://wa.me/919966888484" target="_blank" rel="noopener noreferrer">+91 99668 88484</a> or email at customer-support@festiveguest.com</p>
        </section>

        <section>
          <h2>8. Cookies, Analytics and Monitoring</h2>
          <p>We do not use advertising or marketing cookies, and we do not use your data for advertising.</p>

          <h3>8.1 Sign-in and Preferences</h3>
          <p>To keep you signed in and remember choices such as your language, we store a sign-in token and your settings in your browser's local storage. They remain until you sign out or clear your browser data. If you use Google Sign-In, Google may set its own cookies under Google's privacy policy.</p>

          <h3>8.2 Website Analytics</h3>
          <p>We use Cloudflare Web Analytics to understand how the platform is used: page views, which pages are visited, which websites referred visitors, general country, browser and device type, and page loading speed. It does not use cookies, does not track individual visitors, and reports to us only in aggregate.</p>

          <h3>8.3 Error Monitoring</h3>
          <p>Our servers record technical details of requests and errors (such as the address requested, the time and the error message) using Microsoft Azure Application Insights, so we can find and fix problems. This information is kept in our Azure account and is not used for advertising.</p>
        </section>

        <section>
          <h2>9. International Data Transfers</h2>
          <p>Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for such transfers, including:</p>
          <ul>
            <li>Adequacy decisions by relevant authorities</li>
            <li>Standard contractual clauses</li>
            <li>Binding corporate rules</li>
            <li>Certification schemes</li>
          </ul>
        </section>

        <section>
          <h2>10. Children's Privacy</h2>
          <p>Our service is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children under 18. If we become aware that we have collected personal information from a child under 18, we will take steps to delete such information.</p>
        </section>

        <section>
          <h2>11. Third-Party Links</h2>
          <p>Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies before providing any personal information.</p>
        </section>

        <section>
          <h2>12. Changes to This Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by:</p>
          <ul>
            <li>Posting the updated policy on our platform</li>
            <li>Sending email notifications to registered users</li>
            <li>Displaying prominent notices on our platform</li>
          </ul>
          <p>Your continued use of our service after changes become effective constitutes acceptance of the updated policy.</p>
        </section>

        <section>
          <h2>13. Contact Information</h2>
          <div className="contact-info">
            <p><strong>Data Protection Officer / Privacy Contact:</strong></p>
            <p>Email: customer-support@festiveguest.com</p>
            <p>WhatsApp: <a href="https://wa.me/919966888484" target="_blank" rel="noopener noreferrer">+91 99668 88484</a></p>
            <p>For general inquiries, please visit our <Link to="/help" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Help & Support page</Link>.</p>
          </div>
        </section>

        <section>
          <h2>14. Payments</h2>
          <p>FestiveGuest is free during its launch and does not collect any payments or payment details. If paid features are introduced, we will update this policy before collecting any payment information. Any arrangement between a host and a guest is made directly between them, outside our platform.</p>
        </section>

        <section>
          <h2>15. Governing Law</h2>
          <p>This Privacy Policy is governed by the laws of India. Any disputes arising from this policy will be subject to the exclusive jurisdiction of the competent courts in India.</p>
        </section>

        <section>
          <h2>16. Compliance</h2>
          <p>We comply with applicable data protection laws, including:</p>
          <ul>
            <li>Information Technology Act, 2000 (India)</li>
            <li>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</li>
            <li>Digital Personal Data Protection Act, 2023 (when applicable)</li>
            <li>General Data Protection Regulation (GDPR) for EU users</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;