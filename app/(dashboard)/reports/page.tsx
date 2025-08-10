"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import Footer from "@/components/Footer";
import { StatsCard } from "@/components/dashboard/stats-card";
import { useUserRole } from "@/hooks/useUserRole";
import { PageLoader } from "@/components/common/loading-spinner";
import { Button } from "@/components/ui/form";
import { toastManager } from "@/lib/utils/toast";
import { PaginationControls } from "@/components/ui/pagination";
import {
  FaDownload,
  FaCalendar,
  FaChartBar,
  FaFileAlt,
  FaUsers,
  FaFlask,
  FaPills,
  FaBoxes,
  FaShoppingCart,
  FaCreditCard,
  FaChartLine,
  FaStethoscope,
} from "react-icons/fa";
import {
  REPORT_TYPES,
  DATE_RANGES,
  SCHEDULE_FREQUENCIES,
} from "@/constants/report-types";

interface ReportData {
  summary: any;
  [key: string]: any;
}

interface ReportMeta {
  reportType: string;
  dateRange: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
}

// Add icons to report types
const REPORT_TYPES_WITH_ICONS = [
  { ...REPORT_TYPES[0], icon: FaChartLine },
  { ...REPORT_TYPES[1], icon: FaUsers },
  { ...REPORT_TYPES[2], icon: FaFlask },
  { ...REPORT_TYPES[3], icon: FaPills },
  { ...REPORT_TYPES[4], icon: FaBoxes },
  { ...REPORT_TYPES[5], icon: FaShoppingCart },
  { ...REPORT_TYPES[6], icon: FaCreditCard },
  { ...REPORT_TYPES[7], icon: FaStethoscope },
];

export default function ReportsPage() {
  const { userRole, userName, isLoaded } = useUserRole();
  const [selectedReport, setSelectedReport] = useState("comprehensive");
  const [selectedDateRange, setSelectedDateRange] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [reportMeta, setReportMeta] = useState<ReportMeta | null>(null);
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [scheduledReports, setScheduledReports] = useState<any[]>([]);
  // Pagination for scheduled reports
  const [schedulePage, setSchedulePage] = useState(1);
  const schedulePageSize = 5;
  const totalSchedules = scheduledReports.length;
  const paginatedSchedules = scheduledReports.slice(
    (schedulePage - 1) * schedulePageSize,
    schedulePage * schedulePageSize
  );
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState("daily");
  const [scheduleEmail, setScheduleEmail] = useState("");
  // Viewport-based rendering toggle (lg breakpoint: 1024px)
  const [isLgUp, setIsLgUp] = useState<boolean>(true);

  // Load initial report data
  useEffect(() => {
    if (isLoaded) {
      generateReport();
    }
  }, [isLoaded, selectedReport, selectedDateRange, startDate, endDate]);

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

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: selectedReport,
        range: selectedDateRange,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const response = await fetch(`/api/reports?${params}`);
      const result = await response.json();
      console.log("Report data structure:", result.data);
      console.log("Overview data:", result.data?.overview);
      console.log("Lab Tests count:", result.data?.overview?.totalLabTests);

      if (response.ok && result.success) {
        setReportData(result.data);
        setReportMeta(result.meta);
        toastManager.success("Report generated successfully!");
      } else {
        throw new Error(result.error || "Failed to generate report");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toastManager.error("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (range: string) => {
    setSelectedDateRange(range);
    setShowCustomDate(range === "custom");
    if (range !== "custom") {
      setStartDate("");
      setEndDate("");
    }
  };

  const handleExportReport = async (format: string) => {
    if (!reportData) {
      toastManager.error("No report data available for export");
      return;
    }

    try {
      toastManager.success(
        `${format} export started. You will receive the file shortly.`
      );

      const response = await fetch("/api/reports/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportData,
          reportMeta,
          format,
        }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const contentDisposition = response.headers.get("content-disposition");
      let filename = `${format.toLowerCase()}_report.${format.toLowerCase()}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) filename = filenameMatch[1];
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toastManager.success(`${format} export completed successfully!`);
    } catch (error) {
      console.error("Error exporting report:", error);
      toastManager.error("Failed to export report");
    }
  };

  const handleScheduleReport = async () => {
    if (!scheduleEmail) {
      toastManager.error("Please enter an email address");
      return;
    }

    try {
      // Simulate scheduling
      const newSchedule = {
        id: Date.now(),
        reportType: selectedReport,
        frequency: scheduleFrequency,
        email: scheduleEmail,
        status: "active",
        createdAt: new Date().toISOString(),
      };

      setScheduledReports((prev) => [...prev, newSchedule]);
      setShowScheduleModal(false);
      setScheduleEmail("");
      toastManager.success("Report scheduled successfully!");
    } catch (error) {
      toastManager.error("Failed to schedule report");
    }
  };

  const getReportStats = () => {
    if (!reportData) return [];

    const stats = [];

    if (selectedReport === "comprehensive") {
      stats.push(
        {
          title: "Total Patients",
          value: reportData.overview?.totalPatients || 0,
          change: "+12% from last month",
          changeType: "positive" as const,
          icon: "👥",
        },
        {
          title: "Total Sales",
          value: reportData.overview?.totalSales || 0,
          change: "+8% from last month",
          changeType: "positive" as const,
          icon: "💰",
        },
        {
          title: "Lab Tests",
          value: reportData.overview?.totalLabTests || 0,
          change: "+15% from last month",
          changeType: "positive" as const,
          icon: "🧪",
        },
        {
          title: "Inventory Value",
          value: `EBR ${(reportData.financial?.inventoryValue || 0).toFixed(
            2
          )}`,
          change: "+5% from last month",
          changeType: "positive" as const,
          icon: "📦",
        }
      );
    } else if (reportData.summary) {
      // Generate stats based on report type
      const summary = reportData.summary;

      switch (selectedReport) {
        case "patients":
          stats.push(
            {
              title: "Total Patients",
              value: summary.totalPatients || 0,
              change: "+12% from last month",
              changeType: "positive" as const,
              icon: "👥",
            },
            {
              title: "Active Patients",
              value: summary.activePatients || 0,
              change: "+8% from last month",
              changeType: "positive" as const,
              icon: "✅",
            },
            {
              title: "New Patients",
              value: summary.newPatients || 0,
              change: "+15% from last month",
              changeType: "positive" as const,
              icon: "🆕",
            },
            {
              title: "Inactive Patients",
              value: summary.inactivePatients || 0,
              change: "-3% from last month",
              changeType: "negative" as const,
              icon: "⏸️",
            }
          );
          break;
        case "sales":
          stats.push(
            {
              title: "Total Sales",
              value: summary.totalSales || 0,
              change: "+8% from last month",
              changeType: "positive" as const,
              icon: "💰",
            },
            {
              title: "Total Revenue",
              value: `EBR ${(summary.totalRevenue || 0).toFixed(2)}`,
              change: "+12% from last month",
              changeType: "positive" as const,
              icon: "📈",
            },
            {
              title: "Average Sale",
              value: `EBR ${(summary.averageSale || 0).toFixed(2)}`,
              change: "+3% from last month",
              changeType: "positive" as const,
              icon: "📊",
            },
            {
              title: "Total Items",
              value: summary.totalItems || 0,
              change: "+10% from last month",
              changeType: "positive" as const,
              icon: "📦",
            }
          );
          break;
        case "walk-in-services":
          stats.push(
            {
              title: "Total Services",
              value: summary.totalServices || 0,
              change: "+15% from last month",
              changeType: "positive" as const,
              icon: "🏥",
            },
            {
              title: "Total Revenue",
              value: `EBR ${(summary.totalRevenue || 0).toFixed(2)}`,
              change: "+18% from last month",
              changeType: "positive" as const,
              icon: "💰",
            },
            {
              title: "Average Service Price",
              value: `EBR ${(summary.averageServicePrice || 0).toFixed(2)}`,
              change: "+5% from last month",
              changeType: "positive" as const,
              icon: "📊",
            },
            {
              title: "Completed Services",
              value: summary.completedServices || 0,
              change: "+12% from last month",
              changeType: "positive" as const,
              icon: "✅",
            }
          );
          break;
        default:
          // Generic stats for other report types
          Object.entries(summary)
            .slice(0, 4)
            .forEach(([key, value]) => {
              stats.push({
                title: key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase()),
                value:
                  typeof value === "number" ? value.toString() : String(value),
                change: "+5% from last month",
                changeType: "positive" as const,
                icon: "📊",
              });
            });
      }
    }

    return stats;
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    switch (selectedReport) {
      case "comprehensive":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card-bg rounded-lg border border-border-color p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Overview
                </h3>
                <div className="space-y-3">
                  {Object.entries(reportData.overview || {}).map(
                    ([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-text-secondary">
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())}
                        </span>
                        <span className="font-medium text-text-primary">
                          {String(value)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
              <div className="bg-card-bg rounded-lg border border-border-color p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Financial Summary
                </h3>
                <div className="space-y-3">
                  {Object.entries(reportData.financial || {}).map(
                    ([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-text-secondary">
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())}
                        </span>
                        <span className="font-medium text-text-primary">
                          {key.includes("Value") || key.includes("Revenue")
                            ? `EBR ${Number(value).toFixed(2)}`
                            : String(value)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
            <div className="bg-card-bg rounded-lg border border-border-color p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Performance Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(reportData.performance || {}).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="text-center p-4 bg-background rounded-lg"
                    >
                      <div className="text-2xl font-bold text-accent-color">
                        {Number(value).toFixed(1)}%
                      </div>
                      <div className="text-sm text-text-secondary">
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-card-bg rounded-lg border border-border-color p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Report Data
            </h3>
            {isLgUp ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border-color">
                  <thead className="bg-background">
                    <tr>
                      {Object.keys(reportData.summary || {}).map((key) => (
                        <th
                          key={key}
                          className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider"
                        >
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-card-bg divide-y divide-border-color">
                    <tr>
                      {Object.values(reportData.summary || {}).map(
                        (value, index) => (
                          <td
                            key={index}
                            className="px-4 py-3 text-sm text-text-primary break-words"
                          >
                            {typeof value === "number"
                              ? value.toLocaleString()
                              : String(value)}
                          </td>
                        )
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(reportData.summary || {}).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="p-3 rounded-lg border border-border-color bg-background"
                    >
                      <div className="text-xs text-text-muted break-words">
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </div>
                      <div className="mt-1 text-base font-semibold text-text-primary break-words">
                        {typeof value === "number"
                          ? value.toLocaleString()
                          : String(value)}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        );
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <DashboardLayout
        title="Reports & Analytics"
        userRole={userRole}
        userName={userName}
      >
        <div className="space-y-6 bg-background min-h-screen overflow-x-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-[60vh]">
              <PageLoader text="Generating report..." />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">
                    Reports & Analytics
                  </h1>
                  <p className="text-text-secondary mt-1">
                    Generate comprehensive reports and insights
                  </p>
                </div>
                <div className="mt-2 md:mt-0 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <Button
                    onClick={() => setShowScheduleModal(true)}
                    className="w-full sm:w-auto hover:bg-gray-700 cursor-pointer bg-[#1447E6]"
                  >
                    <FaCalendar className="mr-2" />
                    Schedule Report
                  </Button>
                  <Button
                    onClick={generateReport}
                    loading={loading}
                    className="w-full sm:w-auto bg-success hover:bg-success/90"
                  >
                    <FaChartBar className="mr-2" />
                    Generate Report
                  </Button>
                </div>
              </div>
              {/* Report Controls */}
              <div className="bg-card-bg rounded-lg border border-border-color p-4 sm:p-6">
                <h2 className="text-xl font-semibold text-text-primary mb-6">
                  Report Configuration
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Report Type
                    </label>
                    <select
                      value={selectedReport}
                      onChange={(e) => setSelectedReport(e.target.value)}
                      className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background"
                    >
                      {REPORT_TYPES_WITH_ICONS.map((option) => (
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
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Date Range
                    </label>
                    <select
                      value={selectedDateRange}
                      onChange={(e) => handleDateRangeChange(e.target.value)}
                      className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background"
                    >
                      {DATE_RANGES.map((option) => (
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
                  {showCustomDate && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
              {/* Stats Cards */}
              {reportData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {getReportStats().map((stat, index) => (
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
              )}
              {/* Report Content */}
              {reportData && renderReportContent()}
              {/* No Data State */}
              {!reportData && (
                <div className="bg-card-bg rounded-lg border border-border-color p-4 sm:p-6">
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📊</div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                      No Report Data
                    </h3>
                    <p className="text-text-secondary mb-4">
                      Click "Generate Report" to create your first report
                    </p>
                    <Button
                      onClick={generateReport}
                      className="bg-accent-color hover:bg-accent-hover"
                    >
                      <FaChartBar className="mr-2" />
                      Generate Report
                    </Button>
                  </div>
                </div>
              )}
              {/* Export Options */}
              {reportData && (
                <div className="bg-card-bg rounded-lg border border-border-color p-4 sm:p-6">
                  <h2 className="text-xl font-semibold text-text-primary mb-6">
                    Export Options
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      onClick={() => handleExportReport("PDF")}
                      className="w-full bg-error hover:bg-error/90"
                    >
                      <FaDownload className="mr-2" />
                      Export to PDF
                    </Button>
                    <Button
                      onClick={() => handleExportReport("Excel")}
                      className="w-full bg-success hover:bg-success/90"
                    >
                      <FaDownload className="mr-2" />
                      Export to Excel
                    </Button>
                    <Button
                      onClick={() => handleExportReport("CSV")}
                      className="w-full hover:bg-gray-700 cursor-pointer bg-[#1447E6]"
                    >
                      <FaDownload className="mr-2 " />
                      Export to CSV
                    </Button>
                  </div>
                </div>
              )}
              {/* Scheduled Reports */}
              <div className="bg-card-bg rounded-lg border border-border-color p-4 sm:p-6">
                <h2 className="text-xl font-semibold text-text-primary mb-6">
                  Scheduled Reports
                </h2>
                {totalSchedules > 0 ? (
                  <div className="space-y-4">
                    {paginatedSchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-center justify-between p-4 bg-background rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-text-primary">
                            {
                              REPORT_TYPES_WITH_ICONS.find(
                                (r) => r.value === schedule.reportType
                              )?.label
                            }{" "}
                            - {schedule.frequency}
                          </div>
                          <div className="text-sm text-text-secondary">
                            {schedule.email}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              schedule.status === "active"
                                ? "bg-success/10 text-success"
                                : "bg-error/10 text-error"
                            }`}
                          >
                            {schedule.status}
                          </span>
                          <Button
                            onClick={() =>
                              setScheduledReports((prev) =>
                                prev.filter((s) => s.id !== schedule.id)
                              )
                            }
                            className="bg-error hover:bg-error/90"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ))}
                    <PaginationControls
                      page={schedulePage}
                      total={totalSchedules}
                      pageSize={schedulePageSize}
                      onPageChange={setSchedulePage}
                    />
                  </div>
                ) : (
                  <div className="text-text-secondary">
                    No scheduled reports
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Schedule Report Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card-bg rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Schedule Report
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Frequency
                  </label>
                  <select
                    value={scheduleFrequency}
                    onChange={(e) => setScheduleFrequency(e.target.value)}
                    className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background"
                  >
                    {SCHEDULE_FREQUENCIES.map((option) => (
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

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={scheduleEmail}
                    onChange={(e) => setScheduleEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color text-text-primary bg-background"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setShowScheduleModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleScheduleReport}
                  className="hover:bg-gray-700 cursor-pointer bg-[#1447E6]"
                >
                  Schedule Report
                </Button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
      {/* <Footer /> */}
    </>
  );
}
