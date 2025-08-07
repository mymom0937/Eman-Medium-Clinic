'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="bg-error/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-error/30">
          <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-text-primary mb-4">
          Something went wrong!
        </h2>
        
        <p className="text-text-secondary mb-6">
          We encountered an error while loading this page. Please try again or contact support if the problem persists.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="bg-accent-color text-white px-6 py-2 rounded-lg font-semibold hover:bg-accent-hover transition-colors"
          >
            Try again
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="bg-card-bg text-text-primary px-6 py-2 rounded-lg font-semibold hover:bg-card-bg/80 transition-colors border border-border-color"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
} 