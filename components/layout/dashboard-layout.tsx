"use client";

import React from "react";
import { Sidebar } from "./sidebar";
import Navbar from "../Navbar";
import { ToastContainer } from "@/components/ui/toast";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

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
  userName,
}: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen w-full bg-background overflow-x-hidden">
        {/* Sidebar */}
        <div className="sticky top-0 h-screen">
          <Sidebar userRole={userRole} title={title} userName={userName} />
        </div>
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col ml-24 lg:ml-54">
          {/* Navbar */}
          <div className="z-40">
            <Navbar />
            {/* Spacer to offset the fixed navbar height */}
            <div aria-hidden className="h-16 md:h-20" />
          </div>
          <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6">
            <div className="max-w-full">{children}</div>
          </main>
        </div>

        {/* Toast Notifications */}
        <ToastContainer />
      </div>
    </ProtectedRoute>
  );
}
