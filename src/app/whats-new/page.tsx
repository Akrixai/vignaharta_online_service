'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function WhatsNewPage() {
    const newFeatures = [
        {
            title: 'Cashfree Payment Gateway',
            description: 'Seamless wallet top-ups with our new secure payment gateway integration.',
            icon: '💳',
            color: 'from-blue-500 to-blue-600'
        },
        {
            title: 'Retailer Registration',
            description: 'Streamlined onboarding process for new retailers to join our network.',
            icon: '🏪',
            color: 'from-green-500 to-green-600'
        },
        {
            title: 'Customer System',
            description: 'Dedicated portal for customers to track applications and services.',
            icon: '👤',
            color: 'from-purple-500 to-purple-600'
        },
        {
            title: 'Distribution System',
            description: 'Advanced hierarchy management for distributors and supervisors.',
            icon: '🏢',
            color: 'from-orange-500 to-orange-600'
        },
        {
            title: 'Forgot Password',
            description: 'Secure account recovery with OTP verification.',
            icon: '🔒',
            color: 'from-red-500 to-red-600'
        },
        {
            title: 'Google Recaptcha',
            description: 'Enhanced security to prevent spam and bot attacks.',
            icon: '🛡️',
            color: 'from-yellow-500 to-yellow-600'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="pt-8 pb-16">
                {/* Hero Section */}
                <div className="relative bg-gradient-to-r from-red-800 to-red-900 text-white py-20 px-4 sm:px-6 lg:px-8 mb-12 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                    </div>

                    <div className="relative max-w-7xl mx-auto text-center z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="inline-block py-1 px-3 rounded-full bg-red-700/50 border border-red-500 text-red-100 text-sm font-semibold mb-4 backdrop-blur-sm">
                                Latest Updates & Roadmap
                            </span>
                            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-red-100 to-red-200">
                                What's New in Vighnaharta
                            </h1>
                            <p className="text-xl text-red-100 max-w-3xl mx-auto leading-relaxed">
                                Discover the latest features we've added to enhance your experience, and see what exciting developments are coming next.
                            </p>
                        </motion.div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* New Features Grid */}
                    <div className="mb-20">
                        <div className="flex items-center mb-10">
                            <span className="text-3xl mr-4">🚀</span>
                            <h2 className="text-3xl font-bold text-gray-900">Recently Added Features</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {newFeatures.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group hover:-translate-y-1"
                                >
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-3xl mb-6 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Coming Soon Section */}
                    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-red-900 to-red-800 text-white p-8 md:p-16 shadow-2xl">
                        <div className="absolute top-0 right-0 w-full h-full overflow-hidden opacity-20">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full filter blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full filter blur-3xl"></div>
                        </div>

                        <div className="relative z-10 text-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                            >
                                <div className="inline-block p-3 rounded-full bg-white/10 backdrop-blur-md mb-6 animate-bounce">
                                    <span className="text-4xl">✨</span>
                                </div>
                                <h2 className="text-3xl md:text-5xl font-bold mb-6">Coming Soon</h2>
                                <p className="text-xl text-red-100 max-w-2xl mx-auto mb-10">
                                    We are constantly working to bring you more value. Stay tuned for these upcoming additions!
                                </p>

                                <div className="flex flex-wrap justify-center gap-4 mb-12">
                                    {['Mobile Recharge', 'DTH Services', 'Electricity Bill', 'Flight Booking', 'Train Tickets', 'Hotel Booking'].map((item, i) => (
                                        <span key={i} className="px-6 py-3 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-sm font-medium hover:bg-white/20 transition-colors">
                                            {item}
                                        </span>
                                    ))}
                                    <span className="px-6 py-3 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-sm font-bold shadow-lg">
                                        + Many More
                                    </span>
                                </div>

                                <div className="bg-white/5 rounded-2xl p-8 max-w-3xl mx-auto backdrop-blur-sm border border-white/10">
                                    <h3 className="text-2xl font-bold mb-4">Stay Updated</h3>
                                    <p className="text-red-100 mb-6">
                                        Don't miss out on new features and announcements. Check back often!
                                    </p>
                                    <Link
                                        href="/register"
                                        className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-200 bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-lg hover:shadow-red-500/30 transform hover:scale-105"
                                    >
                                        Get Started Now
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
