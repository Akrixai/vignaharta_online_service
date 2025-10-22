import React from 'react';
import Link from 'next/link';

interface InternalLinkProps {
  href: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function InternalLink({ 
  href, 
  title, 
  children, 
  className = '' 
}: InternalLinkProps) {
  return (
    <Link 
      href={href}
      title={title}
      className={`text-red-600 hover:text-red-800 font-medium underline hover:no-underline ${className}`}
    >
      {children}
    </Link>
  );
}