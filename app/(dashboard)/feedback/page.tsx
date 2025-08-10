"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Feedback, FeedbackListResponse } from "@/types/feedback";
import { formatDate } from "@/utils/format";
import { useUserRole } from "@/hooks/useUserRole";
import { PaginationControls } from "@/components/ui/pagination";

interface FeedbackPageProps {}

export default function FeedbackPage({}: FeedbackPageProps) {
  const { user, userRole, userName, isLoaded } = useUserRole();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null
  );
  const [showViewModal, setShowViewModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLgUp, setIsLgUp] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      loadFeedback();
    }
  }, [currentPage, selectedStatus, searchEmail, isLoaded, user]);

  // Track viewport to toggle desktop table vs mobile/tablet cards
  useEffect(() => {
    const onResize = () =>
      setIsLgUp(typeof window !== "undefined" && window.innerWidth >= 1024);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "5",
        ...(selectedStatus !== "all" && { status: selectedStatus }),
        ...(searchEmail && { email: searchEmail }),
      });

      const response = await fetch(`/api/feedback?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: FeedbackListResponse = await response.json();

      if (result.success) {
        setFeedback(result.data);
        setTotalPages(result.pagination.pages);
        setTotalItems(result.pagination.total);
      } else {
        setError("Failed to load feedback");
        console.error("Failed to load feedback:", result);
      }
    } catch (error) {
      console.error("Error loading feedback:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred while loading feedback"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (feedbackId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Reload feedback to reflect changes
        loadFeedback();
      } else {
        console.error("Failed to update feedback status");
      }
    } catch (error) {
      console.error("Error updating feedback status:", error);
    }
  };

  const handleViewFeedback = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setShowViewModal(true);
  };

  // Use shared date formatter (date only)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "read":
        return "bg-blue-100 text-blue-800";
      case "replied":
        return "bg-green-100 text-green-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Show loading state while auth is being determined
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-color mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || userRole !== "SUPER_ADMIN") {
    return (
      <DashboardLayout
        title="Access Denied"
        userRole={userRole}
        userName={userName}
      >
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            Access Denied
          </h2>
          <p className="text-text-secondary">
            You don't have permission to view this page.
          </p>
          <p className="text-text-secondary mt-2">Current role: {userRole}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Feedback Management"
      userRole={userRole}
      userName={userName}
    >
      <div className="space-y-6 overflow-x-hidden">
        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Search by Email
                </label>
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => {
                    setSearchEmail(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Enter email to search..."
                  className="w-full px-3 py-2 border border-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-accent-color bg-background text-text-primary"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Status Filter
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-accent-color bg-background text-text-primary"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="read">Read</option>
                  <option value="replied">Replied</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback List */}
        <Card className="overflow-x-hidden">
          <CardHeader>
            <CardTitle>Feedback Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-color mx-auto"></div>
                <p className="mt-2 text-text-secondary">Loading feedback...</p>
              </div>
            ) : feedback.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-text-secondary">
                  No feedback submissions found.
                </p>
              </div>
            ) : isLgUp ? (
              <div className="overflow-x-auto -mx-2 md:mx-0">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-color text-text-secondary">
                      <th className="px-3 py-2 text-left font-medium">Name</th>
                      <th className="px-3 py-2 text-left font-medium">Email</th>
                      <th className="px-3 py-2 text-left font-medium">Phone</th>
                      <th className="px-3 py-2 text-left font-medium">
                        Company
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left font-medium">Date</th>
                      <th className="px-3 py-2 text-left font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedback.map((item) => (
                      <tr
                        key={item._id}
                        className="border-b border-border-color text-text-primary"
                      >
                        <td className="px-3 py-2 whitespace-nowrap">
                          {item.firstName} {item.lastName}
                        </td>
                        <td className="px-3 py-2 break-words">{item.email}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {item.phone}
                        </td>
                        <td className="px-3 py-2 break-words">
                          {item.company || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              item.status
                            )}`}
                          >
                            {getStatusText(item.status)}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewFeedback(item)}
                            >
                              View
                            </Button>
                            <select
                              value={item.status}
                              onChange={(e) =>
                                handleStatusUpdate(item._id, e.target.value)
                              }
                              className="text-xs px-2 py-1 border border-border-color rounded bg-background text-text-primary"
                            >
                              <option value="pending">Pending</option>
                              <option value="read">Read</option>
                              <option value="replied">Replied</option>
                              <option value="archived">Archived</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-4">
                {feedback.map((item) => (
                  <div
                    key={item._id}
                    className="border border-border-color rounded-lg p-4 bg-background"
                  >
                    <div className="flex flex-col gap-2 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-text-primary truncate">
                          {item.firstName} {item.lastName}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {getStatusText(item.status)}
                        </span>
                      </div>
                      <p className="text-text-secondary text-sm break-words">
                        {item.email}
                      </p>
                      <p className="text-text-secondary text-sm break-words">
                        {item.phone}
                      </p>
                      {item.company && (
                        <p className="text-text-secondary text-sm break-words">
                          Company: {item.company}
                        </p>
                      )}
                      <p className="text-text-primary text-sm break-words">
                        {item.message}
                      </p>
                      <p className="text-text-secondary text-xs mt-1">
                        Submitted: {formatDate(item.createdAt)}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewFeedback(item)}
                        >
                          View
                        </Button>
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleStatusUpdate(item._id, e.target.value)
                          }
                          className="text-xs px-2 py-1 border border-border-color rounded bg-background text-text-primary"
                        >
                          <option value="pending">Pending</option>
                          <option value="read">Read</option>
                          <option value="replied">Replied</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <PaginationControls
              page={currentPage}
              total={totalItems}
              pageSize={5}
              onPageChange={setCurrentPage}
              className="mt-6"
            />
          </CardContent>
        </Card>
      </div>

      {/* View Feedback Modal */}
      {showViewModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card-bg rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-text-primary">
                Feedback Details
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary">
                    Name
                  </label>
                  <p className="text-text-primary">
                    {selectedFeedback.firstName} {selectedFeedback.lastName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary">
                    Email
                  </label>
                  <p className="text-text-primary">{selectedFeedback.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary">
                    Phone
                  </label>
                  <p className="text-text-primary">{selectedFeedback.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary">
                    Company
                  </label>
                  <p className="text-text-primary">
                    {selectedFeedback.company || "Not provided"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary">
                    Status
                  </label>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      selectedFeedback.status
                    )}`}
                  >
                    {getStatusText(selectedFeedback.status)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary">
                    Submitted
                  </label>
                  <p className="text-text-primary">
                    {formatDate(selectedFeedback.createdAt)}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Message
                </label>
                <div className="bg-background p-4 rounded border border-border-color">
                  <p className="text-text-primary whitespace-pre-wrap">
                    {selectedFeedback.message}
                  </p>
                </div>
              </div>

              {selectedFeedback.ipAddress && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary">
                    IP Address
                  </label>
                  <p className="text-text-primary text-sm">
                    {selectedFeedback.ipAddress}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
