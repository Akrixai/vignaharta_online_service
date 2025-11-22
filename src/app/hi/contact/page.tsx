'use client';

import { contactTranslations } from '@/translations/pages';
import { useState } from 'react';

export default function ContactPageHindi() {
  const t = contactTranslations.hi;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl font-bold text-red-900 mb-4">{t.title}</h1>
          <p className="text-2xl text-red-700 font-medium">{t.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold text-red-900 mb-6">{t.getInTouch}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">{t.name}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">{t.email}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">{t.phone}</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">{t.message}</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold text-lg transition-colors duration-200"
              >
                {t.submit}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold text-red-900 mb-6">{t.contactInfo}</h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <span className="text-3xl">📍</span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">{t.address}</h3>
                  <p className="text-gray-600">विघ्नहर्ता ऑनलाइन सेवाएं<br />भारत</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <span className="text-3xl">📞</span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">{t.phone}</h3>
                  <p className="text-gray-600">+91 XXXXXXXXXX</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <span className="text-3xl">✉️</span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">{t.email}</h3>
                  <p className="text-gray-600">info@vighnahartaonlineservice.in</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
