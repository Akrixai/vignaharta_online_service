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
import FeaturedProducts from "@/components/FeaturedProducts";
import HiringBanner from "@/components/HiringBanner";
import { useState, useEffect, useRef } from "react";

// Define types for our data
interface Advertisement {
  description: string;
}

interface SocialLink {
  name: string;
  url: string;
  icon: string;
}

interface ServiceStat {
  title: string;
  value: string;
  icon: string;
  description: string;
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
          className="marquee-text px-4 py-2 bg-gradient-to-r from-red-200 via-orange-200 to-yellow-200 text-red-700 font-semibold shadow-lg rounded-lg"
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
          animation: marquee 20s linear infinite;
          pointer-events: none;
          opacity: 0.95;
        }
      `}</style>
    </div>
  );
}

// Animated Counter Component
function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let start = 0;
    const end = target;
    const increment = end / (duration / 16); // 60fps

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [target, duration]);

  return <span ref={counterRef} className="text-4xl md:text-5xl font-bold text-red-600">{count}+</span>;
}

// Interactive Tooltip Component
function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-red-600 text-white text-sm rounded-lg shadow-lg whitespace-nowrap">
          {text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-600"></div>
        </div>
      )}
    </div>
  );
}

// Animated Service Card Component with enhanced features
function AnimatedServiceCard({ icon, title, description, delay = '0s' }: { icon: string; title: string; description: string; delay?: string }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-red-100 feature-card group" style={{ animationDelay: delay }}>
      <div className="text-3xl mb-3 animate-bounce group-hover:animate-pulse" style={{ animationDelay: delay }}>{icon}</div>
      <h3 className="text-xl font-bold text-red-700 mb-2 group-hover:text-red-800 transition-colors">{title}</h3>
      <p className="text-gray-600 group-hover:text-gray-700 transition-colors">{description}</p>
      <div className="mt-4 h-1 w-full bg-gradient-to-r from-red-200 to-orange-200 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
    </div>
  );
}

// Interactive Service Category Component with enhanced hover effects
function ServiceCategory({ icon, title, subtitle, services }: { icon: string; title: string; subtitle: string; services: string[] }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/40 transform hover:scale-105 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="text-4xl mb-4 transform hover:scale-110 transition-transform">{icon}</div>
      <h4 className="font-bold text-lg mb-2 text-white group-hover:text-yellow-300 transition-colors">{title}</h4>
      <p className="text-sm text-red-100 group-hover:text-white transition-colors">{subtitle}</p>
      {isHovered && services.length > 0 && (
        <div className="mt-3 space-y-1 text-xs text-red-200 animate-fade-in">
          {services.map((service, index) => (
            <div key={index} className="flex items-center">
              <span className="mr-2">•</span>
              <span>{service}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Animated Login Card Component with enhanced animations
function LoginCard({ href, icon, title, description, delay }: { href: string; icon: string; title: string; description: string; delay: string }) {
  return (
    <Link
      href={href}
      className="group bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-500 border border-gray-300 hover:border-red-500 animate-scale-in transform hover:scale-105 relative overflow-hidden login-card focus:outline-none focus:ring-2 focus:ring-red-500"
      style={{ animationDelay: delay }}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-orange-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="relative z-10">
        <div className="text-red-600 text-6xl mb-6 animate-float group-hover:animate-bounce">{icon}</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-red-700 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 group-hover:text-gray-700 leading-relaxed transition-colors">
          {description}
        </p>

        {/* Hover indicator */}
        <div className="mt-4 flex items-center text-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-sm font-medium">Click to login</span>
          <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
        </div>
      </div>
    </Link>
  );
}

// Stats Display Component
function StatsDisplay({ stats }: { stats: ServiceStat[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center shadow-lg border border-red-100 hover:shadow-xl transition-all duration-300">
          <div className="text-3xl mb-3 text-red-600 animate-bounce" style={{ animationDelay: `${index * 0.1}s` }}>{stat.icon}</div>
          <div className="text-3xl font-bold text-red-700 mb-2">
            <AnimatedCounter target={parseInt(stat.value)} />
          </div>
          <h4 className="font-semibold text-gray-800">{stat.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{stat.description}</p>
        </div>
      ))}
    </div>
  );
}


export default function LandingPageClient() {
  const [, setConsentGiven] = useState(false);
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  const handleConsentGiven = () => {
    setConsentGiven(true);
  };

  useEffect(() => {
    // Check if mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Service statistics
  const serviceStats: ServiceStat[] = [
    {
      title: "Government Services",
      value: "100",
      icon: "🏛️",
      description: "Available online"
    },
    {
      title: "Service Centers",
      value: "10000",
      icon: "📍",
      description: "Nationwide network"
    },
    {
      title: "Happy Customers",
      value: "500000",
      icon: "😊",
      description: "Served successfully"
    },
    {
      title: "Processing Time",
      value: "24",
      icon: "⚡",
      description: "Hours average"
    }
  ];

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
      url: "https://www.instagram.com/invites/contact/?utm_source=ig_contact_invite&utm_content=zrqm86t",
      icon: "📸"
    }
  ];

  return (
    <>
      <UserConsent onConsentGiven={handleConsentGiven} />
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 relative overflow-hidden">
        {/* Enhanced Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute floating-bg-1 bg-gradient-to-br from-red-200/30 to-orange-200/30 rounded-full blur-3xl animate-float animate-delay-2000"></div>
          <div className="absolute floating-bg-2 bg-gradient-to-tr from-yellow-200/30 to-red-200/30 rounded-full blur-3xl animate-float"></div>
          <div className="absolute floating-bg-3 bg-gradient-to-r from-orange-200/20 to-red-200/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute floating-bg-4 bg-gradient-to-tl from-red-100/20 to-yellow-100/20 rounded-full blur-xl animate-float animate-delay-1000"></div>
          <div className="absolute floating-bg-5 bg-gradient-to-br from-orange-100/10 to-red-100/10 rounded-full blur-lg animate-pulse animate-delay-3000"></div>
        </div>

        {/* Header - Import from component */}
        <Header />

        {/* Hiring Banner */}
        <HiringBanner />

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
          {/* Enhanced Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-r from-red-100 to-orange-100 rounded-full opacity-20 animate-float"></div>
            <div className="absolute bottom-20 right-10 w-48 h-48 bg-gradient-to-r from-orange-100 to-red-100 rounded-full opacity-20 animate-float animate-delay-2000"></div>
            <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-gradient-to-br from-yellow-100 to-red-100 rounded-full opacity-15 animate-pulse animate-delay-1000"></div>
          </div>

          <div className="text-center relative z-10">
            {/* Enhanced SEO-optimized H1 and H2 tags with gradient */}
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-red-700 to-red-900 bg-clip-text text-transparent mb-6 animate-fade-in">
              Vighnaharta Online Services
            </h1>
            <h2 className="text-xl md:text-2xl text-red-600 mb-4 max-w-3xl mx-auto animate-fade-in animate-delay-200">
              India's Premier Digital Government Services Portal
            </h2>
            <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-4xl mx-auto animate-fade-in animate-delay-300">
              Access <Link href="/register" className="text-red-600 hover:text-red-800 font-semibold underline">Aadhaar Card</Link>, <Link href="/register" className="text-red-600 hover:text-red-800 font-semibold underline">PAN Card</Link>, <Link href="/register" className="text-red-600 hover:text-red-800 font-semibold underline">Passport</Link>, <Link href="/register" className="text-red-600 hover:text-red-800 font-semibold underline">Birth Certificate</Link>, <Link href="/register" className="text-red-600 hover:text-red-800 font-semibold underline">Death Certificate</Link>, <Link href="/register" className="text-red-600 hover:text-red-800 font-semibold underline">Income Certificate</Link>, <Link href="/register" className="text-red-600 hover:text-red-800 font-semibold underline">Caste Certificate</Link>, and <Link href="/register" className="text-red-600 hover:text-red-800 font-semibold underline">100+ government services online</Link>. Fast, secure, and reliable government service portal with nationwide retailer network support.
            </p>

            {/* Enhanced CTA Buttons with icons and animations */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in animate-delay-400">
              <Link href="/login" className="group bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-lg text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden">
                <span className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative flex items-center justify-center">
                  🚀 Get Started - Apply Online
                  <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </Link>
              <Link href="/about" className="group bg-white hover:bg-red-50 text-red-600 border-2 border-red-600 hover:border-red-700 px-8 py-4 rounded-lg text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden">
                <span className="absolute inset-0 bg-gradient-to-r from-red-50 to-orange-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative flex items-center justify-center">
                  📖 Learn More About Services
                  <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </Link>
            </div>

            {/* Enhanced Government Services Benefits Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 mb-12 shadow-xl border border-red-100 max-w-4xl mx-auto hover:shadow-2xl transition-all duration-300">
              <h3 className="text-2xl font-bold text-red-800 mb-6 flex items-center">
                <span className="mr-3">🏆</span> Why Choose Vighnaharta Online Services?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="flex items-start p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                  <div className="text-2xl mr-4 text-red-600 flex-shrink-0">✅</div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 mb-2">Digital India Initiative</h4>
                    <p className="text-gray-700">Part of the Government of India's <Link href="/about" className="text-red-600 hover:text-red-800 font-semibold underline">Digital India program</Link> to transform India into a digitally empowered society and knowledge economy.</p>
                  </div>
                </div>
                <div className="flex items-start p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                  <div className="text-2xl mr-4 text-red-600 flex-shrink-0">✅</div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 mb-2">Nationwide Access</h4>
                    <p className="text-gray-700">Access government services from anywhere in India through our extensive network of over <Link href="/about" className="text-red-600 hover:text-red-800 font-semibold underline">10,000+ service centers</Link>.</p>
                  </div>
                </div>
                <div className="flex items-start p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                  <div className="text-2xl mr-4 text-red-600 flex-shrink-0">✅</div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 mb-2">Fast Processing</h4>
                    <p className="text-gray-700">Quick document verification and processing with <Link href="/services" className="text-red-600 hover:text-red-800 font-semibold underline">real-time application tracking</Link> and status updates.</p>
                  </div>
                </div>
                <div className="flex items-start p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <div className="text-2xl mr-4 text-red-600 flex-shrink-0">✅</div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 mb-2">Secure & Reliable</h4>
                    <p className="text-gray-700">Bank-level security with SSL encryption and compliance with <Link href="/privacy-policy" className="text-red-600 hover:text-red-800 font-semibold underline">Indian data protection regulations</Link>.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Social Media Links */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-red-800 mb-6 flex items-center justify-center">
                <span className="mr-3">📱</span> Connect With Us
              </h3>
              <div className="flex justify-center space-x-4 flex-wrap gap-4">
                {socialLinks.map((social, index) => (
                  <Tooltip key={index} text={`Follow us on ${social.name}`}>
                    <Link
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-white rounded-full p-4 shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 border border-red-200 hover:border-red-400 hover:rotate-12"
                      title={`Follow us on ${social.name}`}
                    >
                      <span className="text-2xl group-hover:animate-bounce">{social.icon}</span>
                    </Link>
                  </Tooltip>
                ))}
              </div>
            </div>

            {/* Enhanced Popular Government Services Section */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-8 mb-12 shadow-lg border border-red-100 max-w-6xl mx-auto hover:shadow-xl transition-all duration-300">
              <h3 className="text-2xl font-bold text-red-800 mb-6 text-center flex items-center justify-center">
                <span className="mr-3">🏛️</span> Popular Government Services
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-red-100 hover:border-red-200">
                  <h4 className="font-bold text-lg text-red-700 mb-3 flex items-center">
                    <span className="mr-2">🆔</span> Identity Services
                  </h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center hover:bg-red-50 p-2 rounded transition-colors">
                      <span className="text-red-500 mr-2">•</span>
                      <Link href="/register" className="text-red-600 hover:text-red-800 font-medium">Aadhaar Card Services</Link>
                    </li>
                    <li className="flex items-center hover:bg-red-50 p-2 rounded transition-colors">
                      <span className="text-red-500 mr-2">•</span>
                      <Link href="/register" className="text-red-600 hover:text-red-800 font-medium">PAN Card Services</Link>
                    </li>
                    <li className="flex items-center hover:bg-red-50 p-2 rounded transition-colors">
                      <span className="text-red-500 mr-2">•</span>
                      <Link href="/register" className="text-red-600 hover:text-red-800 font-medium">Voter ID Services</Link>
                    </li>
                  </ul>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-orange-100 hover:border-orange-200">
                  <h4 className="font-bold text-lg text-red-700 mb-3 flex items-center">
                    <span className="mr-2">📄</span> Certificates
                  </h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center hover:bg-orange-50 p-2 rounded transition-colors">
                      <span className="text-red-500 mr-2">•</span>
                      <Link href="/register" className="text-red-600 hover:text-red-800 font-medium">Birth Certificate</Link>
                    </li>
                    <li className="flex items-center hover:bg-orange-50 p-2 rounded transition-colors">
                      <span className="text-red-500 mr-2">•</span>
                      <Link href="/register" className="text-red-600 hover:text-red-800 font-medium">Death Certificate</Link>
                    </li>
                    <li className="flex items-center hover:bg-orange-50 p-2 rounded transition-colors">
                      <span className="text-red-500 mr-2">•</span>
                      <Link href="/register" className="text-red-600 hover:text-red-800 font-medium">Income Certificate</Link>
                    </li>
                    <li className="flex items-center hover:bg-orange-50 p-2 rounded transition-colors">
                      <span className="text-red-500 mr-2">•</span>
                      <Link href="/register" className="text-red-600 hover:text-red-800 font-medium">Caste Certificate</Link>
                    </li>
                  </ul>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-yellow-100 hover:border-yellow-200">
                  <h4 className="font-bold text-lg text-red-700 mb-3 flex items-center">
                    <span className="mr-2">🌍</span> Travel & Financial
                  </h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center hover:bg-yellow-50 p-2 rounded transition-colors">
                      <span className="text-red-500 mr-2">•</span>
                      <Link href="/register" className="text-red-600 hover:text-red-800 font-medium">Passport Services</Link>
                    </li>
                    <li className="flex items-center hover:bg-yellow-50 p-2 rounded transition-colors">
                      <span className="text-red-500 mr-2">•</span>
                      <Link href="/register" className="text-red-600 hover:text-red-800 font-medium">Bank Account Opening</Link>
                    </li>
                    <li className="flex items-center hover:bg-yellow-50 p-2 rounded transition-colors">
                      <span className="text-red-500 mr-2">•</span>
                      <Link href="/register" className="text-red-600 hover:text-red-800 font-medium">Insurance Services</Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="text-center mt-8">
                <Link href="/register" className="group inline-block bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg relative overflow-hidden">
                  <span className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative flex items-center justify-center">
                    View All 100+ Services
                    <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </Link>
              </div>
            </div>

            {/* Enhanced Stats Section with Animated Counters */}
            <StatsDisplay stats={serviceStats} />

            {/* Enhanced Animated Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 animate-fade-in animate-delay-500">
              <AnimatedServiceCard
                icon="🏛️"
                title="100+ Government Services Online"
                description="Access Aadhaar, PAN, Passport, Birth Certificate, Death Certificate, Income Certificate, Caste Certificate, and all government schemes digitally"
                delay="0s"
              />
              <AnimatedServiceCard
                icon="🔒"
                title="Secure Digital India Portal"
                description="Bank-level security with SSL encryption, real-time application tracking, and 24/7 customer support"
                delay="0.2s"
              />
              <AnimatedServiceCard
                icon="⚡"
                title="Fast Government Service Processing"
                description="Quick document processing with user-friendly interface and nationwide retailer network support"
                delay="0.4s"
              />
            </div>

            {/* Enhanced Interactive Service Categories */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-3xl p-8 mb-12 shadow-2xl text-white hover:shadow-3xl transition-all duration-300">
              <h3 className="text-3xl font-bold text-center mb-8 text-white flex items-center justify-center">
                <span className="mr-3">🔍</span> Explore Our Services
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 service-categories">
                <ServiceCategory
                  icon="🆔"
                  title="Identity Services"
                  subtitle="Aadhaar, PAN, Voter ID"
                  services={["Aadhaar Card", "PAN Card", "Voter ID", "Driving License"]}
                />
                <ServiceCategory
                  icon="📄"
                  title="Certificates"
                  subtitle="Birth, Death, Income, Caste"
                  services={["Birth Certificate", "Death Certificate", "Income Certificate", "Caste Certificate"]}
                />
                <ServiceCategory
                  icon="🏛️"
                  title="Government Schemes"
                  subtitle="PM Kisan, Ayushman Bharat"
                  services={["PM Kisan Yojana", "Ayushman Bharat", "Pradhan Mantri Awas Yojana", "Atal Pension Yojana"]}
                />
                <ServiceCategory
                  icon="💳"
                  title="Financial Services"
                  subtitle="Banking, Insurance, Loans"
                  services={["Bank Account Opening", "Insurance Services", "Loan Applications", "Credit Services"]}
                />
              </div>
            </div>

            {/* Enhanced Login Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-5xl mx-auto login-cards">
              <LoginCard
                href="/login?role=retailer"
                icon="🏪"
                title="Retailer Login"
                description="Manage customer services, process applications, and earn commissions from government services"
                delay="0s"
              />
              <LoginCard
                href="/login?role=employee"
                icon="👨‍💼"
                title="Employee Login"
                description="Process applications, verify documents, and assist retailers with customer queries"
                delay="0.1s"
              />
              <LoginCard
                href="/login?role=customer"
                icon="👤"
                title="Customer Login"
                description="Login as a customer to access government services and track your applications"
                delay="0.2s"
              />
            </div>

            {/* Enhanced Retailer Registration */}
            <div className="mt-16 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
              <div className="relative p-10 bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-3xl shadow-2xl max-w-4xl mx-auto hover-lift animate-fade-in text-white overflow-hidden">
                {/* Enhanced Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full animate-float"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-300 rounded-full animate-bounce"></div>
                  <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-orange-300 rounded-full animate-ping"></div>
                  <div className="absolute top-1/3 right-1/3 w-20 h-20 bg-red-300 rounded-full animate-pulse animate-delay-1000"></div>
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
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300 border border-white/20">
                      <div className="text-3xl mb-3">💰</div>
                      <h4 className="font-bold text-lg mb-2">Earn Commission</h4>
                      <p className="text-red-100 text-sm">Up to 15% commission on every service</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300 border border-white/20">
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

        {/* Enhanced How It Works Section */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 py-16">
          <HowItWorks />
        </div>

        {/* Enhanced Featured Products Section */}
        <div className="bg-white py-16">
          <FeaturedProducts />
        </div>

        {/* Enhanced Trust & Transparency Section */}
        <div className="bg-gradient-to-r from-red-50 to-yellow-50 py-16">
          <TrustBadges />
        </div>

        {/* Enhanced Latest Blog Posts Section */}
        <div className="bg-white py-16">
          <LatestBlogPosts />
        </div>

        <Footer />

        {/* Tawk.to Chat Widget - Only on Landing Page */}
        <TawkToChat />
      </div>
    </>
  );
}
