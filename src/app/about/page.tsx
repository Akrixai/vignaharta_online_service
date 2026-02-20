import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us - VIGHNAHARTA ONLINE SERVICES | Private Service Assistance Platform",
  description: "Vighnaharta Online Services is a private service assistance platform helping citizens access official government portals. NOT affiliated with any government entity. We provide guidance to official sources like uidai.gov.in, incometax.gov.in/iec/foportal, passportindia.gov.in.",
  keywords: "about vighnaharta, service assistance, government portal guidance, private service platform",
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
            A private service assistance platform helping citizens access official government portals
          </p>
          <p className="text-sm text-amber-700 font-semibold mt-4 bg-amber-50 inline-block px-6 py-2 rounded-full">
            ⚠️ NOT affiliated with any government entity
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-lg p-8 hover-lift">
            <div className="text-5xl mb-4">🎯</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              To help citizens access official government services by providing guidance, information, and assistance 
              in navigating official government portals and websites. We act as a private service assistance platform 
              to simplify the process of accessing government services online.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-8 hover-lift">
            <div className="text-5xl mb-4">👁️</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Vision</h2>
            <p className="text-gray-700 leading-relaxed">
              To become India's most trusted private service assistance platform, helping citizens across the nation 
              easily access and navigate official government portals and services with confidence and ease.
            </p>
          </div>
        </div>

        {/* Important Disclaimer - Required for Play Store Compliance */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl shadow-lg p-8 mb-16">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-amber-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-amber-900 mb-4">Important Disclaimer</h2>
              <div className="space-y-3 text-gray-800 text-lg">
                <p className="font-semibold">
                  ⚠️ Vighnaharta Online Services is a PRIVATE service assistance platform and is NOT affiliated with, endorsed by, or representing any government entity or department.
                </p>
                <p>
                  We provide guidance and assistance to help citizens access official government services by redirecting them to the appropriate official government websites and portals. We do NOT issue any government documents, certificates, or approvals.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 mt-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Official Government Sources We Reference:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-blue-600">🔗</span>
                <a href="https://uidai.gov.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  UIDAI (Aadhaar) - uidai.gov.in
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-600">🔗</span>
                <a href="https://www.incometax.gov.in/iec/foportal/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Income Tax Department (PAN) - incometax.gov.in/iec/foportal
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-600">🔗</span>
                <a href="https://passportindia.gov.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Passport Seva - passportindia.gov.in
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-600">🔗</span>
                <a href="https://www.india.gov.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  National Portal of India - india.gov.in
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-600">🔗</span>
                <a href="https://meity.gov.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  MeitY (Digital India) - meity.gov.in
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-600">🔗</span>
                <a href="https://digitalindia.gov.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Digital India Portal - digitalindia.gov.in
                </a>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600 italic">
              All government services, applications, and document issuance are processed exclusively by the respective official government departments through their official portals listed above.
            </p>
          </div>
        </div>

        {/* Our Story */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              Vighnaharta Online Services was founded with a simple yet powerful vision: to bridge the gap between 
              citizens and government services through technology. We recognized that millions of Indians face challenges 
              in accessing essential government documents and services due to complex procedures, long queues, and limited accessibility.
            </p>
            <p>
              Starting with a handful of service centers, we've grown into a nationwide network of service centers 
              across India. Our platform helps citizens by providing guidance and assistance to access 
              official government portals for Aadhaar cards, PAN cards, passports, certificates, and other government services.
            </p>
            <p>
              We support the Digital India initiative by helping citizens navigate digital government services. 
              Our technology-driven approach focuses on providing information, guidance, and assistance to help 
              citizens access official government portals efficiently.
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
                Clear, upfront pricing with no hidden charges. Government fees + minimal service charges clearly 
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
              <strong>Integration:</strong> We integrate with government APIs and databases to provide real-time 
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
            Become a retailer partner and start earning by providing essential government services in your community.
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
