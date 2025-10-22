import React from 'react';

interface TLDRSummaryProps {
  summary: string;
  points?: string[];
}

export default function TLDRSummary({ summary, points }: TLDRSummaryProps) {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg my-8">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-blue-500 font-bold text-lg">TL;DR</span>
        </div>
        <div className="ml-4">
          <p className="text-gray-700 mb-3">{summary}</p>
          {points && points.length > 0 && (
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              {points.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}