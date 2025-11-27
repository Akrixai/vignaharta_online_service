'use client';

import Link from "next/link";
import Logo from "@/components/ui/logo";
import Footer from "@/components/Footer";
import UserConsent from "@/components/UserConsent";
import LandingPageImageCarousel from "@/components/LandingPageImageCarousel";
import Header from "@/components/Header";
import HowItWorks from "@/components/HowItWorks";
import TrustBadges from "@/components/TrustBadges";
import LatestBlogPosts from "@/components/LatestBlogPosts";
import TawkToChat from "@/components/TawkToChat";
import { useState, useEffect } from "react";

// Define types for our data
interface Advertisement {
  description: string;
}

interface SocialLink {
  name: string;
  url: string;
  icon: string;
}

// Marquee-style floating text for descriptions
function FloatingDescriptions({ descriptions, position = "top" }: { descriptions: string[]; position?: "top" | "bottom" }) {
  if (!descriptions || descriptions.length === 0) return null;
  return (
    <div
      className={`w-full overflow-hidden z-20 ${position === "bottom" ? "mt-4" : "mb-4"} marquee-container`}
    >
      <div
        className="whitespace-nowrap flex items-center marquee-content"
      >
        <div
          className="marquee-text px-4 py-2 bg-gradient-to-r from-red-200 via-orange-200 to-yellow-200 text-red-700 font-semibold shadow-lg rounded"
        >
          {descriptions.join("  |  ")}
        </div>
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .marquee-text {
          display: inline-block;
          min-width: fit-content;
          animation: marquee 18s linear infinite;
          pointer-events: none;
          opacity: 0.95;
        }
      `}</style>
    </div>
  );
}

export default function LandingPageClient() {
  const [, setConsentGiven] = useState(false);
  const [descriptions, setDescriptions] = useState<string[]>([]);

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
            .map((ad: Advertisement) => ad.description)
            .filter((d: string) => d && d.trim().length > 0);
          setDescriptions(descs);
        }
      } catch (e) {
        // fail silently
      }
    }
    fetchDescriptions();
  }, []);

  // Social media links
  const socialLinks: SocialLink[] = [
    {
      name: "Facebook",
      url: "https://www.facebook.com/share/171jarrh5y/",
      icon: "📘"
    },
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/in/prem-sargar-802214390/?utm_source=share_via&utm_content=profile&utm_medium=member_android",
      icon: "👔"
    },
    {
      name: "Twitter",
      url: "https://x.com/services6527?t=mPY7WesWRbXSCF5rXSiRCg&s=08",
      icon: "🐦"
    },
    {
      name: "Instagram",
      url: "https://www.instagram.com/invites/contact/?utm_source=ig_contact_invite&utm_medium=copy_link&utm_content=zrqm86t",
      icon: "📸"
    }
  ];

  return (
    <>
      <UserConsent onConsentGiven={handleConsentGiven} />
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 relative overflow-hidden">
        {/* Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute floating-bg-1 bg-gradient-to-br from-red-200/30 to-orange-200/30 rounded-full blur-3xl animate-float animate-delay-2000"></div>
          <div className="absolute floating-bg-2 bg-gradient-to-tr from-yellow-200/30 to-red-200/30 rounded-full blur-3xl animate-float"></div>
          <div className="absolute floating-bg-3 bg-gradient-to-r from-orange-200/20 to-red-200/20 rounded-full blur-2xl animate-pulse"></div>
        </div>

        {/* Header - Import from component */}
        <Header />

        {/* Full-width Advertisement Carousel Section */}
        <section className="w-full relative z-0">
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
            <div className="absolute bottom-20 right-10 w-48 h-48 bg-gradient-to-r from-orange-100 to-red-100 rounded-full opacity-20 animate-float animate-delay-2000"></div>
          </div>

          <div className="text-center relative z-10">
            {/* SEO-optimized H1 and H2 tags */}
            <h1 className="text-4xl md:text-6xl font-bold text-red-800 mb-6 animate-fade-in">
              Vighnaharta Online Services - Government Services Portal India
            </h1>
            <h2 className="text-xl md:text-2xl text-red-600 mb-4 max-w-3xl mx-auto animate-fade-in animate-delay-200">
              India's Premier Digital Government Services Portal - Apply for Aadhaar Card, PAN Card, Passport, Birth Certificate Online
            </h2>
            <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-4xl mx-auto animate-fade-in animate-delay-300">
              Access <Link href="/register" className="text-red-600 hover:text-red-800 font-semibold underline">Aadhaar Card</Link>, <Link href="/register" className="text-red-600 hover:text-red-800 font-semibold underline">PAN Card</Link>, <Link href="/register" className="text-red-600 hover:text-red-800 font-semibold underline">Passport</Link>, <Link href="/register" className="text-red-600 hover:text-red-800 font-semibold underline">Birth Certificate</Link>, <Link href="/register" className="text-red-600 hover:text-red-800 font-semibold underline">Death Certificate</Link>, <Link href="/register" className="text-red-600 hover:text-red-800 font-semibold underline">Income Certificate</Link>, <Link href="/register" className="text-red-600 hover:text-red-800 font-semibold underline">Caste Certificate</Link>, and <Link href="/register" className="text-red-600 hover:text-red-800 font-semibold underline">100+ government services online</Link>. Fast, secure, and reliable government service portal with nationwide retailer network support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in animate-delay-400">
              <Link href="/login" className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                🚀 Get Started - Apply Online
              </Link>
              <Link href="/about" className="bg-white hover:bg-red-50 text-red-600 border-2 border-red-600 px-8 py-4 rounded-lg text-lg font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                📖 Learn More About Services
              </Link>
            </div>

            {/* Added: Government Services Benefits Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 mb-12 shadow-xl border border-red-100 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-red-800 mb-6">Why Choose Vighnaharta Online Services?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="flex items-start">
                  <div className="text-2xl mr-4 text-red-600">✅</div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 mb-2">Digital India Initiative</h4>
                    <p className="text-gray-700">Part of the Government of India's <Link href="/about" className="text-red-600 hover:text-red-800 font-semibold underline">Digital India program</Link> to transform India into a digitally empowered society and knowledge economy.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="text-2xl mr-4 text-red-600">✅</div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 mb-2">Nationwide Access</h4>
                    <p className="text-gray-700">Access government services from anywhere in India through our extensive network of over <Link href="/about" className="text-red-600 hover:text-red-800 font-semibold underline">10,000+ service centers</Link>.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="text-2xl mr-4 text-red-600">✅</div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 mb-2">Fast Processing</h4>
                    <p className="text-gray-700">Quick document verification and processing with <Link href="/services" className="text-red-600 hover:text-red-800 font-semibold underline">real-time application tracking</Link> and status updates.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="text-2xl mr-4 text-red-600">✅</div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 mb-2">Secure & Reliable</h4>
                    <p className="text-gray-700">Bank-level security with SSL encryption and compliance with <Link href="/privacy-policy" className="text-red-600 hover:text-red-800 font-semibold underline">Indian data protection regulations</Link>.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-red-800 mb-6">Follow Us on Social Media</h3>
              <div className="flex justify-center space-x-6">
                {socialLinks.map((social, index) => (
                  <Link
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white rounded-full p-4 shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 border border-red-200 hover:border-red-400"
                    title={`Follow us on ${social.name}`}
                  >
                    <span className="text-2xl">{social.icon}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Added: Popular Government Services Section */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-8 mb-12 shadow-lg border border-red-100 max-w-6xl mx-auto">
              <h3 className="text-2xl font-bold text-red-800 mb-6 text-center">Popular Government Services</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                  <h4 className="font-bold text-lg text-red-700 mb-3">_identity Services</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center">
                      <span className="text-red-500 mr-2">•</span>
                      <Link href="/register" className="text-red-600 hover:text-red-800 font-medium">Aadhaar Card Services</Link>
                    </li>
                    <li className="flex items-center">
                      <span className="text-red-500 mr-2">•</span>
                      <Link href="/register" className="text-red-600 hover:text-red-800 font-medium">PAN Card Services</Link>
                    </li>
                    <li className="flex items-center">
                      <span className="text-red-500 mr-2">•</span>
                      <Link href="/register" className="text-red-600 hover:text-red-800 font-medium">Voter ID Services</Link>
                    </li>
                  </ul>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                  <h4 className="font-bold text-lg text-red-700 mb-3">_Certificates</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center">
                      <span className="text-red-500 mr-2">•</span>
                      <Link href="/register" className="text-red-600 hover:text-red-800 font-medium">Birth Certificate</Link>
                    </li>
                    <li className="flex items-center">
                      <span className="text-red-500 mr-2">•</span>
                      <Link href="/register" className="text-red-600 hover:text-red-800 font-medium">Death Certificate</Link>
                    </li>
                    <li className="flex items-center">
                      <span className="text-red-500 mr-2">•</span>
                      <Link href="/register" className="text-red-600 hover:text-red-800 font-medium">Income Certificate</Link>
                    </li>
                    <li className="flex items-center">
                      <span className="text-red-500 mr-2">•</span>
                      <Link href="/register" className="text-red-600 hover:text-red-800 font-medium">Caste Certificate</Link>
                    </li>
                  </ul>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                  <h4 className="font-bold text-lg text-red-700 mb-3">_Travel & Financial</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center">
                      <span className="text-red-500 mr-2">•</span>
                      <Link href="/register" className="text-red-600 hover:text-red-800 font-medium">Passport Services</Link>
                    </li>
                    <li className="flex items-center">
                      <span className="text-red-500 mr-2">•</span>
                      <Link href="/register" className="text-red-600 hover:text-red-800 font-medium">Bank Account Opening</Link>
                    </li>
                    <li className="flex items-center">
                      <span className="text-red-500 mr-2">•</span>
                      <Link href="/register" className="text-red-600 hover:text-red-800 font-medium">Insurance Services</Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="text-center mt-8">
                <Link href="/register" className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transform hover:scale-105 transition-all duration-200 shadow-md">
                  View All 100+ Services
                </Link>
              </div>
            </div>

            {/* Animated stats or features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 animate-fade-in animate-delay-500">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-red-100 feature-card">
                <div className="text-3xl mb-3 animate-bounce">🏛️</div>
                <h3 className="text-xl font-bold text-red-700 mb-2">100+ Government Services Online</h3>
                <p className="text-gray-600">Access Aadhaar, PAN, Passport, Birth Certificate, Death Certificate, Income Certificate, Caste Certificate, and all government schemes digitally</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-red-100 feature-card animate-delay-200">
                <div className="text-3xl mb-3 animate-bounce animate-delay-500">🔒</div>
                <h3 className="text-xl font-bold text-red-700 mb-2">Secure Digital India Portal</h3>
                <p className="text-gray-600">Bank-level security with SSL encryption, real-time application tracking, and 24/7 customer support</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-red-100 feature-card animate-delay-400">
                <div className="text-3xl mb-3 animate-bounce animate-delay-1000">⚡</div>
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
                  <div className="text-red-600 text-6xl mb-6 animate-float group-hover:animate-bounce animate-delay-500">👨‍💼</div>
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
                href="/login?role=customer"
                className="group bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-500 border border-gray-300 hover:border-red-500 animate-scale-in transform hover:scale-105 relative overflow-hidden login-card focus:outline-none focus:ring-2 focus:ring-red-500"
                style={{ animationDelay: '0.2s' }}
              >
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-orange-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10">
                  <div className="text-red-600 text-6xl mb-6 animate-float group-hover:animate-bounce animate-delay-1000">👤</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-red-700 transition-colors">
                    Customer Login
                  </h3>
                  <p className="text-gray-600 group-hover:text-gray-700 leading-relaxed">
                    Login as a customer to access government services and track your applications
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

        {/* How It Works Section */}
        <HowItWorks />

        {/* Trust & Transparency Section */}
        <TrustBadges />

        {/* Latest Blog Posts Section */}
        <LatestBlogPosts />

        <Footer />
        
        {/* Tawk.to Chat Widget - Only on Landing Page */}
        <TawkToChat />
      </div>
    </>
  );
}