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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required field validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.trim().length < 10) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    } else if (formData.message.trim().length > 2000) {
      newErrors.message = 'Message cannot exceed 2000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      message: ''
    });
    setErrors({});
    setSubmitMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitMessage('');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitStatus('success');
        setSubmitMessage(result.message);
        resetForm();
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSubmitStatus('idle');
        }, 5000);
      } else {
        setSubmitStatus('error');
        setSubmitMessage(result.message || 'Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      setSubmitStatus('error');
      setSubmitMessage('An error occurred while submitting your feedback. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
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
                  {/* Status Messages */}
                  {submitStatus === 'success' && (
                    <div className="p-6 bg-green-50 border border-green-200 rounded-lg animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-lg font-medium text-green-800">Message Sent Successfully!</h3>
                          <p className="mt-1 text-green-700">{submitMessage}</p>
                          <p className="mt-2 text-sm text-green-600">
                            We'll get back to you within 24-48 hours. Thank you for your feedback!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {submitStatus === 'error' && (
                    <div className="p-6 bg-red-50 border border-red-200 rounded-lg animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-lg font-medium text-red-800">Submission Failed</h3>
                          <p className="mt-1 text-red-700">{submitMessage}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-text-primary mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-color bg-background text-text-primary ${
                          errors.firstName ? 'border-red-500' : 'border-border-color'
                        }`}
                        required
                        disabled={isSubmitting}
                      />
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-text-primary mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-color bg-background text-text-primary ${
                          errors.lastName ? 'border-red-500' : 'border-border-color'
                        }`}
                        required
                        disabled={isSubmitting}
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-color bg-background text-text-primary ${
                          errors.email ? 'border-red-500' : 'border-border-color'
                        }`}
                        required
                        disabled={isSubmitting}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-2">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-color bg-background text-text-primary ${
                          errors.phone ? 'border-red-500' : 'border-border-color'
                        }`}
                        required
                        disabled={isSubmitting}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                      )}
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
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-text-primary mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      rows={6}
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-color bg-background text-text-primary ${
                        errors.message ? 'border-red-500' : 'border-border-color'
                      }`}
                      placeholder="Tell us about your needs and how we can help..."
                      required
                      disabled={isSubmitting}
                    ></textarea>
                    {errors.message && (
                      <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                    )}
                    <p className="mt-1 text-sm text-text-secondary">
                      {formData.message.length}/2000 characters
                    </p>
                  </div>
                  
                                     <Button 
                     type="submit" 
                     className={`w-full py-3 transition-all duration-200 ${
                       isSubmitting 
                         ? 'bg-gray-700 cursor-not-allowed' 
                         : 'text-white shadow-lg cursor-pointer bg-[#1447E6] hover:bg-gray-700'
                     }`}
                     disabled={isSubmitting}
                   >
                     {isSubmitting ? (
                       <div className="flex items-center justify-center">
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                         Sending Message...
                       </div>
                     ) : (
                       <div className="flex items-center justify-center">
                         <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                         </svg>
                         Send Message
                       </div>
                     )}
                   </Button>
                </form>
                
                {/* Thank You Section - Shows after successful submission */}
                {submitStatus === 'success' && (
                  <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-center">
                      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-blue-900 mb-2">Thank You for Your Feedback!</h3>
                      <p className="text-blue-700 mb-4">
                        We appreciate you taking the time to reach out to us. Your message has been received and will be reviewed by our team.
                      </p>
                      <div className="text-sm text-blue-600">
                        <p>• We typically respond within 24-48 hours</p>
                        <p>• You'll receive a confirmation email shortly</p>
                        <p>• For urgent matters, please call us directly</p>
                      </div>
                    </div>
                  </div>
                )}
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
                 Find answers to common questions about Eman Clinic and our healthcare services.
               </p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <Card className="hover:shadow-lg transition-shadow border border-border-color bg-card-bg">
                 <CardHeader>
                   <CardTitle className="text-lg text-text-primary">What medical services do you offer?</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="text-text-secondary">
                     We provide comprehensive healthcare services including general consultations, 
                     laboratory testing, pharmacy services, and specialized medical treatments. 
                     Our team of experienced healthcare professionals is here to serve your needs.
                   </p>
                 </CardContent>
               </Card>
               
               <Card className="hover:shadow-lg transition-shadow border border-border-color bg-card-bg">
                 <CardHeader>
                   <CardTitle className="text-lg text-text-primary">How do I schedule an appointment?</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="text-text-secondary">
                     You can schedule appointments through our online booking system, by calling us directly, 
                     or visiting our clinic. We offer flexible scheduling including same-day appointments 
                     for urgent care needs.
                   </p>
                 </CardContent>
               </Card>
               
               <Card className="hover:shadow-lg transition-shadow border border-border-color bg-card-bg">
                 <CardHeader>
                   <CardTitle className="text-lg text-text-primary">Do you accept insurance?</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="text-text-secondary">
                     Yes, we accept most major insurance plans and also offer affordable self-pay options. 
                     Our billing team will work with you to ensure you understand your coverage 
                     and out-of-pocket costs before treatment.
                   </p>
                 </CardContent>
               </Card>
               
               <Card className="hover:shadow-lg transition-shadow border border-border-color bg-card-bg">
                 <CardHeader>
                   <CardTitle className="text-lg text-text-primary">What are your operating hours?</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="text-text-secondary">
                     We're open Monday through Friday from 8:00 AM to 8:00 PM, 
                     Saturday from 9:00 AM to 5:00 PM, and Sunday from 10:00 AM to 4:00 PM. 
                     Emergency services are available 24/7 through our on-call system.
                   </p>
                 </CardContent>
               </Card>
               
               <Card className="hover:shadow-lg transition-shadow border border-border-color bg-card-bg">
                 <CardHeader>
                   <CardTitle className="text-lg text-text-primary">How do I access my medical records?</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="text-text-secondary">
                     You can access your medical records through our secure patient portal. 
                     Simply log in with your credentials to view test results, appointment history, 
                     and medical documents. We also provide paper copies upon request.
                   </p>
                 </CardContent>
               </Card>
               
               <Card className="hover:shadow-lg transition-shadow border border-border-color bg-card-bg">
                 <CardHeader>
                   <CardTitle className="text-lg text-text-primary">Do you provide emergency care?</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="text-text-secondary">
                     While we're not a full emergency room, we do provide urgent care services 
                     for non-life-threatening conditions. For true emergencies, please call 911 
                     or visit the nearest emergency room.
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
                 <Button size="lg" className="text-lg px-8 py-3 text-white shadow-lg cursor-pointer bg-[#1447E6] hover:bg-gray-700">
                   Start Free Trial
                 </Button>
               </Link>
               <Link href="/services">
                 <Button size="lg" className="text-lg px-8 py-3 text-white shadow-lg cursor-pointer bg-[#1447E6] hover:bg-gray-700">
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