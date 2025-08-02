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

// Mock data for drug orders
const mockDrugOrders: DrugOrder[] = [
  {
    _id: '1',
    patientId: 'PAT001',
    patientName: 'John Doe',
    labResultId: 'LAB001',
    status: 'PENDING',
    orderedBy: 'nurse1',
    orderedAt: new Date('2024-01-15T10:30:00'),
    approvedBy: undefined,
    approvedAt: undefined,
    dispensedBy: undefined,
    dispensedAt: undefined,
    items: [
      {
        drugId: 'DRUG001',
        drugName: 'Paracetamol 500mg',
        quantity: 20,
        unitPrice: 15.50,
        totalPrice: 310.00,
        dosage: '1 tablet every 6 hours',
        instructions: 'Take with food',
      },
      {
        drugId: 'DRUG002',
        drugName: 'Amoxicillin 250mg',
        quantity: 14,
        unitPrice: 25.00,
        totalPrice: 350.00,
        dosage: '1 capsule twice daily',
        instructions: 'Take on empty stomach',
      },
    ],
    totalAmount: 660.00,
    notes: 'Patient has fever and bacterial infection',
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-15T10:30:00'),
  },
  {
    _id: '2',
    patientId: 'PAT002',
    patientName: 'Jane Smith',
    labResultId: 'LAB002',
    status: 'APPROVED',
    orderedBy: 'nurse1',
    orderedAt: new Date('2024-01-14T14:20:00'),
    approvedBy: 'pharmacist1',
    approvedAt: new Date('2024-01-14T15:30:00'),
    dispensedBy: undefined,
    dispensedAt: undefined,
    items: [
      {
        drugId: 'DRUG003',
        drugName: 'Ibuprofen 400mg',
        quantity: 30,
        unitPrice: 12.75,
        totalPrice: 382.50,
        dosage: '1 tablet every 8 hours',
        instructions: 'Take with food',
      },
    ],
    totalAmount: 382.50,
    notes: 'Pain management for chronic condition',
    createdAt: new Date('2024-01-14T14:20:00'),
    updatedAt: new Date('2024-01-14T15:30:00'),
  },
  {
    _id: '3',
    patientId: 'PAT003',
    patientName: 'Mike Johnson',
    labResultId: 'LAB003',
    status: 'DISPENSED',
    orderedBy: 'nurse2',
    orderedAt: new Date('2024-01-13T09:15:00'),
    approvedBy: 'pharmacist1',
    approvedAt: new Date('2024-01-13T10:00:00'),
    dispensedBy: 'pharmacist1',
    dispensedAt: new Date('2024-01-13T11:30:00'),
    items: [
      {
        drugId: 'DRUG004',
        drugName: 'Metformin 500mg',
        quantity: 60,
        unitPrice: 8.50,
        totalPrice: 510.00,
        dosage: '1 tablet twice daily',
        instructions: 'Take with meals',
      },
      {
        drugId: 'DRUG005',
        drugName: 'Vitamin D3 1000IU',
        quantity: 30,
        unitPrice: 5.00,
        totalPrice: 150.00,
        dosage: '1 tablet daily',
        instructions: 'Take in the morning',
      },
    ],
    totalAmount: 660.00,
    notes: 'Diabetes management and vitamin supplement',
    createdAt: new Date('2024-01-13T09:15:00'),
    updatedAt: new Date('2024-01-13T11:30:00'),
  },
];

const ORDER_STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'DISPENSED', label: 'Dispensed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const MOCK_DRUGS = [
  { id: 'DRUG001', name: 'Paracetamol 500mg', price: 15.50 },
  { id: 'DRUG002', name: 'Amoxicillin 250mg', price: 25.00 },
  { id: 'DRUG003', name: 'Ibuprofen 400mg', price: 12.75 },
  { id: 'DRUG004', name: 'Metformin 500mg', price: 8.50 },
  { id: 'DRUG005', name: 'Vitamin D3 1000IU', price: 5.00 },
  { id: 'DRUG006', name: 'Omeprazole 20mg', price: 18.00 },
  { id: 'DRUG007', name: 'Cetirizine 10mg', price: 7.50 },
  { id: 'DRUG008', name: 'Loratadine 10mg', price: 9.25 },
];

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
  const [drugOrders, setDrugOrders] = useState<DrugOrder[]>(mockDrugOrders);
  const [loading, setLoading] = useState(false);
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
  const [errors, setErrors] = useState<Partial<DrugOrderFormData>>({});

  useEffect(() => {
    if (isLoaded) {
      // In real app, fetch from API
      setDrugOrders(mockDrugOrders);
    }
  }, [isLoaded]);

  // Filter drug orders based on search and filters
  const filteredDrugOrders = drugOrders.filter(order => {
    const matchesSearch = order.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.patientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DISPENSED':
        return 'bg-success/10 text-success';
      case 'APPROVED':
        return 'bg-warning/10 text-warning';
      case 'PENDING':
        return 'bg-info/10 text-info';
      case 'CANCELLED':
        return 'bg-error/10 text-error';
      default:
        return 'bg-text-muted/10 text-text-muted';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};

    if (!formData.patientId.trim()) {
      newErrors.patientId = 'Patient ID is required';
    }
    if (!formData.patientName.trim()) {
      newErrors.patientName = 'Patient name is required';
    }
    if (formData.items.length === 0) {
      newErrors.items = 'At least one drug item is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddDrugOrder = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const totalAmount = formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const newDrugOrder: DrugOrder = {
        _id: (drugOrders.length + 1).toString(),
        patientId: formData.patientId,
        patientName: formData.patientName,
        labResultId: formData.labResultId || undefined,
        status: 'PENDING',
        orderedBy: userId || '',
        orderedAt: new Date(),
        items: formData.items,
        totalAmount,
        notes: formData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setDrugOrders([...drugOrders, newDrugOrder]);
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
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const totalAmount = formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const updatedDrugOrders = drugOrders.map(order =>
        order._id === editingDrugOrder?._id
          ? {
              ...order,
              patientId: formData.patientId,
              patientName: formData.patientName,
              labResultId: formData.labResultId || undefined,
              items: formData.items,
              totalAmount,
              notes: formData.notes,
              updatedAt: new Date(),
            }
          : order
      );

      setDrugOrders(updatedDrugOrders);
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setDrugOrders(drugOrders.filter(order => order._id !== id));
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
      setErrors(prev => ({ ...prev, [field]: undefined }));
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

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-text-primary">Loading...</div>
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
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent-color"></div>
            <p className="mt-4 text-text-primary">Loading drug orders...</p>
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
          <h1 className="text-3xl font-bold text-text-primary">Drug Orders</h1>
          {(userRole === USER_ROLES.NURSE || userRole === USER_ROLES.SUPER_ADMIN) && (
            <Button onClick={() => setIsAddModalOpen(true)} className="cursor-pointer bg-[#1447E6]  hover:bg-gray-700">
              Create New Order
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Drug Orders Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">
                  {drugOrders.filter(o => o.status === 'PENDING').length}
                </div>
                <div className="text-sm text-text-secondary">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-info">
                  {drugOrders.filter(o => o.status === 'APPROVED').length}
                </div>
                <div className="text-sm text-text-secondary">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">
                  {drugOrders.filter(o => o.status === 'DISPENSED').length}
                </div>
                <div className="text-sm text-text-secondary">Dispensed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-error">
                  {drugOrders.filter(o => o.status === 'CANCELLED').length}
                </div>
                <div className="text-sm text-text-secondary">Cancelled</div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
              <input
                type="text"
                placeholder="Search by patient ID or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary placeholder-text-muted bg-background text-sm"
              />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background text-sm"
              >
                {ORDER_STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ordered</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrugOrders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-text-primary">{order.patientName}</div>
                        <div className="text-sm text-text-secondary">{order.patientId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-text-primary">
                        {order.items.length} item(s)
                      </div>
                    </TableCell>
                    <TableCell className="text-text-primary">
                      ${order.totalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {DRUG_ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {new Date(order.orderedAt).toLocaleDateString()}
                    </TableCell>
                                         <TableCell className="whitespace-nowrap text-xs sm:text-sm font-medium">
                       <button 
                         onClick={() => handleViewDrugOrder(order)}
                         className="text-accent-color hover:text-accent-hover mr-3 p-1 rounded hover:bg-accent-color/10 transition-colors cursor-pointer"
                         title="View Drug Order"
                       >
                         <FaEye size={16} />
                       </button>
                       {(userRole === USER_ROLES.NURSE || userRole === USER_ROLES.SUPER_ADMIN) && (
                         <button 
                           onClick={() => handleEditDrugOrder(order)}
                           className="text-success hover:text-success/80 mr-3 p-1 rounded hover:bg-success/10 transition-colors cursor-pointer"
                           title="Edit Drug Order"
                         >
                           <FaEdit size={16} />
                         </button>
                       )}
                       {userRole === USER_ROLES.SUPER_ADMIN && (
                         <button 
                           onClick={() => handleDeleteDrugOrder(order._id)}
                           className="text-error hover:text-error/80 p-1 rounded hover:bg-error/10 transition-colors cursor-pointer"
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
              />
            </FormField>

            <FormField label="Patient Name" required error={errors.patientName}>
              <Input
                value={formData.patientName}
                onChange={(e) => handleInputChange('patientName', e.target.value)}
                placeholder="Enter patient name"
              />
            </FormField>

            <FormField label="Lab Result ID">
              <Input
                value={formData.labResultId}
                onChange={(e) => handleInputChange('labResultId', e.target.value)}
                placeholder="Enter lab result ID (optional)"
              />
            </FormField>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Drug Items</label>
            {formData.items.map((item, index) => (
              <div key={index} className="border border-border-color p-4 rounded-lg mb-4 bg-card-bg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Drug">
                    <Select
                      value={item.drugId}
                      onChange={(e) => {
                        const drug = MOCK_DRUGS.find(d => d.id === e.target.value);
                        updateDrugItem(index, 'drugId', e.target.value);
                        updateDrugItem(index, 'drugName', drug?.name || '');
                        updateDrugItem(index, 'unitPrice', drug?.price || 0);
                      }}
                      options={MOCK_DRUGS.map(drug => ({
                        value: drug.id,
                        label: drug.name,
                      }))}
                    />
                  </FormField>

                  <FormField label="Quantity">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateDrugItem(index, 'quantity', parseInt(e.target.value))}
                      min="1"
                    />
                  </FormField>

                  <FormField label="Unit Price">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateDrugItem(index, 'unitPrice', parseFloat(e.target.value))}
                      min="0"
                    />
                  </FormField>

                  <FormField label="Total Price">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.totalPrice}
                      disabled
                    />
                  </FormField>

                  <FormField label="Dosage">
                    <Input
                      value={item.dosage}
                      onChange={(e) => updateDrugItem(index, 'dosage', e.target.value)}
                      placeholder="e.g., 1 tablet twice daily"
                    />
                  </FormField>

                  <FormField label="Instructions">
                    <Input
                      value={item.instructions}
                      onChange={(e) => updateDrugItem(index, 'instructions', e.target.value)}
                      placeholder="e.g., Take with food"
                    />
                  </FormField>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeDrugItem(index)}
                  className="mt-2"
                >
                  Remove Item
                </Button>
              </div>
            ))}

            <Button onClick={addDrugItem} variant="outline" className="w-full">
              Add Drug Item
            </Button>
          </div>

          <FormField label="Notes">
            <TextArea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any additional notes..."
              rows={4}
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
              />
            </FormField>

            <FormField label="Patient Name" required error={errors.patientName}>
              <Input
                value={formData.patientName}
                onChange={(e) => handleInputChange('patientName', e.target.value)}
                placeholder="Enter patient name"
              />
            </FormField>

            <FormField label="Lab Result ID">
              <Input
                value={formData.labResultId}
                onChange={(e) => handleInputChange('labResultId', e.target.value)}
                placeholder="Enter lab result ID (optional)"
              />
            </FormField>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Drug Items</label>
            {formData.items.map((item, index) => (
              <div key={index} className="border border-border-color p-4 rounded-lg mb-4 bg-card-bg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Drug">
                    <Select
                      value={item.drugId}
                      onChange={(e) => {
                        const drug = MOCK_DRUGS.find(d => d.id === e.target.value);
                        updateDrugItem(index, 'drugId', e.target.value);
                        updateDrugItem(index, 'drugName', drug?.name || '');
                        updateDrugItem(index, 'unitPrice', drug?.price || 0);
                      }}
                      options={MOCK_DRUGS.map(drug => ({
                        value: drug.id,
                        label: drug.name,
                      }))}
                    />
                  </FormField>

                  <FormField label="Quantity">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateDrugItem(index, 'quantity', parseInt(e.target.value))}
                      min="1"
                    />
                  </FormField>

                  <FormField label="Unit Price">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateDrugItem(index, 'unitPrice', parseFloat(e.target.value))}
                      min="0"
                    />
                  </FormField>

                  <FormField label="Total Price">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.totalPrice}
                      disabled
                    />
                  </FormField>

                  <FormField label="Dosage">
                    <Input
                      value={item.dosage}
                      onChange={(e) => updateDrugItem(index, 'dosage', e.target.value)}
                      placeholder="e.g., 1 tablet twice daily"
                    />
                  </FormField>

                  <FormField label="Instructions">
                    <Input
                      value={item.instructions}
                      onChange={(e) => updateDrugItem(index, 'instructions', e.target.value)}
                      placeholder="e.g., Take with food"
                    />
                  </FormField>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeDrugItem(index)}
                  className="mt-2"
                >
                  Remove Item
                </Button>
              </div>
            ))}

            <Button onClick={addDrugItem} variant="outline" className="w-full">
              Add Drug Item
            </Button>
          </div>

          <FormField label="Notes">
            <TextArea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any additional notes..."
              rows={4}
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
                <label className="block text-sm font-medium text-text-primary">Patient ID</label>
                <p className="mt-1 text-sm text-text-secondary">{viewingDrugOrder.patientId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary">Patient Name</label>
                <p className="mt-1 text-sm text-text-secondary">{viewingDrugOrder.patientName}</p>
              </div>
              {viewingDrugOrder.labResultId && (
                <div>
                  <label className="block text-sm font-medium text-text-primary">Lab Result ID</label>
                  <p className="mt-1 text-sm text-text-secondary">{viewingDrugOrder.labResultId}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-text-primary">Status</label>
                <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(viewingDrugOrder.status)}`}>
                  {DRUG_ORDER_STATUS_LABELS[viewingDrugOrder.status]}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary">Ordered At</label>
                <p className="mt-1 text-sm text-text-secondary">
                  {new Date(viewingDrugOrder.orderedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary">Total Amount</label>
                <p className="mt-1 text-sm text-text-secondary">${viewingDrugOrder.totalAmount.toFixed(2)}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Drug Items</label>
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
                <label className="block text-sm font-medium text-text-primary">Notes</label>
                <p className="mt-1 text-sm text-text-secondary">{viewingDrugOrder.notes}</p>
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