import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import jsPDF from 'jspdf';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');
    const format = searchParams.get('format') || 'json'; // json or pdf

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'Order ID is required' }, { status: 400 });
    }

    // Find PAN service by order_id
    const { data: panService, error: findError } = await supabaseAdmin
      .from('pan_services')
      .select(`
        *,
        users!inner(
          id,
          name,
          email,
          phone,
          role
        )
      `)
      .eq('order_id', orderId)
      .single();

    if (findError || !panService) {
      console.error('❌ PAN service not found for order_id:', orderId, findError);
      return NextResponse.json({
        success: false,
        message: 'PAN service record not found'
      }, { status: 404 });
    }

    // Check access - user can only view their own receipts unless admin
    if (user.role !== 'ADMIN' && panService.user_id !== user.id) {
      return NextResponse.json({
        success: false,
        message: 'Access denied'
      }, { status: 403 });
    }

    // Only generate receipt for successful applications
    if (panService.status !== 'SUCCESS') {
      return NextResponse.json({
        success: false,
        message: 'Receipt can only be generated for successful applications'
      }, { status: 400 });
    }

    // Generate receipt data
    const receiptData = {
      // Basic Information
      order_id: panService.order_id,
      service_type: panService.service_type,
      mobile_number: panService.mobile_number,
      mode: panService.mode,
      amount: panService.amount,
      status: panService.status,

      // Payment Information
      payment_status: panService.payment_status,
      payment_charged_at: panService.payment_charged_at,

      // InsPay Details
      inspay_txid: panService.inspay_txid,
      inspay_opid: panService.inspay_opid,
      acknowledgement_number: panService.acknowledgement_number || panService.inspay_opid,

      // Callback Information
      callback_data: panService.callback_data,
      callback_raw_data: panService.callback_raw_data,
      webhook_received_at: panService.webhook_received_at,

      // Timestamps
      created_at: panService.created_at,
      completed_at: panService.completed_at,
      updated_at: panService.updated_at,

      // User Information
      user: {
        name: panService.users.name,
        email: panService.users.email,
        mobile: panService.users.phone,
        role: panService.users.role
      },

      // Company Information
      company: {
        name: 'Vighnaharta Online Services Private Limited',
        address: 'India',
        website: 'https://vighnahartaonlineservices.com',
        support_email: 'support@vighnahartaonlineservices.com'
      },

      // Receipt Metadata
      receipt_generated_at: new Date().toISOString(),
      receipt_id: `RCP_${panService.order_id}_${Date.now()}`
    };

    // Update receipt generation status
    const { error: updateError } = await supabaseAdmin
      .from('pan_services')
      .update({
        receipt_generated: true,
        receipt_generated_at: receiptData.receipt_generated_at,
        receipt_data: receiptData,
        updated_at: receiptData.receipt_generated_at
      })
      .eq('id', panService.id);

    if (updateError) {
      console.error('❌ Error updating receipt status:', updateError);
    }

    if (format === 'pdf') {
      // Generate PDF receipt
      const pdfBuffer = await generatePDFReceipt(receiptData);

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="PAN_Receipt_${panService.order_id}.pdf"`
        }
      });
    }

    // Return JSON receipt data
    return NextResponse.json({
      success: true,
      data: receiptData
    });

  } catch (error) {
    console.error('💥 Error generating receipt:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function generatePDFReceipt(receiptData: any): Promise<Buffer> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Color Palette
  const colors = {
    primary: [220, 38, 38], // Vighnaharta Red
    secondary: [37, 99, 235], // NSDL Blue
    success: [16, 185, 129], // Green
    background: [249, 250, 251], // Light Gray
    border: [229, 231, 235], // Border Gray
    text: [31, 41, 55], // Dark Gray
    lightText: [107, 114, 128], // Medium Gray
    cardBg: [255, 255, 255]
  };

  // Helper for images
  const getBase64Image = (fileName: string) => {
    try {
      const filePath = path.join(process.cwd(), 'public', fileName);
      if (fs.existsSync(filePath)) {
        const file = fs.readFileSync(filePath);
        return `data:image/png;base64,${file.toString('base64')}`;
      }
    } catch (e) {
      console.error(`Error loading image ${fileName}:`, e);
    }
    return null;
  };

  const vignahartaLogo = getBase64Image('vignaharta.png');
  const nsdlLogo = getBase64Image('nsdllogo.png');

  // 1. Header Background & Accents
  pdf.setFillColor(254, 242, 242); // Very light red/blush
  pdf.rect(0, 0, pageWidth, 50, 'F');
  pdf.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.setLineWidth(1);
  pdf.line(0, 50, pageWidth, 50);

  // 2. Logos & Company Info
  if (vignahartaLogo) {
    pdf.addImage(vignahartaLogo, 'PNG', 15, 12, 25, 25);
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text('VIGHNAHARTA', 45, 25);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2]);
  pdf.text('ONLINE SERVICES PRIVATE LIMITED', 45, 32, { charSpace: 0.5 });

  if (nsdlLogo) {
    pdf.addImage(nsdlLogo, 'PNG', pageWidth - 55, 12, 40, 22);
  }

  // 3. Status Badge & Receipt Header
  let yPos = 65;
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('SERVICE PAYMENT RECEIPT', 20, yPos);

  // Successful Badge
  pdf.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.roundedRect(pageWidth - 70, yPos - 8, 50, 12, 3, 3, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('✓ SUCCESSFUL', pageWidth - 45, yPos, { align: 'center' });

  yPos += 18;

  // 4. Partner Branding Banner
  pdf.setFillColor(243, 244, 246);
  pdf.roundedRect(20, yPos, pageWidth - 40, 20, 3, 3, 'F');

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  pdf.text('OFFICIAL NSDL e-GOV (PROTEAN) AUTHORIZED PORTAL PARTNER', pageWidth / 2, yPos + 12, { align: 'center' });

  yPos += 35;

  // 5. Service Information Card
  pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(20, yPos, pageWidth - 40, 58, 4, 4, 'S');

  pdf.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
  pdf.rect(21, yPos + 1, pageWidth - 42, 10, 'F');

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text('Application & Service Details', 28, yPos + 8);

  yPos += 20;
  pdf.setFontSize(10);

  const applicationData = [
    { l: 'Receipt ID', v: receiptData.receipt_id },
    { l: 'Merchant Order ID', v: receiptData.order_id },
    { l: 'Applied Service', v: getServiceTypeName(receiptData.service_type) },
    { l: 'Processing Mode', v: receiptData.mode },
    { l: 'Applicant Mobile', v: receiptData.mobile_number }
  ];

  applicationData.forEach((row, idx) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2]);
    pdf.text(row.l, 30, yPos + (idx * 7.5));

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    pdf.text(`:   ${row.v}`, 75, yPos + (idx * 7.5));
  });

  yPos += 48;

  // 6. Tracking Section (Premium Highlight)
  if (receiptData.acknowledgement_number && receiptData.acknowledgement_number !== 'Order is under process') {
    pdf.setFillColor(239, 246, 255); // Blue-50
    pdf.setDrawColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(20, yPos, pageWidth - 40, 48, 4, 4, 'FD');

    // Subtle Watermark
    pdf.setFontSize(32);
    pdf.setTextColor(225, 235, 250);
    pdf.setFont('helvetica', 'bold');
    pdf.text('NSDL DIGITAL PORTAL', pageWidth / 2, yPos + 28, { align: 'center' });

    pdf.setFontSize(14);
    pdf.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    pdf.text('Digital Acknowledgement (Ack)', 30, yPos + 12);

    pdf.setFontSize(11);
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    pdf.text('Acknowledgement Number:', 30, yPos + 25);

    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text(receiptData.acknowledgement_number, 85, yPos + 25);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2]);
    pdf.text('Official Tracking Portal URL:', 30, yPos + 38);

    pdf.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    pdf.setFont('helvetica', 'bold');
    const trackUrl = 'https://tin.tin.proteantech.in/tan2/servlet/PanStatusTrack';
    pdf.textWithLink(trackUrl, 85, yPos + 38, { url: trackUrl });

    yPos += 62;
  }

  // 7. Payment Summary
  pdf.setFontSize(15);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text('Payment Information', 20, yPos);

  yPos += 10;
  pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  pdf.setLineWidth(0.3);
  pdf.line(20, yPos, pageWidth - 20, yPos);
  yPos += 12;

  const paymentDetails = [
    { l: 'Total Transaction Amount', v: `₹ ${receiptData.amount}.00`, b: true, c: colors.success },
    { l: 'External Transaction ID', v: receiptData.inspay_txid || 'N/A' },
    { l: 'Current Status', v: 'SUCCESS / CHARGED' },
    {
      l: 'Processed At', v: new Date(receiptData.payment_charged_at || receiptData.created_at).toLocaleString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    }
  ];

  paymentDetails.forEach((row, idx) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2]);
    pdf.text(row.l, 30, yPos + (idx * 8));

    if (row.b) pdf.setFontSize(12);
    if (row.c) pdf.setTextColor(row.c[0], row.c[1], row.c[2]);
    else pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);

    pdf.text(`:   ${row.v}`, 85, yPos + (idx * 8));
    pdf.setFontSize(10); // Reset for next loop
  });

  // 8. Security Watermark Background
  pdf.setTextColor(245, 245, 245);
  pdf.setFontSize(60);
  pdf.setFont('helvetica', 'bold');
  pdf.text('VERIFIED RECEIPT', pageWidth / 2, pageHeight / 2 + 30, { align: 'center', angle: 45 });

  // 9. Footer Area
  const footerY = pageHeight - 38;
  pdf.setFillColor(254, 242, 242);
  pdf.rect(0, footerY, pageWidth, 38, 'F');

  pdf.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.setLineWidth(0.6);
  pdf.line(20, footerY + 5, pageWidth - 20, footerY + 5);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text('VIGHNAHARTA ONLINE SERVICES PRIVATE LIMITED', pageWidth / 2, footerY + 13, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2]);
  pdf.text('Official Website: www.vighnahartaonlineservices.com | Support: support@vighnahartaonlineservices.com', pageWidth / 2, footerY + 20, { align: 'center' });

  pdf.setFontSize(7);
  pdf.text('Disclaimer: This is a computer-generated document and is legally valid as a receipt for digital PAN service fees.', pageWidth / 2, footerY + 28, { align: 'center' });
  pdf.text('It does not replace the official NSDL acknowledgement slip for identity purposes unless verified by the department.', pageWidth / 2, footerY + 32, { align: 'center' });

  return Buffer.from(pdf.output('arraybuffer'));
}

function getServiceTypeName(serviceType: string): string {
  const names = {
    'NEW_PAN': 'New PAN Application',
    'PAN_CORRECTION': 'PAN Correction / Update',
    'INCOMPLETE_PAN': 'Incomplete (Resumed) PAN Application'
  };
  return names[serviceType as keyof typeof names] || serviceType;
}