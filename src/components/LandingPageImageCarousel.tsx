'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface LandingPageImageCarouselProps {
  className?: string;
}

// Fallback images for when no database images are available
const fallbackImages = [
  {
    id: 'fallback-1',
    image_url: '/images/government-services-1.jpg',
    title: 'Digital India Services',
    is_active: true,
    alt_text: 'Indian citizen accessing digital government services online through Vighnaharta portal'
  },
  {
    id: 'fallback-2', 
    image_url: '/images/government-services-2.jpg',
    title: 'Online Government Portal',
    is_active: true,
    alt_text: 'Government service portal interface with document processing and secure authentication'
  },
  {
    id: 'fallback-3',
    image_url: '/images/government-services-3.jpg', 
    title: 'Secure Digital Services',
    is_active: true,
    alt_text: 'Secure digital government services with encryption protection and data privacy'
  }
];

export default function LandingPageImageCarousel({ className = '' }: LandingPageImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [advertisements, setAdvertisements] = useState(fallbackImages);
  const [isLoading, setIsLoading] = useState(true);

  // Load advertisements from database
  useEffect(() => {
    const loadAdvertisements = async () => {
      try {
        const response = await fetch('/api/login-advertisements');
        if (response.ok) {
          const data = await response.json();
          if (data.advertisements && data.advertisements.length > 0) {
            // Filter only advertisements with images
            const imageAds = data.advertisements.filter((ad: any) => 
              ad.is_active && ad.image_url && ad.image_url.trim() !== ''
            );

            if (imageAds.length > 0) {
              setAdvertisements(imageAds);
            }
          }
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    loadAdvertisements();

    // Set up real-time subscription
    const channel = supabase
      .channel('landing-advertisements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'login_advertisements'
        },
        () => {
          loadAdvertisements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % advertisements.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [advertisements.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % advertisements.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + advertisements.length) % advertisements.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (isLoading) {
    return (
      <div className={`${className} relative overflow-hidden bg-gradient-to-r from-red-100 to-orange-100`}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600"></div>
        </div>
      </div>
    );
  }

  const currentAd = advertisements[currentIndex] || fallbackImages[0];

  return (
    <div className={`${className} relative overflow-hidden bg-gray-100 group`}>
      {/* Main Image */}
      <div className="relative h-full w-full">
        {currentAd.image_url ? (
          <Image
            src={currentAd.image_url}
            alt={currentAd.alt_text || currentAd.title || 'Government Service'}
            fill
            sizes="100vw"
            className="object-cover transition-all duration-700 ease-in-out"
            priority={currentIndex === 0}
            onError={(e) => {
              // Fallback to gradient background on error
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          // Fallback gradient background
          <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 to-red-600">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-6xl opacity-30">🏛️</div>
            </div>
          </div>
        )}

        {/* Overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10"></div>

        {/* Navigation Arrows */}
        {advertisements.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full p-3 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full p-3 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </>
        )}

        {/* Dot Indicators */}
        {advertisements.length > 1 && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
            {advertisements.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-white scale-125 shadow-lg'
                    : 'bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
