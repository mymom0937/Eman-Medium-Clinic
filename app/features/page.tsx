'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FeaturesPage() {
  const features = [
    {
      icon: '💊',
      title: 'Drug Inventory Management',
      description: 'Track drug stock levels, expiry dates, and manage inventory efficiently.',
      details: [
        'Real-time stock monitoring',
        'Automated expiry date alerts',
        'Supplier management system',
        'Barcode scanning support',
        'Low stock notifications'
      ]
    },
    {
      icon: '👥',
      title: 'Patient Records',
      description: 'Maintain comprehensive patient information and medical history.',
      details: [
        'Complete patient profiles',
        'Medical history tracking',
        'Treatment plan management',
        'Appointment scheduling',
        'Document upload support'
      ]
    },
    {
      icon: '💰',
      title: 'Sales & Payments',
      description: 'Process sales transactions and manage payment records.',
      details: [
        'Point of sale system',
        'Multiple payment methods',
        'Invoice generation',
        'Payment tracking',
        'Financial reporting'
      ]
    },
    {
      icon: '🏥',
      title: 'Medical Services',
      description: 'Schedule appointments and manage medical services.',
      details: [
        'Appointment booking',
        'Service catalog management',
        'Staff scheduling',
        'Service tracking',
        'Patient reminders'
      ]
    },
    {
      icon: '📊',
      title: 'Reports & Analytics',
      description: 'Generate comprehensive reports and view business analytics.',
      details: [
        'Custom report builder',
        'Performance dashboards',
        'Trend analysis',
        'Export capabilities',
        'Real-time metrics'
      ]
    },
    {
      icon: '🔔',
      title: 'Notifications',
      description: 'Stay updated with alerts for low stock, appointments, and more.',
      details: [
        'Real-time alerts',
        'Email notifications',
        'SMS reminders',
        'Custom notification rules',
        'Multi-channel delivery'
      ]
    }
  ];

  const benefits = [
    {
      title: 'Improved Efficiency',
      description: 'Streamline operations and reduce manual work by up to 60%',
      icon: '⚡'
    },
    {
      title: 'Better Patient Care',
      description: 'Enhanced patient management leads to improved healthcare outcomes',
      icon: '❤️'
    },
    {
      title: 'Cost Savings',
      description: 'Reduce operational costs and optimize resource allocation',
      icon: '💰'
    },
    {
      title: 'Data Security',
      description: 'HIPAA-compliant security measures protect sensitive information',
      icon: '🔒'
    }
  ];

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 bg-background text-text-primary transition-colors duration-200 pt-24">

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-text-primary mb-6">
              Powerful <span className="text-accent-color">Features</span>
            </h1>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              Everything you need to run your clinic efficiently, from inventory management 
              to patient care and financial tracking.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-card-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border border-border-color bg-background">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-accent-color/10 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">{feature.icon}</span>
                    </div>
                    <CardTitle className="text-lg text-text-primary">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary mb-4">{feature.description}</p>
                  <div className="space-y-2">
                    <h4 className="font-medium text-text-primary mb-2">Key Features:</h4>
                    <ul className="space-y-1">
                      {feature.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="text-sm text-text-secondary flex items-center">
                          <span className="w-2 h-2 bg-accent-color rounded-full mr-2"></span>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              Why Choose Eman Clinic?
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Discover the benefits that make our platform the preferred choice for healthcare facilities.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow border border-border-color bg-card-bg">
                <CardHeader>
                  <div className="w-16 h-16 bg-accent-color/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">{benefit.icon}</span>
                  </div>
                  <CardTitle className="text-lg text-text-primary">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary text-sm">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 bg-card-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              Seamless Integrations
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Connect with your existing systems and tools for a unified workflow.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {[
              { name: 'Payment Gateways', icon: '💳' },
              { name: 'Lab Systems', icon: '🧪' },
              { name: 'EHR Systems', icon: '📋' },
              { name: 'Accounting Software', icon: '📊' },
              { name: 'Communication Tools', icon: '📱' },
              { name: 'Cloud Storage', icon: '☁️' }
            ].map((integration, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-accent-color/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">{integration.icon}</span>
                </div>
                <p className="text-sm font-medium text-text-primary">{integration.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Experience These Features?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Start your free trial today and see how Eman Clinic can transform your healthcare facility.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3 bg-white text-blue-600 hover:bg-gray-100">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3 bg-white text-blue-600 hover:bg-gray-100">
                Schedule Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      </main>
    </>
  );
} 