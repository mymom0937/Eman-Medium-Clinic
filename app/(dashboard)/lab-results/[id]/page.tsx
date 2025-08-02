'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { FormField, Input, TextArea } from '@/components/ui/form';
import { LabResult, LabTestResult } from '@/types/lab-result';
import { LAB_TEST_LABELS, LAB_TEST_STATUS_LABELS, LAB_TEST_TYPES } from '@/constants/lab-test-types';
import { USER_ROLES } from '@/constants/user-roles';
import { useUserRole } from '@/hooks/useUserRole';
import { toastManager } from '@/lib/utils/toast';
import { FaEdit, FaSave, FaTimes } from 'react-icons/fa';

// Mock data for lab result
const mockLabResult: LabResult = {
  _id: '1',
  patientId: 'PAT001',
  patientName: 'John Doe',
  testType: 'COMPLETE_BLOOD_COUNT',
  testName: 'Complete Blood Count',
  status: 'IN_PROGRESS',
  requestedBy: 'nurse1',
  requestedAt: new Date('2024-01-15T10:30:00'),
  completedBy: 'lab1',
  completedAt: undefined,
  results: [
    {
      parameter: 'Hemoglobin',
      value: '14.2',
      unit: 'g/dL',
      referenceRange: '13.5-17.5',
      isAbnormal: false,
      notes: 'Normal range',
    },
    {
      parameter: 'White Blood Cells',
      value: '11.5',
      unit: 'K/μL',
      referenceRange: '4.5-11.0',
      isAbnormal: true,
      notes: 'Slightly elevated',
    },
    {
      parameter: 'Platelets',
      value: '250',
      unit: 'K/μL',
      referenceRange: '150-450',
      isAbnormal: false,
      notes: 'Normal range',
    },
  ],
  notes: 'Patient has fever and fatigue. CBC shows slightly elevated WBC count.',
  createdAt: new Date('2024-01-15T10:30:00'),
  updatedAt: new Date('2024-01-15T10:30:00'),
};

export default function LabResultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userId } = useAuth();
  const { userRole, userName, isLoaded } = useUserRole();
  const [labResult, setLabResult] = useState<LabResult | null>(mockLabResult);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [results, setResults] = useState<LabTestResult[]>(mockLabResult.results || []);
  const [notes, setNotes] = useState(mockLabResult.notes || '');

  useEffect(() => {
    if (isLoaded && params.id) {
      // In real app, fetch from API
      setLabResult(mockLabResult);
      setResults(mockLabResult.results || []);
      setNotes(mockLabResult.notes || '');
    }
  }, [isLoaded, params.id]);

  const updateLabResult = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedLabResult: LabResult = {
        ...labResult!,
        results,
        notes,
        status: 'COMPLETED' as const,
        completedBy: userId || '',
        completedAt: new Date(),
        updatedAt: new Date(),
      };

      setLabResult(updatedLabResult);
      setIsEditing(false);
      setShowEditModal(false);
      toastManager.success('Lab result updated successfully!');
    } catch (error) {
      console.error('Error updating lab result:', error);
      toastManager.error('Failed to update lab result. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addTestResult = () => {
    setResults([
      ...results,
      {
        parameter: '',
        value: '',
        unit: '',
        referenceRange: '',
        isAbnormal: false,
        notes: '',
      },
    ]);
  };

  const removeTestResult = (index: number) => {
    setResults(results.filter((_, i) => i !== index));
  };

  const updateTestResult = (index: number, field: keyof LabTestResult, value: any) => {
    const updatedResults = [...results];
    updatedResults[index] = { ...updatedResults[index], [field]: value };
    setResults(updatedResults);
  };

  const canEdit = () => {
    if (userRole === USER_ROLES.SUPER_ADMIN) return true;
    if (userRole === USER_ROLES.LABORATORIST) return true;
    return false;
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <DashboardLayout
        title="Lab Result Details"
        userRole={userRole}
        userName={userName}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            <p className="mt-4">Loading lab result...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!labResult) {
    return (
      <DashboardLayout
        title="Lab Result Details"
        userRole={userRole}
        userName={userName}
      >
        <div className="text-center">
          <p>Lab result not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Lab Result Details"
      userRole={userRole}
      userName={userName}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Lab Result Details</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
            {canEdit() && labResult.status !== 'COMPLETED' && (
              <Button onClick={() => setShowEditModal(true)}>
                <FaEdit className="mr-2" />
                Edit Results
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Patient Name</label>
                  <p className="text-sm text-gray-600">{labResult.patientName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Patient ID</label>
                  <p className="text-sm text-gray-600">{labResult.patientId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Test Type</label>
                  <p className="text-sm text-gray-600">{LAB_TEST_LABELS[labResult.testType]}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Test Name</label>
                  <p className="text-sm text-gray-600">{labResult.testName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <Badge variant={
                    labResult.status === 'COMPLETED' ? 'default' :
                    labResult.status === 'IN_PROGRESS' ? 'secondary' :
                    labResult.status === 'PENDING' ? 'outline' : 'destructive'
                  }>
                    {LAB_TEST_STATUS_LABELS[labResult.status]}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requested At</label>
                  <p className="text-sm text-gray-600">
                    {new Date(labResult.requestedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.length > 0 ? (
                  results.map((result, index) => (
                    <div key={index} className="border p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Parameter</label>
                          <p className="text-sm text-gray-600">{result.parameter}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Value</label>
                          <p className="text-sm text-gray-600">{result.value} {result.unit}</p>
                        </div>
                        {result.referenceRange && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Reference Range</label>
                            <p className="text-sm text-gray-600">{result.referenceRange}</p>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Status</label>
                          <Badge variant={result.isAbnormal ? 'destructive' : 'default'}>
                            {result.isAbnormal ? 'Abnormal' : 'Normal'}
                          </Badge>
                        </div>
                        {result.notes && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Notes</label>
                            <p className="text-sm text-gray-600">{result.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No test results available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {notes || 'No notes available'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Results Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setIsEditing(false);
        }}
        title="Edit Lab Test Results"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Test Results</label>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Parameter">
                      <Input
                        value={result.parameter}
                        onChange={(e) => updateTestResult(index, 'parameter', e.target.value)}
                        placeholder="Enter parameter name"
                      />
                    </FormField>
                    <FormField label="Value">
                      <Input
                        value={result.value}
                        onChange={(e) => updateTestResult(index, 'value', e.target.value)}
                        placeholder="Enter value"
                      />
                    </FormField>
                    <FormField label="Unit">
                      <Input
                        value={result.unit || ''}
                        onChange={(e) => updateTestResult(index, 'unit', e.target.value)}
                        placeholder="Enter unit"
                      />
                    </FormField>
                    <FormField label="Reference Range">
                      <Input
                        value={result.referenceRange || ''}
                        onChange={(e) => updateTestResult(index, 'referenceRange', e.target.value)}
                        placeholder="Enter reference range"
                      />
                    </FormField>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={result.isAbnormal}
                        onChange={(e) => updateTestResult(index, 'isAbnormal', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label className="text-sm font-medium text-gray-700">Abnormal</label>
                    </div>
                    <FormField label="Notes">
                      <Input
                        value={result.notes || ''}
                        onChange={(e) => updateTestResult(index, 'notes', e.target.value)}
                        placeholder="Enter notes"
                      />
                    </FormField>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeTestResult(index)}
                    className="mt-2"
                  >
                    <FaTimes className="mr-1" />
                    Remove
                  </Button>
                </div>
              ))}
              <Button onClick={addTestResult} variant="outline" className="w-full">
                Add Test Result
              </Button>
            </div>
          </div>

          <FormField label="Notes">
            <TextArea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes..."
              rows={4}
            />
          </FormField>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowEditModal(false);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={updateLabResult}
              loading={loading}
            >
              <FaSave className="mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
} 