import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="legal-document">
      <div className="container">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last Updated: {new Date().toLocaleDateString('en-IN')}</p>
        
        <section>
          <h2>1. Introduction</h2>
          <p>Local Host Connect ("we," "our," or "us") operates the FestiveGuestWebApp platform that connects travelers with local hosts. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.</p>
          <p>By using our service, you agree to the collection and use of information in accordance with this policy.</p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          
          <h3>2.1 Personal Information</h3>
          <ul>
            <li>Full name, email address, phone number, and state (from registration)</li>
            <li>Messages exchanged via WhatsApp (only for subscription verification)</li>
            <li>Screenshots of payment confirmations (used solely for subscription activation)</li>
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
            <li>Verify subscription payments manually via WhatsApp</li>
            <li>Update your database and unlock premium features</li>
            <li>Communicate with users about their account and support</li>
            <li>Verify user identity and ensure platform safety</li>
            <li>Provide customer support and resolve disputes</li>
            <li>Send important notifications about bookings and safety</li>
            <li>Improve our services and user experience</li>
            <li>Comply with legal obligations and prevent fraud</li>
          </ul>
        </section>

        <section>
          <h2>4. Information Sharing and Disclosure</h2>
          
          <h3>4.1 No Third-Party Sharing</h3>
          <p><strong>We do not share your personal information or payment details with any external services or third parties.</strong> Your data remains confidential and is used solely for platform operations.</p>

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
            <li><strong>Payment Screenshots:</strong> Stored temporarily until verification is complete, then deleted within 7 days</li>
            <li><strong>User Account Details:</strong> Stored securely in our database hosted on Azure Static Web Apps</li>
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
            <li>Transaction records: 7 years from transaction date</li>
            <li>Communication records: 3 years from last communication</li>
            <li>Marketing data: Until you withdraw consent</li>
          </ul>
        </section>

        <section>
          <h2>7. Your Rights</h2>
          <p>Under applicable data protection laws, you have the following rights:</p>
          <ul>
            <li><strong>Access:</strong> Request copies of your personal information</li>
            <li><strong>Rectification:</strong> Request correction of inaccurate information</li>
            <li><strong>Erasure:</strong> Request deletion of your personal information (account + payment proof)</li>
            <li><strong>Portability:</strong> Request transfer of your data to another service</li>
            <li><strong>Restriction:</strong> Request limitation of processing</li>
            <li><strong>Objection:</strong> Object to processing for marketing purposes</li>
            <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing</li>
          </ul>
          <p>To exercise these rights, contact us via WhatsApp at [Your WhatsApp Number] or email at privacy@localhostconnect.com</p>
        </section>

        <section>
          <h2>8. Cookies and Tracking Technologies</h2>
          <p>We use cookies and similar technologies to enhance your experience. Types of cookies we use:</p>
          <ul>
            <li><strong>Essential Cookies:</strong> Required for basic platform functionality (session management, authentication)</li>
            <li><strong>Performance Cookies:</strong> Google Analytics to understand user interactions and improve platform performance</li>
            <li><strong>Functional Cookies:</strong> Remember your preferences, settings, and language choices</li>
            <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements (if applicable)</li>
          </ul>
          <p>You can control cookie preferences through your browser settings. Note that disabling essential cookies may affect platform functionality.</p>
          
          <h3>8.1 Session Cookies</h3>
          <p>We use session cookies to maintain your login state and ensure secure access to your account. These cookies are deleted when you close your browser.</p>
          
          <h3>8.2 Analytics and Tracking</h3>
          <p>We use Google Analytics to collect anonymized data about how users interact with our platform. This helps us improve user experience and identify technical issues. You can opt out of Google Analytics by installing the Google Analytics Opt-out Browser Add-on.</p>
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
            <p>Email: privacy@localhostconnect.com</p>
            <p>Support Email: support@localhostconnect.com</p>
            <p>For general inquiries, please visit our <Link to="/help" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Help & Support page</Link>.</p>
            <p><strong>Mailing Address:</strong></p>
            <p>Local Host Connect<br/>
            [Your Business Address]<br/>
            [City, State, PIN Code]<br/>
            India</p>
          </div>
        </section>

        <section>
          <h2>14. Manual Payment Verification</h2>
          <p><strong>Important Notice:</strong> FestiveGuest uses a manual payment verification process via WhatsApp for subscription payments.</p>
          
          <h3>14.1 Process</h3>
          <ul>
            <li>Payments are verified manually by our team</li>
            <li>Users submit payment screenshots via WhatsApp</li>
            <li>Verification may take up to 24-48 hours</li>
          </ul>

          <h3>14.2 Limitations</h3>
          <ul>
            <li>Delays may occur due to manual verification process</li>
            <li>FestiveGuest is not liable for incorrect or fraudulent payment screenshots</li>
            <li>Users are responsible for submitting accurate payment proof</li>
            <li>Refunds are subject to verification and our refund policy</li>
          </ul>

          <h3>14.3 Data Handling</h3>
          <ul>
            <li>Payment screenshots are stored temporarily for verification only</li>
            <li>Screenshots are deleted within 7 days after verification</li>
            <li>No payment information is shared with third parties</li>
          </ul>
        </section>

        <section>
          <h2>15. Governing Law</h2>
          <p>This Privacy Policy is governed by the laws of India. Any disputes arising from this policy will be subject to the exclusive jurisdiction of the courts in [Your City], India.</p>
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