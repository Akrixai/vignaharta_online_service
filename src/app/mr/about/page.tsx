'use client';

import { aboutTranslations } from '@/translations/pages';

export default function AboutPageMarathi() {
  const t = aboutTranslations.mr;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl font-bold text-red-900 mb-4">{t.title}</h1>
          <p className="text-2xl text-red-700 font-medium">{t.subtitle}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 mb-12 animate-slide-in-left">
          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            {t.description}
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="bg-gradient-to-br from-red-100 to-orange-100 rounded-xl p-6 hover:scale-105 transition-transform duration-300">
              <h3 className="text-2xl font-bold text-red-900 mb-4">🎯 {t.mission}</h3>
              <p className="text-gray-700">{t.missionText}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-xl p-6 hover:scale-105 transition-transform duration-300">
              <h3 className="text-2xl font-bold text-red-900 mb-4">👁️ {t.vision}</h3>
              <p className="text-gray-700">{t.visionText}</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-100 to-red-100 rounded-xl p-6 hover:scale-105 transition-transform duration-300">
              <h3 className="text-2xl font-bold text-red-900 mb-4">💎 {t.values}</h3>
              <p className="text-gray-700">{t.valuesText}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
