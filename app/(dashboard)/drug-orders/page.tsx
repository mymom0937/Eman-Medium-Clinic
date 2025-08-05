'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { FormField, Input, Select, TextArea } from '@/components/ui/form';
import { DrugOrder, DrugOrderItem } from '@/types/drug-order';
import { DRUG_ORDER_STATUS_LABELS } from '@/types/drug-order';
import { USER_ROLES } from '@/constants/user-roles';
import { useUserRole } from '@/hooks/useUserRole';
import { PageLoader } from '@/components/common/loading-spinner';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import { toastManager } from '@/lib/utils/toast';
import { StatsCard } from '@/components/dashboard/stats-card';


const ORDER_STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'DISPENSED', label: 'Dispensed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

interface Drug {
  _id: string;
  name: string;
  sellingPrice: number;
  stockQuantity: number;
  category: string;
  manufacturer: string;
  dosageForm: string;
  strength: string;
}

interface DrugOrderFormData {
  patientId: string;
  patientName: string;
  labResultId: string;
  items: DrugOrderItem[];
  notes: string;
}

export default function DrugOrdersPage() {
  const { userId } = useAuth();
  const { userRole, userName, isLoaded } = useUserRole();
  const [drugOrders, setDrugOrders] = useState<DrugOrder[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingDrugOrder, setEditingDrugOrder] = useState<DrugOrder | null>(null);
  const [viewingDrugOrder, setViewingDrugOrder] = useState<DrugOrder | null>(null);
  const [formData, setFormData] = useState<DrugOrderFormData>({
    patientId: '',
    patientName: '',
    labResultId: '',
    items: [],
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  // Load drug orders and drugs data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!isLoaded) return;

      try {
        setInitialLoading(true);
        
        // Fetch drug orders
        const ordersResponse = await fetch('/api/drug-orders');
        const ordersResult = await ordersResponse.json();
        
        if (ordersResponse.ok) {
          setDrugOrders(ordersResult);
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

  // Filter drug orders based on search and filters
  const filteredDrugOrders = drugOrders.filter(order => {
    const matchesSearch = (order.drugOrderId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          order.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.items.some(item => item.drugName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DISPENSED':
        return 'bg-green-100 text-green-800';
      case 'APPROVED':
        return 'bg-yellow-100 text-yellow-800';
      case 'PENDING':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientId.trim()) {
      newErrors.patientId = 'Patient ID is required';
    }
    if (!formData.patientName.trim()) {
      newErrors.patientName = 'Patient name is required';
    }
    if (formData.items.length === 0) {
      newErrors.items = 'At least one drug item is required';
    } else {
      // Check each drug item for required fields
      formData.items.forEach((item, index) => {
        if (!item.drugId?.trim()) {
          newErrors[`items.${index}.drugId`] = 'Drug ID is required';
        }
        if (!item.drugName?.trim()) {
          newErrors[`items.${index}.drugName`] = 'Drug name is required';
        }
        if (!item.quantity || item.quantity <= 0) {
          newErrors[`items.${index}.quantity`] = 'Quantity must be greater than 0';
        }
        if (!item.unitPrice || item.unitPrice <= 0) {
          newErrors[`items.${index}.unitPrice`] = 'Unit price must be greater than 0';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddDrugOrder = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const orderData = {
        patientId: formData.patientId,
        patientName: formData.patientName,
        labResultId: formData.labResultId || undefined,
        items: formData.items,
        notes: formData.notes,
      };

      const response = await fetch('/api/drug-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create drug order');
      }

      // Reload drug orders data
      const ordersResponse = await fetch('/api/drug-orders');
      const ordersResult = await ordersResponse.json();
      
      if (ordersResponse.ok) {
        setDrugOrders(ordersResult);
      }

      setIsAddModalOpen(false);
      resetForm();
      toastManager.success('Drug order created successfully!');
    } catch (error) {
      console.error('Error creating drug order:', error);
      toastManager.error('Failed to create drug order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDrugOrder = (drugOrder: DrugOrder) => {
    setEditingDrugOrder(drugOrder);
    setFormData({
      patientId: drugOrder.patientId,
      patientName: drugOrder.patientName,
      labResultId: drugOrder.labResultId || '',
      items: drugOrder.items,
      notes: drugOrder.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateDrugOrder = async () => {
    if (!validateForm() || !editingDrugOrder) return;

    setLoading(true);
    try {
      const orderData = {
        patientId: formData.patientId,
        patientName: formData.patientName,
        labResultId: formData.labResultId || undefined,
        items: formData.items,
        notes: formData.notes,
      };

      const response = await fetch(`/api/drug-orders/${editingDrugOrder._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to update drug order');
      }

      // Reload drug orders data
      const ordersResponse = await fetch('/api/drug-orders');
      const ordersResult = await ordersResponse.json();
      
      if (ordersResponse.ok) {
        setDrugOrders(ordersResult);
      }

      setIsEditModalOpen(false);
      setEditingDrugOrder(null);
      resetForm();
      toastManager.success('Drug order updated successfully!');
    } catch (error) {
      console.error('Error updating drug order:', error);
      toastManager.error('Failed to update drug order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDrugOrder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this drug order?')) return;

    try {
      const response = await fetch(`/api/drug-orders/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete drug order');
      }

      // Reload drug orders data
      const ordersResponse = await fetch('/api/drug-orders');
      const ordersResult = await ordersResponse.json();
      
      if (ordersResponse.ok) {
        setDrugOrders(ordersResult);
      }
      toastManager.success('Drug order deleted successfully!');
    } catch (error) {
      console.error('Error deleting drug order:', error);
      toastManager.error('Failed to delete drug order. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: '',
      patientName: '',
      labResultId: '',
      items: [],
      notes: '',
    });
    setErrors({});
  };

  const handleInputChange = (field: keyof DrugOrderFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleViewDrugOrder = (drugOrder: DrugOrder) => {
    setViewingDrugOrder(drugOrder);
    setIsViewModalOpen(true);
  };

  const addDrugItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        drugId: '',
        drugName: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        dosage: '',
        instructions: '',
      }],
    }));
  };

  const removeDrugItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateDrugItem = (index: number, field: keyof DrugOrderItem, value: any) => {
    setFormData(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      
      // Recalculate total price
      if (field === 'quantity' || field === 'unitPrice') {
        updatedItems[index].totalPrice = updatedItems[index].quantity * updatedItems[index].unitPrice;
      }
      
      return { ...prev, items: updatedItems };
    });
  };

  const canUpdateStatus = (drugOrder: DrugOrder) => {
    if (userRole === USER_ROLES.SUPER_ADMIN) return true;
    if (userRole === USER_ROLES.PHARMACIST) return true;
    return false;
  };

  const handleStatusUpdate = async (drugOrderId: string, newStatus: string) => {
    if (!canUpdateStatus({} as DrugOrder)) return;

    setStatusUpdating(drugOrderId);
    try {
      const response = await fetch(`/api/drug-orders/${drugOrderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Reload drug orders data
      const ordersResponse = await fetch('/api/drug-orders');
      const ordersResult = await ordersResponse.json();
      
      if (ordersResponse.ok) {
        setDrugOrders(ordersResult);
      }

      // Show success message (you can add a toast notification here)
      toastManager.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      // Show error message (you can add a toast notification here)
      toastManager.error('Failed to update status');
    } finally {
      setStatusUpdating(null);
    }
  };

  // Prepare stats for display
  const displayStats = [
    {
      title: 'Pending',
      value: drugOrders.filter(o => o.status === 'PENDING').length.toString(),
      change: '+2 from yesterday',
      changeType: 'negative' as const,
      icon: '⏳',
    },
    {
      title: 'Approved',
      value: drugOrders.filter(o => o.status === 'APPROVED').length.toString(),
      change: '+1 from yesterday',
      changeType: 'positive' as const,
      icon: '✅',
    },
    {
      title: 'Dispensed',
      value: drugOrders.filter(o => o.status === 'DISPENSED').length.toString(),
      change: '+1 from yesterday',
      changeType: 'positive' as const,
      icon: '💊',
    },
    {
      title: 'Cancelled',
      value: drugOrders.filter(o => o.status === 'CANCELLED').length.toString(),
      change: '0 from yesterday',
      changeType: 'neutral' as const,
      icon: '❌',
    },
  ];

  if (!isLoaded || initialLoading) {
    return (
      <DashboardLayout
        title="Drug Orders"
        userRole={userRole}
        userName={userName}
      >
        <div className="flex items-center justify-center h-[60vh]">
          <PageLoader text="Loading drug orders..." />
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout
        title="Drug Orders"
        userRole={userRole}
        userName={userName}
      >
        <div className="flex items-center justify-center h-[60vh]">
          <PageLoader text="Loading drug orders..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Drug Orders"
      userRole={userRole}
      userName={userName}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-text-primary">Drug Orders</h1>
          {(userRole === USER_ROLES.NURSE || userRole === USER_ROLES.SUPER_ADMIN) && (
            <Button 
              onClick={() => setIsAddModalOpen(true)} 
              className="bg-[#1447E6] hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
            >
              Create New Order
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by drug order ID, patient ID, name, or drug name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-accent-color focus:border-transparent text-text-primary placeholder-text-muted bg-background"
          />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color focus:border-transparent text-text-primary bg-background text-sm"
          >
            {ORDER_STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value} className="text-text-primary">
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-card-bg">
              <TableHead className="text-left font-semibold text-text-primary py-3 px-4">Patient</TableHead>
              <TableHead className="text-left font-semibold text-text-primary py-3 px-4">Drug Order ID</TableHead>
              <TableHead className="text-left font-semibold text-text-primary py-3 px-4">Items</TableHead>
              <TableHead className="text-left font-semibold text-text-primary py-3 px-4">Total Amount</TableHead>
              <TableHead className="text-left font-semibold text-text-primary py-3 px-4">Status</TableHead>
              <TableHead className="text-left font-semibold text-text-primary py-3 px-4">Ordered</TableHead>
              <TableHead className="text-left font-semibold text-text-primary py-3 px-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDrugOrders.map((order) => (
              <TableRow key={order._id} className="border-b border-border-color hover:bg-card-bg">
                <TableCell className="py-3 px-4">
                  <div>
                    <div className="font-medium text-text-primary">{order.patientName}</div>
                    <div className="text-sm text-text-muted">{order.patientId}</div>
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4">
                  <div className="font-medium text-text-primary">
                    {order.drugOrderId || 'N/A'}
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4">
                  <div className="text-sm text-text-primary">
                    {order.items.length} item(s)
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4 text-text-primary">
                  ${order.totalAmount.toFixed(2)}
                </TableCell>
                <TableCell className="py-3 px-4">
                  {canUpdateStatus(order) ? (
                    <div className="relative">
                      <Select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                        disabled={statusUpdating === order._id}
                        options={[
                          { value: 'PENDING', label: 'Pending' },
                          { value: 'APPROVED', label: 'Approved' },
                          { value: 'DISPENSED', label: 'Dispensed' },
                          { value: 'CANCELLED', label: 'Cancelled' },
                        ]}
                        className="w-32 text-sm"
                      />
                      {statusUpdating === order._id && (
                        <div className="absolute inset-0 bg-background bg-opacity-75 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-color"></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {DRUG_ORDER_STATUS_LABELS[order.status]}
                    </span>
                  )}
                </TableCell>
                <TableCell className="py-3 px-4 text-text-muted">
                  {formatDate(order.orderedAt)}
                </TableCell>
                <TableCell className="py-3 px-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                  <button 
                    onClick={() => handleViewDrugOrder(order)}
                    className="text-blue-600 hover:text-blue-400 mr-3 p-1 rounded hover:bg-blue-900/20 transition-colors cursor-pointer"
                    title="View Drug Order"
                  >
                    <FaEye size={16} />
                  </button>
                  {(userRole === USER_ROLES.NURSE || userRole === USER_ROLES.SUPER_ADMIN) && (
                    <button 
                      onClick={() => handleEditDrugOrder(order)}
                      className="text-green-600 hover:text-green-400 mr-3 p-1 rounded hover:bg-green-900/20 transition-colors cursor-pointer"
                      title="Edit Drug Order"
                    >
                      <FaEdit size={16} />
                    </button>
                  )}
                  {userRole === USER_ROLES.SUPER_ADMIN && (
                    <button 
                      onClick={() => handleDeleteDrugOrder(order._id)}
                      className="text-red-600 hover:text-red-400 p-1 rounded hover:bg-red-900/20 transition-colors cursor-pointer"
                      title="Delete Drug Order"
                    >
                      <FaTrash size={16} />
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Drug Order Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        title="Create New Drug Order"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Patient ID" required error={errors.patientId}>
              <Input
                value={formData.patientId}
                onChange={(e) => handleInputChange('patientId', e.target.value)}
                placeholder="Enter patient ID"
                className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color focus:border-transparent text-text-primary placeholder-text-muted bg-background"
              />
            </FormField>

            <FormField label="Patient Name" required error={errors.patientName}>
              <Input
                value={formData.patientName}
                onChange={(e) => handleInputChange('patientName', e.target.value)}
                placeholder="Enter patient name"
                className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color focus:border-transparent text-text-primary placeholder-text-muted bg-background"
              />
            </FormField>

            <FormField label="Lab Result ID">
              <Input
                value={formData.labResultId}
                onChange={(e) => handleInputChange('labResultId', e.target.value)}
                placeholder="Enter lab result ID (optional)"
                className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color focus:border-transparent text-text-primary placeholder-text-muted bg-background"
              />
            </FormField>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Drug Items</label>
            {formData.items.map((item, index) => (
              <div key={index} className="border border-border-color p-4 rounded-lg mb-4 bg-card-bg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Drug" error={errors[`items.${index}.drugId`]}>
                    <Select
                      value={item.drugId}
                      onChange={(e) => {
                        const drug = drugs.find(d => d._id === e.target.value);
                        updateDrugItem(index, 'drugId', e.target.value);
                        updateDrugItem(index, 'drugName', drug?.name || '');
                        updateDrugItem(index, 'unitPrice', drug?.sellingPrice || 0);
                      }}
                      options={[
                        { value: '', label: 'Select a drug...' },
                        ...drugs.map(drug => ({
                          value: drug._id,
                          label: `${drug.name} - ${drug.strength} (${drug.dosageForm})`,
                        }))
                      ]}
                      className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color focus:border-transparent text-text-primary bg-background"
                    />
                  </FormField>

                  <FormField label="Quantity" error={errors[`items.${index}.quantity`]}>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateDrugItem(index, 'quantity', parseInt(e.target.value))}
                      min="1"
                      className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color focus:border-transparent text-text-primary bg-background"
                    />
                  </FormField>

                  <FormField label="Unit Price" error={errors[`items.${index}.unitPrice`]}>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateDrugItem(index, 'unitPrice', parseFloat(e.target.value))}
                      min="0"
                      className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color focus:border-transparent text-text-primary bg-background"
                    />
                  </FormField>

                  <FormField label="Total Price">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.totalPrice}
                      disabled
                      className="w-full border border-border-color rounded-md px-3 py-2 bg-card-bg text-text-muted"
                    />
                  </FormField>

                  <FormField label="Dosage">
                    <Input
                      value={item.dosage}
                      onChange={(e) => updateDrugItem(index, 'dosage', e.target.value)}
                      placeholder="e.g., 1 tablet twice daily"
                      className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color focus:border-transparent text-text-primary placeholder-text-muted bg-background"
                    />
                  </FormField>

                  <FormField label="Instructions">
                    <Input
                      value={item.instructions}
                      onChange={(e) => updateDrugItem(index, 'instructions', e.target.value)}
                      placeholder="e.g., Take with food"
                      className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color focus:border-transparent text-text-primary placeholder-text-muted bg-background"
                    />
                  </FormField>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeDrugItem(index)}
                  className="mt-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                >
                  Remove Item
                </Button>
              </div>
            ))}

            <Button onClick={addDrugItem} variant="outline" className="w-full border border-border-color text-text-primary hover:bg-card-bg">
              Add Drug Item
            </Button>
          </div>

          <FormField label="Notes">
            <TextArea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any additional notes..."
              rows={4}
              className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color focus:border-transparent text-text-primary placeholder-text-muted bg-background"
            />
          </FormField>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddDrugOrder}
              loading={loading}
              className="bg-[#1447E6] hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              Create Order
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Drug Order Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingDrugOrder(null);
          resetForm();
        }}
        title="Edit Drug Order"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Patient ID" required error={errors.patientId}>
              <Input
                value={formData.patientId}
                onChange={(e) => handleInputChange('patientId', e.target.value)}
                placeholder="Enter patient ID"
                className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color focus:border-transparent text-text-primary placeholder-text-muted bg-background"
              />
            </FormField>

            <FormField label="Patient Name" required error={errors.patientName}>
              <Input
                value={formData.patientName}
                onChange={(e) => handleInputChange('patientName', e.target.value)}
                placeholder="Enter patient name"
                className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color focus:border-transparent text-text-primary placeholder-text-muted bg-background"
              />
            </FormField>

            <FormField label="Lab Result ID">
              <Input
                value={formData.labResultId}
                onChange={(e) => handleInputChange('labResultId', e.target.value)}
                placeholder="Enter lab result ID (optional)"
                className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color focus:border-transparent text-text-primary placeholder-text-muted bg-background"
              />
            </FormField>

            {editingDrugOrder && canUpdateStatus(editingDrugOrder) && (
              <FormField label="Status">
                <Select
                  value={editingDrugOrder.status}
                  onChange={(e) => handleStatusUpdate(editingDrugOrder._id, e.target.value)}
                  disabled={statusUpdating === editingDrugOrder._id}
                  options={[
                    { value: 'PENDING', label: 'Pending' },
                    { value: 'APPROVED', label: 'Approved' },
                    { value: 'DISPENSED', label: 'Dispensed' },
                    { value: 'CANCELLED', label: 'Cancelled' },
                  ]}
                  className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color focus:border-transparent text-text-primary bg-background"
                />
                {statusUpdating === editingDrugOrder._id && (
                  <div className="mt-1 text-sm text-blue-600 dark:text-blue-400">Updating status...</div>
                )}
              </FormField>
            )}

            {editingDrugOrder && !canUpdateStatus(editingDrugOrder) && (
              <FormField label="Status">
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(editingDrugOrder.status)}`}>
                    {DRUG_ORDER_STATUS_LABELS[editingDrugOrder.status]}
                  </span>
                  <span className="text-xs text-text-muted">(Only Pharmacists and Super Admins can update status)</span>
                </div>
              </FormField>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Drug Items</label>
            {formData.items.map((item, index) => (
              <div key={index} className="border border-border-color p-4 rounded-lg mb-4 bg-card-bg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Drug" error={errors[`items.${index}.drugId`]}>
                    <Select
                      value={item.drugId}
                      onChange={(e) => {
                        const drug = drugs.find(d => d._id === e.target.value);
                        updateDrugItem(index, 'drugId', e.target.value);
                        updateDrugItem(index, 'drugName', drug?.name || '');
                        updateDrugItem(index, 'unitPrice', drug?.sellingPrice || 0);
                      }}
                      options={[
                        { value: '', label: 'Select a drug...' },
                        ...drugs.map(drug => ({
                          value: drug._id,
                          label: `${drug.name} - ${drug.strength} (${drug.dosageForm})`,
                        }))
                      ]}
                      className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color focus:border-transparent text-text-primary bg-background"
                    />
                  </FormField>

                  <FormField label="Quantity" error={errors[`items.${index}.quantity`]}>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateDrugItem(index, 'quantity', parseInt(e.target.value))}
                      min="1"
                      className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color focus:border-transparent text-text-primary bg-background"
                    />
                  </FormField>

                  <FormField label="Unit Price" error={errors[`items.${index}.unitPrice`]}>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateDrugItem(index, 'unitPrice', parseFloat(e.target.value))}
                      min="0"
                      className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color focus:border-transparent text-text-primary bg-background"
                    />
                  </FormField>

                  <FormField label="Total Price">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.totalPrice}
                      disabled
                      className="w-full border border-border-color rounded-md px-3 py-2 bg-card-bg text-text-muted"
                    />
                  </FormField>

                  <FormField label="Dosage">
                    <Input
                      value={item.dosage}
                      onChange={(e) => updateDrugItem(index, 'dosage', e.target.value)}
                      placeholder="e.g., 1 tablet twice daily"
                      className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color focus:border-transparent text-text-primary placeholder-text-muted bg-background"
                    />
                  </FormField>

                  <FormField label="Instructions">
                    <Input
                      value={item.instructions}
                      onChange={(e) => updateDrugItem(index, 'instructions', e.target.value)}
                      placeholder="e.g., Take with food"
                      className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color focus:border-transparent text-text-primary placeholder-text-muted bg-background"
                    />
                  </FormField>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeDrugItem(index)}
                  className="mt-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                >
                  Remove Item
                </Button>
              </div>
            ))}

            <Button onClick={addDrugItem} variant="outline" className="w-full border border-border-color text-text-primary hover:bg-card-bg">
              Add Drug Item
            </Button>
          </div>

          <FormField label="Notes">
            <TextArea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any additional notes..."
              rows={4}
              className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color focus:border-transparent text-text-primary placeholder-text-muted bg-background"
            />
          </FormField>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingDrugOrder(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateDrugOrder}
              loading={loading}
              className="bg-[#1447E6] hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              Update Order
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Drug Order Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingDrugOrder(null);
        }}
        title="Drug Order Details"
        size="lg"
      >
        {viewingDrugOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-muted">Drug Order ID</label>
                <p className="mt-1 text-sm text-text-primary">{viewingDrugOrder.drugOrderId || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted">Patient ID</label>
                <p className="mt-1 text-sm text-text-primary">{viewingDrugOrder.patientId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted">Patient Name</label>
                <p className="mt-1 text-sm text-text-primary">{viewingDrugOrder.patientName}</p>
              </div>
              {viewingDrugOrder.labResultId && (
                <div>
                  <label className="block text-sm font-medium text-text-muted">Lab Result ID</label>
                  <p className="mt-1 text-sm text-text-primary">{viewingDrugOrder.labResultId}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-text-muted">Status</label>
                {canUpdateStatus(viewingDrugOrder) ? (
                  <div className="mt-1">
                    <Select
                      value={viewingDrugOrder.status}
                      onChange={(e) => handleStatusUpdate(viewingDrugOrder._id, e.target.value)}
                      disabled={statusUpdating === viewingDrugOrder._id}
                      options={[
                        { value: 'PENDING', label: 'Pending' },
                        { value: 'APPROVED', label: 'Approved' },
                        { value: 'DISPENSED', label: 'Dispensed' },
                        { value: 'CANCELLED', label: 'Cancelled' },
                      ]}
                      className="w-full"
                    />
                    {statusUpdating === viewingDrugOrder._id && (
                      <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">Updating status...</div>
                    )}
                  </div>
                ) : (
                  <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(viewingDrugOrder.status)}`}>
                    {DRUG_ORDER_STATUS_LABELS[viewingDrugOrder.status]}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted">Ordered At</label>
                <p className="mt-1 text-sm text-text-primary">
                  {formatDate(viewingDrugOrder.orderedAt)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted">Total Amount</label>
                <p className="mt-1 text-sm text-text-primary">${viewingDrugOrder.totalAmount.toFixed(2)}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Drug Items</label>
              <div className="space-y-2">
                {viewingDrugOrder.items.map((item, index) => (
                  <div key={index} className="border border-border-color p-3 rounded-lg bg-card-bg">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-text-muted">Drug:</span>
                        <p className="font-medium text-text-primary">{item.drugName}</p>
                      </div>
                      <div>
                        <span className="text-text-muted">Quantity:</span>
                        <p className="font-medium text-text-primary">{item.quantity}</p>
                      </div>
                      <div>
                        <span className="text-text-muted">Unit Price:</span>
                        <p className="font-medium text-text-primary">${item.unitPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-text-muted">Total Price:</span>
                        <p className="font-medium text-text-primary">${item.totalPrice.toFixed(2)}</p>
                      </div>
                      {item.dosage && (
                        <div>
                          <span className="text-text-muted">Dosage:</span>
                          <p className="font-medium text-text-primary">{item.dosage}</p>
                        </div>
                      )}
                      {item.instructions && (
                        <div>
                          <span className="text-text-muted">Instructions:</span>
                          <p className="font-medium text-text-primary">{item.instructions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {viewingDrugOrder.notes && (
              <div>
                <label className="block text-sm font-medium text-text-muted">Notes</label>
                <p className="mt-1 text-sm text-text-primary">{viewingDrugOrder.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewingDrugOrder(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
} 