'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ServiceCenter {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email?: string;
  timings: string;
  services: string[];
  rating: number;
  totalReviews: number;
}

// Sample data - in production, this would come from your database
const serviceCenters: ServiceCenter[] = [
  {
    id: '1',
    name: 'Vighnaharta Services - Sangli',
    address: 'Bajarang Nagar,Kupwad M.I.D.C. Kupwad Tal-Miraj,Dist-Sangli Mharashtra 416436 India',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400008',
    phone: '+91 98765 43210',
    email: 'mumbai@vighnaharta.in',
    timings: 'Mon-Sat: 9:00 AM - 7:00 PM',
    services: ['Aadhaar', 'PAN', 'Passport', 'Certificates'],
    rating: 4.8,
    totalReviews: 245
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
    totalReviews: 189
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
    totalReviews: 312
  },
  {
    id: '4',
    name: 'Vighnaharta Services - Bangalore',
    address: 'No. 23, MG Road, Bangalore',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560001',
    phone: '+91 98765 43213',
    email: 'bangalore@vighnaharta.in',
    timings: 'Mon-Sat: 9:00 AM - 7:00 PM',
    services: ['Aadhaar', 'PAN', 'Passport', 'Certificates'],
    rating: 4.6,
    totalReviews: 198
  }
];

const states = ['All States', 'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Rajasthan'];

export default function ServiceCenterMap() {
  const [selectedState, setSelectedState] = useState('All States');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCenter, setSelectedCenter] = useState<ServiceCenter | null>(null);

  const filteredCenters = serviceCenters.filter(center => {
    const matchesState = selectedState === 'All States' || center.state === selectedState;
    const matchesSearch = searchQuery === '' || 
      center.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      center.pincode.includes(searchQuery) ||
      center.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesState && matchesSearch;
  });

  return (
    <section className="py-16 bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Find Service Centers Near You
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            10,000+ service centers across India. Find the nearest one to access government services.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by City or Pincode
              </label>
              <input
                type="text"
                placeholder="Enter city name or pincode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by State
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-center">
          <p className="text-lg text-gray-700">
            Found <span className="font-bold text-red-600">{filteredCenters.length}</span> service centers
            {searchQuery && ` matching "${searchQuery}"`}
            {selectedState !== 'All States' && ` in ${selectedState}`}
          </p>
        </div>

        {/* Service Centers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCenters.map((center) => (
            <div
              key={center.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-200 hover:border-red-500 transform hover:scale-105 cursor-pointer"
              onClick={() => setSelectedCenter(center)}
            >
              <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 text-white">
                <h3 className="font-bold text-lg mb-1">{center.name}</h3>
                <div className="flex items-center text-sm">
                  <span className="mr-2">⭐ {center.rating}</span>
                  <span className="text-red-200">({center.totalReviews} reviews)</span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-3 mb-4">
                  <div className="flex items-start">
                    <span className="text-red-500 mr-2">📍</span>
                    <div className="text-sm text-gray-700">
                      <div>{center.address}</div>
                      <div>{center.city}, {center.state} - {center.pincode}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-red-500 mr-2">📞</span>
                    <a href={`tel:${center.phone}`} className="text-sm text-blue-600 hover:underline">
                      {center.phone}
                    </a>
                  </div>
                  
                  {center.email && (
                    <div className="flex items-center">
                      <span className="text-red-500 mr-2">✉️</span>
                      <a href={`mailto:${center.email}`} className="text-sm text-blue-600 hover:underline">
                        {center.email}
                      </a>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <span className="text-red-500 mr-2">🕒</span>
                    <span className="text-sm text-gray-700">{center.timings}</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Services Available:</div>
                  <div className="flex flex-wrap gap-2">
                    {center.services.map((service, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(center.address + ', ' + center.city)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-center text-sm font-medium"
                  >
                    Get Directions
                  </a>
                  <a
                    href={`tel:${center.phone}`}
                    className="flex-1 border-2 border-red-600 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors text-center text-sm font-medium"
                  >
                    Call Now
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCenters.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No service centers found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search criteria or contact us to find the nearest center.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              Contact Support
            </Link>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Want to Become a Service Center Partner?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Join our network of 10,000+ retailers and start earning by providing government services in your area.
          </p>
          <Link
            href="/register"
            className="inline-block bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 font-bold shadow-lg transform hover:scale-105"
          >
            Register as Retailer Partner
          </Link>
        </div>
      </div>

      {/* Modal for Selected Center */}
      {selectedCenter && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCenter(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{selectedCenter.name}</h3>
                  <div className="flex items-center">
                    <span className="mr-2">⭐ {selectedCenter.rating}</span>
                    <span className="text-red-200">({selectedCenter.totalReviews} reviews)</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCenter(null)}
                  className="text-white hover:text-red-200 text-3xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Address</h4>
                  <p className="text-gray-700">
                    {selectedCenter.address}<br />
                    {selectedCenter.city}, {selectedCenter.state} - {selectedCenter.pincode}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Contact</h4>
                  <p className="text-gray-700">
                    Phone: <a href={`tel:${selectedCenter.phone}`} className="text-blue-600 hover:underline">{selectedCenter.phone}</a><br />
                    {selectedCenter.email && (
                      <>Email: <a href={`mailto:${selectedCenter.email}`} className="text-blue-600 hover:underline">{selectedCenter.email}</a></>
                    )}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Timings</h4>
                  <p className="text-gray-700">{selectedCenter.timings}</p>
                </div>
                
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Services Available</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCenter.services.map((service, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex gap-4">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedCenter.address + ', ' + selectedCenter.city)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors text-center font-semibold"
                >
                  Get Directions
                </a>
                <a
                  href={`tel:${selectedCenter.phone}`}
                  className="flex-1 border-2 border-red-600 text-red-600 px-6 py-3 rounded-lg hover:bg-red-50 transition-colors text-center font-semibold"
                >
                  Call Now
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
