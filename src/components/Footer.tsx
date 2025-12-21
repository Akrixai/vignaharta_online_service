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

export default function Footer() {
  const { language } = useLanguage();
  const t = footerTranslations[language];

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
    <footer className="relative bg-[#0a0a0b] text-white pt-20 pb-10 overflow-hidden border-t border-white/5">
      {/* Abstract Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-900/40 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

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
            <Logo size="lg" showText={true} animated={true} className="justify-start opacity-90 hover:opacity-100 transition-opacity" />
            <p className="text-white/80 text-sm leading-relaxed max-w-sm">
              {clean(t.empoweringCitizens)}
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-600/20 transition-all border border-white/10 group">
                <Globe className="w-5 h-5 text-white/70 group-hover:text-red-500 transition-colors" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-600/20 transition-all border border-white/10 group">
                <Layers className="w-5 h-5 text-white/70 group-hover:text-red-500 transition-colors" />
              </a>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 flex items-center gap-2">
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
                  <Link href={link.href} className="text-white/90 hover:text-red-500 flex items-center gap-2 group transition-all text-sm font-medium">
                    <ChevronRight className="w-3 h-3 text-red-600 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Support */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 flex items-center gap-2">
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
                  <Link href={link.href} className="text-gray-400 hover:text-white flex items-center gap-2 group transition-all text-sm font-medium">
                    <ChevronRight className="w-3 h-3 text-red-600 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 flex items-center gap-2">
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
                  <Link href={link.href} className="text-gray-400 hover:text-white flex items-center gap-2 group transition-all text-sm font-medium">
                    <ChevronRight className="w-3 h-3 text-red-600 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        {/* Corporate Info Section - Redesigned */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative group lg:mb-20"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 via-amber-600/5 to-red-600/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all opacity-50"></div>
          <div className="relative bg-[#111113] border border-white/5 rounded-3xl p-8 sm:p-10 overflow-hidden">
            {/* Subtle light effect */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/10 rounded-full blur-[80px]"></div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
              {/* CIN Column */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" />
                  Official Registration
                </div>
                <div>
                  <p className="text-red-500/90 text-[10px] font-bold mb-2 uppercase tracking-[0.2em]">Corporate Identity Number</p>
                  <p className="text-xl sm:text-2xl font-mono font-bold text-white tracking-wider flex items-center gap-3">
                    U74909PN2025PTC249261
                    <span className="h-px w-8 bg-white/20 hidden sm:block"></span>
                  </p>
                </div>
              </div>

              {/* Address Column */}
              <div className="lg:col-span-1 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                    <MapPin className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h5 className="text-white font-bold mb-2 text-sm uppercase tracking-wider">Registered Office</h5>
                    <div className="text-white/90 text-sm leading-relaxed">
                      <p className="text-white font-semibold mb-1">VIGHNAHARTA ONLINE SERVICES PVT LTD</p>
                      <p>G NO 199/5, KUPWAD, MIRAJ</p>
                      <p>Sangli, Maharashtra - 416416</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Incorporation Column */}
              <div className="flex flex-col items-start lg:items-end justify-center space-y-4">
                <div className="flex items-center gap-3 text-white/90 text-sm">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  <span className="font-medium">Incorporated: <span className="text-red-500 font-bold">12 Dec 2025</span></span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white/60 uppercase tracking-widest leading-none">
                  Registered under the Companies Act, 2013
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer Bottom */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <p className="text-white/80 text-sm font-medium">
              {t.copyright}
            </p>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5 group cursor-pointer bg-white/5 px-4 py-2 rounded-full border border-white/5 hover:border-red-500/30 transition-all">
              <span className="text-white/70 text-xs font-medium uppercase tracking-wider">{clean(t.developedWith)}</span>
              <a
                href="https://akrixsolutions.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex items-center gap-1.5"
              >
                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500 hover:from-amber-500 hover:to-red-500 transition-all duration-500 text-sm">
                  Akrix Solutions
                </span>
                <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

