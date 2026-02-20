import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us - VIGHNAHARTA ONLINE SERVICES | Digital Services & Bill Payments Platform",
  description: "Vighnaharta Online Services is India's leading digital services platform for BBPS bill payments, NSDL PAN card services, mobile recharge & more. Earn guaranteed rewards and commissions on every transaction.",
  keywords: "about vighnaharta, digital services platform, bill payments, recharge, PAN card services, BBPS, retailer commission",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 animate-fade-in">
            About Vighnaharta Online Services
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-slide-in-up">
            India's all-in-one digital services platform for recharge, bill payments, PAN card services & rewards
          </p>
          <p className="text-sm text-blue-700 font-semibold mt-4 bg-blue-50 inline-block px-6 py-2 rounded-full">
            🏢 A product of Vighnaharta Online Services Pvt. Ltd.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-lg p-8 hover-lift">
            <div className="text-5xl mb-4">🎯</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              To simplify everyday digital transactions by providing a single platform for mobile recharge,
              bill payments, PAN card services, and more. We empower retailers and individuals to earn
              commissions and cashback rewards on every transaction.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 hover-lift">
            <div className="text-5xl mb-4">👁️</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Vision</h2>
            <p className="text-gray-700 leading-relaxed">
              To become India's most trusted digital services platform, helping individuals and businesses
              across the nation to manage their digital transactions with confidence, convenience, and guaranteed rewards.
            </p>
          </div>
        </div>

        {/* Important Disclaimer - Required for Play Store Compliance */}
        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl shadow-lg p-8 mb-16">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-blue-900 mb-4">About Our Platform</h2>
              <div className="space-y-3 text-gray-800 text-lg">
                <p className="font-semibold">
                  🏢 Vighnaharta Online Services Pvt. Ltd. is a private digital services company based in India.
                </p>
                <p>
                  We provide a comprehensive platform for BBPS bill payments, NSDL PAN card services, mobile recharge, DTH recharge, and 100+ digital services. Our retailers and customers earn guaranteed commissions and cashback rewards on every transaction.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 mt-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Our Key Services:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-blue-600">📱</span>
                <span>Mobile Recharge & DTH - All Operators</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-600">💡</span>
                <span>BBPS Bill Payments - Electricity, Gas, Water & More</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-600">🪪</span>
                <span>NSDL PAN Card - New PAN, Correction & Tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-600">📄</span>
                <span>Certificate Assistance & Document Services</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-600">💰</span>
                <span>Guaranteed Cashback Rewards for Customers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-600">🏪</span>
                <span>High Commission Earnings for Retailers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Our Story */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              Vighnaharta Online Services was founded with a simple yet powerful vision: to simplify digital
              transactions for everyone. We recognized that millions of Indians need a reliable, one-stop
              platform for their everyday digital needs - from mobile recharge to bill payments to PAN card services.
            </p>
            <p>
              Starting with a handful of service centers, we've grown into a nationwide network across
              India. Our platform provides everything from BBPS bill payments and mobile recharge to
              NSDL PAN card services and certificate assistance - all with guaranteed rewards.
            </p>
            <p>
              Our technology-driven approach focuses on providing a seamless, secure, and rewarding
              experience for both our retailer partners and individual customers.
            </p>
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">What Makes Us Different</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-white to-red-50 rounded-xl p-6 shadow-lg hover-lift">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Nationwide Network</h3>
              <p className="text-gray-700">
                10,000+ service centers across 28 states and 8 union territories, ensuring accessibility in urban,
                semi-urban, and rural areas.
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-red-50 rounded-xl p-6 shadow-lg hover-lift">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Secure Platform</h3>
              <p className="text-gray-700">
                Bank-level security with 256-bit SSL encryption, ISO 27001 certified infrastructure, and compliance
                with Indian data protection regulations.
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-red-50 rounded-xl p-6 shadow-lg hover-lift">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fast Processing</h3>
              <p className="text-gray-700">
                Real-time application tracking, automated workflows, and average processing time of 7-15 days for
                most services.
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-red-50 rounded-xl p-6 shadow-lg hover-lift">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Transparent Pricing</h3>
              <p className="text-gray-700">
                Clear, upfront pricing with no hidden charges. Official fees + minimal service charges clearly
                displayed for every service.
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-red-50 rounded-xl p-6 shadow-lg hover-lift">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Digital First</h3>
              <p className="text-gray-700">
                Mobile-friendly platform with SMS and WhatsApp notifications, online tracking, and digital document
                delivery options.
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-red-50 rounded-xl p-6 shadow-lg hover-lift">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Expert Support</h3>
              <p className="text-gray-700">
                Trained professionals at every service center, 24/7 customer support, and comprehensive training
                resources for partners.
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-12 mb-16 text-white">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Impact in Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">10,000+</div>
              <div className="text-red-100">Service Centers</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">50,000+</div>
              <div className="text-red-100">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">100+</div>
              <div className="text-red-100">Services Available</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">28</div>
              <div className="text-red-100">States Covered</div>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Technology</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              <strong>Security:</strong> We use AES-256 encryption for data storage, SSL/TLS for data transmission,
              and maintain ISO 27001 certified infrastructure. All data is stored in India-based data centers,
              ensuring compliance with local regulations.
            </p>
            <p>
              <strong>Infrastructure:</strong> Our platform is built on scalable cloud infrastructure with 99.9% uptime
              guarantee, automated backups, and disaster recovery mechanisms.
            </p>
            <p>
              <strong>Integration:</strong> We integrate with authorized service APIs including NSDL and BBPS to provide real-time
              verification and faster processing of applications.
            </p>
            <p>
              <strong>Mobile-First:</strong> Our responsive platform works seamlessly across devices, with dedicated
              mobile apps for retailers and employees.
            </p>
          </div>
        </div>

        {/* Partner with Us */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-8 text-center border-2 border-red-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Join Our Network</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Become a retailer partner and start earning by providing essential digital services in your community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-red-600 text-white px-8 py-4 rounded-lg hover:bg-red-700 transition-all duration-300 font-bold shadow-lg transform hover:scale-105"
            >
              Register as Retailer
            </Link>
            <Link
              href="/contact"
              className="border-2 border-red-600 text-red-600 px-8 py-4 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-300 font-bold shadow-lg transform hover:scale-105"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
