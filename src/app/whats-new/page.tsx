'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function WhatsNewPage() {
    const categories = [
        {
            title: 'BBPS Bill Payments',
            description: 'Now live with all BBPS categories including Mobile Recharge, Electricity, Gas, Water, Broadband, Landline, FASTag, and Insurance.',
            icon: '💳',
            color: 'from-blue-600 to-indigo-700',
            features: ['Mobile Recharge', 'Electricity Bills', 'Insurance Premium', 'FASTag']
        },
        {
            title: 'NSDL PAN Services',
            description: 'Officially integrated NSDL PAN services for New PAN cards, PAN corrections, and resuming incomplete PAN applications.',
            icon: '🆔',
            color: 'from-emerald-600 to-teal-700',
            features: ['New PAN Card', 'PAN Correction', 'Incomplete PAN', 'Fast Processing']
        },
        {
            title: 'Retailer Commissions',
            description: 'Earn the highest commissions in the industry on every mobile recharge and utility bill payment through our portal.',
            icon: '💰',
            color: 'from-orange-500 to-red-600',
            features: ['Instant Credit', 'High Margins', 'Multiple Services', 'Daily Payouts']
        },
        {
            title: 'Customer Cashback',
            description: 'Get exclusive cashback rewards as a customer on every application and payment you make through Vighnaharta.',
            icon: '🎁',
            color: 'from-pink-500 to-rose-600',
            features: ['Real Cashback', 'Wallet Credit', 'Referral Rewards', 'Loyalty Points']
        },
        {
            title: 'Advanced Dashboard',
            description: 'New unified dashboard for retailers and customers to manage all services, applications, and transactions in one place.',
            icon: '📊',
            color: 'from-purple-600 to-fuchsia-700',
            features: ['Real-time Stats', 'Transaction History', 'Digital Receipts', 'Analytics']
        },
        {
            title: 'Express Onboarding',
            description: 'Join our network instantly as a retailer or customer and start earning or saving from the very first minute.',
            icon: '🚀',
            color: 'from-cyan-500 to-blue-600',
            features: ['Easy KYC', 'Instant Wallet', 'Dedicated Support', 'Training Videos']
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            <Header />

            <main className="pt-0 overflow-hidden">
                {/* Hero Section with Glassmorphism */}
                <section className="relative bg-[#8b0000] text-white py-24 px-4 overflow-hidden">
                    <div className="absolute inset-0">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.5, 0.3]
                            }}
                            transition={{ duration: 8, repeat: Infinity }}
                            className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-yellow-500/20 rounded-full blur-3xl"
                        ></motion.div>
                        <motion.div
                            animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.2, 0.4, 0.2]
                            }}
                            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
                            className="absolute -bottom-24 -left-24 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl"
                        ></motion.div>
                    </div>

                    <div className="relative max-w-7xl mx-auto text-center z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="inline-block py-1.5 px-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-yellow-400 text-sm font-bold mb-6 tracking-wider uppercase">
                                What's New & Trending
                            </span>
                            <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tight">
                                Our Latest <span className="text-yellow-400">Live</span> Services
                            </h1>
                            <p className="text-xl md:text-2xl text-red-50 max-w-4xl mx-auto leading-relaxed font-medium">
                                We've expanded our horizons! Explore the new BBPS categories, NSDL PAN services, and high-earning opportunities now live on Vighnaharta Online Service.
                            </p>

                            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
                                <Link
                                    href="/register"
                                    className="px-10 py-4 bg-yellow-500 hover:bg-yellow-400 text-red-900 font-black rounded-full transition-all duration-300 shadow-2xl hover:shadow-yellow-500/40 transform hover:-translate-y-1 text-lg"
                                >
                                    Join Fast - Register Now
                                </Link>
                                <Link
                                    href="/services"
                                    className="px-10 py-4 bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold rounded-full hover:bg-white/20 transition-all duration-300 text-lg"
                                >
                                    Explore Services
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </section>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20 pb-24">
                    {/* Live Services Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {categories.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-slate-100 group relative overflow-hidden"
                            >
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.color} opacity-5 group-hover:opacity-10 rounded-bl-full transition-opacity duration-500`}></div>

                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-3xl mb-8 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                                    <span className="drop-shadow-md">{item.icon}</span>
                                </div>

                                <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-[#8b0000] transition-colors duration-300">
                                    {item.title}
                                </h3>

                                <p className="text-slate-600 mb-8 leading-relaxed font-medium">
                                    {item.description}
                                </p>

                                <div className="space-y-3">
                                    {item.features.map((feature, fidx) => (
                                        <div key={fidx} className="flex items-center text-sm font-semibold text-slate-500">
                                            <svg className="w-5 h-5 mr-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                            </svg>
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Commissions & Cashback Callout - Red and White Theme */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="mt-24 rounded-[4rem] bg-white text-[#8b0000] p-10 md:p-20 shadow-[0_50px_100px_-20px_rgba(139,0,0,0.25)] relative overflow-hidden text-center md:text-left border-[12px] border-[#8b0000]"
                    >
                        <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-20">
                            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>
                        </div>

                        <div className="relative z-10 grid lg:grid-cols-5 gap-12 items-center">
                            <div className="lg:col-span-3 space-y-8">
                                <h2 className="text-4xl md:text-7xl font-black leading-tight tracking-tighter italic">
                                    EARN HIGH <br />
                                    <span className="text-slate-900 bg-red-100 px-4 inline-block transform -skew-x-12">COMMISSIONS</span> <br />
                                    & <span className="text-slate-900 bg-red-100 px-4 inline-block transform -skew-x-12">CASHBACK</span>
                                </h2>
                                <p className="text-xl md:text-2xl text-slate-700 leading-relaxed font-bold max-w-2xl">
                                    Grow your business or save on every bill. Vighnaharta's new NSDL and BBPS official integrations offer the industry's <span className="text-red-600 underline decoration-red-500 decoration-4 underline-offset-8">Best Profit Margins</span>.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-6 pt-4">
                                    <div className="bg-red-50 rounded-[2rem] p-8 border-4 border-red-100 flex-1 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="text-4xl font-black text-[#8b0000] mb-3 tracking-tighter">RETAILER</div>
                                        <div className="h-1 w-12 bg-[#8b0000] mb-4"></div>
                                        <p className="text-slate-700 text-sm font-black uppercase tracking-wide">High Commission <br />+ High Margins</p>
                                    </div>
                                    <div className="bg-red-50 rounded-[2rem] p-8 border-4 border-red-100 flex-1 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="text-4xl font-black text-[#8b0000] mb-3 tracking-tighter">CUSTOMER</div>
                                        <div className="h-1 w-12 bg-[#8b0000] mb-4"></div>
                                        <p className="text-slate-700 text-sm font-black uppercase tracking-wide">Instant Cashback <br />+ Wallet Rewards</p>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-2 flex justify-center lg:justify-end items-center">
                                <Link
                                    href="/register"
                                    className="group relative transform hover:scale-110 transition-all duration-500 active:scale-95"
                                >
                                    <div className="absolute -inset-4 bg-red-600 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                    <button className="relative px-12 md:px-16 py-8 md:py-10 bg-[#8b0000] text-white rounded-[2.5rem] font-black text-3xl md:text-4xl tracking-tighter uppercase shadow-[0_20px_50px_rgba(139,0,0,0.4)] border-4 border-white group-hover:bg-red-700 hover:rotate-3 transition-all duration-300">
                                        JOIN NOW <br />
                                        & EARN 🚀
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
