import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  BookOpenIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  HeartIcon,
  SparklesIcon,
  TrophyIcon,
  BriefcaseIcon,
  RocketLaunchIcon,
  LightBulbIcon,
  BeakerIcon,
  GlobeAltIcon,
  CameraIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/utils/cn';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    category: 'main'
  },
  {
    name: 'Classrooms',
    href: '/dashboard/classrooms',
    icon: AcademicCapIcon,
    category: 'learning'
  },
  {
    name: 'Notes',
    href: '/dashboard/notes',
    icon: DocumentTextIcon,
    category: 'learning'
  },
  {
    name: 'Flashcards',
    href: '/dashboard/flashcards',
    icon: BookOpenIcon,
    category: 'learning'
  },
  {
    name: 'Study Planner',
    href: '/dashboard/study-planner',
    icon: CalendarDaysIcon,
    category: 'learning'
  },
  {
    name: 'AI Tutor',
    href: '/dashboard/ai-tutor',
    icon: ChatBubbleLeftRightIcon,
    category: 'learning'
  },
  {
    name: 'Skills Assessment',
    href: '/dashboard/skills-assessment',
    icon: TrophyIcon,
    category: 'professional'
  },
  {
    name: 'Mentorship',
    href: '/dashboard/mentorship',
    icon: UserGroupIcon,
    category: 'professional'
  },
  {
    name: 'Study Buddy',
    href: '/dashboard/study-buddy',
    icon: SparklesIcon,
    category: 'assistance'
  },
  {
    name: 'Wellness',
    href: '/dashboard/wellness',
    icon: HeartIcon,
    category: 'assistance'
  },
  {
    name: 'Peer Tutoring',
    href: '/dashboard/peer-tutoring',
    icon: UserGroupIcon,
    category: 'assistance'
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: ChartBarIcon,
    category: 'assistance'
  },
  {
    name: 'Social',
    href: '/dashboard/social',
    icon: UserGroupIcon,
    category: 'social'
  },
  {
    name: 'Games',
    href: '/dashboard/games',
    icon: BeakerIcon,
    category: 'social'
  },
  {
    name: 'StudyGram',
    href: '/dashboard/social-media',
    icon: CameraIcon,
    category: 'social'
  },
  {
    name: 'StudyTube',
    href: '/dashboard/video-platform',
    icon: PlayIcon,
    category: 'social'
  }
];

const categories = [
  { id: 'main', name: 'Main', color: 'text-blue-600' },
  { id: 'learning', name: 'Learning', color: 'text-green-600' },
  { id: 'professional', name: 'Professional', color: 'text-purple-600' },
  { id: 'assistance', name: 'Student Support', color: 'text-pink-600' },
  { id: 'social', name: 'Social & Games', color: 'text-orange-600' }
];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl"
            >
              <SidebarContent />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64 flex flex-col flex-1">
        {/* Top header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>

              {/* Page title */}
              <div className="flex-1 lg:flex-none">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  StudyGenius Dashboard
                </h1>
              </div>

              {/* User menu */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {theme === 'dark' ? '🌞' : '🌙'}
                </button>

                <div className="flex items-center space-x-3">
                  <img
                    src={user?.profilePicture || '/default-avatar.png'}
                    alt={user?.fullName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.fullName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );

  function SidebarContent() {
    return (
      <>
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <Link
            to="/dashboard"
            className="flex items-center space-x-3"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SG</span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              StudyGenius
            </span>
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-8">
          {categories.map((category) => {
            const categoryItems = navigationItems.filter(item => item.category === category.id);
            if (categoryItems.length === 0) return null;

            return (
              <div key={category.id}>
                <h3 className={cn(
                  'px-3 text-xs font-semibold uppercase tracking-wider mb-3',
                  category.color
                )}>
                  {category.name}
                </h3>
                <div className="space-y-1">
                  {categoryItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isActiveRoute(item.href);

                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                        )}
                      >
                        <Icon
                          className={cn(
                            'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                            isActive 
                              ? 'text-blue-500 dark:text-blue-400' 
                              : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                          )}
                        />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <Link
              to="/dashboard/profile"
              className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <UserIcon className="h-4 w-4" />
              <span>Profile</span>
            </Link>
            <Link
              to="/dashboard/settings"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <Cog6ToothIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </>
    );
  }
};

export default DashboardLayout;