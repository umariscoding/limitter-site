"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function Settings({ onBack }) {
  const { 
    user, 
    userStats, 
    updateProfile, 
    updateUserProfileImage, 
    updateUserProfileName,
    refreshUserData 
  } = useAuth();

  // Form states
  const [profileData, setProfileData] = useState({
    profileName: user?.profileName || user?.name || '',
    profileEmail: user?.profileEmail || user?.email || '',
    profileImage: user?.profileImage || ''
  });

  // App settings
  const [appSettings, setAppSettings] = useState({
    notifications: true,
    darkMode: false,
    autoReset: true,
    showTimeSaved: true
  });

  // Blocking settings
  const [blockingSettings, setBlockingSettings] = useState({
    defaultBlockType: 'permanent',
    defaultTimeLimit: 30,
    blockHttps: true
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (user) {
      setProfileData({
        profileName: user.profileName || user.name || '',
        profileEmail: user.profileEmail || user.email || '',
        profileImage: user.profileImage || ''
      });
    }
  }, [user]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update profile name if changed
      if (profileData.profileName !== user?.profileName) {
        const result = await updateUserProfileName(profileData.profileName);
        if (!result.success) {
          throw new Error(result.error);
        }
      }

      // Update profile image if changed
      if (profileData.profileImage !== user?.profileImage) {
        const result = await updateUserProfileImage(profileData.profileImage);
        if (!result.success) {
          throw new Error(result.error);
        }
      }

      showMessage('success', 'Profile updated successfully!');
      await refreshUserData();
    } catch (error) {
      showMessage('error', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppSettingChange = (setting, value) => {
    setAppSettings(prev => ({
      ...prev,
      [setting]: value
    }));
    
    // Save to localStorage for persistence
    const updatedSettings = { ...appSettings, [setting]: value };
    localStorage.setItem('limiterAppSettings', JSON.stringify(updatedSettings));
    
    showMessage('success', 'Setting updated!');
  };

  const handleBlockingSettingChange = (setting, value) => {
    setBlockingSettings(prev => ({
      ...prev,
      [setting]: value
    }));
    
    // Save to localStorage for persistence
    const updatedSettings = { ...blockingSettings, [setting]: value };
    localStorage.setItem('limiterBlockingSettings', JSON.stringify(updatedSettings));
    
    showMessage('success', 'Blocking setting updated!');
  };

  const exportUserData = async () => {
    try {
      const data = {
        profile: user,
        stats: userStats,
        settings: {
          app: appSettings,
          blocking: blockingSettings
        },
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `limiter-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showMessage('success', 'Data exported successfully!');
    } catch (error) {
      showMessage('error', 'Failed to export data');
    }
  };

  const resetSettings = () => {
    setAppSettings({
      notifications: true,
      darkMode: false,
      autoReset: true,
      showTimeSaved: true
    });

    setBlockingSettings({
      defaultBlockType: 'permanent',
      defaultTimeLimit: 30,
      blockHttps: true
    });

    localStorage.removeItem('limiterAppSettings');
    localStorage.removeItem('limiterBlockingSettings');
    
    showMessage('success', 'Settings reset to defaults!');
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'app', name: 'App Settings', icon: '⚙️' },
    { id: 'blocking', name: 'Blocking', icon: '🚫' },
    { id: 'data', name: 'Data & Privacy', icon: '🔒' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-3 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold">Settings</h2>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Customize your Limiter experience
          </div>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mt-4 p-3 rounded-md text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6 max-h-96 overflow-y-auto">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Profile Name</label>
              <input
                type="text"
                value={profileData.profileName}
                onChange={(e) => setProfileData(prev => ({ ...prev, profileName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={profileData.profileEmail}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Profile Image URL</label>
              <input
                type="url"
                value={profileData.profileImage}
                onChange={(e) => setProfileData(prev => ({ ...prev, profileImage: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        )}

        {/* App Settings Tab */}
        {activeTab === 'app' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium">General</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Notifications</label>
                  <p className="text-sm text-gray-500">Get notified about blocks and limits</p>
                </div>
                <input
                  type="checkbox"
                  checked={appSettings.notifications}
                  onChange={(e) => handleAppSettingChange('notifications', e.target.checked)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Show Time Saved</label>
                  <p className="text-sm text-gray-500">Display time saved statistics</p>
                </div>
                <input
                  type="checkbox"
                  checked={appSettings.showTimeSaved}
                  onChange={(e) => handleAppSettingChange('showTimeSaved', e.target.checked)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* Blocking Settings Tab */}
        {activeTab === 'blocking' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium">Default Settings</h3>
              
              <div>
                <label className="block text-sm font-medium mb-2">Default Block Type</label>
                <select
                  value={blockingSettings.defaultBlockType}
                  onChange={(e) => handleBlockingSettingChange('defaultBlockType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700"
                >
                  <option value="permanent">Permanent</option>
                  <option value="timed">Timed</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Default Time Limit (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={blockingSettings.defaultTimeLimit}
                  onChange={(e) => handleBlockingSettingChange('defaultTimeLimit', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Data & Privacy Tab */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium">Data Management</h3>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium mb-2">Export Your Data</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Download a copy of all your Limiter data including settings, blocked sites, and statistics.
                </p>
                <button
                  onClick={exportUserData}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors text-sm"
                >
                  Export Data
                </button>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <h4 className="font-medium mb-2 text-yellow-800 dark:text-yellow-200">Reset Settings</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                  Reset all settings to their default values. This will not affect your blocked sites or statistics.
                </p>
                <button
                  onClick={resetSettings}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm"
                >
                  Reset Settings
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Privacy</h3>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">Data Privacy</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Your data is stored securely and never shared with third parties. All blocking and time tracking 
                  happens locally in your browser and on our secure servers.
                </p>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Data stored:</strong> Profile information, blocked sites list, usage statistics</p>
                <p><strong>Data retention:</strong> Until you delete your account</p>
                <p><strong>Data sharing:</strong> Never shared with third parties</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 