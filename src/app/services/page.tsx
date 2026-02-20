import Link from "next/link";
import Logo from "@/components/ui/logo";
import Footer from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services - VIGHNAHARTA ONLINE SERVICES | Digital Service Portal",
  description: "Explore comprehensive digital services available through VIGHNAHARTA ONLINE SERVICES including Aadhaar, PAN, passport, certificates, and more.",
  keywords: "digital services, aadhaar, pan, passport, certificates, online services, vighnaharta online services",
  openGraph: {
    title: "digital services - VIGHNAHARTA ONLINE SERVICES",
    description: "Access a wide range of digital services through our secure digital platform.",
    type: "website",
  },
};

const services = [
  {
    category: "Identity Services",
    icon: "🆔",
    services: [
      { name: "Aadhaar Card", description: "New Aadhaar enrollment, updates, and corrections", price: "₹50" },
      { name: "PAN Card", description: "PAN card application and corrections", price: "₹107" },
      { name: "Voter ID", description: "Voter ID registration and updates", price: "Free" },
    ]
  },
  {
    category: "Travel Documents",
    icon: "✈️",
    services: [
      { name: "Passport", description: "Fresh passport and renewal applications", price: "₹1,500" },
      { name: "Visa Assistance", description: "Visa application support and guidance", price: "₹500" },
    ]
  },
  {
    category: "Certificates",
    icon: "📜",
    services: [
      { name: "Birth Certificate", description: "Birth certificate applications", price: "₹25" },
      { name: "Death Certificate", description: "Death certificate applications", price: "₹25" },
      { name: "Income Certificate", description: "Income certificate from authorities", price: "₹30" },
      { name: "Caste Certificate", description: "Caste certificate applications", price: "₹30" },
    ]
  },
  {
    category: "Financial Services",
    icon: "💰",
    services: [
      { name: "Bank Account Opening", description: "Assistance with bank account opening", price: "₹100" },
      { name: "Insurance Services", description: "Life and health insurance applications", price: "₹200" },
      { name: "Loan Applications", description: "Loan scheme applications", price: "₹300" },
    ]
  },
  {
    category: "Utility Services",
    icon: "⚡",
    services: [
      { name: "Electricity Connection", description: "New electricity connection applications", price: "₹150" },
      { name: "Gas Connection", description: "LPG gas connection applications", price: "₹100" },
      { name: "Water Connection", description: "Municipal water connection", price: "₹100" },
    ]
  },
  {
    category: "Education Services",
    icon: "🎓",
    services: [
      { name: "Scholarship Applications", description: "Scholarship applications", price: "₹50" },
      { name: "Educational Certificates", description: "Educational document verification", price: "₹75" },
    ]
  }
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center">
              <Logo size="lg" showText={true} animated={true} />
              <span className="ml-4 text-sm text-red-100">
                Digital Service Portal
              </span>
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-red-100 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-red-100 hover:text-white transition-colors">
                About
              </Link>
              <Link href="/services" className="text-white font-semibold">
                Services
              </Link>
              <Link href="/contact" className="text-red-100 hover:text-white transition-colors">
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 animate-fade-in">
            Our Services
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-slide-in-up">
            Access a comprehensive range of digital services through our secure digital platform. 
            Fast, reliable, and available at your nearest retailer.
          </p>
        </div>

        {/* Service Categories */}
        <div className="space-y-12">
          {services.map((category, index) => (
            <div key={category.category} className="bg-white rounded-xl shadow-lg p-8 hover-lift">
              <div className="flex items-center mb-6">
                <div className="text-4xl mr-4">{category.icon}</div>
                <h2 className="text-3xl font-bold text-gray-900">{category.category}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.services.map((service, serviceIndex) => (
                  <div key={service.name} className="border border-gray-200 rounded-lg p-6 hover:border-red-500 transition-colors hover:shadow-md">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{service.name}</h3>
                    <p className="text-gray-600 mb-4">{service.description}</p>
                    <div className="flex justify-center">
                      <Link
                        href="/register"
                        className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        Get Started
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-16 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl p-8">
          <h2 className="text-3xl font-bold mb-8 text-center">Why Choose Our Services?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Fast Processing</h3>
              <p className="text-red-100">Quick turnaround times for all applications</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2">Secure & Safe</h3>
              <p className="text-red-100">Your documents and data are completely secure</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-2">Real-time Tracking</h3>
              <p className="text-red-100">Track your application status anytime</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">Expert Support</h3>
              <p className="text-red-100">Get help from our trained professionals</p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Visit Retailer</h3>
              <p className="text-gray-600">Find your nearest Vighnaharta Online Services retailer</p>
            </div>
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Submit Documents</h3>
              <p className="text-gray-600">Provide required documents and information</p>
            </div>
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Track Progress</h3>
              <p className="text-gray-600">Monitor your application status in real-time</p>
            </div>
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">4</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Receive Service</h3>
              <p className="text-gray-600">Get your documents delivered or collect them</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust us for their Digital Service needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-red-600 text-white px-8 py-4 rounded-lg hover:bg-red-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🏪 Find a Retailer
            </Link>
            <Link
              href="/contact"
              className="border-2 border-red-600 text-red-600 px-8 py-4 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              📞 Contact Us
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
