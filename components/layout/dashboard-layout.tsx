'use client';

import React from 'react';
import { Sidebar } from './sidebar';
import Navbar from '../Navbar';
import { ToastContainer } from '@/components/ui/toast';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  userRole: string;
  userName?: string;
}

export function DashboardLayout({ 
  children, 
  title, 
  userRole, 
  userName 
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen w-full bg-gray-100">
      {/* Sidebar */}
      <div className="sticky top-0 h-screen">
        <Sidebar userRole={userRole} title={title} userName={userName} />
      </div>
      
       {/* Navbar */}
        <div className="sticky top-0 z-40">
          <Navbar />
        </div>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-24 lg:ml-54">
        <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6" style={{ marginTop: '5rem', paddingTop: '5rem' }}>
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
      
      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
} 