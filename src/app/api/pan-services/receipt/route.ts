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
          mobile_number,
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
        mobile: panService.users.mobile_number,
        role: panService.users.role
      },
      
      // Company Information
      company: {
        name: 'Vighnaharta Online Services',
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
          'Content-Disposition': `attachment; filename="PAN_Receipt_${panService.order_id}.pdf"`
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
  const pdf = new jsPDF();
  
  // Set font
  pdf.setFont('helvetica');
  
  // Header
  pdf.setFontSize(20);
  pdf.setTextColor(220, 38, 38); // Red color
  pdf.text(receiptData.company.name, 105, 20, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text('PAN Services Provider', 105, 30, { align: 'center' });
  
  pdf.setFontSize(16);
  pdf.text('Service Receipt', 105, 45, { align: 'center' });
  
  // Success badge
  pdf.setFontSize(10);
  pdf.setFillColor(16, 185, 129); // Green
  pdf.setTextColor(255, 255, 255);
  pdf.roundedRect(85, 50, 40, 8, 3, 3, 'F');
  pdf.text('✓ COMPLETED', 105, 56, { align: 'center' });
  
  // Reset color
  pdf.setTextColor(0, 0, 0);
  
  let yPos = 75;
  
  // Service Details Section
  pdf.setFontSize(14);
  pdf.setTextColor(220, 38, 38);
  pdf.text('Service Details', 20, yPos);
  yPos += 10;
  
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  
  const serviceDetails = [
    ['Receipt ID:', receiptData.receipt_id],
    ['Order ID:', receiptData.order_id],
    ['Service Type:', getServiceTypeName(receiptData.service_type)],
    ['Mode:', receiptData.mode],
    ['Mobile Number:', receiptData.mobile_number],
    ['Amount Paid:', `₹${receiptData.amount}`]
  ];
  
  serviceDetails.forEach(([label, value]) => {
    pdf.text(label, 20, yPos);
    pdf.text(value, 80, yPos);
    yPos += 7;
  });
  
  yPos += 10;
  
  // Tracking Information (if available)
  if (receiptData.acknowledgement_number && receiptData.acknowledgement_number !== 'Order is under process') {
    pdf.setFontSize(14);
    pdf.setTextColor(220, 38, 38);
    pdf.text('Tracking Information', 20, yPos);
    yPos += 10;
    
    // Tracking box
    pdf.setFillColor(243, 244, 246); // Light gray
    pdf.roundedRect(20, yPos - 5, 170, 25, 3, 3, 'F');
    
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text('PAN Application Acknowledgement Number', 105, yPos + 3, { align: 'center' });
    
    pdf.setFontSize(14);
    pdf.setTextColor(220, 38, 38);
    pdf.text(receiptData.acknowledgement_number, 105, yPos + 12, { align: 'center' });
    
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Use this number to track your PAN application status', 105, yPos + 20, { align: 'center' });
    
    yPos += 35;
  }
  
  // Payment Information
  pdf.setFontSize(14);
  pdf.setTextColor(220, 38, 38);
  pdf.text('Payment Information', 20, yPos);
  yPos += 10;
  
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  
  const paymentDetails = [
    ['Payment Status:', receiptData.payment_status],
    ['Payment Date:', new Date(receiptData.payment_charged_at).toLocaleString()],
    ['Transaction ID:', receiptData.inspay_txid]
  ];
  
  paymentDetails.forEach(([label, value]) => {
    pdf.text(label, 20, yPos);
    pdf.text(value, 80, yPos);
    yPos += 7;
  });
  
  yPos += 10;
  
  // Customer Information
  pdf.setFontSize(14);
  pdf.setTextColor(220, 38, 38);
  pdf.text('Customer Information', 20, yPos);
  yPos += 10;
  
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  
  const customerDetails = [
    ['Name:', receiptData.user.name],
    ['Email:', receiptData.user.email],
    ['Mobile:', receiptData.user.mobile]
  ];
  
  customerDetails.forEach(([label, value]) => {
    pdf.text(label, 20, yPos);
    pdf.text(value, 80, yPos);
    yPos += 7;
  });
  
  yPos += 10;
  
  // Service Timeline
  pdf.setFontSize(14);
  pdf.setTextColor(220, 38, 38);
  pdf.text('Service Timeline', 20, yPos);
  yPos += 10;
  
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  
  const timelineDetails = [
    ['Application Date:', new Date(receiptData.created_at).toLocaleString()],
    ['Completion Date:', new Date(receiptData.completed_at).toLocaleString()],
    ['Receipt Generated:', new Date(receiptData.receipt_generated_at).toLocaleString()]
  ];
  
  timelineDetails.forEach(([label, value]) => {
    pdf.text(label, 20, yPos);
    pdf.text(value, 80, yPos);
    yPos += 7;
  });
  
  // Footer
  yPos = 270; // Fixed position for footer
  pdf.setDrawColor(200, 200, 200);
  pdf.line(20, yPos - 5, 190, yPos - 5);
  
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text(receiptData.company.name, 105, yPos, { align: 'center' });
  pdf.text(`Website: ${receiptData.company.website}`, 105, yPos + 7, { align: 'center' });
  pdf.text(`Support: ${receiptData.company.support_email}`, 105, yPos + 14, { align: 'center' });
  
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('This is a computer-generated receipt. No signature required.', 105, yPos + 25, { align: 'center' });
  
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