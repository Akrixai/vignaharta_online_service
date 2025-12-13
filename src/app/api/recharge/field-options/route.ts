import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fieldType = searchParams.get('field_type');
    const operatorCode = searchParams.get('operator_code');

    if (!fieldType) {
      return NextResponse.json(
        { success: false, message: 'field_type is required' },
        { status: 400 }
      );
    }

    let options: { value: string; label: string }[] = [];

    switch (fieldType) {
      case 'city':
        // Cities for Torrent Power operators - using exact format expected by KWIKAPI
        if (operatorCode?.includes('TORRENT')) {
          // Based on operator codes, these are the specific cities for each Torrent Power operator
          if (operatorCode.includes('SURAT') || operatorCode === 'TORRENT_POWER___SURAT_233') {
            options = [
              { value: 'Surat', label: 'Surat' },
            ];
          } else if (operatorCode.includes('AHMEDABAD') || operatorCode === 'TORRENT_POWER___AHMEDABAD_172') {
            options = [
              { value: 'Ahmedabad', label: 'Ahmedabad' },
            ];
          } else if (operatorCode.includes('BHIWANDI') || operatorCode === 'TORRENT_POWER___BHIWANDI_171') {
            options = [
              { value: 'Bhiwandi', label: 'Bhiwandi' },
            ];
          } else if (operatorCode.includes('AGRA') || operatorCode === 'TORRENT_POWER___AGRA_173') {
            options = [
              { value: 'Agra', label: 'Agra' },
            ];
          } else if (operatorCode === 'TORRENT_POWER_170') {
            // Generic Torrent Power - SURAT (operator ID 170 is specifically for Surat)
            options = [
              { value: 'Surat', label: 'Surat' },
            ];
          } else {
            // Fallback for any other Torrent Power operators
            options = [
              { value: 'Surat', label: 'Surat' },
              { value: 'Ahmedabad', label: 'Ahmedabad' },
              { value: 'Bhiwandi', label: 'Bhiwandi' },
              { value: 'Agra', label: 'Agra' },
            ];
          }
        } else {
          // Generic city options for other operators
          options = [
            { value: 'Mumbai', label: 'Mumbai' },
            { value: 'Delhi', label: 'Delhi' },
            { value: 'Bangalore', label: 'Bangalore' },
            { value: 'Hyderabad', label: 'Hyderabad' },
            { value: 'Chennai', label: 'Chennai' },
            { value: 'Kolkata', label: 'Kolkata' },
            { value: 'Pune', label: 'Pune' },
            { value: 'Surat', label: 'Surat' },
            { value: 'Ahmedabad', label: 'Ahmedabad' },
            { value: 'Jaipur', label: 'Jaipur' },
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
        options = Array.from({ length: 100 }, (_, i) => {
          const value = i.toString().padStart(2, '0');
          return { value, label: `Billing Unit ${value}` };
        });
        break;

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid field_type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: options,
    });
  } catch (error: any) {
    console.error('Field Options API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to get field options' },
      { status: 500 }
    );
  }
}