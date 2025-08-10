"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { useUserRole } from "@/hooks/useUserRole";
import { PageLoader } from "@/components/common/loading-spinner";
import { Modal } from "@/components/ui/modal";
import {
  FormField,
  Input,
  Select,
  TextArea,
  Button,
} from "@/components/ui/form";
import { toastManager } from "@/lib/utils/toast";
import { FaEye, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { PaginationControls } from "@/components/ui/pagination";
import { CountryCodeSelector } from "@/components/ui/country-code-selector";
import { COUNTRY_CODES, CountryCode } from "@/constants/country-codes";
import {
  SERVICE_OPTIONS,
  SERVICE_TYPES,
  INJECTION_TYPES,
  INJECTION_SITES,
  SERVICE_PRICES,
  SERVICE_LABELS,
} from "@/constants/service-types";

interface WalkInService {
  _id: string;
  serviceId: string;
  patientId?: string;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  patientAge?: number;
  patientGender?: string;
  serviceType: string;
  serviceDetails: {
    injectionType?: string;
    injectionSite?: string;
    bloodPressure?: string;
    bloodGlucose?: string;
    temperature?: string;
    weight?: string;
    height?: string;
    notes?: string;
  };
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentId?: string;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface ServiceStats {
  totalServices: number;
  totalRevenue: number;
  todayServices: number;
  todayRevenue: number;
  pendingPayments: number;
  completedServices: number;
}

interface ServiceFormData {
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  patientAge: string;
  patientGender: string;
  serviceType: string;
  injectionType: string;
  injectionSite: string;
  bloodPressure: string;
  bloodGlucose: string;
  temperature: string;
  weight: string;
  height: string;
  notes: string;
  paymentMethod: string;
  selectedCountry: CountryCode;
}

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
];

export default function WalkInServicesPage() {
  const { userRole, userName, isLoaded } = useUserRole();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedServiceType, setSelectedServiceType] = useState("all");
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);
  const [isViewServiceModalOpen, setIsViewServiceModalOpen] = useState(false);
  const [isEditServiceModalOpen, setIsEditServiceModalOpen] = useState(false);
  const [viewingService, setViewingService] = useState<WalkInService | null>(
    null
  );
  const [editingService, setEditingService] = useState<WalkInService | null>(
    null
  );
  const [services, setServices] = useState<WalkInService[]>([]);
  const [stats, setStats] = useState<ServiceStats>({
    totalServices: 0,
    totalRevenue: 0,
    todayServices: 0,
    todayRevenue: 0,
    pendingPayments: 0,
    completedServices: 0,
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isLgUp, setIsLgUp] = useState(false);
  const [formData, setFormData] = useState<ServiceFormData>({
    patientName: "",
    patientPhone: "",
    patientEmail: "",
    patientAge: "",
    patientGender: "",
    serviceType: "",
    injectionType: "",
    injectionSite: "",
    bloodPressure: "",
    bloodGlucose: "",
    temperature: "",
    weight: "",
    height: "",
    notes: "",
    paymentMethod: "CASH", // Set default payment method
    selectedCountry:
      COUNTRY_CODES.find((country) => country.code === "ET") ||
      COUNTRY_CODES[0],
  });
  const [errors, setErrors] = useState<Partial<ServiceFormData>>({});
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    const handleResize = () => setIsLgUp(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setInitialLoading(true);
        const response = await fetch("/api/walk-in-services");
        const result = await response.json();

        if (response.ok && result.success) {
          setServices(result.data || []);

          // Calculate stats
          const totalServices = result.data.length;
          const totalRevenue = result.data.reduce(
            (sum: number, service: WalkInService) => sum + service.amount,
            0
          );

          const today = new Date();
          const todayServices = result.data.filter((service: WalkInService) => {
            const serviceDate = new Date(service.createdAt);
            return serviceDate.toDateString() === today.toDateString();
          }).length;

          const todayRevenue = result.data
            .filter((service: WalkInService) => {
              const serviceDate = new Date(service.createdAt);
              return serviceDate.toDateString() === today.toDateString();
            })
            .reduce(
              (sum: number, service: WalkInService) => sum + service.amount,
              0
            );

          const pendingPayments = result.data.filter(
            (service: WalkInService) => service.paymentStatus === "PENDING"
          ).length;

          const completedServices = result.data.filter(
            (service: WalkInService) => service.paymentStatus === "COMPLETED"
          ).length;

          setStats({
            totalServices,
            totalRevenue,
            todayServices,
            todayRevenue,
            pendingPayments,
            completedServices,
          });
        }
      } catch (error) {
        console.error("Error loading services:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    if (isLoaded) {
      loadServices();
    }
  }, [isLoaded]);

  // Ensure this hook is declared before any conditional return to maintain stable hook order
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedStatus, selectedServiceType]);

  if (!isLoaded || initialLoading) {
    return (
      <DashboardLayout
        title="Walk-in Services"
        userRole={userRole}
        userName={userName}
      >
        <div className="flex items-center justify-center h-[60vh]">
          <PageLoader text="Loading Walk-in Services..." />
        </div>
      </DashboardLayout>
    );
  }

  // Filter services based on search and filters
  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.serviceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.patientPhone &&
        service.patientPhone.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      selectedStatus === "all" ||
      service.paymentStatus.toLowerCase() === selectedStatus;
    const matchesServiceType =
      selectedServiceType === "all" ||
      service.serviceType.toLowerCase() === selectedServiceType;
    return matchesSearch && matchesStatus && matchesServiceType;
  });

  const totalFiltered = filteredServices.length;
  const paginatedServices = filteredServices.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType.toLowerCase()) {
      case "injection":
        return "💉";
      case "blood_pressure_check":
        return "🩺";
      case "diabetes_screening":
        return "🩸";
      case "temperature_check":
        return "🌡️";
      case "weight_check":
        return "⚖️";
      case "height_check":
        return "📏";
      case "basic_consultation":
        return "👨‍⚕️";
      case "dressing":
        return "🩹";
      case "wound_cleaning":
        return "🧼";
      default:
        return "🏥";
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
    const newErrors: Partial<ServiceFormData> = {};

    if (!formData.patientName.trim()) {
      newErrors.patientName = "Patient name is required";
    }
    if (!formData.serviceType) {
      newErrors.serviceType = "Service type is required";
    }
    if (!formData.paymentMethod || formData.paymentMethod.trim() === "") {
      newErrors.paymentMethod = "Payment method is required";
    }
    if (
      formData.patientPhone.trim() &&
      (formData.patientPhone.length < 7 || formData.patientPhone.length > 15)
    ) {
      newErrors.patientPhone =
        "Please enter a valid phone number (7-15 digits)";
    }
    if (
      formData.patientEmail.trim() &&
      !/\S+@\S+\.\S+/.test(formData.patientEmail)
    ) {
      newErrors.patientEmail = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNewService = async () => {
    if (!validateForm()) return;

    console.log("Form data before submission:", formData);
    setLoading(true);
    try {
      const serviceData = {
        patientName: formData.patientName,
        patientPhone: formData.patientPhone
          ? `${formData.selectedCountry.dialCode} ${formData.patientPhone}`
          : "",
        patientEmail: formData.patientEmail,
        patientAge: formData.patientAge ? parseInt(formData.patientAge) : null,
        patientGender: formData.patientGender || undefined,
        serviceType: formData.serviceType,
        serviceDetails: {
          injectionType: formData.injectionType || undefined,
          injectionSite: formData.injectionSite || undefined,
          bloodPressure: formData.bloodPressure || undefined,
          bloodGlucose: formData.bloodGlucose || undefined,
          temperature: formData.temperature || undefined,
          weight: formData.weight || undefined,
          height: formData.height || undefined,
          notes: formData.notes || undefined,
        },
        amount:
          SERVICE_PRICES[formData.serviceType as keyof typeof SERVICE_PRICES] ||
          50,
        paymentMethod: formData.paymentMethod || "CASH",
        paymentStatus: "COMPLETED", // Default to completed for walk-in services
        recordedBy: userName || "Unknown",
      };

      console.log("Sending service data:", serviceData);

      const response = await fetch("/api/walk-in-services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serviceData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setServices([...services, result.data]);
        setIsNewServiceModalOpen(false);
        resetForm();
        toastManager.success("Service recorded successfully!");

        // Reload data to update stats
        const loadServices = async () => {
          const response = await fetch("/api/walk-in-services");
          const result = await response.json();
          if (response.ok && result.success) {
            setServices(result.data || []);
          }
        };
        loadServices();
      } else {
        throw new Error(result.error || "Failed to record service");
      }
    } catch (error) {
      console.error("Error creating service:", error);
      toastManager.error("Failed to record service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewService = (service: WalkInService) => {
    setViewingService(service);
    setIsViewServiceModalOpen(true);
  };

  const handleEditService = (service: WalkInService) => {
    setEditingService(service);
    // Parse phone number
    let phoneNumber = service.patientPhone || "";
    let selectedCountry =
      COUNTRY_CODES.find((country) => country.code === "ET") ||
      COUNTRY_CODES[0];

    if (phoneNumber) {
      const foundCountry = COUNTRY_CODES.find((country) =>
        phoneNumber.startsWith(country.dialCode)
      );
      if (foundCountry) {
        selectedCountry = foundCountry;
        phoneNumber = phoneNumber
          .replace(foundCountry.dialCode, "")
          .replace(/\s/g, "")
          .trim();
      }
    }

    setFormData({
      patientName: service.patientName,
      patientPhone: phoneNumber,
      patientEmail: service.patientEmail || "",
      patientAge: service.patientAge?.toString() || "",
      patientGender: service.patientGender || "",
      serviceType: service.serviceType,
      injectionType: service.serviceDetails?.injectionType || "",
      injectionSite: service.serviceDetails?.injectionSite || "",
      bloodPressure: service.serviceDetails?.bloodPressure || "",
      bloodGlucose: service.serviceDetails?.bloodGlucose || "",
      temperature: service.serviceDetails?.temperature || "",
      weight: service.serviceDetails?.weight || "",
      height: service.serviceDetails?.height || "",
      notes: service.serviceDetails?.notes || "",
      paymentMethod: service.paymentMethod,
      selectedCountry,
    });
    setIsEditServiceModalOpen(true);
  };

  const handleUpdateService = async () => {
    if (!validateForm() || !editingService) return;

    setLoading(true);
    try {
      const serviceData = {
        patientName: formData.patientName,
        patientPhone: formData.patientPhone
          ? `${formData.selectedCountry.dialCode} ${formData.patientPhone}`
          : "",
        patientEmail: formData.patientEmail,
        patientAge: formData.patientAge ? parseInt(formData.patientAge) : null,
        patientGender: formData.patientGender || undefined,
        serviceType: formData.serviceType,
        serviceDetails: {
          injectionType: formData.injectionType || undefined,
          injectionSite: formData.injectionSite || undefined,
          bloodPressure: formData.bloodPressure || undefined,
          bloodGlucose: formData.bloodGlucose || undefined,
          temperature: formData.temperature || undefined,
          weight: formData.weight || undefined,
          height: formData.height || undefined,
          notes: formData.notes || undefined,
        },
        amount:
          SERVICE_PRICES[formData.serviceType as keyof typeof SERVICE_PRICES] ||
          50,
        paymentMethod: formData.paymentMethod || "CASH",
        paymentStatus: "COMPLETED",
        recordedBy: userName || "Unknown",
      };

      console.log("Updating service data:", serviceData);

      const response = await fetch(
        `/api/walk-in-services/${editingService._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(serviceData),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        // Update the service in the local state
        setServices(
          services.map((service) =>
            service._id === editingService._id ? result.data : service
          )
        );
        setIsEditServiceModalOpen(false);
        setEditingService(null);
        resetForm();
        toastManager.success("Service updated successfully!");

        // Reload data to update stats
        const loadServices = async () => {
          const response = await fetch("/api/walk-in-services");
          const result = await response.json();
          if (response.ok && result.success) {
            setServices(result.data || []);
          }
        };
        loadServices();
      } else {
        throw new Error(result.error || "Failed to update service");
      }
    } catch (error) {
      console.error("Error updating service:", error);
      toastManager.error("Failed to update service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service record?"))
      return;

    try {
      const response = await fetch(`/api/walk-in-services/${serviceId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setServices(services.filter((service) => service._id !== serviceId));
        toastManager.success("Service deleted successfully!");
      } else {
        toastManager.error("Failed to delete service");
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      toastManager.error("Failed to delete service");
    }
  };

  const resetForm = () => {
    console.log("Resetting form...");
    setFormData({
      patientName: "",
      patientPhone: "",
      patientEmail: "",
      patientAge: "",
      patientGender: "",
      serviceType: "",
      injectionType: "",
      injectionSite: "",
      bloodPressure: "",
      bloodGlucose: "",
      temperature: "",
      weight: "",
      height: "",
      notes: "",
      paymentMethod: "CASH",
      selectedCountry:
        COUNTRY_CODES.find((country) => country.code === "ET") ||
        COUNTRY_CODES[0],
    });
    setErrors({});
  };

  const handleInputChange = (
    field: keyof ServiceFormData,
    value: string | CountryCode
  ) => {
    console.log(`Updating ${field} to:`, value);
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const getServiceDetails = (service: WalkInService) => {
    const details = service.serviceDetails;
    if (!details) return "No details";

    switch (service.serviceType) {
      case SERVICE_TYPES.INJECTION:
        return `${details.injectionType || "N/A"} - ${
          details.injectionSite || "N/A"
        }`;
      case SERVICE_TYPES.BLOOD_PRESSURE_CHECK:
        return details.bloodPressure || "N/A";
      case SERVICE_TYPES.DIABETES_SCREENING:
        return `${details.bloodGlucose || "N/A"} mg/dL`;
      case SERVICE_TYPES.TEMPERATURE_CHECK:
        return `${details.temperature || "N/A"}°C`;
      case SERVICE_TYPES.WEIGHT_CHECK:
        return `${details.weight || "N/A"} kg`;
      case SERVICE_TYPES.HEIGHT_CHECK:
        return `${details.height || "N/A"} cm`;
      default:
        return details.notes || "No details";
    }
  };

  // Prepare display stats
  const displayStats = [
    {
      title: "Total Services",
      value: stats.totalServices.toString(),
      change: "+15% from last week",
      changeType: "positive" as const,
      icon: "🏥",
    },
    {
      title: "Total Revenue",
      value: `EBR ${stats.totalRevenue.toFixed(2)}`,
      change: "+12% from last week",
      changeType: "positive" as const,
      icon: "💰",
    },
    {
      title: "Today's Services",
      value: stats.todayServices.toString(),
      change: "+3 from yesterday",
      changeType: "positive" as const,
      icon: "📅",
    },
    {
      title: "Today's Revenue",
      value: `EBR ${stats.todayRevenue.toFixed(2)}`,
      change: "+8% from yesterday",
      changeType: "positive" as const,
      icon: "💵",
    },
  ];

  return (
    <DashboardLayout
      title="Walk-in Services"
      userRole={userRole}
      userName={userName}
    >
      <div className="space-y-6">
        {/* Stats Cards */}
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

        {/* Services Section */}
        <div className="bg-card-bg rounded-lg border border-border-color p-6 w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-text-primary">
              Walk-in Services
            </h2>
            <Button
              onClick={() => setIsNewServiceModalOpen(true)}
              className="cursor-pointer bg-[#1447E6] hover:bg-gray-700"
            >
              <FaPlus className="mr-2" />
              New Service
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 mb-6">
            <input
              type="text"
              placeholder="Search services by ID, patient name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full lg:flex-1 border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary placeholder-text-muted bg-background"
            />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full lg:w-44 border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={selectedServiceType}
              onChange={(e) => setSelectedServiceType(e.target.value)}
              className="w-full lg:w-44 border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background"
            >
              <option value="all">All Services</option>
              {SERVICE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value.toLowerCase()}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Services Table */}
          {/* Desktop Table */}
          {isLgUp && (
            <div className="w-full">
              <div className="overflow-x-auto w-full border border-border-color rounded-md">
                <table className="w-full min-w-[800px] divide-y divide-border-color">
                  <thead className="bg-card-bg">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-medium text-text-muted uppercase">
                        Patient & Service ID
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-text-muted uppercase">
                        Service
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-text-muted uppercase">
                        Details
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-text-muted uppercase">
                        Amount
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-text-muted uppercase">
                        Status
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-text-muted uppercase">
                        Date
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-text-muted uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-border-color">
                    {paginatedServices.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-sm text-text-secondary"
                        >
                          No services found. Add a new service to get started.
                        </td>
                      </tr>
                    ) : (
                      paginatedServices.map((service) => (
                        <tr key={service._id} className="hover:bg-card-bg">
                          <td className="px-2 py-1 text-sm text-text-primary align-top">
                            <div className="leading-tight block">
                              <div className="text-text-primary font-medium block">
                                {service.patientName}
                              </div>
                              <div className="text-xs text-text-secondary block">
                                {service.serviceId}
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-1 whitespace-nowrap text-sm text-text-primary">
                            <div className="flex items-center">
                              <span className="mr-2">
                                {getServiceIcon(service.serviceType)}
                              </span>
                              <span>
                                {SERVICE_LABELS[
                                  service.serviceType as keyof typeof SERVICE_LABELS
                                ] || service.serviceType}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 py-1 whitespace-nowrap text-sm text-text-secondary">
                            {getServiceDetails(service)}
                          </td>
                          <td className="px-2 py-1 whitespace-nowrap text-sm font-medium text-text-primary">
                            EBR {service.amount.toFixed(2)}
                          </td>
                          <td className="px-2 py-1 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                service.paymentStatus
                              )}`}
                            >
                              {service.paymentStatus.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-2 py-1 whitespace-nowrap text-sm text-text-secondary">
                            {formatDate(service.createdAt)}
                          </td>
                          <td className="px-2 py-1 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleViewService(service)}
                              className="text-accent-color hover:text-accent-hover mr-2 p-1 rounded hover:bg-accent-color/10 transition-colors cursor-pointer"
                              title="View Service"
                            >
                              <FaEye size={16} />
                            </button>
                            <button
                              onClick={() => handleEditService(service)}
                              className="text-success hover:text-success/80 mr-2 p-1 rounded hover:bg-success/10 transition-colors cursor-pointer"
                              title="Edit Service"
                            >
                              <FaEdit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteService(service._id)}
                              className="text-error hover:text-error/80 p-1 rounded hover:bg-error/10 transition-colors cursor-pointer"
                              title="Delete Service"
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
              {paginatedServices.map((service) => (
                <div
                  key={service._id}
                  className="bg-background border border-border-color rounded-lg p-4 space-y-3 overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-text-primary">
                        {service.serviceId}
                      </h3>
                      <p className="text-sm text-text-secondary">
                        {service.patientName}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        service.paymentStatus
                      )}`}
                    >
                      {service.paymentStatus.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm min-w-0">
                    <div>
                      <span className="text-text-muted">Service:</span>
                      <span className="ml-1 text-text-primary break-words">
                        {SERVICE_LABELS[
                          service.serviceType as keyof typeof SERVICE_LABELS
                        ] || service.serviceType}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-muted">Amount:</span>
                      <span className="ml-1 text-text-primary break-words">
                        EBR {service.amount.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-muted">Date:</span>
                      <span className="ml-1 text-text-primary break-words">
                        {formatDate(service.createdAt)}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-muted">Details:</span>
                      <span className="ml-1 text-text-primary break-words">
                        {getServiceDetails(service)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={() => handleViewService(service)}
                      className="text-accent-color hover:text-accent-hover p-2 rounded hover:bg-accent-color/10 transition-colors"
                      title="View Service"
                    >
                      <FaEye size={16} />
                    </button>
                    <button
                      onClick={() => handleEditService(service)}
                      className="text-success hover:text-success/80 p-2 rounded hover:bg-success/10 transition-colors"
                      title="Edit Service"
                    >
                      <FaEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteService(service._id)}
                      className="text-error hover:text-error/80 p-2 rounded hover:bg-error/10 transition-colors"
                      title="Delete Service"
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
            className="mt-4"
          />
        </div>

        {/* New Service Modal */}
        <Modal
          isOpen={isNewServiceModalOpen}
          onClose={() => {
            setIsNewServiceModalOpen(false);
            resetForm();
          }}
          title="Record New Walk-in Service"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Patient Name"
                required
                error={errors.patientName}
              >
                <Input
                  value={formData.patientName}
                  onChange={(e) =>
                    handleInputChange("patientName", e.target.value)
                  }
                  placeholder="Enter patient's full name"
                />
              </FormField>

              <FormField label="Patient Age" error={errors.patientAge}>
                <Input
                  type="number"
                  value={formData.patientAge}
                  onChange={(e) =>
                    handleInputChange("patientAge", e.target.value)
                  }
                  placeholder="Enter age (optional)"
                  min="1"
                  max="120"
                />
              </FormField>

              <FormField label="Gender" error={errors.patientGender}>
                <Select
                  value={formData.patientGender}
                  onChange={(e) =>
                    handleInputChange("patientGender", e.target.value)
                  }
                  options={GENDER_OPTIONS}
                />
              </FormField>

              <FormField label="Phone Number" error={errors.patientPhone}>
                <div className="flex">
                  <CountryCodeSelector
                    value={formData.selectedCountry}
                    onChange={(country) => {
                      setFormData((prev) => ({
                        ...prev,
                        selectedCountry: country,
                      }));
                    }}
                    className="w-16"
                  />
                  <Input
                    type="tel"
                    value={formData.patientPhone}
                    onChange={(e) =>
                      handleInputChange("patientPhone", e.target.value)
                    }
                    placeholder="Enter phone number (optional)"
                    className="rounded-l-none flex-1"
                  />
                </div>
              </FormField>

              <FormField label="Email" error={errors.patientEmail}>
                <Input
                  type="email"
                  value={formData.patientEmail}
                  onChange={(e) =>
                    handleInputChange("patientEmail", e.target.value)
                  }
                  placeholder="Enter email (optional)"
                />
              </FormField>

              <FormField
                label="Service Type"
                required
                error={errors.serviceType}
              >
                <Select
                  value={formData.serviceType}
                  onChange={(e) =>
                    handleInputChange("serviceType", e.target.value)
                  }
                  options={SERVICE_OPTIONS}
                />
              </FormField>

              <FormField
                label="Payment Method"
                required
                error={errors.paymentMethod}
              >
                <Select
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    handleInputChange("paymentMethod", e.target.value)
                  }
                  options={PAYMENT_METHOD_OPTIONS}
                />
              </FormField>
            </div>

            {/* Service-specific fields */}
            {formData.serviceType === SERVICE_TYPES.INJECTION && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Injection Type">
                  <Select
                    value={formData.injectionType}
                    onChange={(e) =>
                      handleInputChange("injectionType", e.target.value)
                    }
                    options={INJECTION_TYPES.map((type) => ({
                      value: type,
                      label: type,
                    }))}
                  />
                </FormField>
                <FormField label="Injection Site">
                  <Select
                    value={formData.injectionSite}
                    onChange={(e) =>
                      handleInputChange("injectionSite", e.target.value)
                    }
                    options={INJECTION_SITES.map((site) => ({
                      value: site,
                      label: site,
                    }))}
                  />
                </FormField>
              </div>
            )}

            {formData.serviceType === SERVICE_TYPES.BLOOD_PRESSURE_CHECK && (
              <FormField label="Blood Pressure Reading">
                <Input
                  value={formData.bloodPressure}
                  onChange={(e) =>
                    handleInputChange("bloodPressure", e.target.value)
                  }
                  placeholder="e.g., 120/80 mmHg"
                />
              </FormField>
            )}

            {formData.serviceType === SERVICE_TYPES.DIABETES_SCREENING && (
              <FormField label="Blood Glucose Level">
                <Input
                  value={formData.bloodGlucose}
                  onChange={(e) =>
                    handleInputChange("bloodGlucose", e.target.value)
                  }
                  placeholder="e.g., 120 mg/dL"
                />
              </FormField>
            )}

            {formData.serviceType === SERVICE_TYPES.TEMPERATURE_CHECK && (
              <FormField label="Temperature">
                <Input
                  value={formData.temperature}
                  onChange={(e) =>
                    handleInputChange("temperature", e.target.value)
                  }
                  placeholder="e.g., 37.2°C"
                />
              </FormField>
            )}

            {formData.serviceType === SERVICE_TYPES.WEIGHT_CHECK && (
              <FormField label="Weight">
                <Input
                  value={formData.weight}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                  placeholder="e.g., 70 kg"
                />
              </FormField>
            )}

            {formData.serviceType === SERVICE_TYPES.HEIGHT_CHECK && (
              <FormField label="Height">
                <Input
                  value={formData.height}
                  onChange={(e) => handleInputChange("height", e.target.value)}
                  placeholder="e.g., 170 cm"
                />
              </FormField>
            )}

            <FormField label="Notes" error={errors.notes}>
              <TextArea
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Enter any additional notes or observations..."
                rows={3}
              />
            </FormField>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsNewServiceModalOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                className="hover:bg-gray-700 cursor-pointer bg-[#1447E6]"
                onClick={handleNewService}
                loading={loading}
              >
                Record Service
              </Button>
            </div>
          </div>
        </Modal>

        {/* View Service Modal */}
        <Modal
          isOpen={isViewServiceModalOpen}
          onClose={() => {
            setIsViewServiceModalOpen(false);
            setViewingService(null);
          }}
          title="Service Details"
          size="md"
        >
          {viewingService && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Service ID
                  </label>
                  <p className="mt-1 text-sm text-text-primary">
                    {viewingService.serviceId}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Patient Name
                  </label>
                  <p className="mt-1 text-sm text-text-primary">
                    {viewingService.patientName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Service Type
                  </label>
                  <p className="mt-1 text-sm text-text-primary">
                    {SERVICE_LABELS[
                      viewingService.serviceType as keyof typeof SERVICE_LABELS
                    ] || viewingService.serviceType}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Amount
                  </label>
                  <p className="mt-1 text-sm text-text-primary">
                    EBR {viewingService.amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Payment Status
                  </label>
                  <span
                    className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      viewingService.paymentStatus
                    )}`}
                  >
                    {viewingService.paymentStatus.toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Date
                  </label>
                  <p className="mt-1 text-sm text-text-primary">
                    {formatDate(viewingService.createdAt)}
                  </p>
                </div>
              </div>

              {viewingService.serviceDetails && (
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Service Details
                  </label>
                  <div className="bg-card-bg rounded-md p-3 border border-border-color">
                    <p className="text-sm text-text-primary whitespace-pre-wrap">
                      {getServiceDetails(viewingService)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsViewServiceModalOpen(false);
                    setViewingService(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Edit Service Modal */}
        <Modal
          isOpen={isEditServiceModalOpen}
          onClose={() => {
            setIsEditServiceModalOpen(false);
            setEditingService(null);
            resetForm();
          }}
          title="Edit Walk-in Service"
          size="lg"
        >
          {editingService && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Patient Name"
                  required
                  error={errors.patientName}
                >
                  <Input
                    value={formData.patientName}
                    onChange={(e) =>
                      handleInputChange("patientName", e.target.value)
                    }
                    placeholder="Enter patient's full name"
                  />
                </FormField>

                <FormField label="Patient Age" error={errors.patientAge}>
                  <Input
                    type="number"
                    value={formData.patientAge}
                    onChange={(e) =>
                      handleInputChange("patientAge", e.target.value)
                    }
                    placeholder="Enter age (optional)"
                    min="1"
                    max="120"
                  />
                </FormField>

                <FormField label="Gender" error={errors.patientGender}>
                  <Select
                    value={formData.patientGender}
                    onChange={(e) =>
                      handleInputChange("patientGender", e.target.value)
                    }
                    options={GENDER_OPTIONS}
                  />
                </FormField>

                <FormField label="Phone Number" error={errors.patientPhone}>
                  <div className="flex">
                    <CountryCodeSelector
                      value={formData.selectedCountry}
                      onChange={(country) => {
                        setFormData((prev) => ({
                          ...prev,
                          selectedCountry: country,
                        }));
                      }}
                      className="w-16"
                    />
                    <Input
                      type="tel"
                      value={formData.patientPhone}
                      onChange={(e) =>
                        handleInputChange("patientPhone", e.target.value)
                      }
                      placeholder="Enter phone number (optional)"
                      className="rounded-l-none flex-1"
                    />
                  </div>
                </FormField>

                <FormField label="Email" error={errors.patientEmail}>
                  <Input
                    type="email"
                    value={formData.patientEmail}
                    onChange={(e) =>
                      handleInputChange("patientEmail", e.target.value)
                    }
                    placeholder="Enter email (optional)"
                  />
                </FormField>

                <FormField
                  label="Service Type"
                  required
                  error={errors.serviceType}
                >
                  <Select
                    value={formData.serviceType}
                    onChange={(e) =>
                      handleInputChange("serviceType", e.target.value)
                    }
                    options={SERVICE_OPTIONS}
                  />
                </FormField>

                <FormField
                  label="Payment Method"
                  required
                  error={errors.paymentMethod}
                >
                  <Select
                    value={formData.paymentMethod}
                    onChange={(e) =>
                      handleInputChange("paymentMethod", e.target.value)
                    }
                    options={PAYMENT_METHOD_OPTIONS}
                  />
                </FormField>
              </div>

              {/* Service-specific fields */}
              {formData.serviceType === SERVICE_TYPES.INJECTION && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Injection Type">
                    <Select
                      value={formData.injectionType}
                      onChange={(e) =>
                        handleInputChange("injectionType", e.target.value)
                      }
                      options={INJECTION_TYPES.map((type) => ({
                        value: type,
                        label: type,
                      }))}
                    />
                  </FormField>
                  <FormField label="Injection Site">
                    <Select
                      value={formData.injectionSite}
                      onChange={(e) =>
                        handleInputChange("injectionSite", e.target.value)
                      }
                      options={INJECTION_SITES.map((site) => ({
                        value: site,
                        label: site,
                      }))}
                    />
                  </FormField>
                </div>
              )}

              {formData.serviceType === SERVICE_TYPES.BLOOD_PRESSURE_CHECK && (
                <FormField label="Blood Pressure Reading">
                  <Input
                    value={formData.bloodPressure}
                    onChange={(e) =>
                      handleInputChange("bloodPressure", e.target.value)
                    }
                    placeholder="e.g., 120/80 mmHg"
                  />
                </FormField>
              )}

              {formData.serviceType === SERVICE_TYPES.DIABETES_SCREENING && (
                <FormField label="Blood Glucose Level">
                  <Input
                    value={formData.bloodGlucose}
                    onChange={(e) =>
                      handleInputChange("bloodGlucose", e.target.value)
                    }
                    placeholder="e.g., 120 mg/dL"
                  />
                </FormField>
              )}

              {formData.serviceType === SERVICE_TYPES.TEMPERATURE_CHECK && (
                <FormField label="Temperature">
                  <Input
                    value={formData.temperature}
                    onChange={(e) =>
                      handleInputChange("temperature", e.target.value)
                    }
                    placeholder="e.g., 37.2°C"
                  />
                </FormField>
              )}

              {formData.serviceType === SERVICE_TYPES.WEIGHT_CHECK && (
                <FormField label="Weight">
                  <Input
                    value={formData.weight}
                    onChange={(e) =>
                      handleInputChange("weight", e.target.value)
                    }
                    placeholder="e.g., 70 kg"
                  />
                </FormField>
              )}

              {formData.serviceType === SERVICE_TYPES.HEIGHT_CHECK && (
                <FormField label="Height">
                  <Input
                    value={formData.height}
                    onChange={(e) =>
                      handleInputChange("height", e.target.value)
                    }
                    placeholder="e.g., 170 cm"
                  />
                </FormField>
              )}

              <FormField label="Notes" error={errors.notes}>
                <TextArea
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Enter any additional notes or observations..."
                  rows={3}
                />
              </FormField>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsEditServiceModalOpen(false);
                    setEditingService(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="hover:bg-gray-700 cursor-pointer bg-[#1447E6]"
                  onClick={handleUpdateService}
                  loading={loading}
                >
                  Update Service
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
