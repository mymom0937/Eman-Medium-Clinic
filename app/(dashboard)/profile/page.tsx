'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useUserRole } from '@/hooks/useUserRole';
import { useUser } from '@clerk/nextjs';
import { toastManager } from '@/lib/utils/toast';

export default function ProfilePage() {
  const { userRole, userName, userEmail } = useUserRole();
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: userEmail,
    phone: user?.phoneNumbers?.[0]?.phoneNumber || '',
    role: userRole,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      // In a real app, you would update the user profile here
      // For now, we'll just simulate the update
      console.log('Saving profile:', formData);
      setIsEditing(false);
      
      // Show success toast
      toastManager.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toastManager.error('Failed to update profile. Please try again.');
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: userEmail,
      phone: user?.phoneNumbers?.[0]?.phoneNumber || '',
      role: userRole,
    });
    setIsEditing(false);
    toastManager.info('Changes cancelled');
  };

  const handleChangePassword = () => {
    toastManager.info('Password change functionality would be implemented here');
  };

  const handleEnable2FA = () => {
    toastManager.info('Two-factor authentication setup would be implemented here');
  };

  const handleDownloadData = () => {
    toastManager.info('Data download functionality would be implemented here');
  };

  const handleDeleteAccount = () => {
    toastManager.warning('Account deletion would require additional confirmation');
  };

  return (
    <DashboardLayout
      title="Profile Settings"
      userRole={userRole}
      userName={userName}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="bg-card-bg rounded-lg border border-border-color p-6">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 rounded-full bg-accent-color flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {userName?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{userName}</h1>
              <p className="text-text-secondary">{userEmail}</p>
              <p className="text-sm text-text-muted capitalize">
                {userRole.replace('_', ' ')} Role
              </p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-card-bg rounded-lg border border-border-color p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-text-primary">Personal Information</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-accent-color text-white px-4 py-2 rounded-md hover:bg-accent-hover"
              >
                Edit Profile
              </button>
            ) : (
              <div className="space-x-2">
                <button
                  onClick={handleSave}
                  className="bg-success text-white px-4 py-2 rounded-md hover:bg-success/90"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-text-secondary text-white px-4 py-2 rounded-md hover:bg-text-secondary/90"
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
                value={formData.role.replace('_', ' ')}
                disabled={true} // Role should not be editable
                className="w-full border border-border-color rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-color disabled:bg-card-bg text-text-primary capitalize bg-background"
              />
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Change Password</h3>
                <p className="text-sm text-gray-600">Update your account password</p>
              </div>
              <button 
                onClick={handleChangePassword}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Change Password
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-600">Add an extra layer of security</p>
              </div>
              <button 
                onClick={handleEnable2FA}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Enable 2FA
              </button>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Actions</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Download My Data</h3>
                <p className="text-sm text-gray-600">Export all your data</p>
              </div>
              <button 
                onClick={handleDownloadData}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Download
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium text-red-600">Delete Account</h3>
                <p className="text-sm text-gray-600">Permanently delete your account</p>
              </div>
              <button 
                onClick={handleDeleteAccount}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
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