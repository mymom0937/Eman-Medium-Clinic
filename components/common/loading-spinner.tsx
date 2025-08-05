import React from 'react';
import { RingLoader } from 'react-spinners';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text = 'Loading...',
  className = '',
}) => {
  const sizeMap = {
    sm: 40,
    md: 60,
    lg: 80,
    xl: 100,
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <RingLoader
        color="#e15b64"
        size={sizeMap[size]}
        aria-label="ring-loading"
      />
      {text && (
        <p className="text-text-secondary font-medium animate-pulse">{text}</p>
      )}
    </div>
  );
};

// Full screen loading component
export const FullScreenLoader: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
};

// Page loading component
export const PageLoader: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}; 