'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StatsCard } from '@/components/dashboard/stats-card';
import { useUserRole } from '@/hooks/useUserRole';
import { Modal } from '@/components/ui/modal';
import { FormField, Input, Select, TextArea, Button } from '@/components/ui/form';
import { toastManager } from '@/lib/utils/toast';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';

interface Patient {
  _id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  address: string;
  bloodType: string;
  lastVisit: string;
  isActive: boolean;
  medicalHistory: string;
  createdAt: string;
  updatedAt: string;
}

interface PatientStats {
  totalPatients: number;
  newThisMonth: number;
  activePatients: number;
  averageAge: number;
}

const PATIENT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

const BLOOD_TYPE_OPTIONS = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
];

interface PatientFormData {
  name: string;
  age: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  bloodType: string;
  status: string;
  notes: string;
}

export default function PatientsPage() {
  const { userRole, userName, isLoaded } = useUserRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<PatientStats>({
    totalPatients: 0,
    newThisMonth: 0,
    activePatients: 0,
    averageAge: 0,
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState<PatientFormData>({
    name: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    bloodType: '',
    status: 'active',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<PatientFormData>>({});

  // Load patients from API on component mount
  useEffect(() => {
    const loadPatients = async () => {
      try {
        setInitialLoading(true);
        const response = await fetch('/api/patients');
        const result = await response.json();
        
        if (response.ok && result.success) {
          setPatients(result.data);
          
          // Calculate stats from real data
          const totalPatients = result.data.length;
          const activePatients = result.data.filter((patient: Patient) => patient.isActive).length;
          const averageAge = result.data.length > 0 
            ? Math.round(result.data.reduce((sum: number, patient: Patient) => sum + (patient.age || 0), 0) / (result.data.filter((patient: Patient) => patient.age).length || 1))
            : 0;
          
          // Calculate new patients this month
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          const newThisMonth = result.data.filter((patient: Patient) => {
            const createdAt = new Date(patient.createdAt);
            return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
          }).length;

          setStats({
            totalPatients,
            newThisMonth,
            activePatients,
            averageAge,
          });
        }
      } catch (error) {
        console.error('Error loading patients:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    if (isLoaded) {
      loadPatients();
    }
  }, [isLoaded]);

  if (!isLoaded || initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Filter patients based on search, status, and gender
  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.firstName} ${patient.lastName}`.trim();
    const matchesSearch = patient.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.phone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || (patient.isActive ? 'active' : 'inactive') === selectedStatus;
    const matchesGender = selectedGender === 'all' || patient.gender.toLowerCase() === selectedGender;
    return matchesSearch && matchesStatus && matchesGender;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
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

  const generatePatientId = () => {
    const lastPatient = patients[patients.length - 1];
    const lastNumber = lastPatient ? parseInt(lastPatient.patientId.replace('PAT', '')) : 0;
    return `PAT${String(lastNumber + 1).padStart(6, '0')}`;
  };

  // Create display stats from real data
  const displayStats = [
    {
      title: 'Total Patients',
      value: stats.totalPatients.toString(),
      change: '+12% from last month',
      changeType: 'positive' as const,
      icon: '👥',
    },
    {
      title: 'New This Month',
      value: stats.newThisMonth.toString(),
      change: '+5 from last month',
      changeType: 'positive' as const,
      icon: '🆕',
    },
    {
      title: 'Active Patients',
      value: stats.activePatients.toString(),
      change: '+8% from last month',
      changeType: 'positive' as const,
      icon: '✅',
    },
    {
      title: 'Average Age',
      value: stats.averageAge.toString(),
      change: 'No change',
      changeType: 'neutral' as const,
      icon: '📊',
    },
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<PatientFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Patient name is required';
    }
    if (!formData.age || parseInt(formData.age) <= 0) {
      newErrors.age = 'Valid age is required';
    }
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    // Blood type is optional

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddPatient = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Split full name into first and last name
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const patientData = {
        firstName,
        lastName,
        age: formData.age ? parseInt(formData.age) : null,
        bloodType: formData.bloodType || '',
        phone: formData.phone,
        email: formData.email,
        dateOfBirth: null, // You can add date picker later
        gender: formData.gender.toUpperCase(),
        address: formData.address,
        emergencyContact: '',
        medicalHistory: formData.notes,
        allergies: [],
      };

      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add patient');
      }

      if (result.success) {
        setPatients([...patients, result.data]);
      } else {
        throw new Error(result.error || 'Failed to add patient');
      }
      setIsAddModalOpen(false);
      resetForm();
      toastManager.success('Patient added successfully!');
    } catch (error) {
      console.error('Error adding patient:', error);
      toastManager.error('Failed to add patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      name: `${patient.firstName} ${patient.lastName}`,
      age: patient.age?.toString() || '',
      gender: patient.gender?.toLowerCase() || '',
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || '',
      bloodType: patient.bloodType || '',
      status: patient.isActive ? 'active' : 'inactive',
      notes: patient.medicalHistory || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdatePatient = async () => {
    if (!validateForm() || !editingPatient) return;

    setLoading(true);
    try {
      // Split full name into first and last name
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const patientData = {
        firstName,
        lastName,
        phone: formData.phone,
        email: formData.email,
        dateOfBirth: null,
        gender: formData.gender.toUpperCase(),
        address: formData.address,
        bloodType: formData.bloodType,
        age: parseInt(formData.age),
        isActive: formData.status === 'active',
        medicalHistory: formData.notes,
      };

      const response = await fetch(`/api/patients/${editingPatient._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update patient');
      }

      if (result.success) {
        setPatients(patients.map(patient =>
          patient._id === editingPatient._id ? result.data : patient
        ));
        setIsEditModalOpen(false);
        setEditingPatient(null);
        resetForm();
        toastManager.success('Patient updated successfully!');
      } else {
        throw new Error(result.error || 'Failed to update patient');
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      toastManager.error('Failed to update patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    if (!confirm('Are you sure you want to delete this patient?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPatients(patients.filter(patient => patient._id !== patientId));
        toastManager.success('Patient deleted successfully!');
      } else {
        toastManager.error('Failed to delete patient');
      }
    } catch (error) {
      console.error('Error deleting patient:', error);
      toastManager.error('Failed to delete patient');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      age: '',
      gender: '',
      phone: '',
      email: '',
      address: '',
      bloodType: '',
      status: 'active',
      notes: '',
    });
    setErrors({});
  };

  const handleInputChange = (field: keyof PatientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleViewPatient = (patient: Patient) => {
    setViewingPatient(patient);
    setIsViewModalOpen(true);
  };

  return (
    <DashboardLayout
      title="Patient Management"
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

        {/* Patient Records Section */}
        <div className="bg-card-bg rounded-lg border border-border-color p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-text-primary">Patient Records</h2>
            <Button onClick={() => setIsAddModalOpen(true)} className="cursor-pointer bg-[#1447E6] hover:bg-gray-700">
              Add New Patient
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder="Search patients by ID, name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary placeholder-text-muted bg-background"
            />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background"
            >
              <option value="all" className="text-text-primary">All Status</option>
              {PATIENT_STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value} className="text-text-primary">
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background"
            >
              <option value="all" className="text-text-primary">All Genders</option>
              {GENDER_OPTIONS.map(option => (
                <option key={option.value} value={option.value} className="text-text-primary">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Patients Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-color">
              <thead className="bg-card-bg">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Patient ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Age
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Blood Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Last Visit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border-color">
                {filteredPatients.map((patient) => (
                  <tr key={patient._id} className="hover:bg-card-bg">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                      {patient.patientId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {`${patient.firstName} ${patient.lastName}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {patient.age || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {patient.gender}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      <div>
                        <div className="text-text-primary">{patient.phone}</div>
                        <div className="text-text-secondary">{patient.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {patient.bloodType || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {formatDate(patient.lastVisit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(patient.isActive ? 'active' : 'inactive')}`}>
                        {patient.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleViewPatient(patient)}
                        className="text-accent-color hover:text-accent-hover mr-3 p-1 rounded hover:bg-accent-color/10 transition-colors cursor-pointer"
                        title="View Patient"
                      >
                        <FaEye size={16} />
                      </button>
                      <button 
                        onClick={() => handleEditPatient(patient)}
                        className="text-success hover:text-success/80 mr-3 p-1 rounded hover:bg-success/10 transition-colors cursor-pointer"
                        title="Edit Patient"
                      >
                        <FaEdit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeletePatient(patient._id)}
                        className="text-error hover:text-error/80 p-1 rounded hover:bg-error/10 transition-colors cursor-pointer"
                        title="Delete Patient"
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

      {/* Add Patient Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        title="Add New Patient"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Full Name" required error={errors.name}>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter patient's full name"
              />
            </FormField>

            <FormField label="Age" required error={errors.age}>
              <Input
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                placeholder="Enter age"
                min="1"
                max="120"
              />
            </FormField>

            <FormField label="Gender" required error={errors.gender}>
              <Select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                options={GENDER_OPTIONS}
              />
            </FormField>

            <FormField label="Phone Number" required error={errors.phone}>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </FormField>

            <FormField label="Email" required error={errors.email}>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
              />
            </FormField>

            <FormField label="Blood Type" required error={errors.bloodType}>
              <Select
                value={formData.bloodType}
                onChange={(e) => handleInputChange('bloodType', e.target.value)}
                options={BLOOD_TYPE_OPTIONS}
              />
            </FormField>

            <FormField label="Status" required error={errors.status}>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                options={PATIENT_STATUS_OPTIONS}
              />
            </FormField>
          </div>

          <FormField label="Address" required error={errors.address}>
            <TextArea
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter patient's address"
              rows={2}
            />
          </FormField>

          <FormField label="Medical Notes">
            <TextArea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Enter any medical notes (optional)"
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
            <Button className='hover:bg-gray-700 cursor-pointer bg-[#1447E6]'
              onClick={handleAddPatient}
              loading={loading}
            >
              Add Patient
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Patient Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPatient(null);
          resetForm();
        }}
        title="Edit Patient"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Full Name" required error={errors.name}>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter patient's full name"
              />
            </FormField>

            <FormField label="Age" required error={errors.age}>
              <Input
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                placeholder="Enter age"
                min="1"
                max="120"
              />
            </FormField>

            <FormField label="Gender" required error={errors.gender}>
              <Select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                options={GENDER_OPTIONS}
              />
            </FormField>

            <FormField label="Phone Number" required error={errors.phone}>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </FormField>

            <FormField label="Email" required error={errors.email}>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
              />
            </FormField>

            <FormField label="Blood Type" required error={errors.bloodType}>
              <Select
                value={formData.bloodType}
                onChange={(e) => handleInputChange('bloodType', e.target.value)}
                options={BLOOD_TYPE_OPTIONS}
              />
            </FormField>

            <FormField label="Status" required error={errors.status}>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                options={PATIENT_STATUS_OPTIONS}
              />
            </FormField>
          </div>

          <FormField label="Address" required error={errors.address}>
            <TextArea
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter patient's address"
              rows={2}
            />
          </FormField>

          <FormField label="Medical Notes">
            <TextArea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Enter any medical notes (optional)"
              rows={3}
            />
          </FormField>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingPatient(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button className='hover:bg-gray-700 cursor-pointer bg-[#1447E6]'
              onClick={handleUpdatePatient}
              loading={loading}
            >
              Update Patient
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Patient Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingPatient(null);
        }}
        title="Patient Details"
        size="md"
      >
        {viewingPatient && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Patient ID</label>
                <p className="mt-1 text-sm text-gray-900">{viewingPatient.patientId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <p className="mt-1 text-sm text-gray-900">{`${viewingPatient.firstName} ${viewingPatient.lastName}`}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Age</label>
                                        <p className="mt-1 text-sm text-gray-900">{viewingPatient.age ? `${viewingPatient.age} years` : 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <p className="mt-1 text-sm text-gray-900">{viewingPatient.gender}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{viewingPatient.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{viewingPatient.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Blood Type</label>
                <p className="mt-1 text-sm text-gray-900">{viewingPatient.bloodType || 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(viewingPatient.isActive ? 'active' : 'inactive')}`}>
                  {viewingPatient.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Visit</label>
                                    <p className="mt-1 text-sm text-gray-900">{formatDate(viewingPatient.lastVisit)}</p>
              </div>
            </div>
            {viewingPatient.address && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <p className="mt-1 text-sm text-gray-900">{viewingPatient.address}</p>
              </div>
            )}
            {viewingPatient.medicalHistory && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <p className="mt-1 text-sm text-gray-900">{viewingPatient.medicalHistory}</p>
              </div>
            )}
            <div className="flex justify-end pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewingPatient(null);
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