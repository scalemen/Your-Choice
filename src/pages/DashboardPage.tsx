import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/utils/cn';
import {
  ChartBarIcon,
  BookOpenIcon,
  ClockIcon,
  TrophyIcon,
  FireIcon,
  LightBulbIcon,
  UserGroupIcon,
  BeakerIcon,
  PlayIcon,
  PauseIcon,
  BoltIcon,
  HeartIcon,
  EyeIcon,
  BrainIcon,
  SparklesIcon,
  RocketLaunchIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlusIcon,
  EllipsisHorizontalIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
  PaperAirplaneIcon,
  FaceSmileIcon,
  MapPinIcon,
  GlobeAltIcon,
  CloudIcon,
  SunIcon,
  MoonIcon,
  CubeIcon,
  CircleStackIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  WifiIcon,
  SignalIcon,
  BatteryIcon,
  CommandLineIcon,
  CpuChipIcon,
  ServerIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  KeyIcon,
  FingerPrintIcon,
  CreditCardIcon,
  BanknotesIcon,
  ChartPieIcon,
  PresentationChartBarIcon,
  CursorArrowRaysIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  ArrowsUpDownIcon,
  ArrowsPointingOutIcon,
  PhotoIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  MusicalNoteIcon,
  PaintBrushIcon,
  SwatchIcon,
  CameraIcon,
  FilmIcon,
  ArchiveBoxIcon,
  FolderIcon,
  DocumentDuplicateIcon,
  LinkIcon,
  ShareIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  EnvelopeIcon,
  PhoneIcon,
  AtSymbolIcon,
  HashtagIcon,
  TagIcon,
  FlagIcon,
  ExclamationCircleIcon,
  QuestionMarkCircleIcon,
  MegaphoneIcon,
  SpeakerXMarkIcon,
  EyeSlashIcon,
  NoSymbolIcon,
  StopIcon,
  ForwardIcon,
  BackwardIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleUpIcon,
  ChevronDoubleDownIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  HomeIcon,
  BuildingStorefrontIcon,
  MapIcon,
  GiftIcon,
  HeartIcon as Heart2Icon,
  FaceSmileIcon as Smile2Icon,
  HandRaisedIcon,
  UserIcon,
  UsersIcon,
  UserPlusIcon,
  UserMinusIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'activity' | 'progress' | 'calendar' | 'recommendations' | 'social' | 'achievements';
  title: string;
  size: 'small' | 'medium' | 'large' | 'xl';
  position: { x: number; y: number; w: number; h: number };
  data: any;
  settings: any;
  isCollapsed?: boolean;
  lastUpdated?: Date;
}

interface ActivityItem {
  id: string;
  type: 'study' | 'achievement' | 'social' | 'system';
  icon: React.ElementType;
  title: string;
  description: string;
  time: string;
  data?: any;
  priority: 'low' | 'medium' | 'high';
}

interface StudySession {
  id: string;
  subject: string;
  duration: number;
  score?: number;
  completedAt: Date;
  type: 'flashcards' | 'notes' | 'quiz' | 'video' | 'practice';
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  maxProgress: number;
  unlockedAt?: Date;
  reward?: string;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year'>('week');
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeWidget, setActiveWidget] = useState<string | null>(null);
  
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Initialize dashboard data
  useEffect(() => {
    const initializeDashboard = async () => {
      setIsLoading(true);
      
      // Simulate loading dashboard data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Initialize widgets
      const defaultWidgets: DashboardWidget[] = [
        {
          id: 'study-streak',
          type: 'metric',
          title: 'Study Streak',
          size: 'small',
          position: { x: 0, y: 0, w: 1, h: 1 },
          data: { value: 15, unit: 'days', trend: 'up', change: '+2' },
          settings: { color: 'blue' }
        },
        {
          id: 'total-hours',
          type: 'metric',
          title: 'Total Study Hours',
          size: 'small',
          position: { x: 1, y: 0, w: 1, h: 1 },
          data: { value: 127, unit: 'hours', trend: 'up', change: '+8.5' },
          settings: { color: 'green' }
        },
        {
          id: 'completion-rate',
          type: 'metric',
          title: 'Completion Rate',
          size: 'small',
          position: { x: 2, y: 0, w: 1, h: 1 },
          data: { value: 89, unit: '%', trend: 'up', change: '+3.2' },
          settings: { color: 'purple' }
        },
        {
          id: 'performance-score',
          type: 'metric',
          title: 'Performance Score',
          size: 'small',
          position: { x: 3, y: 0, w: 1, h: 1 },
          data: { value: 4.2, unit: '/5.0', trend: 'up', change: '+0.1' },
          settings: { color: 'orange' }
        },
        {
          id: 'weekly-progress',
          type: 'chart',
          title: 'Weekly Study Progress',
          size: 'medium',
          position: { x: 0, y: 1, w: 2, h: 2 },
          data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
              {
                label: 'Study Hours',
                data: [2.5, 3.2, 1.8, 4.1, 2.9, 1.5, 3.7],
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 2
              }
            ]
          },
          settings: { chartType: 'bar' }
        },
        {
          id: 'subject-breakdown',
          type: 'chart',
          title: 'Subject Distribution',
          size: 'medium',
          position: { x: 2, y: 1, w: 2, h: 2 },
          data: {
            labels: ['Mathematics', 'Science', 'History', 'Language', 'Programming'],
            datasets: [
              {
                data: [30, 25, 15, 20, 10],
                backgroundColor: [
                  'rgba(59, 130, 246, 0.8)',
                  'rgba(16, 185, 129, 0.8)',
                  'rgba(245, 101, 101, 0.8)',
                  'rgba(139, 92, 246, 0.8)',
                  'rgba(251, 191, 36, 0.8)'
                ]
              }
            ]
          },
          settings: { chartType: 'doughnut' }
        },
        {
          id: 'recent-activity',
          type: 'activity',
          title: 'Recent Activity',
          size: 'medium',
          position: { x: 0, y: 3, w: 2, h: 2 },
          data: { maxItems: 5 },
          settings: {}
        },
        {
          id: 'upcoming-deadlines',
          type: 'calendar',
          title: 'Upcoming Deadlines',
          size: 'medium',
          position: { x: 2, y: 3, w: 2, h: 2 },
          data: {
            events: [
              { title: 'Math Quiz', date: '2024-01-20', type: 'quiz' },
              { title: 'History Essay', date: '2024-01-22', type: 'assignment' },
              { title: 'Science Project', date: '2024-01-25', type: 'project' }
            ]
          },
          settings: {}
        }
      ];

      // Initialize activities
      const sampleActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'study',
          icon: BookOpenIcon,
          title: 'Completed Mathematics Quiz',
          description: 'Scored 92% on Algebra fundamentals',
          time: '2 hours ago',
          priority: 'medium',
          data: { score: 92, subject: 'Mathematics' }
        },
        {
          id: '2',
          type: 'achievement',
          icon: TrophyIcon,
          title: 'Achievement Unlocked!',
          description: 'Study Streak Champion - 15 days in a row',
          time: '3 hours ago',
          priority: 'high',
          data: { achievement: 'study-streak-15' }
        },
        {
          id: '3',
          type: 'social',
          icon: UserGroupIcon,
          title: 'Joined Study Group',
          description: 'Advanced Physics Discussion Group',
          time: '5 hours ago',
          priority: 'low',
          data: { groupId: 'physics-advanced' }
        },
        {
          id: '4',
          type: 'study',
          icon: DocumentTextIcon,
          title: 'Created New Notes',
          description: 'Quantum Mechanics Chapter 3',
          time: '1 day ago',
          priority: 'medium',
          data: { subject: 'Physics', pages: 8 }
        },
        {
          id: '5',
          type: 'system',
          icon: SparklesIcon,
          title: 'AI Recommendation',
          description: 'Based on your progress, try advanced calculus',
          time: '1 day ago',
          priority: 'medium',
          data: { recommendationType: 'subject' }
        }
      ];

      // Initialize study sessions
      const sampleSessions: StudySession[] = [
        {
          id: '1',
          subject: 'Mathematics',
          duration: 120,
          score: 88,
          completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          type: 'flashcards'
        },
        {
          id: '2',
          subject: 'Physics',
          duration: 90,
          score: 94,
          completedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
          type: 'quiz'
        },
        {
          id: '3',
          subject: 'History',
          duration: 75,
          completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          type: 'notes'
        }
      ];

      // Initialize achievements
      const sampleAchievements: Achievement[] = [
        {
          id: '1',
          title: 'Study Streak Champion',
          description: 'Study for 15 consecutive days',
          icon: FireIcon,
          category: 'Consistency',
          rarity: 'rare',
          progress: 15,
          maxProgress: 15,
          unlockedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          reward: '100 XP'
        },
        {
          id: '2',
          title: 'Quiz Master',
          description: 'Score 90% or higher on 10 quizzes',
          icon: BrainIcon,
          category: 'Performance',
          rarity: 'epic',
          progress: 7,
          maxProgress: 10,
          reward: '250 XP'
        },
        {
          id: '3',
          title: 'Social Learner',
          description: 'Join 5 study groups',
          icon: UserGroupIcon,
          category: 'Social',
          rarity: 'common',
          progress: 3,
          maxProgress: 5,
          reward: '50 XP'
        },
        {
          id: '4',
          title: 'Note Taking Pro',
          description: 'Create 100 pages of notes',
          icon: DocumentTextIcon,
          category: 'Content',
          rarity: 'rare',
          progress: 73,
          maxProgress: 100,
          reward: '150 XP'
        }
      ];

      setWidgets(defaultWidgets);
      setActivities(sampleActivities);
      setStudySessions(sampleSessions);
      setAchievements(sampleAchievements);
      setIsLoading(false);
    };

    initializeDashboard();
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />;
      case 'down':
        return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />;
      default:
        return <ArrowsUpDownIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'study':
        return BookOpenIcon;
      case 'achievement':
        return TrophyIcon;
      case 'social':
        return UserGroupIcon;
      case 'system':
        return CogIcon;
      default:
        return InformationCircleIcon;
    }
  };

  const getActivityColor = (priority: ActivityItem['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'medium':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'low':
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
      case 'rare':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'epic':
        return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30';
      case 'legendary':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  const quickActions = [
    {
      id: 'start-study',
      title: 'Start Study Session',
      description: 'Begin a new focused study session',
      icon: PlayIcon,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => console.log('Start study session')
    },
    {
      id: 'create-flashcards',
      title: 'Create Flashcards',
      description: 'Make new flashcards for review',
      icon: DocumentTextIcon,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => console.log('Create flashcards')
    },
    {
      id: 'take-quiz',
      title: 'Take Quiz',
      description: 'Test your knowledge',
      icon: BeakerIcon,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => console.log('Take quiz')
    },
    {
      id: 'join-group',
      title: 'Join Study Group',
      description: 'Connect with other learners',
      icon: UserGroupIcon,
      color: 'bg-orange-500 hover:bg-orange-600',
      action: () => console.log('Join study group')
    }
  ];

  const notifications = [
    {
      id: '1',
      type: 'reminder',
      title: 'Study Reminder',
      message: 'Time for your daily physics review',
      time: '5 minutes ago',
      unread: true
    },
    {
      id: '2',
      type: 'achievement',
      title: 'New Achievement!',
      message: 'You unlocked "Study Streak Champion"',
      time: '2 hours ago',
      unread: true
    },
    {
      id: '3',
      type: 'social',
      title: 'Group Invitation',
      message: 'Sarah invited you to "Advanced Calculus"',
      time: '4 hours ago',
      unread: false
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Loading your dashboard...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Preparing your personalized learning experience
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard - StudyGenius</title>
        <meta name="description" content="Your personalized learning dashboard with analytics, progress tracking, and study insights." />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900" ref={dashboardRef}>
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left side - Greeting */}
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {getGreeting()}, {user?.name?.split(' ')[0] || 'Student'}! 👋
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(currentTime)} • {formatTime(currentTime)}
                  </p>
                </div>
              </div>

              {/* Right side - Actions */}
              <div className="flex items-center space-x-4">
                {/* Quick Actions Button */}
                <div className="relative">
                  <button
                    onClick={() => setQuickActionOpen(!quickActionOpen)}
                    className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>

                  <AnimatePresence>
                    {quickActionOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                      >
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Quick Actions
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                            {quickActions.map((action) => (
                              <button
                                key={action.id}
                                onClick={() => {
                                  action.action();
                                  setQuickActionOpen(false);
                                }}
                                className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                              >
                                <action.icon className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
                                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                  {action.title}
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {action.description}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative"
                  >
                    <BellIcon className="w-5 h-5" />
                    {notifications.some(n => n.unread) && (
                      <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </button>

                  <AnimatePresence>
                    {notificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto"
                      >
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Notifications
                          </h3>
                          <div className="space-y-3">
                            {notifications.map((notification) => (
                              <div
                                key={notification.id}
                                className={cn(
                                  "p-3 rounded-lg border transition-colors",
                                  notification.unread
                                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                    : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                                )}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                      {notification.title}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                      {notification.time}
                                    </p>
                                  </div>
                                  {notification.unread && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Settings */}
                <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <Cog6ToothIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {widgets.filter(w => w.type === 'metric').map((widget) => (
              <motion.div
                key={widget.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {widget.title}
                    </p>
                    <div className="flex items-baseline mt-2">
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {widget.data.value}
                      </p>
                      <p className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                        {widget.data.unit}
                      </p>
                    </div>
                    <div className="flex items-center mt-1">
                      {getTrendIcon(widget.data.trend)}
                      <span className={cn(
                        "ml-1 text-sm",
                        widget.data.trend === 'up' ? "text-green-600 dark:text-green-400" :
                        widget.data.trend === 'down' ? "text-red-600 dark:text-red-400" :
                        "text-gray-500 dark:text-gray-400"
                      )}>
                        {widget.data.change}
                      </span>
                    </div>
                  </div>
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center",
                    widget.settings.color === 'blue' && "bg-blue-100 dark:bg-blue-900/30",
                    widget.settings.color === 'green' && "bg-green-100 dark:bg-green-900/30",
                    widget.settings.color === 'purple' && "bg-purple-100 dark:bg-purple-900/30",
                    widget.settings.color === 'orange' && "bg-orange-100 dark:bg-orange-900/30"
                  )}>
                    {widget.id === 'study-streak' && <FireIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                    {widget.id === 'total-hours' && <ClockIcon className="w-6 h-6 text-green-600 dark:text-green-400" />}
                    {widget.id === 'completion-rate' && <CheckCircleIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
                    {widget.id === 'performance-score' && <TrophyIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Study Progress Chart */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Study Progress
                  </h3>
                  <div className="flex items-center space-x-2">
                    {(['today', 'week', 'month', 'year'] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => setSelectedPeriod(period)}
                        className={cn(
                          "px-3 py-1 rounded-lg text-sm font-medium transition-colors",
                          selectedPeriod === period
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                      >
                        {period.charAt(0).toUpperCase() + period.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Chart Placeholder */}
                <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <ChartBarIcon className="w-12 h-12 text-blue-500 dark:text-blue-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">Study progress chart would be rendered here</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Achievements */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Achievements
                </h3>
                <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                  View All
                </button>
              </div>

              <div className="space-y-4">
                {achievements.slice(0, 3).map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-start space-x-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      getRarityColor(achievement.rarity)
                    )}>
                      <achievement.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {achievement.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {achievement.description}
                      </p>
                      {achievement.unlockedAt ? (
                        <div className="flex items-center mt-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
                          <span className="text-xs text-green-600 dark:text-green-400">Unlocked</span>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                            <span>{achievement.progress}/{achievement.maxProgress}</span>
                            <span>{Math.round((achievement.progress / achievement.maxProgress) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Activity
                </h3>
                <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                  View All
                </button>
              </div>

              <div className="space-y-4">
                {activities.slice(0, 5).map((activity) => {
                  const IconComponent = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex items-start space-x-4">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                        getActivityColor(activity.priority)
                      )}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {activity.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upcoming Schedule */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Upcoming Schedule
                </h3>
                <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                  View Calendar
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <BeakerIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">Math Quiz</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Today, 3:00 PM</p>
                  </div>
                  <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded">
                    Due Soon
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <DocumentTextIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">History Essay</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tomorrow, 11:59 PM</p>
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                    In Progress
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <UserGroupIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">Study Group Meeting</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Friday, 7:00 PM</p>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    Scheduled
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendations Section */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  AI-Powered Recommendations
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Personalized suggestions to enhance your learning
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                  <BookOpenIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Study Advanced Calculus
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Based on your strong performance in algebra, you're ready for calculus concepts.
                </p>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                  Start Learning
                </button>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                  <UserGroupIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Join Physics Study Group
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Connect with peers who share similar learning patterns and interests.
                </p>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Find Groups
                </button>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                  <ClockIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Optimize Study Schedule
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Your peak focus time is 2-4 PM. Schedule challenging topics during this window.
                </p>
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                  Update Schedule
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default DashboardPage;