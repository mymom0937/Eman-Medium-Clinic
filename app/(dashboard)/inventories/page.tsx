"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import Footer from "@/components/Footer";
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
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { PaginationControls } from "@/components/ui/pagination";
import Image from "next/image";
import { assets } from "@/assets/assets";

interface Drug {
  _id: string;
  name: string;
  description: string;
  category: string;
  sellingPrice: number; // Changed from 'price' to match API response
  stockQuantity: number; // Changed from 'quantity' to match API response
  imageUrl: string;
  manufacturer: string;
  expiryDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface InventoryStats {
  totalDrugs: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
}

export default function InventoryPage() {
  const { userRole, userName, isLoaded } = useUserRole();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  // Viewport-based rendering toggle (lg breakpoint: 1024px)
  const [isLgUp, setIsLgUp] = useState<boolean>(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingDrug, setEditingDrug] = useState<Drug | null>(null);
  const [viewingDrug, setViewingDrug] = useState<Drug | null>(null);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalDrugs: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalValue: 0,
  });
  // Date range controls for stats
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [rangeStart, setRangeStart] = useState<string>('');
  const [rangeEnd, setRangeEnd] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    quantity: "",
    unitPrice: "",
    expiryDate: "",
    supplier: "",
    status: "in_stock",
    description: "",
  });
  const [errors, setErrors] = useState<Partial<any>>({});

  // Image upload state
  const [drugImages, setDrugImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  // Custom entry states for category and manufacturer
  const CUSTOM_CATEGORY_VALUE = "__CUSTOM_CATEGORY__";
  const CUSTOM_SUPPLIER_VALUE = "__CUSTOM_SUPPLIER__";
  const [customCategory, setCustomCategory] = useState<string>("");
  const [customSupplier, setCustomSupplier] = useState<string>("");

  // Pagination (moved above conditional return to preserve hook order)
  const [page, setPage] = useState(1);
  const pageSize = 5;
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCategory, selectedStatus]);

  // Load drugs data on component mount
  useEffect(() => {
    const loadDrugs = async () => {
      try {
        setInitialLoading(true);
        const response = await fetch("/api/drugs");
        const result = await response.json();

        if (response.ok && result.success) {
          // Transform API data to match frontend format
          const transformedDrugs = result.data.map((drug: any) => ({
            _id: drug._id,
            name: drug.name,
            description: drug.description || "",
            category: drug.category,
            sellingPrice: drug.sellingPrice,
            stockQuantity: drug.stockQuantity,
            imageUrl: drug.imageUrl || "",
            manufacturer: drug.manufacturer,
            expiryDate: drug.expiryDate,
            createdAt: drug.createdAt,
            updatedAt: drug.updatedAt,
          }));

          setDrugs(transformedDrugs);

          // Calculate stats (initially with whole dataset; will be recomputed below as well)
          const computeStats = (source: Drug[]) => {
            const totalDrugs = source.length;
            const lowStockItems = source.filter(
              (drug: Drug) => drug.stockQuantity <= 10 && drug.stockQuantity > 0
            ).length;
            const outOfStockItems = source.filter(
              (drug: Drug) => drug.stockQuantity === 0
            ).length;
            const totalValue = source.reduce(
              (sum: number, drug: Drug) =>
                sum + drug.sellingPrice * drug.stockQuantity,
              0
            );
            setStats({ totalDrugs, lowStockItems, outOfStockItems, totalValue });
          };

          // Apply current date range filter
          const { start, end } = getRangeBounds();
          const inRange = transformedDrugs.filter((d: Drug) => {
            const created = new Date(d.createdAt || d.updatedAt || Date.now());
            return (!start || created >= start) && (!end || created <= end);
          });
          computeStats(inRange);
        }
      } catch (error) {
        console.error("Error loading drugs:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    if (isLoaded) {
      loadDrugs();
    }
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

  // Helper: compute date range bounds from selection
  const getRangeBounds = () => {
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
    return { start, end };
  };

  // Recompute stats when date range or drugs change
  useEffect(() => {
    if (!drugs.length) return;
    const { start, end } = getRangeBounds();
    const inRange = drugs.filter((d) => {
      const created = new Date(d.createdAt || d.updatedAt || Date.now());
      return (!start || created >= start) && (!end || created <= end);
    });
    const totalDrugs = inRange.length;
    const lowStockItems = inRange.filter((drug: Drug) => drug.stockQuantity <= 10 && drug.stockQuantity > 0).length;
    const outOfStockItems = inRange.filter((drug: Drug) => drug.stockQuantity === 0).length;
    const totalValue = inRange.reduce((sum: number, drug: Drug) => sum + drug.sellingPrice * drug.stockQuantity, 0);
    setStats({ totalDrugs, lowStockItems, outOfStockItems, totalValue });
  }, [dateRange, rangeStart, rangeEnd, drugs]);

  if (!isLoaded || initialLoading) {
    return (
      <DashboardLayout
        title="Inventories"
        userRole={userRole}
        userName={userName}
      >
        <div className="flex items-center justify-center h-[60vh]">
          <PageLoader text="Loading inventory..." />
        </div>
      </DashboardLayout>
    );
  }

  // Image upload handlers
  const handleImageUpload = (index: number, file: File | null) => {
    const updatedImages = [...drugImages];
    const updatedPreviewUrls = [...imagePreviewUrls];

    if (file) {
      updatedImages[index] = file;
      updatedPreviewUrls[index] = URL.createObjectURL(file);
    } else {
      updatedImages[index] = null as any;
      updatedPreviewUrls[index] = "";
    }

    setDrugImages(updatedImages);
    setImagePreviewUrls(updatedPreviewUrls);
  };

  const resetImageState = () => {
    setDrugImages([]);
    setImagePreviewUrls([]);
  };

  // Filter drugs based on search, category, and status
  const filteredDrugs = drugs.filter((drug) => {
    const matchesSearch =
      searchTerm === "" ||
      drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Handle category filtering - direct comparison since categories now match database format
    const matchesCategory =
      selectedCategory === "all" ||
      drug.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesStatus =
      selectedStatus === "all" ||
      getDrugStatus(drug.stockQuantity).toLowerCase() === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination derived values
  const totalFiltered = filteredDrugs.length;
  const paginatedDrugs = filteredDrugs.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const getDrugStatus = (quantity: number): string => {
    if (quantity === 0) return "out_of_stock";
    if (quantity <= 10) return "low_stock";
    return "in_stock";
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "in_stock":
        return "bg-green-100 text-green-800";
      case "low_stock":
        return "bg-yellow-100 text-yellow-800";
      case "out_of_stock":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "in_stock":
        return "IN STOCK";
      case "low_stock":
        return "LOW STOCK";
      case "out_of_stock":
        return "OUT OF STOCK";
      default:
        return status.toUpperCase();
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
    const newErrors: Partial<any> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Drug name is required";
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
    } else if (
      formData.category === CUSTOM_CATEGORY_VALUE && !customCategory.trim()
    ) {
      newErrors.category = "Please enter a custom category";
    }
    if (!formData.quantity || parseInt(formData.quantity) < 0) {
      newErrors.quantity = "Valid quantity is required";
    }
    if (!formData.unitPrice || parseFloat(formData.unitPrice) <= 0) {
      newErrors.unitPrice = "Valid unit price is required";
    }
    if (!formData.expiryDate) {
      newErrors.expiryDate = "Expiry date is required";
    }
    if (!formData.supplier) {
      newErrors.supplier = "Manufacturer is required";
    } else if (
      formData.supplier === CUSTOM_SUPPLIER_VALUE && !customSupplier.trim()
    ) {
      newErrors.supplier = "Please enter a custom manufacturer";
    }
    // Status is now optional - no validation needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddDrug = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      const categoryForSubmit =
        formData.category === CUSTOM_CATEGORY_VALUE
          ? customCategory.trim()
          : formData.category.replace("_", " ");
      formDataToSend.append("category", categoryForSubmit);
      formDataToSend.append("price", formData.unitPrice);
      formDataToSend.append("quantity", formData.quantity);
      const manufacturerForSubmit =
        formData.supplier === CUSTOM_SUPPLIER_VALUE
          ? customSupplier.trim()
          : formData.supplier.replace("_", " ");
      formDataToSend.append("manufacturer", manufacturerForSubmit);
      formDataToSend.append("expiryDate", formData.expiryDate);

      // Add images to form data
      drugImages.forEach((image, index) => {
        if (image) {
          formDataToSend.append("images", image);
        }
      });

      const response = await fetch("/api/drugs", {
        method: "POST",
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add drug");
      }

      // Reload drugs data
      const drugsResponse = await fetch("/api/drugs");
      const drugsResult = await drugsResponse.json();

      if (drugsResponse.ok && drugsResult.success) {
        setDrugs(drugsResult.data);

        // Recalculate stats
        const totalDrugs = drugsResult.data.length;
        const lowStockItems = drugsResult.data.filter(
          (drug: Drug) => drug.stockQuantity <= 10 && drug.stockQuantity > 0
        ).length;
        const outOfStockItems = drugsResult.data.filter(
          (drug: Drug) => drug.stockQuantity === 0
        ).length;
        const totalValue = drugsResult.data.reduce(
          (sum: number, drug: Drug) =>
            sum + drug.sellingPrice * drug.stockQuantity,
          0
        );

        setStats({
          totalDrugs,
          lowStockItems,
          outOfStockItems,
          totalValue,
        });
      }

      setIsAddModalOpen(false);
      resetForm();
      resetImageState();
      toastManager.success("Drug added successfully!");
    } catch (error) {
      console.error("Error adding drug:", error);
      toastManager.error("Failed to add drug. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditDrug = (drug: Drug) => {
    setEditingDrug(drug);
    // Determine whether category/manufacturer are from presets or custom
    const normalized = (s: string) => s.toLowerCase();

    // Category handling
    const presetCategoryValues = [
      "pain relief",
      "antibiotics",
      "vitamins",
      "diabetes",
      "hypertension",
      "respiratory",
      "gastrointestinal",
      "other",
    ];
    const incomingCategory = normalized(drug.category);
    const isKnownCategory = presetCategoryValues.includes(incomingCategory);

    // Supplier handling presets (values use underscores in options)
    const presetSupplierValues = [
      "pharmacorp",
      "medsupply",
      "healthcare_plus",
      "medical_express",
      "other",
    ];
    const incomingSupplier = drug.manufacturer
      ? drug.manufacturer.toLowerCase().replace(/\s+/g, "_")
      : "";
    const isKnownSupplier = presetSupplierValues.includes(incomingSupplier);

    setFormData({
      name: drug.name,
      category: isKnownCategory ? incomingCategory : CUSTOM_CATEGORY_VALUE,
      quantity: drug.stockQuantity.toString(),
      unitPrice: drug.sellingPrice.toString(),
      expiryDate: drug.expiryDate || "",
      supplier: isKnownSupplier ? incomingSupplier : CUSTOM_SUPPLIER_VALUE,
      status: getDrugStatus(drug.stockQuantity).toLowerCase(),
      description: drug.description || "",
    });

    setCustomCategory(isKnownCategory ? "" : drug.category);
    setCustomSupplier(isKnownSupplier ? "" : drug.manufacturer);

    // Set existing image if available
    if (drug.imageUrl) {
      setImagePreviewUrls([drug.imageUrl]);
    } else {
      setImagePreviewUrls([]);
    }
    setDrugImages([]);

    setIsEditModalOpen(true);
  };

  const handleUpdateDrug = async () => {
    if (!validateForm() || !editingDrug) return;

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      const categoryForSubmit =
        formData.category === CUSTOM_CATEGORY_VALUE
          ? customCategory.trim()
          : formData.category.replace("_", " ");
      formDataToSend.append("category", categoryForSubmit);
      formDataToSend.append("price", formData.unitPrice);
      formDataToSend.append("quantity", formData.quantity);
      const manufacturerForSubmit =
        formData.supplier === CUSTOM_SUPPLIER_VALUE
          ? customSupplier.trim()
          : formData.supplier.replace("_", " ");
      formDataToSend.append("manufacturer", manufacturerForSubmit);
      formDataToSend.append("expiryDate", formData.expiryDate);

      // Add new images to form data
      drugImages.forEach((image, index) => {
        if (image) {
          formDataToSend.append("images", image);
        }
      });

      const response = await fetch(`/api/drugs/${editingDrug._id}`, {
        method: "PUT",
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error("Failed to update drug");
      }

      // Reload drugs data
      const drugsResponse = await fetch("/api/drugs");
      const drugsResult = await drugsResponse.json();

      if (drugsResponse.ok && drugsResult.success) {
        setDrugs(drugsResult.data);

        // Recalculate stats
        const totalDrugs = drugsResult.data.length;
        const lowStockItems = drugsResult.data.filter(
          (drug: Drug) => drug.stockQuantity <= 10 && drug.stockQuantity > 0
        ).length;
        const outOfStockItems = drugsResult.data.filter(
          (drug: Drug) => drug.stockQuantity === 0
        ).length;
        const totalValue = drugsResult.data.reduce(
          (sum: number, drug: Drug) =>
            sum + drug.sellingPrice * drug.stockQuantity,
          0
        );

        setStats({
          totalDrugs,
          lowStockItems,
          outOfStockItems,
          totalValue,
        });
      }

      setIsEditModalOpen(false);
      setEditingDrug(null);
      resetForm();
      resetImageState();
      toastManager.success("Drug updated successfully!");
    } catch (error) {
      console.error("Error updating drug:", error);
      toastManager.error("Failed to update drug. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDrug = async (drugId: string) => {
    if (!confirm("Are you sure you want to delete this drug?")) return;

    try {
      const response = await fetch(`/api/drugs/${drugId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete drug");
      }

      // Reload drugs data
      const drugsResponse = await fetch("/api/drugs");
      const drugsResult = await drugsResponse.json();

      if (drugsResponse.ok && drugsResult.success) {
        setDrugs(drugsResult.data);

        // Recalculate stats
        const totalDrugs = drugsResult.data.length;
        const lowStockItems = drugsResult.data.filter(
          (drug: Drug) => drug.stockQuantity <= 10 && drug.stockQuantity > 0
        ).length;
        const outOfStockItems = drugsResult.data.filter(
          (drug: Drug) => drug.stockQuantity === 0
        ).length;
        const totalValue = drugsResult.data.reduce(
          (sum: number, drug: Drug) =>
            sum + drug.sellingPrice * drug.stockQuantity,
          0
        );

        setStats({
          totalDrugs,
          lowStockItems,
          outOfStockItems,
          totalValue,
        });
      }

      toastManager.success("Drug deleted successfully!");
    } catch (error) {
      console.error("Error deleting drug:", error);
      toastManager.error("Failed to delete drug. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      quantity: "",
      unitPrice: "",
      expiryDate: "",
      supplier: "",
      status: "",
      description: "",
    });
    setErrors({});
    setCustomCategory("");
    setCustomSupplier("");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // If status is changed, update quantity accordingly
    if (field === "status") {
      let newQuantity = 0;
      let statusMessage = "";
      switch (value) {
        case "out_of_stock":
          newQuantity = 0;
          statusMessage = "Quantity set to 0 (Out of Stock)";
          break;
        case "low_stock":
          newQuantity = 5; // Set to low stock level
          statusMessage = "Quantity set to 5 (Low Stock)";
          break;
        case "in_stock":
          newQuantity = 50; // Set to a reasonable in-stock level
          statusMessage = "Quantity set to 50 (In Stock)";
          break;
        default:
          newQuantity = parseInt(formData.quantity) || 0;
      }
      setFormData((prev) => ({ ...prev, quantity: newQuantity.toString() }));

      // Show a brief toast notification
      toastManager.info(statusMessage);
    }

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleViewDrug = (drug: Drug) => {
    setViewingDrug(drug);
    setIsViewModalOpen(true);
  };

  // Prepare stats for display
  const comparisonLabel = dateRange === 'today' ? 'vs yesterday' : dateRange === 'custom' ? '' : `compared to last ${dateRange}`;
  const displayStats = [
    {
      title: "Total Drugs",
      value: stats.totalDrugs.toString(),
      change: dateRange === 'custom' ? undefined : comparisonLabel,
      changeType: "positive" as const,
      icon: "💊",
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockItems.toString(),
      change: dateRange === 'custom' ? undefined : comparisonLabel,
      changeType: "negative" as const,
      icon: "⚠️",
    },
    {
      title: "Out of Stock",
      value: stats.outOfStockItems.toString(),
      change: dateRange === 'custom' ? undefined : comparisonLabel,
      changeType: "negative" as const,
      icon: "❌",
    },
    {
      title: "Total Value",
      value: `EBR ${stats.totalValue.toFixed(2)}`,
      change: dateRange === 'custom' ? undefined : comparisonLabel,
      changeType: "positive" as const,
      icon: "💰",
    },
  ];

  // Category options for filtering (includes All)
  const DRUG_CATEGORY_FILTER_OPTIONS = [
    { value: "all", label: "All Categories" },
    { value: "pain relief", label: "Pain Relief" },
    { value: "antibiotics", label: "Antibiotics" },
    { value: "vitamins", label: "Vitamins" },
    { value: "diabetes", label: "Diabetes" },
    { value: "hypertension", label: "Hypertension" },
    { value: "respiratory", label: "Respiratory" },
    { value: "gastrointestinal", label: "Gastrointestinal" },
    // { value: "other", label: "Other" },
  ];

  // Category options for forms (no All, includes custom option)
  const DRUG_CATEGORIES_FORM = [
    { value: "pain relief", label: "Pain Relief" },
    { value: "antibiotics", label: "Antibiotics" },
    { value: "vitamins", label: "Vitamins" },
    { value: "diabetes", label: "Diabetes" },
    { value: "hypertension", label: "Hypertension" },
    { value: "respiratory", label: "Respiratory" },
    { value: "gastrointestinal", label: "Gastrointestinal" },
    // { value: "other", label: "Other" },
    { value: CUSTOM_CATEGORY_VALUE, label: "Other (Add New)" },
  ];

  const DRUG_STATUS_OPTIONS = [
    { value: "all", label: "All Status" },
    { value: "in_stock", label: "In Stock" },
    { value: "low_stock", label: "Low Stock" },
    { value: "out_of_stock", label: "Out of Stock" },
  ];

  const DRUG_STATUS_OPTIONS_FORM = [
    { value: "", label: "Select Status (Optional)" },
    { value: "in_stock", label: "In Stock" },
    { value: "low_stock", label: "Low Stock" },
    { value: "out_of_stock", label: "Out of Stock" },
  ];

  const SUPPLIERS = [
    { value: "pharmacorp", label: "PharmaCorp" },
    { value: "medsupply", label: "MedSupply" },
    { value: "healthcare_plus", label: "Healthcare Plus" },
    { value: "medical_express", label: "Medical Express" },
    { value: "other", label: "Other" },
  ];

  // Supplier options for forms (replace generic Other with custom input option)
  const SUPPLIERS_FORM = [
    ...SUPPLIERS.filter((s) => s.value !== "other"),
    { value: CUSTOM_SUPPLIER_VALUE, label: "Other (Add New)" },
  ];

  return (
    <>
      <DashboardLayout
        title="Inventory Management"
        userRole={userRole}
        userName={userName}
      >
        <div className="space-y-6">
          {/* Stats Controls + Cards */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-text-secondary">Summary</div>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
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
                      onChange={(e) => setRangeStart(e.target.value)}
                      className="border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background"
                    />
                    <input
                      type="date"
                      value={rangeEnd}
                      onChange={(e) => setRangeEnd(e.target.value)}
                      className="border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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

          {/* Drug Inventory Section */}
          <div className="bg-card-bg rounded-lg border border-border-color p-3 sm:p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
              <h2 className="text-lg sm:text-xl font-semibold text-text-primary">
                Drug Inventory
              </h2>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="cursor-pointer w-full sm:w-auto bg-[#1447E6]  hover:bg-gray-700"
              >
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
                {DRUG_CATEGORY_FILTER_OPTIONS.map((option) => (
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
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background text-sm"
              >
                {DRUG_STATUS_OPTIONS.map((option) => (
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

            {/* Drug Inventory Table (desktop) or Cards (mobile/tablet) */}
            {isLgUp ? (
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  <div className="block">
                    {paginatedDrugs.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-text-secondary">
                          No drugs found matching your criteria.
                        </p>
                        <p className="text-sm text-text-muted mt-2">
                          Try adjusting your search or filters.
                        </p>
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-border-color">
                        <thead className="bg-card-bg">
                          <tr>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                              DRUG
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                              CATEGORY
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                              QUANTITY
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                              UNIT PRICE
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                              MANUFACTURER
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                              EXPIRY DATE
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                              STATUS
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                              ACTIONS
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-background divide-y divide-border-color">
                          {paginatedDrugs.map((drug) => (
                            <tr key={drug._id} className="hover:bg-card-bg">
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <div className="text-xs sm:text-sm font-medium text-text-primary">
                                    {drug.name}
                                  </div>
                                  <div className="text-xs text-text-muted">
                                    {drug._id.slice(-6).toUpperCase()}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-text-secondary">
                                {drug.category.charAt(0).toUpperCase() +
                                  drug.category.slice(1)}
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-text-primary">
                                {drug.stockQuantity}
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-text-primary">
                                EBR {drug.sellingPrice.toFixed(2)}
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-text-secondary">
                                {drug.manufacturer.charAt(0).toUpperCase() +
                                  drug.manufacturer.slice(1)}
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-text-secondary">
                                {formatDate(drug.expiryDate)}
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                    getDrugStatus(drug.stockQuantity)
                                  )}`}
                                >
                                  {getStatusText(
                                    getDrugStatus(drug.stockQuantity)
                                  )}
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
                                  onClick={() => handleDeleteDrug(drug._id)}
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
              <div className="space-y-3">
                {paginatedDrugs.length === 0 && (
                  <div className="text-center py-8 text-text-secondary">
                    No drugs found.
                  </div>
                )}
                {paginatedDrugs.map((drug) => (
                  <div
                    key={drug._id}
                    className="border border-border-color rounded-lg p-3 bg-card-bg overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-text-primary break-words">
                          {drug.name}
                        </div>
                        <div className="text-xs text-text-secondary break-words">
                          ID: {drug._id.slice(-6).toUpperCase()}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          getDrugStatus(drug.stockQuantity)
                        )}`}
                      >
                        {getStatusText(getDrugStatus(drug.stockQuantity))}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 min-w-0">
                      <div className="min-w-0">
                        <div className="text-xs text-text-muted">Category</div>
                        <div className="text-sm text-text-primary break-words">
                          {drug.category}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-text-muted">
                          Manufacturer
                        </div>
                        <div className="text-sm text-text-primary break-words">
                          {drug.manufacturer}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-text-muted">Quantity</div>
                        <div className="text-sm text-text-primary break-words">
                          {drug.stockQuantity}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-text-muted">
                          Unit Price
                        </div>
                        <div className="text-sm text-text-primary break-words">
                          EBR {drug.sellingPrice.toFixed(2)}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-text-muted">Expiry</div>
                        <div className="text-sm text-text-primary break-words">
                          {formatDate(drug.expiryDate)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        onClick={() => handleViewDrug(drug)}
                        className="text-accent-color hover:text-accent-hover p-1 rounded hover:bg-accent-color/10 transition-colors cursor-pointer"
                        title="View Drug"
                      >
                        <FaEye size={16} />
                      </button>
                      <button
                        onClick={() => handleEditDrug(drug)}
                        className="text-success hover:text-success/80 p-1 rounded hover:bg-success/10 transition-colors cursor-pointer"
                        title="Edit Drug"
                      >
                        <FaEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteDrug(drug._id)}
                        className="text-error hover:text-error/80 p-1 rounded hover:bg-error/10 transition-colors cursor-pointer"
                        title="Delete Drug"
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

        {/* Add Drug Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            resetForm();
            resetImageState();
          }}
          title="Add New Drug"
          size="lg"
        >
          <div className="space-y-4">
            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Drug Images
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {[...Array(4)].map((_, index) => (
                  <label
                    key={index}
                    htmlFor={`image${index}`}
                    className="cursor-pointer"
                  >
                    <input
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleImageUpload(index, e.target.files[0]);
                        }
                      }}
                      type="file"
                      id={`image${index}`}
                      accept="image/*"
                      hidden
                    />
                    <div className="w-24 h-24 border border-border-color rounded-md overflow-hidden bg-background">
                      {imagePreviewUrls[index] ? (
                        <Image
                          src={imagePreviewUrls[index]}
                          alt="Drug image preview"
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                          unoptimized
                          onError={(e) => {
                            console.error(
                              "Error loading image preview:",
                              imagePreviewUrls[index]
                            );
                            // Hide the image container on error
                            const target = e.target as HTMLImageElement;
                            if (target.parentElement) {
                              target.parentElement.style.display = "none";
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-muted">
                          <Image
                            src={assets.upload_area}
                            alt="Upload area"
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Drug Name" required error={errors.name}>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter drug name"
                />
              </FormField>

              <FormField label="Category" required error={errors.category}>
                <div className="space-y-2">
                  <Select
                    value={formData.category}
                    onChange={(e) => {
                      handleInputChange("category", e.target.value);
                      if (e.target.value !== CUSTOM_CATEGORY_VALUE) {
                        setCustomCategory("");
                      }
                    }}
                    options={DRUG_CATEGORIES_FORM}
                  />
                  {formData.category === CUSTOM_CATEGORY_VALUE && (
                    <Input
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter custom category"
                    />
                  )}
                </div>
              </FormField>

              <FormField label="Quantity" required error={errors.quantity}>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) =>
                    handleInputChange("quantity", e.target.value)
                  }
                  placeholder="Enter quantity"
                  min="0"
                />
              </FormField>

              <FormField
                label="Unit Price (EBR)"
                required
                error={errors.unitPrice}
              >
                <Input
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) =>
                    handleInputChange("unitPrice", e.target.value)
                  }
                  placeholder="Enter unit price"
                  min="0"
                />
              </FormField>

              <FormField label="Expiry Date" required error={errors.expiryDate}>
                <Input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    handleInputChange("expiryDate", e.target.value)
                  }
                />
              </FormField>

              <FormField label="Manufacturer" required error={errors.supplier}>
                <div className="space-y-2">
                  <Select
                    value={formData.supplier}
                    onChange={(e) => {
                      handleInputChange("supplier", e.target.value);
                      if (e.target.value !== CUSTOM_SUPPLIER_VALUE) {
                        setCustomSupplier("");
                      }
                    }}
                    options={SUPPLIERS_FORM}
                  />
                  {formData.supplier === CUSTOM_SUPPLIER_VALUE && (
                    <Input
                      value={customSupplier}
                      onChange={(e) => setCustomSupplier(e.target.value)}
                      placeholder="Enter custom manufacturer"
                    />
                  )}
                </div>
              </FormField>

              <FormField label="Status" error={errors.status}>
                <Select
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  options={DRUG_STATUS_OPTIONS_FORM}
                />
              </FormField>
            </div>

            <FormField label="Description">
              <TextArea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
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
                  resetImageState();
                }}
              >
                Cancel
              </Button>
              <Button
                className="hover:bg-gray-700 cursor-pointer bg-[#1447E6]"
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
            resetImageState();
          }}
          title="Edit Drug"
          size="lg"
        >
          <div className="space-y-4">
            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Drug Images
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {[...Array(4)].map((_, index) => (
                  <label
                    key={index}
                    htmlFor={`editImage${index}`}
                    className="cursor-pointer"
                  >
                    <input
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleImageUpload(index, e.target.files[0]);
                        }
                      }}
                      type="file"
                      id={`editImage${index}`}
                      accept="image/*"
                      hidden
                    />
                    <div className="w-24 h-24 border border-border-color rounded-md overflow-hidden bg-background">
                      {imagePreviewUrls[index] ? (
                        <Image
                          src={imagePreviewUrls[index]}
                          alt="Drug image preview"
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                          unoptimized
                          onError={(e) => {
                            console.error(
                              "Error loading image preview:",
                              imagePreviewUrls[index]
                            );
                            // Hide the image container on error
                            const target = e.target as HTMLImageElement;
                            if (target.parentElement) {
                              target.parentElement.style.display = "none";
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-muted">
                          <Image
                            src={assets.upload_area}
                            alt="Upload area"
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Drug Name" required error={errors.name}>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter drug name"
                />
              </FormField>

              <FormField label="Category" required error={errors.category}>
                <div className="space-y-2">
                  <Select
                    value={formData.category}
                    onChange={(e) => {
                      handleInputChange("category", e.target.value);
                      if (e.target.value !== CUSTOM_CATEGORY_VALUE) {
                        setCustomCategory("");
                      }
                    }}
                    options={DRUG_CATEGORIES_FORM}
                  />
                  {formData.category === CUSTOM_CATEGORY_VALUE && (
                    <Input
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter custom category"
                    />
                  )}
                </div>
              </FormField>

              <FormField label="Quantity" required error={errors.quantity}>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) =>
                    handleInputChange("quantity", e.target.value)
                  }
                  placeholder="Enter quantity"
                  min="0"
                />
              </FormField>

              <FormField
                label="Unit Price (EBR)"
                required
                error={errors.unitPrice}
              >
                <Input
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) =>
                    handleInputChange("unitPrice", e.target.value)
                  }
                  placeholder="Enter unit price"
                  min="0"
                />
              </FormField>

              <FormField label="Expiry Date" required error={errors.expiryDate}>
                <Input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    handleInputChange("expiryDate", e.target.value)
                  }
                />
              </FormField>

              <FormField label="Manufacturer" required error={errors.supplier}>
                <div className="space-y-2">
                  <Select
                    value={formData.supplier}
                    onChange={(e) => {
                      handleInputChange("supplier", e.target.value);
                      if (e.target.value !== CUSTOM_SUPPLIER_VALUE) {
                        setCustomSupplier("");
                      }
                    }}
                    options={SUPPLIERS_FORM}
                  />
                  {formData.supplier === CUSTOM_SUPPLIER_VALUE && (
                    <Input
                      value={customSupplier}
                      onChange={(e) => setCustomSupplier(e.target.value)}
                      placeholder="Enter custom manufacturer"
                    />
                  )}
                </div>
              </FormField>

              <FormField label="Status" error={errors.status}>
                <Select
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  options={DRUG_STATUS_OPTIONS_FORM}
                />
              </FormField>
            </div>

            <FormField label="Description">
              <TextArea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
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
                  resetImageState();
                }}
              >
                Cancel
              </Button>
              <Button
                className="hover:bg-gray-700 cursor-pointer bg-[#1447E6]"
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
              {/* Drug Image Display */}
              {viewingDrug.imageUrl && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Drug Image
                  </label>
                  <div className="w-32 h-32 border border-border-color rounded-md overflow-hidden bg-background">
                    <Image
                      src={viewingDrug.imageUrl}
                      alt="Drug image"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                      unoptimized
                      onError={(e) => {
                        console.error(
                          "Error loading drug image:",
                          viewingDrug.imageUrl
                        );
                        // Hide the image container on error
                        const target = e.target as HTMLImageElement;
                        if (target.parentElement) {
                          target.parentElement.style.display = "none";
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Drug ID
                  </label>
                  <p className="mt-1 text-sm text-text-primary">
                    {viewingDrug._id}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Drug Name
                  </label>
                  <p className="mt-1 text-sm text-text-primary">
                    {viewingDrug.name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Category
                  </label>
                  <p className="mt-1 text-sm text-text-primary">
                    {viewingDrug.category}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Quantity
                  </label>
                  <p className="mt-1 text-sm text-text-primary">
                    {viewingDrug.stockQuantity}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Unit Price
                  </label>
                  <p className="mt-1 text-sm text-text-primary">
                    EBR {viewingDrug.sellingPrice.toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Expiry Date
                  </label>
                  <p className="mt-1 text-sm text-text-primary">
                    {formatDate(viewingDrug.expiryDate)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Manufacturer
                  </label>
                  <p className="mt-1 text-sm text-text-primary">
                    {viewingDrug.manufacturer}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Status
                  </label>
                  <span
                    className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      getDrugStatus(viewingDrug.stockQuantity)
                    )}`}
                  >
                    {getStatusText(getDrugStatus(viewingDrug.stockQuantity))}
                  </span>
                </div>
              </div>
              {viewingDrug.description && (
                <div>
                  <label className="block text-sm font-medium text-text-muted">
                    Description
                  </label>
                  <p className="mt-1 text-sm text-text-primary">
                    {viewingDrug.description}
                  </p>
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
      {/* <Footer /> */}
    </>
  );
}
