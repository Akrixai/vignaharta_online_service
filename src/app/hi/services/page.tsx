'use client';

import { servicesTranslations } from '@/translations/pages';
import Link from 'next/link';

export default function ServicesPageHindi() {
  const t = servicesTranslations.hi;

  const services = [
    { name: 'आधार कार्ड', icon: '🆔', description: 'आधार कार्ड सेवाएं' },
    { name: 'पैन कार्ड', icon: '💳', description: 'पैन कार्ड आवेदन और अपडेट' },
    { name: 'पासपोर्ट', icon: '🛂', description: 'पासपोर्ट सेवाएं' },
    { name: 'जन्म प्रमाणपत्र', icon: '👶', description: 'जन्म प्रमाणपत्र' },
    { name: 'आय प्रमाणपत्र', icon: '💰', description: 'आय प्रमाणपत्र' },
    { name: 'जाति प्रमाणपत्र', icon: '📋', description: 'जाति प्रमाणपत्र' },
    { name: 'मतदाता पहचान पत्र', icon: '🗳️', description: 'मतदाता पहचान पत्र' },
    { name: 'बैंक खाता', icon: '🏦', description: 'बैंक खाता सेवाएं' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl font-bold text-red-900 mb-4">{t.title}</h1>
          <p className="text-2xl text-red-700 font-medium mb-4">{t.subtitle}</p>
          <p className="text-lg text-gray-600">{t.description}</p>
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold text-red-900 mb-8 text-center">{t.availableServices}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-red-100"
              >
                <div className="text-5xl mb-4 text-center">{service.icon}</div>
                <h3 className="text-xl font-bold text-red-900 mb-2 text-center">{service.name}</h3>
                <p className="text-gray-600 text-center mb-4">{service.description}</p>
                <Link
                  href="/register"
                  className="block w-full bg-red-600 hover:bg-red-700 text-white text-center py-2 rounded-lg font-semibold transition-colors duration-200"
                >
                  {t.applyNow}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
