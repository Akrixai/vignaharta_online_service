import Link from "next/link";
import Logo from "@/components/ui/logo";
import { Metadata } from "next";
import BlogPostTemplate from "@/components/blog/BlogPostTemplate";
import InternalLink from "@/components/blog/InternalLink";
import OutboundLink from "@/components/blog/OutboundLink";

export const metadata: Metadata = {
  title: "About Us - VIGHNAHARTA ONLINE SERVICES | Government Service Portal",
  description: "Learn about VIGHNAHARTA ONLINE SERVICES, India's premier digital government service portal connecting citizens with essential services through our retailer network.",
  keywords: "government services, digital india, online services, retailer network, vighnaharta online services, about us",
  openGraph: {
    title: "About VIGHNAHARTA ONLINE SERVICES - Digital Government Services",
    description: "Discover how VIGHNAHARTA ONLINE SERVICES is revolutionizing access to government services across India through our innovative retailer network.",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <BlogPostTemplate
      title="About Vignaharta Online Service"
      description="Bridging the gap between citizens and government services through innovative digital solutions and a nationwide retailer network."
      authorName="Vignaharta Online Services Team"
      authorTitle="Government Service Experts"
      publishDate="2025-10-22"
      lastUpdated="2025-10-22"
      readingTime="5 min read"
      tldrSummary="Vignaharta Online Service is India's premier digital government service portal that connects citizens with essential services through our nationwide retailer network, making government services accessible, fast, and secure for everyone."
      tldrPoints={[
        "Nationwide retailer network for local service access",
        "Digital platform for 100+ government services",
        "Secure document processing with real-time tracking",
        "Support for Aadhaar, PAN, passport, and certificate applications"
      ]}
      keywords={["government services", "digital india", "online services", "retailer network", "vighnaharta online services"]}
    >
      <div className="prose max-w-none">
        {/* Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-lg hover-lift">
            <div className="text-red-600 text-4xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              To democratize access to government services by creating a seamless digital platform that connects citizens with essential services through our trusted retailer network, ensuring no one is left behind in India&apos;s digital transformation journey.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg hover-lift">
            <div className="text-red-600 text-4xl mb-4">👁️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h2>
            <p className="text-gray-600 leading-relaxed">
              To become India&apos;s most trusted and comprehensive government service portal, empowering every citizen with easy access to digital services while creating sustainable livelihood opportunities for retailers across the nation.
            </p>
          </div>
        </div>

        {/* What We Do */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">What We Do</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-red-600 text-5xl mb-4">🏛️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Government Services</h3>
              <p className="text-gray-600">
                Provide easy access to essential government services including <InternalLink href="/services/aadhaar-card" title="Aadhaar Card Services">Aadhaar</InternalLink>, <InternalLink href="/services/pan-card" title="PAN Card Services">PAN</InternalLink>, <InternalLink href="/services/passport" title="Passport Services">passport applications</InternalLink>, and various certificates.
              </p>
            </div>
            <div className="text-center">
              <div className="text-red-600 text-5xl mb-4">🏪</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Retailer Network</h3>
              <p className="text-gray-600">
                Build and support a nationwide network of retailers who serve as service points for citizens in their local communities.
              </p>
            </div>
            <div className="text-center">
              <div className="text-red-600 text-5xl mb-4">💻</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Digital Platform</h3>
              <p className="text-gray-600">
                Maintain a robust, secure, and user-friendly digital platform that ensures smooth service delivery and real-time tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Choose Vignaharta Online Service?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl hover-lift">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-semibold mb-2">Fast Processing</h3>
              <p className="text-red-100 text-sm">Quick turnaround times for all service applications</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl hover-lift">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="font-semibold mb-2">Secure Platform</h3>
              <p className="text-orange-100 text-sm">Bank-grade security for all your documents and data</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl hover-lift">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="font-semibold mb-2">Mobile Friendly</h3>
              <p className="text-green-100 text-sm">Access services anytime, anywhere from any device</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl hover-lift">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-semibold mb-2">Real-time Tracking</h3>
              <p className="text-blue-100 text-sm">Track your application status in real-time</p>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg my-8">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Learn More About Digital India</h3>
          <p className="text-gray-700 mb-3">
            For more information about the Digital India initiative and government services, visit the official <OutboundLink href="https://www.digitalindia.gov.in" title="Digital India Official Website">Digital India website</OutboundLink>.
          </p>
          <p className="text-gray-600 text-sm">
            Vignaharta Online Services is proud to be part of the Government of India's Digital India initiative, working to transform India into a digitally empowered society and knowledge economy.
          </p>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied users who trust Vignaharta Online Service for their government service needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-red-600 text-white px-8 py-4 rounded-lg hover:bg-red-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🏪 Become a Retailer
            </Link>
            <Link
              href="/services"
              className="border-2 border-red-600 text-red-600 px-8 py-4 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              📋 View Services
            </Link>
          </div>
        </div>
      </div>
    </BlogPostTemplate>
  );
}