'use client';

import React from 'react';
import { SignUp } from '@clerk/nextjs';
import Navbar from '@/components/Navbar';
import { useTheme } from '@/context/ThemeContext';
import { getClerkConfig } from '@/lib/config/clerk';

export default function SignUpPage() {
  const { theme } = useTheme();
  const clerkConfig = getClerkConfig(theme);
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary">
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-text-secondary">
              Join Eman Clinic management system
            </p>
          </div>
          
          <div className="bg-card-bg rounded-lg shadow-sm border border-border-color p-6">
            <SignUp appearance={clerkConfig.appearance} />
          </div>
        </div>
      </div>
    </div>
  );
} 