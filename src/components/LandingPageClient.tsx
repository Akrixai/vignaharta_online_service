'use client';

import Link from "next/link";
import Logo from "@/components/ui/logo";
import Footer from "@/components/Footer";
import UserConsent from "@/components/UserConsent";
import LandingPageImageCarousel from "@/components/LandingPageImageCarousel";
import { useState, useEffect } from "react";
// Marquee-style floating text for descriptions
function FloatingDescriptions({ descriptions, position = "top" }) {
  if (!descriptions || descriptions.length === 0) return null;
  return (
    <div
      className={`w-full overflow-hidden z-20 ${position === "bottom" ? "mt-4" : "mb-4"}`}
      style={{ pointerEvents: "none", height: "2.5rem" }}
    >
      <div
        className="whitespace-nowrap flex items-center"
        style={{ height: "2.5rem" }}
      >
        <div
          className="marquee-text px-4 py-2 bg-gradient-to-r from-red-200 via-orange-200 to-yellow-200 text-red-700 font-semibold shadow-lg rounded"
          style={{
            display: "inline-block",
            minWidth: "fit-content",
            animation: `marquee 18s linear infinite`,
            pointerEvents: "none",
            opacity: 0.95
          }}
        >
          {descriptions.join("  |  ")}
        </div>
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}

export default function LandingPageClient() {
  const [, setConsentGiven] = useState(false);
  const [descriptions, setDescriptions] = useState([]);

  const handleConsentGiven = () => {
    setConsentGiven(true);
  };

  useEffect(() => {
    async function fetchDescriptions() {
      try {
        const res = await fetch("/api/login-advertisements");
        if (res.ok) {
          const data = await res.json();
          const descs = (data.advertisements || [])
            .map(ad => ad.description)
            .filter(d => d && d.trim().length > 0);
          setDescriptions(descs);
        }
      } catch (e) {
        // fail silently
      }
    }
    fetchDescriptions();
  }, []);

  return (
    <>
      <UserConsent onConsentGiven={handleConsentGiven} />
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 relative overflow-hidden">
        {/* Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-200/30 to-orange-200/30 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-yellow-200/30 to-red-200/30 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-orange-200/20 to-red-200/20 rounded-full blur-2xl animate-pulse"></div>
        </div>

      {/* Header */}
      <header className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 shadow-2xl relative overflow-hidden backdrop-blur-sm">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full animate-float"></div>
          <div className="absolute top-10 right-10 w-16 h-16 bg-gradient-to-br from-orange-400 to-red-400 rounded-full animate-bounce"></div>
          <div className="absolute bottom-0 left-1/4 w-24 h-24 bg-gradient-to-br from-red-400 to-pink-400 rounded-full animate-ping"></div>
          <div className="absolute top-1/2 right-1/3 w-12 h-12 bg-gradient-to-br from-yellow-300 to-orange-300 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <Logo size="md" showText={true} animated={true} />
              <div className="hidden sm:block">
                <span className="text-white/90 text-sm font-medium animate-fade-in">
                  Online Service Portal
                </span>
                <div className="text-white/70 text-xs">
                  Digital India Initiative
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <nav className="hidden md:flex space-x-6">
                <Link href="/about" className="text-white hover:text-red-200 px-4 py-2 rounded-lg text-sm font-medium transform hover:scale-105 transition-all duration-200 hover:bg-red-700/50 relative group">
                  About
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link href="/services" className="text-white hover:text-red-200 px-4 py-2 rounded-lg text-sm font-medium transform hover:scale-105 transition-all duration-200 hover:bg-red-700/50 relative group">
                  Services
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link href="/contact" className="text-white hover:text-red-200 px-4 py-2 rounded-lg text-sm font-medium transform hover:scale-105 transition-all duration-200 hover:bg-red-700/50 relative group">
                  Contact
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
                </Link>
              </nav>

              {/* Akrix.ai Branding */}
              <div className="flex items-center justify-center space-x-2 animate-pulse">
                <span className="text-pink-400 text-lg animate-bounce">💖</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 font-semibold text-sm">
                  Developed by
                </span>
                <a
                  href="https://akrixsolutions.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 font-bold text-sm hover:from-pink-500 hover:via-purple-500 hover:to-blue-500 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  Akrix Solutions
                </a>
                <span className="text-pink-400 text-lg animate-bounce">💖</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Full-width Advertisement Carousel Section */}
      <section className="w-full relative z-10">
        {/* Floating Descriptions Above Carousel */}
        <FloatingDescriptions descriptions={descriptions} position="top" />
        {/* Image Carousel with horizontal padding only */}
        <div className="w-full px-4 md:px-8 lg:px-4">
          <LandingPageImageCarousel className="h-[350px] md:h-[500px] lg:h-[570px] w-full rounded" />
        </div>
        <FloatingDescriptions descriptions={descriptions} position="bottom" />
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-r from-red-100 to-orange-100 rounded-full opacity-20 animate-float"></div>
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-gradient-to-r from-orange-100 to-red-100 rounded-full opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="text-center relative z-10">
          {/* <h1 className="text-4xl md:text-6xl font-bold text-red-800 mb-6 animate-fade-in">
            Welcome to <span className="text-orange-600">विघ्नहर्ता</span>
            <br />
            <span className="text-red-700">ऑनलाईन सर्विसेस</span>
          </h1>
          <h2 className="text-xl md:text-2xl text-red-600 mb-4 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            India's Premier Digital Government Services Portal
          </h2>
          <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
            Access <strong>Aadhaar Card</strong>, <strong>PAN Card</strong>, <strong>Passport</strong>, <strong>Birth Certificate</strong>, <strong>Death Certificate</strong>, <strong>Income Certificate</strong>, <strong>Caste Certificate</strong>, and <strong>100+ government services online</strong>. Fast, secure, and reliable government service portal with nationwide retailer network support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Link href="/login" className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
              🚀 Get Started - Apply Online
            </Link>
            <Link href="/about" className="bg-white hover:bg-red-50 text-red-600 border-2 border-red-600 px-8 py-4 rounded-lg text-lg font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
              📖 Learn More About Services
            </Link>
          </div> */}

          {/* Animated stats or features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-red-100 feature-card">
              <div className="text-3xl mb-3 animate-bounce">🏛️</div>
              <h3 className="text-xl font-bold text-red-700 mb-2">100+ Government Services Online</h3>
              <p className="text-gray-600">Access Aadhaar, PAN, Passport, Birth Certificate, Death Certificate, Income Certificate, Caste Certificate, and all government schemes digitally</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-red-100 feature-card" style={{ animationDelay: '0.2s' }}>
              <div className="text-3xl mb-3 animate-bounce" style={{ animationDelay: '0.5s' }}>🔒</div>
              <h3 className="text-xl font-bold text-red-700 mb-2">Secure Digital India Portal</h3>
              <p className="text-gray-600">Bank-level security with SSL encryption, real-time application tracking, and 24/7 customer support</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-red-100 feature-card" style={{ animationDelay: '0.4s' }}>
              <div className="text-3xl mb-3 animate-bounce" style={{ animationDelay: '1s' }}>⚡</div>
              <h3 className="text-xl font-bold text-red-700 mb-2">Fast Government Service Processing</h3>
              <p className="text-gray-600">Quick document processing with user-friendly interface and nationwide retailer network support</p>
            </div>
          </div>

          {/* Login Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-5xl mx-auto">
            <Link
              href="/login?role=retailer"
              className="group bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-500 border border-gray-300 hover:border-red-500 animate-scale-in transform hover:scale-105 relative overflow-hidden login-card focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-orange-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative z-10">
                <div className="text-red-600 text-6xl mb-6 animate-float group-hover:animate-bounce">🏪</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-red-700 transition-colors">
                  Retailer Login
                </h3>
                <p className="text-gray-600 group-hover:text-gray-700 leading-relaxed">
                  Manage customer services, process applications, and earn commissions from government services
                </p>

                {/* Hover indicator */}
                <div className="mt-4 flex items-center text-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-sm font-medium">Click to login</span>
                  <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>

            <Link
              href="/login?role=employee"
              className="group bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-500 border border-gray-300 hover:border-red-500 animate-scale-in transform hover:scale-105 relative overflow-hidden login-card focus:outline-none focus:ring-2 focus:ring-red-500"
              style={{ animationDelay: '0.1s' }}
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-orange-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative z-10">
                <div className="text-red-600 text-6xl mb-6 animate-float group-hover:animate-bounce" style={{ animationDelay: '0.5s' }}>👨‍💼</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-red-700 transition-colors">
                  Employee Login
                </h3>
                <p className="text-gray-600 group-hover:text-gray-700 leading-relaxed">
                  Process applications, verify documents, and assist retailers with customer queries
                </p>

                {/* Hover indicator */}
                <div className="mt-4 flex items-center text-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-sm font-medium">Click to login</span>
                  <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>

            <Link
              href="/login?role=admin"
              className="group bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-500 border border-gray-300 hover:border-red-500 animate-scale-in transform hover:scale-105 relative overflow-hidden login-card focus:outline-none focus:ring-2 focus:ring-red-500"
              style={{ animationDelay: '0.2s' }}
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-orange-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative z-10">
                <div className="text-red-600 text-6xl mb-6 animate-float group-hover:animate-bounce" style={{ animationDelay: '1s' }}>⚙️</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-red-700 transition-colors">
                  Admin Login
                </h3>
                <p className="text-gray-600 group-hover:text-gray-700 leading-relaxed">
                  Full system control, manage employees, retailers, and monitor all activities
                </p>

                {/* Hover indicator */}
                <div className="mt-4 flex items-center text-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-sm font-medium">Click to login</span>
                  <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Retailer Registration - Enhanced */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
            <div className="relative p-10 bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-3xl shadow-2xl max-w-4xl mx-auto hover-lift animate-fade-in text-white overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full animate-float"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-300 rounded-full animate-bounce"></div>
                <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-orange-300 rounded-full animate-ping"></div>
              </div>
              
              <div className="relative z-10 text-center">
                <div className="text-6xl mb-6 animate-bounce">🚀</div>
                <h3 className="text-4xl font-bold mb-6 bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
                  Become a Retailer Partner
                </h3>
                <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Join our network of <span className="font-bold text-yellow-300">10,000+ retailers</span> and start earning by providing government services to customers in your area
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
                    <div className="text-3xl mb-3">💰</div>
                    <h4 className="font-bold text-lg mb-2">Earn Commission</h4>
                    <p className="text-red-100 text-sm">Up to 15% commission on every service</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
                    <div className="text-3xl mb-3">📱</div>
                    <h4 className="font-bold text-lg mb-2">Digital Platform</h4>
                    <p className="text-red-100 text-sm">Easy-to-use mobile-friendly interface</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Link
                    href="/register"
                    className="group relative inline-flex items-center justify-center px-10 py-5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl hover:from-red-700 hover:to-red-800 transition-all duration-300 font-bold shadow-2xl hover:shadow-red-500/50 transform hover:scale-105 text-lg overflow-hidden border border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative flex items-center">
                      🏪 Register as Retailer
                      <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                  </Link>
                  <Link
                    href="/about"
                    className="group inline-flex items-center justify-center px-10 py-5 border-2 border-red-500 text-white rounded-2xl hover:bg-white hover:text-red-600 transition-all duration-300 font-bold shadow-2xl hover:shadow-white/50 transform hover:scale-105 text-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <span className="flex items-center">
                      📋 Learn More
                      <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      </div>
    </>
  );
}
