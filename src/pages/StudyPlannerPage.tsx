import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  SparklesIcon,
  ChartBarIcon,
  BookOpenIcon,
  AcademicCapIcon,
  BoltIcon,
  FireIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ShareIcon,
  CogIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ForwardIcon,
  BackwardIcon,
  ArrowTrendingUpIcon,
  TrophyIcon,
  LightBulbIcon,
  BeakerIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  EllipsisHorizontalIcon,
  XMarkIcon,
  InformationCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  BellIcon,
  MapIcon,
  TagIcon,
  LinkIcon,
  PrinterIcon,
  CloudArrowDownIcon,
  CloudArrowUpIcon,
  BuildingLibraryIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  SunIcon,
  MoonIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarSolidIcon,
  CheckCircleIcon as CheckCircleSolidIcon,
  BoltIcon as BoltSolidIcon,
  FireIcon as FireSolidIcon,
  TrophyIcon as TrophySolidIcon
} from '@heroicons/react/24/solid';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { cn } from '../utils/cn';

// Types
interface StudyPlan {
  id: string;
  title: string;
  description: string;
  subject: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration: number; // in days
  estimatedHours: number;
  isAIGenerated: boolean;
  createdBy: string;
  status: 'draft' | 'active' | 'completed' | 'paused' | 'archived';
  progress: number; // 0-100
  startDate?: string;
  endDate?: string;
  goals: Array<{
    id: string;
    title: string;
    description: string;
    isCompleted: boolean;
    priority: 'low' | 'medium' | 'high' | 'critical';
    dueDate?: string;
  }>;
  milestones: Array<{
    id: string;
    title: string;
    description: string;
    targetDate: string;
    isCompleted: boolean;
    progress: number;
    rewards: string[];
  }>;
  studySessions: Array<{
    id: string;
    title: string;
    description: string;
    duration: number; // in minutes
    type: 'study' | 'review' | 'practice' | 'break' | 'assessment';
    scheduledAt: string;
    completedAt?: string;
    isCompleted: boolean;
    notes?: string;
    rating?: number;
    focusScore?: number;
  }>;
  resources: Array<{
    id: string;
    title: string;
    type: 'note' | 'flashcard' | 'quiz' | 'video' | 'book' | 'article' | 'website';
    url?: string;
    isRequired: boolean;
    isCompleted: boolean;
  }>;
  collaborators: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: 'viewer' | 'editor' | 'admin';
  }>;
  analytics: {
    totalStudyTime: number;
    averageSessionRating: number;
    averageFocusScore: number;
    streakDays: number;
    completedSessions: number;
    totalSessions: number;
    productiveHours: string[];
    weakAreas: string[];
    strongAreas: string[];
  };
  tags: string[];
  isPublic: boolean;
  isTemplate: boolean;
  templateUsageCount?: number;
  rating?: number;
  reviewCount?: number;
  favoriteCount: number;
  shareLink?: string;
  createdAt: string;
  updatedAt: string;
}

interface StudySession {
  id: string;
  planId: string;
  title: string;
  description: string;
  duration: number;
  type: 'study' | 'review' | 'practice' | 'break' | 'assessment';
  status: 'scheduled' | 'active' | 'completed' | 'missed' | 'cancelled';
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  actualDuration?: number;
  notes?: string;
  rating?: number;
  focusScore?: number;
  distractions: number;
  pomodoroCount: number;
  techniques: string[];
  environment: string;
  mood: 'excellent' | 'good' | 'neutral' | 'poor' | 'terrible';
  energy: 'high' | 'medium' | 'low';
  resources: Array<{
    id: string;
    title: string;
    timeSpent: number;
    isCompleted: boolean;
  }>;
  achievements: string[];
}

interface StudyTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  subject: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration: number;
  estimatedHours: number;
  rating: number;
  usageCount: number;
  isOfficial: boolean;
  isPremium: boolean;
  previewImage?: string;
  goals: Array<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>;
  milestones: Array<{
    title: string;
    description: string;
    dayOffset: number;
  }>;
  sessionTemplate: Array<{
    title: string;
    type: 'study' | 'review' | 'practice' | 'break' | 'assessment';
    duration: number;
    dayOffset: number;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  }>;
  tags: string[];
  createdAt: string;
}

interface StudyAnalytics {
  totalPlans: number;
  activePlans: number;
  completedPlans: number;
  totalStudyTime: number;
  thisWeekStudyTime: number;
  averageSessionDuration: number;
  averageFocusScore: number;
  currentStreak: number;
  longestStreak: number;
  preferredStudyTime: string;
  mostProductiveDay: string;
  subjectBreakdown: Array<{
    subject: string;
    time: number;
    sessions: number;
    avgRating: number;
  }>;
  weeklyProgress: Array<{
    date: string;
    studyTime: number;
    sessions: number;
    focusScore: number;
  }>;
  monthlyGoals: {
    totalHours: number;
    completedHours: number;
    targetSessions: number;
    completedSessions: number;
    streakTarget: number;
    currentStreak: number;
  };
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    earnedAt: string;
    category: string;
  }>;
  recommendations: Array<{
    type: 'schedule' | 'technique' | 'break' | 'subject' | 'goal';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    actionable: boolean;
  }>;
}

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  type: 'study' | 'milestone' | 'deadline' | 'break' | 'exam' | 'meeting';
  planId?: string;
  sessionId?: string;
  color: string;
  isCompleted: boolean;
  isRecurring: boolean;
  recurrenceRule?: string;
  reminders: Array<{
    type: 'notification' | 'email' | 'sms';
    offset: number; // minutes before event
  }>;
}

const StudyPlannerPage: React.FC = () => {
  // State Management
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'sessions' | 'analytics' | 'templates'>('overview');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<{
    status?: 'draft' | 'active' | 'completed' | 'paused' | 'archived';
    subject?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    tags?: string[];
    dateRange?: { start: string; end: string };
  }>({});
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'progress' | 'deadline' | 'priority'>('updated');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [timerDuration, setTimerDuration] = useState(25 * 60); // 25 minutes in seconds
  const [timeRemaining, setTimeRemaining] = useState(timerDuration);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<StudyTemplate | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Query Client
  const queryClient = useQueryClient();

  // API Queries
  const { data: studyPlans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['study-plans', searchQuery, filterBy, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterBy.status) params.append('status', filterBy.status);
      if (filterBy.subject) params.append('subject', filterBy.subject);
      if (filterBy.difficulty) params.append('difficulty', filterBy.difficulty);
      if (filterBy.tags?.length) params.append('tags', filterBy.tags.join(','));
      params.append('sort', sortBy);
      
      const response = await fetch(`/api/enhanced-study-planner/plans?${params}`);
      if (!response.ok) throw new Error('Failed to fetch study plans');
      return response.json();
    },
    refetchOnWindowFocus: false,
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['study-templates'],
    queryFn: async () => {
      const response = await fetch('/api/enhanced-study-planner/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['study-analytics', analyticsTimeRange],
    queryFn: async () => {
      const response = await fetch(`/api/enhanced-study-planner/analytics?range=${analyticsTimeRange}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
  });

  const { data: calendarEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['calendar-events', selectedDate.getMonth(), selectedDate.getFullYear()],
    queryFn: async () => {
      const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      
      const response = await fetch(`/api/enhanced-study-planner/events?start=${start.toISOString()}&end=${end.toISOString()}`);
      if (!response.ok) throw new Error('Failed to fetch calendar events');
      return response.json();
    },
  });

  const { data: activeSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['active-sessions'],
    queryFn: async () => {
      const response = await fetch('/api/enhanced-study-planner/sessions/active');
      if (!response.ok) throw new Error('Failed to fetch active sessions');
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mutations
  const createPlanMutation = useMutation({
    mutationFn: async (planData: Partial<StudyPlan>) => {
      const response = await fetch('/api/enhanced-study-planner/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData),
      });
      if (!response.ok) throw new Error('Failed to create study plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-plans'] });
      queryClient.invalidateQueries({ queryKey: ['study-analytics'] });
      toast.success('Study plan created successfully!');
      setShowCreatePlan(false);
    },
    onError: () => {
      toast.error('Failed to create study plan');
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StudyPlan> }) => {
      const response = await fetch(`/api/enhanced-study-planner/plans/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update study plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-plans'] });
      queryClient.invalidateQueries({ queryKey: ['study-analytics'] });
      toast.success('Study plan updated successfully!');
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await fetch(`/api/enhanced-study-planner/plans/${planId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete study plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-plans'] });
      queryClient.invalidateQueries({ queryKey: ['study-analytics'] });
      toast.success('Study plan deleted successfully!');
    },
  });

  const startSessionMutation = useMutation({
    mutationFn: async (sessionData: Partial<StudySession>) => {
      const response = await fetch('/api/enhanced-study-planner/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });
      if (!response.ok) throw new Error('Failed to start study session');
      return response.json();
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
      setCurrentSession(session);
      setIsTimerRunning(true);
      toast.success('Study session started!');
    },
  });

  const completeSessionMutation = useMutation({
    mutationFn: async ({ sessionId, data }: { sessionId: string; data: Partial<StudySession> }) => {
      const response = await fetch(`/api/enhanced-study-planner/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to complete study session');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['study-plans'] });
      queryClient.invalidateQueries({ queryKey: ['study-analytics'] });
      setCurrentSession(null);
      setIsTimerRunning(false);
      setTimeRemaining(timerDuration);
      toast.success('Study session completed!');
    },
  });

  const generateAIPlanMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await fetch('/api/enhanced-study-planner/ai/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) throw new Error('Failed to generate AI plan');
      return response.json();
    },
    onSuccess: (plan) => {
      setAiSuggestions([plan]);
      toast.success('AI study plan generated!');
    },
  });

  // Timer functionality
  useEffect(() => {
    if (isTimerRunning && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isTimerRunning) {
      // Timer finished
      setIsTimerRunning(false);
      setPomodoroCount(prev => prev + 1);
      
      // Play notification sound
      if (audioRef.current) {
        audioRef.current.play();
      }
      
      // Show completion notification
      toast.success('Study session completed! Time for a break.');
      
      // Auto-complete session if exists
      if (currentSession) {
        completeSessionMutation.mutate({
          sessionId: currentSession.id,
          data: {
            completedAt: new Date().toISOString(),
            actualDuration: timerDuration / 60,
            pomodoroCount: pomodoroCount + 1,
          },
        });
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isTimerRunning, timeRemaining, currentSession, pomodoroCount, timerDuration, completeSessionMutation]);

  // Utility functions
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600 dark:text-green-400';
    if (progress >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (progress >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
      case 'intermediate': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
      case 'advanced': return 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300';
      case 'expert': return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
      default: return 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
      case 'completed': return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
      case 'paused': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
      case 'archived': return 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300';
      default: return 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300';
    }
  };

  const handleStartTimer = (duration: number = 25 * 60) => {
    setTimerDuration(duration);
    setTimeRemaining(duration);
    setIsTimerRunning(true);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimeRemaining(timerDuration);
  };

  const handleStartSession = (planId: string, sessionTitle: string) => {
    const sessionData: Partial<StudySession> = {
      planId,
      title: sessionTitle,
      duration: timerDuration / 60,
      type: 'study',
      scheduledAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
    };
    startSessionMutation.mutate(sessionData);
  };

  const filteredPlans = useMemo(() => {
    return studyPlans.filter((plan: StudyPlan) => {
      if (filterBy.status && plan.status !== filterBy.status) return false;
      if (filterBy.subject && plan.subject !== filterBy.subject) return false;
      if (filterBy.difficulty && plan.difficulty !== filterBy.difficulty) return false;
      if (filterBy.tags?.length && !filterBy.tags.every(tag => plan.tags.includes(tag))) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          plan.title.toLowerCase().includes(query) ||
          plan.description.toLowerCase().includes(query) ||
          plan.subject.toLowerCase().includes(query) ||
          plan.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }
      
      return true;
    });
  }, [studyPlans, filterBy, searchQuery]);

  const sortedPlans = useMemo(() => {
    return [...filteredPlans].sort((a, b) => {
      switch (sortBy) {
        case 'progress':
          return b.progress - a.progress;
        case 'deadline':
          if (!a.endDate && !b.endDate) return 0;
          if (!a.endDate) return 1;
          if (!b.endDate) return -1;
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        case 'priority':
          // Sort by number of high priority goals
          const aHighPriority = a.goals.filter(g => g.priority === 'high' || g.priority === 'critical').length;
          const bHighPriority = b.goals.filter(g => g.priority === 'high' || g.priority === 'critical').length;
          return bHighPriority - aHighPriority;
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });
  }, [filteredPlans, sortBy]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            setShowCreatePlan(true);
            break;
          case 'f':
            e.preventDefault();
            searchInputRef.current?.focus();
            break;
          case 't':
            e.preventDefault();
            if (!isTimerRunning) {
              handleStartTimer();
            } else {
              handlePauseTimer();
            }
            break;
        }
      }
      
      if (e.key === 'Escape') {
        setShowCreatePlan(false);
        setShowTemplateModal(false);
        setShowSessionDetails(false);
        setShowAIAssistant(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTimerRunning]);

  const renderPlanCard = (plan: StudyPlan) => (
    <motion.div
      key={plan.id}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden border border-gray-200 dark:border-gray-700"
      onClick={() => setSelectedPlan(plan.id)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {plan.title}
              </h3>
              {plan.isAIGenerated && (
                <SparklesIcon className="w-4 h-4 text-purple-500" />
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
              {plan.description}
            </p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <span className={cn("px-2 py-1 text-xs rounded-full", getStatusColor(plan.status))}>
              {plan.status}
            </span>
            <span className={cn("px-2 py-1 text-xs rounded-full", getDifficultyColor(plan.difficulty))}>
              {plan.difficulty}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progress
            </span>
            <span className={cn("text-sm font-semibold", getProgressColor(plan.progress))}>
              {plan.progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${plan.progress}%` }}
            />
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {plan.estimatedHours}h
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Est. Time
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {plan.goals.filter(g => g.isCompleted).length}/{plan.goals.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Goals
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {plan.analytics.streakDays}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Streak
            </div>
          </div>
        </div>

        {/* Tags */}
        {plan.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {plan.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full"
              >
                {tag}
              </span>
            ))}
            {plan.tags.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                +{plan.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {plan.collaborators.length > 0 && (
              <div className="flex items-center space-x-1">
                <UserGroupIcon className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">{plan.collaborators.length}</span>
              </div>
            )}
            <span className="text-xs text-gray-500">
              {new Date(plan.updatedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStartSession(plan.id, plan.title);
              }}
              className="p-1.5 rounded-md hover:bg-green-100 dark:hover:bg-green-900 transition-colors"
              disabled={plan.status !== 'active'}
            >
              <PlayIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Share plan
              }}
              className="p-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
            >
              <ShareIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // More options
              }}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <EllipsisHorizontalIcon className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      {plan.analytics.totalStudyTime > 0 && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <ClockIcon className="w-3 h-3" />
              <span>{Math.round(plan.analytics.totalStudyTime / 60)}h studied</span>
            </div>
            <div className="flex items-center space-x-1">
              <StarIcon className="w-3 h-3" />
              <span>{plan.analytics.averageSessionRating.toFixed(1)} avg rating</span>
            </div>
            <div className="flex items-center space-x-1">
              <BoltIcon className="w-3 h-3" />
              <span>{plan.analytics.averageFocusScore}% focus</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );

  const renderTimer = () => (
    <div className="fixed bottom-6 right-6 z-50">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 min-w-[300px]"
      >
        <div className="text-center mb-4">
          <div className="text-3xl font-bold font-mono text-gray-900 dark:text-gray-100 mb-2">
            {formatTime(timeRemaining)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {currentSession ? currentSession.title : 'Study Timer'}
          </div>
          {pomodoroCount > 0 && (
            <div className="flex items-center justify-center space-x-1 mt-2">
              {Array.from({ length: pomodoroCount }, (_, i) => (
                <TrophySolidIcon key={i} className="w-4 h-4 text-yellow-500" />
              ))}
              <span className="text-xs text-gray-500 ml-2">
                {pomodoroCount} pomodoro{pomodoroCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center space-x-3 mb-4">
          {!isTimerRunning ? (
            <button
              onClick={() => handleStartTimer()}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <PlayIcon className="w-4 h-4" />
              <span>Start</span>
            </button>
          ) : (
            <button
              onClick={handlePauseTimer}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
            >
              <PauseIcon className="w-4 h-4" />
              <span>Pause</span>
            </button>
          )}
          <button
            onClick={handleResetTimer}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentSession(null)}
            className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <StopIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <button
            onClick={() => handleStartTimer(15 * 60)}
            className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            15m
          </button>
          <button
            onClick={() => handleStartTimer(25 * 60)}
            className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            25m
          </button>
          <button
            onClick={() => handleStartTimer(45 * 60)}
            className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            45m
          </button>
          <button
            onClick={() => handleStartTimer(60 * 60)}
            className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            60m
          </button>
        </div>
      </motion.div>
    </div>
  );

  if (plansLoading || templatesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading your study plans..." />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Study Planner - StudyGenius</title>
        <meta name="description" content="AI-powered study planning with calendar integration, progress tracking, and collaborative features" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left Section */}
              <div className="flex items-center space-x-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Study Planner
                </h1>
                
                {/* Tab Navigation */}
                <nav className="flex space-x-1">
                  {[
                    { key: 'overview', label: 'Overview', icon: BookOpenIcon },
                    { key: 'calendar', label: 'Calendar', icon: CalendarIcon },
                    { key: 'sessions', label: 'Sessions', icon: ClockIcon },
                    { key: 'analytics', label: 'Analytics', icon: ChartBarIcon },
                    { key: 'templates', label: 'Templates', icon: DocumentTextIcon },
                  ].map(tab => {
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={cn(
                          "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          activeTab === tab.key
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Search */}
              <div className="flex-1 max-w-md mx-8">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search study plans..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Right Section */}
              <div className="flex items-center space-x-2">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "p-1.5 rounded transition-colors",
                      viewMode === 'grid' 
                        ? "bg-white dark:bg-gray-600 shadow-sm" 
                        : "hover:bg-gray-200 dark:hover:bg-gray-600"
                    )}
                  >
                    <Squares2X2Icon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "p-1.5 rounded transition-colors",
                      viewMode === 'list' 
                        ? "bg-white dark:bg-gray-600 shadow-sm" 
                        : "hover:bg-gray-200 dark:hover:bg-gray-600"
                    )}
                  >
                    <ViewColumnsIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    showFilters 
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                      : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  )}
                >
                  <FunnelIcon className="w-5 h-5" />
                </button>

                {/* AI Assistant Toggle */}
                <button
                  onClick={() => setShowAIAssistant(!showAIAssistant)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    showAIAssistant 
                      ? "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400"
                      : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  )}
                >
                  <SparklesIcon className="w-5 h-5" />
                </button>

                {/* Create Plan Button */}
                <button
                  onClick={() => setShowCreatePlan(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>New Plan</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              >
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Status:
                      </label>
                      <select
                        value={filterBy.status || ''}
                        onChange={(e) => setFilterBy(prev => ({ ...prev, status: e.target.value as any || undefined }))}
                        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      >
                        <option value="">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="paused">Paused</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Difficulty:
                      </label>
                      <select
                        value={filterBy.difficulty || ''}
                        onChange={(e) => setFilterBy(prev => ({ ...prev, difficulty: e.target.value as any || undefined }))}
                        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      >
                        <option value="">All Levels</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Sort by:
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      >
                        <option value="updated">Last Updated</option>
                        <option value="created">Date Created</option>
                        <option value="progress">Progress</option>
                        <option value="deadline">Deadline</option>
                        <option value="priority">Priority</option>
                      </select>
                    </div>

                    <button
                      onClick={() => setFilterBy({})}
                      className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Main Content */}
        <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Quick Stats */}
              {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <BookOpenIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      <div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {analytics.activePlans}
                        </div>
                        <div className="text-sm text-blue-600/70 dark:text-blue-400/70">
                          Active Plans
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <ClockIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                      <div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {Math.round(analytics.thisWeekStudyTime / 60)}h
                        </div>
                        <div className="text-sm text-green-600/70 dark:text-green-400/70">
                          This Week
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <FireSolidIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      <div>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {analytics.currentStreak}
                        </div>
                        <div className="text-sm text-purple-600/70 dark:text-purple-400/70">
                          Day Streak
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <TrophySolidIcon className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                      <div>
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {analytics.completedPlans}
                        </div>
                        <div className="text-sm text-orange-600/70 dark:text-orange-400/70">
                          Completed
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Study Plans Grid */}
              {sortedPlans.length === 0 ? (
                <div className="text-center py-20">
                  <BookOpenIcon className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {searchQuery || Object.keys(filterBy).length > 0 ? 'No study plans found' : 'No study plans yet'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {searchQuery || Object.keys(filterBy).length > 0 
                      ? 'Try adjusting your search or filters'
                      : 'Create your first study plan to get started with organized learning'
                    }
                  </p>
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={() => setShowCreatePlan(true)}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <PlusIcon className="w-5 h-5" />
                      <span>Create Study Plan</span>
                    </button>
                    <button
                      onClick={() => setShowTemplateModal(true)}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      <DocumentTextIcon className="w-5 h-5" />
                      <span>Browse Templates</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className={cn(
                  "transition-all duration-200",
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-4"
                )}>
                  <AnimatePresence mode="popLayout">
                    {sortedPlans.map(renderPlanCard)}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Study Calendar
                </h2>
                <div className="flex items-center space-x-2">
                  <select
                    value={calendarView}
                    onChange={(e) => setCalendarView(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="month">Month</option>
                    <option value="week">Week</option>
                    <option value="day">Day</option>
                  </select>
                </div>
              </div>
              
              <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                Calendar component would be integrated here
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="space-y-6">
              {/* Active Sessions */}
              {activeSessions.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Active Sessions
                  </h2>
                  <div className="space-y-4">
                    {activeSessions.map((session: StudySession) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg"
                      >
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            {session.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Started {new Date(session.startedAt!).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedSession(session)}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Session History */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Recent Sessions
                </h2>
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                  Session history would be displayed here
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {analytics && (
                <>
                  {/* Analytics Overview */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Weekly Progress
                      </h3>
                      <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                        Weekly progress chart would be here
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Subject Breakdown
                      </h3>
                      <div className="space-y-3">
                        {analytics.subjectBreakdown.map((subject, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {subject.subject}
                            </span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{ width: `${(subject.time / analytics.totalStudyTime) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {Math.round(subject.time / 60)}h
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Achievements */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Recent Achievements
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {analytics.achievements.slice(0, 6).map((achievement, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg"
                        >
                          <div className="text-2xl">{achievement.icon}</div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {achievement.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {achievement.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Study Plan Templates
                </h2>
                <button
                  onClick={() => setShowAIAssistant(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <SparklesIcon className="w-4 h-4" />
                  <span>AI Generate</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template: StudyTemplate) => (
                  <motion.div
                    key={template.id}
                    whileHover={{ y: -2 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden border border-gray-200 dark:border-gray-700"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              {template.title}
                            </h3>
                            {template.isOfficial && (
                              <CheckCircleSolidIcon className="w-4 h-4 text-blue-500" />
                            )}
                            {template.isPremium && (
                              <StarSolidIcon className="w-4 h-4 text-yellow-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {template.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                        <span className={cn("px-2 py-1 rounded-full", getDifficultyColor(template.difficulty))}>
                          {template.difficulty}
                        </span>
                        <span>{template.duration} days</span>
                        <span>{template.estimatedHours}h</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <StarSolidIcon className="w-3 h-3 text-yellow-500" />
                            <span className="text-sm">{template.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {template.usageCount} uses
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Use template
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
                        >
                          Use Template
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Timer Component */}
        {(currentSession || isTimerRunning) && renderTimer()}

        {/* Audio element for timer notifications */}
        <audio
          ref={audioRef}
          src="/sounds/timer-complete.mp3"
          preload="auto"
          style={{ display: 'none' }}
        />
      </div>
    </>
  );
};

export default StudyPlannerPage;