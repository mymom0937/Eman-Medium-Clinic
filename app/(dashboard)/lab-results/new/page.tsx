'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { FormField, Input, Select, TextArea } from '@/components/ui/form';
import { LAB_TEST_TYPES, LAB_TEST_LABELS } from '@/constants/lab-test-types';
import { useUserRole } from '@/hooks/useUserRole';
import { toastManager } from '@/lib/utils/toast';

interface Patient {
  _id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
}

interface FormData {
  patientId: string;
  patientName: string;
  testType: string;
  testName: string;
  notes: string;
}

export default function NewLabResultPage() {
  const router = useRouter();

  const { userRole, userName, isLoaded } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [formData, setFormData] = useState<FormData>({
    patientId: '',
    patientName: '',
    testType: '',
    testName: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Load patients for patient selection
  useEffect(() => {
    const loadPatients = async () => {
      if (!isLoaded) return;

      try {
        const response = await fetch('/api/patients');
        const result = await response.json();
        
        if (response.ok && result.success) {
          setPatients(result.data);
          setFilteredPatients(result.data);
        }
      } catch (error) {
        console.error('Error loading patients:', error);
      }
    };

    loadPatients();
  }, [isLoaded]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

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

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleTestTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, testType: value }));
    if (errors.testType) {
      setErrors(prev => ({ ...prev, testType: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/lab-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: formData.patientId,
          patientName: formData.patientName,
          testType: formData.testType,
          testName: formData.testName,
          notes: formData.notes,
          requestedBy: userId || '',
        }),
      });

      if (response.ok) {
        toastManager.success('Lab test request created successfully!');
        router.push('/lab-results');
      } else {
        const error = await response.json();
        toastManager.error(error.error || 'Failed to create lab test request');
      }
    } catch (error) {
      console.error('Error creating lab result:', error);
      toastManager.error('Failed to create lab test request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter patients based on search term
  useEffect(() => {
    if (patients.length > 0) {
      const filtered = patients.filter(patient => {
        const fullName = `${patient.firstName} ${patient.lastName}`;
        return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               patient.patientId.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredPatients(filtered);
    }
  }, [searchTerm, patients]);

  const selectPatient = (patient: Patient) => {
    setFormData(prev => ({
      ...prev,
      patientId: patient.patientId,
      patientName: `${patient.firstName} ${patient.lastName}`,
    }));
    setShowPatientModal(false);
    setSearchTerm('');
  };

  return (
    <DashboardLayout
      title="Request New Lab Test"
      userRole={userRole}
      userName={userName}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Request New Lab Test</h1>
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lab Test Request Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Patient ID" required error={errors.patientId}>
                  <div className="flex gap-2">
                    <Input
                      value={formData.patientId}
                      onChange={(e) => handleInputChange('patientId', e.target.value)}
                      placeholder="Enter patient ID"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPatientModal(true)}
                    >
                      Browse
                    </Button>
                  </div>
                </FormField>
                <FormField label="Patient Name" required error={errors.patientName}>
                  <Input
                    value={formData.patientName}
                    onChange={(e) => handleInputChange('patientName', e.target.value)}
                    placeholder="Enter patient name"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Test Type" required error={errors.testType}>
                  <Select
                    value={formData.testType}
                    onChange={(e) => handleTestTypeChange(e.target.value)}
                    options={Object.entries(LAB_TEST_TYPES).map(([, value]) => ({
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

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} loading={loading}>
                  {loading ? 'Requesting...' : 'Request Lab Test'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Patient Selection Modal */}
      <Modal
        isOpen={showPatientModal}
        onClose={() => {
          setShowPatientModal(false);
          setSearchTerm('');
        }}
        title="Select Patient"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Patients
            </label>
            <input
              type="text"
              placeholder="Search by patient name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredPatients.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No patients found</p>
            ) : (
              <div className="space-y-2">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient._id}
                    className="border p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => selectPatient(patient)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{`${patient.firstName} ${patient.lastName}`}</p>
                        <p className="text-sm text-gray-500">ID: {patient.patientId}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {patient.age} years, {patient.gender}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowPatientModal(false);
                setSearchTerm('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
} 