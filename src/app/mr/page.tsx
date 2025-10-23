import Link from "next/link";
import Logo from "@/components/ui/logo";
import Footer from "@/components/Footer";
import { generateSEO } from "@/lib/seo";

// SEO configuration for Marathi home page
const marathiHomeSEO = {
  title: 'विघ्नहर्ता ऑनलाईन सर्विसेस - सरकारी सेवा पोर्टल भारत | डिजिटल इंडिया',
  description: 'विघ्नहर्ता ऑनलाईन सर्विसेससह सर्व सरकारी सेवांचा ऑनलाईन प्रवेश मिळवा. प्रमाणपत्रे, परवाने आणि सरकारी योजनांसाठी डिजिटल अर्ज करा. भारतात जलद, सुरक्षित आणि विश्वसनीय सरकारी सेवा पोर्टल.',
  keywords: [
    'सरकारी सेवा ऑनलाईन',
    'डिजिटल इंडिया सेवा',
    'ऑनलाईन प्रमाणपत्र अर्ज',
    'सरकारी पोर्टल भारत',
    'विघ्नहर्ता ऑनलाईन सर्विसेस',
    'विघ्नहर्ता ऑनलाईन सेवा',
    'डिजिटल सरकारी सेवा',
    'ऑनलाईन परवाना अर्ज',
    'सरकारी योजना ऑनलाईन',
    'ई-गव्हर्नन्स सेवा',
    'डिजिटल प्रमाणपत्र भारत',
    'ऑनलाईन सरकारी अर्ज',
    'सरकारी सेवा केंद्र',
    'डिजिटल इंडिया पोर्टल',
    'ऑनलाईन सरकारी अर्ज',
    'सरकारी दस्तऐवज सेवा',
    'विघ्नहर्ता सेवा',
    'सरकारी सेवा प्रदाता',
    'डिजिटल सेवा प्रदाता',
    'ऑनलाईन सरकारी सेवा प्रदाता',
    'भारतात सरकारी सेवा'
  ],
  canonical: '/mr',
};

export const metadata = generateSEO(marathiHomeSEO);

export default function MarathiHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <Logo size="md" showText={true} animated={true} />
              <div className="hidden sm:block">
                <span className="text-white/90 text-sm font-medium">
                  ऑनलाईन सेवा पोर्टल
                </span>
                <div className="text-white/70 text-xs">
                  डिजिटल इंडिया पुढाकार
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <nav className="hidden md:flex space-x-6">
                <Link href="/mr/about" className="text-white hover:text-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700/50">
                  आमच्याबद्दल
                </Link>
                <Link href="/mr/services" className="text-white hover:text-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700/50">
                  सेवा
                </Link>
                <Link href="/mr/contact" className="text-white hover:text-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700/50">
                  संपर्क
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-red-800 mb-6">
            <span className="text-orange-600">विघ्नहर्ता</span> मध्ये आपले स्वागत आहे
            <br />
            <span className="text-red-700">ऑनलाईन सर्विसेस</span>
          </h1>
          <h2 className="text-xl md:text-2xl text-red-600 mb-4 max-w-3xl mx-auto">
            भारताचा प्रमुख डिजिटल सरकारी सेवा पोर्टल
          </h2>
          <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-4xl mx-auto">
            <strong>आधार कार्ड</strong>, <strong>पॅन कार्ड</strong>, <strong>पासपोर्ट</strong>, <strong>जन्म प्रमाणपत्र</strong>, <strong>मृत्यू प्रमाणपत्र</strong>, <strong>उत्पन्न प्रमाणपत्र</strong>, <strong>जात प्रमाणपत्र</strong>, आणि <strong>100+ सरकारी सेवा ऑनलाईन</strong> प्रवेश मिळवा. राष्ट्रव्यापी विक्रेता नेटवर्क समर्थनासह जलद, सुरक्षित आणि विश्वसनीय सरकारी सेवा पोर्टल.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/mr/login" className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
              🚀 सुरूवात करा - ऑनलाईन अर्ज करा
            </Link>
            <Link href="/mr/about" className="bg-white hover:bg-red-50 text-red-600 border-2 border-red-600 px-8 py-4 rounded-lg text-lg font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
              📖 सेवांबद्दल अधिक जाणून घ्या
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-red-100">
            <div className="text-3xl mb-3">🏛️</div>
            <h3 className="text-xl font-bold text-red-700 mb-2">100+ सरकारी सेवा ऑनलाईन</h3>
            <p className="text-gray-600">आधार, पॅन, पासपोर्ट, जन्म प्रमाणपत्र, मृत्यू प्रमाणपत्र, उत्पन्न प्रमाणपत्र, जात प्रमाणपत्र आणि सर्व सरकारी योजनांचा डिजिटल प्रवेश मिळवा</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-red-100">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-xl font-bold text-red-700 mb-2">सुरक्षित डिजिटल इंडिया पोर्टल</h3>
            <p className="text-gray-600">SSL एन्क्रिप्शनसह बँक-पातळीची सुरक्षा, वास्तविक-वेळ अर्ज ट्रॅकिंग आणि 24/7 ग्राहक समर्थन</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-red-100">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-xl font-bold text-red-700 mb-2">जलद सरकारी सेवा प्रक्रिया</h3>
            <p className="text-gray-600">वापरकर्ता-मैत्रीपूर्ण इंटरफेस आणि राष्ट्रव्यापी विक्रेता नेटवर्क समर्थनासह जलद दस्तऐवज प्रक्रिया</p>
          </div>
        </div>

        {/* Services Overview */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">आमच्या सेवा</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-4xl mb-3">🆔</div>
              <h3 className="text-lg font-semibold text-red-700 mb-2">ओळख पत्र सेवा</h3>
              <p className="text-gray-600 text-sm">आधार, पॅन, मतदार ओळखपत्र</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-4xl mb-3">✈️</div>
              <h3 className="text-lg font-semibold text-orange-700 mb-2">प्रवास दस्तऐवज</h3>
              <p className="text-gray-600 text-sm">पासपोर्ट, व्हिसा सहाय्य</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-4xl mb-3">📜</div>
              <h3 className="text-lg font-semibold text-yellow-700 mb-2">प्रमाणपत्रे</h3>
              <p className="text-gray-600 text-sm">जन्म, मृत्यू, उत्पन्न, जात</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-4xl mb-3">💰</div>
              <h3 className="text-lg font-semibold text-green-700 mb-2">आर्थिक सेवा</h3>
              <p className="text-gray-600 text-sm">बँक, विमा, कर्ज अर्ज</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl p-8">
          <h2 className="text-3xl font-bold mb-4">आजच सुरूवात करा!</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            आपल्या सरकारी सेवा गरजा पूर्ण करण्यासाठी आमच्याशी जोडा
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/mr/register" className="bg-white text-red-600 px-8 py-4 rounded-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
              🏪 विक्रेता बना
            </Link>
            <Link href="/mr/login" className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
              👤 लॉगिन करा
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}