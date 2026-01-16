'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
    Printer,
    Download,
    Share2,
    ShieldCheck,
    ExternalLink,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import { ReceiptData, getStatusConfig, getVariantStyles } from '@/types/receipt';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PremiumReceiptProps {
    data: ReceiptData;
    onPrint?: () => void;
    onDownload?: () => void;
    className?: string;
    showActions?: boolean;
}

export const PremiumReceipt: React.FC<PremiumReceiptProps> = ({
    data,
    onPrint,
    onDownload,
    className,
    showActions = true
}) => {
    const statusConfig = getStatusConfig(data.status);
    const StatusIcon = statusConfig.icon;

    const handleDefaultPrint = () => {
        if (onPrint) onPrint();
        else window.print();
    };

    const handleDefaultDownload = async () => {
        if (onDownload) {
            onDownload();
            return;
        }

        const receiptElement = document.getElementById('premium-receipt-content');
        if (!receiptElement) return;

        try {
            const canvas = await html2canvas(receiptElement, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Receipt_${data.transactionId}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        }
    };

    return (
        <div className={cn("max-w-4xl mx-auto space-y-6", className)}>
            {/* Action Buttons */}
            {showActions && (
                <div className="flex flex-wrap gap-4 justify-end print:hidden mb-6">
                    <button
                        onClick={handleDefaultPrint}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm text-slate-700 font-medium"
                    >
                        <Printer size={18} />
                        <span>Print Receipt</span>
                    </button>
                    <button
                        onClick={handleDefaultDownload}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100 font-medium"
                    >
                        <Download size={18} />
                        <span>Download PDF</span>
                    </button>
                </div>
            )}

            {/* Main Receipt Content */}
            <motion.div
                id="premium-receipt-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 relative"
            >
                {/* Decorative Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden">
                    <span className="text-[12rem] font-bold rotate-12 whitespace-nowrap">
                        VIGHNAHARTA
                    </span>
                </div>

                {/* Header Section */}
                <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 sm:p-12 text-white relative overflow-hidden">
                    {/* Subtle patterns */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full -ml-24 -mb-24 blur-2xl opacity-30" />

                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20 shadow-xl">
                                <Image
                                    src="/vignaharta.png"
                                    alt="Vighnaharta Logo"
                                    width={80}
                                    height={80}
                                    className="object-contain"
                                />
                            </div>
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-1">
                                    VIGHNAHARTA
                                </h1>
                                <p className="text-blue-100 font-medium tracking-[0.2em] text-xs uppercase opacity-90">
                                    Online Services Private Limited
                                </p>
                            </div>
                        </div>

                        <div className="text-center md:text-right space-y-2">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/20 text-white font-bold text-sm">
                                <Sparkles size={16} className="text-yellow-300 fill-yellow-300" />
                                <span>OFFICIAL DIGITAL RECEIPT</span>
                            </div>
                            <h2 className="text-2xl font-bold block">{data.title}</h2>
                            {data.subtitle && (
                                <p className="text-blue-100/80 text-sm font-medium">{data.subtitle}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status Badge Float */}
                <div className="flex justify-center -mt-8 relative z-20">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={cn(
                            "px-8 py-4 rounded-2xl shadow-xl flex items-center gap-3 border-4 border-white",
                            statusConfig.bgColor,
                            "text-white"
                        )}
                    >
                        <StatusIcon size={24} className="animate-pulse" />
                        <span className="font-black text-lg tracking-wide">{statusConfig.label}</span>
                    </motion.div>
                </div>

                {/* Body Content */}
                <div className="p-8 sm:p-12 space-y-10 relative z-10">
                    {/* Essential Summary Card */}
                    <div className="bg-slate-50/80 backdrop-blur-sm rounded-[1.5rem] border border-slate-200 p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-1">
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Transaction Amount</p>
                            <p className="text-3xl font-black text-slate-900">
                                ₹{typeof data.amount === 'number' ? data.amount.toLocaleString('en-IN') : data.amount}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Transaction ID</p>
                            <p className="text-md font-bold text-slate-900 break-all">{data.transactionId}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Payment Date</p>
                            <p className="text-md font-bold text-slate-900">{data.date}</p>
                        </div>
                    </div>

                    {/* Dynamic Sections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {data.sections.map((section, sIdx) => {
                            const SectionIcon = section.icon;
                            const variant = getVariantStyles(section.variant);
                            return (
                                <motion.div
                                    key={sIdx}
                                    initial={{ opacity: 0, x: sIdx % 2 === 0 ? -10 : 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * sIdx }}
                                    className={cn(
                                        "rounded-[1.5rem] border p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow",
                                        variant.border,
                                        variant.bg
                                    )}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={cn("p-2.5 rounded-xl", variant.iconColor, "bg-white/80 shadow-sm")}>
                                            <SectionIcon size={20} />
                                        </div>
                                        <h3 className={cn("font-black text-lg", variant.text)}>{section.title}</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {section.items.map((item, iIdx) => {
                                            const ItemIcon = item.icon || ChevronRight;
                                            return (
                                                <div key={iIdx} className="flex justify-between items-start group">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-400 group-hover:text-blue-500 transition-colors">
                                                            <ItemIcon size={14} />
                                                        </span>
                                                        <span className="text-slate-500 text-sm font-medium">{item.label}</span>
                                                    </div>
                                                    <span className={cn(
                                                        "text-slate-900 text-sm font-bold text-right",
                                                        item.isSensitive && "select-none filter blur-[2px] hover:blur-none transition-all cursor-pointer"
                                                    )}>
                                                        {item.value}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Note Section */}
                    {data.customerNote && (
                        <div className="bg-amber-50/50 border-l-4 border-amber-400 p-6 rounded-r-2xl">
                            <div className="flex gap-4">
                                <div className="text-amber-500 mt-1">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h4 className="font-black text-amber-900 mb-1">Important Notice</h4>
                                    <p className="text-amber-800/80 text-sm leading-relaxed">
                                        {data.customerNote}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Premium Footer */}
                <div className="bg-slate-900 p-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                    <div className="relative z-10 space-y-6">
                        <p className="text-slate-400 text-xs font-medium tracking-[0.1em] uppercase">
                            {data.footerLine || "Thank you for choosing Vighnaharta Online Services"}
                        </p>

                        <div className="flex flex-col items-center space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="h-px w-8 bg-slate-700" />
                                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Backed By</span>
                                <span className="h-px w-8 bg-slate-700" />
                            </div>

                            <a
                                href="https://akrixsolutions.in"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all"
                            >
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white text-lg">
                                    A
                                </div>
                                <div className="text-left">
                                    <p className="text-white font-black text-lg group-hover:text-blue-400 transition-colors">
                                        Akrix Solutions
                                    </p>
                                    <p className="text-slate-500 text-[10px] font-bold flex items-center gap-1 group-hover:text-slate-400">
                                        www.akrixsolutions.in <ExternalLink size={10} />
                                    </p>
                                </div>
                            </a>
                        </div>

                        <p className="text-slate-600 text-[10px] max-w-lg mx-auto leading-relaxed italic">
                            Disclaimer: This is a system-generated secure digital receipt and does not require a physical signature.
                            The transaction is verified and authenticated via our secure payment infrastructure.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Modern Print Styles */}
            <style jsx global>{`
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          #premium-receipt-content {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: none !important;
            border-radius: 0 !important;
          }
          .rounded-\\[2rem\\] {
            border-radius: 0 !important;
          }
          .rounded-\\[1\\.5rem\\] {
            border-radius: 0.5rem !important;
          }
        }
      `}</style>
        </div>
    );
};
