import Link from "next/link";

export default function HindiHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-red-800 mb-6">
              <span className="text-orange-600">विघ्नहर्ता</span> में आपका स्वागत है
              <br />
              <span className="text-red-700">ऑनलाइन सेवाएं</span>
            </h1>
            <h2 className="text-xl md:text-2xl text-red-600 mb-4 max-w-3xl mx-auto">
              भारत का प्रमुख डिजिटल सरकारी सेवा पोर्टल
            </h2>
            <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-4xl mx-auto">
              <strong>आधार कार्ड</strong>, <strong>पैन कार्ड</strong>, <strong>पासपोर्ट</strong>, <strong>जन्म प्रमाणपत्र</strong>, <strong>मृत्यु प्रमाणपत्र</strong>, <strong>आय प्रमाणपत्र</strong>, <strong>जाति प्रमाणपत्र</strong>, और <strong>100+ सरकारी सेवाओं</strong> तक ऑनलाइन पहुंच प्राप्त करें। राष्ट्रव्यापी रिटेलर नेटवर्क समर्थन के साथ तेज़, सुरक्षित और विश्वसनीय सरकारी सेवा पोर्टल।
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/login" className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                🚀 शुरू करें - ऑनलाइन आवेदन करें
              </Link>
              <Link href="/hi/about" className="bg-white hover:bg-red-50 text-red-600 border-2 border-red-600 px-8 py-4 rounded-lg text-lg font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                📖 सेवाओं के बारे में और जानें
              </Link>
            </div>
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-red-100">
              <div className="text-3xl mb-3">🏛️</div>
              <h3 className="text-xl font-bold text-red-700 mb-2">100+ सरकारी सेवाएं ऑनलाइन</h3>
              <p className="text-gray-600">आधार, पैन, पासपोर्ट, जन्म प्रमाणपत्र, मृत्यु प्रमाणपत्र, आय प्रमाणपत्र, जाति प्रमाणपत्र और सभी सरकारी योजनाओं तक डिजिटल पहुंच प्राप्त करें</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-red-100">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="text-xl font-bold text-red-700 mb-2">सुरक्षित डिजिटल इंडिया पोर्टल</h3>
              <p className="text-gray-600">SSL एन्क्रिप्शन के साथ बैंक-स्तरीय सुरक्षा, रीयल-टाइम आवेदन ट्रैकिंग और 24/7 ग्राहक सहायता</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-red-100">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-xl font-bold text-red-700 mb-2">तेज़ सरकारी सेवा प्रक्रिया</h3>
              <p className="text-gray-600">उपयोगकर्ता-अनुकूल इंटरफेस और राष्ट्रव्यापी रिटेलर नेटवर्क समर्थन के साथ तेज़ दस्तावेज़ प्रसंस्करण</p>
            </div>
          </div>

          {/* Services Overview */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">हमारी सेवाएं</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-4xl mb-3">🆔</div>
                <h3 className="text-lg font-semibold text-red-700 mb-2">पहचान पत्र सेवाएं</h3>
                <p className="text-gray-600 text-sm">आधार, पैन, मतदाता पहचान पत्र</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-4xl mb-3">✈️</div>
                <h3 className="text-lg font-semibold text-orange-700 mb-2">यात्रा दस्तावेज़</h3>
                <p className="text-gray-600 text-sm">पासपोर्ट, वीज़ा सहायता</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-4xl mb-3">📜</div>
                <h3 className="text-lg font-semibold text-yellow-700 mb-2">प्रमाणपत्र</h3>
                <p className="text-gray-600 text-sm">जन्म, मृत्यु, आय, जाति</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-4xl mb-3">💰</div>
                <h3 className="text-lg font-semibold text-green-700 mb-2">वित्तीय सेवाएं</h3>
                <p className="text-gray-600 text-sm">बैंक, बीमा, ऋण आवेदन</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl p-8">
            <h2 className="text-3xl font-bold mb-4">आज ही शुरू करें!</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              अपनी सरकारी सेवा आवश्यकताओं को पूरा करने के लिए हमसे जुड़ें
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="bg-white text-black hover:text-red-600 px-8 py-4 rounded-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                🏪 रिटेलर बनें
              </Link>
              <Link href="/login" className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                👤 लॉगिन करें
              </Link>
            </div>
          </div>
        </main>
    </div>
  );
}
