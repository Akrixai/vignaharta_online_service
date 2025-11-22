'use client';

import { faqTranslations } from '@/translations/pages';
import { useState } from 'react';

export default function FAQPageMarathi() {
  const t = faqTranslations.mr;
  const [searchTerm, setSearchTerm] = useState('');

  const faqs = [
    {
      question: 'विघ्नहर्ता ऑनलाईन सर्विसेस म्हणजे काय?',
      answer: 'विघ्नहर्ता ऑनलाईन सर्विसेस हे एक डिजिटल प्लॅटफॉर्म आहे जे रिटेलर नेटवर्कद्वारे विविध सरकारी सेवा प्रदान करते.',
    },
    {
      question: 'मी सेवांसाठी कसा अर्ज करू शकतो?',
      answer: 'तुम्ही आमच्या वेबसाइटवर नोंदणी करून किंवा तुमच्या जवळच्या रिटेलरशी संपर्क साधून सेवांसाठी अर्ज करू शकता.',
    },
    {
      question: 'कोणत्या सेवा उपलब्ध आहेत?',
      answer: 'आम्ही आधार, पॅन कार्ड, पासपोर्ट, विविध प्रमाणपत्रे आणि इतर सरकारी सेवा प्रदान करतो.',
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
