'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Search, HelpCircle, Phone, Mail } from 'lucide-react';
import Logo from '@/components/ui/logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BlogPostTemplate from '@/components/blog/BlogPostTemplate';
import InternalLink from '@/components/blog/InternalLink';
import OutboundLink from '@/components/blog/OutboundLink';

const faqData = [
  {
    id: '1',
    question: 'What is विघ्नहर्ता ऑनलाईन सर्विसेस?',
    answer: 'विघ्नहर्ता ऑनलाईन सर्विसेस is a comprehensive digital government service portal that connects citizens with essential government services through our nationwide retailer network. We provide easy access to services like <InternalLink href="/services/aadhaar-card" title="Aadhaar Card Services">Aadhaar</InternalLink>, <InternalLink href="/services/pan-card" title="PAN Card Services">PAN</InternalLink>, <InternalLink href="/services/passport" title="Passport Services">passport applications</InternalLink>, certificates, and more.',
    category: 'General'
  },
  {
    id: '2',
    question: 'How do I register as a retailer?',
    answer: 'To register as a retailer, click on "Become a Retailer" from our homepage or footer. Fill out the registration form with your business details, upload required documents, and submit your application. Our team will review and approve your application within 2-3 business days. You can find more information on our <InternalLink href="/register" title="Register as Retailer">registration page</InternalLink>.',
    category: 'Registration'
  },
  {
    id: '3',
    question: 'What services are available through the portal?',
    answer: 'We offer a wide range of government services including Aadhaar card services, PAN card applications, passport services, birth/death certificates, income certificates, caste certificates, domicile certificates, and many more. New services are regularly added to our platform. Visit our <InternalLink href="/services" title="View All Services">services page</InternalLink> for a complete list.',
    category: 'Services'
  },
  {
    id: '4',
    question: 'How do I apply for a government service?',
    answer: 'After logging into your account, go to the "Services" section, select the service you need, fill out the required information, upload necessary documents, and submit your application. You can track the status of your application in real-time. For detailed instructions, check our <InternalLink href="/help" title="Help Center">help center</InternalLink>.',
    category: 'Applications'
  },
  {
    id: '5',
    question: 'What documents do I need for service applications?',
    answer: 'Required documents vary by service. Common documents include Aadhaar card, PAN card, passport-size photographs, address proof, income proof, and service-specific documents. Each service page lists the exact requirements. Refer to our <InternalLink href="/services" title="View All Services">services directory</InternalLink> for specific document requirements.',
    category: 'Documents'
  },
  {
    id: '6',
    question: 'How long does it take to process applications?',
    answer: 'Processing times vary by service type. Most certificate services take 3-7 business days, while services like passport applications may take 2-4 weeks. You will receive real-time updates on your application status. Check our <InternalLink href="/services" title="View All Services">services page</InternalLink> for estimated processing times for each service.',
    category: 'Processing'
  },
  {
    id: '7',
    question: 'How can I track my application status?',
    answer: 'You can track your application status by logging into your account and visiting the "My Applications" section. You will also receive SMS and email notifications for status updates. For more information, visit our <InternalLink href="/dashboard" title="User Dashboard">dashboard help section</InternalLink>.',
    category: 'Tracking'
  },
  {
    id: '8',
    question: 'What payment methods are accepted?',
    answer: 'We accept various payment methods including UPI, net banking, debit/credit cards, and digital wallets. All payments are processed through secure payment gateways. For payment-related issues, contact our <InternalLink href="/contact" title="Contact Support">support team</InternalLink>.',
    category: 'Payment'
  },
  {
    id: '9',
    question: 'Is my personal information secure?',
    answer: 'Yes, we take data security very seriously. All personal information is encrypted and stored securely. We follow government data protection guidelines and never share your information with unauthorized parties. Read our <InternalLink href="/privacy" title="Privacy Policy">Privacy Policy</InternalLink> for more details on how we protect your data.',
    category: 'Security'
  },
  {
    id: '10',
    question: 'How can I contact customer support?',
    answer: 'You can contact our customer support team through phone at +91-7499116527, email at vighnahartaenterprises.sangli@gmail.com, or use the live chat feature available on our website. Our support team is available 24/7. For government-related inquiries, you may also refer to the <OutboundLink href="https://www.india.gov.in" title="Government of India Official Portal">Government of India official portal</OutboundLink>.',
    category: 'Support'
  }
];

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const categories = ['All', ...Array.from(new Set(faqData.map(faq => faq.category)))];

  const filteredFaqs = faqData.filter(faq => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <BlogPostTemplate
      title="Frequently Asked Questions"
      description="Find quick answers to common questions about our services, registration process, and more."
      authorName="Customer Support Team"
      authorTitle="Vignaharta Online Services"
      publishDate="2025-10-22"
      lastUpdated="2025-10-22"
      readingTime="6 min read"
      tldrSummary="This FAQ section provides answers to common questions about Vignaharta Online Services, including how to register as a retailer, apply for government services, track applications, and contact customer support."
      tldrPoints={[
        "Registration process for retailers takes 2-3 business days",
        "Over 100 government services available through our portal",
        "Real-time tracking for all applications",
        "Multiple payment options with secure processing",
        "24/7 customer support via phone, email, and chat"
      ]}
      keywords={["faq", "frequently asked questions", "government services", "customer support", "vignaharta online services"]}
    >
      <div className="prose max-w-none">
        {/* Search and Filter */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {filteredFaqs.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <HelpCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No FAQs found</h3>
                    <p className="text-gray-600">Try adjusting your search terms or category filter.</p>
                  </CardContent>
                </Card>
              ) : (
                filteredFaqs.map((faq) => (
                  <Card key={faq.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <span className="inline-block px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full mb-2">
                            {faq.category}
                          </span>
                          <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                        </div>
                        {expandedFaq === faq.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                      {expandedFaq === faq.id && (
                        <div className="px-6 pb-4 text-gray-600 border-t border-gray-100">
                          <div 
                            className="pt-4 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: faq.answer }}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Support */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <Phone className="w-5 h-5 mr-2" />
                  Need More Help?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Can't find what you're looking for? Our support team is here to help.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Phone className="w-4 h-4 mr-2 text-red-500" />
                    <span>+91-7499116527</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Mail className="w-4 h-4 mr-2 text-red-500" />
                    <span>vighnahartaenterprises.sangli@gmail.com</span>
                  </div>
                </div>
                <Link
                  href="/contact"
                  className="inline-block mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Contact Us
                </Link>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Quick Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Link href="/register" className="block text-red-600 hover:text-red-800 font-medium">
                    🏪 Become a Retailer
                  </Link>
                  <Link href="/services" className="block text-red-600 hover:text-red-800 font-medium">
                    📋 View Services
                  </Link>
                  <Link href="/about" className="block text-red-600 hover:text-red-800 font-medium">
                    ℹ️ About Us
                  </Link>
                  <Link href="/login" className="block text-red-600 hover:text-red-800 font-medium">
                    🔐 Login
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </BlogPostTemplate>
  );
}