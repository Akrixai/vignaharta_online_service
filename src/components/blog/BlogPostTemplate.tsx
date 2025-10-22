import React from 'react';
import AuthorByline from './AuthorByline';
import TLDRSummary from './TLDRSummary';
import InternalLink from './InternalLink';
import OutboundLink from './OutboundLink';

interface BlogPostTemplateProps {
  title: string;
  description: string;
  authorName: string;
  authorTitle?: string;
  publishDate: string;
  lastUpdated?: string;
  readingTime?: string;
  tldrSummary?: string;
  tldrPoints?: string[];
  children: React.ReactNode;
  keywords?: string[];
}

export default function BlogPostTemplate({
  title,
  description,
  authorName,
  authorTitle,
  publishDate,
  lastUpdated,
  readingTime,
  tldrSummary,
  tldrPoints,
  children,
  keywords
}: BlogPostTemplateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Article Header */}
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {title}
          </h1>
          
          {description && (
            <p className="text-xl text-gray-600 mb-6">
              {description}
            </p>
          )}
          
          {/* Author and Date Information */}
          <AuthorByline 
            authorName={authorName}
            authorTitle={authorTitle}
            publishDate={publishDate}
            lastUpdated={lastUpdated}
            readingTime={readingTime}
          />
          
          {/* TL;DR Summary */}
          {tldrSummary && (
            <TLDRSummary 
              summary={tldrSummary}
              points={tldrPoints}
            />
          )}
        </header>
        
        {/* Article Content */}
        <article className="bg-white rounded-xl shadow-lg p-8">
          {children}
        </article>
        
        {/* Article Footer */}
        <footer className="mt-8">
          {keywords && keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {keywords.map((keyword, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </footer>
      </main>
    </div>
  );
}