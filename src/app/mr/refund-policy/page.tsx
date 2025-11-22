'use client';

import { refundTranslations } from '@/translations/pages';

export default function RefundPageMarathi() {
  const t = refundTranslations.mr;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-bold text-red-900 mb-4">{t.title}</h1>
          <p className="text-xl text-red-700 font-medium mb-2">{t.subtitle}</p>
          <p className="text-gray-600">{t.lastUpdated}: जानेवारी 2025</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 prose prose-lg max-w-none">
          <h2>परतावा धोरण</h2>
          <p>
            विघ्नहर्ता ऑनलाईन सर्विसेस मध्ये, आम्ही ग्राहक समाधानासाठी वचनबद्ध आहोत. हे धोरण आमची परतावा आणि रद्द करण्याची प्रक्रिया स्पष्ट करते.
          </p>

          <h2>परतावा पात्रता</h2>
          <p>
            खालील परिस्थितींमध्ये परताव्यासाठी पात्र असू शकता:
          </p>
          <ul>
            <li>सेवा प्रदान केली नाही</li>
            <li>तांत्रिक त्रुटी ज्या सेवा वितरण रोखतात</li>
            <li>डुप्लिकेट पेमेंट</li>
            <li>सेवा रद्द करणे (अटींच्या अधीन)</li>
          </ul>

          <h2>परतावा प्रक्रिया</h2>
          <p>
            परतावा विनंती करण्यासाठी:
          </p>
          <ol>
            <li>पेमेंटच्या 7 दिवसांच्या आत आमच्याशी संपर्क साधा</li>
            <li>व्यवहार तपशील प्रदान करा</li>
            <li>परताव्याचे कारण सांगा</li>
          </ol>

          <h2>परतावा वेळापत्रक</h2>
          <p>
            मंजूर परतावे 7-14 कामकाजाच्या दिवसांत प्रक्रिया केले जातील.
          </p>

          <h2>परतावा न करता येणाऱ्या सेवा</h2>
          <p>
            काही सेवा परताव्यासाठी पात्र असू शकत नाहीत जर त्या आधीच सरकारी एजन्सींना सबमिट केल्या गेल्या असतील.
          </p>

          <h2>संपर्क साधा</h2>
          <p>
            परताव्याबद्दल प्रश्नांसाठी, कृपया आमच्या समर्थन टीमशी संपर्क साधा.
          </p>
        </div>
      </div>
    </div>
  );
}
