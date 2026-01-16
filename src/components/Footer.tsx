'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Building2,
  MapPin,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Globe,
  Layers,
  Heart
} from 'lucide-react';
import Logo from '@/components/ui/logo';
import { useLanguage } from '@/contexts/LanguageContext';
import { footerTranslations } from '@/translations/footer';
import Image from 'next/image';

export default function Footer() {
  const { language } = useLanguage();
  const t = (footerTranslations as any)[language] || footerTranslations['en'];

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Helper to strip emojis for a more professional look
  const clean = (text: string) => text.replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

  return (
    <footer className="relative bg-white text-gray-900 pt-20 pb-10 overflow-hidden border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20"
        >
          {/* Brand Column */}
          <motion.div variants={itemVariants} className="space-y-6">
            <Logo size="lg" showText={true} animated={true} className="justify-start transition-opacity" />
            <p className="text-gray-600 font-medium text-sm leading-relaxed max-w-sm">
              {clean(t.empoweringCitizens)}
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-red-50 transition-all border border-gray-200 group">
                <Globe className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-red-50 transition-all border border-gray-200 group">
                <Layers className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" />
              </a>
            </div>

            {/* Integrated Partner Badges */}
            <div className="pt-4 flex flex-wrap gap-4 items-center">
              <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm hover:border-blue-300 transition-all group">
                <div className="relative w-20 h-8">
                  <Image src="/nsdllogo.png" alt="NSDL Official Partner" fill className="object-contain" />
                </div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm hover:border-orange-300 transition-all group">
                <div className="relative w-20 h-8">
                  <Image src="/bharatconnect.png" alt="Bharat Connect BBPS Partner" fill className="object-contain" />
                </div>
              </div>
            </div>

            {/* App Download Section */}
            <div className="pt-6 space-y-3">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Download Our App</p>
              <a
                href="https://loadly.io/BfNgJcFj"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block transform hover:scale-105 transition-all active:scale-95"
              >
                <div className="relative w-36 h-12">
                  <Image
                    src="/goggle-play.png"
                    alt="Get it on Google Play"
                    fill
                    className="object-contain"
                  />
                </div>
              </a>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-red-600 flex items-center gap-2">
              <span className="w-2 h-px bg-red-600"></span>
              {clean(t.quickLinks)}
            </h4>
            <ul className="space-y-3">
              {[
                { label: clean(t.aboutUs), href: language === 'en' ? '/about' : `/${language}/about` },
                { label: clean(t.services), href: language === 'en' ? '/services' : `/${language}/services` },
                { label: 'How It Works', href: '/how-it-works' },
                { label: 'Service Centers', href: '/service-centers' }
              ].map((link, i) => (
                <li key={i}>
                  <Link href={link.href} className="text-gray-700 hover:text-red-600 flex items-center gap-2 group transition-all text-sm font-bold">
                    <ChevronRight className="w-3 h-3 text-red-600 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Support */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-red-600 flex items-center gap-2">
              <span className="w-2 h-px bg-red-600"></span>
              {clean(t.support)}
            </h4>
            <ul className="space-y-3">
              {[
                { label: clean(t.contactUs), href: language === 'en' ? '/contact' : `/${language}/contact` },
                { label: clean(t.faq), href: '/faq' },
                { label: 'Testimonials', href: '/testimonials' },
                { label: 'Why Trust Us', href: '/trust' }
              ].map((link, i) => (
                <li key={i}>
                  <Link href={link.href} className="text-gray-700 hover:text-red-600 flex items-center gap-2 group transition-all text-sm font-bold">
                    <ChevronRight className="w-3 h-3 text-red-600 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-red-600 flex items-center gap-2">
              <span className="w-2 h-px bg-red-600"></span>
              {clean(t.legal)}
            </h4>
            <ul className="space-y-3">
              {[
                { label: clean(t.privacyPolicy), href: language === 'en' ? '/privacy' : `/${language}/privacy` },
                { label: clean(t.termsOfService), href: language === 'en' ? '/terms' : `/${language}/terms` },
                { label: clean(t.refundPolicy), href: language === 'en' ? '/refund-policy' : `/${language}/refund-policy` },
                { label: clean(t.becomeRetailer), href: '/register' }
              ].map((link, i) => (
                <li key={i}>
                  <Link href={link.href} className="text-gray-700 hover:text-red-600 flex items-center gap-2 group transition-all text-sm font-bold">
                    <ChevronRight className="w-3 h-3 text-red-600 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        {/* Corporate Info Section - Light Theme */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative group lg:mb-20"
        >
          <div className="absolute inset-0 bg-red-600/5 rounded-3xl blur-xl transition-all opacity-50"></div>
          <div className="relative bg-gray-50 border border-gray-200 rounded-3xl p-8 sm:p-10 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
              {/* CIN Column */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-200 text-red-600 text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" />
                  Official Registration
                </div>
                <div>
                  <p className="text-red-600 text-[11px] font-black mb-2 uppercase tracking-[0.2em]">Corporate Identity Number</p>
                  <p className="text-xl sm:text-2xl font-mono font-bold text-gray-900 tracking-wider flex items-center gap-3">
                    U74909PN2025PTC249261
                    <span className="h-px w-8 bg-gray-300 hidden sm:block"></span>
                  </p>
                </div>
              </div>

              {/* Address Column */}
              <div className="lg:col-span-1 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-gray-200 shrink-0">
                    <MapPin className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h5 className="text-gray-900 font-bold mb-2 text-sm uppercase tracking-wider">Registered Office</h5>
                    <div className="text-gray-700 text-sm leading-relaxed">
                      <p className="text-gray-900 font-bold mb-1">VIGHNAHARTA ONLINE SERVICES PVT LTD</p>
                      <p className="font-medium">G NO 199/5, KUPWAD, MIRAJ</p>
                      <p className="font-medium">Sangli, Maharashtra - 416416</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Incorporation Column */}
              <div className="flex flex-col items-start lg:items-end justify-center space-y-4">
                <div className="flex items-center gap-3 text-gray-700 text-sm">
                  <Calendar className="w-5 h-5 text-red-600" />
                  <span className="font-bold">Incorporated: <span className="text-red-600 font-black">12 Dec 2025</span></span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none shadow-sm">
                  Registered under the Companies Act, 2013
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer Bottom */}
        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <p className="text-gray-500 text-sm font-bold">
              {t.copyright}
            </p>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5 group cursor-pointer bg-gray-50 px-4 py-2 rounded-full border border-gray-200 hover:border-red-200 transition-all">
              <span className="text-gray-600 text-xs font-bold uppercase tracking-wider">{clean(t.developedWith)}</span>
              <a
                href="https://akrixsolutions.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex items-center gap-1.5"
              >
                <span className="font-bold text-gray-900 hover:text-red-600 transition-all duration-300 text-sm">
                  Akrix Solutions
                </span>
                <Heart className="w-3.5 h-3.5 text-red-600 fill-red-600 animate-pulse" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
