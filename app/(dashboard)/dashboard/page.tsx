'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StatsCard } from '@/components/dashboard/stats-card';
import { useUserRole } from '@/hooks/useUserRole';
import Link from 'next/link';
import { USER_ROLES } from '@/constants/user-roles';

// Mock data - in real app, this would come from API
const mockStats = [
  {
    title: 'Total Sales',
    value: '$12,450',
    change: '+12% from last month',
    changeType: 'positive' as const,
    icon: '💰',
  },
  {
    title: 'Drugs in Stock',
    value: '1,234',
    change: '-5% from last week',
    changeType: 'negative' as const,
    icon: '💊',
  },
  {
    title: 'Total Patients',
    value: '456',
    change: '+8% from last month',
    changeType: 'positive' as const,
    icon: '👥',
  },
  {
    title: 'Services Today',
    value: '23',
    change: '+15% from yesterday',
    changeType: 'positive' as const,
    icon: '📅',
  },
];

const mockRecentActivity = [
  {
    id: 1,
    action: 'Paracetamol sold to Patient #123',
    time: '2 minutes ago',
    type: 'sale',
    amount: '$15.50',
  },
  {
    id: 2,
    action: 'New patient registered: John Doe',
    time: '15 minutes ago',
    type: 'patient',
  },
  {
    id: 3,
    action: 'Consultation booked for Patient #456',
    time: '1 hour ago',
    type: 'service',
    amount: '$50.00',
  },
  {
    id: 4,
    action: 'New stock received: Antibiotics',
    time: '2 hours ago',
    type: 'inventory',
  },
];

const getRoleBasedQuickActions = (userRole: string) => {
  switch (userRole) {
    case USER_ROLES.SUPER_ADMIN:
      return [
        {
          id: 1,
          title: 'System Overview',
          description: 'Monitor all clinic operations',
          icon: '📊',
          href: '/reports',
          color: 'bg-accent-color/10 border-accent-color/20 hover:bg-accent-color/20',
        },
        {
          id: 2,
          title: 'Manage Users',
          description: 'Add or modify user accounts',
          icon: '👤',
          href: '/users',
          color: 'bg-info/10 border-info/20 hover:bg-info/20',
        },
        {
          id: 3,
          title: 'Financial Reports',
          description: 'View revenue and payment reports',
          icon: '💰',
          href: '/reports',
          color: 'bg-success/10 border-success/20 hover:bg-success/20',
        },
        {
          id: 4,
          title: 'Inventory Status',
          description: 'Check stock levels and orders',
          icon: '📦',
          href: '/inventory',
          color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
        },
      ];

    case USER_ROLES.NURSE:
      return [
        {
          id: 1,
          title: 'Register Patient',
          description: 'Add a new patient to the system',
          icon: '👥',
          href: '/patients',
          color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
        },
        {
          id: 2,
          title: 'View Lab Results',
          description: 'Check patient test results',
          icon: '🔬',
          href: '/lab-results',
          color: 'bg-green-50 border-green-200 hover:bg-green-100',
        },
        {
          id: 3,
          title: 'Create Drug Order',
          description: 'Prescribe medication for patients',
          icon: '💊',
          href: '/drug-orders',
          color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
        },
        {
          id: 4,
          title: 'Patient Records',
          description: 'Access patient medical history',
          icon: '📋',
          href: '/patients',
          color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
        },
      ];

    case USER_ROLES.LABORATORIST:
      return [
        {
          id: 1,
          title: 'New Lab Test',
          description: 'Record new test results',
          icon: '🔬',
          href: '/lab-results/new',
          color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
        },
        {
          id: 2,
          title: 'View Patient Data',
          description: 'Access patient information',
          icon: '👥',
          href: '/patients',
          color: 'bg-green-50 border-green-200 hover:bg-green-100',
        },
        {
          id: 3,
          title: 'Pending Tests',
          description: 'Check tests awaiting results',
          icon: '⏳',
          href: '/lab-results',
          color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
        },
        {
          id: 4,
          title: 'Test History',
          description: 'View completed test records',
          icon: '📊',
          href: '/lab-results',
          color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
        },
      ];

    case USER_ROLES.PHARMACIST:
      return [
        {
          id: 1,
          title: 'Process Sale',
          description: 'Complete drug transactions',
          icon: '💰',
          href: '/sales',
          color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
        },
        {
          id: 2,
          title: 'Manage Inventory',
          description: 'Update drug stock levels',
          icon: '📦',
          href: '/inventory',
          color: 'bg-green-50 border-green-200 hover:bg-green-100',
        },
        {
          id: 3,
          title: 'View Orders',
          description: 'Check pending drug orders',
          icon: '💊',
          href: '/drug-orders',
          color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
        },
        {
          id: 4,
          title: 'Payment Records',
          description: 'Access payment history',
          icon: '💳',
          href: '/payments',
          color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
        },
      ];

    default:
      return [
        {
          id: 1,
          title: 'Dashboard',
          description: 'View system overview',
          icon: '📊',
          href: '/dashboard',
          color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
        },
      ];
  }
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'sale': return '💰';
    case 'patient': return '👥';
    case 'service': return '📅';
    case 'inventory': return '📦';
    default: return '📋';
  }
};

export default function DashboardPage() {
  const { userRole, userName, isLoaded } = useUserRole();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const quickActions = getRoleBasedQuickActions(userRole);

  return (
    <DashboardLayout
      title="Dashboard"
      userRole={userRole}
      userName={userName}
    >
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-accent-color to-accent-hover rounded-lg p-4 text-white">
          <h1 className="text-2xl font-bold mb-2">
            {(() => {
              const hour = new Date().getHours();
              let greeting = 'Welcome back';
              
              if (hour < 12) {
                greeting = 'Good morning';
              } else if (hour < 17) {
                greeting = 'Good afternoon';
              } else {
                greeting = 'Good evening';
              }
              
              return `${greeting}, ${userName || 'User'}!`;
            })()}
          </h1>
          <p className="text-white/90">Here's what's happening in your clinic today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockStats.map((stat, index) => (
            <StatsCard
              key={index}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              changeType={stat.changeType}
              icon={stat.icon}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-card-bg rounded-lg border border-border-color p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h2>
              <div className="space-y-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.id}
                    href={action.href}
                    className={`flex items-center p-3 border rounded-lg transition-all duration-200 ${action.color}`}
                  >
                    <span className="text-xl mr-3">{action.icon}</span>
                    <div>
                      <h3 className="font-medium text-text-primary text-sm">{action.title}</h3>
                      <p className="text-xs text-text-secondary">{action.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-card-bg rounded-lg border border-border-color p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Recent Activity</h2>
                <Link href="/reports" className="text-sm text-accent-color hover:text-accent-hover font-medium">
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {mockRecentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-background rounded-lg hover:bg-card-bg transition-colors">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getActivityIcon(activity.type)}</span>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{activity.action}</p>
                        <p className="text-xs text-text-muted">{activity.time}</p>
                      </div>
                    </div>
                    {activity.amount && (
                      <span className="text-sm font-semibold text-success">{activity.amount}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card-bg rounded-lg border border-border-color p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Today's Revenue</p>
                <p className="text-2xl font-bold text-text-primary">$2,450</p>
              </div>
              <span className="text-2xl">💰</span>
            </div>
            <div className="mt-2">
              <span className="text-xs text-success font-medium">+12% from yesterday</span>
            </div>
          </div>

          <div className="bg-card-bg rounded-lg border border-border-color p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Patients Today</p>
                <p className="text-2xl font-bold text-text-primary">18</p>
              </div>
              <span className="text-2xl">👥</span>
            </div>
            <div className="mt-2">
              <span className="text-xs text-accent-color font-medium">+3 from yesterday</span>
            </div>
          </div>

          <div className="bg-card-bg rounded-lg border border-border-color p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Pending Orders</p>
                <p className="text-2xl font-bold text-text-primary">7</p>
              </div>
              <span className="text-2xl">📋</span>
            </div>
            <div className="mt-2">
              <span className="text-xs text-warning font-medium">Requires attention</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 