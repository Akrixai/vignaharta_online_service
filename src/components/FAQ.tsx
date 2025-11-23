'use client';

import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: 'General',
    question: 'What is Vighnaharta Online Services?',
    answer: 'Vighnaharta Online Services is India\'s premier digital government services portal with 10,000+ service centers nationwide. We help citizens access 100+ government services including Aadhaar, PAN, Passport, certificates, and more through our secure platform.'
  },
  {
    category: 'General',
    question: 'How do I access your services?',
    answer: 'You can visit any of our 10,000+ service centers across India. Find your nearest center using our service center locator, or register online to track your applications digitally.'
  },
  {
    category: 'Services',
    question: 'What services do you offer?',
    answer: 'We offer 100+ government services including Aadhaar card enrollment/update, PAN card application, Passport services, Birth/Death certificates, Income/Caste certificates, Voter ID, Driving License, and many more.'
  },
  {
    category: 'Services',
    question: 'How long does processing take?',
    answer: 'Processing time varies by service. Most services are completed within 7-15 days. You can track your application status in real-time through our platform and receive SMS/WhatsApp notifications.'
  },
  {
    category: 'Pricing',
    question: 'What are your charges?',
    answer: 'Our pricing is transparent: Government fees + minimal service charges. All charges are displayed upfront before you submit your application. No hidden fees.'
  },
  {
    category: 'Security',
    question: 'Is my data secure?',
    answer: 'Yes! We use bank-level security with 256-bit SSL encryption, ISO 27001 certified infrastructure, and store all data in India-based data centers. We comply with Indian data protection regulations.'
  },
  {
    category: 'Retailer',
    question: 'How can I become a retailer partner?',
    answer: 'Register on our platform, pay the one-time registration fee of ₹499, complete the verification process, and start earning commissions by providing government services in your area.'
  },
  {
    category: 'Retailer',
    question: 'How much commission do retailers earn?',
    answer: 'Retailers earn up to 15% commission on every service. Average monthly earnings range from ₹15,000 to ₹50,000 depending on the number of customers served.'
  }
];

const categories = ['All', 'General', 'Services', 'Pricing', 'Security', 'Retailer'];

export default function FAQ() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredFAQs = selectedCategory === 'All' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Find answers to common questions about our services
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFAQs.map((faq, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-white to-red-50 rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-6 flex items-center justify-between hover:bg-red-50 transition-colors text-left"
              >
                <div className="flex-1">
                  <span className="text-xs font-semibold text-red-600 mb-2 block">
                    {faq.category}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900">
                    {faq.question}
                  </h3>
                </div>
                <div className={`ml-4 transform transition-transform ${openIndex === index ? 'rotate-180' : ''}`}>
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-6 border-t border-gray-200 pt-4 animate-slide-in-up">
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-8 border-2 border-red-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Still have questions?
          </h3>
          <p className="text-gray-600 mb-6">
            Our support team is here to help you 24/7
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:+919876543210"
              className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              📞 Call Us
            </a>
            <a
              href="mailto:vighnahartaonlineservices.india@gmail.com"
              className="border-2 border-red-600 text-red-600 px-8 py-3 rounded-lg hover:bg-red-50 transition-colors font-semibold"
            >
              ✉️ Email Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
