import { NextRequest, NextResponse } from 'next/server';

// Sample service center data - in production, this would come from database
const serviceCenters = [
  {
    id: '1',
    name: 'Vighnaharta Services - Mumbai Central',
    address: 'Shop No. 12, Ground Floor, Mumbai Central',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400008',
    phone: '+91 98765 43210',
    email: 'mumbai@vighnaharta.in',
    timings: 'Mon-Sat: 9:00 AM - 7:00 PM',
    services: ['Aadhaar', 'PAN', 'Passport', 'Certificates'],
    rating: 4.8,
    totalReviews: 245,
    latitude: 18.9667,
    longitude: 72.8167
  },
  {
    id: '2',
    name: 'Vighnaharta Services - Pune',
    address: 'Office No. 5, FC Road, Pune',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411004',
    phone: '+91 98765 43211',
    email: 'pune@vighnaharta.in',
    timings: 'Mon-Sat: 9:00 AM - 7:00 PM',
    services: ['Aadhaar', 'PAN', 'Voter ID', 'Certificates'],
    rating: 4.7,
    totalReviews: 189,
    latitude: 18.5204,
    longitude: 73.8567
  },
  {
    id: '3',
    name: 'Vighnaharta Services - Delhi',
    address: 'Shop No. 45, Connaught Place, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    phone: '+91 98765 43212',
    email: 'delhi@vighnaharta.in',
    timings: 'Mon-Sat: 9:00 AM - 7:00 PM',
    services: ['Aadhaar', 'PAN', 'Passport', 'Driving License'],
    rating: 4.9,
    totalReviews: 312,
    latitude: 28.6139,
    longitude: 77.2090
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const city = searchParams.get('city');
    const pincode = searchParams.get('pincode');

    let filtered = serviceCenters;

    if (state && state !== 'All States') {
      filtered = filtered.filter(center => center.state === state);
    }

    if (city) {
      filtered = filtered.filter(center => 
        center.city.toLowerCase().includes(city.toLowerCase())
      );
    }

    if (pincode) {
      filtered = filtered.filter(center => center.pincode.includes(pincode));
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      total: filtered.length
    });
  } catch (error) {
    console.error('Error fetching service centers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service centers' },
      { status: 500 }
    );
  }
}
