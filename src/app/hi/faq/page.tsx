'use client';

import { faqTranslations } from '@/translations/pages';
import { useState } from 'react';

export default function FAQPageHindi() {
  const t = faqTranslations.hi;
  const [searchTerm, setSearchTerm] = useState('');

  const faqs = [
    {
      question: 'विघ्नहर्ता ऑनलाइन सेवाएं क्या है?',
      answer: 'विघ्नहर्ता ऑनलाइन सेवाएं एक डिजिटल प्लेटफॉर्म है जो रिटेलर नेटवर्क के माध्यम से विभिन्न सरकारी सेवाएं प्रदान करता है।',
    },
    {
      question: 'मैं सेवाओं के लिए कैसे आवेदन कर सकता हूं?',
      answer: 'आप हमारी वेबसाइट पर पंजीकरण करके या अपने नजदीकी रिटेलर से संपर्क करके सेवाओं के लिए आवेदन कर सकते हैं।',
    },
    {
      question: 'कौन सी सेवाएं उपलब्ध हैं?',
      answer: 'हम आधार, पैन कार्ड, पासपोर्ट, विभिन्न प्रमाणपत्र और अन्य सरकारी सेवाएं प्रदान करते हैं।',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl font-bold text-red-900 mb-4">{t.title}</h1>
          <p className="text-2xl text-red-700 font-medium mb-8">{t.subtitle}</p>
          
          <div className="max-w-2xl mx-auto">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-4 border-2 border-red-300 rounded-full focus:border-red-500 focus:outline-none text-lg"
            />
          </div>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-shadow duration-300"
            >
              <h3 className="text-xl font-bold text-red-900 mb-3">{faq.question}</h3>
              <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
