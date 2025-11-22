'use client';

import { refundTranslations } from '@/translations/pages';

export default function RefundPageHindi() {
  const t = refundTranslations.hi;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-bold text-red-900 mb-4">{t.title}</h1>
          <p className="text-xl text-red-700 font-medium mb-2">{t.subtitle}</p>
          <p className="text-gray-600">{t.lastUpdated}: जनवरी 2025</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 prose prose-lg max-w-none">
          <h2>रिफंड नीति</h2>
          <p>
            विघ्नहर्ता ऑनलाइन सेवाएं में, हम ग्राहक संतुष्टि के लिए प्रतिबद्ध हैं। यह नीति हमारी रिफंड और रद्दीकरण प्रक्रिया की रूपरेखा देती है।
          </p>

          <h2>रिफंड पात्रता</h2>
          <p>
            निम्नलिखित परिस्थितियों में रिफंड के लिए पात्र हो सकते हैं:
          </p>
          <ul>
            <li>सेवा प्रदान नहीं की गई</li>
            <li>तकनीकी त्रुटियां जो सेवा वितरण को रोकती हैं</li>
            <li>डुप्लिकेट भुगतान</li>
            <li>सेवा रद्दीकरण (शर्तों के अधीन)</li>
          </ul>

          <h2>रिफंड प्रक्रिया</h2>
          <p>
            रिफंड का अनुरोध करने के लिए:
          </p>
          <ol>
            <li>भुगतान के 7 दिनों के भीतर हमसे संपर्क करें</li>
            <li>लेनदेन विवरण प्रदान करें</li>
            <li>रिफंड का कारण बताएं</li>
          </ol>

          <h2>रिफंड समयरेखा</h2>
          <p>
            स्वीकृत रिफंड 7-14 कार्य दिवसों में संसाधित किए जाएंगे।
          </p>

          <h2>गैर-रिफंड योग्य सेवाएं</h2>
          <p>
            कुछ सेवाएं रिफंड के लिए पात्र नहीं हो सकती हैं यदि वे पहले ही सरकारी एजेंसियों को प्रस्तुत की जा चुकी हैं।
          </p>

          <h2>संपर्क करें</h2>
          <p>
            रिफंड के बारे में प्रश्नों के लिए, कृपया हमारी सहायता टीम से संपर्क करें।
          </p>
        </div>
      </div>
    </div>
  );
}
