"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useUserRole } from "@/hooks/useUserRole";
import { useUser } from "@clerk/nextjs";
import { toastManager } from "@/lib/utils/toast";

export default function ProfilePage() {
  const { userRole, userName, userEmail } = useUserRole();
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: userEmail,
    phone: user?.phoneNumbers?.[0]?.phoneNumber || "",
    role: userRole,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      // In a real app, you would update the user profile here
      // For now, we'll just simulate the update
      console.log("Saving profile:", formData);
      setIsEditing(false);

      // Show success toast
      toastManager.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toastManager.error("Failed to update profile. Please try again.");
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: userEmail,
      phone: user?.phoneNumbers?.[0]?.phoneNumber || "",
      role: userRole,
    });
    setIsEditing(false);
    toastManager.info("Changes cancelled");
  };

  const handleChangePassword = () => {
    toastManager.info(
      "Password change functionality would be implemented here"
    );
  };

  const handleEnable2FA = () => {
    toastManager.info(
      "Two-factor authentication setup would be implemented here"
    );
  };

  const handleDownloadData = () => {
    toastManager.info("Data download functionality would be implemented here");
  };

  const handleDeleteAccount = () => {
    toastManager.warning(
      "Account deletion would require additional confirmation"
    );
  };

  return (
    <DashboardLayout
      title="Profile Settings"
      userRole={userRole}
      userName={userName}
    >
      <div className="max-w-4xl mx-auto space-y-6 px-3 sm:px-0 w-full">
        {/* Profile Header */}
        <div className="bg-card-bg rounded-lg border border-border-color p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-accent-color flex items-center justify-center shrink-0 self-center sm:self-auto">
              <span className="text-2xl font-bold text-white">
                {userName?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="text-center sm:text-left space-y-1">
              <h1 className="text-2xl font-bold text-text-primary break-words">
                {userName}
              </h1>
              <p className="text-text-secondary break-words text-sm sm:text-base">
                {userEmail}
              </p>
              <p className="text-sm text-text-muted capitalize tracking-wide">
                {userRole.replace("_", " ")} Role
              </p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-card-bg rounded-lg border border-border-color p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <h2 className="text-xl font-semibold text-text-primary">
              Personal Information
            </h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-accent-color text-white px-4 py-2 rounded-md hover:bg-accent-hover w-full sm:w-auto"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={handleSave}
                  className="bg-success text-white px-4 py-2 rounded-md hover:bg-success/90 w-full sm:w-auto"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-text-secondary text-white px-4 py-2 rounded-md hover:bg-text-secondary/90 w-full sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter your first name"
                className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color disabled:bg-card-bg text-text-primary placeholder-text-muted bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter your last name"
                className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color disabled:bg-card-bg text-text-primary placeholder-text-muted bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={true} // Email should not be editable
                className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color disabled:bg-card-bg text-text-primary bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter your phone number"
                className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color disabled:bg-card-bg text-text-primary placeholder-text-muted bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Role
              </label>
              <input
                type="text"
                name="role"
                value={formData.role.replace("_", " ")}
                disabled={true} // Role should not be editable
                className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color disabled:bg-card-bg text-text-primary capitalize bg-background"
              />
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-card-bg rounded-lg border border-border-color p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-6">
            Security Settings
          </h2>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 border border-border-color rounded-lg gap-4">
              <div className="space-y-1">
                <h3 className="font-medium text-text-primary">
                  Change Password
                </h3>
                <p className="text-sm text-text-secondary">
                  Update your account password
                </p>
              </div>
              <button
                onClick={handleChangePassword}
                className="bg-accent-color text-white px-4 py-2 rounded-md hover:bg-accent-hover w-full md:w-auto"
              >
                Change Password
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 border border-border-color rounded-lg gap-4">
              <div className="space-y-1">
                <h3 className="font-medium text-text-primary">
                  Two-Factor Authentication
                </h3>
                <p className="text-sm text-text-secondary">
                  Add an extra layer of security
                </p>
              </div>
              <button
                onClick={handleEnable2FA}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 w-full md:w-auto"
              >
                Enable 2FA
              </button>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-card-bg rounded-lg border border-border-color p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-6">
            Account Actions
          </h2>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 border border-border-color rounded-lg gap-4">
              <div className="space-y-1">
                <h3 className="font-medium text-text-primary">
                  Download My Data
                </h3>
                <p className="text-sm text-text-secondary">
                  Export all your data
                </p>
              </div>
              <button
                onClick={handleDownloadData}
                className="bg-success text-white px-4 py-2 rounded-md hover:bg-success/80 w-full md:w-auto"
              >
                Download
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 border border-border-color rounded-lg gap-4">
              <div className="space-y-1">
                <h3 className="font-medium text-error">Delete Account</h3>
                <p className="text-sm text-text-secondary">
                  Permanently delete your account
                </p>
              </div>
              <button
                onClick={handleDeleteAccount}
                className="bg-error text-white px-4 py-2 rounded-md hover:bg-error/80 w-full md:w-auto"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
