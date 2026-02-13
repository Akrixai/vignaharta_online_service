import Link from "next/link";
import Logo from "@/components/ui/logo";
import { Metadata } from "next";
import BlogPostTemplate from "@/components/blog/BlogPostTemplate";
import InternalLink from "@/components/blog/InternalLink";
import OutboundLink from "@/components/blog/OutboundLink";

export const metadata: Metadata = {
  title: "Privacy Policy - Vighnaharta Online Services | Private Service Assistance Platform",
  description: "Read our privacy policy. Vighnaharta Online Services is a private platform NOT affiliated with any government entity. We help citizens access official government portals like uidai.gov.in, incometax.gov.in.",
  keywords: "privacy policy, data protection, personal information, security, vighnaharta online services",
  openGraph: {
    title: "Privacy Policy - Vighnaharta Online Services",
    description: "Learn how we protect your privacy and personal information.",
    type: "website",
  },
};

export default function PrivacyPage() {
  return (
    <BlogPostTemplate
      title="Privacy Policy"
      description="Your privacy is important to us. This policy explains how we collect, use, and protect your information."
      authorName="Data Protection Team"
      authorTitle="Vignaharta Online Services"
      publishDate="2025-12-01"
      lastUpdated="2025-12-01"
      readingTime="7 min read"
      tldrSummary="This Privacy Policy explains how Vighnaharta Online Services, a private service assistance platform, collects, uses, and protects your personal information. We are NOT affiliated with any government entity and only provide guidance to access official government portals."
      tldrPoints={[
        "We are a PRIVATE platform NOT affiliated with any government entity",
        "We collect information you provide to help you access official government portals",
        "Your data is used only for providing assistance and guidance services",
        "We implement robust security measures to protect your information",
        "You have rights to access, correct, and delete your personal data"
      ]}
      keywords={["privacy policy", "data protection", "personal information", "security", "vighnaharta online services"]}
    >
      <div className="prose max-w-none">
        {/* Important Disclaimer */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 mb-8 not-prose">
          <div className="flex items-start gap-3">
            <div className="bg-amber-100 p-2 rounded-full mt-1">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-amber-900 mb-2">Important Disclaimer</h3>
              <p className="text-gray-800 mb-3 font-semibold">
                ⚠️ Vighnaharta Online Services is a PRIVATE service assistance platform and is NOT affiliated with, endorsed by, or representing any government entity or department.
              </p>
              <p className="text-gray-700 text-sm">
                We provide guidance to help citizens access official government websites. All government services are processed by official government departments through their official portals:
              </p>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <a href="https://uidai.gov.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">🔗 UIDAI - uidai.gov.in</a>
                <a href="https://incometax.gov.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">🔗 Income Tax - incometax.gov.in</a>
                <a href="https://passportindia.gov.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">🔗 Passport Seva - passportindia.gov.in</a>
                <a href="https://www.india.gov.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">🔗 India Portal - india.gov.in</a>
              </div>
            </div>
          </div>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
          <div className="space-y-4 text-gray-600">
            <p>We collect information you provide directly to us, such as when you:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Register for an account or apply for services</li>
              <li>Submit applications or documents</li>
              <li>Contact us for support</li>
              <li>Use our website or mobile applications</li>
            </ul>
            <p>This may include:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Personal identification information (name, address, phone number, email)</li>
              <li>Government identification numbers (Aadhaar, PAN, etc.)</li>
              <li>Documents and photographs</li>
              <li>Payment information</li>
              <li>Usage data and preferences</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
          <div className="space-y-4 text-gray-600">
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Process your service applications and requests</li>
              <li>Verify your identity and prevent fraud</li>
              <li>Communicate with you about your applications</li>
              <li>Provide customer support</li>
              <li>Improve our services and user experience</li>
              <li>Comply with legal obligations</li>
              <li>Send important updates and notifications</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Information Sharing</h2>
          <div className="space-y-4 text-gray-600">
            <p>We may share your information with:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Government Agencies:</strong> As required for processing your applications</li>
              <li><strong>Authorized Retailers:</strong> To facilitate service delivery</li>
              <li><strong>Service Providers:</strong> Who help us operate our platform</li>
              <li><strong>Legal Authorities:</strong> When required by law or to protect rights</li>
            </ul>
            <p>We do not sell, rent, or trade your personal information to third parties for marketing purposes.</p>
            <p>For more information about government data sharing practices, visit the <OutboundLink href="https://meity.gov.in" title="Ministry of Electronics and Information Technology">Ministry of Electronics and Information Technology</OutboundLink> website.</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
          <div className="space-y-4 text-gray-600">
            <p>We implement robust security measures to protect your information:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>End-to-end encryption for sensitive data</li>
              <li>Secure servers with regular security updates</li>
              <li>Access controls and authentication systems</li>
              <li>Regular security audits and monitoring</li>
              <li>Compliance with government security standards</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
          <div className="space-y-4 text-gray-600">
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your data (subject to legal requirements)</li>
              <li>Withdraw consent where applicable</li>
              <li>File complaints with relevant authorities</li>
            </ul>
            <p>To exercise these rights, contact us at vighnahartaenterprises.sangli@gmail.com</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
          <div className="space-y-4 text-gray-600">
            <p>We retain your information for as long as necessary to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide our services</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes</li>
              <li>Enforce our agreements</li>
            </ul>
            <p>Different types of information may have different retention periods as required by law.</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies and Tracking</h2>
          <div className="space-y-4 text-gray-600">
            <p>We use cookies and similar technologies to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Remember your preferences</li>
              <li>Analyze website usage</li>
              <li>Improve user experience</li>
              <li>Provide personalized content</li>
            </ul>
            <p>You can control cookie settings through your browser preferences.</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children's Privacy</h2>
          <div className="space-y-4 text-gray-600">
            <p>Our services are not intended for children under 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to This Policy</h2>
          <div className="space-y-4 text-gray-600">
            <p>We may update this privacy policy from time to time. We will notify you of any material changes by:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Posting the updated policy on our website</li>
              <li>Sending email notifications to registered users</li>
              <li>Displaying prominent notices on our platform</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Us</h2>
          <div className="space-y-4 text-gray-600">
            <p>If you have questions about this privacy policy or our data practices, contact us:</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>Email:</strong> vighnahartaenterprises.sangli@gmail.com</p>
              <p><strong>Phone:</strong> +91-7499116527</p>
              <p><strong>Address:</strong> Bajrang Nagar, MIDC Kupwad, Maharashtra 416436, India</p>
            </div>
            <p>For information about India's data protection laws, visit the <OutboundLink href="https://meity.gov.in/content/data-protection" title="Indian Data Protection Laws">Data Protection section</OutboundLink> of the Ministry of Electronics and Information Technology website.</p>
          </div>
        </section>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-6">
            By using our services, you acknowledge that you have read and understood this privacy policy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-red-600 text-white px-8 py-4 rounded-lg hover:bg-red-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🏪 Get Started
            </Link>
            <Link
              href="/contact"
              className="border-2 border-red-600 text-red-600 px-8 py-4 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              📞 Contact Us
            </Link>
          </div>
        </div>
      </div>
    </BlogPostTemplate>
  );
}