'use client';

import { termsTranslations } from '@/translations/pages';

export default function TermsPageMarathi() {
  const t = termsTranslations.mr;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-bold text-red-900 mb-4">{t.title}</h1>
          <p className="text-xl text-red-700 font-medium mb-2">{t.subtitle}</p>
          <p className="text-gray-600">{t.lastUpdated}: जानेवारी 2025</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 prose prose-lg max-w-none">
          <h2>सेवा अटींची स्वीकृती</h2>
          <p>
            आमच्या सेवांचा वापर करून, तुम्ही या नियम आणि अटींनी बांधील राहण्यास सहमत आहात.
          </p>

          <h2>सेवांचा वापर</h2>
          <p>
            तुम्ही सहमत आहात की:
          </p>
          <ul>
            <li>तुम्ही अचूक आणि संपूर्ण माहिती प्रदान कराल</li>
            <li>तुम्ही तुमच्या खात्याची सुरक्षा राखाल</li>
            <li>तुम्ही सेवांचा गैरवापर करणार नाही</li>
            <li>तुम्ही सर्व लागू कायद्यांचे पालन कराल</li>
          </ul>

          <h2>शुल्क आणि पेमेंट</h2>
          <p>
            सेवा शुल्क आमच्या वेबसाइटवर सूचीबद्ध आहेत. सर्व पेमेंट अंतिम आहेत जोपर्यंत आमच्या परतावा धोरणात अन्यथा नमूद केले नाही.
          </p>

          <h2>दायित्वाची मर्यादा</h2>
          <p>
            आम्ही अप्रत्यक्ष, आकस्मिक किंवा परिणामी नुकसानीसाठी जबाबदार राहणार नाही.
          </p>

          <h2>अटींमध्ये बदल</h2>
          <p>
            आम्ही कोणत्याही वेळी या अटी सुधारण्याचा अधिकार राखून ठेवतो.
          </p>
        </div>
      </div>
    </div>
  );
}
