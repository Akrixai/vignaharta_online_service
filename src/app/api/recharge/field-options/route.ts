import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fieldType = searchParams.get('field_type');
    const operatorCode = searchParams.get('operator_code');

    if (!fieldType) {
      return NextResponse.json(
        { success: false, message: 'Field type is required' },
        { status: 400 }
      );
    }

    // Static field options based on field type and operator
    let options: { value: string; label: string }[] = [];

    switch (fieldType.toLowerCase()) {
      case 'city':
        // City options for Torrent Power operators
        if (operatorCode?.includes('TORRENT') || operatorCode?.includes('torrent')) {
          options = [
            { value: 'SURAT', label: 'Surat' },
            { value: 'AHMEDABAD', label: 'Ahmedabad' },
            { value: 'BHIWANDI', label: 'Bhiwandi' },
            { value: 'AGRA', label: 'Agra' },
          ];
        } else {
          // Generic city options
          options = [
            { value: 'MUMBAI', label: 'Mumbai' },
            { value: 'DELHI', label: 'Delhi' },
            { value: 'BANGALORE', label: 'Bangalore' },
            { value: 'HYDERABAD', label: 'Hyderabad' },
            { value: 'CHENNAI', label: 'Chennai' },
            { value: 'KOLKATA', label: 'Kolkata' },
            { value: 'PUNE', label: 'Pune' },
            { value: 'SURAT', label: 'Surat' },
            { value: 'AHMEDABAD', label: 'Ahmedabad' },
            { value: 'JAIPUR', label: 'Jaipur' },
          ];
        }
        break;

      case 'subdivision_code':
        // Subdivision codes for JBVNL - JHARKHAND
        options = [
          { value: '001', label: 'Ranchi Urban - 001' },
          { value: '002', label: 'Ranchi Rural - 002' },
          { value: '003', label: 'Dhanbad - 003' },
          { value: '004', label: 'Jamshedpur - 004' },
          { value: '005', label: 'Bokaro - 005' },
          { value: '006', label: 'Hazaribagh - 006' },
          { value: '007', label: 'Deoghar - 007' },
          { value: '008', label: 'Dumka - 008' },
          { value: '009', label: 'Giridih - 009' },
          { value: '010', label: 'Godda - 010' },
        ];
        break;

      case 'billing_unit':
        // Billing units for MSEDC MAHARASHTRA (typically last 2 digits of consumer number)
        options = [
          { value: '01', label: '01' },
          { value: '02', label: '02' },
          { value: '03', label: '03' },
          { value: '04', label: '04' },
          { value: '05', label: '05' },
          { value: '06', label: '06' },
          { value: '07', label: '07' },
          { value: '08', label: '08' },
          { value: '09', label: '09' },
          { value: '10', label: '10' },
        ];
        break;

      default:
        // No predefined options for this field type
        options = [];
        break;
    }

    return NextResponse.json({
      success: true,
      data: options
    });

  } catch (error: any) {
    console.error('Field Options API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}