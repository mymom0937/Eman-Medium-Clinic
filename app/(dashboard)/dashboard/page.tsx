'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StatsCard } from '@/components/dashboard/stats-card';
import { useUserRole } from '@/hooks/useUserRole';
import { PageLoader } from '@/components/common/loading-spinner';
import Link from 'next/link';
import { USER_ROLES } from '@/constants/user-roles';

interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  totalPatients: number;
  totalDrugs: number;
  lowStockItems: number;
  outOfStockItems: number;
  pendingOrders: number;
  todayServices: number;
}

interface RecentActivity {
  id: string;
  action: string;
  time: string;
  type: 'sale' | 'patient' | 'service' | 'inventory';
  amount?: string;
}

// API Data Interfaces
interface SaleData {
  _id: string;
  saleId?: string;
  patientName: string;
  totalAmount: number;
  soldAt?: string;
  createdAt: string;
}

interface PatientData {
  _id: string;
  patientId?: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

interface DrugData {
  _id: string;
  quantity: number;
}

interface DrugOrderData {
  _id: string;
  patientName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { userRole, userName, isLoaded } = useUserRole();
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalRevenue: 0,
    totalPatients: 0,
    totalDrugs: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    pendingOrders: 0,
    todayServices: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isLoaded) return;

      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [patientsRes, salesRes, drugsRes, drugOrdersRes] = await Promise.all([
          fetch('/api/patients'),
          fetch('/api/sales'),
          fetch('/api/drugs'),
          fetch('/api/drug-orders'),
        ]);

        const patientsData = await patientsRes.json();
        const salesData = await salesRes.json();
        const drugsData = await drugsRes.json();
        const drugOrdersData = await drugOrdersRes.json();

        // Calculate stats
        const totalPatients = patientsData.success ? patientsData.data.length : 0;
        const totalSales = salesData.success ? salesData.data.length : 0;
        const totalRevenue = salesData.success 
          ? salesData.data.reduce((sum: number, sale: SaleData) => sum + (sale.totalAmount || 0), 0)
          : 0;
        
        const totalDrugs = drugsData.success ? drugsData.data.length : 0;
        const lowStockItems = drugsData.success 
          ? drugsData.data.filter((drug: DrugData) => drug.quantity <= 10 && drug.quantity > 0).length
          : 0;
        const outOfStockItems = drugsData.success
          ? drugsData.data.filter((drug: DrugData) => drug.quantity === 0).length
          : 0;

        const pendingOrders = drugOrdersData.success
          ? drugOrdersData.data.filter((order: DrugOrderData) => order.status === 'PENDING').length
          : 0;

        // Calculate today's services (approximation)
        const today = new Date();
        const todayServices = salesData.success
          ? salesData.data.filter((sale: SaleData) => {
              const saleDate = new Date(sale.soldAt || sale.createdAt);
              return saleDate.toDateString() === today.toDateString();
            }).length
          : 0;

        setStats({
          totalSales,
          totalRevenue,
          totalPatients,
          totalDrugs,
          lowStockItems,
          outOfStockItems,
          pendingOrders,
          todayServices,
        });

        // Generate recent activity from actual data
        const activities: RecentActivity[] = [];
        
        // Add recent sales
        if (salesData.success && salesData.data.length > 0) {
          const recentSales = salesData.data.slice(0, 3);
          recentSales.forEach((sale: SaleData) => {
            activities.push({
              id: sale.saleId || sale._id,
              action: `Sale completed for ${sale.patientName}`,
              time: getTimeAgo(new Date(sale.soldAt || sale.createdAt)),
              type: 'sale',
              amount: `$${(sale.totalAmount || 0).toFixed(2)}`,
            });
          });
        }

        // Add recent patients
        if (patientsData.success && patientsData.data.length > 0) {
          const recentPatients = patientsData.data.slice(0, 2);
          recentPatients.forEach((patient: PatientData) => {
            activities.push({
              id: patient.patientId || patient._id,
              action: `New patient registered: ${patient.firstName} ${patient.lastName}`,
              time: getTimeAgo(new Date(patient.createdAt)),
              type: 'patient',
            });
          });
        }

        // Add recent drug orders
        if (drugOrdersData.success && drugOrdersData.data.length > 0) {
          const recentOrders = drugOrdersData.data.slice(0, 2);
          recentOrders.forEach((order: DrugOrderData) => {
            activities.push({
              id: order._id,
              action: `Drug order created for ${order.patientName}`,
              time: getTimeAgo(new Date(order.createdAt)),
              type: 'service',
              amount: `$${(order.totalAmount || 0).toFixed(2)}`,
            });
          });
        }

        // Sort activities by time (most recent first)
        activities.sort((a, b) => {
          const timeA = new Date(a.time).getTime();
          const timeB = new Date(b.time).getTime();
          return timeB - timeA;
        });

        setRecentActivity(activities.slice(0, 6));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isLoaded]);

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

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

  if (!isLoaded || loading) {
    return (
      <DashboardLayout
        title="Dashboard"
        userRole={userRole}
        userName={userName}
      >
        <div className="flex items-center justify-center h-[60vh]">
          <PageLoader text="Loading Dashboard..." />
        </div>
      </DashboardLayout>
    );
  }

  const quickActions = getRoleBasedQuickActions(userRole);

  // Prepare stats for display
  const displayStats = [
    {
      title: 'Total Sales',
      value: stats.totalSales.toString(),
      change: '+12% from last month',
      changeType: 'positive' as const,
      icon: '💰',
    },
    {
      title: 'Drugs in Stock',
      value: stats.totalDrugs.toString(),
      change: stats.lowStockItems > 0 ? `${stats.lowStockItems} low stock items` : 'All items in stock',
      changeType: stats.lowStockItems > 0 ? 'negative' as const : 'positive' as const,
      icon: '💊',
    },
    {
      title: 'Total Patients',
      value: stats.totalPatients.toString(),
      change: '+8% from last month',
      changeType: 'positive' as const,
      icon: '👥',
    },
    {
      title: 'Services Today',
      value: stats.todayServices.toString(),
      change: '+15% from yesterday',
      changeType: 'positive' as const,
      icon: '📅',
    },
  ];

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
          <p className="text-white/90">Here&apos;s what&apos;s happening in your clinic today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayStats.map((stat, index) => (
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
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
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
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-text-secondary">No recent activity</p>
                    <p className="text-sm text-text-muted mt-2">Activity will appear here as you use the system.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card-bg rounded-lg border border-border-color p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Today&apos;s Revenue</p>
                <p className="text-2xl font-bold text-text-primary">${stats.totalRevenue.toFixed(2)}</p>
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
                <p className="text-2xl font-bold text-text-primary">{stats.todayServices}</p>
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
                <p className="text-2xl font-bold text-text-primary">{stats.pendingOrders}</p>
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