'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function FeedbackTestPage() {
  return (
    <DashboardLayout title="Feedback Test" userRole="SUPER_ADMIN" userName="Test User">
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Feedback Test Page</h2>
        <p className="text-text-secondary">This is a test page to check if routing works.</p>
        <p className="text-text-secondary mt-2">If you can see this, the basic components are working.</p>
      </div>
    </DashboardLayout>
  );
}
