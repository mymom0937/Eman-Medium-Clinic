'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="bg-card-bg rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-border-color">
          <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
          </svg>
        </div>
        
        <h1 className="text-6xl font-bold text-text-primary mb-4">404</h1>
        
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          Page not found
        </h2>
        
        <p className="text-text-secondary mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="bg-accent-color text-white px-6 py-2 rounded-lg font-semibold hover:bg-accent-hover transition-colors"
          >
            Go home
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="bg-card-bg text-text-primary px-6 py-2 rounded-lg font-semibold hover:bg-card-bg/80 transition-colors border border-border-color"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
} 