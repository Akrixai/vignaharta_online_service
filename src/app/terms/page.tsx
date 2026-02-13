import Link from "next/link";
import Logo from "@/components/ui/logo";
import { Metadata } from "next";
import BlogPostTemplate from "@/components/blog/BlogPostTemplate";
import InternalLink from "@/components/blog/InternalLink";
import OutboundLink from "@/components/blog/OutboundLink";

export const metadata: Metadata = {
  title: "Terms & Conditions - VIGHNAHARTA ONLINE SERVICES | Private Service Assistance Platform",
  description: "Read our terms and conditions. Vighnaharta Online Services is a private platform NOT affiliated with any government entity. We provide guidance to access official government portals.",
  keywords: "terms and conditions, terms of service, user agreement, vighnaharta online services, legal terms",
  openGraph: {
    title: "Terms & Conditions - VIGHNAHARTA ONLINE SERVICES",
    description: "Read our terms and conditions for using the service assistance platform.",
    type: "website",
  },
};

export default function TermsPage() {
  return (
    <BlogPostTemplate
      title="Terms & Conditions"
      description="Please read these terms and conditions carefully before using our services."
      authorName="Legal Team"
      authorTitle="Vighnaharta Online Services"
      publishDate="2025-12-01"
      lastUpdated="2025-12-01"
      readingTime="8 min read"
      tldrSummary="These Terms & Conditions govern your use of Vighnaharta Online Services, a private service assistance platform. We are NOT affiliated with any government entity. By using our services, you agree to these terms which include user responsibilities, service descriptions, and privacy provisions."
      tldrPoints={[
        "We are a PRIVATE platform NOT affiliated with any government entity",
        "We provide guidance to help you access official government portals",
        "Users must provide accurate information and maintain account security",
        "Services are provided 'as is' with no guarantees of government approval",
        "Users are responsible for complying with applicable laws and regulations"
      ]}
      keywords={["terms and conditions", "terms of service", "user agreement", "vighnaharta online services", "legal terms"]}
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
                We provide guidance and assistance to help citizens access official government websites. We do NOT issue any government documents, certificates, or approvals. All government services are processed by official government departments:
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
          <div className="space-y-4 text-gray-600">
            <p>By accessing and using the Vighnaharta Online Services platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Service Description</h2>
          <div className="space-y-4 text-gray-600">
            <p>Vighnaharta Online Services is a private service assistance platform that provides:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Guidance and information to access official government portals</li>
              <li>Assistance in navigating government websites and services</li>
              <li>Support in understanding application processes</li>
              <li>Help with document preparation and submission guidance</li>
              <li>Customer support and assistance</li>
            </ul>
            <p className="font-semibold text-amber-800 bg-amber-50 p-3 rounded">
              ⚠️ IMPORTANT: We do NOT issue any government documents, certificates, or approvals. All government services are processed exclusively by official government departments through their official portals.
            </p>
            <p>For specific services, please refer to our <InternalLink href="/services" title="View All Services">services page</InternalLink> and <InternalLink href="/privacy" title="Privacy Policy">privacy policy</InternalLink>.</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Responsibilities</h2>
          <div className="space-y-4 text-gray-600">
            <p>As a user of our platform, you agree to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide accurate and truthful information</li>
              <li>Keep your account credentials secure</li>
              <li>Use the service only for lawful purposes</li>
              <li>Respect intellectual property rights</li>
              <li>Not attempt to breach security measures</li>
              <li>Report any suspicious activities</li>
              <li>Pay applicable fees for services</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Account Registration</h2>
          <div className="space-y-4 text-gray-600">
            <p>To use certain features of our service, you must register for an account. You agree to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide accurate registration information</li>
              <li>Maintain the security of your password</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Service Fees and Payments</h2>
          <div className="space-y-4 text-gray-600">
            <p>Service fees are clearly displayed before transaction completion. You agree that:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>All fees are non-refundable unless otherwise stated</li>
              <li>Prices may change with prior notice</li>
              <li>You are responsible for all applicable taxes</li>
              <li>Payment must be made through authorized methods</li>
              <li>Failed payments may result in service suspension</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Prohibited Activities</h2>
          <div className="space-y-4 text-gray-600">
            <p>You may not use our service to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Submit false or fraudulent information</li>
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Distribute malware or harmful code</li>
              <li>Attempt unauthorized access to systems</li>
              <li>Interfere with service operations</li>
              <li>Harass or abuse other users or staff</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Service Availability</h2>
          <div className="space-y-4 text-gray-600">
            <p>While we strive for continuous service availability:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Services may be temporarily unavailable for maintenance</li>
              <li>We do not guarantee uninterrupted access</li>
              <li>Processing times may vary based on government requirements</li>
              <li>Some services may have specific operating hours</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Intellectual Property</h2>
          <div className="space-y-4 text-gray-600">
            <p>All content on this website, including but not limited to text, graphics, logos, images, audio clips, digital downloads, data compilations, and software, is the property of Vighnaharta Online Services or its licensors and is protected by copyright and other intellectual property laws.</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
          <div className="space-y-4 text-gray-600">
            <p>To the maximum extent permitted by law:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>We are not liable for indirect or consequential damages</li>
              <li>Our liability is limited to the amount paid for the service</li>
              <li>We are not responsible for third-party actions or decisions</li>
              <li>Government processing delays are beyond our control</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Privacy and Data Protection</h2>
          <div className="space-y-4 text-gray-600">
            <p>Your privacy is important to us. Please review our <InternalLink href="/privacy" title="Privacy Policy">Privacy Policy</InternalLink> to understand how we collect, use, and protect your information. By using our service, you consent to our data practices as described in the Privacy Policy.</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Termination</h2>
          <div className="space-y-4 text-gray-600">
            <p>We may terminate or suspend your account and access to the service:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>For violation of these terms</li>
              <li>For fraudulent or illegal activities</li>
              <li>At our discretion with reasonable notice</li>
              <li>Upon your request</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Governing Law</h2>
          <div className="space-y-4 text-gray-600">
            <p>These terms are governed by the laws of India. Any disputes will be subject to the exclusive jurisdiction of the courts in New Delhi, India.</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Changes to Terms</h2>
          <div className="space-y-4 text-gray-600">
            <p>We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Continued use of the service constitutes acceptance of the modified terms.</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contact Information</h2>
          <div className="space-y-4 text-gray-600">
            <p>For questions about these terms, contact us:</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>Email:</strong> vighnahartaenterprises.sangli@gmail.com</p>
              <p><strong>Phone:</strong> +91-7499116527</p>
              <p><strong>Address:</strong> Bajrang Nagar, MIDC Kupwad, Maharashtra 416436, India</p>
            </div>
            <p>For government-related inquiries, you may also refer to the <OutboundLink href="https://www.india.gov.in" title="Government of India Official Portal">Government of India official portal</OutboundLink>.</p>
          </div>
        </section>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-6">
            By using our services, you acknowledge that you have read, understood, and agree to these terms and conditions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-red-600 text-white px-8 py-4 rounded-lg hover:bg-red-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🏪 Accept & Get Started
            </Link>
            <Link
              href="/contact"
              className="border-2 border-red-600 text-red-600 px-8 py-4 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              📞 Have Questions?
            </Link>
          </div>
        </div>
      </div>
    </BlogPostTemplate>
  );
}