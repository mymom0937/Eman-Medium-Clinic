'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StatsCard } from '@/components/dashboard/stats-card';
import { useUserRole } from '@/hooks/useUserRole';
import { PageLoader } from '@/components/common/loading-spinner';
import { Modal } from '@/components/ui/modal';
import { FormField, Input, Select, Button } from '@/components/ui/form';
import { toastManager } from '@/lib/utils/toast';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import { 
  SALE_PAYMENT_STATUS_OPTIONS, 
  SALE_STATUS_OPTIONS,
  SALE_PAYMENT_STATUS_LABELS,
  SALE_STATUS_LABELS
} from '@/constants/sales-status';

interface Sale {
  _id: string;
  saleId: string;
  patientId: string;
  patientName: string;
  items: Array<{
    drugId: string;
    drugName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  soldBy: string;
  soldAt: string;
  createdAt: string;
  updatedAt: string;
}

interface SalesStats {
  totalSales: number;
  totalRevenue: number;
  averageSale: number;
  todaySales: number;
  pendingSales: number;
  completedSales: number;
  failedSales: number;
  refundedSales: number;
}

export default function SalesPage() {
  const { userRole, userName, isLoaded } = useUserRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [isViewSaleModalOpen, setIsViewSaleModalOpen] = useState(false);
  const [isEditSaleModalOpen, setIsEditSaleModalOpen] = useState(false);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<SalesStats>({
    totalSales: 0,
    totalRevenue: 0,
    averageSale: 0,
    todaySales: 0,
    pendingSales: 0,
    completedSales: 0,
    failedSales: 0,
    refundedSales: 0,
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    selectedDrug: '',
    quantity: '',
    paymentMethod: 'CASH',
    paymentStatus: 'PENDING',
    status: 'PENDING',
    discount: '0',
  });
  const [errors, setErrors] = useState<any>({});
  const [patients, setPatients] = useState<any[]>([]);
  const [drugs, setDrugs] = useState<any[]>([]);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  const calculateStats = (salesData: Sale[]) => {
    const totalSales = salesData.length;
    const totalRevenue = salesData.reduce((sum: number, sale: Sale) => sum + (sale.totalAmount || 0), 0);
    const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    const today = new Date();
    const todaySales = salesData.filter((sale: Sale) => {
      const saleDate = new Date(sale.soldAt || sale.createdAt);
      return saleDate.toDateString() === today.toDateString();
    }).length;

    // Calculate status-based stats
    const pendingSales = salesData.filter((sale: Sale) => sale.paymentStatus === 'PENDING').length;
    const completedSales = salesData.filter((sale: Sale) => sale.paymentStatus === 'COMPLETED').length;
    const failedSales = salesData.filter((sale: Sale) => sale.paymentStatus === 'FAILED').length;
    const refundedSales = salesData.filter((sale: Sale) => sale.paymentStatus === 'REFUNDED').length;

    return {
      totalSales,
      totalRevenue,
      averageSale,
      todaySales,
      pendingSales,
      completedSales,
      failedSales,
      refundedSales,
    };
  };

  // Helper function to update stats from sales data
  const updateStatsFromSales = (salesData: Sale[]) => {
    setStats(calculateStats(salesData));
  };

  // Load sales data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!isLoaded) return;

      try {
        setInitialLoading(true);
        
        // Fetch sales
        const salesResponse = await fetch('/api/sales');
        const salesResult = await salesResponse.json();
        
        if (salesResponse.ok && salesResult.success) {
          setSales(salesResult.data);
          
          updateStatsFromSales(salesResult.data);
        }

        // Fetch patients
        const patientsResponse = await fetch('/api/patients');
        const patientsResult = await patientsResponse.json();
        
        if (patientsResponse.ok && patientsResult.success) {
          setPatients(patientsResult.data);
        }

        // Fetch drugs
        const drugsResponse = await fetch('/api/drugs');
        const drugsResult = await drugsResponse.json();
        
        if (drugsResponse.ok && drugsResult.success) {
          setDrugs(drugsResult.data);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, [isLoaded]);

  if (!isLoaded || initialLoading) {
    return <PageLoader text="Loading sales..." />;
  }

  // Filter sales based on search, status, and method
  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.saleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.patientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || sale.paymentStatus.toUpperCase() === selectedStatus;
    const matchesMethod = selectedMethod === 'all' || sale.paymentMethod.toLowerCase().replace('_', '') === selectedMethod;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'REFUNDED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash':
        return '💵';
      case 'card':
        return '💳';
      case 'mobile_money':
        return '📱';
      default:
        return '💰';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};

    if (!formData.patientId) {
      newErrors.patientName = 'Patient is required';
    }
    if (!formData.selectedDrug) {
      newErrors.selectedDrug = 'Drug is required';
    }
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = 'Valid quantity is required';
    }
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }
    if (!formData.paymentStatus) {
      newErrors.paymentStatus = 'Payment status is required';
    }
    if (!formData.status) {
      newErrors.status = 'Sale status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNewSale = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Find the selected drug to get its details
      const selectedDrug = drugs.find(drug => drug._id === formData.selectedDrug);
      if (!selectedDrug) {
        toastManager.error('Selected drug not found');
        return;
      }

      const quantity = parseInt(formData.quantity);
      const unitPrice = selectedDrug.sellingPrice || selectedDrug.price || 0;
      const totalPrice = quantity * unitPrice;

      const saleData = {
        patientId: formData.patientId,
        patientName: formData.patientName,
        items: [
          { 
            drugId: selectedDrug._id,
            drugName: selectedDrug.name,
            quantity: quantity,
            unitPrice: unitPrice,
            totalPrice: totalPrice,
          }
        ],
        totalAmount: totalPrice,
        paymentMethod: formData.paymentMethod.toUpperCase(),
        paymentStatus: 'COMPLETED',
      };

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create sale');
      }

      // Reload sales data
      const salesResponse = await fetch('/api/sales');
      const salesResult = await salesResponse.json();
      
      if (salesResponse.ok && salesResult.success) {
        setSales(salesResult.data);
        
        // Recalculate stats
        const totalSales = salesResult.data.length;
        const totalRevenue = salesResult.data.reduce((sum: number, sale: Sale) => sum + (sale.totalAmount || 0), 0);
        const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;
        
        const today = new Date();
        const todaySales = salesResult.data.filter((sale: Sale) => {
          const saleDate = new Date(sale.soldAt || sale.createdAt);
          return saleDate.toDateString() === today.toDateString();
        }).length;

        setStats({
          totalSales,
          totalRevenue,
          averageSale,
          todaySales,
          pendingSales: 0,
          completedSales: 0,
          failedSales: 0,
          refundedSales: 0,
        });
      }

      setIsNewSaleModalOpen(false);
      setFormData({
        patientId: '',
        patientName: '',
        selectedDrug: '',
        quantity: '',
        paymentMethod: 'CASH',
        paymentStatus: 'PENDING',
        status: 'PENDING',
        discount: '0',
      });
      setErrors({});
      toastManager.success('Sale completed successfully!');
    } catch (error) {
      console.error('Error creating sale:', error);
      toastManager.error('Failed to process sale. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: typeof formData) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: typeof errors) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleViewSale = (sale: Sale) => {
    setViewingSale(sale);
    setIsViewSaleModalOpen(true);
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setFormData({
      patientId: sale.patientId,
      patientName: sale.patientName,
      selectedDrug: sale.items[0]?.drugId || '',
      quantity: sale.items[0]?.quantity?.toString() || '',
      paymentMethod: sale.paymentMethod,
      paymentStatus: sale.paymentStatus,
      status: sale.status || 'PENDING',
      discount: sale.discount?.toString() || '0',
    });
    setIsEditSaleModalOpen(true);
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm('Are you sure you want to delete this sale?')) return;
    
    try {
      const response = await fetch(`/api/sales?saleId=${saleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete sale');
      }

      // Reload sales data
      const salesResponse = await fetch('/api/sales');
      const salesResult = await salesResponse.json();
      
      if (salesResponse.ok && salesResult.success) {
        setSales(salesResult.data);
        
        // Recalculate stats
        const totalSales = salesResult.data.length;
        const totalRevenue = salesResult.data.reduce((sum: number, sale: Sale) => sum + (sale.totalAmount || 0), 0);
        const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;
        
        const today = new Date();
        const todaySales = salesResult.data.filter((sale: Sale) => {
          const saleDate = new Date(sale.soldAt || sale.createdAt);
          return saleDate.toDateString() === today.toDateString();
        }).length;

        setStats({
          totalSales,
          totalRevenue,
          averageSale,
          todaySales,
          pendingSales: 0,
          completedSales: 0,
          failedSales: 0,
          refundedSales: 0,
        });
      }

      toastManager.success('Sale deleted successfully!');
    } catch (error) {
      console.error('Error deleting sale:', error);
      toastManager.error('Failed to delete sale. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: '',
      patientName: '',
      selectedDrug: '',
      quantity: '',
      paymentMethod: 'CASH',
      paymentStatus: 'PENDING',
      status: 'PENDING',
      discount: '0',
    });
    setErrors({});
  };

  const canUpdateStatus = (sale: Sale) => {
    if (userRole === 'SUPER_ADMIN') return true;
    if (userRole === 'PHARMACIST') return true;
    if (userRole === 'CASHIER') return true;
    return false;
  };

  const handleStatusUpdate = async (saleId: string, newStatus: string) => {
    if (!canUpdateStatus({} as Sale)) return;

    setStatusUpdating(saleId);
    try {
      const response = await fetch('/api/sales', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          saleId, 
          paymentStatus: newStatus,
          soldBy: userName || 'System'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Reload sales data
      const salesResponse = await fetch('/api/sales');
      const salesResult = await salesResponse.json();
      
      if (salesResponse.ok && salesResult.success) {
        setSales(salesResult.data);
        
        // Recalculate stats
        const totalSales = salesResult.data.length;
        const totalRevenue = salesResult.data.reduce((sum: number, sale: Sale) => sum + (sale.totalAmount || 0), 0);
        const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;
        
        const today = new Date();
        const todaySales = salesResult.data.filter((sale: Sale) => {
          const saleDate = new Date(sale.soldAt || sale.createdAt);
          return saleDate.toDateString() === today.toDateString();
        }).length;

        setStats({
          totalSales,
          totalRevenue,
          averageSale,
          todaySales,
          pendingSales: 0,
          completedSales: 0,
          failedSales: 0,
          refundedSales: 0,
        });
      }

      toastManager.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toastManager.error('Failed to update status');
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleUpdateSale = async () => {
    if (!validateForm() || !editingSale) return;

    setLoading(true);
    try {
      // Find the selected drug to get its details
      const selectedDrug = drugs.find(drug => drug._id === formData.selectedDrug);
      if (!selectedDrug) {
        toastManager.error('Selected drug not found');
        return;
      }

      const quantity = parseInt(formData.quantity);
      const unitPrice = selectedDrug.sellingPrice || selectedDrug.price || 0;
      const totalPrice = quantity * unitPrice;
      const discount = parseFloat(formData.discount || '0');
      const finalAmount = totalPrice - discount;

      const updateData = {
        saleId: editingSale.saleId,
        patientId: formData.patientId,
        patientName: formData.patientName,
        items: [
          { 
            drugId: selectedDrug._id,
            drugName: selectedDrug.name,
            quantity: quantity,
            unitPrice: unitPrice,
            totalPrice: totalPrice,
          }
        ],
        totalAmount: totalPrice,
        discount: discount,
        finalAmount: finalAmount,
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentStatus,
        status: formData.status,
        soldBy: userName || 'System',
      };

      const response = await fetch('/api/sales', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update sale');
      }

      // Reload sales data
      const salesResponse = await fetch('/api/sales');
      const salesResult = await salesResponse.json();
      
      if (salesResponse.ok && salesResult.success) {
        setSales(salesResult.data);
        
        // Recalculate stats
        const totalSales = salesResult.data.length;
        const totalRevenue = salesResult.data.reduce((sum: number, sale: Sale) => sum + (sale.totalAmount || 0), 0);
        const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;
        
        const today = new Date();
        const todaySales = salesResult.data.filter((sale: Sale) => {
          const saleDate = new Date(sale.soldAt || sale.createdAt);
          return saleDate.toDateString() === today.toDateString();
        }).length;

        setStats({
          totalSales,
          totalRevenue,
          averageSale,
          todaySales,
          pendingSales: 0,
          completedSales: 0,
          failedSales: 0,
          refundedSales: 0,
        });
      }

      setIsEditSaleModalOpen(false);
      setEditingSale(null);
      resetForm();
      toastManager.success('Sale updated successfully!');
    } catch (error) {
      console.error('Error updating sale:', error);
      toastManager.error('Failed to update sale. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Prepare stats for display
  const displayStats = [
    
   
    {
      title: "Today's Sales",
      value: stats.todaySales.toString(),
      change: '+3 from yesterday',
      changeType: 'positive' as const,
      icon: '📅',
    },
     {
      title: 'Average Sale',
      value: `$${stats.averageSale.toFixed(2)}`,
      change: '+5% from last month',
      changeType: 'positive' as const,
      icon: '📊',
    },
  ];

  // Prepare status-based stats for display
  const statusStats = [
    {
      title: 'Pending Sales',
      value: stats.pendingSales.toString(),
      change: 'Awaiting payment',
      changeType: 'neutral' as const,
      icon: '⏳',
    },
    {
      title: 'Completed Sales',
      value: stats.completedSales.toString(),
      change: 'Successfully processed',
      changeType: 'positive' as const,
      icon: '✅',
    },
    {
      title: 'Failed Sales',
      value: stats.failedSales.toString(),
      change: 'Payment issues',
      changeType: 'negative' as const,
      icon: '❌',
    },
    {
      title: 'Refunded Sales',
      value: stats.refundedSales.toString(),
      change: 'Returned payments',
      changeType: 'neutral' as const,
      icon: '🔄',
    },
  ];

  const SALE_STATUS_OPTIONS = [
    { value: 'all', label: 'All Status' },
    ...SALE_PAYMENT_STATUS_OPTIONS,
  ];

  const PAYMENT_METHOD_OPTIONS = [
    { value: 'all', label: 'All Methods' },
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'mobile_money', label: 'Mobile Money' },
  ];

  // Prepare dynamic options for patients and drugs
  const PATIENT_OPTIONS = patients.map(patient => ({
    value: patient.patientId,
    label: `${patient.firstName} ${patient.lastName} (${patient.patientId})`
  }));

  const DRUG_OPTIONS = drugs.map(drug => ({
    value: drug._id,
    label: `${drug.name} ${drug.strength} - ETB ${drug.sellingPrice?.toFixed(2) || drug.price?.toFixed(2) || '0.00'}`
  }));

  return (
    <DashboardLayout
      title="Sales Management"
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

        {/* Status-based Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statusStats.map((stat, index) => (
            <StatsCard
              key={`status-${index}`}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              changeType={stat.changeType}
              icon={stat.icon}
            />
          ))}
        </div>

        {/* Sales Records Section */}
        <div className="bg-card-bg rounded-lg border border-border-color p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-text-primary">Sales Records</h2>
            <Button onClick={() => setIsNewSaleModalOpen(true)} className="cursor-pointer bg-[#1447E6]  hover:bg-gray-700">
              New Sale
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
            <input
              type="text"
              placeholder="Search sales by ID, patient, or items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary placeholder-text-muted bg-background text-sm"
            />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background text-sm"
            >
              {SALE_STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value} className="text-text-primary">
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background text-sm"
            >
              {PAYMENT_METHOD_OPTIONS.map(option => (
                <option key={option.value} value={option.value} className="text-text-primary">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sales Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-color">
              <thead className="bg-card-bg">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Sale ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border-color">
                {filteredSales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-card-bg">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                      {sale.saleId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {sale.patientName}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      <div className="space-y-1">
                        {sale.items.map((item, index) => (
                          <div key={index} className="text-xs">
                            {item.drugName} x{item.quantity} = ETB {item.totalPrice.toFixed(2)}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                      ETB {sale.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      <div className="flex items-center">
                        <span className="mr-2">{getMethodIcon(sale.paymentMethod)}</span>
                        {sale.paymentMethod.replace('_', ' ').toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {canUpdateStatus(sale) ? (
                        <div className="relative">
                          <Select
                            value={sale.paymentStatus}
                            onChange={(e) => handleStatusUpdate(sale.saleId, e.target.value)}
                            disabled={statusUpdating === sale.saleId}
                            options={SALE_PAYMENT_STATUS_OPTIONS}
                            className="w-32 text-sm"
                          />
                          {statusUpdating === sale.saleId && (
                            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(sale.paymentStatus)}`}>
                          {sale.paymentStatus.toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {new Date(sale.soldAt || sale.createdAt).toLocaleDateString()}
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                       <button 
                         onClick={() => handleViewSale(sale)}
                         className="text-accent-color hover:text-accent-hover mr-3 p-1 rounded hover:bg-accent-color/10 transition-colors cursor-pointer"
                         title="View Sale"
                       >
                         <FaEye size={16} />
                       </button>
                       <button 
                         onClick={() => handleEditSale(sale)}
                         className="text-success hover:text-success/80 mr-3 p-1 rounded hover:bg-success/10 transition-colors cursor-pointer"
                         title="Edit Sale"
                       >
                         <FaEdit size={16} />
                       </button>
                       <button 
                        onClick={() => handleDeleteSale(sale.saleId)}
                         className="text-error hover:text-error/80 p-1 rounded hover:bg-error/10 transition-colors cursor-pointer"
                         title="Delete Sale"
                       >
                         <FaTrash size={16} />
                       </button>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Sale Modal */}
      <Modal
        isOpen={isNewSaleModalOpen}
        onClose={() => {
          setIsNewSaleModalOpen(false);
          setFormData({
            patientId: '',
            patientName: '',
            selectedDrug: '',
            quantity: '',
            paymentMethod: 'CASH',
            paymentStatus: 'PENDING',
            status: 'PENDING',
            discount: '0',
          });
          setErrors({});
        }}
        title="New Sale"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Patient" required error={errors.patientName}>
              <Select
                value={formData.patientId}
                onChange={(e) => {
                  const selectedPatient = patients.find(p => p.patientId === e.target.value);
                  handleInputChange('patientId', e.target.value);
                  handleInputChange('patientName', selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : '');
                }}
                options={PATIENT_OPTIONS}
              />
            </FormField>

            <FormField label="Patient ID" required error={errors.patientId}>
              <Input
                value={formData.patientId}
                onChange={(e) => handleInputChange('patientId', e.target.value)}
                placeholder="Enter patient ID"
              />
            </FormField>

            <FormField label="Drug" required error={errors.selectedDrug}>
              <Select
                value={formData.selectedDrug}
                onChange={(e) => handleInputChange('selectedDrug', e.target.value)}
                options={DRUG_OPTIONS}
              />
            </FormField>

            <FormField label="Quantity" required error={errors.quantity}>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                placeholder="Enter quantity"
                min="1"
              />
            </FormField>

            <FormField label="Payment Method" required error={errors.paymentMethod}>
              <Select
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                options={[
                  { value: 'CASH', label: 'Cash' },
                  { value: 'CARD', label: 'Card' },
                  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
                  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                ]}
              />
            </FormField>

            <FormField label="Status" required error={errors.status}>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                options={SALE_STATUS_OPTIONS}
              />
            </FormField>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsNewSaleModalOpen(false);
                setFormData({
                  patientId: '',
                  patientName: '',
                  selectedDrug: '',
                  quantity: '',
                  paymentMethod: 'CASH',
                  paymentStatus: 'PENDING',
                  status: 'PENDING',
                  discount: '0',
                });
                setErrors({});
              }}
            >
              Cancel
            </Button>
            <Button className='hover:bg-gray-700 cursor-pointer bg-[#1447E6]'
              onClick={handleNewSale}
              loading={loading}
            >
              Complete Sale
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Sale Modal */}
      <Modal
        isOpen={isViewSaleModalOpen}
        onClose={() => {
          setIsViewSaleModalOpen(false);
          setViewingSale(null);
        }}
        title="Sale Details"
        size="md"
      >
        {viewingSale && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Sale ID</label>
                <p className="mt-1 text-sm text-gray-900">{viewingSale.saleId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Patient</label>
                <p className="mt-1 text-sm text-gray-900">{viewingSale.patientName}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Items</label>
                <div className="mt-1 space-y-1">
                  {viewingSale.items.map((item, index) => (
                    <div key={index} className="text-sm text-gray-900">
                      {item.drugName} x{item.quantity} = ETB {item.totalPrice.toFixed(2)}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                <p className="mt-1 text-sm text-gray-900">ETB {viewingSale.totalAmount.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <p className="mt-1 text-sm text-gray-900">{viewingSale.paymentMethod.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(viewingSale.paymentStatus)}`}>
                  {SALE_PAYMENT_STATUS_LABELS[viewingSale.paymentStatus as keyof typeof SALE_PAYMENT_STATUS_LABELS] || viewingSale.paymentStatus.toUpperCase()}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sale Status</label>
                <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(viewingSale.status)}`}>
                  {SALE_STATUS_LABELS[viewingSale.status as keyof typeof SALE_STATUS_LABELS] || viewingSale.status.toUpperCase()}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <p className="mt-1 text-sm text-gray-900">{new Date(viewingSale.soldAt || viewingSale.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsViewSaleModalOpen(false);
                  setViewingSale(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Sale Modal */}
      <Modal
        isOpen={isEditSaleModalOpen}
        onClose={() => {
          setIsEditSaleModalOpen(false);
          setEditingSale(null);
          resetForm();
        }}
        title="Edit Sale"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Patient" required error={errors.patientName}>
              <Select
                value={formData.patientId}
                onChange={(e) => {
                  const selectedPatient = patients.find(p => p.patientId === e.target.value);
                  handleInputChange('patientId', e.target.value);
                  handleInputChange('patientName', selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : '');
                }}
                options={PATIENT_OPTIONS}
              />
            </FormField>

            <FormField label="Patient ID" required error={errors.patientId}>
              <Input
                value={formData.patientId}
                onChange={(e) => handleInputChange('patientId', e.target.value)}
                placeholder="Enter patient ID"
              />
            </FormField>

            <FormField label="Drug" required error={errors.selectedDrug}>
              <Select
                value={formData.selectedDrug}
                onChange={(e) => handleInputChange('selectedDrug', e.target.value)}
                options={DRUG_OPTIONS}
              />
            </FormField>

            <FormField label="Quantity" required error={errors.quantity}>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                placeholder="Enter quantity"
                min="1"
              />
            </FormField>

            <FormField label="Payment Method" required error={errors.paymentMethod}>
              <Select
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                options={[
                  { value: 'CASH', label: 'Cash' },
                  { value: 'CARD', label: 'Card' },
                  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
                  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                ]}
              />
            </FormField>

            <FormField label="Payment Status" required error={errors.paymentStatus}>
              <Select
                value={formData.paymentStatus}
                onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                options={SALE_PAYMENT_STATUS_OPTIONS}
              />
            </FormField>

            <FormField label="Sale Status" required error={errors.status}>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                options={SALE_STATUS_OPTIONS}
              />
            </FormField>

            <FormField label="Discount" error={errors.discount}>
              <Input
                type="number"
                value={formData.discount}
                onChange={(e) => handleInputChange('discount', e.target.value)}
                placeholder="Enter discount amount"
                min="0"
                step="0.01"
              />
            </FormField>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditSaleModalOpen(false);
                setEditingSale(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button className='hover:bg-gray-700 cursor-pointer bg-[#1447E6]'
              onClick={handleUpdateSale}
              loading={loading}
            >
              Update Sale
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
} 