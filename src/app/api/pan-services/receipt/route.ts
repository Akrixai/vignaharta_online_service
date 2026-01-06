import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import jsPDF from 'jspdf';

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

  // Color Palette
  const colors = {
    primary: [220, 38, 38], // Red
    secondary: [37, 99, 235], // Blue
    success: [16, 185, 129], // Green
    background: [249, 250, 251], // Light Gray
    text: [31, 41, 55], // Dark Gray
    lightText: [107, 114, 128] // Medium Gray
  };

  // 1. Header Section
  pdf.setFillColor(254, 242, 242); // Very light red
  pdf.rect(0, 0, pageWidth, 40, 'F');

  // Company Logo/Name
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text('VIGHNAHARTA', pageWidth / 2, 18, { align: 'center' });

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2]);
  pdf.text('ONLINE SERVICES PRIVATE LIMITED', pageWidth / 2, 24, { align: 'center', charSpace: 2 });

  pdf.setFontSize(9);
  pdf.text('Official Digital Service Partner', pageWidth / 2, 32, { align: 'center' });

  // 2. Receipt Title & Status
  let yPos = 55;
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('SERVICE PAYMENT RECEIPT', 20, yPos);

  // Success Badge
  pdf.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.roundedRect(pageWidth - 65, yPos - 8, 45, 12, 6, 6, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.text('✓ SUCCESSFUL', pageWidth - 42.5, yPos, { align: 'center' });

  yPos += 15;

  // 3. NSDL Branding Section
  pdf.setFillColor(243, 244, 246);
  pdf.roundedRect(20, yPos, pageWidth - 40, 25, 3, 3, 'F');

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  pdf.text('OFFICIAL NSDL e-GOV PORTAL PARTNER', 30, yPos + 10);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2]);
  pdf.text('Securely processed via NSDL (Protean) Digital Infrastructure', 30, yPos + 18);

  // NSDL Initials on the right
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(200, 200, 200);
  pdf.text('NSDL', pageWidth - 45, yPos + 15, { align: 'center' });

  yPos += 35;

  // 4. Main Service Details
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text('Service Information', 20, yPos);

  yPos += 8;
  pdf.setDrawColor(229, 231, 235);
  pdf.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;

  const serviceRows = [
    { label: 'Receipt ID', value: receiptData.receipt_id },
    { label: 'Order ID', value: receiptData.order_id },
    { label: 'Service Type', value: getServiceTypeName(receiptData.service_type) },
    { label: 'Application Mode', value: receiptData.mode },
    { label: 'Applicant Mobile', value: receiptData.mobile_number }
  ];

  pdf.setFontSize(10);
  serviceRows.forEach(row => {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2]);
    pdf.text(row.label, 20, yPos);

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    pdf.text(row.value, 70, yPos);
    yPos += 8;
  });

  yPos += 10;

  // 5. Tracking Section (If successful)
  if (receiptData.acknowledgement_number && receiptData.acknowledgement_number !== 'Order is under process') {
    pdf.setFillColor(239, 246, 255); // Light blue
    pdf.roundedRect(20, yPos, pageWidth - 40, 45, 4, 4, 'F');

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    pdf.text('Tracking & Acknowledgement', 35, yPos + 12);

    pdf.setFontSize(10);
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    pdf.text('Ack Number:', 35, yPos + 22);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text(receiptData.acknowledgement_number, 70, yPos + 22);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2]);
    pdf.text('You can track your PAN status on NSDL (Protean) portal:', 35, yPos + 32);

    pdf.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    pdf.setFont('helvetica', 'bold');
    const trackUrl = 'https://tin.tin.proteantech.in/tan2/servlet/PanStatusTrack';
    pdf.textWithLink(trackUrl, 35, yPos + 38, { url: trackUrl });

    yPos += 55;
  }

  // 6. Payment Information
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text('Payment Summary', 20, yPos);

  yPos += 8;
  pdf.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;

  const paymentRows = [
    { label: 'Amount Paid', value: `INR ${receiptData.amount}.00`, bold: true, color: colors.success },
    { label: 'Payment Status', value: receiptData.payment_status },
    { label: 'Payment Date', value: new Date(receiptData.payment_charged_at || receiptData.created_at).toLocaleString() },
    { label: 'Transaction ID', value: receiptData.inspay_txid || 'N/A' }
  ];

  paymentRows.forEach(row => {
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2]);
    pdf.text(row.label, 20, yPos);

    if (row.bold) pdf.setFont('helvetica', 'bold');
    if (row.color) pdf.setTextColor(row.color[0], row.color[1], row.color[2]);
    else pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);

    pdf.text(row.value, 70, yPos);
    yPos += 8;
  });

  // 7. Footer Section
  const footerY = 265;
  pdf.setFillColor(249, 250, 251);
  pdf.rect(0, footerY, pageWidth, 297 - footerY, 'F');

  pdf.setDrawColor(209, 213, 219);
  pdf.line(20, footerY + 5, pageWidth - 20, footerY + 5);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(receiptData.company.name, pageWidth / 2, footerY + 12, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2]);
  pdf.text('www.vighnahartaonlineservices.com | support@vighnahartaonlineservices.com', pageWidth / 2, footerY + 17, { align: 'center' });

  pdf.setFontSize(7);
  pdf.text('This is a computer-generated digital receipt and does not require a physical signature.', pageWidth / 2, footerY + 24, { align: 'center' });

  return Buffer.from(pdf.output('arraybuffer'));
}

function getServiceTypeName(serviceType: string): string {
  const names = {
    'NEW_PAN': 'New PAN Application',
    'PAN_CORRECTION': 'PAN Correction',
    'INCOMPLETE_PAN': 'Incomplete PAN'
  };
  return names[serviceType as keyof typeof names] || serviceType;
}