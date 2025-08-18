"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser, useClerk } from "@clerk/nextjs";
import { hasDashboardAccess } from "@/lib/client-auth";
import { useUserRole } from "@/hooks/useUserRole";

export default function HomePage() {
  const { user, isSignedIn } = useUser();
  const { userRole } = useUserRole();
  const { openSignIn, openSignUp } = useClerk();

  const features = [
    {
      icon: "💊",
      title: "Drug Inventory",
      description:
        "Track medication stock levels and expiry dates with automated alerts.",
      href: "/inventory",
    },
    {
      icon: "👥",
      title: "Patient Records",
      description: "Manage patient information and medical history securely.",
      href: "/patients",
    },
    {
      icon: "💰",
      title: "Sales & Payments",
      description:
        "Process transactions and track payment records efficiently.",
      href: "/sales",
    },
    {
      icon: "🏥",
      title: "Medical Services",
      description: "Schedule appointments and manage healthcare services.",
      href: "/services",
    },
    {
      icon: "📊",
      title: "Reports & Analytics",
      description: "Generate insights and track clinic performance.",
      href: "/reports",
    },
    {
      icon: "🔔",
      title: "Smart Notifications",
      description: "Stay updated with automated alerts and reminders.",
      href: "/dashboard",
    },
  ];

  const benefits = [
    {
      icon: "⚡",
      title: "Streamlined Operations",
      description: "Reduce administrative workload and focus on patient care",
    },
    {
      icon: "🔒",
      title: "Secure & Compliant",
      description: "HIPAA-compliant data protection and privacy controls",
    },
    {
      icon: "📱",
      title: "Mobile-Friendly",
      description: "Access your clinic data from anywhere, anytime",
    },
    {
      icon: "📈",
      title: "Data-Driven Insights",
      description: "Make informed decisions with comprehensive analytics",
    },
  ];

  const stats = [
    { label: "Clinics Served", value: "500+", change: "+15%" },
    { label: "Patients Managed", value: "50K+", change: "+25%" },
    { label: "Uptime", value: "99.9%", change: "Reliable" },
    { label: "Support", value: "24/7", change: "Available" },
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary">
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
              Comprehensive digital solution designed specifically for
              healthcare facilities. Manage inventory, patients, and services
              with precision and ease.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {isSignedIn && hasDashboardAccess(userRole) ? (
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="text-lg px-8 py-4 bg-accent-color  text-white shadow-lg cursor-pointer bg-[#1447E6]  hover:bg-gray-700"
                  >
                    Access Dashboard
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Button>
                </Link>
              ) : !isSignedIn ? (
                <>
                  <Button
                    size="lg"
                    onClick={() => openSignUp()}
                    className="text-lg px-8 py-4 bg-accent-color  text-white shadow-lg cursor-pointer bg-[#1447E6]  hover:bg-gray-700"
                  >
                    Get Started
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => openSignIn()}
                    className="text-lg px-8 py-4 border-2 border-border-color text-text-primary cursor-pointer bg-[#1447E6]  hover:bg-gray-700"
                  >
                    Sign In
                  </Button>
                </>
              ) : (
                <div>
                  <p className="text-text-secondary font-medium">
                    Your account doesn’t have dashboard access. Contact an
                    administrator.
                  </p>
                </div>
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
                <div className="text-3xl md:text-4xl font-bold text-accent-color mb-2">
                  {stat.value}
                </div>
                <div className="text-sm md:text-base text-text-secondary mb-1">
                  {stat.label}
                </div>
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
              Built specifically for healthcare professionals who want to focus
              on patient care, not paperwork.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-all duration-300 border-border-color shadow-sm bg-card-bg"
              >
                <CardHeader>
                  <div className="w-16 h-16 bg-accent-color/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">{benefit.icon}</span>
                  </div>
                  <CardTitle className="text-lg text-text-primary">
                    {benefit.title}
                  </CardTitle>
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
              Everything you need to manage your healthcare facility efficiently
              and securely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-all duration-300 border-border-color shadow-sm bg-card-bg"
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{feature.icon}</span>
                    <CardTitle className="text-lg text-text-primary">
                      {feature.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary mb-4 leading-relaxed">
                    {feature.description}
                  </p>
                  {isSignedIn && hasDashboardAccess(userRole) && (
                    <Link href={feature.href}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-border-color text-text-primary hover:bg-gray-700 cursor-pointer bg-[#1447E6]"
                      >
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
            Join healthcare facilities that have already improved their
            operations and patient care with our comprehensive management
            system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isSignedIn && hasDashboardAccess(userRole) ? (
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="text-lg px-8 py-4 bg-accent-color  text-white shadow-lg  hover:bg-gray-700 cursor-pointer bg-[#1447E6]"
                >
                  Access Dashboard
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Button>
              </Link>
            ) : isSignedIn ? (
              <div className="text-center">
                <p className="text-text-secondary mb-4">
                  You don't have permission to access the dashboard. Please
                  contact your administrator.
                </p>
                <Link href="/sign-out">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-4 border-2 border-border-color text-text-primary hover:bg-card-bg cursor-pointer"
                  >
                    Sign Out
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <Button
                  size="lg"
                  onClick={() => openSignUp()}
                  className="text-lg px-8 py-4 bg-accent-color text-white shadow-lg cursor-pointer bg-[#1447E6]  hover:bg-gray-700"
                >
                  Get Started
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => openSignIn()}
                  className="text-lg px-8 py-4 border-2 border-border-color text-text-primary hover:bg-card-bg cursor-pointer"
                >
                  Sign In
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
