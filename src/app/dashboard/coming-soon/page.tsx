'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

const services = [
    { name: 'MOBILE RECHARGE', icon: '📱', color: 'from-blue-500 to-blue-700', description: 'Instant mobile recharge for all operators' },
    { name: 'ELECTRICITY PAYMENT', icon: '⚡', color: 'from-yellow-500 to-orange-600', description: 'Pay your electricity bills hassle-free' },
    { name: 'DTH RECHARGE', icon: '📺', color: 'from-purple-500 to-purple-700', description: 'Recharge your DTH connection instantly' },
    { name: 'CIBIL REPORT', icon: '📊', color: 'from-green-500 to-green-700', description: 'Get your credit score and detailed report' },
    { name: 'MONEY TRANSFER', icon: '💸', color: 'from-pink-500 to-pink-700', description: 'Transfer money securely and instantly' },
    { name: 'AEPS CASH WITHDRAWAL', icon: '🏧', color: 'from-indigo-500 to-indigo-700', description: 'Withdraw cash using Aadhaar' },
    { name: 'AADHAR PAY', icon: '💳', color: 'from-red-500 to-red-700', description: 'Make payments using Aadhaar authentication' },
    { name: 'PAN CARD', icon: '🆔', color: 'from-teal-500 to-teal-700', description: 'Apply for new or update PAN card' },
    { name: 'BUS TICKET', icon: '🚌', color: 'from-orange-500 to-orange-700', description: 'Book bus tickets across India' },
    { name: 'FLIGHT TICKET', icon: '✈️', color: 'from-sky-500 to-sky-700', description: 'Book domestic and international flights' },
    { name: 'TRAIN TICKET', icon: '🚂', color: 'from-emerald-500 to-emerald-700', description: 'Book train tickets with ease' },
    { name: 'HOTEL BOOKING', icon: '🏨', color: 'from-violet-500 to-violet-700', description: 'Book hotels at best prices' },
    { name: 'LOAN REPAYMENT', icon: '🏦', color: 'from-cyan-500 to-cyan-700', description: 'Pay your loan EMIs instantly' },
    { name: 'CASH DEPOSIT', icon: '💰', color: 'from-amber-500 to-amber-700', description: 'Deposit cash to bank accounts' },
];

export default function ComingSoonPage() {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <DashboardLayout>
            <div className="min-h-screen relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
                    <div className="absolute inset-0 opacity-30">
                        <div className="absolute top-0 left-0 w-96 h-96 bg-red-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
                        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
                        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
                    </div>
                </div>

                {/* Content */}
                <div className="relative z-10 space-y-8">
                    {/* Header Section */}
                    <div className="text-center space-y-6 py-12">
                        <motion.div
                            initial={{ opacity: 0, y: -50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="space-y-4"
                        >
                            <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent animate-gradient">
                                COMING SOON
                            </h1>
                            <div className="flex items-center justify-center space-x-4">
                                <div className="h-1 w-24 bg-gradient-to-r from-red-500 to-transparent rounded-full"></div>
                                <span className="text-4xl animate-pulse">🚀</span>
                                <div className="h-1 w-24 bg-gradient-to-l from-yellow-500 to-transparent rounded-full"></div>
                            </div>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="text-2xl md:text-3xl font-bold text-gray-700 max-w-4xl mx-auto leading-relaxed"
                        >
                            Exciting New Services Are On The Way!
                        </motion.p>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto"
                        >
                            We're working hard to bring you the most comprehensive suite of digital services.
                            Get ready for a revolutionary experience! 🎉
                        </motion.p>
                    </div>

                    {/* Services Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4">
                        {services.map((service, index) => (
                            <motion.div
                                key={service.name}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05, duration: 0.5 }}
                                onHoverStart={() => setHoveredIndex(index)}
                                onHoverEnd={() => setHoveredIndex(null)}
                                className="group"
                            >
                                <Card className={`
                  relative overflow-hidden h-full
                  bg-white shadow-xl hover:shadow-2xl
                  transform transition-all duration-500
                  ${hoveredIndex === index ? 'scale-105 -rotate-1' : 'scale-100 rotate-0'}
                  border-2 border-transparent hover:border-white
                  cursor-pointer
                `}>
                                    {/* Gradient Background */}
                                    <div className={`
                    absolute inset-0 bg-gradient-to-br ${service.color}
                    opacity-90 group-hover:opacity-100 transition-opacity duration-500
                  `}></div>

                                    {/* Animated Circles */}
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

                                    <CardContent className="relative z-10 p-6 flex flex-col items-center justify-center text-center space-y-4 h-full min-h-[200px]">
                                        {/* Icon */}
                                        <motion.div
                                            animate={{
                                                scale: hoveredIndex === index ? [1, 1.2, 1] : 1,
                                                rotate: hoveredIndex === index ? [0, 10, -10, 0] : 0,
                                            }}
                                            transition={{ duration: 0.5 }}
                                            className="text-7xl filter drop-shadow-2xl"
                                        >
                                            {service.icon}
                                        </motion.div>

                                        {/* Service Name */}
                                        <h3 className="text-xl font-black text-white tracking-wide drop-shadow-lg">
                                            {service.name}
                                        </h3>

                                        {/* Description */}
                                        <p className="text-sm text-white/90 font-medium leading-relaxed">
                                            {service.description}
                                        </p>

                                        {/* Coming Soon Badge */}
                                        <div className="mt-auto">
                                            <span className="inline-block bg-white/30 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-full border-2 border-white/50 shadow-lg">
                                                LAUNCHING SOON
                                            </span>
                                        </div>

                                        {/* Sparkle Effect */}
                                        {hoveredIndex === index && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="absolute top-4 right-4 text-2xl"
                                            >
                                                ✨
                                            </motion.div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Bottom CTA Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.8 }}
                        className="text-center space-y-6 py-12"
                    >
                        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-4xl mx-auto border-2 border-white">
                            <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-4">
                                Stay Tuned! 🎊
                            </h2>
                            <p className="text-lg text-gray-700 mb-6">
                                These amazing services will be available very soon. We're putting the finishing touches to ensure you get the best experience possible!
                            </p>
                            <div className="flex flex-wrap justify-center gap-4">
                                <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-full font-bold shadow-lg">
                                    🔔 Get Notified When We Launch
                                </div>
                            </div>
                        </div>

                        {/* Fun Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-8">
                            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
                                <div className="text-4xl font-black bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">14</div>
                                <div className="text-sm font-semibold text-gray-600 mt-2">New Services</div>
                            </div>
                            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
                                <div className="text-4xl font-black bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">24/7</div>
                                <div className="text-sm font-semibold text-gray-600 mt-2">Availability</div>
                            </div>
                            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
                                <div className="text-4xl font-black bg-gradient-to-r from-yellow-600 to-green-600 bg-clip-text text-transparent">100%</div>
                                <div className="text-sm font-semibold text-gray-600 mt-2">Secure</div>
                            </div>
                            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
                                <div className="text-4xl font-black bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">⚡</div>
                                <div className="text-sm font-semibold text-gray-600 mt-2">Instant</div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Custom Animations */}
                <style jsx>{`
          @keyframes gradient {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          .animate-gradient {
            background-size: 200% 200%;
            animation: gradient 3s ease infinite;
          }
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(20px, -50px) scale(1.1); }
            50% { transform: translate(-20px, 20px) scale(0.9); }
            75% { transform: translate(50px, 50px) scale(1.05); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}</style>
            </div>
        </DashboardLayout>
    );
}
