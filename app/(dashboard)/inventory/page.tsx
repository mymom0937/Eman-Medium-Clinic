'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StatsCard } from '@/components/dashboard/stats-card';
import { useUserRole } from '@/hooks/useUserRole';
import { Modal } from '@/components/ui/modal';
import { FormField, Input, Select, TextArea, Button } from '@/components/ui/form';
import { toastManager } from '@/lib/utils/toast';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';

// Mock data - in real app, this would come from API
const mockStats = [
  {
    title: 'Total Drugs',
    value: '1,234',
    change: '+12% from last month',
    changeType: 'positive' as const,
    icon: '💊',
  },
  {
    title: 'Low Stock Items',
    value: '23',
    change: '-5% from last week',
    changeType: 'negative' as const,
    icon: '⚠️',
  },
  {
    title: 'Out of Stock',
    value: '5',
    change: '+2 from yesterday',
    changeType: 'negative' as const,
    icon: '❌',
  },
  {
    title: 'Total Value',
    value: '$45,678',
    change: '+8% from last month',
    changeType: 'positive' as const,
    icon: '💰',
  },
];

const mockDrugs = [
  {
    id: 1,
    drugId: 'DRUG0000010',
    name: 'Paracetamol 500mg',
    category: 'Pain Relief',
    quantity: 150,
    unitPrice: 15.50,
    expiryDate: '2024-12-31',
    supplier: 'PharmaCorp',
    status: 'IN_STOCK',
  },
  {
    id: 2,
    drugId: 'DRUG000002',
    name: 'Amoxicillin 250mg',
    category: 'Antibiotics',
    quantity: 75,
    unitPrice: 25.00,
    expiryDate: '2024-08-15',
    supplier: 'MedSupply',
    status: 'LOW_STOCK',
  },
  {
    id: 3,
    drugId: 'DRUG000003',
    name: 'Ibuprofen 400mg',
    category: 'Pain Relief',
    quantity: 0,
    unitPrice: 12.75,
    expiryDate: '2024-10-20',
    supplier: 'PharmaCorp',
    status: 'OUT_OF_STOCK',
  },
];

const DRUG_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'pain_relief', label: 'Pain Relief' },
  { value: 'antibiotics', label: 'Antibiotics' },
  { value: 'vitamins', label: 'Vitamins' },
  { value: 'diabetes', label: 'Diabetes' },
  { value: 'hypertension', label: 'Hypertension' },
  { value: 'respiratory', label: 'Respiratory' },
  { value: 'gastrointestinal', label: 'Gastrointestinal' },
  { value: 'other', label: 'Other' },
];

const DRUG_STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

const SUPPLIERS = [
  { value: 'pharmacorp', label: 'PharmaCorp' },
  { value: 'medsupply', label: 'MedSupply' },
  { value: 'healthcare_plus', label: 'Healthcare Plus' },
  { value: 'medical_express', label: 'Medical Express' },
  { value: 'other', label: 'Other' },
];

interface DrugFormData {
  name: string;
  category: string;
  quantity: string;
  unitPrice: string;
  expiryDate: string;
  supplier: string;
  status: string;
  description: string;
}

export default function InventoryPage() {
  const { userRole, userName, isLoaded } = useUserRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingDrug, setEditingDrug] = useState<any>(null);
  const [viewingDrug, setViewingDrug] = useState<any>(null);
  const [drugs, setDrugs] = useState(mockDrugs);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    unitPrice: '',
    expiryDate: '',
    supplier: '',
    status: 'in_stock',
    description: '',
  });
  const [errors, setErrors] = useState<Partial<DrugFormData>>({});

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Filter drugs based on search, category, and status
  const filteredDrugs = drugs.filter(drug => {
    const matchesSearch = drug.drugId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         drug.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || drug.category.toLowerCase().replace(/\s+/g, '_') === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || drug.status.toLowerCase() === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in_stock':
        return 'bg-green-100 text-green-800';
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in_stock':
        return 'IN STOCK';
      case 'low_stock':
        return 'LOW STOCK';
      case 'out_of_stock':
        return 'OUT OF STOCK';
      default:
        return status.toUpperCase();
    }
  };

  const generateDrugId = () => {
    const lastDrug = drugs[drugs.length - 1];
    const lastNumber = lastDrug ? parseInt(lastDrug.drugId.replace('DRUG', '')) : 0;
    return `DRUG${String(lastNumber + 1).padStart(6, '0')}`;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<DrugFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Drug name is required';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (!formData.quantity || parseInt(formData.quantity) < 0) {
      newErrors.quantity = 'Valid quantity is required';
    }
    if (!formData.unitPrice || parseFloat(formData.unitPrice) <= 0) {
      newErrors.unitPrice = 'Valid unit price is required';
    }
    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    }
    if (!formData.supplier) {
      newErrors.supplier = 'Supplier is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddDrug = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newDrug = {
        id: drugs.length + 1,
        drugId: generateDrugId(),
        name: formData.name,
        category: formData.category.replace('_', ' '),
        quantity: parseInt(formData.quantity),
        unitPrice: parseFloat(formData.unitPrice),
        expiryDate: formData.expiryDate,
        supplier: formData.supplier.replace('_', ' '),
        status: formData.status,
        description: formData.description,
      };

      setDrugs([...drugs, newDrug]);
      setIsAddModalOpen(false);
      resetForm();
      toastManager.success('Drug added successfully!');
    } catch (error) {
      toastManager.error('Failed to add drug. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDrug = (drug: any) => {
    setEditingDrug(drug);
    setFormData({
      name: drug.name,
      category: drug.category.toLowerCase().replace(' ', '_'),
      quantity: drug.quantity.toString(),
      unitPrice: drug.unitPrice.toString(),
      expiryDate: drug.expiryDate,
      supplier: drug.supplier.toLowerCase().replace(' ', '_'),
      status: drug.status.toLowerCase(),
      description: drug.description || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateDrug = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedDrugs = drugs.map(drug =>
        drug.id === editingDrug.id
          ? {
              ...drug,
              name: formData.name,
              category: formData.category.replace('_', ' '),
              quantity: parseInt(formData.quantity),
              unitPrice: parseFloat(formData.unitPrice),
              expiryDate: formData.expiryDate,
              supplier: formData.supplier.replace('_', ' '),
              status: formData.status,
              description: formData.description,
            }
          : drug
      );

      setDrugs(updatedDrugs);
      setIsEditModalOpen(false);
      setEditingDrug(null);
      resetForm();
      toastManager.success('Drug updated successfully!');
    } catch (error) {
      toastManager.error('Failed to update drug. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDrug = async (drugId: number) => {
    if (!confirm('Are you sure you want to delete this drug?')) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setDrugs(drugs.filter(drug => drug.id !== drugId));
      toastManager.success('Drug deleted successfully!');
    } catch (error) {
      toastManager.error('Failed to delete drug. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      quantity: '',
      unitPrice: '',
      expiryDate: '',
      supplier: '',
      status: 'in_stock',
      description: '',
    });
    setErrors({});
  };

  const handleInputChange = (field: keyof DrugFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleViewDrug = (drug: any) => {
    setViewingDrug(drug);
    setIsViewModalOpen(true);
  };

  return (
    <DashboardLayout
      title="Inventory Management"
      userRole={userRole}
      userName={userName}
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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

        {/* Drug Inventory Section */}
        <div className="bg-card-bg rounded-lg border border-border-color p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
            <h2 className="text-lg sm:text-xl font-semibold text-text-primary">Drug Inventory</h2>
            <Button onClick={() => setIsAddModalOpen(true)} className="cursor-pointer w-full sm:w-auto bg-[#1447E6]  hover:bg-gray-700">
              Add New Drug
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
            <input
              type="text"
              placeholder="Search drugs by ID, name, or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary placeholder-text-muted bg-background text-sm"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background text-sm"
            >
              {DRUG_CATEGORIES.map(option => (
                <option key={option.value} value={option.value} className="text-text-primary">
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background text-sm"
            >
              {DRUG_STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value} className="text-text-primary">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Drug Inventory Table */}
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Mobile Card View */}
              <div className="block lg:hidden">
                {filteredDrugs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-text-secondary">No drugs found matching your criteria.</p>
                    <p className="text-sm text-text-muted mt-2">Try adjusting your search or filters.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredDrugs.map((drug) => (
                      <div key={drug.id} className="border border-border-color rounded-lg p-4 bg-background shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-text-primary text-sm">{drug.name}</h3>
                            <p className="text-xs text-text-muted">{drug.drugId}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(drug.status)}`}>
                            {getStatusText(drug.status)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div>
                            <span className="text-text-muted">Category:</span>
                            <p className="font-medium text-text-primary">{drug.category}</p>
                          </div>
                          <div>
                            <span className="text-text-muted">Quantity:</span>
                            <p className="font-medium text-text-primary">{drug.quantity}</p>
                          </div>
                          <div>
                            <span className="text-text-muted">Price:</span>
                            <p className="font-medium text-text-primary">ETB {drug.unitPrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <span className="text-text-muted">Supplier:</span>
                            <p className="font-medium text-text-primary truncate">{drug.supplier}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleViewDrug(drug)}
                            className="flex-1 bg-accent-color text-white px-2 py-1 rounded text-xs hover:bg-accent-hover cursor-pointer flex items-center justify-center"
                            title="View Drug"
                          >
                            <FaEye size={12} className="mr-1" />
                            View
                          </button>
                          <button 
                            onClick={() => handleEditDrug(drug)}
                            className="flex-1 bg-success text-white px-2 py-1 rounded text-xs hover:bg-success/90 cursor-pointer flex items-center justify-center"
                            title="Edit Drug"
                          >
                            <FaEdit size={12} className="mr-1" />
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteDrug(drug.id)}
                            className="flex-1 bg-error text-white px-2 py-1 rounded text-xs hover:bg-error/90 cursor-pointer flex items-center justify-center"
                            title="Delete Drug"
                          >
                            <FaTrash size={12} className="mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="block">
                {filteredDrugs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-text-secondary">No drugs found matching your criteria.</p>
                    <p className="text-sm text-text-muted mt-2">Try adjusting your search or filters.</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-border-color">
                  <thead className="bg-card-bg">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                        Drug ID
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                        Drug Name
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                        Expiry Date
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                                    <tbody className="bg-background divide-y divide-border-color">
                    {filteredDrugs.map((drug) => (
                      <tr key={drug.id} className="hover:bg-card-bg">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-text-primary">
                          {drug.drugId}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-text-primary">
                          {drug.name}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-text-secondary">
                          {drug.category}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-text-primary">
                          {drug.quantity}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-text-primary">
                          ETB {drug.unitPrice.toFixed(2)}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-text-secondary">
                          {new Date(drug.expiryDate).toLocaleDateString()}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-text-secondary">
                          {drug.supplier}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(drug.status)}`}>
                            {getStatusText(drug.status)}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                          <button 
                            onClick={() => handleViewDrug(drug)}
                            className="text-accent-color hover:text-accent-hover mr-3 p-1 rounded hover:bg-accent-color/10 transition-colors cursor-pointer"
                            title="View Drug"
                          >
                            <FaEye size={16} />
                          </button>
                          <button 
                            onClick={() => handleEditDrug(drug)}
                            className="text-success hover:text-success/80 mr-3 p-1 rounded hover:bg-success/10 transition-colors cursor-pointer"
                            title="Edit Drug"
                          >
                            <FaEdit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteDrug(drug.id)}
                            className="text-error hover:text-error/80 p-1 rounded hover:bg-error/10 transition-colors cursor-pointer"
                            title="Delete Drug"
                          >
                            <FaTrash size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Drug Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        title="Add New Drug"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Drug Name" required error={errors.name}>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter drug name"
              />
            </FormField>

            <FormField label="Category" required error={errors.category}>
              <Select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                options={DRUG_CATEGORIES}
              />
            </FormField>

            <FormField label="Quantity" required error={errors.quantity}>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                placeholder="Enter quantity"
                min="0"
              />
            </FormField>

            <FormField label="Unit Price (ETB)" required error={errors.unitPrice}>
              <Input
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => handleInputChange('unitPrice', e.target.value)}
                placeholder="Enter unit price"
                min="0"
              />
            </FormField>

            <FormField label="Expiry Date" required error={errors.expiryDate}>
              <Input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
              />
            </FormField>

            <FormField label="Supplier" required error={errors.supplier}>
              <Select
                value={formData.supplier}
                onChange={(e) => handleInputChange('supplier', e.target.value)}
                options={SUPPLIERS}
              />
            </FormField>

            <FormField label="Status" required error={errors.status}>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                options={DRUG_STATUS_OPTIONS}
              />
            </FormField>
          </div>

          <FormField label="Description">
            <TextArea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter drug description (optional)"
              rows={3}
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
              onClick={handleAddDrug}
              loading={loading}
            >
              Add Drug
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Drug Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingDrug(null);
          resetForm();
        }}
        title="Edit Drug"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Drug Name" required error={errors.name}>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter drug name"
              />
            </FormField>

            <FormField label="Category" required error={errors.category}>
              <Select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                options={DRUG_CATEGORIES}
              />
            </FormField>

            <FormField label="Quantity" required error={errors.quantity}>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                placeholder="Enter quantity"
                min="0"
              />
            </FormField>

            <FormField label="Unit Price (ETB)" required error={errors.unitPrice}>
              <Input
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => handleInputChange('unitPrice', e.target.value)}
                placeholder="Enter unit price"
                min="0"
              />
            </FormField>

            <FormField label="Expiry Date" required error={errors.expiryDate}>
              <Input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
              />
            </FormField>

            <FormField label="Supplier" required error={errors.supplier}>
              <Select
                value={formData.supplier}
                onChange={(e) => handleInputChange('supplier', e.target.value)}
                options={SUPPLIERS}
              />
            </FormField>

            <FormField label="Status" required error={errors.status}>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                options={DRUG_STATUS_OPTIONS}
              />
            </FormField>
          </div>

          <FormField label="Description">
            <TextArea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter drug description (optional)"
              rows={3}
            />
          </FormField>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingDrug(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateDrug}
              loading={loading}
            >
              Update Drug
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Drug Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingDrug(null);
        }}
        title="Drug Details"
        size="md"
      >
        {viewingDrug && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Drug ID</label>
                <p className="mt-1 text-sm text-gray-900">{viewingDrug.drugId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Drug Name</label>
                <p className="mt-1 text-sm text-gray-900">{viewingDrug.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <p className="mt-1 text-sm text-gray-900">{viewingDrug.category}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <p className="mt-1 text-sm text-gray-900">{viewingDrug.quantity}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Unit Price</label>
                <p className="mt-1 text-sm text-gray-900">ETB {viewingDrug.unitPrice.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                <p className="mt-1 text-sm text-gray-900">{new Date(viewingDrug.expiryDate).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Supplier</label>
                <p className="mt-1 text-sm text-gray-900">{viewingDrug.supplier}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(viewingDrug.status)}`}>
                  {getStatusText(viewingDrug.status)}
                </span>
              </div>
            </div>
            {viewingDrug.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-900">{viewingDrug.description}</p>
              </div>
            )}
            <div className="flex justify-end pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewingDrug(null);
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