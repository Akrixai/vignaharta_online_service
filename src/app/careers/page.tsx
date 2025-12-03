'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Recruitment {
  id: string;
  job_title: string;
  job_description: string;
  department: string;
  location: string;
  employment_type: string;
  experience_required: string;
  qualifications: string;
  salary_range: string;
  google_form_url: string;
  posted_date: string;
  closing_date: string;
  is_active: boolean;
  views_count: number;
}

export default function CareersPage() {
  const router = useRouter();
  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Recruitment | null>(null);

  useEffect(() => {
    fetchRecruitments();
  }, []);

  const fetchRecruitments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/recruitments');
      const data = await response.json();

      if (data.success) {
        setRecruitments(data.recruitments || []);
      }
    } catch (err) {
      console.error('Error fetching recruitments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (job: Recruitment) => {
    // Open Google Form in new tab
    window.open(job.google_form_url, '_blank');
  };

  const formatEmploymentType = (type: string) => {
    return type.replace('_', ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Join Our Team
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Be part of a dynamic team transforming digital services in India
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* No Jobs Available */}
        {!loading && recruitments.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">💼</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Open Positions</h2>
            <p className="text-gray-600">
              We don&apos;t have any open positions at the moment. Please check back later!
            </p>
          </div>
        )}

        {/* Job Listings */}
        {!loading && recruitments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recruitments.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden cursor-pointer"
                onClick={() => setSelectedJob(job)}
              >
                <div className="p-6">
                  {/* Job Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {job.job_title}
                  </h3>

                  {/* Department & Location */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.department && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        🏢 {job.department}
                      </span>
                    )}
                    {job.location && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        📍 {job.location}
                      </span>
                    )}
                  </div>

                  {/* Employment Type */}
                  <div className="mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                      {formatEmploymentType(job.employment_type)}
                    </span>
                  </div>

                  {/* Description Preview */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {job.job_description}
                  </p>

                  {/* Experience & Salary */}
                  <div className="space-y-2 mb-4">
                    {job.experience_required && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">💼</span>
                        <span>{job.experience_required}</span>
                      </div>
                    )}
                    {job.salary_range && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">💰</span>
                        <span>{job.salary_range}</span>
                      </div>
                    )}
                  </div>

                  {/* Apply Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApply(job);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Apply Now
                  </button>

                  {/* Posted Date */}
                  <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
                    Posted on {formatDate(job.posted_date)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Job Detail Modal */}
        {selectedJob && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedJob(null)}
          >
            <div
              className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      {selectedJob.job_title}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.department && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          🏢 {selectedJob.department}
                        </span>
                      )}
                      {selectedJob.location && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          📍 {selectedJob.location}
                        </span>
                      )}
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                        {formatEmploymentType(selectedJob.employment_type)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {/* Job Details */}
                <div className="space-y-6">
                  {/* Experience & Salary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedJob.experience_required && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Experience Required</div>
                        <div className="font-semibold text-gray-900">{selectedJob.experience_required}</div>
                      </div>
                    )}
                    {selectedJob.salary_range && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Salary Range</div>
                        <div className="font-semibold text-gray-900">{selectedJob.salary_range}</div>
                      </div>
                    )}
                  </div>

                  {/* Job Description */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Job Description</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.job_description}</p>
                  </div>

                  {/* Qualifications */}
                  {selectedJob.qualifications && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Qualifications</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.qualifications}</p>
                    </div>
                  )}

                  {/* Closing Date */}
                  {selectedJob.closing_date && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center text-yellow-800">
                        <span className="mr-2">⏰</span>
                        <span className="font-semibold">Application Deadline: {formatDate(selectedJob.closing_date)}</span>
                      </div>
                    </div>
                  )}

                  {/* Apply Button */}
                  <button
                    onClick={() => handleApply(selectedJob)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 text-lg"
                  >
                    Apply Now via Google Form
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
