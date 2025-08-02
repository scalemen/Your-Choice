import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Cog6ToothIcon,
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  KeyIcon,
  CreditCardIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ChatBubbleLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CloudArrowUpIcon,
  TrashIcon,
  LockClosedIcon,
  DeviceTabletIcon,
  WifiIcon,
  SignalIcon
} from '@heroicons/react/24/outline';
import { 
  Cog6ToothIcon as Cog6ToothIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn } from '@/utils/cn';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';

interface NotificationSettings {
  email: {
    assignments: boolean;
    grades: boolean;
    announcements: boolean;
    reminders: boolean;
    social: boolean;
    marketing: boolean;
  };
  push: {
    assignments: boolean;
    grades: boolean;
    announcements: boolean;
    reminders: boolean;
    social: boolean;
    realtime: boolean;
  };
  inApp: {
    assignments: boolean;
    grades: boolean;
    announcements: boolean;
    reminders: boolean;
    social: boolean;
    sounds: boolean;
  };
}

interface PrivacySettings {
  profile: {
    visibility: 'public' | 'friends' | 'private';
    showEmail: boolean;
    showPhone: boolean;
    showLocation: boolean;
  };
  activity: {
    showOnlineStatus: boolean;
    showLastSeen: boolean;
    showStudyActivity: boolean;
    showAchievements: boolean;
  };
  search: {
    allowSearch: boolean;
    allowFriendRequests: boolean;
    allowMessages: boolean;
  };
  data: {
    allowAnalytics: boolean;
    allowPersonalization: boolean;
    allowThirdParty: boolean;
  };
}

interface AccountSettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  loginAlerts: boolean;
  passwordLastChanged: string;
  connectedDevices: number;
  storageUsed: number;
  storageLimit: number;
}

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'account' | 'privacy' | 'notifications' | 'appearance' | 'advanced'>('general');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const { theme, setTheme, accentColor, setAccentColor, fontSize, setFontSize, reducedMotion, setReducedMotion } = useThemeStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Mock notification settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: {
      assignments: true,
      grades: true,
      announcements: true,
      reminders: true,
      social: false,
      marketing: false
    },
    push: {
      assignments: true,
      grades: true,
      announcements: true,
      reminders: true,
      social: true,
      realtime: true
    },
    inApp: {
      assignments: true,
      grades: true,
      announcements: true,
      reminders: true,
      social: true,
      sounds: true
    }
  });

  // Mock privacy settings
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profile: {
      visibility: 'friends',
      showEmail: false,
      showPhone: false,
      showLocation: false
    },
    activity: {
      showOnlineStatus: true,
      showLastSeen: true,
      showStudyActivity: true,
      showAchievements: true
    },
    search: {
      allowSearch: true,
      allowFriendRequests: true,
      allowMessages: true
    },
    data: {
      allowAnalytics: true,
      allowPersonalization: true,
      allowThirdParty: false
    }
  });

  // Mock account settings
  const [account, setAccount] = useState<AccountSettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    loginAlerts: true,
    passwordLastChanged: '2024-01-15T00:00:00Z',
    connectedDevices: 3,
    storageUsed: 2.4,
    storageLimit: 10
  });

  // Mutations
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Settings updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update settings. Please try again.');
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordData) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (data.current !== 'oldpassword') {
        throw new Error('Current password is incorrect');
      }
      if (data.new !== data.confirm) {
        throw new Error('New passwords do not match');
      }
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({ current: '', new: '', confirm: '' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to change password');
    }
  });

  const enable2FAMutation = useMutation({
    mutationFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, qrCode: 'mock-qr-code' };
    },
    onSuccess: () => {
      setAccount(prev => ({ ...prev, twoFactorEnabled: true }));
      toast.success('Two-factor authentication enabled!');
    },
    onError: () => {
      toast.error('Failed to enable 2FA. Please try again.');
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Account deletion request submitted.');
      setShowDeleteModal(false);
    },
    onError: () => {
      toast.error('Failed to process account deletion request.');
    }
  });

  // Helper functions
  const handleNotificationChange = (category: keyof NotificationSettings, setting: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
    updateSettingsMutation.mutate({ notifications: { [category]: { [setting]: value } } });
  };

  const handlePrivacyChange = (category: keyof PrivacySettings, setting: string, value: any) => {
    setPrivacy(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
    updateSettingsMutation.mutate({ privacy: { [category]: { [setting]: value } } });
  };

  const getStoragePercentage = () => {
    return Math.round((account.storageUsed / account.storageLimit) * 100);
  };

  const formatFileSize = (gb: number) => {
    return `${gb.toFixed(1)} GB`;
  };

  return (
    <>
      <Helmet>
        <title>Settings - StudyGenius</title>
        <meta name="description" content="Manage your account settings, privacy preferences, and application configuration." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-gray-500 to-blue-500 rounded-xl">
                <Cog6ToothIconSolid className="h-8 w-8 text-white" />
              </div>
              Settings
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Customize your StudyGenius experience and manage your account
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Settings Navigation */}
            <div className="lg:w-64">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2">
                {[
                  { id: 'general', label: 'General', icon: UserIcon },
                  { id: 'account', label: 'Account & Security', icon: ShieldCheckIcon },
                  { id: 'privacy', label: 'Privacy', icon: LockClosedIcon },
                  { id: 'notifications', label: 'Notifications', icon: BellIcon },
                  { id: 'appearance', label: 'Appearance', icon: PaintBrushIcon },
                  { id: 'advanced', label: 'Advanced', icon: Cog6ToothIcon }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 text-left',
                      activeTab === tab.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    )}
                  >
                    <tab.icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Settings Content */}
            <div className="flex-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                
                {/* General Settings */}
                {activeTab === 'general' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">General Settings</h2>
                    
                    <div className="space-y-6">
                      {/* Profile Information */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Profile Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Full Name
                            </label>
                            <input
                              type="text"
                              defaultValue={user?.fullName || 'John Doe'}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Email Address
                            </label>
                            <input
                              type="email"
                              defaultValue={user?.email || 'john@example.com'}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              placeholder="+1 (555) 123-4567"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Location
                            </label>
                            <input
                              type="text"
                              placeholder="City, Country"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Language & Region */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Language & Region</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Language
                            </label>
                            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                              <option>English (US)</option>
                              <option>English (UK)</option>
                              <option>Spanish</option>
                              <option>French</option>
                              <option>German</option>
                              <option>Chinese</option>
                              <option>Japanese</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Time Zone
                            </label>
                            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                              <option>Pacific Time (PT)</option>
                              <option>Mountain Time (MT)</option>
                              <option>Central Time (CT)</option>
                              <option>Eastern Time (ET)</option>
                              <option>UTC</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Study Preferences */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Study Preferences</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">Study Reminders</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Receive reminders for study sessions</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" defaultChecked className="sr-only peer" />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">Auto-Save Notes</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Automatically save note changes</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" defaultChecked className="sr-only peer" />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">Smart Suggestions</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">AI-powered study recommendations</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" defaultChecked className="sr-only peer" />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4">
                        <button
                          onClick={() => updateSettingsMutation.mutate({ general: true })}
                          disabled={updateSettingsMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                          {updateSettingsMutation.isPending ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <CheckCircleIcon className="h-4 w-4" />
                          )}
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account & Security */}
                {activeTab === 'account' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Account & Security</h2>
                    
                    <div className="space-y-6">
                      {/* Password */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Password</h3>
                        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">Password</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Last changed {new Date(account.passwordLastChanged).toLocaleDateString()}
                            </div>
                          </div>
                          <button
                            onClick={() => setShowPasswordModal(true)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                          >
                            Change Password
                          </button>
                        </div>
                      </div>

                      {/* Two-Factor Authentication */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Two-Factor Authentication</h3>
                        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                              Two-Factor Authentication
                              {account.twoFactorEnabled ? (
                                <CheckCircleIconSolid className="h-5 w-5 text-green-500" />
                              ) : (
                                <ExclamationTriangleIconSolid className="h-5 w-5 text-yellow-500" />
                              )}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {account.twoFactorEnabled ? 'Enabled' : 'Add an extra layer of security to your account'}
                            </div>
                          </div>
                          <button
                            onClick={() => account.twoFactorEnabled ? setAccount(prev => ({ ...prev, twoFactorEnabled: false })) : enable2FAMutation.mutate()}
                            disabled={enable2FAMutation.isPending}
                            className={cn(
                              'px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
                              account.twoFactorEnabled
                                ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            )}
                          >
                            {enable2FAMutation.isPending ? (
                              <LoadingSpinner size="sm" />
                            ) : account.twoFactorEnabled ? (
                              'Disable'
                            ) : (
                              'Enable'
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Session Management */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Session Management</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">Session Timeout</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Automatically log out after inactivity</div>
                            </div>
                            <select
                              value={account.sessionTimeout}
                              onChange={(e) => setAccount(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value={15}>15 minutes</option>
                              <option value={30}>30 minutes</option>
                              <option value={60}>1 hour</option>
                              <option value={120}>2 hours</option>
                              <option value={0}>Never</option>
                            </select>
                          </div>
                          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">Connected Devices</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">{account.connectedDevices} devices</div>
                            </div>
                            <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                              Manage Devices
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Storage */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Storage</h3>
                        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-gray-900 dark:text-white">Storage Usage</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {formatFileSize(account.storageUsed)} of {formatFileSize(account.storageLimit)} used
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${getStoragePercentage()}%` }}
                            />
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {getStoragePercentage()}% used
                          </div>
                        </div>
                      </div>

                      {/* Danger Zone */}
                      <div>
                        <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-4">Danger Zone</h3>
                        <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-red-900 dark:text-red-100">Delete Account</div>
                              <div className="text-sm text-red-700 dark:text-red-300">Permanently delete your account and all data</div>
                            </div>
                            <button
                              onClick={() => setShowDeleteModal(true)}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              Delete Account
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Privacy Settings */}
                {activeTab === 'privacy' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Privacy Settings</h2>
                    
                    <div className="space-y-6">
                      {/* Profile Privacy */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Profile Privacy</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Profile Visibility
                            </label>
                            <select
                              value={privacy.profile.visibility}
                              onChange={(e) => handlePrivacyChange('profile', 'visibility', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="public">Public - Anyone can see your profile</option>
                              <option value="friends">Friends Only - Only friends can see your profile</option>
                              <option value="private">Private - Only you can see your profile</option>
                            </select>
                          </div>
                          <div className="space-y-3">
                            {[
                              { key: 'showEmail', label: 'Show Email Address', description: 'Allow others to see your email' },
                              { key: 'showPhone', label: 'Show Phone Number', description: 'Allow others to see your phone' },
                              { key: 'showLocation', label: 'Show Location', description: 'Allow others to see your location' }
                            ].map((item) => (
                              <div key={item.key} className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">{item.label}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">{item.description}</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={privacy.profile[item.key as keyof typeof privacy.profile] as boolean}
                                    onChange={(e) => handlePrivacyChange('profile', item.key, e.target.checked)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Activity Privacy */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Activity Privacy</h3>
                        <div className="space-y-3">
                          {[
                            { key: 'showOnlineStatus', label: 'Show Online Status', description: 'Let others see when you\'re online' },
                            { key: 'showLastSeen', label: 'Show Last Seen', description: 'Let others see when you were last active' },
                            { key: 'showStudyActivity', label: 'Show Study Activity', description: 'Share your study progress and achievements' },
                            { key: 'showAchievements', label: 'Show Achievements', description: 'Display your earned achievements publicly' }
                          ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{item.label}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{item.description}</div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={privacy.activity[item.key as keyof typeof privacy.activity]}
                                  onChange={(e) => handlePrivacyChange('activity', item.key, e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Data Privacy */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Data Privacy</h3>
                        <div className="space-y-3">
                          {[
                            { key: 'allowAnalytics', label: 'Analytics', description: 'Help improve StudyGenius with usage analytics' },
                            { key: 'allowPersonalization', label: 'Personalization', description: 'Use your data to personalize your experience' },
                            { key: 'allowThirdParty', label: 'Third-party Sharing', description: 'Share data with trusted partners' }
                          ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{item.label}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{item.description}</div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={privacy.data[item.key as keyof typeof privacy.data]}
                                  onChange={(e) => handlePrivacyChange('data', item.key, e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications */}
                {activeTab === 'notifications' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Notification Settings</h2>
                    
                    <div className="space-y-6">
                      {/* Email Notifications */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <EnvelopeIcon className="h-5 w-5" />
                          Email Notifications
                        </h3>
                        <div className="space-y-3">
                          {[
                            { key: 'assignments', label: 'Assignments', description: 'New assignments and due date reminders' },
                            { key: 'grades', label: 'Grades', description: 'Grade updates and feedback' },
                            { key: 'announcements', label: 'Announcements', description: 'Important announcements from teachers' },
                            { key: 'reminders', label: 'Study Reminders', description: 'Scheduled study session reminders' },
                            { key: 'social', label: 'Social Activity', description: 'Friend requests and messages' },
                            { key: 'marketing', label: 'Marketing', description: 'Product updates and promotional content' }
                          ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{item.label}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{item.description}</div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={notifications.email[item.key as keyof typeof notifications.email]}
                                  onChange={(e) => handleNotificationChange('email', item.key, e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Push Notifications */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <DevicePhoneMobileIcon className="h-5 w-5" />
                          Push Notifications
                        </h3>
                        <div className="space-y-3">
                          {[
                            { key: 'assignments', label: 'Assignments', description: 'Assignment notifications on your device' },
                            { key: 'grades', label: 'Grades', description: 'Grade updates on your device' },
                            { key: 'announcements', label: 'Announcements', description: 'Important announcements on your device' },
                            { key: 'reminders', label: 'Study Reminders', description: 'Study session reminders on your device' },
                            { key: 'social', label: 'Social Activity', description: 'Social notifications on your device' },
                            { key: 'realtime', label: 'Real-time Updates', description: 'Instant notifications for urgent updates' }
                          ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{item.label}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{item.description}</div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={notifications.push[item.key as keyof typeof notifications.push]}
                                  onChange={(e) => handleNotificationChange('push', item.key, e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* In-App Notifications */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <BellIcon className="h-5 w-5" />
                          In-App Notifications
                        </h3>
                        <div className="space-y-3">
                          {[
                            { key: 'assignments', label: 'Assignments', description: 'Show assignment notifications in the app' },
                            { key: 'grades', label: 'Grades', description: 'Show grade notifications in the app' },
                            { key: 'announcements', label: 'Announcements', description: 'Show announcements in the app' },
                            { key: 'reminders', label: 'Study Reminders', description: 'Show study reminders in the app' },
                            { key: 'social', label: 'Social Activity', description: 'Show social notifications in the app' },
                            { key: 'sounds', label: 'Notification Sounds', description: 'Play sounds for notifications' }
                          ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{item.label}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{item.description}</div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={notifications.inApp[item.key as keyof typeof notifications.inApp]}
                                  onChange={(e) => handleNotificationChange('inApp', item.key, e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Appearance */}
                {activeTab === 'appearance' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Appearance Settings</h2>
                    
                    <div className="space-y-6">
                      {/* Theme */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Theme</h3>
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { id: 'light', label: 'Light', icon: SunIcon },
                            { id: 'dark', label: 'Dark', icon: MoonIcon },
                            { id: 'system', label: 'System', icon: ComputerDesktopIcon }
                          ].map((themeOption) => (
                            <button
                              key={themeOption.id}
                              onClick={() => setTheme(themeOption.id as any)}
                              className={cn(
                                'flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all duration-200',
                                theme === themeOption.id
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                              )}
                            >
                              <themeOption.icon className="h-6 w-6" />
                              <span className="font-medium">{themeOption.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Accent Color */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Accent Color</h3>
                        <div className="grid grid-cols-6 gap-3">
                          {[
                            { id: 'blue', color: 'bg-blue-500' },
                            { id: 'purple', color: 'bg-purple-500' },
                            { id: 'green', color: 'bg-green-500' },
                            { id: 'red', color: 'bg-red-500' },
                            { id: 'yellow', color: 'bg-yellow-500' },
                            { id: 'pink', color: 'bg-pink-500' }
                          ].map((colorOption) => (
                            <button
                              key={colorOption.id}
                              onClick={() => setAccentColor(colorOption.id as any)}
                              className={cn(
                                'w-12 h-12 rounded-full border-4 transition-all duration-200',
                                colorOption.color,
                                accentColor === colorOption.id
                                  ? 'border-gray-900 dark:border-white scale-110'
                                  : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                              )}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Font Size */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Font Size</h3>
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { id: 'small', label: 'Small', size: 'text-sm' },
                            { id: 'medium', label: 'Medium', size: 'text-base' },
                            { id: 'large', label: 'Large', size: 'text-lg' }
                          ].map((sizeOption) => (
                            <button
                              key={sizeOption.id}
                              onClick={() => setFontSize(sizeOption.id as any)}
                              className={cn(
                                'flex items-center justify-center p-4 border-2 rounded-lg transition-all duration-200',
                                sizeOption.size,
                                fontSize === sizeOption.id
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                              )}
                            >
                              {sizeOption.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Accessibility */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Accessibility</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">Reduced Motion</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Minimize animations and transitions</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={reducedMotion}
                                onChange={(e) => setReducedMotion(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">High Contrast</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Increase contrast for better visibility</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Advanced Settings */}
                {activeTab === 'advanced' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Advanced Settings</h2>
                    
                    <div className="space-y-6">
                      {/* Developer Options */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Developer Options</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">Debug Mode</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Enable debugging features and logs</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">Beta Features</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Access experimental features</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Data Management */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Data Management</h3>
                        <div className="space-y-3">
                          <button className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <CloudArrowUpIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              <div className="text-left">
                                <div className="font-medium text-gray-900 dark:text-white">Export Data</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Download your data</div>
                              </div>
                            </div>
                            <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                          </button>
                          <button className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <TrashIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                              <div className="text-left">
                                <div className="font-medium text-gray-900 dark:text-white">Clear Cache</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Clear stored data and cache</div>
                              </div>
                            </div>
                            <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                      </div>

                      {/* System Information */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">System Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="text-sm text-gray-600 dark:text-gray-400">App Version</div>
                            <div className="font-medium text-gray-900 dark:text-white">1.0.0</div>
                          </div>
                          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="text-sm text-gray-600 dark:text-gray-400">Build Number</div>
                            <div className="font-medium text-gray-900 dark:text-white">20240125.1</div>
                          </div>
                          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="text-sm text-gray-600 dark:text-gray-400">Server Status</div>
                            <div className="font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                              <CheckCircleIconSolid className="h-4 w-4" />
                              Online
                            </div>
                          </div>
                          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="text-sm text-gray-600 dark:text-gray-400">Last Sync</div>
                            <div className="font-medium text-gray-900 dark:text-white">Just now</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Modal */}
        <AnimatePresence>
          {showPasswordModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowPasswordModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h3>
                    <button
                      onClick={() => setShowPasswordModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.current}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, current: e.target.value }))}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showPasswords.current ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.new}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showPasswords.new ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirm}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showPasswords.confirm ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowPasswordModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => changePasswordMutation.mutate(passwordData)}
                      disabled={changePasswordMutation.isPending || !passwordData.current || !passwordData.new || !passwordData.confirm}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {changePasswordMutation.isPending ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <KeyIcon className="h-4 w-4" />
                      )}
                      Change Password
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Account Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowDeleteModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                      <ExclamationTriangleIconSolid className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Account</h3>
                  </div>

                  <div className="mb-6">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Are you sure you want to delete your account? This action cannot be undone and will permanently remove:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>Your profile and personal information</li>
                      <li>All your notes and study materials</li>
                      <li>Your progress and achievements</li>
                      <li>Your social connections</li>
                      <li>All classroom memberships</li>
                    </ul>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type "DELETE" to confirm
                    </label>
                    <input
                      type="text"
                      placeholder="DELETE"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => deleteAccountMutation.mutate()}
                      disabled={deleteAccountMutation.isPending}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {deleteAccountMutation.isPending ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <TrashIcon className="h-4 w-4" />
                      )}
                      Delete Account
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default SettingsPage;