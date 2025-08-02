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
import { LabResult, LabTestResult } from '@/types/lab-result';
import { LAB_TEST_TYPES, LAB_TEST_LABELS, LAB_TEST_STATUS_LABELS } from '@/constants/lab-test-types';
import { USER_ROLES } from '@/constants/user-roles';
import { useUserRole } from '@/hooks/useUserRole';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';

// Mock data for lab results
const mockLabResults: LabResult[] = [
  {
    _id: '1',
    patientId: 'PAT001',
    patientName: 'John Doe',
    testType: 'COMPLETE_BLOOD_COUNT',
    testName: 'Complete Blood Count',
    status: 'PENDING',
    requestedBy: 'nurse1',
    requestedAt: new Date('2024-01-15T10:30:00'),
    completedBy: undefined,
    completedAt: undefined,
    results: [],
    notes: 'Patient has fever and fatigue',
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-15T10:30:00'),
  },
  {
    _id: '2',
    patientId: 'PAT002',
    patientName: 'Jane Smith',
    testType: 'URINE_ANALYSIS',
    testName: 'Urine Analysis',
    status: 'IN_PROGRESS',
    requestedBy: 'nurse1',
    requestedAt: new Date('2024-01-14T14:20:00'),
    completedBy: 'lab1',
    completedAt: undefined,
    results: [
      {
        parameter: 'pH',
        value: '6.5',
        unit: '',
        referenceRange: '4.5-8.0',
        isAbnormal: false,
        notes: 'Normal range',
      },
    ],
    notes: 'Routine checkup',
    createdAt: new Date('2024-01-14T14:20:00'),
    updatedAt: new Date('2024-01-14T14:20:00'),
  },
  {
    _id: '3',
    patientId: 'PAT003',
    patientName: 'Mike Johnson',
    testType: 'BLOOD_GLUCOSE',
    testName: 'Blood Glucose Test',
    status: 'COMPLETED',
    requestedBy: 'nurse2',
    requestedAt: new Date('2024-01-13T09:15:00'),
    completedBy: 'lab1',
    completedAt: new Date('2024-01-13T11:30:00'),
    results: [
      {
        parameter: 'Fasting Glucose',
        value: '95',
        unit: 'mg/dL',
        referenceRange: '70-100',
        isAbnormal: false,
        notes: 'Normal fasting glucose',
      },
      {
        parameter: 'Postprandial Glucose',
        value: '140',
        unit: 'mg/dL',
        referenceRange: '70-140',
        isAbnormal: false,
        notes: 'Normal postprandial glucose',
      },
    ],
    notes: 'Diabetes screening',
    createdAt: new Date('2024-01-13T09:15:00'),
    updatedAt: new Date('2024-01-13T11:30:00'),
  },
];

const TEST_STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const TEST_TYPE_OPTIONS = [
  { value: 'all', label: 'All Test Types' },
  ...Object.entries(LAB_TEST_TYPES).map(([key, value]) => ({
    value,
    label: LAB_TEST_LABELS[value],
  })),
];

interface LabResultFormData {
  patientId: string;
  patientName: string;
  testType: string;
  testName: string;
  notes: string;
}

export default function LabResultsPage() {
  const { userId } = useAuth();
  const { userRole, userName, isLoaded } = useUserRole();
  const [labResults, setLabResults] = useState<LabResult[]>(mockLabResults);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTestType, setSelectedTestType] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingLabResult, setEditingLabResult] = useState<LabResult | null>(null);
  const [viewingLabResult, setViewingLabResult] = useState<LabResult | null>(null);
  const [formData, setFormData] = useState<LabResultFormData>({
    patientId: '',
    patientName: '',
    testType: '',
    testName: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<LabResultFormData>>({});

  useEffect(() => {
    if (isLoaded) {
      // In real app, fetch from API
      setLabResults(mockLabResults);
    }
  }, [isLoaded]);

  // Filter lab results based on search and filters
  const filteredLabResults = labResults.filter(result => {
    const matchesSearch = result.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.testName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || result.status === selectedStatus;
    const matchesTestType = selectedTestType === 'all' || result.testType === selectedTestType;
    return matchesSearch && matchesStatus && matchesTestType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-success/10 text-success';
      case 'IN_PROGRESS':
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
    const newErrors: Partial<LabResultFormData> = {};

    if (!formData.patientId.trim()) {
      newErrors.patientId = 'Patient ID is required';
    }
    if (!formData.patientName.trim()) {
      newErrors.patientName = 'Patient name is required';
    }
    if (!formData.testType) {
      newErrors.testType = 'Test type is required';
    }
    if (!formData.testName.trim()) {
      newErrors.testName = 'Test name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddLabResult = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newLabResult: LabResult = {
        _id: (labResults.length + 1).toString(),
        patientId: formData.patientId,
        patientName: formData.patientName,
        testType: formData.testType as any,
        testName: formData.testName,
        status: 'PENDING',
        requestedBy: userId || '',
        requestedAt: new Date(),
        results: [],
        notes: formData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setLabResults([...labResults, newLabResult]);
      setIsAddModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating lab result:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditLabResult = (labResult: LabResult) => {
    setEditingLabResult(labResult);
    setFormData({
      patientId: labResult.patientId,
      patientName: labResult.patientName,
      testType: labResult.testType,
      testName: labResult.testName,
      notes: labResult.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateLabResult = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedLabResults = labResults.map(result =>
        result._id === editingLabResult?._id
          ? {
              ...result,
              patientId: formData.patientId,
              patientName: formData.patientName,
              testType: formData.testType as any,
              testName: formData.testName,
              notes: formData.notes,
              updatedAt: new Date(),
            }
          : result
      );

      setLabResults(updatedLabResults);
      setIsEditModalOpen(false);
      setEditingLabResult(null);
      resetForm();
    } catch (error) {
      console.error('Error updating lab result:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLabResult = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lab result?')) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setLabResults(labResults.filter(result => result._id !== id));
    } catch (error) {
      console.error('Error deleting lab result:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: '',
      patientName: '',
      testType: '',
      testName: '',
      notes: '',
    });
    setErrors({});
  };

  const handleInputChange = (field: keyof LabResultFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleViewLabResult = (labResult: LabResult) => {
    setViewingLabResult(labResult);
    setIsViewModalOpen(true);
  };

  const canUpdateStatus = (labResult: LabResult) => {
    if (userRole === USER_ROLES.SUPER_ADMIN) return true;
    if (userRole === USER_ROLES.LABORATORIST) return true;
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
        title="Lab Results"
        userRole={userRole}
        userName={userName}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent-color"></div>
            <p className="mt-4 text-text-primary">Loading lab results...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Lab Results"
      userRole={userRole}
      userName={userName}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-text-primary">Lab Results</h1>
          {(userRole === USER_ROLES.NURSE || userRole === USER_ROLES.SUPER_ADMIN) && (
            <Button onClick={() => setIsAddModalOpen(true)} className="cursor-pointer bg-[#1447E6]  hover:bg-gray-700">
              Request New Test
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lab Results Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">
                  {labResults.filter(r => r.status === 'PENDING').length}
                </div>
                <div className="text-sm text-text-secondary">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-info">
                  {labResults.filter(r => r.status === 'IN_PROGRESS').length}
                </div>
                <div className="text-sm text-text-secondary">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">
                  {labResults.filter(r => r.status === 'COMPLETED').length}
                </div>
                <div className="text-sm text-text-secondary">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-error">
                  {labResults.filter(r => r.status === 'CANCELLED').length}
                </div>
                <div className="text-sm text-text-secondary">Cancelled</div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
              <input
                type="text"
                placeholder="Search by patient ID, name, or test name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary placeholder-text-muted bg-background text-sm"
              />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background text-sm"
              >
                {TEST_STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedTestType}
                onChange={(e) => setSelectedTestType(e.target.value)}
                className="border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background text-sm"
              >
                {TEST_TYPE_OPTIONS.map(option => (
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
                  <TableHead>Test Type</TableHead>
                  <TableHead>Test Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLabResults.map((result) => (
                  <TableRow key={result._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-text-primary">{result.patientName}</div>
                        <div className="text-sm text-text-secondary">{result.patientId}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-text-primary">{LAB_TEST_LABELS[result.testType]}</TableCell>
                    <TableCell className="text-text-primary">{result.testName}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(result.status)}`}>
                        {LAB_TEST_STATUS_LABELS[result.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {new Date(result.requestedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs sm:text-sm font-medium">
                      <button 
                        onClick={() => handleViewLabResult(result)}
                        className="text-accent-color hover:text-accent-hover mr-3 p-1 rounded hover:bg-accent-color/10 transition-colors cursor-pointer"
                        title="View Lab Result"
                      >
                        <FaEye size={16} />
                      </button>
                      {(userRole === USER_ROLES.NURSE || userRole === USER_ROLES.SUPER_ADMIN) && (
                        <button 
                          onClick={() => handleEditLabResult(result)}
                          className="text-success hover:text-success/80 mr-3 p-1 rounded hover:bg-success/10 transition-colors cursor-pointer"
                          title="Edit Lab Result"
                        >
                          <FaEdit size={16} />
                        </button>
                      )}
                      {userRole === USER_ROLES.SUPER_ADMIN && (
                        <button 
                          onClick={() => handleDeleteLabResult(result._id)}
                          className="text-error hover:text-error/80 p-1 rounded hover:bg-error/10 transition-colors cursor-pointer"
                          title="Delete Lab Result"
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

      {/* Add Lab Result Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        title="Request New Lab Test"
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

            <FormField label="Test Type" required error={errors.testType}>
              <Select
                value={formData.testType}
                onChange={(e) => handleInputChange('testType', e.target.value)}
                options={Object.entries(LAB_TEST_TYPES).map(([key, value]) => ({
                  value,
                  label: LAB_TEST_LABELS[value],
                }))}
              />
            </FormField>

            <FormField label="Test Name" required error={errors.testName}>
              <Input
                value={formData.testName}
                onChange={(e) => handleInputChange('testName', e.target.value)}
                placeholder="Enter test name"
              />
            </FormField>
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
              onClick={handleAddLabResult}
              loading={loading}
            >
              Request Test
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Lab Result Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingLabResult(null);
          resetForm();
        }}
        title="Edit Lab Test Request"
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

            <FormField label="Test Type" required error={errors.testType}>
              <Select
                value={formData.testType}
                onChange={(e) => handleInputChange('testType', e.target.value)}
                options={Object.entries(LAB_TEST_TYPES).map(([key, value]) => ({
                  value,
                  label: LAB_TEST_LABELS[value],
                }))}
              />
            </FormField>

            <FormField label="Test Name" required error={errors.testName}>
              <Input
                value={formData.testName}
                onChange={(e) => handleInputChange('testName', e.target.value)}
                placeholder="Enter test name"
              />
            </FormField>
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
                setEditingLabResult(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateLabResult}
              loading={loading}
            >
              Update Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Lab Result Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingLabResult(null);
        }}
        title="Lab Test Details"
        size="lg"
      >
        {viewingLabResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary">Patient ID</label>
                <p className="mt-1 text-sm text-text-secondary">{viewingLabResult.patientId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary">Patient Name</label>
                <p className="mt-1 text-sm text-text-secondary">{viewingLabResult.patientName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary">Test Type</label>
                <p className="mt-1 text-sm text-text-secondary">{LAB_TEST_LABELS[viewingLabResult.testType]}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary">Test Name</label>
                <p className="mt-1 text-sm text-text-secondary">{viewingLabResult.testName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary">Status</label>
                <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(viewingLabResult.status)}`}>
                  {LAB_TEST_STATUS_LABELS[viewingLabResult.status]}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary">Requested At</label>
                <p className="mt-1 text-sm text-text-secondary">
                  {new Date(viewingLabResult.requestedAt).toLocaleString()}
                </p>
              </div>
            </div>

            {viewingLabResult.results && viewingLabResult.results.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Test Results</label>
                <div className="space-y-2">
                  {viewingLabResult.results.map((result, index) => (
                    <div key={index} className="border border-border-color p-3 rounded-lg bg-card-bg">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-text-muted">Parameter:</span>
                          <p className="font-medium text-text-primary">{result.parameter}</p>
                        </div>
                        <div>
                          <span className="text-text-muted">Value:</span>
                          <p className="font-medium text-text-primary">{result.value} {result.unit}</p>
                        </div>
                        {result.referenceRange && (
                          <div>
                            <span className="text-text-muted">Reference Range:</span>
                            <p className="font-medium text-text-primary">{result.referenceRange}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-text-muted">Status:</span>
                          <p className="font-medium text-text-primary">{result.isAbnormal ? 'Abnormal' : 'Normal'}</p>
                        </div>
                      </div>
                      {result.notes && (
                        <div className="mt-2">
                          <span className="text-text-muted text-sm">Notes:</span>
                          <p className="text-sm text-text-secondary">{result.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewingLabResult.notes && (
              <div>
                <label className="block text-sm font-medium text-text-primary">Notes</label>
                <p className="mt-1 text-sm text-text-secondary">{viewingLabResult.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewingLabResult(null);
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