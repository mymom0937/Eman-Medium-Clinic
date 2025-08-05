'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed top-20 left-24 lg:left-54 right-0 bottom-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - Only covers main content area, not sidebar/navbar */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* Modal Content */}
      <div className={cn(
        'relative bg-card-bg rounded-lg shadow-2xl transform transition-all mx-4 border border-border-color max-h-[calc(100vh-6rem)] overflow-y-auto',
        sizeClasses[size]
      )}>
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-card-bg z-10">
            <h3 className="text-lg font-medium text-text-primary">{title}</h3>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-secondary transition-colors"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
} 