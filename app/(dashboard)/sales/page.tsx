'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StatsCard } from '@/components/dashboard/stats-card';
import { useUserRole } from '@/hooks/useUserRole';
import { Modal } from '@/components/ui/modal';
import { FormField, Input, Select, Button } from '@/components/ui/form';
import { toastManager } from '@/lib/utils/toast';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';

// Mock data - in real app, this would come from API
const mockStats = [
  {
    title: 'Total Sales',
    value: '189',
    change: '+12% from last month',
    changeType: 'positive' as const,
    icon: '💰',
  },
  {
    title: 'Total Revenue',
    value: '$15,750',
    change: '+8% from last month',
    changeType: 'positive' as const,
    icon: '💵',
  },
  {
    title: 'Average Sale',
    value: '$83.33',
    change: '+5% from last month',
    changeType: 'positive' as const,
    icon: '📊',
  },
  {
    title: "Today's Sales",
    value: '12',
    change: '+3 from yesterday',
    changeType: 'positive' as const,
    icon: '📅',
  },
];

const mockSales = [
  {
    id: 1,
    saleId: 'SALE000001',
    patientName: 'John Doe',
    items: [
      { drugName: 'Paracetamol 500mg', quantity: 2, total: 31.00 },
      { drugName: 'Ibuprofen 400mg', quantity: 1, total: 12.75 },
    ],
    totalAmount: 43.75,
    paymentMethod: 'CASH',
    saleStatus: 'COMPLETED',
    soldAt: '2024-01-20T10:30:00Z',
  },
  {
    id: 2,
    saleId: 'SALE000002',
    patientName: 'Jane Smith',
    items: [
      { drugName: 'Amoxicillin 250mg', quantity: 1, total: 25.00 },
      { drugName: 'Omeprazole 20mg', quantity: 2, total: 40.00 },
    ],
    totalAmount: 65.00,
    paymentMethod: 'CARD',
    saleStatus: 'COMPLETED',
    soldAt: '2024-01-20T11:15:00Z',
  },
  {
    id: 3,
    saleId: 'SALE000003',
    patientName: 'Michael Johnson',
    items: [
      { drugName: 'Metformin 500mg', quantity: 3, total: 45.00 },
    ],
    totalAmount: 45.00,
    paymentMethod: 'MOBILE_MONEY',
    saleStatus: 'PENDING',
    soldAt: '2024-01-20T12:00:00Z',
  },
];

const SALE_STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'all', label: 'All Methods' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'mobile_money', label: 'Mobile Money' },
];

const PATIENTS = [
  { value: 'john_doe', label: 'John Doe' },
  { value: 'jane_smith', label: 'Jane Smith' },
  { value: 'michael_johnson', label: 'Michael Johnson' },
];

const DRUGS = [
  { value: 'paracetamol', label: 'Paracetamol 500mg - ETB 15.50' },
  { value: 'ibuprofen', label: 'Ibuprofen 400mg - ETB 12.75' },
  { value: 'amoxicillin', label: 'Amoxicillin 250mg - ETB 25.00' },
  { value: 'omeprazole', label: 'Omeprazole 20mg - ETB 20.00' },
  { value: 'metformin', label: 'Metformin 500mg - ETB 15.00' },
];

export default function SalesPage() {
  const { userRole, userName, isLoaded } = useUserRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [isViewSaleModalOpen, setIsViewSaleModalOpen] = useState(false);
  const [isEditSaleModalOpen, setIsEditSaleModalOpen] = useState(false);
  const [viewingSale, setViewingSale] = useState<any>(null);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [sales, setSales] = useState(mockSales);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    selectedDrug: '',
    quantity: '',
    paymentMethod: 'cash',
  });
  const [errors, setErrors] = useState<any>({});

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Filter sales based on search, status, and method
  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.saleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.patientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || sale.saleStatus.toLowerCase() === selectedStatus;
    const matchesMethod = selectedMethod === 'all' || sale.paymentMethod.toLowerCase().replace('_', '') === selectedMethod;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
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

  const generateSaleId = () => {
    const lastSale = sales[sales.length - 1];
    const lastNumber = lastSale ? parseInt(lastSale.saleId.replace('SALE', '')) : 0;
    return `SALE${String(lastNumber + 1).padStart(6, '0')}`;
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};

    if (!formData.patientName) {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNewSale = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const selectedDrugInfo = DRUGS.find(drug => drug.value === formData.selectedDrug);
      const unitPrice = parseFloat(selectedDrugInfo?.label.split('ETB ')[1] || '0');
      const quantity = parseInt(formData.quantity);
      const totalAmount = unitPrice * quantity;

      const newSale = {
        id: sales.length + 1,
        saleId: generateSaleId(),
        patientName: PATIENTS.find(p => p.value === formData.patientName)?.label || formData.patientName,
        items: [
          { 
            drugName: selectedDrugInfo?.label.split(' - ')[0] || 'Unknown Drug', 
            quantity: quantity, 
            total: totalAmount 
          }
        ],
        totalAmount: totalAmount,
        paymentMethod: formData.paymentMethod.toUpperCase(),
        saleStatus: 'COMPLETED',
        soldAt: new Date().toISOString(),
      };

      setSales([newSale, ...sales]);
      setIsNewSaleModalOpen(false);
      setFormData({
        patientName: '',
        selectedDrug: '',
        quantity: '',
        paymentMethod: 'cash',
      });
      setErrors({});
      toastManager.success('Sale completed successfully!');
    } catch (error) {
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

  const handleViewSale = (sale: any) => {
    setViewingSale(sale);
    setIsViewSaleModalOpen(true);
  };

  const handleEditSale = (sale: any) => {
    setEditingSale(sale);
    setFormData({
      patientName: sale.patientName,
      selectedDrug: '',
      quantity: '',
      paymentMethod: sale.paymentMethod.toLowerCase(),
    });
    setIsEditSaleModalOpen(true);
  };

  const handleDeleteSale = (saleId: number) => {
    if (!confirm('Are you sure you want to delete this sale?')) return;
    
    try {
      setSales(sales.filter(sale => sale.id !== saleId));
      toastManager.success('Sale deleted successfully!');
    } catch (error) {
      toastManager.error('Failed to delete sale. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      patientName: '',
      selectedDrug: '',
      quantity: '',
      paymentMethod: 'cash',
    });
    setErrors({});
  };

  const handleUpdateSale = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedSales = sales.map(sale =>
        sale.id === editingSale.id
          ? {
              ...sale,
              patientName: formData.patientName,
              paymentMethod: formData.paymentMethod.toUpperCase(),
            }
          : sale
      );

      setSales(updatedSales);
      setIsEditSaleModalOpen(false);
      setEditingSale(null);
      resetForm();
      toastManager.success('Sale updated successfully!');
    } catch (error) {
      toastManager.error('Failed to update sale. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Sales Management"
      userRole={userRole}
      userName={userName}
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <tr key={sale.id} className="hover:bg-card-bg">
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
                            {item.drugName} x{item.quantity} = ETB {item.total.toFixed(2)}
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
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(sale.saleStatus)}`}>
                        {sale.saleStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {new Date(sale.soldAt).toLocaleDateString()}
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
                         onClick={() => handleDeleteSale(sale.id)}
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
            patientName: '',
            selectedDrug: '',
            quantity: '',
            paymentMethod: 'cash',
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
                value={formData.patientName}
                onChange={(e) => handleInputChange('patientName', e.target.value)}
                options={PATIENTS}
              />
            </FormField>

            <FormField label="Drug" required error={errors.selectedDrug}>
              <Select
                value={formData.selectedDrug}
                onChange={(e) => handleInputChange('selectedDrug', e.target.value)}
                options={DRUGS}
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
                  { value: 'cash', label: 'Cash' },
                  { value: 'card', label: 'Card' },
                  { value: 'mobile_money', label: 'Mobile Money' },
                ]}
              />
            </FormField>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsNewSaleModalOpen(false);
                setFormData({
                  patientName: '',
                  selectedDrug: '',
                  quantity: '',
                  paymentMethod: 'cash',
                });
                setErrors({});
              }}
            >
              Cancel
            </Button>
            <Button
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
                  {viewingSale.items.map((item: any, index: number) => (
                    <div key={index} className="text-sm text-gray-900">
                      {item.drugName} x{item.quantity} = ETB {item.total.toFixed(2)}
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
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(viewingSale.saleStatus)}`}>
                  {viewingSale.saleStatus.toUpperCase()}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <p className="mt-1 text-sm text-gray-900">{new Date(viewingSale.soldAt).toLocaleDateString()}</p>
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
                value={formData.patientName}
                onChange={(e) => handleInputChange('patientName', e.target.value)}
                options={PATIENTS}
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
            <Button
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