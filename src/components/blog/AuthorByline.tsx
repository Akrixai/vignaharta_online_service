import React from 'react';

interface AuthorBylineProps {
  authorName: string;
  authorTitle?: string;
  publishDate: string;
  lastUpdated?: string;
  readingTime?: string;
}

export default function AuthorByline({
  authorName,
  authorTitle,
  publishDate,
  lastUpdated,
  readingTime
}: AuthorBylineProps) {
  // Format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-4 border-t border-b border-gray-200 my-6">
      <div className="flex items-center">
        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
        <div className="ml-4">
          <p className="font-semibold text-gray-900">{authorName}</p>
          {authorTitle && <p className="text-sm text-gray-600">{authorTitle}</p>}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <span>Published: {formatDate(publishDate)}</span>
        {lastUpdated && <span>Last updated: {formatDate(lastUpdated)}</span>}
        {readingTime && <span>{readingTime} read</span>}
      </div>
    </div>
  );
}