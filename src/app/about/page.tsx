import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us - VIGHNAHARTA ONLINE SERVICES | Digital India Initiative",
  description: "Learn about Vighnaharta Online Services - India's premier digital government services portal with 10,000+ service centers nationwide. Part of Digital India initiative.",
  keywords: "about vighnaharta, digital india, government services portal, service centers india",
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
            Empowering India through digital transformation of government services
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-lg p-8 hover-lift">
            <div className="text-5xl mb-4">🎯</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              To make government services accessible to every Indian citizen through our nationwide network of service centers, 
              leveraging technology to simplify processes and reduce bureaucratic hurdles.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-8 hover-lift">
            <div className="text-5xl mb-4">👁️</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Vision</h2>
            <p className="text-gray-700 leading-relaxed">
              To become India's most trusted and comprehensive digital government services platform, 
              reaching every corner of the nation and empowering citizens with seamless access to essential services.
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
              Starting with a handful of service centers, we've grown into a nationwide network of over 10,000+ centers 
              across India. Our platform has successfully processed millions of applications, helping citizens obtain 
              Aadhaar cards, PAN cards, passports, certificates, and access to 100+ government services.
            </p>
            <p>
              As part of the Digital India initiative, we're committed to transforming India into a digitally empowered 
              society and knowledge economy. Our technology-driven approach ensures transparency, efficiency, and 
              accessibility for all.
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
