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
        users!pan_services_user_id_fkey(
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

  // 1. Header Background & Accents (0-45mm)
  pdf.setFillColor(254, 242, 242);
  pdf.rect(0, 0, pageWidth, 45, 'F');
  pdf.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.setLineWidth(0.8);
  pdf.line(0, 45, pageWidth, 45);

  // 1.5 Background Watermark (Draw early so it's behind cards)
  pdf.setTextColor(250, 250, 250); // Extremely subtle light gray
  pdf.setFontSize(60);
  pdf.setFont('helvetica', 'bold');
  pdf.text('VERIFIED RECEIPT', pageWidth / 2, pageHeight / 2 + 20, { align: 'center', angle: 45 });

  // 2. Logos & Company Info
  if (vignahartaLogo) {
    pdf.addImage(vignahartaLogo, 'PNG', 15, 10, 22, 22);
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text('VIGHNAHARTA', 42, 22);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2]);
  pdf.text('ONLINE SERVICES PRIVATE LIMITED', 42, 28, { charSpace: 0.5 });

  if (nsdlLogo) {
    // Add white background box for NSDL logo to fix checkered/transparent issues
    pdf.setFillColor(255, 255, 255);
    pdf.rect(pageWidth - 56, 10, 42, 22, 'F');
    pdf.addImage(nsdlLogo, 'PNG', pageWidth - 55, 11, 40, 20);
  }

  // 3. Status Badge & Receipt Header
  let yPos = 60;
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('SERVICE PAYMENT RECEIPT', 20, yPos);

  // Successful Badge
  pdf.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.roundedRect(pageWidth - 65, yPos - 8, 45, 11, 2, 2, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('✓ SUCCESSFUL', pageWidth - 42.5, yPos - 0.5, { align: 'center' });

  yPos += 12;

  // 4. Partner Branding Banner
  pdf.setFillColor(243, 244, 246);
  pdf.roundedRect(20, yPos, pageWidth - 40, 15, 2, 2, 'F');

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  pdf.text('OFFICIAL NSDL e-GOV (PROTEAN) AUTHORIZED PORTAL PARTNER', pageWidth / 2, yPos + 9, { align: 'center' });

  yPos += 28;

  // 5. Service Information Card
  pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  pdf.setLineWidth(0.25);
  pdf.roundedRect(20, yPos, pageWidth - 40, 52, 3, 3, 'S');

  pdf.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
  pdf.rect(21, yPos + 0.5, pageWidth - 42, 9, 'F');

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text('Application & Service Details', 26, yPos + 7);

  yPos += 18;
  pdf.setFontSize(9.5);

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
    pdf.text(row.l, 28, yPos + (idx * 7));

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    pdf.text(`:   ${row.v}`, 70, yPos + (idx * 7));
  });

  yPos += 42;

  // 6. Tracking Section (Conditional)
  if (receiptData.acknowledgement_number && receiptData.acknowledgement_number !== 'Order is under process') {
    pdf.setFillColor(239, 246, 255); // Blue-50
    pdf.setDrawColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(20, yPos, pageWidth - 40, 42, 3, 3, 'FD');

    pdf.setFontSize(13);
    pdf.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    pdf.text('Digital Acknowledgement (Ack)', 28, yPos + 10);

    pdf.setFontSize(10);
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    pdf.text('Ack Number:', 28, yPos + 22);

    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(receiptData.acknowledgement_number, 78, yPos + 22);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2]);
    pdf.text('Track Status:', 28, yPos + 33);

    pdf.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    pdf.setFont('helvetica', 'bold');
    const trackUrl = 'https://tin.tin.proteantech.in/tan2/servlet/PanStatusTrack';
    pdf.textWithLink('Click here to track on official NSDL portal', 78, yPos + 33, { url: trackUrl });

    yPos += 52;
  } else {
    yPos += 5; // Minimal gap if no tracking
  }

  // 7. Payment Summary
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text('Payment Information', 20, yPos);

  yPos += 6;
  pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  pdf.setLineWidth(0.2);
  pdf.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;

  const paymentDetails = [
    { l: 'Total Service Fee', v: `₹ ${receiptData.amount}.00`, b: true, c: colors.success },
    { l: 'Transaction ID', v: receiptData.inspay_txid || 'N/A' },
    { l: 'Payment Status', v: 'SUCCESS / CHARGED' },
    {
      l: 'Date & Time', v: new Date(receiptData.payment_charged_at || receiptData.created_at).toLocaleString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    }
  ];

  paymentDetails.forEach((row, idx) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2]);
    pdf.text(row.l, 28, yPos + (idx * 7));

    if (row.b) pdf.setFontSize(11);
    if (row.c) pdf.setTextColor(row.c[0], row.c[1], row.c[2]);
    else pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);

    pdf.text(`:   ${row.v}`, 75, yPos + (idx * 7));
    pdf.setFontSize(9.5); // Reset
  });

  // 9. Footer Area
  const footerHeight = 35;
  const footerY = pageHeight - footerHeight;
  pdf.setFillColor(254, 242, 242);
  pdf.rect(0, footerY, pageWidth, footerHeight, 'F');

  pdf.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.setLineWidth(0.5);
  pdf.line(20, footerY + 4, pageWidth - 20, footerY + 4);

  pdf.setFontSize(9.5);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text('VIGHNAHARTA ONLINE SERVICES PRIVATE LIMITED', pageWidth / 2, footerY + 11, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2]);
  pdf.text('Official Website: www.vighnahartaonlineservices.com | Support: support@vighnahartaonlineservices.com', pageWidth / 2, footerY + 20, { align: 'center' });

  pdf.setFontSize(6.5);
  pdf.text('Disclaimer: This is a computer-generated digital receipt and does not require a physical signature.', pageWidth / 2, footerY + 24, { align: 'center' });
  pdf.text('This receipt confirms the service fee payment only. The PAN card will be issued after official NSDL verification.', pageWidth / 2, footerY + 28, { align: 'center' });

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