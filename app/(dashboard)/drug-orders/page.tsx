'use client';

import { useState, useEffect } from 'react';
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
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';

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
    } catch (error) {
      console.error('Error creating drug order:', error);
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
    } catch (error) {
      console.error('Error updating drug order:', error);
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
    } catch (error) {
      console.error('Error deleting drug order:', error);
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

  if (!isLoaded || initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-900">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <DashboardLayout
        title="Drug Orders"
        userRole={userRole}
        userName={userName}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-900">Loading drug orders...</p>
          </div>
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
          <h1 className="text-3xl font-bold text-gray-900">Drug Orders</h1>
          {(userRole === USER_ROLES.NURSE || userRole === USER_ROLES.SUPER_ADMIN) && (
            <Button 
              onClick={() => setIsAddModalOpen(true)} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
            >
              Create New Order
            </Button>
          )}
        </div>

        <Card className="bg-white shadow-lg rounded-lg">
          <CardHeader className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <CardTitle className="text-xl font-semibold text-gray-900">Drug Orders Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">
                  {drugOrders.filter(o => o.status === 'PENDING').length}
                </div>
                <div className="text-sm text-yellow-700">Pending</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {drugOrders.filter(o => o.status === 'APPROVED').length}
                </div>
                <div className="text-sm text-blue-700">Approved</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {drugOrders.filter(o => o.status === 'DISPENSED').length}
                </div>
                <div className="text-sm text-green-700">Dispensed</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">
                  {drugOrders.filter(o => o.status === 'CANCELLED').length}
                </div>
                <div className="text-sm text-red-700">Cancelled</div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
              <input
                type="text"
                placeholder="Search by drug order ID, patient ID, name, or drug name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white text-sm"
              >
                {ORDER_STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-left font-semibold text-gray-900 py-3 px-4">Patient</TableHead>
                  <TableHead className="text-left font-semibold text-gray-900 py-3 px-4">Drug Order ID</TableHead>
                  <TableHead className="text-left font-semibold text-gray-900 py-3 px-4">Items</TableHead>
                  <TableHead className="text-left font-semibold text-gray-900 py-3 px-4">Total Amount</TableHead>
                  <TableHead className="text-left font-semibold text-gray-900 py-3 px-4">Status</TableHead>
                  <TableHead className="text-left font-semibold text-gray-900 py-3 px-4">Ordered</TableHead>
                  <TableHead className="text-left font-semibold text-gray-900 py-3 px-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrugOrders.map((order) => (
                  <TableRow key={order._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <TableCell className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{order.patientName}</div>
                        <div className="text-sm text-gray-500">{order.patientId}</div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="font-medium text-text-primary">
                        {order.drugOrderId || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="text-sm text-gray-900">
                        {order.items.length} item(s)
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-gray-900">
                      ${order.totalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {DRUG_ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-gray-500">
                      {new Date(order.orderedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-3 px-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                      <button 
                        onClick={() => handleViewDrugOrder(order)}
                        className="text-blue-600 hover:text-blue-800 mr-3 p-1 rounded hover:bg-blue-100 transition-colors cursor-pointer"
                        title="View Drug Order"
                      >
                        <FaEye size={16} />
                      </button>
                      {(userRole === USER_ROLES.NURSE || userRole === USER_ROLES.SUPER_ADMIN) && (
                        <button 
                          onClick={() => handleEditDrugOrder(order)}
                          className="text-green-600 hover:text-green-800 mr-3 p-1 rounded hover:bg-green-100 transition-colors cursor-pointer"
                          title="Edit Drug Order"
                        >
                          <FaEdit size={16} />
                        </button>
                      )}
                      {userRole === USER_ROLES.SUPER_ADMIN && (
                        <button 
                          onClick={() => handleDeleteDrugOrder(order._id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors cursor-pointer"
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
          </CardContent>
        </Card>
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>

            <FormField label="Patient Name" required error={errors.patientName}>
              <Input
                value={formData.patientName}
                onChange={(e) => handleInputChange('patientName', e.target.value)}
                placeholder="Enter patient name"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>

            <FormField label="Lab Result ID">
              <Input
                value={formData.labResultId}
                onChange={(e) => handleInputChange('labResultId', e.target.value)}
                placeholder="Enter lab result ID (optional)"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Drug Items</label>
            {formData.items.map((item, index) => (
              <div key={index} className="border border-gray-300 p-4 rounded-lg mb-4 bg-gray-50">
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
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </FormField>

                  <FormField label="Quantity" error={errors[`items.${index}.quantity`]}>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateDrugItem(index, 'quantity', parseInt(e.target.value))}
                      min="1"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </FormField>

                  <FormField label="Unit Price" error={errors[`items.${index}.unitPrice`]}>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateDrugItem(index, 'unitPrice', parseFloat(e.target.value))}
                      min="0"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </FormField>

                  <FormField label="Total Price">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.totalPrice}
                      disabled
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-500"
                    />
                  </FormField>

                  <FormField label="Dosage">
                    <Input
                      value={item.dosage}
                      onChange={(e) => updateDrugItem(index, 'dosage', e.target.value)}
                      placeholder="e.g., 1 tablet twice daily"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </FormField>

                  <FormField label="Instructions">
                    <Input
                      value={item.instructions}
                      onChange={(e) => updateDrugItem(index, 'instructions', e.target.value)}
                      placeholder="e.g., Take with food"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            <Button onClick={addDrugItem} variant="outline" className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50">
              Add Drug Item
            </Button>
          </div>

          <FormField label="Notes">
            <TextArea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any additional notes..."
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                resetForm();
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddDrugOrder}
              loading={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>

            <FormField label="Patient Name" required error={errors.patientName}>
              <Input
                value={formData.patientName}
                onChange={(e) => handleInputChange('patientName', e.target.value)}
                placeholder="Enter patient name"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>

            <FormField label="Lab Result ID">
              <Input
                value={formData.labResultId}
                onChange={(e) => handleInputChange('labResultId', e.target.value)}
                placeholder="Enter lab result ID (optional)"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Drug Items</label>
            {formData.items.map((item, index) => (
              <div key={index} className="border border-gray-300 p-4 rounded-lg mb-4 bg-gray-50">
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
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </FormField>

                  <FormField label="Quantity" error={errors[`items.${index}.quantity`]}>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateDrugItem(index, 'quantity', parseInt(e.target.value))}
                      min="1"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </FormField>

                  <FormField label="Unit Price" error={errors[`items.${index}.unitPrice`]}>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateDrugItem(index, 'unitPrice', parseFloat(e.target.value))}
                      min="0"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </FormField>

                  <FormField label="Total Price">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.totalPrice}
                      disabled
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-500"
                    />
                  </FormField>

                  <FormField label="Dosage">
                    <Input
                      value={item.dosage}
                      onChange={(e) => updateDrugItem(index, 'dosage', e.target.value)}
                      placeholder="e.g., 1 tablet twice daily"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </FormField>

                  <FormField label="Instructions">
                    <Input
                      value={item.instructions}
                      onChange={(e) => updateDrugItem(index, 'instructions', e.target.value)}
                      placeholder="e.g., Take with food"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            <Button onClick={addDrugItem} variant="outline" className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50">
              Add Drug Item
            </Button>
          </div>

          <FormField label="Notes">
            <TextArea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any additional notes..."
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateDrugOrder}
              loading={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
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
                <label className="block text-sm font-medium text-gray-900">Drug Order ID</label>
                <p className="mt-1 text-sm text-gray-600">{viewingDrugOrder.drugOrderId || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">Patient ID</label>
                <p className="mt-1 text-sm text-gray-600">{viewingDrugOrder.patientId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">Patient Name</label>
                <p className="mt-1 text-sm text-gray-600">{viewingDrugOrder.patientName}</p>
              </div>
              {viewingDrugOrder.labResultId && (
                <div>
                  <label className="block text-sm font-medium text-gray-900">Lab Result ID</label>
                  <p className="mt-1 text-sm text-gray-600">{viewingDrugOrder.labResultId}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-900">Status</label>
                <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(viewingDrugOrder.status)}`}>
                  {DRUG_ORDER_STATUS_LABELS[viewingDrugOrder.status]}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">Ordered At</label>
                <p className="mt-1 text-sm text-gray-600">
                  {new Date(viewingDrugOrder.orderedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">Total Amount</label>
                <p className="mt-1 text-sm text-gray-600">${viewingDrugOrder.totalAmount.toFixed(2)}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Drug Items</label>
              <div className="space-y-2">
                {viewingDrugOrder.items.map((item, index) => (
                  <div key={index} className="border border-gray-300 p-3 rounded-lg bg-gray-50">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Drug:</span>
                        <p className="font-medium text-gray-900">{item.drugName}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Quantity:</span>
                        <p className="font-medium text-gray-900">{item.quantity}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Unit Price:</span>
                        <p className="font-medium text-gray-900">${item.unitPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Price:</span>
                        <p className="font-medium text-gray-900">${item.totalPrice.toFixed(2)}</p>
                      </div>
                      {item.dosage && (
                        <div>
                          <span className="text-gray-500">Dosage:</span>
                          <p className="font-medium text-gray-900">{item.dosage}</p>
                        </div>
                      )}
                      {item.instructions && (
                        <div>
                          <span className="text-gray-500">Instructions:</span>
                          <p className="font-medium text-gray-900">{item.instructions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {viewingDrugOrder.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-900">Notes</label>
                <p className="mt-1 text-sm text-gray-600">{viewingDrugOrder.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewingDrugOrder(null);
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded"
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