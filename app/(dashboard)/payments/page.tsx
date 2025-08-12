"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import Footer from "@/components/Footer";
import { StatsCard } from "@/components/dashboard/stats-card";
import { useUserRole } from "@/hooks/useUserRole";
import { PageLoader } from "@/components/common/loading-spinner";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { PaginationControls } from "@/components/ui/pagination";
import { Modal } from "@/components/ui/modal";
import {
  FormField,
  Input,
  Select,
  Button,
  TextArea,
} from "@/components/ui/form";
import { toastManager } from "@/lib/utils/toast";

interface Payment {
  _id: string;
  paymentId: string;
  patientId: string;
  patientName: string;

  // Order Integration
  orderId?: string; // Reference to drug order or lab order
  orderType?: "DRUG_ORDER" | "LAB_TEST" | "CONSULTATION" | "OTHER";
  orderReference?: string; // Human-readable order reference
  drugOrderId?: string; // Actual drug order ID (DRG000001 format)

  // Payment Details
  amount: number;
  paymentMethod: string;
  paymentStatus: string;

  // Enhanced for Drug Sales
  paymentType:
    | "DRUG_SALE"
    | "LAB_TEST"
    | "CONSULTATION"
    | "WALK_IN_SERVICE"
    | "OTHER";

  // Drug Sale Specific Fields (when paymentType === 'DRUG_SALE')
  items?: Array<{
    drugId: string;
    drugName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;

  // General Payment Fields
  discount: number;
  finalAmount: number;
  transactionReference?: string;
  notes?: string;

  // Metadata
  recordedBy: string;
  createdAt: string;
  updatedAt: string;

  // UI-specific properties
  fullDescription?: string; // For displaying full description in modal
}

interface PaymentStats {
  totalRevenue: number;
  totalDrugSales: number;
  totalLabPayments: number;
  totalConsultations: number;
  totalWalkInServices: number;
  pendingAmount: number;
  completedPayments: number;
  totalTransactions: number;
  averageTransaction: number;
  todayRevenue: number;
}

// This will be replaced with dynamic data from the database

const PAYMENT_STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "all", label: "All Methods" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "mobile_money", label: "Mobile Money" },
];

export default function PaymentsPage() {
  const { userRole, userName, isLoaded } = useUserRole();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedMethod, setSelectedMethod] = useState("all");
  // Viewport-based rendering toggle (lg breakpoint: 1024px)
  const [isLgUp, setIsLgUp] = useState<boolean>(true);
  // Date range controls for stats cards
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [rangeStart, setRangeStart] = useState<string>('');
  const [rangeEnd, setRangeEnd] = useState<string>('');
  const [isNewPaymentModalOpen, setIsNewPaymentModalOpen] = useState(false);
  const [isViewPaymentModalOpen, setIsViewPaymentModalOpen] = useState(false);
  const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [drugOrders, setDrugOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    totalDrugSales: 0,
    totalLabPayments: 0,
    totalConsultations: 0,
    totalWalkInServices: 0,
    pendingAmount: 0,
    completedPayments: 0,
    totalTransactions: 0,
    averageTransaction: 0,
    todayRevenue: 0,
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    amount: "",
    paymentMethod: "",
    paymentStatus: "",
    transactionReference: "",
    orderId: "",
    orderType: "",
    orderReference: "",
    drugOrderId: "",
    paymentType: "OTHER",
    items: [] as Array<{
      drugId: string;
      drugName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>,
    discount: "0",
    finalAmount: "",
    notes: "",
  });
  const [errors, setErrors] = useState<any>({});

  // Pagination (moved earlier to ensure stable hook order before any conditional return)
  const [page, setPage] = useState(1);
  const pageSize = 5;
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedStatus, selectedMethod]);

  // Enhanced stats calculation
  const calculateStats = (paymentsData: Payment[]): PaymentStats => {
    const totalRevenue = paymentsData.reduce(
      (sum, payment) => sum + (payment.finalAmount || payment.amount),
      0
    );
    const totalTransactions = paymentsData.length;
    const averageTransaction =
      totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Calculate by payment type
    const totalDrugSales = paymentsData
      .filter((payment) => payment.paymentType === "DRUG_SALE")
      .reduce(
        (sum, payment) => sum + (payment.finalAmount || payment.amount),
        0
      );

    const totalLabPayments = paymentsData
      .filter((payment) => payment.paymentType === "LAB_TEST")
      .reduce(
        (sum, payment) => sum + (payment.finalAmount || payment.amount),
        0
      );

    const totalConsultations = paymentsData
      .filter((payment) => payment.paymentType === "CONSULTATION")
      .reduce(
        (sum, payment) => sum + (payment.finalAmount || payment.amount),
        0
      );

    const totalWalkInServices = paymentsData
      .filter((payment) => payment.paymentType === "WALK_IN_SERVICE")
      .reduce(
        (sum, payment) => sum + (payment.finalAmount || payment.amount),
        0
      );

    const pendingAmount = paymentsData
      .filter((payment) => payment.paymentStatus === "PENDING")
      .reduce(
        (sum, payment) => sum + (payment.finalAmount || payment.amount),
        0
      );

    const completedPayments = paymentsData.filter(
      (payment) => payment.paymentStatus === "COMPLETED"
    ).length;

    const today = new Date();
    const todayRevenue = paymentsData
      .filter((payment) => {
        const paymentDate = new Date(payment.createdAt);
        return paymentDate.toDateString() === today.toDateString();
      })
      .reduce(
        (sum, payment) => sum + (payment.finalAmount || payment.amount),
        0
      );

    return {
      totalRevenue,
      totalDrugSales,
      totalLabPayments,
      totalConsultations,
      totalWalkInServices,
      pendingAmount,
      completedPayments,
      totalTransactions,
      averageTransaction,
      todayRevenue,
    };
  };

  // Helper: fetch walk-in services and merge into stats
  const computeAndSetStats = async (paymentsData: Payment[]) => {
    const baseStats = calculateStats(paymentsData);
    let walkInTotal = 0;
    let completedPaymentsTotal = 0;
    let salesTotal = 0;
    // build date range
    const params = new URLSearchParams();
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
    if (start) params.set('startDate', start.toISOString());
    if (end) params.set('endDate', end.toISOString());
    try {
      const res = await fetch("/api/walk-in-services");
      const json = await res.json();
      if (res.ok && json.success) {
        const services = Array.isArray(json.data) ? json.data : [];
        // Match Walk-in Services page: sum all amounts
        walkInTotal = services
          .filter((s: any) => {
            if (!start && !end) return true;
            const d = new Date(s.createdAt);
            return (!start || d >= start) && (!end || d <= end);
          })
          .reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0);
      }
    } catch (err) {
      console.error("Failed to fetch walk-in services for stats:", err);
    }

    try {
      // Fetch server-side summary for COMPLETED payments across entire collection
      const res = await fetch(`/api/payments?summary=true&status=COMPLETED${params.toString() ? `&${params.toString()}` : ''}`);
      const json = await res.json();
      if (res.ok && json.success && json.summary) {
        completedPaymentsTotal = Number(json.summary.totalAmount) || 0;
      }
    } catch (err) {
      console.error("Failed to fetch payments summary for stats:", err);
    }

    try {
      // Prefer server-side summary to ensure consistency with Sales page
      const res = await fetch(`/api/sales?summary=true${params.toString() ? `&${params.toString()}` : ''}`);
      const json = await res.json();
      if (res.ok && json.success && json.summary) {
        salesTotal = Number(json.summary.totalRevenue) || 0;
      } else {
        // Fallback: fetch list and sum client-side
        const listRes = await fetch("/api/sales");
        const listJson = await listRes.json();
        if (listRes.ok && listJson.success) {
          const sales: any[] = Array.isArray(listJson.data) ? listJson.data : [];
          salesTotal = sales.reduce((sum: number, s: any) => sum + (Number(s.total ?? s.finalAmount ?? s.totalAmount) || 0), 0);
        }
      }
    } catch (err) {
      console.error("Failed to fetch sales for stats:", err);
    }

    setStats({
      ...baseStats,
      // Override Total Revenue with the server-side aggregate of COMPLETED payments only
      totalRevenue: completedPaymentsTotal,
      totalWalkInServices: walkInTotal,
      // Override Drug Sales with actual Sales collection total
      totalDrugSales: salesTotal,
    });
  };

  // Load payments and patients data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!isLoaded) return;

      try {
        setInitialLoading(true);

        const paymentsResponse = await fetch("/api/payments");
        const paymentsResult = await paymentsResponse.json();
        if (paymentsResponse.ok && paymentsResult.success) {
          const paymentsData: Payment[] = paymentsResult.data || [];
          setPayments(paymentsData);
          await computeAndSetStats(paymentsData);
        }

        // Fetch all patients across pages to populate dropdown completely
        const fetchAllPatients = async (): Promise<any[]> => {
          const limit = 100;
          let page = 1;
          let all: any[] = [];
          while (true) {
            const res = await fetch(`/api/patients?page=${page}&limit=${limit}`);
            const json = await res.json();
            if (!res.ok || !json.success) break;
            const batch: any[] = json.data || [];
            all = all.concat(batch);
            const total = json.pagination?.total ?? batch.length;
            if (all.length >= total || batch.length < limit) break;
            page += 1;
          }
          return all;
        };

        const allPatients = await fetchAllPatients();
        setPatients(allPatients);

        // TODO: Uncomment when API is ready
        // // Fetch payments and patients in parallel
        // const [paymentsResponse, patientsResponse] = await Promise.all([
        //   fetch('/api/payments'),
        //   fetch('/api/patients')
        // ]);

        // const paymentsResult = await paymentsResponse.json();
        // const patientsResult = await patientsResponse.json();

        // if (paymentsResponse.ok && paymentsResult.success) {
        //   setPayments(paymentsResult.data);

        //   // Calculate enhanced stats
        //   const calculatedStats = calculateStats(paymentsResult.data);
        //   setStats(calculatedStats);
        // }

        // if (patientsResponse.ok && patientsResult.success) {
        //   setPatients(patientsResult.data);
        // }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, [isLoaded]);

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

  if (!isLoaded || initialLoading) {
    return (
      <DashboardLayout title="Payments" userRole={userRole} userName={userName}>
        <div className="flex items-center justify-center h-[60vh]">
          <PageLoader text="Loading payments..." />
        </div>
      </DashboardLayout>
    );
  }

  // Prepare dynamic options for patients
  const PATIENT_OPTIONS = [
    { value: "", label: "Select Patient" },
    ...patients.map((patient) => ({
      value: patient.patientId,
      label: `${patient.firstName} ${patient.lastName} (${patient.patientId})`,
    })),
  ];

  // Filter payments based on search, status, and method
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.paymentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.patientId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" ||
      payment.paymentStatus.toLowerCase() === selectedStatus;
    const matchesMethod =
      selectedMethod === "all" ||
      payment.paymentMethod.toLowerCase().replace("_", "") === selectedMethod;
    return matchesSearch && matchesStatus && matchesMethod;
  });
  // Pagination derived values
  const totalFiltered = filteredPayments.length;
  const paginatedPayments = filteredPayments.slice(
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

  const getMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case "cash":
        return "💵";
      case "card":
        return "💳";
      case "mobile_money":
        return "📱";
      default:
        return "💰";
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
    const newErrors: any = {};

    if (!formData.patientId) {
      newErrors.patientId = "Patient ID is required";
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Valid amount is required";
    }
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = "Payment method is required";
    }
    if (!formData.paymentStatus) {
      newErrors.paymentStatus = "Payment status is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNewPayment = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: formData.patientId,
          patientName: formData.patientName,
          amount: parseFloat(formData.amount),
          paymentMethod: formData.paymentMethod,
          paymentStatus: formData.paymentStatus,
          transactionReference: formData.transactionReference,
          notes: formData.notes,
          orderId: formData.orderId,
          orderType: formData.orderType,
          orderReference: formData.orderReference,
          drugOrderId: formData.drugOrderId,
          paymentType: formData.paymentType,
          items: formData.items,
          discount: parseFloat(formData.discount),
          finalAmount:
            parseFloat(formData.finalAmount) || parseFloat(formData.amount),
          recordedBy: userName || "Unknown",
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        toastManager.success("Payment recorded successfully!");
        setIsNewPaymentModalOpen(false);
        resetForm();
        // Reload data
        const loadData = async () => {
          const paymentsResponse = await fetch("/api/payments");
          const paymentsResult = await paymentsResponse.json();
          if (paymentsResponse.ok && paymentsResult.success) {
            const paymentsData: Payment[] = paymentsResult.data || [];
            setPayments(paymentsData);
            await computeAndSetStats(paymentsData);
          }
        };
        loadData();
      } else {
        toastManager.error(result.message || "Failed to record payment");
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      toastManager.error("Failed to record payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch drug orders for a specific patient
  const fetchDrugOrdersForPatient = async (patientId: string) => {
    if (!patientId) {
      setDrugOrders([]);
      return;
    }

    try {
      // Fetch all orders for the patient (any status)
      const allOrdersResponse = await fetch(
        `/api/drug-orders?patientId=${patientId}`
      );
      const allOrdersResult = await allOrdersResponse.json();

      if (allOrdersResponse.ok) {
        // The API returns the data directly, not wrapped in success/data
        const orders = Array.isArray(allOrdersResult) ? allOrdersResult : [];
        // Show all orders and let the user choose; include status in label below
        setDrugOrders(orders);
      } else {
        setDrugOrders([]);
      }
    } catch (error) {
      console.error("Error fetching drug orders:", error);
      setDrugOrders([]);
    }
  };

  // Enhanced helper functions for drug sales
  const handlePaymentTypeChange = (paymentType: string) => {
    setFormData((prev) => ({
      ...prev,
      paymentType,
      items: paymentType === "DRUG_SALE" ? [] : prev.items,
      amount: paymentType !== "DRUG_SALE" ? prev.amount : "",
    }));
  };

  const addItem = () => {
    const newItem = {
      drugId: "",
      drugName: "",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    };
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Recalculate total price
    if (field === "quantity" || field === "unitPrice") {
      updatedItems[index].totalPrice =
        updatedItems[index].quantity * updatedItems[index].unitPrice;
    }

    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const removeItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const calculateFinalAmount = () => {
    const subtotal = calculateSubtotal();
    const discount = parseFloat(formData.discount) || 0;
    return subtotal - discount;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleViewPayment = (payment: Payment) => {
    setViewingPayment(payment);
    setIsViewPaymentModalOpen(true);
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setFormData({
      patientId: payment.patientId,
      patientName: payment.patientName,
      amount: payment.amount.toString(),
      paymentMethod: payment.paymentMethod.toLowerCase(),
      paymentStatus: payment.paymentStatus.toLowerCase(),
      transactionReference: payment.transactionReference || "",
      notes: payment.notes || "",

      // Order Integration
      orderId: payment.orderId || "",
      orderType: payment.orderType || "DRUG_ORDER",
      orderReference: payment.orderReference || "",
      drugOrderId: payment.drugOrderId || "",

      // Enhanced Fields for Drug Sales
      paymentType: payment.paymentType || "DRUG_SALE",
      items: payment.items || [],
      discount: payment.discount?.toString() || "0",
      finalAmount: payment.finalAmount?.toString() || "",
    });

    // Fetch drug orders for the patient if they have an orderId
    if (payment.patientId) {
      fetchDrugOrdersForPatient(payment.patientId);
    }

    setIsEditPaymentModalOpen(true);
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("Are you sure you want to delete this payment?")) return;

    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (response.ok && result.success) {
        toastManager.success("Payment deleted successfully!");
        // Reload data
        const paymentsResponse = await fetch("/api/payments");
        const paymentsResult = await paymentsResponse.json();
        if (paymentsResponse.ok && paymentsResult.success) {
          const paymentsData: Payment[] = paymentsResult.data || [];
          setPayments(paymentsData);
          await computeAndSetStats(paymentsData);
        }
      } else {
        toastManager.error(result.message || "Failed to delete payment");
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
      toastManager.error("Failed to delete payment. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: "",
      patientName: "",
      amount: "",
      paymentMethod: "",
      paymentStatus: "",
      transactionReference: "",
      orderId: "",
      orderType: "",
      orderReference: "",
      drugOrderId: "",
      paymentType: "OTHER",
      items: [] as Array<{
        drugId: string;
        drugName: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
      }>,
      discount: "0",
      finalAmount: "",
      notes: "",
    });
    setErrors({});
    setDrugOrders([]);
  };

  const handleUpdatePayment = async () => {
    if (!validateForm() || !editingPayment) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/payments/${editingPayment._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: formData.patientId,
          patientName: formData.patientName,
          amount: parseFloat(formData.amount),
          paymentMethod: formData.paymentMethod,
          paymentStatus: formData.paymentStatus,
          transactionReference: formData.transactionReference,
          notes: formData.notes,
          orderId: formData.orderId,
          orderType: formData.orderType,
          orderReference: formData.orderReference,
          drugOrderId: formData.drugOrderId,
          paymentType: formData.paymentType,
          items: formData.items,
          discount: parseFloat(formData.discount),
          finalAmount:
            parseFloat(formData.finalAmount) || parseFloat(formData.amount),
          recordedBy: userName || "Unknown",
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        toastManager.success("Payment updated successfully!");
        setIsEditPaymentModalOpen(false);
        setEditingPayment(null);
        resetForm();
        // Reload data
        const paymentsResponse = await fetch("/api/payments");
        const paymentsResult = await paymentsResponse.json();
        if (paymentsResponse.ok && paymentsResult.success) {
          const paymentsData: Payment[] = paymentsResult.data || [];
          setPayments(paymentsData);
          await computeAndSetStats(paymentsData);
        }
      } else {
        toastManager.error(result.message || "Failed to update payment");
      }
    } catch (error) {
      console.error("Error updating payment:", error);
      toastManager.error("Failed to update payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (paymentId: string, newStatus: string) => {
    if (!userRole || userRole !== "SUPER_ADMIN") {
      toastManager.error("Only super admins can update payment status");
      return;
    }

    try {
      // Use the payments collection-level endpoint which supports status-only updates
      const response = await fetch(`/api/payments`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId,
          status: newStatus,
          processedBy: userName || "System",
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        toastManager.success("Payment status updated successfully!");
        // Reload data
        const paymentsResponse = await fetch("/api/payments");
        const paymentsResult = await paymentsResponse.json();
        if (paymentsResponse.ok && paymentsResult.success) {
          const paymentsData: Payment[] = paymentsResult.data || [];
          setPayments(paymentsData);
          await computeAndSetStats(paymentsData);
        }
      } else {
        toastManager.error(result.message || "Failed to update payment status");
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      toastManager.error("Failed to update payment status. Please try again.");
    }
  };

  // Prepare enhanced stats for display
  const comparisonLabel = dateRange === 'today' ? 'vs yesterday' : dateRange === 'custom' ? '' : `compared to last ${dateRange}`;
  const displayStats = [
    {
      title: "Total Revenue",
      value: `EBR ${stats.totalRevenue.toFixed(2)}`,
      change: dateRange === 'custom' ? undefined : comparisonLabel,
      changeType: "positive" as const,
      icon: "💰",
    },
    {
      title: "Drug Sales",
      value: `EBR ${stats.totalDrugSales.toFixed(2)}`,
      change: dateRange === 'custom' ? undefined : comparisonLabel,
      changeType: "positive" as const,
      icon: "💊",
    },
    {
      title: "Walk-in Services",
      value: `EBR ${stats.totalWalkInServices.toFixed(2)}`,
      change: dateRange === 'custom' ? undefined : comparisonLabel,
      changeType: "positive" as const,
      icon: "🏥",
    },
  ];

  return (
    <>
      <DashboardLayout
        title="Payment Records"
        userRole={userRole}
        userName={userName}
      >
        <div className="space-y-6 overflow-x-hidden">
          {/* Stats Cards */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-text-secondary">Summary</div>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={dateRange}
                  onChange={async (e) => {
                    const val = e.target.value as any;
                    setDateRange(val);
                    await computeAndSetStats(payments);
                  }}
                  className="w-full sm:w-auto border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background"
                >
                  <option value="today">Today</option>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                  <option value="year">This year</option>
                  <option value="custom">Custom</option>
                </select>
                {dateRange === 'custom' && (
                  <div className="flex gap-3">
                    <input
                      type="date"
                      value={rangeStart}
                      onChange={async (e) => { setRangeStart(e.target.value); await computeAndSetStats(payments); }}
                      className="border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background"
                    />
                    <input
                      type="date"
                      value={rangeEnd}
                      onChange={async (e) => { setRangeEnd(e.target.value); await computeAndSetStats(payments); }}
                      className="border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background"
                    />
                  </div>
                )}
              </div>
            </div>
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
          </div>

          {/* Payment Records Section */}
          <div className="bg-card-bg rounded-lg border border-border-color p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h2 className="text-xl font-semibold text-text-primary">
                Payment Records
              </h2>
              <Button
                onClick={() => setIsNewPaymentModalOpen(true)}
                className="cursor-pointer bg-[#1447E6]  hover:bg-gray-700"
              >
                Record New Payment
              </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
              <input
                type="text"
                placeholder="Search payments by ID, patient, or drug order..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary placeholder-text-muted bg-background"
              />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full sm:w-auto border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background"
              >
                {PAYMENT_STATUS_OPTIONS.map((option) => (
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
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="w-full sm:w-auto border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background"
              >
                {PAYMENT_METHOD_OPTIONS.map((option) => (
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

            {/* Payments Table (desktop) or Cards (mobile/tablet) */}
            {isLgUp ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border-color">
                  <thead className="bg-card-bg">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                        <div className="block">
                          <span className="block">Payment ID</span>
                          <span className="block">Patient ID</span>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                        <div className="block">
                          <span className="block">Patient Name</span>
                          <span className="block">Drug Order ID</span>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-border-color">
                    {paginatedPayments.map((payment) => (
                      <tr key={payment._id} className="hover:bg-card-bg">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {payment.paymentId}
                            </span>
                            <span className="text-xs text-text-muted">
                              {payment.patientId}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {payment.patientName}
                            </span>
                            <span className="text-xs text-text-muted">
                              {(() => {
                                // Priority: drugOrderId > orderReference > orderId
                                const orderId =
                                  payment.drugOrderId ||
                                  payment.orderReference ||
                                  payment.orderId;
                                return orderId ? orderId : "N/A";
                              })()}
                            </span>
                            <span className="text-xs text-text-muted">
                              {payment.orderId
                                ? `Order: ${payment.orderId}`
                                : "No Order"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                          EBR {payment.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                          <div className="flex items-center">
                            <span className="mr-2">
                              {getMethodIcon(payment.paymentMethod)}
                            </span>
                            {payment.paymentMethod
                              .replace("_", " ")
                              .toUpperCase()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {userRole === "SUPER_ADMIN" ? (
                            <select
                              value={payment.paymentStatus.toLowerCase()}
                              onChange={(e) =>
                                handleStatusUpdate(
                                  payment.paymentId,
                                  e.target.value
                                )
                              }
                              className={`px-2 py-1 text-xs font-medium rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-accent-color ${getStatusColor(
                                payment.paymentStatus
                              )}`}
                            >
                              <option
                                value="completed"
                                className="bg-green-100 text-green-800"
                              >
                                COMPLETED
                              </option>
                              <option
                                value="pending"
                                className="bg-yellow-100 text-yellow-800"
                              >
                                PENDING
                              </option>
                              <option
                                value="failed"
                                className="bg-red-100 text-red-800"
                              >
                                FAILED
                              </option>
                              <option
                                value="refunded"
                                className="bg-blue-100 text-blue-800"
                              >
                                REFUNDED
                              </option>
                            </select>
                          ) : (
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                payment.paymentStatus
                              )}`}
                            >
                              {payment.paymentStatus.toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                          {formatDate(payment.updatedAt || payment.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewPayment(payment)}
                            className="text-accent-color hover:text-accent-hover mr-3 p-1 rounded hover:bg-accent-color/10 transition-colors cursor-pointer"
                            title="View Payment"
                          >
                            <FaEye size={16} />
                          </button>
                          <button
                            onClick={() => handleEditPayment(payment)}
                            className="text-success hover:text-success/80 mr-3 p-1 rounded hover:bg-success/10 transition-colors cursor-pointer"
                            title="Edit Payment"
                          >
                            <FaEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeletePayment(payment._id)}
                            className="text-error hover:text-error/80 p-1 rounded hover:bg-error/10 transition-colors cursor-pointer"
                            title="Delete Payment"
                          >
                            <FaTrash size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalFiltered > pageSize && (
                  <div className="mt-4">
                    <PaginationControls
                      page={page}
                      total={totalFiltered}
                      pageSize={pageSize}
                      onPageChange={setPage}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 overflow-x-hidden">
                {paginatedPayments.length === 0 && (
                  <div className="text-center py-8 text-text-secondary">
                    No payments found.
                  </div>
                )}
                {paginatedPayments.map((payment) => (
                  <div
                    key={payment._id}
                    className="border border-border-color rounded-lg p-3 bg-card-bg overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-text-primary break-words">
                          {payment.paymentId}
                        </div>
                        <div className="text-xs text-text-secondary break-words">
                          Date:{" "}
                          {formatDate(payment.updatedAt || payment.createdAt)}
                        </div>
                        <PaginationControls
                          page={page}
                          total={totalFiltered}
                          pageSize={pageSize}
                          onPageChange={setPage}
                        />
                      </div>
                      <div className="shrink-0">
                        {userRole === "SUPER_ADMIN" ? (
                          <select
                            value={payment.paymentStatus.toLowerCase()}
                            onChange={(e) =>
                              handleStatusUpdate(
                                payment.paymentId,
                                e.target.value
                              )
                            }
                            className={`px-2 py-1 text-xs font-medium rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-accent-color ${getStatusColor(
                              payment.paymentStatus
                            )}`}
                          >
                            <option value="completed">COMPLETED</option>
                            <option value="pending">PENDING</option>
                            <option value="failed">FAILED</option>
                            <option value="refunded">REFUNDED</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              payment.paymentStatus
                            )}`}
                          >
                            {payment.paymentStatus.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
                      <div className="min-w-0">
                        <div className="text-xs text-text-muted">Patient</div>
                        <div className="text-sm text-text-primary break-words">
                          {payment.patientName}
                        </div>
                        <div className="text-xs text-text-secondary break-words">
                          {payment.patientId}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-text-muted">Order</div>
                        <div className="text-sm text-text-primary break-words">
                          {payment.drugOrderId ||
                            payment.orderReference ||
                            payment.orderId ||
                            "N/A"}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-text-muted">Amount</div>
                        <div className="text-sm text-text-primary break-words">
                          EBR {payment.amount.toFixed(2)}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-text-muted">Method</div>
                        <div className="text-sm text-text-primary break-words">
                          {payment.paymentMethod
                            .replace("_", " ")
                            .toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        onClick={() => handleViewPayment(payment)}
                        className="text-accent-color hover:text-accent-hover p-1 rounded hover:bg-accent-color/10 transition-colors cursor-pointer"
                        title="View Payment"
                      >
                        <FaEye size={16} />
                      </button>
                      <button
                        onClick={() => handleEditPayment(payment)}
                        className="text-success hover:text-success/80 p-1 rounded hover:bg-success/10 transition-colors cursor-pointer"
                        title="Edit Payment"
                      >
                        <FaEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeletePayment(payment._id)}
                        className="text-error hover:text-error/80 p-1 rounded hover:bg-error/10 transition-colors cursor-pointer"
                        title="Delete Payment"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {totalFiltered > pageSize && (
                  <div className="pt-2">
                    <PaginationControls
                      page={page}
                      total={totalFiltered}
                      pageSize={pageSize}
                      onPageChange={setPage}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* New Payment Modal */}
        <Modal
          isOpen={isNewPaymentModalOpen}
          onClose={() => {
            setIsNewPaymentModalOpen(false);
            resetForm();
          }}
          title="Record New Payment"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Patient" required error={errors.patientId}>
                <Select
                  value={formData.patientId}
                  onChange={(e) => {
                    const selectedPatient = patients.find(
                      (p) => p.patientId === e.target.value
                    );
                    handleInputChange("patientId", e.target.value);
                    handleInputChange(
                      "patientName",
                      selectedPatient
                        ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                        : ""
                    );

                    // Fetch drug orders for the selected patient
                    if (e.target.value) {
                      fetchDrugOrdersForPatient(e.target.value);
                    } else {
                      setDrugOrders([]);
                    }

                    // Reset order-related fields when patient changes
                    handleInputChange("orderId", "");
                    handleInputChange("orderReference", "");
                  }}
                  options={PATIENT_OPTIONS}
                />
              </FormField>

              <FormField label="Patient ID" required error={errors.patientId}>
                <Input
                  value={formData.patientId}
                  onChange={(e) =>
                    handleInputChange("patientId", e.target.value)
                  }
                  placeholder="Enter patient ID"
                />
              </FormField>

              <FormField label="Amount (EBR)" required error={errors.amount}>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  placeholder="Enter amount"
                  min="0"
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
                  options={[
                    { value: "cash", label: "Cash" },
                    { value: "card", label: "Card" },
                    { value: "mobile_money", label: "Mobile Money" },
                  ]}
                />
              </FormField>

              <FormField label="Status" required error={errors.paymentStatus}>
                <Select
                  value={formData.paymentStatus}
                  onChange={(e) =>
                    handleInputChange("paymentStatus", e.target.value)
                  }
                  options={[
                    { value: "completed", label: "Completed" },
                    { value: "pending", label: "Pending" },
                    { value: "failed", label: "Failed" },
                    { value: "refunded", label: "Refunded" },
                  ]}
                />
              </FormField>
              <FormField label="Reference Number">
                <Input
                  value={formData.transactionReference}
                  onChange={(e) =>
                    handleInputChange("transactionReference", e.target.value)
                  }
                  placeholder="Enter reference number (optional)"
                />
              </FormField>
            </div>

            <FormField label="Drug Order ID (Optional)" error={errors.orderId}>
              <Select
                value={formData.orderId}
                onChange={(e) => {
                  const selectedOrder = drugOrders.find(
                    (order) => order._id === e.target.value
                  );
                  handleInputChange("orderId", e.target.value);
                  // Use drugOrderId if available, otherwise use _id as fallback
                  const orderReference = selectedOrder
                    ? selectedOrder.drugOrderId || selectedOrder._id
                    : "";
                  handleInputChange("orderReference", orderReference);
                  handleInputChange("drugOrderId", orderReference);
                  handleInputChange("orderType", "DRUG_ORDER");
                }}
                options={[
                  { value: "", label: "Select Drug Order (Optional)" },
                  ...drugOrders.map((order) => ({
                    value: order._id,
                    label: `${order.drugOrderId || order._id} - ${
                      order.patientName || "Unknown Patient"
                    } (${(order.status || "").toString().toUpperCase()})`,
                  })),
                ]}
                disabled={!formData.patientId || drugOrders.length === 0}
              />
            </FormField>

            <FormField
              label="Notes/Description (Optional)"
              error={errors.notes}
            >
              <TextArea
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Enter payment description or notes..."
                rows={3}
              />
            </FormField>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsNewPaymentModalOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                className="hover:bg-gray-700 cursor-pointer bg-[#1447E6]"
                onClick={handleNewPayment}
                loading={loading}
              >
                Record Payment
              </Button>
            </div>
          </div>
        </Modal>

        {/* View Payment Modal */}
        <Modal
          isOpen={isViewPaymentModalOpen}
          onClose={() => {
            setIsViewPaymentModalOpen(false);
            setViewingPayment(null);
          }}
          title="Payment Details"
          size="md"
        >
          {viewingPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Payment ID
                  </label>
                  <p className="mt-1 text-sm text-text-primary">
                    {viewingPayment.paymentId || viewingPayment._id}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Patient
                  </label>
                  <p className="mt-1 text-sm text-text-primary">
                    {viewingPayment.patientName || viewingPayment.patientId}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Amount
                  </label>
                  <p className="mt-1 text-sm text-text-primary">
                    EBR {viewingPayment.amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Payment Method
                  </label>
                  <p className="mt-1 text-sm text-text-primary">
                    {viewingPayment.paymentMethod
                      ? viewingPayment.paymentMethod.replace("_", " ")
                      : "Unknown"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Status
                  </label>
                  <span
                    className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      viewingPayment.paymentStatus
                    )}`}
                  >
                    {viewingPayment.paymentStatus
                      ? viewingPayment.paymentStatus.toUpperCase()
                      : "UNKNOWN"}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Date
                  </label>
                  <p className="mt-1 text-sm text-text-primary">
                    {viewingPayment.createdAt
                      ? new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }).format(new Date(viewingPayment.createdAt))
                      : "Invalid Date"}
                  </p>
                </div>
              </div>

              {/* Full Description Section */}
              {(viewingPayment.fullDescription ||
                viewingPayment.notes ||
                (viewingPayment.items && viewingPayment.items.length > 0)) && (
                <div className="border-t border-border-color pt-4">
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Full Description
                  </label>
                  <div className="bg-card-bg rounded-md p-3 border border-border-color">
                    <p className="text-sm text-text-primary whitespace-pre-wrap">
                      {viewingPayment.fullDescription ||
                        (viewingPayment.paymentType === "DRUG_SALE"
                          ? viewingPayment.items
                              ?.map(
                                (item) => `${item.drugName} (${item.quantity})`
                              )
                              .join(", ")
                          : viewingPayment.notes) ||
                        "No description available"}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex justify-end pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsViewPaymentModalOpen(false);
                    setViewingPayment(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Edit Payment Modal */}
        <Modal
          isOpen={isEditPaymentModalOpen}
          onClose={() => {
            setIsEditPaymentModalOpen(false);
            setEditingPayment(null);
            resetForm();
          }}
          title="Edit Payment"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Patient" required error={errors.patientId}>
                <Select
                  value={formData.patientId}
                  onChange={(e) => {
                    const selectedPatient = patients.find(
                      (p) => p.patientId === e.target.value
                    );
                    handleInputChange("patientId", e.target.value);
                    handleInputChange(
                      "patientName",
                      selectedPatient
                        ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                        : ""
                    );

                    // Fetch drug orders for the selected patient
                    if (e.target.value) {
                      fetchDrugOrdersForPatient(e.target.value);
                    } else {
                      setDrugOrders([]);
                    }

                    // Reset order-related fields when patient changes
                    handleInputChange("orderId", "");
                    handleInputChange("orderReference", "");
                  }}
                  options={PATIENT_OPTIONS}
                />
              </FormField>

              <FormField label="Patient ID" required error={errors.patientId}>
                <Input
                  value={formData.patientId}
                  onChange={(e) =>
                    handleInputChange("patientId", e.target.value)
                  }
                  placeholder="Enter patient ID"
                />
              </FormField>

              <FormField label="Amount (EBR)" required error={errors.amount}>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  placeholder="Enter amount"
                  min="0"
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
                  options={[
                    { value: "cash", label: "Cash" },
                    { value: "card", label: "Card" },
                    { value: "mobile_money", label: "Mobile Money" },
                  ]}
                />
              </FormField>

              <FormField label="Status" required error={errors.paymentStatus}>
                <Select
                  value={formData.paymentStatus}
                  onChange={(e) =>
                    handleInputChange("paymentStatus", e.target.value)
                  }
                  options={[
                    { value: "completed", label: "Completed" },
                    { value: "pending", label: "Pending" },
                    { value: "failed", label: "Failed" },
                    { value: "refunded", label: "Refunded" },
                  ]}
                />
              </FormField>
            </div>

            <FormField
              label="Reference (Optional)"
              error={errors.transactionReference}
            >
              <Input
                value={formData.transactionReference}
                onChange={(e) =>
                  handleInputChange("transactionReference", e.target.value)
                }
                placeholder="Enter reference number"
              />
            </FormField>

            <FormField label="Drug Order ID (Optional)" error={errors.orderId}>
              <Select
                value={formData.orderId}
                onChange={(e) => {
                  const selectedOrder = drugOrders.find(
                    (order) => order._id === e.target.value
                  );
                  handleInputChange("orderId", e.target.value);
                  // Use drugOrderId if available, otherwise use _id as fallback
                  const orderReference = selectedOrder
                    ? selectedOrder.drugOrderId || selectedOrder._id
                    : "";
                  handleInputChange("orderReference", orderReference);
                  handleInputChange("drugOrderId", orderReference);
                  handleInputChange("orderType", "DRUG_ORDER");
                }}
                options={[
                  { value: "", label: "Select Drug Order (Optional)" },
                  ...drugOrders.map((order) => ({
                    value: order._id,
                    label: `${order.drugOrderId || order._id} - ${
                      order.patientName || "Unknown Patient"
                    }`,
                  })),
                ]}
                disabled={!formData.patientId || drugOrders.length === 0}
              />
            </FormField>

            <FormField
              label="Notes/Description (Optional)"
              error={errors.notes}
            >
              <TextArea
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Enter payment description or notes..."
                rows={3}
              />
            </FormField>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditPaymentModalOpen(false);
                  setEditingPayment(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                className="hover:bg-gray-700 cursor-pointer bg-[#1447E6]"
                onClick={handleUpdatePayment}
                loading={loading}
              >
                Update Payment
              </Button>
            </div>
          </div>
        </Modal>
      </DashboardLayout>
      {/* <Footer /> */}
    </>
  );
}
