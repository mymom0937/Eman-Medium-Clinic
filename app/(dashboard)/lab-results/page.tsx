"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { FormField, Input, Select, TextArea } from "@/components/ui/form";
import { LabResult, LabTestResult } from "@/types/lab-result";
import {
  LAB_TEST_TYPES,
  LAB_TEST_LABELS,
  LAB_TEST_STATUS_LABELS,
} from "@/constants/lab-test-types";
import { USER_ROLES } from "@/constants/user-roles";
import { useUserRole } from "@/hooks/useUserRole";
import { PageLoader } from "@/components/common/loading-spinner";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { PaginationControls } from "@/components/ui/pagination";
import { toastManager } from "@/lib/utils/toast";

const TEST_STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const TEST_TYPE_OPTIONS = [
  { value: "all", label: "All Test Types" },
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
  selectedTestTypes: string[];
}

export default function LabResultsPage() {
  const { userId } = useAuth();
  const { userRole, userName, isLoaded } = useUserRole();
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTestType, setSelectedTestType] = useState("all");
  // Viewport-based rendering toggle (lg breakpoint: 1024px)
  const [isLgUp, setIsLgUp] = useState<boolean>(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingLabResult, setEditingLabResult] = useState<LabResult | null>(
    null
  );
  const [viewingLabResult, setViewingLabResult] = useState<LabResult | null>(
    null
  );
  const [formData, setFormData] = useState<LabResultFormData>({
    patientId: "",
    patientName: "",
    testType: "",
    testName: "",
    notes: "",
    selectedTestTypes: [],
  });
  // Support a custom (one-off) test type entry
  const [customTestType, setCustomTestType] = useState("");
  const CUSTOM_TEST_TYPE_VALUE = "CUSTOM_OTHER";
  const [errors, setErrors] = useState<Partial<LabResultFormData>>({});
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  // Patients list for dropdown selection
  const [patients, setPatients] = useState<any[]>([]);
  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 5; // Updated to show 5 lab results per page

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-test-types-dropdown]")) {
        setLabResults((prev) =>
          prev.map((r) => ({ ...r, showTestTypesDropdown: false }))
        );
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Setup viewport listener
  useEffect(() => {
    const compute = () => {
      if (typeof window === "undefined") return;
      setIsLgUp(window.innerWidth >= 1024);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  // Load lab results data on component mount
  useEffect(() => {
    const loadLabResults = async () => {
      if (!isLoaded) return;

      try {
        setInitialLoading(true);
        const [labRes, patientsRes] = await Promise.all([
          fetch("/api/lab-results"),
          // Request larger limit so we consistently have full patient list like Patients page
          fetch("/api/patients?limit=1000&page=1"),
        ]);
        const labData = await labRes.json();
        const patientsData = await patientsRes.json();
        if (labRes.ok) {
          setLabResults(labData);
        }
        if (patientsRes.ok && patientsData.success) {
          const sorted = [...(patientsData.data || [])].sort((a:any,b:any)=>
            (a.patientId||"").localeCompare(b.patientId||"")
          );
            setPatients(sorted);
        }
      } catch (error) {
        console.error("Error loading lab results:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadLabResults();
  }, [isLoaded]);

  // Filter lab results based on search and filters
  const filteredLabResults = labResults.filter((result) => {
    const matchesSearch =
      (result.labResultId?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      result.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (result.testName?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" || result.status === selectedStatus;
    const matchesTestType =
      selectedTestType === "all" || result.testType === selectedTestType;
    return matchesSearch && matchesStatus && matchesTestType;
  });

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedStatus, selectedTestType]);

  const totalFiltered = filteredLabResults.length;
  const paginatedLabResults = filteredLabResults.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-success/10 text-success";
      case "IN_PROGRESS":
        return "bg-warning/10 text-warning";
      case "PENDING":
        return "bg-info/10 text-info";
      case "CANCELLED":
        return "bg-error/10 text-error";
      default:
        return "bg-text-muted/10 text-text-muted";
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

  const validateForm = (): boolean => {
    const newErrors: Partial<LabResultFormData> = {};

    if (!formData.patientId.trim()) {
      newErrors.patientId = "Patient ID is required";
    }
    if (!formData.patientName.trim()) {
      newErrors.patientName = "Patient name is required";
    }
    if (!formData.testType) {
      newErrors.testType = "Test type is required";
    }
    if (
      formData.testType === CUSTOM_TEST_TYPE_VALUE &&
      !customTestType.trim()
    ) {
      newErrors.testType = "Custom test type name is required";
    }
    // Test Name is now optional
    // Notes is now required
    if (!formData.notes.trim()) {
      newErrors.notes = "Lab test description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddLabResult = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const labResultData = {
        patientId: formData.patientId,
        patientName: formData.patientName,
        testType: formData.testType,
        testName: formData.testName,
        selectedTestTypes: formData.selectedTestTypes,
        notes: formData.notes,
        customTestTypeLabel:
          formData.testType === CUSTOM_TEST_TYPE_VALUE
            ? customTestType.trim()
            : undefined,
      };

      const response = await fetch("/api/lab-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(labResultData),
      });

      if (!response.ok) {
        throw new Error("Failed to create lab result");
      }

      // Reload lab results data
      const resultsResponse = await fetch("/api/lab-results");
      const resultsResult = await resultsResponse.json();

      if (resultsResponse.ok) {
        setLabResults(resultsResult);
      }

      setIsAddModalOpen(false);
      resetForm();
      toastManager.success("Lab test request created successfully!");
    } catch (error) {
      console.error("Error creating lab result:", error);
      toastManager.error(
        "Failed to create lab test request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditLabResult = (labResult: LabResult) => {
    setEditingLabResult(labResult);
    setFormData({
      patientId: labResult.patientId,
      patientName: labResult.patientName,
      testType:
        labResult.testType === CUSTOM_TEST_TYPE_VALUE
          ? CUSTOM_TEST_TYPE_VALUE
          : labResult.testType,
      testName: labResult.testName || "",
      notes: labResult.notes || "",
      selectedTestTypes: labResult.additionalTestTypes || [],
    });
    if (
      (labResult as any).customTestTypeLabel &&
      labResult.testType === CUSTOM_TEST_TYPE_VALUE
    ) {
      setCustomTestType((labResult as any).customTestTypeLabel);
    } else {
      setCustomTestType("");
    }
    setIsEditModalOpen(true);
  };

  const handleUpdateLabResult = async () => {
    if (!validateForm() || !editingLabResult) return;

    setLoading(true);
    try {
      const labResultData = {
        patientId: formData.patientId,
        patientName: formData.patientName,
        testType: formData.testType,
        testName: formData.testName,
        selectedTestTypes: formData.selectedTestTypes,
        notes: formData.notes,
        customTestTypeLabel:
          formData.testType === CUSTOM_TEST_TYPE_VALUE
            ? customTestType.trim()
            : undefined,
      };

      const response = await fetch(`/api/lab-results/${editingLabResult._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(labResultData),
      });

      if (!response.ok) {
        throw new Error("Failed to update lab result");
      }

      // Reload lab results data
      const resultsResponse = await fetch("/api/lab-results");
      const resultsResult = await resultsResponse.json();

      if (resultsResponse.ok) {
        setLabResults(resultsResult);
      }

      setIsEditModalOpen(false);
      setEditingLabResult(null);
      resetForm();
      toastManager.success("Lab result updated successfully!");
    } catch (error) {
      console.error("Error updating lab result:", error);
      toastManager.error("Failed to update lab result. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLabResult = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lab result?")) return;

    try {
      const response = await fetch(`/api/lab-results/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete lab result");
      }

      // Reload lab results data
      const resultsResponse = await fetch("/api/lab-results");
      const resultsResult = await resultsResponse.json();

      if (resultsResponse.ok) {
        setLabResults(resultsResult);
      }
      toastManager.success("Lab result deleted successfully!");
    } catch (error) {
      console.error("Error deleting lab result:", error);
      toastManager.error("Failed to delete lab result. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: "",
      patientName: "",
      testType: "",
      testName: "",
      notes: "",
      selectedTestTypes: [],
    });
    setCustomTestType("");
    setErrors({});
  };

  const handleInputChange = (field: keyof LabResultFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
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

  const handleStatusUpdate = async (labResultId: string, newStatus: string) => {
    if (!canUpdateStatus({} as LabResult)) return;

    setStatusUpdating(labResultId);
    try {
      const response = await fetch(`/api/lab-results/${labResultId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Reload lab results data
      const labResultsResponse = await fetch("/api/lab-results");
      const labResultsResult = await labResultsResponse.json();

      if (labResultsResponse.ok) {
        setLabResults(labResultsResult);
      }

      toastManager.success("Status updated successfully");
    } catch (error) {
      console.error("Error updating status:", error);
      toastManager.error("Failed to update status");
    } finally {
      setStatusUpdating(null);
    }
  };

  if (!isLoaded || initialLoading) {
    return (
      <DashboardLayout
        title="Lab Results"
        userRole={userRole}
        userName={userName}
      >
        <div className="flex items-center justify-center h-[60vh]">
          <PageLoader text="Loading lab results..." />
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout
        title="Lab Results"
        userRole={userRole}
        userName={userName}
      >
        <div className="flex items-center justify-center h-[60vh]">
          <PageLoader text="Loading lab results..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <DashboardLayout
        title="Lab Results"
        userRole={userRole}
        userName={userName}
      >
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-text-primary">
              Lab Results
            </h1>
            {(userRole === USER_ROLES.NURSE ||
              userRole === USER_ROLES.SUPER_ADMIN) && (
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="cursor-pointer bg-[#1447E6]  hover:bg-gray-700"
              >
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
                    {labResults.filter((r) => r.status === "PENDING").length}
                  </div>
                  <div className="text-sm text-text-secondary">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-info">
                    {
                      labResults.filter((r) => r.status === "IN_PROGRESS")
                        .length
                    }
                  </div>
                  <div className="text-sm text-text-secondary">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">
                    {labResults.filter((r) => r.status === "COMPLETED").length}
                  </div>
                  <div className="text-sm text-text-secondary">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-error">
                    {labResults.filter((r) => r.status === "CANCELLED").length}
                  </div>
                  <div className="text-sm text-text-secondary">Cancelled</div>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Search by lab result ID, patient ID, name, or test name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary placeholder-text-muted bg-background text-sm"
                />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background text-sm"
                >
                  {TEST_STATUS_OPTIONS.map((option) => (
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
                  {TEST_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {isLgUp ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lab Result ID</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Test Types</TableHead>
                      <TableHead>Test Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLabResults.map((result) => (
                      <TableRow key={result._id}>
                        <TableCell>
                          <div className="font-medium text-text-primary">
                            {result.labResultId || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-text-primary">
                              {result.patientName}
                            </div>
                            <div className="text-sm text-text-secondary">
                              {result.patientId}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-text-primary">
                          <div className="relative">
                            <button
                              type="button"
                              data-test-types-dropdown
                              onClick={() => {
                                // Toggle dropdown for this specific result
                                setLabResults((prev) =>
                                  prev.map((r) =>
                                    r._id === result._id
                                      ? {
                                          ...r,
                                          showTestTypesDropdown:
                                            !r.showTestTypesDropdown,
                                        }
                                      : { ...r, showTestTypesDropdown: false }
                                  )
                                );
                              }}
                              className="flex items-center space-x-2 text-left hover:bg-accent-color/10 px-2 py-1 rounded-md transition-colors"
                            >
                              <span className="font-medium">
                                {result.testType === CUSTOM_TEST_TYPE_VALUE &&
                                (result as any).customTestTypeLabel
                                  ? (result as any).customTestTypeLabel
                                  : LAB_TEST_LABELS[
                                      result.testType as keyof typeof LAB_TEST_LABELS
                                    ] ||
                                    (result as any).customTestTypeLabel ||
                                    result.testType}
                              </span>
                              {result.additionalTestTypes &&
                                result.additionalTestTypes.length > 0 && (
                                  <span className="bg-accent-color text-white text-xs px-2 py-0.5 rounded-full">
                                    +{result.additionalTestTypes.length}
                                  </span>
                                )}
                              <svg
                                className="w-4 h-4 ml-1 transition-transform"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </button>
                            {/* Dropdown for test types */}
                            {result.showTestTypesDropdown && (
                              <div
                                data-test-types-dropdown
                                className="absolute top-full left-0 z-50 mt-1 bg-card-bg border border-border-color rounded-md shadow-lg min-w-[200px] max-w-[300px]"
                              >
                                <div className="p-3 border-b border-border-color">
                                  <h4 className="text-sm font-medium text-text-primary mb-2">
                                    All Test Types
                                  </h4>
                                  <div className="space-y-1">
                                    {/* Primary test type */}
                                    <div className="flex items-center space-x-2">
                                      <span className="w-2 h-2 bg-accent-color rounded-full"></span>
                                      <span className="text-sm text-text-primary font-medium">
                                        {result.testType ===
                                          CUSTOM_TEST_TYPE_VALUE &&
                                        (result as any).customTestTypeLabel
                                          ? (result as any).customTestTypeLabel
                                          : LAB_TEST_LABELS[
                                              result.testType as keyof typeof LAB_TEST_LABELS
                                            ] ||
                                            (result as any)
                                              .customTestTypeLabel ||
                                            result.testType}
                                      </span>
                                      <span className="text-xs text-text-muted">
                                        (Primary)
                                      </span>
                                    </div>
                                    {/* Additional test types */}
                                    {result.additionalTestTypes &&
                                      result.additionalTestTypes.map(
                                        (testType, index) => (
                                          <div
                                            key={index}
                                            className="flex items-center space-x-2"
                                          >
                                            <span className="w-2 h-2 bg-text-muted rounded-full"></span>
                                            <span className="text-sm text-text-primary">
                                              {
                                                LAB_TEST_LABELS[
                                                  testType as keyof typeof LAB_TEST_TYPES
                                                ]
                                              }
                                            </span>
                                          </div>
                                        )
                                      )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-text-primary">
                          {result.testName || "N/A"}
                        </TableCell>
                        <TableCell>
                          {canUpdateStatus(result) ? (
                            <div className="relative">
                              <Select
                                value={result.status}
                                onChange={(e) =>
                                  handleStatusUpdate(result._id, e.target.value)
                                }
                                disabled={statusUpdating === result._id}
                                options={[
                                  { value: "PENDING", label: "Pending" },
                                  {
                                    value: "IN_PROGRESS",
                                    label: "In Progress",
                                  },
                                  { value: "COMPLETED", label: "Completed" },
                                  { value: "CANCELLED", label: "Cancelled" },
                                ]}
                                className="w-32 text-sm"
                              />
                              {statusUpdating === result._id && (
                                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                result.status
                              )}`}
                            >
                              {LAB_TEST_STATUS_LABELS[result.status]}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {formatDate(result.requestedAt)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs sm:text-sm font-medium">
                          <button
                            onClick={() => handleViewLabResult(result)}
                            className="text-accent-color hover:text-accent-hover mr-3 p-1 rounded hover:bg-accent-color/10 transition-colors cursor-pointer"
                            title="View Lab Result"
                          >
                            <FaEye size={16} />
                          </button>
                          {(userRole === USER_ROLES.NURSE ||
                            userRole === USER_ROLES.SUPER_ADMIN) && (
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
              ) : (
                <div className="space-y-3">
                  {paginatedLabResults.length === 0 && (
                    <div className="text-center py-8 text-text-secondary">
                      No lab results found.
                    </div>
                  )}
                  {paginatedLabResults.map((result) => (
                    <div
                      key={result._id}
                      className="border border-border-color rounded-lg p-3 bg-card-bg overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-text-primary break-words">
                            {result.labResultId || "N/A"}
                          </div>
                          <div className="text-sm text-text-secondary break-words">
                            Requested: {formatDate(result.requestedAt)}
                          </div>
                        </div>
                        <div className="shrink-0">
                          {canUpdateStatus(result) ? (
                            <Select
                              value={result.status}
                              onChange={(e) =>
                                handleStatusUpdate(result._id, e.target.value)
                              }
                              disabled={statusUpdating === result._id}
                              options={[
                                { value: "PENDING", label: "Pending" },
                                { value: "IN_PROGRESS", label: "In Progress" },
                                { value: "COMPLETED", label: "Completed" },
                                { value: "CANCELLED", label: "Cancelled" },
                              ]}
                              className="w-32 text-xs"
                            />
                          ) : (
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                result.status
                              )}`}
                            >
                              {LAB_TEST_STATUS_LABELS[result.status]}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
                        <div className="min-w-0">
                          <div className="text-xs text-text-muted">Patient</div>
                          <div className="text-sm text-text-primary break-words">
                            {result.patientName}
                          </div>
                          <div className="text-xs text-text-secondary break-words">
                            {result.patientId}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-text-muted">
                            Test Types
                          </div>
                          <div className="text-sm text-text-primary break-words">
                            {result.testType === CUSTOM_TEST_TYPE_VALUE &&
                            (result as any).customTestTypeLabel
                              ? (result as any).customTestTypeLabel
                              : LAB_TEST_LABELS[
                                  result.testType as keyof typeof LAB_TEST_LABELS
                                ] ||
                                (result as any).customTestTypeLabel ||
                                result.testType}
                            {result.additionalTestTypes &&
                            result.additionalTestTypes.length > 0
                              ? ` (+${result.additionalTestTypes.length})`
                              : ""}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-text-muted">
                            Test Name
                          </div>
                          <div className="text-sm text-text-primary break-words">
                            {result.testName || "N/A"}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          onClick={() => handleViewLabResult(result)}
                          className="text-accent-color hover:text-accent-hover p-1 rounded hover:bg-accent-color/10 transition-colors cursor-pointer"
                          title="View Lab Result"
                        >
                          <FaEye size={16} />
                        </button>
                        {(userRole === USER_ROLES.NURSE ||
                          userRole === USER_ROLES.SUPER_ADMIN) && (
                          <button
                            onClick={() => handleEditLabResult(result)}
                            className="text-success hover:text-success/80 p-1 rounded hover:bg-success/10 transition-colors cursor-pointer"
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
              <FormField
                label="Patient"
                required
                error={errors.patientId || errors.patientName}
              >
                <Select
                  value={formData.patientId}
                  onChange={(e) => {
                    const selected = patients.find(
                      (p: any) => p.patientId === e.target.value
                    );
                    handleInputChange("patientId", e.target.value);
                    handleInputChange(
                      "patientName",
                      selected
                        ? `${selected.firstName} ${selected.lastName}`
                        : ""
                    );
                  }}
                  options={[
                    { value: "", label: "Select Patient" },
                    ...patients.map((p: any) => ({
                      value: p.patientId,
                      label: `${p.firstName} ${p.lastName} (${p.patientId})`,
                    })),
                  ]}
                />
              </FormField>

              <FormField label="Test Type" required error={errors.testType}>
                <div className="space-y-2">
                  <Select
                    value={formData.testType}
                    onChange={(e) => {
                      handleInputChange("testType", e.target.value);
                      if (e.target.value !== CUSTOM_TEST_TYPE_VALUE) {
                        setCustomTestType("");
                      }
                    }}
                    options={[
                      ...Object.entries(LAB_TEST_TYPES).map(([key, value]) => ({
                        value,
                        label: LAB_TEST_LABELS[value],
                      })),
                      {
                        value: CUSTOM_TEST_TYPE_VALUE,
                        label: "Other (Add New)",
                      },
                    ]}
                  />
                  {formData.testType === CUSTOM_TEST_TYPE_VALUE && (
                    <Input
                      value={customTestType}
                      onChange={(e) => setCustomTestType(e.target.value)}
                      placeholder="Enter custom test type name"
                    />
                  )}
                </div>
              </FormField>

              <FormField label="Additional Test Types (Optional)">
                <div className="space-y-2">
                  <div className="text-sm text-text-muted mb-2">
                    Select additional tests if patient needs multiple tests
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {Object.entries(LAB_TEST_TYPES).map(([key, value]) => (
                      <label
                        key={value}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedTestTypes.includes(value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData((prev) => ({
                                ...prev,
                                selectedTestTypes: [
                                  ...prev.selectedTestTypes,
                                  value,
                                ],
                              }));
                            } else {
                              setFormData((prev) => ({
                                ...prev,
                                selectedTestTypes:
                                  prev.selectedTestTypes.filter(
                                    (t) => t !== value
                                  ),
                              }));
                            }
                          }}
                          className="rounded border-border-color text-accent-color focus:ring-accent-color"
                        />
                        <span className="text-sm text-text-primary">
                          {LAB_TEST_LABELS[value]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </FormField>

              <FormField label="Test Name" error={errors.testName}>
                <Input
                  value={formData.testName}
                  onChange={(e) =>
                    handleInputChange("testName", e.target.value)
                  }
                  placeholder="Enter test name (optional)"
                />
              </FormField>
            </div>

            <FormField
              label="Lab Test Description"
              required
              error={errors.notes}
            >
              <TextArea
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Describe the lab test requirements, symptoms, or specific conditions to be tested..."
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
                className="hover:bg-gray-700 cursor-pointer bg-[#1447E6]"
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
              <FormField
                label="Patient"
                required
                error={errors.patientId || errors.patientName}
              >
                <Select
                  value={formData.patientId}
                  onChange={(e) => {
                    const selected = patients.find(
                      (p: any) => p.patientId === e.target.value
                    );
                    handleInputChange("patientId", e.target.value);
                    handleInputChange(
                      "patientName",
                      selected
                        ? `${selected.firstName} ${selected.lastName}`
                        : ""
                    );
                  }}
                  options={[
                    { value: "", label: "Select Patient" },
                    ...patients.map((p: any) => ({
                      value: p.patientId,
                      label: `${p.firstName} ${p.lastName} (${p.patientId})`,
                    })),
                  ]}
                />
              </FormField>

              <FormField label="Test Type" required error={errors.testType}>
                <div className="space-y-2">
                  <Select
                    value={formData.testType}
                    onChange={(e) => {
                      handleInputChange("testType", e.target.value);
                      if (e.target.value !== CUSTOM_TEST_TYPE_VALUE) {
                        setCustomTestType("");
                      }
                    }}
                    options={[
                      ...Object.entries(LAB_TEST_TYPES).map(([key, value]) => ({
                        value,
                        label: LAB_TEST_LABELS[value],
                      })),
                      {
                        value: CUSTOM_TEST_TYPE_VALUE,
                        label: "Other (Add New)",
                      },
                    ]}
                  />
                  {formData.testType === CUSTOM_TEST_TYPE_VALUE && (
                    <Input
                      value={customTestType}
                      onChange={(e) => setCustomTestType(e.target.value)}
                      placeholder="Enter custom test type name"
                    />
                  )}
                </div>
              </FormField>

              <FormField label="Additional Test Types (Optional)">
                <div className="space-y-2">
                  <div className="text-sm text-text-muted mb-2">
                    Select additional tests if patient needs multiple tests
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {Object.entries(LAB_TEST_TYPES).map(([key, value]) => (
                      <label
                        key={value}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedTestTypes.includes(value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData((prev) => ({
                                ...prev,
                                selectedTestTypes: [
                                  ...prev.selectedTestTypes,
                                  value,
                                ],
                              }));
                            } else {
                              setFormData((prev) => ({
                                ...prev,
                                selectedTestTypes:
                                  prev.selectedTestTypes.filter(
                                    (t) => t !== value
                                  ),
                              }));
                            }
                          }}
                          className="rounded border-border-color text-accent-color focus:ring-accent-color"
                        />
                        <span className="text-sm text-text-primary">
                          {LAB_TEST_LABELS[value]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </FormField>

              <FormField label="Test Name" error={errors.testName}>
                <Input
                  value={formData.testName}
                  onChange={(e) =>
                    handleInputChange("testName", e.target.value)
                  }
                  placeholder="Enter test name (optional)"
                />
              </FormField>

              {editingLabResult && canUpdateStatus(editingLabResult) && (
                <FormField label="Status">
                  <Select
                    value={editingLabResult.status}
                    onChange={(e) =>
                      handleStatusUpdate(editingLabResult._id, e.target.value)
                    }
                    disabled={statusUpdating === editingLabResult._id}
                    options={[
                      { value: "PENDING", label: "Pending" },
                      { value: "IN_PROGRESS", label: "In Progress" },
                      { value: "COMPLETED", label: "Completed" },
                      { value: "CANCELLED", label: "Cancelled" },
                    ]}
                    className="w-full"
                  />
                  {statusUpdating === editingLabResult._id && (
                    <div className="mt-1 text-sm text-blue-600">
                      Updating status...
                    </div>
                  )}
                </FormField>
              )}

              {editingLabResult && !canUpdateStatus(editingLabResult) && (
                <FormField label="Status">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        editingLabResult.status
                      )}`}
                    >
                      {LAB_TEST_STATUS_LABELS[editingLabResult.status]}
                    </span>
                    <span className="text-xs text-gray-500">
                      (Only Laboratorists and Super Admins can update status)
                    </span>
                  </div>
                </FormField>
              )}
            </div>

            <FormField
              label="Lab Test Description"
              required
              error={errors.notes}
            >
              <TextArea
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Describe the lab test requirements, symptoms, or specific conditions to be tested..."
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
                className="hover:bg-gray-700 cursor-pointer bg-[#1447E6]"
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
                  <label className="block text-sm font-medium text-text-primary">
                    Lab Result ID
                  </label>
                  <p className="mt-1 text-sm text-text-secondary">
                    {viewingLabResult.labResultId || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary">
                    Patient ID
                  </label>
                  <p className="mt-1 text-sm text-text-secondary">
                    {viewingLabResult.patientId}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary">
                    Patient Name
                  </label>
                  <p className="mt-1 text-sm text-text-secondary">
                    {viewingLabResult.patientName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary">
                    Test Types
                  </label>
                  <div className="mt-1 space-y-1">
                    {/* Primary test type */}
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-accent-color rounded-full"></span>
                      <span className="text-sm text-text-secondary font-medium">
                        {viewingLabResult.testType === CUSTOM_TEST_TYPE_VALUE &&
                        (viewingLabResult as any).customTestTypeLabel
                          ? (viewingLabResult as any).customTestTypeLabel
                          : LAB_TEST_LABELS[
                              viewingLabResult.testType as keyof typeof LAB_TEST_LABELS
                            ] ||
                            (viewingLabResult as any).customTestTypeLabel ||
                            viewingLabResult.testType}
                      </span>
                      <span className="text-xs text-text-muted">(Primary)</span>
                    </div>

                    {/* Additional test types */}
                    {viewingLabResult.additionalTestTypes &&
                      viewingLabResult.additionalTestTypes.map(
                        (testType, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2"
                          >
                            <span className="w-2 h-2 bg-text-muted rounded-full"></span>
                            <span className="text-sm text-text-secondary">
                              {
                                LAB_TEST_LABELS[
                                  testType as keyof typeof LAB_TEST_TYPES
                                ]
                              }
                            </span>
                          </div>
                        )
                      )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary">
                    Test Name
                  </label>
                  <p className="mt-1 text-sm text-text-secondary">
                    {viewingLabResult.testName || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary">
                    Status
                  </label>
                  {canUpdateStatus(viewingLabResult) ? (
                    <div className="mt-1">
                      <Select
                        value={viewingLabResult.status}
                        onChange={(e) =>
                          handleStatusUpdate(
                            viewingLabResult._id,
                            e.target.value
                          )
                        }
                        disabled={statusUpdating === viewingLabResult._id}
                        options={[
                          { value: "PENDING", label: "Pending" },
                          { value: "IN_PROGRESS", label: "In Progress" },
                          { value: "COMPLETED", label: "Completed" },
                          { value: "CANCELLED", label: "Cancelled" },
                        ]}
                        className="w-full"
                      />
                      {statusUpdating === viewingLabResult._id && (
                        <div className="mt-2 text-sm text-blue-600">
                          Updating status...
                        </div>
                      )}
                    </div>
                  ) : (
                    <span
                      className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        viewingLabResult.status
                      )}`}
                    >
                      {LAB_TEST_STATUS_LABELS[viewingLabResult.status]}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary">
                    Requested At
                  </label>
                  <p className="mt-1 text-sm text-text-secondary">
                    {formatDate(viewingLabResult.requestedAt)}
                  </p>
                </div>
              </div>

              {viewingLabResult.results &&
                viewingLabResult.results.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Test Results
                    </label>
                    <div className="space-y-2">
                      {viewingLabResult.results.map((result, index) => (
                        <div
                          key={index}
                          className="border border-border-color p-3 rounded-lg bg-card-bg"
                        >
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-text-muted">
                                Parameter:
                              </span>
                              <p className="font-medium text-text-primary">
                                {result.parameter}
                              </p>
                            </div>
                            <div>
                              <span className="text-text-muted">Value:</span>
                              <p className="font-medium text-text-primary">
                                {result.value} {result.unit}
                              </p>
                            </div>
                            {result.referenceRange && (
                              <div>
                                <span className="text-text-muted">
                                  Reference Range:
                                </span>
                                <p className="font-medium text-text-primary">
                                  {result.referenceRange}
                                </p>
                              </div>
                            )}
                            <div>
                              <span className="text-text-muted">Status:</span>
                              <p className="font-medium text-text-primary">
                                {result.isAbnormal ? "Abnormal" : "Normal"}
                              </p>
                            </div>
                          </div>
                          {result.notes && (
                            <div className="mt-2">
                              <span className="text-text-muted text-sm">
                                Notes:
                              </span>
                              <p className="text-sm text-text-secondary">
                                {result.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {viewingLabResult.notes && (
                <div>
                  <label className="block text-sm font-medium text-text-primary">
                    Notes
                  </label>
                  <p className="mt-1 text-sm text-text-secondary">
                    {viewingLabResult.notes}
                  </p>
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
      {/* <Footer /> */}
    </>
  );
}
