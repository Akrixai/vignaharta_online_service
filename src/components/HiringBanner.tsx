'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HiringBanner() {
  const [hasActiveJobs, setHasActiveJobs] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkActiveJobs();
  }, []);

  const checkActiveJobs = async () => {
    try {
      const response = await fetch('/api/recruitments');
      const data = await response.json();

      if (data.success && data.recruitments && data.recruitments.length > 0) {
        setHasActiveJobs(true);
      }
    } catch (error) {
      console.error('Error checking active jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !hasActiveJobs) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white py-2 px-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xl">💼</span>
          <p className="font-semibold text-sm sm:text-base">
            We&apos;re Hiring! <span className="hidden sm:inline text-green-100">Join our team</span>
          </p>
        </div>
        <Link
          href="/careers"
          className="bg-white text-green-700 hover:bg-green-50 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 shadow hover:shadow-lg flex items-center space-x-1"
        >
          <span>View Jobs</span>
          <span className="text-xs">→</span>
        </Link>
      </div>
    </div>
  );
}
