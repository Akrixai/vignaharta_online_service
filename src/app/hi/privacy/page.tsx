'use client';

import { privacyTranslations } from '@/translations/pages';

export default function PrivacyPageHindi() {
  const t = privacyTranslations.hi;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-bold text-red-900 mb-4">{t.title}</h1>
          <p className="text-xl text-red-700 font-medium mb-2">{t.subtitle}</p>
          <p className="text-gray-600">{t.lastUpdated}: जनवरी 2025</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 prose prose-lg max-w-none">
          <h2>परिचय</h2>
          <p>
            विघ्नहर्ता ऑनलाइन सेवाएं में, हम आपकी गोपनीयता की रक्षा के लिए प्रतिबद्ध हैं। यह गोपनीयता नीति बताती है कि हम आपकी व्यक्तिगत जानकारी कैसे एकत्र, उपयोग और सुरक्षित करते हैं।
          </p>

          <h2>हम जो जानकारी एकत्र करते हैं</h2>
          <p>
            हम निम्नलिखित प्रकार की जानकारी एकत्र कर सकते हैं:
          </p>
          <ul>
            <li>व्यक्तिगत पहचान जानकारी (नाम, ईमेल, फोन नंबर)</li>
            <li>सरकारी दस्तावेज़ जानकारी</li>
            <li>लेनदेन विवरण</li>
            <li>उपयोग डेटा और कुकीज़</li>
          </ul>

          <h2>हम आपकी जानकारी का उपयोग कैसे करते हैं</h2>
          <p>
            आपकी जानकारी का उपयोग निम्नलिखित के लिए किया जाता है:
          </p>
          <ul>
            <li>सेवाएं प्रदान करना और प्रबंधित करना</li>
            <li>आपके अनुरोधों को संसाधित करना</li>
            <li>आपके साथ संवाद करना</li>
            <li>हमारी सेवाओं में सुधार करना</li>
          </ul>

          <h2>डेटा सुरक्षा</h2>
          <p>
            हम आपकी व्यक्तिगत जानकारी की सुरक्षा के लिए उद्योग-मानक सुरक्षा उपायों का उपयोग करते हैं।
          </p>

          <h2>संपर्क करें</h2>
          <p>
            यदि आपके पास इस गोपनीयता नीति के बारे में कोई प्रश्न हैं, तो कृपया हमसे संपर्क करें।
          </p>
        </div>
      </div>
    </div>
  );
}
