import Link from "next/link";
import Logo from "@/components/ui/logo";
import Footer from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "सेवा - विघ्नहर्ता ऑनलाईन सर्विसेस | सरकारी सेवा पोर्टल",
  description: "विघ्नहर्ता ऑनलाईन सर्विसेस मार्फत उपलब्ध असलेल्या व्यापक सरकारी सेवा एक्सप्लोर करा ज्यामध्ये आधार, पॅन, पासपोर्ट, प्रमाणपत्र इ. सेवा समाविष्ट आहेत.",
  keywords: "सरकारी सेवा, आधार, पॅन, पासपोर्ट, प्रमाणपत्र, ऑनलाईन सेवा, विघ्नहर्ता ऑनलाईन सर्विसेस",
  openGraph: {
    title: "सरकारी सेवा - विघ्नहर्ता ऑनलाईन सर्विसेस",
    description: "आमच्या सुरक्षित डिजिटल प्लॅटफॉर्म मार्फत सरकारी सेवेंची व्यापक श्रेणी प्राप्त करा.",
    type: "website",
  },
};

const services = [
  {
    category: "ओळख पत्र सेवा",
    icon: "🆔",
    services: [
      { name: "आधार कार्ड", description: "नवीन आधार नोंदणी, अद्यतने आणि सुधारणा", price: "₹50" },
      { name: "पॅन कार्ड", description: "पॅन कार्ड अर्ज आणि सुधारणा", price: "₹107" },
      { name: "मतदार ओळखपत्र", description: "मतदार ओळखपत्र नोंदणी आणि अद्यतने", price: "विनामूल्य" },
    ]
  },
  {
    category: "प्रवास दस्तऐवज",
    icon: "✈️",
    services: [
      { name: "पासपोर्ट", description: "नवीन पासपोर्ट आणि नूतनीकरण अर्ज", price: "₹1,500" },
      { name: "व्हिसा सहाय्य", description: "व्हिसा अर्ज समर्थन आणि मार्गदर्शन", price: "₹500" },
    ]
  },
  {
    category: "प्रमाणपत्रे",
    icon: "📜",
    services: [
      { name: "जन्म प्रमाणपत्र", description: "जन्म प्रमाणपत्र अर्ज", price: "₹25" },
      { name: "मृत्यू प्रमाणपत्र", description: "मृत्यू प्रमाणपत्र अर्ज", price: "₹25" },
      { name: "उत्पन्न प्रमाणपत्र", description: "अधिकाऱ्यांकडून उत्पन्न प्रमाणपत्र", price: "₹30" },
      { name: "जात प्रमाणपत्र", description: "जात प्रमाणपत्र अर्ज", price: "₹30" },
    ]
  },
  {
    category: "आर्थिक सेवा",
    icon: "💰",
    services: [
      { name: "बँक खाते उघडणे", description: "बँक खाते उघडण्यासाठी सहाय्य", price: "₹100" },
      { name: "विमा सेवा", description: "जीवन आणि आरोग्य विमा अर्ज", price: "₹200" },
      { name: "कर्ज अर्ज", description: "सरकारी कर्ज योजना अर्ज", price: "₹300" },
    ]
  },
  {
    category: "उपयुक्तता सेवा",
    icon: "⚡",
    services: [
      { name: "वीज जोडणी", description: "नवीन वीज जोडणी अर्ज", price: "₹150" },
      { name: "गॅस जोडणी", description: "एलपीजी गॅस जोडणी अर्ज", price: "₹100" },
      { name: "पाणी जोडणी", description: "महापालिका पाणी जोडणी", price: "₹100" },
    ]
  },
  {
    category: "शिक्षण सेवा",
    icon: "🎓",
    services: [
      { name: "शिष्यवृत्ती अर्ज", description: "सरकारी शिष्यवृत्ती अर्ज", price: "₹50" },
      { name: "शैक्षणिक प्रमाणपत्रे", description: "शैक्षणिक दस्तऐवज सत्यापन", price: "₹75" },
    ]
  }
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center">
              <Logo size="lg" showText={true} animated={true} />
              <span className="ml-4 text-sm text-red-100">
                सरकारी सेवा पोर्टल
              </span>
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-red-100 hover:text-white transition-colors">
                मुख्यपृष्ठ
              </Link>
              <Link href="/about" className="text-red-100 hover:text-white transition-colors">
                आमच्याबद्दल
              </Link>
              <Link href="/services" className="text-white font-semibold">
                सेवा
              </Link>
              <Link href="/contact" className="text-red-100 hover:text-white transition-colors">
                संपर्क
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 animate-fade-in marathi-text">
            आमच्या सेवा
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-slide-in-up marathi-text">
            आमच्या सुरक्षित डिजिटल प्लॅटफॉर्म मार्फत सरकारी सेवेंची व्यापक श्रेणी प्राप्त करा. 
            जलद, विश्वसनीय आणि आपल्या जवळच्या विक्रेत्याकडे उपलब्ध.
          </p>
        </div>

        {/* Service Categories */}
        <div className="space-y-12">
          {services.map((category, index) => (
            <div key={category.category} className="bg-white rounded-xl shadow-lg p-8 hover-lift">
              <div className="flex items-center mb-6">
                <div className="text-4xl mr-4">{category.icon}</div>
                <h2 className="text-3xl font-bold text-gray-900 marathi-text">{category.category}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.services.map((service, serviceIndex) => (
                  <div key={service.name} className="border border-gray-200 rounded-lg p-6 hover:border-red-500 transition-colors hover:shadow-md">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 marathi-text">{service.name}</h3>
                    <p className="text-gray-600 mb-4 marathi-text">{service.description}</p>
                    <div className="flex justify-center">
                      <Link
                        href="/register"
                        className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        सुरूवात करा
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-16 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl p-8">
          <h2 className="text-3xl font-bold mb-8 text-center marathi-text">आमच्या सेवा निवडण्याची कारणे?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2 marathi-text">जलद प्रक्रिया</h3>
              <p className="text-red-100 marathi-text">सर्व अर्जांसाठी जलद प्रतिसाद वेळा</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2 marathi-text">सुरक्षित आणि सुरक्षित</h3>
              <p className="text-red-100 marathi-text">आपले दस्तऐवज आणि डेटा पूर्णपणे सुरक्षित आहेत</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-2 marathi-text">वास्तविक-वेळ ट्रॅकिंग</h3>
              <p className="text-red-100 marathi-text">कोणत्याही वेळी आपली अर्ज स्थिती ट्रॅक करा</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2 marathi-text">तज्ज्ञ समर्थन</h3>
              <p className="text-red-100 marathi-text">आमच्या प्रशिक्षित तज्ज्ञांकडून मदत मिळवा</p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center marathi-text">हे कसे काम करते?</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 marathi-text">विक्रेता भेट द्या</h3>
              <p className="text-gray-600 marathi-text">आपला जवळचा विघ्नहर्ता ऑनलाईन सर्विस विक्रेता शोधा</p>
            </div>
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 marathi-text">दस्तऐवज सादर करा</h3>
              <p className="text-gray-600 marathi-text">आवश्यक दस्तऐवज आणि माहिती प्रदान करा</p>
            </div>
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 marathi-text">प्रगती ट्रॅक करा</h3>
              <p className="text-gray-600 marathi-text">वास्तविक-वेळ अर्ज स्थिती निरीक्षण करा</p>
            </div>
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">4</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 marathi-text">सेवा प्राप्त करा</h3>
              <p className="text-gray-600 marathi-text">आपले दस्तऐवज वितरित करा किंवा घ्या</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 marathi-text">सुरूवात करण्यासाठी तयार?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto marathi-text">
            त्यांच्या सरकारी सेवा गरजा पूर्ण करण्यासाठी आमच्यावर विश्वास ठेवणारे हजारो समाधानकारक ग्राहक जोडा.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-red-600 text-white px-8 py-4 rounded-lg hover:bg-red-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🏪 विक्रेता शोधा
            </Link>
            <Link
              href="/contact"
              className="border-2 border-red-600 text-red-600 px-8 py-4 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              📞 आमच्याशी संपर्क साधा
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}