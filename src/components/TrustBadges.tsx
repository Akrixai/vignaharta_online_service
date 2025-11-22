'use client';

interface Badge {
  icon: string;
  title: string;
  description: string;
  details: string[];
}

const badges: Badge[] = [
  {
    icon: "🔒",
    title: "Bank-Level Security",
    description: "256-bit SSL Encryption",
    details: [
      "AES-256 encryption for data storage",
      "SSL/TLS for data transmission",
      "ISO 27001 compliant infrastructure",
      "Regular security audits"
    ]
  },
  {
    icon: "🇮🇳",
    title: "Data Residency",
    description: "India-based Data Centers",
    details: [
      "All data stored in India",
      "Compliant with Indian data protection laws",
      "GDPR-ready infrastructure",
      "Regular backup and disaster recovery"
    ]
  },
  {
    icon: "✅",
    title: "Government Authorized",
    description: "Licensed Service Provider",
    details: [
      "Authorized by government departments",
      "Registered under Indian Companies Act",
      "GST compliant operations",
      "Verified business credentials"
    ]
  },
  {
    icon: "🏆",
    title: "100+ Service Centers",
    description: "Nationwide Network",
    details: [
      "Present in 28 states and 8 UTs",
      "Coverage in tier-2 and tier-3 cities",
      "Rural area accessibility",
      "Expanding network continuously"
    ]
  },
  {
    icon: "⚡",
    title: "Fast Processing",
    description: "Quick Turnaround Time",
    details: [
      "Real-time application tracking",
      "Automated workflow management",
      "Priority processing available",
      "Average 7-15 days delivery"
    ]
  },
  {
    icon: "📞",
    title: "24/7 Support",
    description: "Always Available",
    details: [
      "Phone support available",
      "WhatsApp assistance",
      "Email support",
      "Live chat during business hours"
    ]
  }
];

export default function TrustBadges() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why Trust Us?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your security and satisfaction are our top priorities. Here's what makes us reliable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {badges.map((badge, index) => (
            <div
              key={index}
              className="group bg-gradient-to-br from-white to-red-50 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-200 hover:border-red-500 transform hover:scale-105"
            >
              <div className="text-5xl mb-4 group-hover:animate-bounce">
                {badge.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {badge.title}
              </h3>
              <p className="text-red-600 font-semibold mb-4">
                {badge.description}
              </p>
              <ul className="space-y-2">
                {badge.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start text-sm text-gray-700">
                    <span className="text-red-500 mr-2 flex-shrink-0">✓</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Certifications Section */}
        <div className="mt-16 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-8 border-2 border-red-200">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Our Certifications & Compliance
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-2">🏛️</div>
              <div className="font-semibold text-gray-900">Government</div>
              <div className="text-sm text-gray-600">Authorized</div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🔐</div>
              <div className="font-semibold text-gray-900">ISO 27001</div>
              <div className="text-sm text-gray-600">Certified</div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">💼</div>
              <div className="font-semibold text-gray-900">GST</div>
              <div className="text-sm text-gray-600">Compliant</div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🇮🇳</div>
              <div className="font-semibold text-gray-900">Digital India</div>
              <div className="text-sm text-gray-600">Partner</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
