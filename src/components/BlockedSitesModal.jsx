"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function BlockedSitesModal({ isOpen, onClose, onEditSite }) {
  const { 
    user, 
    blockedSites, 
    removeSite 
  } = useAuth();

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setMessage({ type: '', text: '' });
    }
  }, [isOpen]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleEdit = (site) => {
    onClose();
    onEditSite(site);
  };

  const handleDelete = async (siteId) => {
    if (!confirm('Are you sure you want to remove this site?')) return;

    setIsLoading(true);
    try {
      const result = await removeSite(siteId);
      if (result.success) {
        showMessage('success', 'Site removed successfully!');
      } else {
        showMessage('error', result.error || 'Failed to remove site');
      }
    } catch (error) {
      showMessage('error', error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSites = blockedSites.filter(site => 
    site.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.url?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Manage Tracking Sites</h2>
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
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search sites..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Sites Grid */}
            {filteredSites.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm ? 'No sites found' : 'No tracking sites yet'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  {searchTerm 
                    ? 'Try adjusting your search terms to find the site you\'re looking for.'
                    : 'Add your first site to start tracking your browsing time and stay focused on what matters.'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSites.map((site) => (
                  <div 
                    key={site.id} 
                    className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 ${
                      site.is_active === false ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {site.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {site.url}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">ID: {site.id}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ml-2 ${
                        site.time_remaining === 0 || site.is_blocked
                          ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                          : site.is_active !== false
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}>
                        {site.time_remaining === 0 || site.is_blocked ? 'Blocked' : site.is_active !== false ? 'Active' : 'Inactive'}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Daily Limit:</span>
                        <span className="font-medium">
                          {(() => {
                            const totalSeconds = site.time_limit || 1800; // Default 30 minutes
                            const hours = Math.floor(totalSeconds / 3600);
                            const minutes = Math.floor((totalSeconds % 3600) / 60);
                            const seconds = totalSeconds % 60;
                            
                            if (hours > 0) {
                              return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
                            } else if (minutes > 0) {
                              return `${minutes}m`;
                            } else {
                              return `${seconds}s`;
                            }
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Time Remaining:</span>
                        <span className="font-medium">
                          {(() => {
                            const remainingSeconds = site.time_remaining || 0;
                            const hours = Math.floor(remainingSeconds / 3600);
                            const minutes = Math.floor((remainingSeconds % 3600) / 60);
                            const seconds = remainingSeconds % 60;
                            
                            if (remainingSeconds === 0) {
                              return 'None';
                            } else if (hours > 0) {
                              return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
                            } else if (minutes > 0) {
                              return `${minutes}m`;
                            } else {
                              return `${seconds}s`;
                            }
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Added:</span>
                        <span className="font-medium">
                          {site.created_at ? new Date(site.created_at.seconds * 1000).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(site)}
                        className={`flex-1 px-3 py-1.5 ${
                          site.is_active === false
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                        } text-sm font-medium rounded transition-colors`}
                        disabled={site.is_active === false}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(site.id)}
                        disabled={isLoading || site.is_active === false}
                        className={`flex-1 px-3 py-1.5 ${
                          site.is_active === false
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'
                        } text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 