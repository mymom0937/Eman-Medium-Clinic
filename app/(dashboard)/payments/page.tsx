'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StatsCard } from '@/components/dashboard/stats-card';
import { useUserRole } from '@/hooks/useUserRole';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import { Modal } from '@/components/ui/modal';
import { FormField, Input, Select, Button } from '@/components/ui/form';
import { toastManager } from '@/lib/utils/toast';

interface Payment {
  _id: string;
  patientId: string;
  patientName: string;
  amount: number;
  paymentMethod: string;
  status: string;
  reference?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentStats {
  totalRevenue: number;
  pendingAmount: number;
  completedPayments: number;
  totalTransactions: number;
}

const PATIENTS = [
  { value: 'john_doe', label: 'John Doe' },
  { value: 'jane_smith', label: 'Jane Smith' },
  { value: 'michael_johnson', label: 'Michael Johnson' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'all', label: 'All Methods' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'mobile_money', label: 'Mobile Money' },
];

export default function PaymentsPage() {
  const { userRole, userName, isLoaded } = useUserRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [isNewPaymentModalOpen, setIsNewPaymentModalOpen] = useState(false);
  const [isViewPaymentModalOpen, setIsViewPaymentModalOpen] = useState(false);
  const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    pendingAmount: 0,
    completedPayments: 0,
    totalTransactions: 0,
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState({
    patientName: '',
    amount: '',
    paymentMethod: 'cash',
    status: 'completed',
    reference: '',
  });
  const [errors, setErrors] = useState<any>({});

  // Load payments data on component mount
  useEffect(() => {
    const loadPayments = async () => {
      if (!isLoaded) return;

      try {
        setInitialLoading(true);
        const response = await fetch('/api/payments');
        const result = await response.json();
        
        if (response.ok) {
          setPayments(result);
          
          // Calculate stats
          const totalRevenue = result.reduce((sum: number, payment: Payment) => 
            payment.status === 'completed' ? sum + payment.amount : sum, 0);
          const pendingAmount = result.reduce((sum: number, payment: Payment) => 
            payment.status === 'pending' ? sum + payment.amount : sum, 0);
          const completedPayments = result.filter((payment: Payment) => payment.status === 'completed').length;
          const totalTransactions = result.length;

          setStats({
            totalRevenue,
            pendingAmount,
            completedPayments,
            totalTransactions,
          });
        }
      } catch (error) {
        console.error('Error loading payments:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadPayments();
  }, [isLoaded]);

  if (!isLoaded || initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Filter payments based on search, status, and method
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.patientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || payment.status.toLowerCase() === selectedStatus;
    const matchesMethod = selectedMethod === 'all' || payment.paymentMethod.toLowerCase().replace('_', '') === selectedMethod;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
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

    if (!formData.patientName) {
      newErrors.patientName = 'Patient is required';
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNewPayment = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const paymentData = {
        patientName: formData.patientName,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        status: formData.status,
        reference: formData.reference,
      };

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment');
      }

      // Reload payments data
      const paymentsResponse = await fetch('/api/payments');
      const paymentsResult = await paymentsResponse.json();
      
      if (paymentsResponse.ok) {
        setPayments(paymentsResult);
        
        // Recalculate stats
        const totalRevenue = paymentsResult.reduce((sum: number, payment: Payment) => 
          payment.status === 'completed' ? sum + payment.amount : sum, 0);
        const pendingAmount = paymentsResult.reduce((sum: number, payment: Payment) => 
          payment.status === 'pending' ? sum + payment.amount : sum, 0);
        const completedPayments = paymentsResult.filter((payment: Payment) => payment.status === 'completed').length;
        const totalTransactions = paymentsResult.length;

        setStats({
          totalRevenue,
          pendingAmount,
          completedPayments,
          totalTransactions,
        });
      }

      setIsNewPaymentModalOpen(false);
      resetForm();
      toastManager.success('Payment recorded successfully!');
    } catch (error) {
      console.error('Error creating payment:', error);
      toastManager.error('Failed to record payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleViewPayment = (payment: Payment) => {
    setViewingPayment(payment);
    setIsViewPaymentModalOpen(true);
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setFormData({
      patientName: payment.patientName,
      amount: payment.amount.toString(),
      paymentMethod: payment.paymentMethod.toLowerCase(),
      status: payment.status.toLowerCase(),
      reference: payment.reference || '',
    });
    setIsEditPaymentModalOpen(true);
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;
    
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete payment');
      }

      // Reload payments data
      const paymentsResponse = await fetch('/api/payments');
      const paymentsResult = await paymentsResponse.json();
      
      if (paymentsResponse.ok) {
        setPayments(paymentsResult);
        
        // Recalculate stats
        const totalRevenue = paymentsResult.reduce((sum: number, payment: Payment) => 
          payment.status === 'completed' ? sum + payment.amount : sum, 0);
        const pendingAmount = paymentsResult.reduce((sum: number, payment: Payment) => 
          payment.status === 'pending' ? sum + payment.amount : sum, 0);
        const completedPayments = paymentsResult.filter((payment: Payment) => payment.status === 'completed').length;
        const totalTransactions = paymentsResult.length;

        setStats({
          totalRevenue,
          pendingAmount,
          completedPayments,
          totalTransactions,
        });
      }

      toastManager.success('Payment deleted successfully!');
    } catch (error) {
      console.error('Error deleting payment:', error);
      toastManager.error('Failed to delete payment. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      patientName: '',
      amount: '',
      paymentMethod: 'cash',
      status: 'completed',
      reference: '',
    });
    setErrors({});
  };

  const handleUpdatePayment = async () => {
    if (!validateForm() || !editingPayment) return;

    setLoading(true);
    try {
      const paymentData = {
              patientName: formData.patientName,
              amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        status: formData.status,
              reference: formData.reference,
      };

      const response = await fetch(`/api/payments/${editingPayment._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error('Failed to update payment');
      }

      // Reload payments data
      const paymentsResponse = await fetch('/api/payments');
      const paymentsResult = await paymentsResponse.json();
      
      if (paymentsResponse.ok) {
        setPayments(paymentsResult);
        
        // Recalculate stats
        const totalRevenue = paymentsResult.reduce((sum: number, payment: Payment) => 
          payment.status === 'completed' ? sum + payment.amount : sum, 0);
        const pendingAmount = paymentsResult.reduce((sum: number, payment: Payment) => 
          payment.status === 'pending' ? sum + payment.amount : sum, 0);
        const completedPayments = paymentsResult.filter((payment: Payment) => payment.status === 'completed').length;
        const totalTransactions = paymentsResult.length;

        setStats({
          totalRevenue,
          pendingAmount,
          completedPayments,
          totalTransactions,
        });
      }

      setIsEditPaymentModalOpen(false);
      setEditingPayment(null);
      resetForm();
      toastManager.success('Payment updated successfully!');
    } catch (error) {
      console.error('Error updating payment:', error);
      toastManager.error('Failed to update payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Prepare stats for display
  const displayStats = [
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      change: '+8% from last month',
      changeType: 'positive' as const,
      icon: '💵',
    },
    {
      title: 'Pending Amount',
      value: `$${stats.pendingAmount.toFixed(2)}`,
      change: '-12% from last week',
      changeType: 'negative' as const,
      icon: '⏳',
    },
    {
      title: 'Completed Payments',
      value: stats.completedPayments.toString(),
      change: '+15% from last month',
      changeType: 'positive' as const,
      icon: '✅',
    },
    {
      title: 'Total Transactions',
      value: stats.totalTransactions.toString(),
      change: '+22% from last month',
      changeType: 'positive' as const,
      icon: '💳',
    },
  ];

  return (
    <DashboardLayout
      title="Payment Records"
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

        {/* Payment Records Section */}
        <div className="bg-card-bg rounded-lg border border-border-color p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-text-primary">Payment Records</h2>
            <Button onClick={() => setIsNewPaymentModalOpen(true)} className="cursor-pointer bg-[#1447E6]  hover:bg-gray-700">
              Record New Payment
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder="Search payments by ID, patient, or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary placeholder-text-muted bg-background"
            />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background"
            >
              {PAYMENT_STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value} className="text-text-primary">
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background"
            >
              {PAYMENT_METHOD_OPTIONS.map(option => (
                <option key={option.value} value={option.value} className="text-text-primary">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Payments Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-color">
              <thead className="bg-card-bg">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Payment ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Method
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
                {filteredPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-card-bg">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                      {payment._id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {payment.patientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                      ETB {payment.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      <div className="flex items-center">
                        <span className="mr-2">{getMethodIcon(payment.paymentMethod)}</span>
                        {payment.paymentMethod.replace('_', ' ').toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                        {payment.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {new Date(payment.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleViewPayment(payment)}
                        className="text-accent-color hover:text-accent-hover mr-3 p-1 rounded hover:bg-accent-color/10 transition-colors cursor-pointer"
                        title="View Payment"
                      >
                        <FaEye size={16} />
                      </button>
                      <button 
                        onClick={() => handleEditPayment(payment)}
                        className="text-success hover:text-success/80 mr-3 p-1 rounded hover:bg-success/10 transition-colors cursor-pointer"
                        title="Edit Payment"
                      >
                        <FaEdit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeletePayment(payment._id)}
                        className="text-error hover:text-error/80 p-1 rounded hover:bg-error/10 transition-colors cursor-pointer"
                        title="Delete Payment"
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

      {/* New Payment Modal */}
      <Modal
        isOpen={isNewPaymentModalOpen}
        onClose={() => {
          setIsNewPaymentModalOpen(false);
          setFormData({
            patientName: '',
            amount: '',
            paymentMethod: 'cash',
            status: 'completed',
            reference: '',
          });
          setErrors({});
        }}
        title="Record New Payment"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Patient" required error={errors.patientName}>
              <Select
                value={formData.patientName}
                onChange={(e) => handleInputChange('patientName', e.target.value)}
                options={PATIENTS}
              />
            </FormField>

            <FormField label="Amount (ETB)" required error={errors.amount}>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="Enter amount"
                min="0"
              />
            </FormField>

            <FormField label="Payment Method" required error={errors.paymentMethod}>
              <Select
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                options={[
                  { value: 'cash', label: 'Cash' },
                  { value: 'card', label: 'Card' },
                  { value: 'mobile_money', label: 'Mobile Money' },
                ]}
              />
            </FormField>

            <FormField label="Status" required error={errors.status}>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                options={[
                  { value: 'completed', label: 'Completed' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'failed', label: 'Failed' },
                ]}
              />
            </FormField>

            <FormField label="Reference Number">
              <Input
                value={formData.reference}
                onChange={(e) => handleInputChange('reference', e.target.value)}
                placeholder="Enter reference number (optional)"
              />
            </FormField>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsNewPaymentModalOpen(false);
                setFormData({
                  patientName: '',
                  amount: '',
                  paymentMethod: 'cash',
                  status: 'completed',
                  reference: '',
                });
                setErrors({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleNewPayment}
              loading={loading}
            >
              Record Payment
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Payment Modal */}
      <Modal
        isOpen={isViewPaymentModalOpen}
        onClose={() => {
          setIsViewPaymentModalOpen(false);
          setViewingPayment(null);
        }}
        title="Payment Details"
        size="md"
      >
        {viewingPayment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment ID</label>
                <p className="mt-1 text-sm text-gray-900">{viewingPayment._id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Patient</label>
                <p className="mt-1 text-sm text-gray-900">{viewingPayment.patientName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <p className="mt-1 text-sm text-gray-900">ETB {viewingPayment.amount.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <p className="mt-1 text-sm text-gray-900">{viewingPayment.paymentMethod.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(viewingPayment.status)}`}>
                  {viewingPayment.status.toUpperCase()}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <p className="mt-1 text-sm text-gray-900">{new Date(viewingPayment.date).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsViewPaymentModalOpen(false);
                  setViewingPayment(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Payment Modal */}
      <Modal
        isOpen={isEditPaymentModalOpen}
        onClose={() => {
          setIsEditPaymentModalOpen(false);
          setEditingPayment(null);
          resetForm();
        }}
        title="Edit Payment"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Patient" required error={errors.patientName}>
              <Select
                value={formData.patientName}
                onChange={(e) => handleInputChange('patientName', e.target.value)}
                options={PATIENTS}
              />
            </FormField>

            <FormField label="Amount (ETB)" required error={errors.amount}>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="Enter amount"
                min="0"
              />
            </FormField>

            <FormField label="Payment Method" required error={errors.paymentMethod}>
              <Select
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                options={[
                  { value: 'cash', label: 'Cash' },
                  { value: 'card', label: 'Card' },
                  { value: 'mobile_money', label: 'Mobile Money' },
                ]}
              />
            </FormField>

            <FormField label="Status" required error={errors.status}>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                options={[
                  { value: 'completed', label: 'Completed' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'failed', label: 'Failed' },
                ]}
              />
            </FormField>
          </div>

          <FormField label="Reference (Optional)" error={errors.reference}>
            <Input
              value={formData.reference}
              onChange={(e) => handleInputChange('reference', e.target.value)}
              placeholder="Enter reference number"
            />
          </FormField>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditPaymentModalOpen(false);
                setEditingPayment(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePayment}
              loading={loading}
            >
              Update Payment
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
} 