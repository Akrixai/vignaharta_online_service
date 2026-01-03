'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import jsPDF from 'jspdf';
import Image from 'next/image';

interface ReceiptData {
    transactionId: string;
    operatorRef: string;
    operatorName: string;
    consumerNumber: string;
    consumerName: string;
    customerMobile: string;
    amount: string;
    billNumber: string;
    billDate: string;
    billPeriod: string;
    dueAmount: string;
    dueDate: string;
    paymentDate: string;
    status: string;
    userRole: string;
    userName: string;
    userEmail: string;
}

export default function ElectricityReceiptContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const receiptRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        // Get transaction ID from URL
        const txnId = searchParams.get('txn');

        if (!txnId) {
            router.push('/dashboard/recharge/electricity');
            return;
        }

        // Fetch transaction details
        fetchTransactionDetails(txnId);
    }, [searchParams, router]);

    const fetchTransactionDetails = async (txnId: string) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/transactions/${txnId}`);
            const data = await res.json();

            if (data.success && data.transaction) {
                const txn = data.transaction;
                setReceiptData({
                    transactionId: txn.id,
                    operatorRef: txn.operator_ref || 'N/A',
                    operatorName: txn.operator_name || 'N/A',
                    consumerNumber: txn.consumer_number || 'N/A',
                    consumerName: txn.customer_name || 'N/A',
                    customerMobile: txn.customer_mobile || 'N/A',
                    amount: txn.amount?.toString() || '0',
                    billNumber: txn.bill_details?.bill_number || 'N/A',
                    billDate: txn.bill_details?.bill_date || 'N/A',
                    billPeriod: txn.bill_details?.bill_period || 'N/A',
                    dueAmount: txn.bill_details?.due_amount || '0',
                    dueDate: txn.bill_details?.due_date || 'N/A',
                    paymentDate: new Date(txn.created_at).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    }),
                    status: txn.status || 'N/A',
                    userRole: session?.user?.role || 'N/A',
                    userName: session?.user?.name || 'N/A',
                    userEmail: session?.user?.email || 'N/A',
                });
            } else {
                alert('Transaction not found');
                router.push('/dashboard/recharge/electricity');
            }
        } catch (error) {
            console.error('Error fetching transaction:', error);
            alert('Failed to load receipt');
            router.push('/dashboard/recharge/electricity');
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async () => {
        if (!receiptData || !receiptRef.current) return;

        try {
            setDownloading(true);

            // Create PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Add logo
            try {
                const logoImg = await loadImage('/vignaharta.png');
                pdf.addImage(logoImg, 'PNG', pageWidth / 2 - 20, 15, 40, 40);
            } catch (err) {
                console.error('Failed to load logo:', err);
            }

            // Header
            pdf.setFontSize(24);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(37, 99, 235); // Blue color
            pdf.text('PAYMENT RECEIPT', pageWidth / 2, 65, { align: 'center' });

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(100, 100, 100);
            pdf.text('Electricity Bill Payment', pageWidth / 2, 72, { align: 'center' });

            // Horizontal line
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.5);
            pdf.line(15, 78, pageWidth - 15, 78);

            let yPos = 88;

            // Transaction Status Badge
            pdf.setFillColor(34, 197, 94); // Green
            pdf.roundedRect(pageWidth / 2 - 25, yPos, 50, 10, 2, 2, 'F');
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(255, 255, 255);
            pdf.text('✓ SUCCESSFUL', pageWidth / 2, yPos + 7, { align: 'center' });

            yPos += 20;

            // Transaction Information Section
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 0, 0);
            pdf.text('Transaction Information', 15, yPos);
            yPos += 8;

            // Transaction details
            const transactionInfo = [
                ['Transaction ID:', receiptData.transactionId],
                ['Operator Reference:', receiptData.operatorRef],
                ['Payment Date:', receiptData.paymentDate],
                ['Amount Paid:', `₹${receiptData.amount}`],
            ];

            pdf.setFontSize(10);
            transactionInfo.forEach(([label, value]) => {
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(100, 100, 100);
                pdf.text(label, 15, yPos);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(0, 0, 0);
                pdf.text(value, 80, yPos);
                yPos += 7;
            });

            yPos += 5;

            // Bill Information Section
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 0, 0);
            pdf.text('Bill Information', 15, yPos);
            yPos += 8;

            const billInfo = [
                ['Electricity Board:', receiptData.operatorName],
                ['Consumer Number:', receiptData.consumerNumber],
                ['Consumer Name:', receiptData.consumerName],
                ['Customer Mobile:', receiptData.customerMobile],
                ['Bill Number:', receiptData.billNumber],
                ['Bill Date:', receiptData.billDate],
                ['Bill Period:', receiptData.billPeriod],
                ['Due Date:', receiptData.dueDate],
                ['Due Amount:', `₹${receiptData.dueAmount}`],
            ];

            pdf.setFontSize(10);
            billInfo.forEach(([label, value]) => {
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(100, 100, 100);
                pdf.text(label, 15, yPos);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(0, 0, 0);
                pdf.text(value, 80, yPos);
                yPos += 7;
            });

            yPos += 5;

            // User Information Section
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 0, 0);
            pdf.text('User Information', 15, yPos);
            yPos += 8;

            const userInfo = [
                ['User Name:', receiptData.userName],
                ['User Email:', receiptData.userEmail],
                ['User Role:', receiptData.userRole.toUpperCase()],
            ];

            pdf.setFontSize(10);
            userInfo.forEach(([label, value]) => {
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(100, 100, 100);
                pdf.text(label, 15, yPos);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(0, 0, 0);
                pdf.text(value, 80, yPos);
                yPos += 7;
            });

            // Footer with Akrix Solutions branding
            const footerY = pageHeight - 20;

            // Footer line
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.5);
            pdf.line(15, footerY - 5, pageWidth - 15, footerY - 5);

            // Footer text
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(100, 100, 100);
            pdf.text('This is a computer-generated receipt and does not require a signature.', pageWidth / 2, footerY, { align: 'center' });

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(37, 99, 235);
            pdf.text('Powered by Akrix Solutions', pageWidth / 2, footerY + 5, { align: 'center' });

            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(100, 100, 100);
            pdf.textWithLink('www.akrixsolutions.in', pageWidth / 2, footerY + 10, {
                align: 'center',
                url: 'https://akrixsolutions.in'
            });

            // Save PDF
            pdf.save(`Electricity_Receipt_${receiptData.transactionId}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to download PDF. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    // Helper function to load images
    const loadImage = (src: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = document.createElement('img');
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                } else {
                    reject(new Error('Failed to get canvas context'));
                }
            };
            img.onerror = reject;
            img.src = src;
        });
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 sm:h-16 w-12 sm:w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 text-sm sm:text-base">Loading receipt...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!receiptData) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center min-h-screen px-4">
                    <div className="text-center">
                        <p className="text-red-600 text-lg sm:text-xl mb-4">Receipt not found</p>
                        <button
                            onClick={() => router.push('/dashboard/recharge/electricity')}
                            className="px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-4xl">
                {/* Action Buttons - Hide on print */}
                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2 sm:gap-4 print:hidden">
                    <button
                        onClick={() => router.push('/dashboard/recharge/electricity')}
                        className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all text-sm sm:text-base font-medium"
                    >
                        ← Back to Electricity
                    </button>
                    <button
                        onClick={handlePrint}
                        className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-sm sm:text-base font-medium"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        <span className="hidden xs:inline">Print Receipt</span>
                        <span className="xs:hidden">Print</span>
                    </button>
                    <button
                        onClick={downloadPDF}
                        disabled={downloading}
                        className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
                    >
                        {downloading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span className="hidden xs:inline">Generating PDF...</span>
                                <span className="xs:hidden">Generating...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="hidden xs:inline">Download PDF</span>
                                <span className="xs:hidden">PDF</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Receipt Content */}
                <div ref={receiptRef} className="bg-white rounded-lg sm:rounded-xl shadow-2xl overflow-hidden print:shadow-none">
                    {/* Header with Logo */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 sm:p-6 md:p-8 text-center">
                        <div className="mb-3 sm:mb-4 flex justify-center">
                            <div className="bg-white rounded-full p-3 sm:p-4 shadow-lg">
                                <Image
                                    src="/vignaharta.png"
                                    alt="Vighnaharta Logo"
                                    width={60}
                                    height={60}
                                    className="object-contain sm:w-20 sm:h-20"
                                />
                            </div>
                        </div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">PAYMENT RECEIPT</h1>
                        <p className="text-blue-100 text-xs sm:text-sm">Electricity Bill Payment</p>
                    </div>

                    {/* Status Badge */}
                    <div className="flex justify-center -mt-4 sm:-mt-6 mb-4 sm:mb-6">
                        <div className="bg-green-500 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-full shadow-lg flex items-center gap-2">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-bold text-sm sm:text-base md:text-lg">PAYMENT SUCCESSFUL</span>
                        </div>
                    </div>

                    {/* Receipt Body */}
                    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
                        {/* Transaction Information */}
                        <div className="border-2 border-blue-100 rounded-lg p-4 sm:p-6 bg-blue-50">
                            <h2 className="text-lg sm:text-xl font-bold text-blue-900 mb-3 sm:mb-4 flex items-center gap-2 flex-wrap">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Transaction Information</span>
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Transaction ID</p>
                                    <p className="font-bold text-gray-900 text-sm sm:text-base break-all">{receiptData.transactionId}</p>
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Operator Reference</p>
                                    <p className="font-bold text-gray-900 text-sm sm:text-base break-all">{receiptData.operatorRef}</p>
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Payment Date & Time</p>
                                    <p className="font-bold text-gray-900 text-sm sm:text-base">{receiptData.paymentDate}</p>
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Amount Paid</p>
                                    <p className="font-bold text-green-600 text-xl sm:text-2xl">₹{receiptData.amount}</p>
                                </div>
                            </div>
                        </div>

                        {/* Bill Information */}
                        <div className="border-2 border-purple-100 rounded-lg p-4 sm:p-6 bg-purple-50">
                            <h2 className="text-lg sm:text-xl font-bold text-purple-900 mb-3 sm:mb-4 flex items-center gap-2 flex-wrap">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>Bill Information</span>
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Electricity Board</p>
                                    <p className="font-bold text-gray-900 text-sm sm:text-base">{receiptData.operatorName}</p>
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Consumer Number</p>
                                    <p className="font-bold text-gray-900 text-sm sm:text-base break-all">{receiptData.consumerNumber}</p>
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Consumer Name</p>
                                    <p className="font-bold text-gray-900 text-sm sm:text-base">{receiptData.consumerName}</p>
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Customer Mobile</p>
                                    <p className="font-bold text-gray-900 text-sm sm:text-base">{receiptData.customerMobile}</p>
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Bill Number</p>
                                    <p className="font-bold text-gray-900 text-sm sm:text-base break-all">{receiptData.billNumber}</p>
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Bill Date</p>
                                    <p className="font-bold text-gray-900 text-sm sm:text-base">{receiptData.billDate}</p>
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Bill Period</p>
                                    <p className="font-bold text-gray-900 text-sm sm:text-base">{receiptData.billPeriod}</p>
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Due Date</p>
                                    <p className="font-bold text-gray-900 text-sm sm:text-base">{receiptData.dueDate}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Bill Due Amount</p>
                                    <p className="font-bold text-purple-600 text-lg sm:text-xl">₹{receiptData.dueAmount}</p>
                                </div>
                            </div>
                        </div>

                        {/* User Information */}
                        <div className="border-2 border-gray-100 rounded-lg p-4 sm:p-6 bg-gray-50">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 flex-wrap">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>User Information</span>
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <p className="text-xs sm:text-sm text-gray-600 mb-1">User Name</p>
                                    <p className="font-bold text-gray-900 text-sm sm:text-base">{receiptData.userName}</p>
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-gray-600 mb-1">User Email</p>
                                    <p className="font-bold text-gray-900 text-sm sm:text-base break-all">{receiptData.userEmail}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs sm:text-sm text-gray-600 mb-1">User Role</p>
                                    <p className="font-bold text-gray-900 text-sm sm:text-base">{receiptData.userRole.toUpperCase()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Important Notice */}
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4">
                            <p className="text-xs sm:text-sm text-yellow-800">
                                <span className="font-bold">📌 Important:</span> Please save this receipt for your records. In case of any discrepancy, contact customer support with your Transaction ID: <span className="font-mono font-bold break-all">{receiptData.transactionId}</span>
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-100 p-4 sm:p-6 text-center border-t-2 border-gray-200">
                        <p className="text-xs sm:text-sm text-gray-600 mb-2">
                            This is a computer-generated receipt and does not require a signature.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-blue-600 font-bold text-sm sm:text-base">
                            <span>Powered by Akrix Solutions</span>
                        </div>
                        <a
                            href="https://akrixsolutions.in"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs sm:text-sm text-blue-500 hover:text-blue-700 hover:underline inline-block mt-1"
                        >
                            www.akrixsolutions.in
                        </a>
                        <p className="text-xs text-gray-500 mt-2">
                            © {new Date().getFullYear()} Akrix Solutions. All rights reserved.
                        </p>
                    </div>
                </div>

                {/* Print Styles */}
                <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-container,
            .print-container * {
              visibility: visible;
            }
            .print-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .print\\:hidden {
              display: none !important;
            }
            .print\\:shadow-none {
              box-shadow: none !important;
            }
          }
          
          /* Extra small devices */
          @media (min-width: 375px) {
            .xs\\:inline {
              display: inline !important;
            }
            .xs\\:hidden {
              display: none !important;
            }
          }
        `}</style>
            </div>
        </DashboardLayout>
    );
}
