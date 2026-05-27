"use client";

import { useState, useEffect } from "react";
import { policyApi } from "../lib/api";

export default function SiteManager({ isOpen, onClose, editingPolicy = null }) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    hours: 0,
    minutes: 30,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (isOpen) {
      if (editingPolicy) {
        const totalMinutes = editingPolicy.dailyLimitMinutes || 30;
        setFormData({
          name: editingPolicy.targetLabel || '',
          url: editingPolicy.targetKey || '',
          hours: Math.floor(totalMinutes / 60),
          minutes: totalMinutes % 60,
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingPolicy]);

  const resetForm = () => {
    setFormData({ name: '', url: '', hours: 0, minutes: 30 });
    setMessage({ type: '', text: '' });
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const normalizeDomain = (url) => {
    let domain = url.toLowerCase().trim();
    domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
    domain = domain.replace(/\/.*$/, '');
    return domain;
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showMessage('error', 'Name is required');
      return false;
    }
    if (!formData.url.trim()) {
      showMessage('error', 'URL / identifier is required');
      return false;
    }
    if (!editingPolicy) {
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
      const totalMinutes = (formData.hours * 60) + formData.minutes;

      if (editingPolicy) {
        await policyApi.update(editingPolicy.policyId, {
          targetLabel: formData.name,
        });
        showMessage('success', 'Limit updated successfully!');
      } else {
        const domain = normalizeDomain(formData.url);
        await policyApi.create({
          type: 'website',
          targetKey: domain,
          targetLabel: formData.name,
          scope: 'account',
          deviceIds: [],
          dailyLimitMinutes: totalMinutes,
          warningThresholds: [0.75, 0.9],
          lockMode: 'until_reset',
          lockDurationMinutes: null,
          lockUntilTimeLocal: null,
          dailyResetTimeLocal: '00:00',
          overrideEnabled: true,
        });
        showMessage('success', 'Limit added successfully!');
      }

      setTimeout(() => {
        resetForm();
        onClose();
      }, 1000);
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
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {editingPolicy ? 'Edit Limit' : 'Add New Limit'}
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

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Daily Time Limits</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Set how many minutes you want to spend on this website each day. Usage is shared across all your devices.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
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
                <label className="block text-sm font-medium mb-2">Website Domain</label>
                <input
                  type="text"
                  value={formData.url}
                  disabled={!!editingPolicy}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="e.g., youtube.com, facebook.com"
                  className={`w-full px-3 py-2 ${editingPolicy ? 'cursor-not-allowed opacity-50' : ''} border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent`}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Daily Time Limit</label>
                {editingPolicy ? (
                  <div className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formData.hours}h {formData.minutes}m per day
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Time limits cannot be increased after usage has started.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Hours</label>
                        <input
                          type="number"
                          min="0"
                          max="24"
                          value={formData.hours}
                          onChange={(e) => setFormData(prev => ({ ...prev, hours: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Minutes</label>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={formData.minutes}
                          onChange={(e) => setFormData(prev => ({ ...prev, minutes: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
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
                {isLoading ? 'Saving...' : (editingPolicy ? 'Update' : 'Add Limit')}
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
