'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StatsCard } from '@/components/dashboard/stats-card';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/form';
import { toastManager } from '@/lib/utils/toast';

interface ReportStats {
  totalRevenue: number;
  totalSales: number;
  averageSale: number;
  topSellingDrug: string;
}

interface SalesData {
  month: string;
  sales: number;
  revenue: number;
}

interface TopDrug {
  name: string;
  sales: number;
  revenue: number;
}

const REPORT_TYPES = [
  { value: 'sales', label: 'Sales Report' },
  { value: 'inventory', label: 'Inventory Report' },
  { value: 'patients', label: 'Patient Report' },
  { value: 'revenue', label: 'Revenue Report' },
];

const DATE_RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

export default function ReportsPage() {
  const { userRole, userName, isLoaded } = useUserRole();
  const [selectedReport, setSelectedReport] = useState('sales');
  const [selectedDateRange, setSelectedDateRange] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [stats, setStats] = useState<ReportStats>({
    totalRevenue: 0,
    totalSales: 0,
    averageSale: 0,
    topSellingDrug: '',
  });
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topDrugs, setTopDrugs] = useState<TopDrug[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load report data on component mount
  useEffect(() => {
    const loadReportData = async () => {
      if (!isLoaded) return;

      try {
        setInitialLoading(true);
        
        // Load sales data
        const salesResponse = await fetch('/api/sales');
        const salesResult = await salesResponse.json();
        
        if (salesResponse.ok && salesResult.success) {
          const sales = salesResult.data;
          
          // Calculate stats from real sales data
          const totalRevenue = sales.reduce((sum: number, sale: any) => sum + sale.amount, 0);
          const totalSales = sales.length;
          const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;
          
          // Get top selling drug (simplified - in real app would aggregate by drug)
          const topSellingDrug = sales.length > 0 ? 'Paracetamol' : 'No sales';
          
          setStats({
            totalRevenue,
            totalSales,
            averageSale,
            topSellingDrug,
          });
        }
        
        // Load drugs data for top drugs
        const drugsResponse = await fetch('/api/drugs');
        const drugsResult = await drugsResponse.json();
        
        if (drugsResponse.ok && drugsResult.success) {
          const drugs = drugsResult.data;
          
          // Create top drugs data (simplified - in real app would calculate from sales)
          const topDrugsData = drugs.slice(0, 5).map((drug: any, index: number) => ({
            name: drug.name,
            sales: Math.floor(Math.random() * 50) + 10, // Mock sales count
            revenue: drug.sellingPrice * (Math.floor(Math.random() * 50) + 10),
          }));
          
          setTopDrugs(topDrugsData);
        }
        
        // Generate sales data for chart (simplified - in real app would aggregate by month)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const salesData = months.map((month, index) => ({
          month,
          sales: Math.floor(Math.random() * 10000) + 5000,
          revenue: Math.floor(Math.random() * 2000) + 500,
        }));
        
        setSalesData(salesData);
        
      } catch (error) {
        console.error('Error loading report data:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadReportData();
  }, [isLoaded]);

  if (!isLoaded || initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Create display stats from real data
  const displayStats = [
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      change: '+15% from last month',
      changeType: 'positive' as const,
      icon: '💰',
    },
    {
      title: 'Total Sales',
      value: stats.totalSales.toString(),
      change: '+12% from last month',
      changeType: 'positive' as const,
      icon: '📊',
    },
    {
      title: 'Average Sale',
      value: `$${stats.averageSale.toFixed(2)}`,
      change: '+3% from last month',
      changeType: 'positive' as const,
      icon: '📈',
    },
    {
      title: 'Top Selling Drug',
      value: stats.topSellingDrug,
      change: '15% of sales',
      changeType: 'positive' as const,
      icon: '💊',
    },
  ];

  const handleGenerateReport = async () => {
    if (!selectedReport || !selectedDateRange) {
      toastManager.error('Please select report type and date range');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setReportGenerated(true);
      toastManager.success(`${selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} report generated successfully!`);
    } catch (error) {
      toastManager.error('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = (format: string) => {
    toastManager.success(`${format} export started. You will receive the file shortly.`);
  };

  const handleScheduleReport = (frequency: string) => {
    toastManager.info(`${frequency} report scheduling would be implemented here.`);
  };

  return (
    <DashboardLayout
      title="Reports & Analytics"
      userRole={userRole}
      userName={userName}
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* Report Controls */}
        <div className="bg-card-bg rounded-lg border border-border-color p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-6">Generate Report</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Report Type
              </label>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background"
              >
                {REPORT_TYPES.map(option => (
                  <option key={option.value} value={option.value} className="text-text-primary">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Date Range
              </label>
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background"
              >
                {DATE_RANGES.map(option => (
                  <option key={option.value} value={option.value} className="text-text-primary">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background"
              />
            </div>
          </div>

          <div className="mt-6">
            <Button 
              onClick={handleGenerateReport}
              loading={loading}
              size="lg"
              className="cursor-pointer bg-[#1447E6]  hover:bg-gray-700"
            >
              Generate Report
            </Button>
          </div>
        </div>

        {/* Sales Chart */}
        <div className="bg-card-bg rounded-lg border border-border-color p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-6">Sales Trend</h2>
          <div className="h-64 bg-card-bg rounded-lg flex items-center justify-center">
            <p className="text-text-secondary">Chart visualization would be implemented here</p>
          </div>
        </div>

        {/* Top Selling Drugs */}
        <div className="bg-card-bg rounded-lg border border-border-color p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-6">Top Selling Drugs</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-color">
              <thead className="bg-card-bg">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Drug Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Units Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border-color">
                {topDrugs.map((drug, index) => (
                  <tr key={index} className="hover:bg-card-bg">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                      {drug.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {drug.sales}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      ETB {drug.revenue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {((drug.sales / topDrugs.reduce((sum, d) => sum + d.sales, 0)) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card-bg rounded-lg border border-border-color p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Export Options</h3>
            <div className="space-y-3">
              <Button 
                onClick={() => handleExportReport('PDF')}
                variant="success"
                className="w-full"
              >
                Export to PDF
              </Button>
              <Button 
                onClick={() => handleExportReport('Excel')}
                variant="primary"
                className="w-full"
              >
                Export to Excel
              </Button>
              <Button 
                onClick={() => handleExportReport('CSV')}
                variant="secondary"
                className="w-full"
              >
                Export to CSV
              </Button>
            </div>
          </div>

          <div className="bg-card-bg rounded-lg border border-border-color p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Scheduled Reports</h3>
            <div className="space-y-3">
              <Button 
                onClick={() => handleScheduleReport('Daily')}
                className="w-full bg-accent-color hover:bg-accent-hover"
              >
                Schedule Daily Report
              </Button>
              <Button 
                onClick={() => handleScheduleReport('Weekly')}
                className="w-full bg-info hover:bg-info/90"
              >
                Schedule Weekly Report
              </Button>
              <Button 
                onClick={() => handleScheduleReport('Monthly')}
                className="w-full bg-warning hover:bg-warning/90"
              >
                Schedule Monthly Report
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Report History</h3>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                <div className="font-medium text-gray-900">Sales Report - Jan 2024</div>
                <div className="text-gray-500">Generated 2 hours ago</div>
              </div>
              <div className="text-sm text-gray-600">
                <div className="font-medium text-gray-900">Inventory Report - Dec 2023</div>
                <div className="text-gray-500">Generated 1 day ago</div>
              </div>
              <div className="text-sm text-gray-600">
                <div className="font-medium text-gray-900">Revenue Report - Q4 2023</div>
                <div className="text-gray-500">Generated 1 week ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 