"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function SiteManager({ isOpen, onClose, editingSiteData = null }) {
  const { 
    user, 
    blockedSites, 
    addSite, 
    updateSite, 
    removeSite, 
    refreshUserData 
  } = useAuth();

  // Form state for adding/editing sites
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    hours: 0,
    minutes: 30 // Default 30 minutes
  });

  // UI state
  const [editingSite, setEditingSite] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Reset form when modal opens/closes or when editingSiteData changes
  useEffect(() => {
    if (isOpen) {
      if (editingSiteData) {
        setEditingSite(editingSiteData);
        // Convert seconds back to hours and minutes for editing
        const totalSeconds = editingSiteData.time_limit || 1800; // Default 30 minutes = 1800 seconds
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        
        setFormData({
          name: editingSiteData.name || '',
          url: editingSiteData.url || '',
          hours: hours,
          minutes: minutes
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingSiteData]);

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      hours: 0,
      minutes: 30
    });
    setEditingSite(null);
    setMessage({ type: '', text: '' });
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showMessage('error', 'Site name is required');
      return false;
    }
    if (!formData.url.trim()) {
      showMessage('error', 'URL is required');
      return false;
    }
    
    // Basic URL validation
    try {
      const url = formData.url.startsWith('http') ? formData.url : `https://${formData.url}`;
      new URL(url);
    } catch {
      showMessage('error', 'Please enter a valid URL');
      return false;
    }

    // Time limit validation (only for new sites)
    if (!editingSite) {
      const totalMinutes = (formData.hours * 60) + formData.minutes;
      if (totalMinutes < 1 || totalMinutes > 1440) {
        showMessage('error', 'Time limit must be between 1 minute and 24 hours');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Convert hours and minutes to total seconds
      const totalSeconds = (formData.hours * 3600) + (formData.minutes * 60);
      
      if (editingSite) {
        // For existing sites, don't allow time limit changes - only name/url updates
        const updateData = {
          name: formData.name,
          url: formData.url.startsWith('http') ? formData.url : `https://${formData.url}`,
          isActive: true
          // Intentionally NOT including timeLimit for existing sites
        };
        
        const result = await updateSite(editingSite.id, updateData);
        if (result.success) {
          showMessage('success', 'Site updated successfully!');
          setTimeout(() => {
            resetForm();
            onClose();
          }, 1500);
        } else {
          showMessage('error', result.error || 'Failed to update site');
        }
      } else {
        // For new sites, include time limit and let Firebase handle timestamps
        const newSiteData = {
          name: formData.name,
          url: formData.url.startsWith('http') ? formData.url : `https://${formData.url}`,
          timeLimit: totalSeconds, // Store in seconds
          isActive: true
        };
        
        const result = await addSite(newSiteData);
        if (result.success) {
          // Use the message from the server (handles reactivation case)
          const messageType = result.wasReactivated ? 'info' : 'success';
          showMessage(messageType, result.message || 'Site added successfully!');
          setTimeout(() => {
            resetForm();
            onClose();
          }, 1500);
        } else {
          showMessage('error', result.error || 'Failed to add site');
        }
      }
    } catch (error) {
      showMessage('error', error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {editingSite ? 'Edit Site' : 'Add New Site'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Message Display */}
          {message.text && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800' 
                : message.type === 'info'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}>
              {message.text}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Add/Edit Form */}
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Daily Time Limits</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Set how many minutes you want to spend on this website each day. Time resets at midnight.
                </p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Site Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., YouTube, Facebook"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Website URL</label>
                <input
                  type="text"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="e.g., youtube.com, facebook.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Daily Time Limit</label>
                {editingSite ? (
                  // For existing sites, show time limit as read-only
                  <div className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formData.hours}h {formData.minutes}m per day
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ⚠️ Time limits cannot be changed after creating a site. Contact an admin if you need this changed.
                    </p>
                  </div>
                ) : (
                  // For new sites, allow time limit selection
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Hours</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="24"
                            value={formData.hours}
                            onChange={(e) => setFormData(prev => ({ ...prev, hours: parseInt(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 dark:text-gray-400 text-sm">h</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Minutes</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={formData.minutes}
                            onChange={(e) => setFormData(prev => ({ ...prev, minutes: parseInt(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 dark:text-gray-400 text-sm">m</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Maximum: 24 hours per day. Minimum: 1 minute total.
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Saving...' : (editingSite ? 'Update Site' : 'Add Site')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 