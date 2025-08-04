'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@clerk/nextjs';
import Navbar from '@/components/Navbar';

export default function HomePage() {
  const { user, isSignedIn } = useUser();

  const features = [
    {
      icon: '💊',
      title: 'Drug Inventory',
      description: 'Track medication stock levels and expiry dates with automated alerts.',
      href: '/inventory'
    },
    {
      icon: '👥',
      title: 'Patient Records',
      description: 'Manage patient information and medical history securely.',
      href: '/patients'
    },
    {
      icon: '💰',
      title: 'Sales & Payments',
      description: 'Process transactions and track payment records efficiently.',
      href: '/sales'
    },
    {
      icon: '🏥',
      title: 'Medical Services',
      description: 'Schedule appointments and manage healthcare services.',
      href: '/services'
    },
    {
      icon: '📊',
      title: 'Reports & Analytics',
      description: 'Generate insights and track clinic performance.',
      href: '/reports'
    },
    {
      icon: '🔔',
      title: 'Smart Notifications',
      description: 'Stay updated with automated alerts and reminders.',
      href: '/dashboard'
    }
  ];

  const benefits = [
    {
      icon: '⚡',
      title: 'Streamlined Operations',
      description: 'Reduce administrative workload and focus on patient care'
    },
    {
      icon: '🔒',
      title: 'Secure & Compliant',
      description: 'HIPAA-compliant data protection and privacy controls'
    },
    {
      icon: '📱',
      title: 'Mobile-Friendly',
      description: 'Access your clinic data from anywhere, anytime'
    },
    {
      icon: '📈',
      title: 'Data-Driven Insights',
      description: 'Make informed decisions with comprehensive analytics'
    }
  ];

  const stats = [
    { label: 'Clinics Served', value: '500+', change: '+15%' },
    { label: 'Patients Managed', value: '50K+', change: '+25%' },
    { label: 'Uptime', value: '99.9%', change: 'Reliable' },
    { label: 'Support', value: '24/7', change: 'Available' }
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 pt-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-card-bg via-background to-card-bg"></div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent-color/10 text-accent-color text-sm font-medium mb-6">
              <span className="mr-2">🏥</span>
              Trusted by 500+ Healthcare Facilities
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-text-primary mb-6 leading-tight">
              Modern Clinic
              <span className="text-accent-color"> Management</span>
              <br />
              <span className="text-2xl md:text-3xl text-text-secondary font-normal">
                Streamline Your Healthcare Operations
              </span>
            </h1>
            <p className="text-lg md:text-xl text-text-secondary mb-8 max-w-3xl mx-auto leading-relaxed">
              Comprehensive digital solution designed specifically for healthcare facilities. 
              Manage inventory, patients, and services with precision and ease.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {isSignedIn ? (
                <Link href="/dashboard">
                  <Button size="lg" className="text-lg px-8 py-4 bg-accent-color  text-white shadow-lg cursor-pointer bg-[#1447E6]  hover:bg-gray-700">
                    Access Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/sign-up">
                    <Button size="lg" className="text-lg px-8 py-4 bg-accent-color  text-white shadow-lg cursor-pointer bg-[#1447E6]  hover:bg-gray-700">
                      Start Free Trial
                    </Button>
                  </Link>
                  <Link href="/sign-in">
                    <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-2 border-border-color text-text-primary cursor-pointer bg-[#1447E6]  hover:bg-gray-700">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
            <div className="flex items-center justify-center space-x-8 text-sm text-text-secondary font-medium">
              <div className="flex items-center">
                <span className="text-success mr-2 font-bold">✓</span>
                No credit card required
              </div>
              <div className="flex items-center">
                <span className="text-success mr-2 font-bold">✓</span>
                14-day free trial
              </div>
              <div className="flex items-center">
                <span className="text-success mr-2 font-bold">✓</span>
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-accent-color mb-2">{stat.value}</div>
                <div className="text-sm md:text-base text-text-secondary mb-1">{stat.label}</div>
                <div className="text-xs text-success">{stat.change}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Why Choose Eman Clinic?
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Built specifically for healthcare professionals who want to focus on patient care, not paperwork.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 border-border-color shadow-sm bg-card-bg">
              <CardHeader>
                <div className="w-16 h-16 bg-accent-color/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">{benefit.icon}</span>
                </div>
                  <CardTitle className="text-lg text-text-primary">{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {benefit.description}
                </p>
              </CardContent>
            </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Complete Clinic Solution
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Everything you need to manage your healthcare facility efficiently and securely.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 border-border-color shadow-sm bg-card-bg">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{feature.icon}</span>
                    <CardTitle className="text-lg text-text-primary">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary mb-4 leading-relaxed">{feature.description}</p>
                  {isSignedIn && (
                    <Link href={feature.href}>
                      <Button variant="outline" size="sm" className="w-full border-border-color text-text-primary hover:bg-gray-700 cursor-pointer bg-[#1447E6]">
                        Explore
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-card-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            Ready to Transform Your Clinic?
          </h2>
          <p className="text-lg md:text-xl text-text-secondary mb-8 max-w-2xl mx-auto leading-relaxed font-medium">
            Join healthcare facilities that have already improved their operations 
            and patient care with our comprehensive management system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isSignedIn ? (
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8 py-4 bg-accent-color  text-white shadow-lg  hover:bg-gray-700 cursor-pointer bg-[#1447E6]">
                  Access Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-up">
                  <Button size="lg" className="text-lg px-8 py-4 bg-accent-color hover:bg-accent-hover text-white shadow-lg cursor-pointer">
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-2 border-border-color text-text-primary hover:bg-card-bg cursor-pointer">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card-bg text-text-primary py-12 border-t border-border-color">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-accent-color rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🏥</span>
                </div>
                <span className="text-xl font-bold">Eman Clinic</span>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed">
                Modern clinic management for healthcare facilities. 
                Streamline operations and improve patient care.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-text-secondary text-sm">
                <li>Drug Inventory</li>
                <li>Patient Records</li>
                <li>Sales Management</li>
                <li>Medical Services</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-text-secondary text-sm">
                <li>Documentation</li>
                <li>Help Center</li>
                <li>Contact Support</li>
                <li>Training</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-text-secondary text-sm">
                <li>About Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Contact</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border-color mt-8 pt-8 text-center text-text-muted text-sm font-semibold">
            <p>&copy; 2024 Eman Clinic. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
