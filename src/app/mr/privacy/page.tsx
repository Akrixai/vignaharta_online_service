'use client';

import { privacyTranslations } from '@/translations/pages';

export default function PrivacyPageMarathi() {
  const t = privacyTranslations.mr;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-bold text-red-900 mb-4">{t.title}</h1>
          <p className="text-xl text-red-700 font-medium mb-2">{t.subtitle}</p>
          <p className="text-gray-600">{t.lastUpdated}: जानेवारी 2025</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 prose prose-lg max-w-none">
          <h2>परिचय</h2>
          <p>
            विघ्नहर्ता ऑनलाईन सर्विसेस मध्ये, आम्ही तुमच्या गोपनीयतेचे संरक्षण करण्यासाठी वचनबद्ध आहोत. हे गोपनीयता धोरण आम्ही तुमची वैयक्तिक माहिती कशी गोळा करतो, वापरतो आणि संरक्षित करतो ते स्पष्ट करते.
          </p>

          <h2>आम्ही जी माहिती गोळा करतो</h2>
          <p>
            आम्ही खालील प्रकारची माहिती गोळा करू शकतो:
          </p>
          <ul>
            <li>वैयक्तिक ओळख माहिती (नाव, ईमेल, फोन नंबर)</li>
            <li>सरकारी दस्तऐवज माहिती</li>
            <li>व्यवहार तपशील</li>
            <li>वापर डेटा आणि कुकीज</li>
          </ul>

          <h2>आम्ही तुमची माहिती कशी वापरतो</h2>
          <p>
            तुमची माहिती खालीलसाठी वापरली जाते:
          </p>
          <ul>
            <li>सेवा प्रदान करणे आणि व्यवस्थापित करणे</li>
            <li>तुमच्या विनंत्या प्रक्रिया करणे</li>
            <li>तुमच्याशी संवाद साधणे</li>
            <li>आमच्या सेवांमध्ये सुधारणा करणे</li>
          </ul>

          <h2>डेटा सुरक्षा</h2>
          <p>
            आम्ही तुमची वैयक्तिक माहिती संरक्षित करण्यासाठी उद्योग-मानक सुरक्षा उपायांचा वापर करतो.
          </p>

          <h2>संपर्क साधा</h2>
          <p>
            या गोपनीयता धोरणाबद्दल तुम्हाला काही प्रश्न असल्यास, कृपया आमच्याशी संपर्क साधा.
          </p>
        </div>
      </div>
    </div>
  );
}
