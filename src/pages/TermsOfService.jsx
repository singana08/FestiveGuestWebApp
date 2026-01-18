import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
  return (
    <div className="legal-document">
      <div className="container">
        <h1>Terms of Service</h1>
        <p className="last-updated">Last Updated: {new Date().toLocaleDateString('en-IN')}</p>
        
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using Local Host Connect ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.</p>
          <p>These Terms constitute a legally binding agreement between you and Local Host Connect.</p>
        </section>

        <section>
          <h2>2. Description of Service</h2>
          <p>Local Host Connect is a platform that connects travelers ("Guests") with local accommodation providers ("Hosts"). We facilitate introductions and provide tools for communication, but we do not provide accommodation services directly.</p>
          
          <h3>2.1 Platform Services Include:</h3>
          <ul>
            <li>User registration and profile creation</li>
            <li>Host and guest matching services</li>
            <li>Secure messaging system</li>
            <li>Review and rating system</li>
            <li>Payment processing facilitation</li>
            <li>Customer support services</li>
          </ul>

          <h3>2.2 IMPORTANT: We Are an Introduction Service Only</h3>
          <p><strong>Local Host Connect operates solely as an introduction and communication platform. We explicitly disclaim any responsibility for:</strong></p>
          <ul>
            <li><strong>User Verification:</strong> We do not conduct background checks, criminal record searches, or verify the identity, character, or existence of users</li>
            <li><strong>User Behavior:</strong> We are not responsible for the conduct, actions, or behavior of any user on or off the platform</li>
            <li><strong>Communication Quality:</strong> We do not monitor, moderate, or take responsibility for the quality, tone, or content of communications between users</li>
            <li><strong>Meeting Arrangements:</strong> We are not involved in or responsible for any in-person meetings, accommodations, or arrangements made between users</li>
            <li><strong>Safety and Security:</strong> We do not guarantee the safety, security, or well-being of users during interactions or meetings</li>
            <li><strong>Disputes and Conflicts:</strong> We are not responsible for resolving disputes, conflicts, or disagreements between users</li>
            <li><strong>Financial Transactions:</strong> While we may facilitate payment processing, we are not responsible for payment disputes or financial arrangements between users</li>
            <li><strong>Property and Belongings:</strong> We are not responsible for damage to property, theft, or loss of belongings during user interactions</li>
            <li><strong>Accommodation Quality:</strong> We do not inspect, verify, or guarantee the quality, safety, or suitability of accommodations</li>
            <li><strong>User Representations:</strong> We do not verify the accuracy of information provided by users in their profiles or communications</li>
          </ul>
        </section>

        <section>
          <h2>3. User Eligibility</h2>
          <p>To use our Service, you must:</p>
          <ul>
            <li>Be at least 18 years of age</li>
            <li>Have the legal capacity to enter into binding contracts</li>
            <li>Provide accurate and complete registration information</li>
            <li>Comply with all applicable laws and regulations</li>
            <li>Not be prohibited from using the Service under applicable law</li>
          </ul>
        </section>

        <section>
          <h2>4. User Accounts and Registration</h2>
          
          <h3>4.1 Account Creation</h3>
          <p>You must create an account to use our Service. You are responsible for:</p>
          <ul>
            <li>Providing accurate, current, and complete information</li>
            <li>Maintaining the security of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Immediately notifying us of any unauthorized use</li>
          </ul>

          <h3>4.2 Identity Verification</h3>
          <p>We may require identity verification through government-issued documents. Failure to provide required verification may result in account suspension or termination.</p>

          <h3>4.3 Account Termination</h3>
          <p>You may terminate your account at any time. We reserve the right to suspend or terminate accounts that violate these Terms.</p>
        </section>

        <section>
          <h2>5. User Conduct and Responsibilities</h2>
          
          <h3>5.1 Prohibited Activities</h3>
          <p>You agree not to:</p>
          <ul>
            <li>Violate any applicable laws or regulations</li>
            <li>Provide false, misleading, or fraudulent information</li>
            <li>Impersonate any person or entity</li>
            <li>Harass, threaten, or harm other users</li>
            <li>Use the Service for commercial purposes without authorization</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with the proper functioning of the Service</li>
            <li>Post inappropriate, offensive, or illegal content</li>
            <li>Discriminate based on race, religion, gender, or other protected characteristics</li>
          </ul>

          <h3>5.2 Host Responsibilities</h3>
          <p>As a Host, you must:</p>
          <ul>
            <li>Provide accurate descriptions of your accommodation</li>
            <li>Ensure your property meets safety and legal requirements</li>
            <li>Comply with local laws, regulations, and tax obligations</li>
            <li>Maintain appropriate insurance coverage</li>
            <li>Treat guests with respect and without discrimination</li>
            <li>Honor confirmed bookings or provide adequate notice of cancellation</li>
          </ul>

          <h3>5.3 Guest Responsibilities</h3>
          <p>As a Guest, you must:</p>
          <ul>
            <li>Provide accurate information about your travel plans</li>
            <li>Respect the host's property and house rules</li>
            <li>Comply with local laws and customs</li>
            <li>Leave the accommodation in good condition</li>
            <li>Honor confirmed bookings or provide adequate notice of cancellation</li>
          </ul>
        </section>

        <section>
          <h2>6. Booking and Communication</h2>
          
          <h3>6.1 Privacy-Protected Communication</h3>
          <p>All initial communication between users occurs through our secure in-app messaging system. We do not share personal contact details (email, phone) between users. Contact sharing is entirely voluntary and at the discretion of individual users.</p>

          <h3>6.2 Booking Process</h3>
          <p>Connections and arrangements are facilitated through our platform messaging system. We provide the tools for communication but are not a party to agreements between users.</p>

          <h3>6.3 Payment Processing and Terms</h3>
          <ul>
            <li><strong>Payment Methods:</strong> We use third-party payment processors (Stripe, PayPal, or similar) for secure transactions</li>
            <li><strong>Service Fees:</strong> We charge a service fee of [X]% on each transaction for platform usage</li>
            <li><strong>Payment Terms:</strong> Payment terms are agreed upon between hosts and guests through our platform</li>
            <li><strong>Currency:</strong> All payments are processed in Indian Rupees (INR) unless otherwise specified</li>
            <li><strong>Taxes:</strong> All payments are subject to applicable GST and other taxes as per Indian law</li>
            <li><strong>Payment Security:</strong> We do not store credit card information; all payment data is handled by PCI-compliant processors</li>
            <li><strong>Failed Payments:</strong> Failed payments may result in booking cancellation or account suspension</li>
          </ul>

          <h3>6.4 Refund Policy</h3>
          <p><strong>Refund eligibility depends on the following:</strong></p>
          <ul>
            <li><strong>Host Cancellation Policy:</strong> Each host sets their own cancellation policy (Flexible, Moderate, or Strict)</li>
            <li><strong>Cancellation Timeframes:</strong>
              <ul>
                <li>Flexible: Full refund if cancelled 24 hours before check-in</li>
                <li>Moderate: Full refund if cancelled 5 days before check-in</li>
                <li>Strict: 50% refund if cancelled 7 days before check-in</li>
              </ul>
            </li>
            <li><strong>Service Fee:</strong> Service fees are non-refundable except in cases of host cancellation</li>
            <li><strong>Extraordinary Circumstances:</strong> Full refunds may be provided for natural disasters, government travel bans, or platform errors</li>
            <li><strong>Dispute Resolution:</strong> Refund disputes must be submitted within 14 days of check-in date</li>
            <li><strong>Processing Time:</strong> Approved refunds are processed within 5-10 business days</li>
          </ul>

          <h3>6.5 Chargebacks and Payment Disputes</h3>
          <p><strong>Important Notice:</strong></p>
          <ul>
            <li>Initiating a chargeback without contacting us first may result in immediate account suspension</li>
            <li>We provide dispute resolution services and will work with both parties to resolve payment issues</li>
            <li>Fraudulent chargebacks may result in permanent account termination and legal action</li>
            <li>All payment disputes must be reported within 30 days of the transaction</li>
          </ul>
        </section>

        <section>
          <h2>7. Safety and Security</h2>
          
          <h3>7.1 Safety Guidelines</h3>
          <p>We provide safety guidelines and recommendations, but users are responsible for their own safety and security. We strongly recommend:</p>
          <ul>
            <li>Meeting in public places initially</li>
            <li>Informing trusted contacts of your plans</li>
            <li>Verifying host/guest identity before meeting</li>
            <li>Trusting your instincts and leaving if uncomfortable</li>
            <li>Maintaining emergency contact information</li>
          </ul>

          <h3>7.2 Background Checks</h3>
          <p>We may conduct background checks on users but do not guarantee the accuracy or completeness of such checks. Users should exercise their own judgment when interacting with others.</p>

          <h3>7.3 Reporting and Response</h3>
          <p>Users must report any safety concerns, inappropriate behavior, or violations of these Terms immediately. We will investigate reports and take appropriate action.</p>
        </section>

        <section>
          <h2>8. Platform Limitations and User Responsibility</h2>
          
          <h3>8.1 No Verification or Background Checks</h3>
          <p><strong>IMPORTANT NOTICE:</strong> Local Host Connect does not:</p>
          <ul>
            <li>Conduct background checks on users</li>
            <li>Verify criminal records or legal history</li>
            <li>Confirm the identity, age, or personal details of users</li>
            <li>Investigate the character, reputation, or trustworthiness of users</li>
            <li>Verify the existence or legitimacy of users or their accommodations</li>
            <li>Confirm the accuracy of profile information, photos, or descriptions</li>
          </ul>

          <h3>8.2 User Responsibility for Due Diligence</h3>
          <p>Users are solely responsible for:</p>
          <ul>
            <li>Conducting their own research and verification of other users</li>
            <li>Making informed decisions about interactions and meetings</li>
            <li>Ensuring their own safety and security during all interactions</li>
            <li>Verifying the identity and legitimacy of other users before meeting</li>
            <li>Assessing the safety and suitability of accommodations</li>
            <li>Taking appropriate precautions during communications and meetings</li>
          </ul>

          <h3>8.3 No Monitoring of Communications</h3>
          <p>We do not:</p>
          <ul>
            <li>Monitor private messages between users</li>
            <li>Review or moderate user communications</li>
            <li>Intervene in disputes or disagreements between users</li>
            <li>Guarantee the quality, tone, or appropriateness of communications</li>
            <li>Take responsibility for misunderstandings or conflicts</li>
          </ul>

          <h3>8.4 No Involvement in User Arrangements</h3>
          <p>Local Host Connect is not involved in and takes no responsibility for:</p>
          <ul>
            <li>Arrangements made between hosts and guests</li>
            <li>The quality, safety, or condition of accommodations</li>
            <li>Payment arrangements or financial transactions between users</li>
            <li>Cancellations, no-shows, or changes to arrangements</li>
            <li>Disputes over accommodation quality, cleanliness, or amenities</li>
            <li>Personal conflicts or disagreements between users</li>
          </ul>
        </section>

        <section>
          <h2>9. Intellectual Property Rights</h2>
          
          <h3>9.1 Platform Ownership</h3>
          <p><strong>Local Host Connect owns all rights to:</strong></p>
          <ul>
            <li>The "Local Host Connect" and "FestiveGuest" brand names, logos, and trademarks</li>
            <li>Platform design, layout, and user interface</li>
            <li>Software, code, algorithms, and technology</li>
            <li>Platform features and functionality</li>
            <li>Documentation, guides, and support materials</li>
          </ul>
          <p>All platform content is protected by copyright, trademark, patent, and other intellectual property laws of India and international treaties.</p>

          <h3>9.2 User Content License</h3>
          <p>By posting content on our platform, you grant us:</p>
          <ul>
            <li>A worldwide, non-exclusive, royalty-free, transferable license</li>
            <li>The right to use, display, reproduce, modify, and distribute your content</li>
            <li>The right to use your content for marketing and promotional purposes</li>
            <li>The right to sublicense your content to third parties for platform operation</li>
          </ul>
          <p>You retain ownership of your content but grant us these rights for platform operation.</p>

          <h3>9.3 User Content Responsibilities</h3>
          <p>You represent and warrant that:</p>
          <ul>
            <li>You own or have rights to all content you post</li>
            <li>Your content does not infringe on third-party intellectual property rights</li>
            <li>You have obtained necessary permissions for photos of people or property</li>
            <li>Your content complies with all applicable laws</li>
          </ul>

          <h3>9.4 Prohibited Use of Platform IP</h3>
          <p>You may not:</p>
          <ul>
            <li>Copy, reproduce, or distribute platform content without written permission</li>
            <li>Use our trademarks, logos, or branding without authorization</li>
            <li>Create derivative works based on our platform</li>
            <li>Reverse engineer, decompile, or disassemble our software</li>
            <li>Use automated tools to scrape or extract platform data</li>
            <li>Frame or mirror any part of our platform</li>
          </ul>

          <h3>9.5 DMCA and Copyright Infringement</h3>
          <p>We respect intellectual property rights. If you believe content on our platform infringes your copyright, contact us with:</p>
          <ul>
            <li>Description of the copyrighted work</li>
            <li>Location of the infringing content</li>
            <li>Your contact information</li>
            <li>A statement of good faith belief</li>
            <li>A statement of accuracy under penalty of perjury</li>
            <li>Your physical or electronic signature</li>
          </ul>
        </section>

        <section>
          <h2>10. Privacy and Data Protection</h2>
          <p>Your privacy is important to us. Our <Link to="/privacy-policy" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>Privacy Policy</Link> explains how we collect, use, and protect your information. By using the Service, you consent to our data practices as described in the Privacy Policy.</p>
          
          <h3>10.1 Data Collection and Use</h3>
          <p>We collect and process personal data as outlined in our Privacy Policy, including:</p>
          <ul>
            <li>Account information (name, email, phone, date of birth)</li>
            <li>Identity verification documents</li>
            <li>Payment information (processed by third-party processors)</li>
            <li>Usage data and analytics</li>
            <li>Communication records</li>
          </ul>

          <h3>10.2 Data Protection Rights</h3>
          <p>You have the right to access, correct, delete, or export your personal data. Contact us to exercise these rights.</p>
        </section>

        <section>
          <h2>11. Disclaimers and Limitations of Liability</h2>
          
          <h3>11.1 Introduction Service Disclaimer</h3>
          <p><strong>CRITICAL NOTICE: Local Host Connect is ONLY an introduction and communication platform. We explicitly disclaim all responsibility for:</strong></p>
          <ul>
            <li><strong>No Background Checks:</strong> We do not conduct background checks, criminal record searches, identity verification, or character assessments of any users</li>
            <li><strong>No User Monitoring:</strong> We do not monitor, supervise, or control user behavior, communications, or interactions</li>
            <li><strong>No Safety Guarantees:</strong> We do not guarantee the safety, security, reliability, or trustworthiness of any user</li>
            <li><strong>No Verification of Information:</strong> We do not verify the accuracy, completeness, or truthfulness of user profiles, descriptions, or communications</li>
            <li><strong>No Responsibility for Meetings:</strong> We are not involved in or responsible for any in-person meetings, arrangements, or interactions between users</li>
            <li><strong>No Dispute Resolution Obligation:</strong> While we may provide dispute resolution tools, we are not obligated to resolve conflicts between users</li>
            <li><strong>No Accommodation Oversight:</strong> We do not inspect, verify, or guarantee the quality, safety, cleanliness, or suitability of any accommodation</li>
            <li><strong>No Financial Responsibility:</strong> We are not responsible for payment disputes, financial losses, or monetary arrangements between users</li>
          </ul>

          <h3>11.2 Service Disclaimer</h3>
          <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>

          <h3>11.3 Third-Party Services</h3>
          <p>We are not responsible for the actions, content, or services of third parties, including hosts, guests, payment processors, or other service providers.</p>

          <h3>11.4 Limitation of Liability</h3>
          <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR USE, ARISING FROM:</p>
          <ul>
            <li>User interactions, meetings, or communications</li>
            <li>Theft, damage, or loss of property</li>
            <li>Personal injury or harm during user interactions</li>
            <li>Fraudulent or criminal activity by users</li>
            <li>Disputes or conflicts between users</li>
            <li>Accommodation quality or safety issues</li>
            <li>Financial losses or payment disputes</li>
            <li>Any other interactions between users</li>
          </ul>

          <h3>11.5 Maximum Liability</h3>
          <p>Our total liability for any claims arising from your use of the Service shall not exceed the amount you paid to us in the twelve months preceding the claim, or $100, whichever is less.</p>
        </section>

        <section>
          <h2>12. Indemnification</h2>
          <p>You agree to indemnify, defend, and hold harmless Local Host Connect and its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from:</p>
          <ul>
            <li>Your use of the Service</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any rights of another party</li>
            <li>Your interactions with other users</li>
          </ul>
        </section>

        <section>
          <h2>13. Force Majeure</h2>
          <p>We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, including natural disasters, war, terrorism, government actions, or pandemics.</p>
        </section>

        <section>
          <h2>14. Modification of Terms</h2>
          <p>We reserve the right to modify these Terms at any time. We will notify users of material changes through:</p>
          <ul>
            <li>Email notifications to registered users</li>
            <li>Prominent notices on our platform</li>
            <li>In-app notifications</li>
          </ul>
          <p>Continued use of the Service after changes become effective constitutes acceptance of the modified Terms.</p>
        </section>

        <section>
          <h2>15. Termination</h2>
          
          <h3>15.1 Termination by Users</h3>
          <p>You may terminate your account at any time by following the account deletion process in your settings.</p>

          <h3>15.2 Termination by Us</h3>
          <p>We may suspend or terminate your account immediately if you:</p>
          <ul>
            <li>Violate these Terms</li>
            <li>Engage in fraudulent or illegal activities</li>
            <li>Pose a safety risk to other users</li>
            <li>Fail to pay applicable fees</li>
          </ul>

          <h3>15.3 Effect of Termination</h3>
          <p>Upon termination, your right to use the Service ceases immediately. Provisions that should survive termination will remain in effect.</p>
        </section>

        <section>
          <h2>16. Dispute Resolution</h2>
          
          <h3>16.1 Informal Resolution</h3>
          <p>Before initiating formal proceedings, parties agree to attempt informal resolution through direct communication or mediation.</p>

          <h3>16.2 Arbitration</h3>
          <p>Any disputes arising from these Terms shall be resolved through binding arbitration in accordance with the Arbitration and Conciliation Act, 2015 of India.</p>

          <h3>16.3 Class Action Waiver</h3>
          <p>You agree to resolve disputes individually and waive any right to participate in class action lawsuits.</p>
        </section>

        <section>
          <h2>17. Governing Law and Jurisdiction</h2>
          <p><strong>These Terms are governed by the laws of India, specifically:</strong></p>
          <ul>
            <li>Indian Contract Act, 1872</li>
            <li>Information Technology Act, 2000</li>
            <li>Consumer Protection Act, 2019</li>
            <li>Digital Personal Data Protection Act, 2023 (when applicable)</li>
          </ul>
          
          <h3>17.1 Jurisdiction</h3>
          <p>Any legal proceedings arising from these Terms shall be conducted exclusively in the courts of [Your City], [Your State], India.</p>
          
          <h3>17.2 International Users</h3>
          <p>If you access our Service from outside India, you are responsible for compliance with local laws. For users in the EU, GDPR provisions apply as outlined in our Privacy Policy. For users in California, CCPA provisions apply.</p>
        </section>

        <section>
          <h2>18. Severability</h2>
          <p>If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.</p>
        </section>

        <section>
          <h2>19. Entire Agreement</h2>
          <p>These Terms, together with our Privacy Policy, constitute the entire agreement between you and Local Host Connect regarding the Service.</p>
        </section>

        <section>
          <h2>20. Contact Information</h2>
          <div className="contact-info">
            <p><strong>Legal and Terms Inquiries:</strong></p>
            <p>Email: legal@localhostconnect.com</p>
            <p>Support: support@localhostconnect.com</p>
            <p>For general questions, visit our <Link to="/help" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Help & Support page</Link>.</p>
            <p><strong>Registered Office:</strong></p>
            <p>Local Host Connect<br/>
            [Your Business Address]<br/>
            [City, State, PIN Code]<br/>
            India</p>
          </div>
        </section>

        <section>
          <h2>21. Acknowledgment</h2>
          <p>By using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;