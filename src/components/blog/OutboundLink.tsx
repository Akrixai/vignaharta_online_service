import React from 'react';

interface OutboundLinkProps {
  href: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function OutboundLink({ 
  href, 
  title, 
  children, 
  className = '' 
}: OutboundLinkProps) {
  return (
    <a 
      href={href}
      title={title}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-blue-600 hover:text-blue-800 font-medium underline hover:no-underline ${className}`}
    >
      {children}
      <span className="ml-1 text-xs align-top">↗</span>
    </a>
  );
}