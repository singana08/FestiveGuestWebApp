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

          <h3>6.3 Payment Processing</h3>
          <ul>
            <li>We use third-party payment processors for secure transactions</li>
            <li>Payment terms are agreed upon between hosts and guests</li>
            <li>We may charge service fees for platform usage</li>
            <li>All payments are subject to applicable taxes</li>
          </ul>

          <h3>6.4 Cancellation Policy</h3>
          <p>Cancellation terms are set by individual hosts. Users should review cancellation policies before making arrangements. We reserve the right to implement platform-wide cancellation policies for extraordinary circumstances.</p>

          <h3>6.5 Refunds and Disputes</h3>
          <p>Refund eligibility depends on the host's cancellation policy and circumstances. We provide dispute resolution services but are not obligated to provide refunds for disputes between users.</p>
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
          
          <h3>9.1 Platform Content</h3>
          <p>The Service and its original content, features, and functionality are owned by Local Host Connect and are protected by copyright, trademark, and other intellectual property laws.</p>

          <h3>9.2 User Content</h3>
          <p>You retain ownership of content you post but grant us a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content in connection with the Service.</p>

          <h3>9.3 Prohibited Use</h3>
          <p>You may not reproduce, distribute, modify, or create derivative works of our content without explicit written permission.</p>
        </section>

        <section>
          <h2>10. Privacy and Data Protection</h2>
          <p>Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information. By using the Service, you consent to our data practices as described in the Privacy Policy.</p>
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
          <p>These Terms are governed by the laws of India. Any legal proceedings shall be conducted in the courts of [Your City], India.</p>
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
          <p>For questions about these Terms, please visit our <Link to="/help" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Help & Support page</Link> for contact information and assistance.</p>
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