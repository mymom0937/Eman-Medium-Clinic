'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FaStethoscope, FaPills, FaUserMd, FaChartLine, FaShieldAlt, FaClock } from 'react-icons/fa';

export default function ServicesPage() {
  const services = [
    {
      icon: <FaPills className="text-3xl text-blue-600" />,
      title: 'Drug Inventory Management',
      description: 'Manage your clinic\'s medication stock with automatic alerts for low stock and expiring medications.',
      features: ['Track medication quantities', 'Expiry date warnings', 'Prescription history', 'Stock reports']
    },
    {
      icon: <FaUserMd className="text-3xl text-green-600" />,
      title: 'Patient Records Management',
      description: 'Store and access patient information, medical history, and treatment records in one place.',
      features: ['Patient information storage', 'Medical history tracking', 'Treatment records', 'Visit history']
    },
    {
      icon: <FaStethoscope className="text-3xl text-red-600" />,
      title: 'Medical Consultation Management',
      description: 'Record and track patient consultations, diagnoses, and treatment plans with detailed notes.',
      features: ['Consultation records', 'Diagnosis tracking', 'Treatment plans', 'Follow-up scheduling']
    },
    {
      icon: <FaChartLine className="text-3xl text-purple-600" />,
      title: 'Laboratory Results Tracking',
      description: 'Manage and track patient lab tests, results, and medical reports in organized files.',
      features: ['Lab test orders', 'Results storage', 'Report management', 'Result notifications']
    },
    {
      icon: <FaShieldAlt className="text-3xl text-indigo-600" />,
      title: 'Prescription Management',
      description: 'Create, track, and manage patient prescriptions with dosage instructions and refill alerts.',
      features: ['Prescription creation', 'Dosage tracking', 'Refill reminders', 'Medication history']
    },
    {
      icon: <FaClock className="text-3xl text-orange-600" />,
      title: 'Patient Follow-up System',
      description: 'Schedule and track patient follow-ups, check-ups, and preventive care appointments.',
      features: ['Follow-up scheduling', 'Preventive care', 'Health reminders', 'Progress tracking']
    }
  ];

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 bg-background text-text-primary transition-colors duration-200 pt-24">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-text-primary">Our Services</h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Simple, efficient healthcare management solutions designed for medium-sized clinics 
            to improve patient care and streamline operations.
          </p>
        </div>

        {/* Services Grid */}
        <div className="mb-20">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-text-primary text-center">Core Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border border-border-color bg-card-bg">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    {service.icon}
                  </div>
                  <CardTitle className="text-xl text-text-primary">{service.title}</CardTitle>
                  <p className="text-text-secondary text-sm">{service.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-text-secondary">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-blue-600 p-12 rounded-xl">
          <h2 className="text-3xl font-bold mb-4 text-white">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-white/90">
            Join other clinics who trust Eman Clinic to manage their operations efficiently.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3 bg-white text-blue-600 hover:bg-gray-100">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3 bg-white text-blue-600 hover:bg-gray-100">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
} 