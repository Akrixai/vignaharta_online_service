'use client';

import { termsTranslations } from '@/translations/pages';

export default function TermsPageHindi() {
  const t = termsTranslations.hi;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-bold text-red-900 mb-4">{t.title}</h1>
          <p className="text-xl text-red-700 font-medium mb-2">{t.subtitle}</p>
          <p className="text-gray-600">{t.lastUpdated}: जनवरी 2025</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 prose prose-lg max-w-none">
          <h2>सेवा की शर्तों की स्वीकृति</h2>
          <p>
            हमारी सेवाओं का उपयोग करके, आप इन नियमों और शर्तों से बंधे होने के लिए सहमत हैं।
          </p>

          <h2>सेवाओं का उपयोग</h2>
          <p>
            आप सहमत हैं कि:
          </p>
          <ul>
            <li>आप सटीक और पूर्ण जानकारी प्रदान करेंगे</li>
            <li>आप अपने खाते की सुरक्षा बनाए रखेंगे</li>
            <li>आप सेवाओं का दुरुपयोग नहीं करेंगे</li>
            <li>आप सभी लागू कानूनों का पालन करेंगे</li>
          </ul>

          <h2>शुल्क और भुगतान</h2>
          <p>
            सेवा शुल्क हमारी वेबसाइट पर सूचीबद्ध हैं। सभी भुगतान अंतिम हैं जब तक कि हमारी रिफंड नीति में अन्यथा न कहा गया हो।
          </p>

          <h2>दायित्व की सीमा</h2>
          <p>
            हम अप्रत्यक्ष, आकस्मिक, या परिणामी क्षतियों के लिए उत्तरदायी नहीं होंगे।
          </p>

          <h2>नियमों में परिवर्तन</h2>
          <p>
            हम किसी भी समय इन नियमों को संशोधित करने का अधिकार सुरक्षित रखते हैं।
          </p>
        </div>
      </div>
    </div>
  );
}
