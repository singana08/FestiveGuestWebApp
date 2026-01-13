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
            <li>Full name, email address, phone number</li>
            <li>Date of birth, gender, nationality</li>
            <li>Government-issued ID verification documents</li>
            <li>Profile photos and accommodation photos</li>
            <li>Address and location information</li>
            <li>Payment information (processed securely through third-party providers)</li>
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
            <li>Verify user identity and ensure platform safety</li>
            <li>Process payments and transactions</li>
            <li>Provide customer support and resolve disputes</li>
            <li>Send important notifications about bookings and safety</li>
            <li>Improve our services and user experience</li>
            <li>Comply with legal obligations and prevent fraud</li>
            <li>Send marketing communications (with your consent)</li>
          </ul>
        </section>

        <section>
          <h2>4. Information Sharing and Disclosure</h2>
          
          <h3>4.1 Privacy-First Approach</h3>
          <p>We prioritize user privacy and do NOT share personal contact details (email addresses, phone numbers) directly between users. Instead:</p>
          <ul>
            <li>Contact information is masked/hidden in user profiles</li>
            <li>Users communicate through our secure in-app chat system</li>
            <li>Contact sharing is entirely voluntary and at user discretion</li>
            <li>We collect contact details solely for our reference and emergency purposes</li>
          </ul>

          <h3>4.2 What We Share Between Users</h3>
          <p>We only share non-sensitive information necessary for connections:</p>
          <ul>
            <li>Profile information (name, photo, bio, preferences)</li>
            <li>Accommodation details and photos (for hosts)</li>
            <li>Reviews and ratings</li>
            <li>General location area (not exact addresses)</li>
            <li>Availability and travel dates</li>
          </ul>

          <h3>4.3 Service Providers</h3>
          <p>We may share information with trusted third-party service providers who assist us in operating our platform, including payment processors, identity verification services, and customer support tools. These providers are bound by strict confidentiality agreements.</p>

          <h3>4.4 Legal Requirements</h3>
          <p>We may disclose your information when required by law, court order, or government request, or to protect our rights, property, or safety.</p>

          <h3>4.5 Business Transfers</h3>
          <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the business transaction.</p>
        </section>

        <section>
          <h2>5. Data Security</h2>
          <p>We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.</p>
          
          <h3>Security Measures Include:</h3>
          <ul>
            <li>Encryption of sensitive data in transit and at rest</li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>Access controls and authentication mechanisms</li>
            <li>Employee training on data protection practices</li>
            <li>Incident response procedures</li>
          </ul>
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
            <li><strong>Erasure:</strong> Request deletion of your personal information</li>
            <li><strong>Portability:</strong> Request transfer of your data to another service</li>
            <li><strong>Restriction:</strong> Request limitation of processing</li>
            <li><strong>Objection:</strong> Object to processing for marketing purposes</li>
            <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing</li>
          </ul>
          <p>To exercise these rights, contact us at privacy@localhostconnect.com</p>
        </section>

        <section>
          <h2>8. Cookies and Tracking Technologies</h2>
          <p>We use cookies and similar technologies to enhance your experience. Types of cookies we use:</p>
          <ul>
            <li><strong>Essential Cookies:</strong> Required for basic platform functionality</li>
            <li><strong>Performance Cookies:</strong> Help us understand how users interact with our platform</li>
            <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
            <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements</li>
          </ul>
          <p>You can control cookie preferences through your browser settings.</p>
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
          <p>If you have questions about this Privacy Policy or our data practices, please visit our <Link to="/help" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Help & Support page</Link> for contact information and assistance.</p>
        </section>

        <section>
          <h2>14. Governing Law</h2>
          <p>This Privacy Policy is governed by the laws of India. Any disputes arising from this policy will be subject to the exclusive jurisdiction of the courts in [Your City], India.</p>
        </section>

        <section>
          <h2>15. Compliance</h2>
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