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
    timeLimit: 30
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
        setFormData({
          name: editingSiteData.name || '',
          url: editingSiteData.url || '',
          timeLimit: editingSiteData.timeLimit || 30
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
      timeLimit: 30
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

    if (formData.timeLimit < 1 || formData.timeLimit > 300) {
      showMessage('error', 'Time limit must be between 1-300 seconds');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const siteData = {
        ...formData,
        url: formData.url.startsWith('http') ? formData.url : `https://${formData.url}`,
        isActive: true,
        createdAt: editingSite ? editingSite.createdAt : new Date(),
        updatedAt: new Date()
      };

      if (editingSite) {
        const result = await updateSite(editingSite.id, siteData);
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
        const result = await addSite(siteData);
        if (result.success) {
          showMessage('success', 'Site added successfully!');
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
                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}>
              {message.text}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Add/Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <label className="block text-sm font-medium mb-2">Time Limit (seconds)</label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={formData.timeLimit}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 30 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
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