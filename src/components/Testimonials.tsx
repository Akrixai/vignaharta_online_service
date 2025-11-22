'use client';

import { useState } from 'react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  location: string;
  rating: number;
  comment: string;
  service: string;
  date: string;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    role: 'Retailer Partner',
    location: 'Mumbai, Maharashtra',
    rating: 5,
    comment: 'Joining Vighnaharta as a retailer was the best business decision. I earn ₹25,000+ monthly commission by helping my community access government services.',
    service: 'Retailer Partnership',
    date: 'January 2024',
    avatar: '👨‍💼'
  },
  {
    id: 2,
    name: 'Priya Sharma',
    role: 'Customer',
    location: 'Pune, Maharashtra',
    rating: 5,
    comment: 'Got my PAN card in just 10 days! The process was smooth, staff was helpful, and I could track everything online. Highly recommended!',
    service: 'PAN Card',
    date: 'February 2024',
    avatar: '👩'
  },
  {
    id: 3,
    name: 'Amit Patel',
    role: 'Retailer Partner',
    location: 'Ahmedabad, Gujarat',
    rating: 5,
    comment: 'The digital platform is very easy to use. Training videos helped me understand everything. Now I serve 50+ customers monthly.',
    service: 'Retailer Partnership',
    date: 'December 2023',
    avatar: '👨'
  }
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const current = testimonials[currentIndex];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real experiences from our satisfied customers and retailer partners across India.
          </p>
        </div>

        {/* Main Testimonial Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl shadow-2xl p-8 md:p-12 border-2 border-red-200">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="text-7xl">{current.avatar}</div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex justify-center md:justify-start mb-3">
                  {[...Array(current.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-2xl">⭐</span>
                  ))}
                </div>
                
                <p className="text-xl text-gray-800 italic mb-6 leading-relaxed">
                  "{current.comment}"
                </p>
                
                <div className="space-y-2">
                  <h4 className="text-2xl font-bold text-gray-900">{current.name}</h4>
                  <p className="text-red-600 font-semibold">{current.role}</p>
                  <p className="text-gray-600">{current.location}</p>
                  <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-gray-500">
                    <span>📋 {current.service}</span>
                    <span>•</span>
                    <span>📅 {current.date}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={prevTestimonial}
              className="bg-red-600 text-white w-12 h-12 rounded-full hover:bg-red-700 transition-colors shadow-lg"
            >
              ←
            </button>
            
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentIndex ? 'bg-red-600 w-8' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={nextTestimonial}
              className="bg-red-600 text-white w-12 h-12 rounded-full hover:bg-red-700 transition-colors shadow-lg"
            >
              →
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-red-600 mb-2">50,000+</div>
            <div className="text-gray-600">Happy Customers</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-red-600 mb-2">10,000+</div>
            <div className="text-gray-600">Service Centers</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-red-600 mb-2">4.8/5</div>
            <div className="text-gray-600">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-red-600 mb-2">100+</div>
            <div className="text-gray-600">Services Available</div>
          </div>
        </div>
      </div>
    </section>
  );
}
