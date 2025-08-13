"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import Footer from "@/components/Footer";
import { StatsCard } from "@/components/dashboard/stats-card";
import { useUserRole } from "@/hooks/useUserRole";
import { PageLoader } from "@/components/common/loading-spinner";
import {
  FormField,
  Input,
  Select,
  TextArea,
  Button,
} from "@/components/ui/form";
import { toastManager } from "@/lib/utils/toast";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { CountryCodeSelector } from "@/components/ui/country-code-selector";
import { Modal } from "@/components/ui/modal";
import { LAB_TEST_TYPES, LAB_TEST_LABELS } from "@/constants/lab-test-types";
import { PaginationControls } from "@/components/ui/pagination";
import { COUNTRY_CODES, CountryCode } from "@/constants/country-codes";

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
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const BLOOD_TYPE_OPTIONS = [
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
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
  selectedCountry: CountryCode;
}

export default function PatientsPage() {
  const { userRole, userName, isLoaded } = useUserRole();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientLatestTests, setPatientLatestTests] = useState<Record<string, { testType: string; additionalTestTypes: string[] }>>({});
  const [openTestTypesFor, setOpenTestTypesFor] = useState<string | null>(null);
  // If a Test Types dropdown should open upward (when close to viewport bottom)
  const [dropUpFor, setDropUpFor] = useState<string | null>(null);
  const [stats, setStats] = useState<PatientStats>({
    totalPatients: 0,
    newThisMonth: 0,
    activePatients: 0,
    averageAge: 0,
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState<PatientFormData>({
    name: "",
    age: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    bloodType: "",
    status: "active",
    notes: "",
    selectedCountry:
      COUNTRY_CODES.find((country) => country.code === "ET") ||
      COUNTRY_CODES[0],
  });
  const [errors, setErrors] = useState<Partial<PatientFormData>>({});
  // Explicitly track viewport width to control desktop vs mobile rendering
  const [isLgUp, setIsLgUp] = useState(false);
  // Lab request modal state (Nurse initiates lab tests from Patients page)
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [labPatientId, setLabPatientId] = useState("");
  const [labPatientName, setLabPatientName] = useState("");
  const [labTestType, setLabTestType] = useState<string>(LAB_TEST_TYPES.COMPLETE_BLOOD_COUNT);
  const [labAdditionalTests, setLabAdditionalTests] = useState<string[]>([]);
  const [labTestName, setLabTestName] = useState("");
  const [labNotes, setLabNotes] = useState("");
  const [labEditingId, setLabEditingId] = useState<string | null>(null);
  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 5; // Updated to show 5 patients per page
  // Date range controls for stats
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [rangeStart, setRangeStart] = useState<string>('');
  const [rangeEnd, setRangeEnd] = useState<string>('');

  useEffect(() => {
    const handleResize = () => setIsLgUp(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close test types dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-pt-test-types]')) {
        setOpenTestTypesFor(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load patients from API on component mount
  useEffect(() => {
    const loadPatients = async () => {
      try {
        setInitialLoading(true);
        // Request a larger limit so we get all patients (API default limit=10 was hiding some)
        const response = await fetch("/api/patients?limit=1000&page=1");
        const result = await response.json();

        if (response.ok && result.success) {
          // Sort by patientId to keep ordering consistent for ID generation
          const sorted = [...result.data].sort((a: Patient, b: Patient) =>
            a.patientId.localeCompare(b.patientId)
          );
           setPatients(sorted);

           // Fetch latest lab test per patient for quick glance column
           try {
             const labRes = await fetch('/api/lab-results');
             const labItems = await labRes.json();
             if (labRes.ok && Array.isArray(labItems)) {
               const map: Record<string, { testType: string; additionalTestTypes: string[] }> = {};
               for (const r of labItems as any[]) {
                 if (!map[r.patientId]) {
                   map[r.patientId] = {
                     testType: r.testType,
                     additionalTestTypes: r.additionalTestTypes || [],
                   };
                 }
               }
               setPatientLatestTests(map);
             }
           } catch (e) {
             console.error('Failed to load lab results for patients column', e);
           }

          // Range-based stats
          const now = new Date();
          let start: Date | null = null;
          let end: Date | null = null;
          switch (dateRange) {
            case 'today':
              start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
              break;
            case 'week': {
              const ws = new Date(now);
              ws.setDate(now.getDate() - now.getDay());
              start = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate());
              end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
              break;
            }
            case 'month':
              start = new Date(now.getFullYear(), now.getMonth(), 1);
              end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
              break;
            case 'year':
              start = new Date(now.getFullYear(), 0, 1);
              end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
              break;
            case 'custom':
              if (rangeStart) start = new Date(rangeStart);
              if (rangeEnd) end = new Date(rangeEnd);
              break;
          }
          const inRange = sorted.filter((p: Patient) => {
            const d = new Date(p.createdAt);
            return (!start || d >= start) && (!end || d <= end);
          });
          const totalPatients = inRange.length;
          const activePatients = inRange.filter((p) => p.isActive).length;
          const averageAge = inRange.length > 0
            ? Math.round(inRange.reduce((s, p) => s + (p.age || 0), 0) / (inRange.filter((p) => p.age).length || 1))
            : 0;
          const newThisMonth = totalPatients; // within range

          setStats({ totalPatients, newThisMonth, activePatients, averageAge });
        }
      } catch (error) {
        console.error("Error loading patients:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    if (isLoaded) {
      loadPatients();
    }
  }, [isLoaded]);

  // Always declare hooks before any conditional return to preserve order.
  // Reset to page 1 when filters/search change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedStatus, selectedGender]);

  if (!isLoaded || initialLoading) {
    return (
      <DashboardLayout title="Patients" userRole={userRole} userName={userName}>
        <div className="flex items-center justify-center h-[60vh]">
          <PageLoader text="Loading Patients..." />
        </div>
      </DashboardLayout>
    );
  }

  // Filter patients based on search, status, and gender
  const filteredPatients = patients.filter((patient) => {
    const safeLower = (v: any) =>
      typeof v === "string" ? v.toLowerCase() : "";
    const fullName = `${patient.firstName || ""} ${
      patient.lastName || ""
    }`.trim();
    const search = safeLower(searchTerm);
    const matchesSearch =
      safeLower(patient.patientId).includes(search) ||
      safeLower(fullName).includes(search) ||
      safeLower(patient.email).includes(search) ||
      safeLower(patient.phone).includes(search);
    const matchesStatus =
      selectedStatus === "all" ||
      (patient.isActive ? "active" : "inactive") === selectedStatus;
    const matchesGender =
      selectedGender === "all" || safeLower(patient.gender) === selectedGender;
    return matchesSearch && matchesStatus && matchesGender;
  });

  const totalFiltered = filteredPatients.length;
  const paginatedPatients = filteredPatients.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "N/A";
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return "Invalid Date";
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(d);
    } catch {
      return "Invalid Date";
    }
  };

  // Date-only (e.g., Aug 7, 2025) for registration and activity dates

  // Abbreviate gender to M/F
  const toShortGender = (gender: string | null | undefined) => {
    if (!gender) return "-";
    const c = gender.trim().charAt(0).toUpperCase();
    if (c === "M") return "M";
    if (c === "F") return "F";
    return "-";
  };

  const generatePatientId = () => {
    const lastPatient = patients[patients.length - 1];
    const lastNumber = lastPatient
      ? parseInt(lastPatient.patientId.replace("PAT", ""))
      : 0;
    return `PAT${String(lastNumber + 1).padStart(6, "0")}`;
  };

  const openLabRequestFor = (p: Patient) => {
    setLabPatientId(p.patientId);
    setLabPatientName(`${p.firstName} ${p.lastName}`);
    setLabNotes(p.medicalHistory || "");
    setLabTestType(LAB_TEST_TYPES.COMPLETE_BLOOD_COUNT);
    setLabAdditionalTests([]);
    setLabTestName("");
    setLabEditingId(null);
    setIsLabModalOpen(true);
  };

  const openEditLabRequestFor = async (p: Patient) => {
    try {
      setLabPatientId(p.patientId);
      setLabPatientName(`${p.firstName} ${p.lastName}`);
      // fetch patient's lab results; prefer most recent non-final
      const res = await fetch(`/api/lab-results?patientId=${encodeURIComponent(p.patientId)}`);
      const items = await res.json();
      if (!res.ok || !Array.isArray(items) || items.length === 0) {
        toastManager.error('No lab test requests found for this patient.');
        return;
      }
      const sorted = [...items].sort((a:any,b:any)=> new Date(b.requestedAt||b.createdAt).getTime() - new Date(a.requestedAt||a.createdAt).getTime());
      const candidate = sorted.find((r:any)=> r.status !== 'COMPLETED' && r.status !== 'CANCELLED') || sorted[0];
      setLabEditingId(candidate._id);
      setLabTestType(candidate.testType || LAB_TEST_TYPES.COMPLETE_BLOOD_COUNT);
      setLabAdditionalTests(candidate.additionalTestTypes || []);
      setLabTestName(candidate.testName || '');
      setLabNotes(candidate.notes || (p.medicalHistory || ''));
      setIsLabModalOpen(true);
    } catch (e) {
      console.error(e);
      toastManager.error('Failed to load lab request for editing.');
    }
  };

  const handleSubmitLabRequest = async () => {
    try {
      const body:any = {
        patientId: labPatientId,
        patientName: labPatientName,
        testType: labTestType,
        testName: labTestName,
        selectedTestTypes: labAdditionalTests,
        notes: labNotes,
      };
      let res: Response;
      if (labEditingId) {
        res = await fetch(`/api/lab-results/${labEditingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      } else {
        res = await fetch('/api/lab-results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      }
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed to submit lab request');
      setIsLabModalOpen(false);
      setLabAdditionalTests([]);
      setLabTestName('');
      setLabEditingId(null);
      toastManager.success(labEditingId ? 'Lab test request updated.' : 'Lab test requested.');

      // Refresh the "Test Types" quick column for this patient so the table updates immediately
      try {
        const latestRes = await fetch(`/api/lab-results?patientId=${encodeURIComponent(labPatientId)}`);
        const latestItems = await latestRes.json();
        if (latestRes.ok && Array.isArray(latestItems) && latestItems.length > 0) {
          const latest = [...latestItems]
            .sort((a: any, b: any) => new Date(b.requestedAt || b.createdAt).getTime() - new Date(a.requestedAt || a.createdAt).getTime())[0];
          setPatientLatestTests(prev => ({
            ...prev,
            [labPatientId]: {
              testType: latest.testType,
              additionalTestTypes: latest.additionalTestTypes || [],
            },
          }));
        }
      } catch (e) {
        console.error('Failed to refresh latest test types for patient', e);
      }
    } catch (e:any) {
      console.error(e);
      toastManager.error(e.message || 'Failed to submit request');
    }
  };

  // Create display stats from real data
  const comparisonLabel = dateRange==='custom' ? '' : `compared to last ${dateRange}`;
  const displayStats = [
    {
      title: "Total Patients",
      value: stats.totalPatients.toString(),
      change: dateRange==='custom'? undefined : comparisonLabel,
      changeType: "positive" as const,
      icon: "👥",
    },
    {
      title: "New This Month",
      value: stats.newThisMonth.toString(),
      change: dateRange==='custom'? undefined : comparisonLabel,
      changeType: "positive" as const,
      icon: "🆕",
    },
    {
      title: "Active Patients",
      value: stats.activePatients.toString(),
      change: dateRange==='custom'? undefined : comparisonLabel,
      changeType: "positive" as const,
      icon: "✅",
    },
    {
      title: "Average Age",
      value: stats.averageAge.toString(),
      change: "No change",
      changeType: "neutral" as const,
      icon: "📊",
    },
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<PatientFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Patient name is required";
    }
    if (!formData.age || parseInt(formData.age) <= 0) {
      newErrors.age = "Valid age is required";
    }
    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }
    // Phone is optional - only validate if provided
    if (formData.phone.trim()) {
      // Basic validation for phone number length (7-15 digits)
      if (formData.phone.length < 7 || formData.phone.length > 15) {
        newErrors.phone = "Please enter a valid phone number (7-15 digits)";
      }
    }
    // Email is optional - only validate if provided
    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }
    // Blood type is optional
    // Status is optional
    if (!formData.notes.trim()) {
      newErrors.notes = "Current illness/symptoms are required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddPatient = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Split full name into first and last name
      const nameParts = formData.name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Format phone number with spaces for readability
      const formatPhoneNumber = (phone: string) => {
        if (!phone) return "";
        // Add spaces every 3-4 digits for better readability
        const cleaned = phone.replace(/\s/g, "");
        const match = cleaned.match(/^(\d{1,4})(\d{3})(\d{3})(\d{2,4})?$/);
        if (match) {
          return match.slice(1).filter(Boolean).join(" ");
        }
        return cleaned;
      };

      const patientData = {
        firstName,
        lastName,
        age: formData.age ? parseInt(formData.age) : null,
        bloodType: formData.bloodType || "",
        phone: formData.phone
          ? `${formData.selectedCountry.dialCode} ${formatPhoneNumber(
              formData.phone
            )}`
          : "",
        email: formData.email,
        dateOfBirth: null, // You can add date picker later
        gender: formData.gender.toUpperCase(),
        address: formData.address,
        emergencyContact: "",
        medicalHistory: formData.notes,
        allergies: [],
      };

      const response = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patientData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add patient");
      }

      if (result.success) {
        setPatients([...patients, result.data]);
      } else {
        throw new Error(result.error || "Failed to add patient");
      }
      setIsAddModalOpen(false);
      resetForm();
      toastManager.success("Patient added successfully!");
    } catch (error) {
      console.error("Error adding patient:", error);
      toastManager.error("Failed to add patient. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    // Parse phone number to extract country code and number
    let phoneNumber = patient.phone || "";
    let selectedCountry =
      COUNTRY_CODES.find((country) => country.code === "ET") ||
      COUNTRY_CODES[0];

    // Try to find the country code from the phone number
    if (phoneNumber) {
      const foundCountry = COUNTRY_CODES.find((country) =>
        phoneNumber.startsWith(country.dialCode)
      );
      if (foundCountry) {
        selectedCountry = foundCountry;
        // Remove country code and clean up spaces
        phoneNumber = phoneNumber
          .replace(foundCountry.dialCode, "")
          .replace(/\s/g, "")
          .trim();
      }
    }

    setFormData({
      name: `${patient.firstName} ${patient.lastName}`,
      age: patient.age?.toString() || "",
      gender: patient.gender?.toLowerCase() || "",
      phone: phoneNumber,
      email: patient.email || "",
      address: patient.address || "",
      bloodType: patient.bloodType || "",
      status: patient.isActive ? "active" : "inactive",
      notes: patient.medicalHistory || "",
      selectedCountry,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdatePatient = async () => {
    if (!validateForm() || !editingPatient) return;

    setLoading(true);
    try {
      // Split full name into first and last name
      const nameParts = formData.name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Format phone number with spaces for readability
      const formatPhoneNumber = (phone: string) => {
        if (!phone) return "";
        // Add spaces every 3-4 digits for better readability
        const cleaned = phone.replace(/\s/g, "");
        const match = cleaned.match(/^(\d{1,4})(\d{3})(\d{3})(\d{2,4})?$/);
        if (match) {
          return match.slice(1).filter(Boolean).join(" ");
        }
        return cleaned;
      };

      const patientData = {
        firstName,
        lastName,
        phone: formData.phone
          ? `${formData.selectedCountry.dialCode} ${formatPhoneNumber(
              formData.phone
            )}`
          : "",
        email: formData.email,
        dateOfBirth: null,
        gender: formData.gender.toUpperCase(),
        address: formData.address,
        bloodType: formData.bloodType,
        age: parseInt(formData.age),
        isActive: formData.status === "active",
        medicalHistory: formData.notes,
      };

      const response = await fetch(`/api/patients/${editingPatient._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patientData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update patient");
      }

      if (result.success) {
        setPatients(
          patients.map((patient) =>
            patient._id === editingPatient._id ? result.data : patient
          )
        );
        setIsEditModalOpen(false);
        setEditingPatient(null);
        resetForm();
        toastManager.success("Patient updated successfully!");
      } else {
        throw new Error(result.error || "Failed to update patient");
      }
    } catch (error) {
      console.error("Error updating patient:", error);
      toastManager.error("Failed to update patient. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    if (!confirm("Are you sure you want to delete this patient?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPatients(patients.filter((patient) => patient._id !== patientId));
        toastManager.success("Patient deleted successfully!");
      } else {
        toastManager.error("Failed to delete patient");
      }
    } catch (error) {
      console.error("Error deleting patient:", error);
      toastManager.error("Failed to delete patient");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      age: "",
      gender: "",
      phone: "",
      email: "",
      address: "",
      bloodType: "",
      status: "active",
      notes: "",
      selectedCountry:
        COUNTRY_CODES.find((country) => country.code === "ET") ||
        COUNTRY_CODES[0],
    });
    setErrors({});
  };

  const handleInputChange = (
    field: keyof PatientFormData,
    value: string | CountryCode
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleViewPatient = (patient: Patient) => {
    setViewingPatient(patient);
    setIsViewModalOpen(true);
  };

  return (
    <>
      <DashboardLayout
        title="Patient Management"
        userRole={userRole}
        userName={userName}
      >
        <div className="space-y-6">
          {/* Stats Controls + Cards */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-text-secondary">Summary</div>
              <div className="flex flex-col sm:flex-row gap-3">
                <select value={dateRange} onChange={(e)=>setDateRange(e.target.value as any)} className="w-full sm:w-auto border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background">
                  <option value="today">Today</option>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                  <option value="year">This year</option>
                  <option value="custom">Custom</option>
                </select>
                {dateRange==='custom' && (
                  <div className="flex gap-3">
                    <input type="date" value={rangeStart} onChange={(e)=>setRangeStart(e.target.value)} className="border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background" />
                    <input type="date" value={rangeEnd} onChange={(e)=>setRangeEnd(e.target.value)} className="border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background" />
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
          </div>

          {/* Patient Records Section */}
          <div className="bg-card-bg rounded-lg border border-border-color p-6 w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-primary">
                Patient Records
              </h2>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="cursor-pointer bg-[#1447E6] hover:bg-gray-700"
              >
                Add New Patient
              </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 mb-6">
              <input
                type="text"
                placeholder="Search patients by ID, name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full lg:flex-1 border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary placeholder-text-muted bg-background"
              />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full lg:w-44 border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background"
              >
                <option value="all" className="text-text-primary">
                  All Status
                </option>
                {PATIENT_STATUS_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="text-text-primary"
                  >
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="w-full lg:w-44 border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background"
              >
                <option value="all" className="text-text-primary">
                  All Genders
                </option>
                {GENDER_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="text-text-primary"
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Patients Table */}
            {/* Desktop Table */}
            {isLgUp && (
              <div className="w-full">
                <div className="overflow-x-auto w-full border border-border-color rounded-md">
                  <table className="table-fixed w-full min-w-[800px] divide-y divide-border-color">
                    <thead className="bg-card-bg">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium text-text-muted uppercase">
                          Patient
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-text-muted uppercase">
                          Age/Gender
                        </th>
                         <th className="px-2 py-2 text-left text-xs font-medium text-text-muted uppercase">
                          Blood Type
                        </th>
                         <th className="px-2 py-2 text-left text-xs font-medium text-text-muted uppercase w-52">
                           Test Types
                         </th>
                         <th className="px-2 py-2 text-left text-xs font-medium text-text-muted uppercase w-32">
                          Date
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-text-muted uppercase">
                          Status
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-text-muted uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-background divide-y divide-border-color">
                      {paginatedPatients.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-8 text-center text-sm text-text-secondary"
                          >
                            No patients found. Adjust filters or add a new
                            patient.
                          </td>
                        </tr>
                      ) : (
                        paginatedPatients.map((patient) => (
                          <tr key={patient._id} className="hover:bg-card-bg">
                            <td className="px-2 py-1 whitespace-nowrap text-sm text-text-primary">
                              <div className="leading-tight">
                                <div className="text-text-primary font-medium">
                                  {`${patient.firstName} ${patient.lastName}`}
                                </div>
                                <div className="text-xs text-text-secondary">
                                  {patient.patientId}
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap text-sm text-text-primary">
                              <span>{patient.age || "-"}</span>
                              <span className="mx-1 text-text-secondary">
                                /
                              </span>
                              <span className="text-text-secondary">
                                {toShortGender(patient.gender)}
                              </span>
                            </td>

                             <td className="px-2 py-1 whitespace-nowrap text-sm text-text-primary">
                              {patient.bloodType || "-"}
                            </td>
                             <td className="px-2 py-1 text-sm text-text-primary w-52 align-top">
                               {(() => {
                                 const t = patientLatestTests[patient.patientId];
                                 if (!t) return <span className="text-text-secondary">-</span>;
                                 const label = LAB_TEST_LABELS[t.testType as keyof typeof LAB_TEST_LABELS] || t.testType;
                                 const extra = t.additionalTestTypes?.length || 0;
                                 return (
                                   <div className="relative w-full" data-pt-test-types>
                                      <button
                                       type="button"
                                       data-pt-test-types
                                        onClick={(e) => {
                                          setOpenTestTypesFor(prev => prev === patient.patientId ? null : patient.patientId);
                                          const winH = typeof window !== 'undefined' ? window.innerHeight : 0;
                                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                          const spaceBelow = winH - rect.bottom;
                                          const spaceAbove = rect.top;
                                          const shouldDropUp = spaceBelow < 260 || rect.top > (winH / 2 && spaceAbove > spaceBelow);
                                          setDropUpFor(shouldDropUp ? patient.patientId : null);
                                        }}
                                        className="flex items-center space-x-2 text-left hover:bg-accent-color/10 px-2 py-1 rounded-md transition-colors truncate border border-transparent focus:border-accent-color w-full overflow-hidden"
                                     >
                                       <span className="font-medium">{label}</span>
                                        {extra > 0 && (
                                          <span className="bg-accent-color text-white text-xs px-2 py-0.5 rounded-full shrink-0">+{extra}</span>
                                       )}
                                        <svg className="w-4 h-4 ml-1 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                       </svg>
                                     </button>
                                      {openTestTypesFor === patient.patientId && (
                                       <div
                                         data-pt-test-types
                                          className={`absolute ${dropUpFor === patient.patientId ? 'bottom-full mb-1' : 'top-full mt-1'} left-0 z-50 bg-card-bg border border-border-color rounded-md shadow-lg min-w-[200px] max-w-[300px] max-h-64 overflow-y-auto`}
                                       >
                                         <div className="p-3 border-b border-border-color">
                                           <h4 className="text-sm font-medium text-text-primary mb-2">All Test Types</h4>
                                           <div className="space-y-1">
                                             <div className="flex items-center space-x-2">
                                               <span className="w-2 h-2 bg-accent-color rounded-full"></span>
                                               <span className="text-sm text-text-primary font-medium">{label}</span>
                                               <span className="text-xs text-text-muted">(Primary)</span>
                                             </div>
                                             {t.additionalTestTypes && t.additionalTestTypes.map((tt, idx) => (
                                               <div key={idx} className="flex items-center space-x-2">
                                                 <span className="w-2 h-2 bg-text-muted rounded-full"></span>
                                                 <span className="text-sm text-text-primary">{LAB_TEST_LABELS[tt as keyof typeof LAB_TEST_LABELS] || tt}</span>
                                               </div>
                                             ))}
                                           </div>
                                         </div>
                                       </div>
                                     )}
                                   </div>
                                 );
                               })()}
                             </td>
                            <td className="px-2 py-1 whitespace-nowrap text-sm text-text-secondary">
                              {formatDate(patient.createdAt)}
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                  patient.isActive ? "active" : "inactive"
                                )}`}
                              >
                                {patient.isActive ? "ACTIVE" : "INACTIVE"}
                              </span>
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleViewPatient(patient)}
                                className="text-accent-color hover:text-accent-hover mr-2 p-1 rounded hover:bg-accent-color/10 transition-colors cursor-pointer"
                                title="View Patient"
                              >
                                <FaEye size={16} />
                              </button>
                              <button
                                onClick={() => handleEditPatient(patient)}
                                className="text-success hover:text-success/80 mr-2 p-1 rounded hover:bg-success/10 transition-colors cursor-pointer"
                                title="Edit Patient"
                              >
                                <FaEdit size={16} />
                              </button>
                            {(userRole === "NURSE" || userRole === "SUPER_ADMIN") && (
                              <>
                                <button
                                  onClick={() => openLabRequestFor(patient)}
                                  className="text-blue-600 hover:text-blue-400 mr-2 p-1 rounded hover:bg-blue-900/20 transition-colors cursor-pointer"
                                  title="Request Lab Test"
                                >
                                  🧪
                                </button>
                                <button
                                  onClick={() => openEditLabRequestFor(patient)}
                                  className="text-blue-500 hover:text-blue-300 mr-2 p-1 rounded hover:bg-blue-900/20 transition-colors cursor-pointer"
                                  title="Edit Lab Test Request"
                                >
                                  ✏️
                                </button>
                              </>
                            )}
                              <button
                                onClick={() => handleDeletePatient(patient._id)}
                                className="text-error hover:text-error/80 p-1 rounded hover:bg-error/10 transition-colors cursor-pointer"
                                title="Delete Patient"
                              >
                                <FaTrash size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Mobile/Tablet Cards */}
            {!isLgUp && (
              <div className="space-y-4 w-full">
                {paginatedPatients.map((patient) => (
                  <div
                    key={patient._id}
                    className="bg-background border border-border-color rounded-lg p-4 space-y-3 overflow-hidden"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-text-primary">
                          {patient.patientId}
                        </h3>
                        <p className="text-sm text-text-secondary">{`${patient.firstName} ${patient.lastName}`}</p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          patient.isActive ? "active" : "inactive"
                        )}`}
                      >
                        {patient.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm min-w-0">
                      <div>
                        <span className="text-text-muted">Age:</span>
                        <span className="ml-1 text-text-primary break-words">
                          {patient.age || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted">Gender:</span>
                        <span className="ml-1 text-text-primary break-words">
                          {toShortGender(patient.gender)}
                        </span>
                      </div>
                       <div>
                        <span className="text-text-muted">Blood Type:</span>
                        <span className="ml-1 text-text-primary break-words">
                          {patient.bloodType || "-"}
                        </span>
                      </div>
                       <div data-pt-test-types className="relative">
                         <span className="text-text-muted">Test Types:</span>
                         {(() => {
                           const t = patientLatestTests[patient.patientId];
                           if (!t) return <span className="ml-1 text-text-secondary">-</span>;
                           const label = LAB_TEST_LABELS[t.testType as keyof typeof LAB_TEST_LABELS] || t.testType;
                           const extra = t.additionalTestTypes?.length || 0;
                           return (
                             <>
                               <button
                                 type="button"
                                 data-pt-test-types
                                  onClick={(e) => {
                                    setOpenTestTypesFor(prev => prev === patient.patientId ? null : patient.patientId);
                                    const winH = typeof window !== 'undefined' ? window.innerHeight : 0;
                                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                    const spaceBelow = winH - rect.bottom;
                                    const spaceAbove = rect.top;
                                    const shouldDropUp = spaceBelow < 260 || (rect.top > winH / 2 && spaceAbove > spaceBelow);
                                    setDropUpFor(shouldDropUp ? patient.patientId : null);
                                  }}
                                 className="ml-2 inline-flex items-center gap-2 text-left hover:bg-accent-color/10 px-2 py-1 rounded-md transition-colors whitespace-nowrap"
                               >
                                 <span className="text-text-primary">{label}</span>
                                 {extra > 0 && (
                                   <span className="bg-accent-color text-white text-xs px-2 py-0.5 rounded-full">+{extra}</span>
                                 )}
                                 <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                 </svg>
                               </button>
                                {openTestTypesFor === patient.patientId && (
                                 <div
                                   data-pt-test-types
                                    className={`absolute ${dropUpFor === patient.patientId ? 'bottom-full mb-1' : 'top-full mt-1'} left-0 z-50 bg-card-bg border border-border-color rounded-md shadow-lg min-w-[200px] max-w-[300px] max-h-64 overflow-y-auto`}
                                 >
                                   <div className="p-3 border-b border-border-color">
                                     <h4 className="text-sm font-medium text-text-primary mb-2">All Test Types</h4>
                                     <div className="space-y-1">
                                       <div className="flex items-center space-x-2">
                                         <span className="w-2 h-2 bg-accent-color rounded-full"></span>
                                         <span className="text-sm text-text-primary font-medium">{label}</span>
                                         <span className="text-xs text-text-muted">(Primary)</span>
                                       </div>
                                       {t.additionalTestTypes && t.additionalTestTypes.map((tt, idx) => (
                                         <div key={idx} className="flex items-center space-x-2">
                                           <span className="w-2 h-2 bg-text-muted rounded-full"></span>
                                           <span className="text-sm text-text-primary">{LAB_TEST_LABELS[tt as keyof typeof LAB_TEST_LABELS] || tt}</span>
                                         </div>
                                       ))}
                                     </div>
                                   </div>
                                 </div>
                               )}
                             </>
                           );
                         })()}
                       </div>
                      <div>
                        <span className="text-text-muted">Date:</span>
                        <span className="ml-1 text-text-primary break-words">
                          {formatDate(patient.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm">
                      <div className="text-text-muted">Contact:</div>
                      <div className="text-text-primary break-words">
                        {patient.phone}
                      </div>
                      <div className="text-text-secondary break-words">
                        {patient.email}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        onClick={() => handleViewPatient(patient)}
                        className="text-accent-color hover:text-accent-hover p-2 rounded hover:bg-accent-color/10 transition-colors"
                        title="View Patient"
                      >
                        <FaEye size={16} />
                      </button>
                      <button
                        onClick={() => handleEditPatient(patient)}
                        className="text-success hover:text-success/80 p-2 rounded hover:bg-success/10 transition-colors"
                        title="Edit Patient"
                      >
                        <FaEdit size={16} />
                      </button>
                       {(userRole === "NURSE" || userRole === "SUPER_ADMIN") && (
                         <>
                           <button
                             onClick={() => openLabRequestFor(patient)}
                             className="text-blue-600 hover:text-blue-400 p-2 rounded hover:bg-blue-900/20 transition-colors"
                             title="Request Lab Test"
                           >
                             🧪
                           </button>
                           <button
                             onClick={() => openEditLabRequestFor(patient)}
                             className="text-blue-500 hover:text-blue-300 p-2 rounded hover:bg-blue-900/20 transition-colors"
                             title="Edit Lab Test Request"
                           >
                             ✏️
                           </button>
                         </>
                       )}
                       <button
                         onClick={() => handleDeletePatient(patient._id)}
                         className="text-error hover:text-error/80 p-2 rounded hover:bg-error/10 transition-colors"
                         title="Delete Patient"
                       >
                         <FaTrash size={16} />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <PaginationControls
              page={page}
              total={totalFiltered}
              pageSize={pageSize}
              onPageChange={setPage}
            />
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
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter patient's full name"
                />
              </FormField>

              <FormField label="Age" required error={errors.age}>
                <Input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  placeholder="Enter age"
                  min="1"
                  max="120"
                />
              </FormField>

              <FormField label="Gender" required error={errors.gender}>
                <Select
                  value={formData.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  options={GENDER_OPTIONS}
                />
              </FormField>

              <FormField label="Phone Number" error={errors.phone}>
                <div className="flex">
                  <CountryCodeSelector
                    value={formData.selectedCountry}
                    onChange={(country) => {
                      setFormData((prev) => ({
                        ...prev,
                        selectedCountry: country,
                      }));
                      // Auto-fill country code if phone field is empty or starts with old country code
                      const currentPhone = formData.phone || "";
                      const oldCountryCode = formData.selectedCountry.dialCode;
                      if (
                        !currentPhone ||
                        currentPhone.startsWith(oldCountryCode)
                      ) {
                        const newPhone = currentPhone
                          .replace(oldCountryCode, "")
                          .trim();
                        handleInputChange(
                          "phone",
                          country.dialCode + " " + newPhone
                        );
                      }
                    }}
                    className="w-16"
                  />
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Enter phone number (optional)"
                    className="rounded-l-none flex-1"
                  />
                </div>
              </FormField>

              <FormField label="Email" error={errors.email}>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter email address (optional)"
                />
              </FormField>

              <FormField label="Blood Type" error={errors.bloodType}>
                <Select
                  value={formData.bloodType}
                  onChange={(e) =>
                    handleInputChange("bloodType", e.target.value)
                  }
                  options={BLOOD_TYPE_OPTIONS}
                />
              </FormField>

              <FormField label="Status" error={errors.status}>
                <Select
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  options={PATIENT_STATUS_OPTIONS}
                />
              </FormField>
            </div>

            <FormField label="Address" required error={errors.address}>
              <TextArea
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter patient's address"
                rows={2}
              />
            </FormField>

            <FormField
              label="Current Illness/Symptoms"
              required
              error={errors.notes}
            >
              <TextArea
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Describe patient's current illness, symptoms, or complaints"
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
                className="hover:bg-gray-700 cursor-pointer bg-[#1447E6]"
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
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter patient's full name"
                />
              </FormField>

              <FormField label="Age" required error={errors.age}>
                <Input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  placeholder="Enter age"
                  min="1"
                  max="120"
                />
              </FormField>

              <FormField label="Gender" required error={errors.gender}>
                <Select
                  value={formData.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  options={GENDER_OPTIONS}
                />
              </FormField>

              <FormField label="Phone Number" error={errors.phone}>
                <div className="flex">
                  <CountryCodeSelector
                    value={formData.selectedCountry}
                    onChange={(country) => {
                      setFormData((prev) => ({
                        ...prev,
                        selectedCountry: country,
                      }));
                      // Auto-fill country code if phone field is empty or starts with old country code
                      const currentPhone = formData.phone || "";
                      const oldCountryCode = formData.selectedCountry.dialCode;
                      if (
                        !currentPhone ||
                        currentPhone.startsWith(oldCountryCode)
                      ) {
                        const newPhone = currentPhone
                          .replace(oldCountryCode, "")
                          .trim();
                        handleInputChange(
                          "phone",
                          country.dialCode + " " + newPhone
                        );
                      }
                    }}
                    className="w-16"
                  />
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Enter phone number (optional)"
                    className="rounded-l-none flex-1"
                  />
                </div>
              </FormField>

              <FormField label="Email" error={errors.email}>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter email address (optional)"
                />
              </FormField>

              <FormField label="Blood Type" error={errors.bloodType}>
                <Select
                  value={formData.bloodType}
                  onChange={(e) =>
                    handleInputChange("bloodType", e.target.value)
                  }
                  options={BLOOD_TYPE_OPTIONS}
                />
              </FormField>

              <FormField label="Status" error={errors.status}>
                <Select
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  options={PATIENT_STATUS_OPTIONS}
                />
              </FormField>
            </div>

            <FormField label="Address" required error={errors.address}>
              <TextArea
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter patient's address"
                rows={2}
              />
            </FormField>

            <FormField
              label="Current Illness/Symptoms"
              required
              error={errors.notes}
            >
              <TextArea
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Describe patient's current illness, symptoms, or complaints"
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
              <Button
                className="hover:bg-gray-700 cursor-pointer bg-[#1447E6]"
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
                  <label className="block text-sm font-medium text-text-muted">
                    Patient ID
                  </label>
                  <p className="mt-1 text-sm text-text-primary">
                    {viewingPatient.patientId}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Full Name
                  </label>
                  <p className="mt-1 text-sm text-text-primary">{`${viewingPatient.firstName} ${viewingPatient.lastName}`}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Age
                  </label>
                  <p className="mt-1 text-sm text-text-primary">
                    {viewingPatient.age
                      ? `${viewingPatient.age} years`
                      : "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Gender
                  </label>
                  <p className="mt-1 text-sm text-text-primary">
                    {toShortGender(viewingPatient.gender)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Phone
                  </label>
                  <p className="mt-1 text-sm text-text-primary">
                    {viewingPatient.phone}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Email
                  </label>
                  <p className="mt-1 text-sm text-text-primary">
                    {viewingPatient.email}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Blood Type
                  </label>
                  <p className="mt-1 text-sm text-text-primary">
                    {viewingPatient.bloodType || "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Status
                  </label>
                  <span
                    className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      viewingPatient.isActive ? "active" : "inactive"
                    )}`}
                  >
                    {viewingPatient.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Date
                  </label>
                  <p className="mt-1 text-sm text-text-primary">
                    {formatDate(viewingPatient.createdAt)}
                  </p>
                </div>
              </div>
              {viewingPatient.address && (
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Address
                  </label>
                  <p className="mt-1 text-sm text-text-primary">
                    {viewingPatient.address}
                  </p>
                </div>
              )}
              {viewingPatient.medicalHistory && (
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Notes
                  </label>
                  <p className="mt-1 text-sm text-text-primary">
                    {viewingPatient.medicalHistory}
                  </p>
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
      {/* Request Lab Test Modal */}
        <Modal
        isOpen={isLabModalOpen}
          onClose={() => { setIsLabModalOpen(false); setLabEditingId(null); }}
          title={labEditingId ? "Edit Lab Test Request" : "Request New Lab Test"}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Patient" required>
              <Input value={`${labPatientName} (${labPatientId})`} disabled />
            </FormField>
            <FormField label="Test Type" required>
              <select
                value={labTestType}
                onChange={(e) => setLabTestType(e.target.value)}
                className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background"
              >
                {Object.values(LAB_TEST_TYPES).map((t) => (
                  <option key={t} value={t}>{LAB_TEST_LABELS[t as keyof typeof LAB_TEST_LABELS]}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Test Name (optional)">
              <Input value={labTestName} onChange={(e)=>setLabTestName(e.target.value)} placeholder="Enter test name" />
            </FormField>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Additional Test Types (optional)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {Object.values(LAB_TEST_TYPES).map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={labAdditionalTests.includes(t)}
                    onChange={(e)=>{
                      if (e.target.checked) setLabAdditionalTests((prev)=>[...prev, t]);
                      else setLabAdditionalTests((prev)=>prev.filter((x)=>x!==t));
                    }}
                    className="rounded border-border-color"
                  />
                  <span>{LAB_TEST_LABELS[t as keyof typeof LAB_TEST_LABELS]}</span>
                </label>
              ))}
            </div>
          </div>
          <FormField label="Lab Test Description" required>
            <TextArea value={labNotes} onChange={(e)=>setLabNotes(e.target.value)} rows={4} placeholder="Describe the lab test requirements, symptoms, or specific conditions..." />
          </FormField>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={()=>{ setIsLabModalOpen(false); setLabEditingId(null); }}>Cancel</Button>
            <Button
              className="hover:bg-gray-700 cursor-pointer bg-[#1447E6]"
              onClick={handleSubmitLabRequest}
            >
              {labEditingId ? 'Update Request' : 'Request Test'}
            </Button>
          </div>
        </div>
      </Modal>
      {/* <Footer /> */}
    </>
  );
}
