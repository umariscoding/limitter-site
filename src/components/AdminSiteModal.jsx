"use client";

import { useState, useEffect } from "react";
import { toast } from 'react-hot-toast';

export default function AdminSiteModal({ isOpen, onClose, site, onUpdate }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    time_limit: 1800,
    is_active: true,
    user_id: '',
    created_at: null,
    updated_at: null
  });

  useEffect(() => {
    if (site) {
      setFormData({
        name: site.name || '',
        url: site.url || '',
        time_limit: site.time_limit || 1800,
        is_active: site.is_active !== false,
        user_id: site.user_id || '',
        created_at: site.created_at || null,
        updated_at: site.updated_at || null
      });
    }
  }, [site]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onUpdate(site.id, formData);
      toast.success('Site updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error updating site:', error);
      toast.error(error.message || 'Failed to update site');
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
            <h2 className="text-2xl font-bold">Edit Site</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Site Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Daily Time Limit (minutes)
              </label>
              <input
                type="number"
                value={Math.floor(formData.time_limit / 60)}
                onChange={(e) => setFormData(prev => ({ ...prev, time_limit: e.target.value * 60 }))}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 text-primary border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Site is active
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                User ID
              </label>
              <input
                type="text"
                value={formData.user_id}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled
              />
            </div>

            {formData.created_at && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Created: {new Date(formData.created_at.seconds * 1000).toLocaleString()}
              </div>
            )}
            {formData.updated_at && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last Updated: {new Date(formData.updated_at.seconds * 1000).toLocaleString()}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Update Site'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 