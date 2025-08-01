'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useRealTimeAdvertisements } from '@/hooks/useRealTimeData';

interface Advertisement {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  link_url: string | null;
  position: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  click_count: number;
}

interface AdvertisementCarouselProps {
  position: 'header' | 'footer' | 'sidebar' | 'dashboard' | 'popup';
  className?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showControls?: boolean;
  showIndicators?: boolean;
  height?: string;
}

export default function AdvertisementCarousel({
  position,
  className = '',
  autoPlay = true,
  autoPlayInterval = 5000,
  showControls = true,
  showIndicators = true,
  height = 'h-48'
}: AdvertisementCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Get advertisements for this position
  const { data: advertisements, loading } = useRealTimeAdvertisements(position, true);

  // Filter active advertisements that are within date range
  const activeAds = advertisements?.filter(ad => {
    if (!ad.is_active) return false;
    
    const now = new Date();
    const startDate = new Date(ad.start_date);
    const endDate = ad.end_date ? new Date(ad.end_date) : null;
    
    if (startDate > now) return false;
    if (endDate && endDate < now) return false;
    
    return true;
  }) || [];

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || activeAds.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === activeAds.length - 1 ? 0 : prevIndex + 1
      );
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, activeAds.length, isHovered]);

  // Reset index if it's out of bounds
  useEffect(() => {
    if (currentIndex >= activeAds.length && activeAds.length > 0) {
      setCurrentIndex(0);
    }
  }, [activeAds.length, currentIndex]);

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? activeAds.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === activeAds.length - 1 ? 0 : currentIndex + 1);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const handleAdClick = async (ad: Advertisement) => {
    // Track click
    try {
      await fetch('/api/advertisements/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: ad.id }),
      });
    } catch (error) {
    }

    // Open link if provided
    if (ad.link_url) {
      window.open(ad.link_url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className={`${height} ${className} bg-gray-200 animate-pulse rounded-lg flex items-center justify-center`}>
        <div className="text-gray-500">Loading advertisements...</div>
      </div>
    );
  }

  if (activeAds.length === 0) {
    return null; // Don't render anything if no active ads
  }

  const currentAd = activeAds[currentIndex];

  return (
    <div 
      className={`relative ${height} ${className} overflow-hidden rounded-lg shadow-lg group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Advertisement Image/Content */}
      <div 
        className="w-full h-full cursor-pointer relative"
        onClick={() => handleAdClick(currentAd)}
      >
        <img
          src={currentAd.image_url}
          alt={currentAd.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Overlay with content */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="text-lg font-semibold mb-1 line-clamp-1">{currentAd.title}</h3>
            {currentAd.description && (
              <p className="text-sm opacity-90 line-clamp-2">{currentAd.description}</p>
            )}
            {currentAd.link_url && (
              <div className="flex items-center mt-2 text-xs opacity-75">
                <ExternalLink className="w-3 h-3 mr-1" />
                Click to learn more
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      {showControls && activeAds.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && activeAds.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {activeAds.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(index);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-white' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}

      {/* Ad Counter */}
      {activeAds.length > 1 && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {currentIndex + 1} / {activeAds.length}
        </div>
      )}
    </div>
  );
}
