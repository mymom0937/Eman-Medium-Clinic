'use client';

import React from 'react';

export default function SimpleFeedbackPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Simple Feedback Test</h1>
        <p className="text-text-secondary mb-4">
          This is a simplified test page to check if the basic routing and theming works.
        </p>
        
        <div className="bg-card-bg border border-border-color rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Information</h2>
          <ul className="space-y-2 text-text-secondary">
            <li>✅ Page routing is working</li>
            <li>✅ Theme variables are applied</li>
            <li>✅ Basic styling is functional</li>
            <li>✅ Client-side rendering works</li>
          </ul>
        </div>
        
        <div className="mt-6">
          <button 
            className="bg-accent-color hover:bg-accent-hover text-white px-4 py-2 rounded-md"
            onClick={() => alert('Button click works!')}
          >
            Test Button
          </button>
        </div>
      </div>
    </div>
  );
}
