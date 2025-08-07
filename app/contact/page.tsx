'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    // You can add API call here
  };

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 bg-background text-text-primary transition-colors duration-200 pt-24">
        {/* Hero Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-6xl font-bold text-text-primary mb-6">
                Get in <span className="text-accent-color">Touch</span>
              </h1>
              <p className="text-xl text-text-secondary max-w-3xl mx-auto">
                Ready to get started? Contact us today to learn more about how Eman Clinic 
                can transform your healthcare facility.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-20 bg-card-bg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Information */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-8">Contact Information</h2>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-accent-color/10 rounded-lg flex items-center justify-center">
                      <span className="text-accent-color text-xl">📍</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">Address</h3>
                      <p className="text-text-secondary">123 Healthcare Street, Medical District, City</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-accent-color/10 rounded-lg flex items-center justify-center">
                      <span className="text-accent-color text-xl">📧</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">Email</h3>
                      <p className="text-text-secondary">info@emanclinic.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-accent-color/10 rounded-lg flex items-center justify-center">
                      <span className="text-accent-color text-xl">📞</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">Phone</h3>
                      <p className="text-text-secondary">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-accent-color/10 rounded-lg flex items-center justify-center">
                      <span className="text-accent-color text-xl">🕒</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">Business Hours</h3>
                      <p className="text-text-secondary">Monday - Friday: 9:00 AM - 6:00 PM</p>
                      <p className="text-text-secondary">Saturday: 9:00 AM - 2:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Contact Form */}
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-8">Send us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-text-primary mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="w-full px-4 py-2 border border-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-accent-color bg-background text-text-primary"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-text-primary mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full px-4 py-2 border border-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-accent-color bg-background text-text-primary"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-4 py-2 border border-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-accent-color bg-background text-text-primary"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-4 py-2 border border-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-accent-color bg-background text-text-primary"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-text-primary mb-2">
                      Company/Clinic Name
                    </label>
                    <input
                      type="text"
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className="w-full px-4 py-2 border border-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-accent-color bg-background text-text-primary"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-text-primary mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      rows={6}
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      className="w-full px-4 py-2 border border-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-accent-color bg-background text-text-primary"
                      placeholder="Tell us about your needs and how we can help..."
                      required
                    ></textarea>
                  </div>
                  
                  <Button type="submit" className="w-full bg-accent-color hover:bg-accent-hover text-white py-3">
                    Send Message
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-text-primary mb-4">Frequently Asked Questions</h2>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                Find answers to common questions about Eman Clinic and our services.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="hover:shadow-lg transition-shadow border border-border-color bg-card-bg">
                <CardHeader>
                  <CardTitle className="text-lg text-text-primary">How does the free trial work?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary">
                    Our free trial gives you full access to all features for 14 days. No credit card required. 
                    You can start using the platform immediately and upgrade when you're ready.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow border border-border-color bg-card-bg">
                <CardHeader>
                  <CardTitle className="text-lg text-text-primary">Is my data secure?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary">
                    Yes, we use enterprise-grade security measures and are HIPAA-compliant. 
                    All data is encrypted and stored securely in the cloud.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow border border-border-color bg-card-bg">
                <CardHeader>
                  <CardTitle className="text-lg text-text-primary">Can I integrate with existing systems?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary">
                    Absolutely! We offer API access and support integration with most healthcare systems, 
                    EHR platforms, and accounting software.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow border border-border-color bg-card-bg">
                <CardHeader>
                  <CardTitle className="text-lg text-text-primary">What kind of support do you provide?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary">
                    We offer 24/7 technical support, comprehensive documentation, training sessions, 
                    and dedicated account managers for enterprise customers.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of healthcare providers who trust Eman Clinic to manage their operations efficiently.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-3 bg-white text-blue-600 hover:bg-gray-100">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/services">
                <Button size="lg" variant="outline" className="text-lg px-8 py-3 bg-white text-blue-600 hover:bg-gray-100">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
} 