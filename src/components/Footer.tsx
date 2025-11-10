import Link from 'next/link';
import Logo from '@/components/ui/logo';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 text-white py-16 mt-16 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full animate-float"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-white rounded-full animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white rounded-full animate-float" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          {/* Logo Section */}
          <div className="mb-8 animate-fade-in">
            <Logo size="lg" showText={true} animated={true} className="justify-center" />
          </div>
          
          {/* Main Description */}
          <p className="text-white mb-8 text-xl font-medium max-w-3xl mx-auto leading-relaxed animate-slide-in-left">
            🌟 Empowering citizens with digital government services through our retailer network 🌟
          </p>
          
          {/* Links Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12 animate-slide-in-right">
            {/* Quick Links */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105">
              <h4 className="text-xl font-bold mb-4 text-white flex items-center justify-center">
                🔗 Quick Links
              </h4>
              <div className="space-y-3">
                <Link href="/about" className="block text-white hover:text-yellow-300 transition-colors duration-300 font-medium hover:scale-105 transform">
                  📖 About Us
                </Link>
                <Link href="/services" className="block text-white hover:text-yellow-300 transition-colors duration-300 font-medium hover:scale-105 transform">
                  🛠️ Services
                </Link>
                <Link href="/register" className="block text-white hover:text-yellow-300 transition-colors duration-300 font-medium hover:scale-105 transform">
                  🏪 Become a Retailer
                </Link>
              </div>
            </div>
            
            {/* Support */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105">
              <h4 className="text-xl font-bold mb-4 text-white flex items-center justify-center">
                🆘 Support
              </h4>
              <div className="space-y-3">
                <Link href="/contact" className="block text-white hover:text-yellow-300 transition-colors duration-300 font-medium hover:scale-105 transform">
                  📞 Contact Us
                </Link>
                <Link href="/register" className="block text-white hover:text-yellow-300 transition-colors duration-300 font-medium hover:scale-105 transform">
                  💼 Career
                </Link>
                <Link href="/faq" className="block text-white hover:text-yellow-300 transition-colors duration-300 font-medium hover:scale-105 transform">
                  💬 FAQ
                </Link>
              </div>
            </div>
            
            {/* Legal */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105">
              <h4 className="text-xl font-bold mb-4 text-white flex items-center justify-center">
                ⚖️ Legal
              </h4>
              <div className="space-y-3">
                <Link href="/privacy" className="block text-white hover:text-yellow-300 transition-colors duration-300 font-medium hover:scale-105 transform">
                  🔒 Privacy Policy
                </Link>
                <Link href="/terms" className="block text-white hover:text-yellow-300 transition-colors duration-300 font-medium hover:scale-105 transform">
                  📋 Terms of Service
                </Link>
                <Link href="/refund-policy" className="block text-white hover:text-yellow-300 transition-colors duration-300 font-medium hover:scale-105 transform">
                  💰 Refund Policy
                </Link>
              </div>
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="border-t border-white/20 pt-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-white font-medium text-lg">
                © 2025 विघ्नहर्ता ऑनलाईन सर्विसेस. All rights reserved.
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center space-x-1 sm:space-x-2 animate-pulse">
                <span className="text-pink-400 text-sm sm:text-lg animate-bounce hidden xs:inline-block">💖</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 font-semibold text-xs sm:text-sm hidden sm:inline-block">
                  Developed with ❤️ by
                </span>
                <a
                  href="https://akrixsolutions.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 font-bold text-xs sm:text-sm hover:from-pink-500 hover:via-purple-500 hover:to-blue-500 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  <span className="hidden sm:inline">Akrix Solutions</span>
                  <span className="sm:hidden">Akrix</span>
                </a>
                <span className="text-pink-400 text-sm sm:text-lg animate-bounce hidden xs:inline-block">💖</span>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
