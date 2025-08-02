import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  ChatBubbleLeftRightIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  CameraIcon,
  PhotoIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  EllipsisHorizontalIcon,
  BookOpenIcon,
  AcademicCapIcon,
  BeakerIcon,
  CalculatorIcon,
  GlobeAltIcon,
  LanguageIcon,
  CodeBracketIcon,
  PaintBrushIcon,
  MusicalNoteIcon,
  ChartBarIcon,
  ClockIcon,
  UserIcon,
  CpuChipIcon,
  SparklesIcon,
  LightBulbIcon,
  QuestionMarkCircleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  ArrowPathIcon,
  HandRaisedIcon,
  EyeIcon,
  HeartIcon,
  FaceSmileIcon,
  FaceFrownIcon,
  StarIcon,
  FireIcon,
  BoltIcon,
  TrophyIcon,
  GiftIcon,
  ShieldCheckIcon,
  CogIcon,
  ShareIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  FolderOpenIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CubeIcon,
  PuzzlePieceIcon,
  RocketLaunchIcon,
  AdjustmentsHorizontalIcon,
  WrenchScrewdriverIcon,
  CommandLineIcon,
  ServerIcon,
  CubeTransparentIcon,
  CircleStackIcon,
  WindowIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  PrinterIcon,
  QrCodeIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  ArchiveBoxIcon,
  TrashIcon,
  PencilIcon,
  PencilSquareIcon,
  TagIcon,
  BookmarkIcon,
  FlagIcon,
  BellIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  NoSymbolIcon,
  ShieldExclamationIcon,
  LockClosedIcon,
  LockOpenIcon,
  KeyIcon,
  FingerPrintIcon,
  IdentificationIcon,
  UserCircleIcon,
  UserGroupIcon,
  UsersIcon,
  AtSymbolIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  ClipboardIcon,
  ListBulletIcon,
  TableCellsIcon,
  ChartPieIcon,
  PresentationChartBarIcon,
  PresentationChartLineIcon,
  BuildingLibraryIcon,
  HomeIcon,
  BuildingOfficeIcon,
  BuildingStorefrontIcon,
  MapIcon,
  GlobeAmericasIcon,
  GlobeAsiaAustraliaIcon,
  GlobeEuropeAfricaIcon,
  SunIcon,
  MoonIcon,
  CloudIcon,
  BugAntIcon,
  WifiIcon,
  SignalIcon,
  Battery0Icon,
  PowerIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ForwardIcon,
  BackwardIcon,
  SpeakerXMarkIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  PhoneArrowUpRightIcon,
  PhoneArrowDownLeftIcon,
  ChatBubbleBottomCenterTextIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  EnvelopeOpenIcon,
  InboxIcon,
  PaperClipIcon,
  FaceSmileIcon as HappyIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  HeartIcon as LoveIcon,
  FireIcon as HotIcon,
  EyeSlashIcon,
  EyeDropperIcon,
  SwatchIcon,
  ScissorsIcon,
  Square2StackIcon,
  RectangleGroupIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  Square3Stack3DIcon,
  CircleStackIcon as LayersIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  AdjustmentsVerticalIcon,
  Bars3Icon,
  Bars4Icon,
  QueueListIcon,
  RectangleStackIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
  ArrowUturnUpIcon,
  ArrowUturnDownIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ArrowTopRightOnSquareIcon,
  ArrowsRightLeftIcon,
  ArrowsUpDownIcon,
  ArrowLongUpIcon,
  ArrowLongDownIcon,
  ArrowLongLeftIcon,
  ArrowLongRightIcon
} from '@heroicons/react/24/outline';
import {
  ChatBubbleLeftRightIcon as ChatSolidIcon,
  StarIcon as StarSolidIcon,
  HeartIcon as HeartSolidIcon,
  FireIcon as FireSolidIcon,
  BoltIcon as BoltSolidIcon,
  TrophyIcon as TrophySolidIcon,
  CheckCircleIcon as CheckCircleSolidIcon,
  ExclamationCircleIcon as ExclamationCircleSolidIcon,
  CpuChipIcon as CpuChipSolidIcon,
  SparklesIcon as SparklesSolidIcon,
  LightBulbIcon as LightBulbSolidIcon,
  AcademicCapIcon as AcademicCapSolidIcon,
  BookOpenIcon as BookOpenSolidIcon,
  BeakerIcon as BeakerSolidIcon,
  CalculatorIcon as CalculatorSolidIcon,
  GlobeAltIcon as GlobeAltSolidIcon,
  CodeBracketIcon as CodeBracketSolidIcon,
  PaintBrushIcon as PaintBrushSolidIcon,
  MusicalNoteIcon as MusicalNoteSolidIcon,
  ChartBarIcon as ChartBarSolidIcon,
  ClockIcon as ClockSolidIcon,
  UserIcon as UserSolidIcon,
  HandThumbUpIcon as ThumbsUpSolidIcon,
  HandThumbDownIcon as ThumbsDownSolidIcon,
  FaceSmileIcon as SmileSolidIcon,
  MicrophoneIcon as MicrophoneSolidIcon,
  SpeakerWaveIcon as SpeakerSolidIcon,
  CameraIcon as CameraSolidIcon,
  PhotoIcon as PhotoSolidIcon,
  DocumentTextIcon as DocumentSolidIcon
} from '@heroicons/react/24/solid';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { cn } from '../utils/cn';

// Types
interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    type?: 'text' | 'image' | 'audio' | 'video' | 'code' | 'math' | 'diagram';
    attachments?: Array<{
      id: string;
      name: string;
      type: string;
      url: string;
      size: number;
    }>;
    citations?: Array<{
      id: string;
      title: string;
      url: string;
      snippet: string;
    }>;
    confidence?: number;
    reasoning?: string;
    suggestions?: string[];
    relatedTopics?: string[];
    difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    subject?: string;
    learningObjectives?: string[];
    prerequisites?: string[];
    nextSteps?: string[];
    resources?: Array<{
      title: string;
      type: 'article' | 'video' | 'book' | 'course' | 'practice';
      url: string;
      description: string;
    }>;
  };
  reactions?: {
    helpful: number;
    clear: number;
    accurate: number;
    engaging: number;
  };
  feedback?: {
    rating: number;
    comment?: string;
    tags?: string[];
  };
  isEdited?: boolean;
  editHistory?: Array<{
    content: string;
    timestamp: string;
  }>;
}

interface AITutorSession {
  id: string;
  title: string;
  subject: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  personalityType: 'friendly' | 'professional' | 'casual' | 'encouraging' | 'challenging';
  language: string;
  messages: AIMessage[];
  startedAt: string;
  lastActiveAt: string;
  duration: number; // in seconds
  messageCount: number;
  status: 'active' | 'paused' | 'completed' | 'archived';
  learningObjectives: string[];
  completedObjectives: string[];
  currentTopic?: string;
  progressScore: number; // 0-100
  engagementScore: number; // 0-100
  comprehensionScore: number; // 0-100
  tags: string[];
  isShared: boolean;
  shareCode?: string;
  collaborators?: Array<{
    id: string;
    name: string;
    role: 'viewer' | 'participant' | 'moderator';
  }>;
  analytics: {
    questionsAsked: number;
    conceptsExplained: number;
    problemsSolved: number;
    mistakesCorrected: number;
    hintsProvided: number;
    resourcesShared: number;
    topicsDiscussed: string[];
    difficultyProgression: Array<{
      timestamp: string;
      level: number;
    }>;
    engagementMetrics: {
      responseTime: number;
      messageLength: number;
      followUpQuestions: number;
      clarificationRequests: number;
    };
  };
  settings: {
    voiceEnabled: boolean;
    autoSpeak: boolean;
    showCitations: boolean;
    showConfidence: boolean;
    enableHints: boolean;
    adaptiveDifficulty: boolean;
    realTimeCorrection: boolean;
    contextualHelp: boolean;
    multimodalInput: boolean;
    collaborativeMode: boolean;
  };
  customInstructions?: string;
  contextFiles?: Array<{
    id: string;
    name: string;
    type: string;
    content: string;
    uploadedAt: string;
  }>;
}

interface TutorPersonality {
  id: string;
  name: string;
  description: string;
  avatar: string;
  expertise: string[];
  teachingStyle: string;
  personality: string;
  voice?: {
    id: string;
    name: string;
    gender: 'male' | 'female' | 'neutral';
    accent: string;
    speed: number;
    pitch: number;
  };
  specializations: string[];
  languages: string[];
  greetingMessages: string[];
  isCustom: boolean;
  isPremium: boolean;
  rating: number;
  usageCount: number;
  createdAt: string;
}

interface LearningContext {
  currentSubject?: string;
  currentLevel?: string;
  learningGoals?: string[];
  recentTopics?: string[];
  strongAreas?: string[];
  weakAreas?: string[];
  preferredExamples?: string[];
  avoidedTopics?: string[];
  studySchedule?: {
    duration: number;
    frequency: string;
    preferredTimes: string[];
  };
  assessmentResults?: Array<{
    topic: string;
    score: number;
    timestamp: string;
  }>;
}

interface AICapabilities {
  textGeneration: boolean;
  imageAnalysis: boolean;
  codeExecution: boolean;
  mathSolving: boolean;
  languageTranslation: boolean;
  voiceSynthesis: boolean;
  documentAnalysis: boolean;
  webSearch: boolean;
  diagramGeneration: boolean;
  quizGeneration: boolean;
  flashcardCreation: boolean;
  studyPlanGeneration: boolean;
  progressTracking: boolean;
  personalizedFeedback: boolean;
  collaborativeFiltering: boolean;
  adaptiveLearning: boolean;
  multimodalInteraction: boolean;
  realTimeCorrection: boolean;
  conceptualMapping: boolean;
  analogyGeneration: boolean;
}

interface TutorAnalytics {
  totalSessions: number;
  totalMessages: number;
  totalStudyTime: number;
  averageSessionDuration: number;
  topicsCovered: number;
  conceptsMastered: number;
  problemsSolved: number;
  improvementRate: number;
  currentStreak: number;
  longestStreak: number;
  favoriteSubjects: Array<{
    subject: string;
    frequency: number;
    averageScore: number;
  }>;
  weakestAreas: Array<{
    topic: string;
    mistakeRate: number;
    improvementNeeded: boolean;
  }>;
  learningVelocity: {
    conceptsPerHour: number;
    questionsPerMinute: number;
    correctnessRate: number;
    engagementRate: number;
  };
  personalityMatch: {
    currentPersonality: string;
    compatibility: number;
    suggestedAlternatives: string[];
  };
  weeklyProgress: Array<{
    date: string;
    studyTime: number;
    conceptsLearned: number;
    accuracy: number;
    engagement: number;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    earnedAt: string;
    category: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }>;
  recommendations: Array<{
    type: 'study_time' | 'difficulty' | 'topic' | 'method' | 'break';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    actionable: boolean;
  }>;
}

const AITutorPage: React.FC = () => {
  // State Management
  const [currentSession, setCurrentSession] = useState<AITutorSession | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedPersonality, setSelectedPersonality] = useState<string | null>(null);
  const [showPersonalities, setShowPersonalities] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [multimodalMode, setMultimodalMode] = useState(true);
  const [collaborativeMode, setCollaborativeMode] = useState(false);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState(true);
  const [realTimeCorrection, setRealTimeCorrection] = useState(true);
  const [showCitations, setShowCitations] = useState(true);
  const [showConfidence, setShowConfidence] = useState(false);
  const [contextualHelp, setContextualHelp] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [learningContext, setLearningContext] = useState<LearningContext>({});
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [sessionTimer, setSessionTimer] = useState(0);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Array<{ id: string; name: string; avatar?: string }>>([]);
  const [messageReactions, setMessageReactions] = useState<Record<string, Record<string, number>>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<{
    subject?: string;
    difficulty?: string;
    dateRange?: { start: string; end: string };
  }>({});
  const [showFilters, setShowFilters] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechSynthesis = useRef<SpeechSynthesis | null>(null);
  const speechRecognition = useRef<any>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Query Client
  const queryClient = useQueryClient();

  // API Queries
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['ai-tutor-sessions', searchQuery, filterBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterBy.subject) params.append('subject', filterBy.subject);
      if (filterBy.difficulty) params.append('difficulty', filterBy.difficulty);
      
      const response = await fetch(`/api/enhanced-ai/tutor/sessions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    },
    refetchOnWindowFocus: false,
  });

  const { data: personalities = [], isLoading: personalitiesLoading } = useQuery({
    queryKey: ['tutor-personalities'],
    queryFn: async () => {
      const response = await fetch('/api/enhanced-ai/tutor/personalities');
      if (!response.ok) throw new Error('Failed to fetch personalities');
      return response.json();
    },
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['tutor-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/enhanced-ai/tutor/analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
  });

  const { data: capabilities, isLoading: capabilitiesLoading } = useQuery({
    queryKey: ['ai-capabilities'],
    queryFn: async () => {
      const response = await fetch('/api/enhanced-ai/capabilities');
      if (!response.ok) throw new Error('Failed to fetch capabilities');
      return response.json();
    },
  });

  // Mutations
  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: Partial<AITutorSession>) => {
      const response = await fetch('/api/enhanced-ai/tutor/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });
      if (!response.ok) throw new Error('Failed to create session');
      return response.json();
    },
    onSuccess: (session) => {
      setCurrentSession(session);
      setMessages(session.messages || []);
      queryClient.invalidateQueries({ queryKey: ['ai-tutor-sessions'] });
      toast.success('New tutoring session started!');
    },
    onError: () => {
      toast.error('Failed to create session');
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ sessionId, message }: { sessionId: string; message: string }) => {
      const response = await fetch('/api/enhanced-ai/tutor/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, data.userMessage, data.aiResponse]);
      setInputMessage('');
      setIsLoading(false);
      
      // Auto-speak AI response if enabled
      if (autoSpeak && data.aiResponse.content) {
        speakText(data.aiResponse.content);
      }
      
      queryClient.invalidateQueries({ queryKey: ['ai-tutor-sessions'] });
    },
    onError: () => {
      setIsLoading(false);
      toast.error('Failed to send message');
    },
  });

  const uploadFilesMutation = useMutation({
    mutationFn: async ({ sessionId, files }: { sessionId: string; files: File[] }) => {
      const formData = new FormData();
      formData.append('sessionId', sessionId);
      files.forEach(file => formData.append('files', file));

      const response = await fetch('/api/enhanced-ai/tutor/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to upload files');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Uploaded ${data.files.length} file(s) successfully`);
      setSelectedFiles([]);
      if (currentSession) {
        setCurrentSession({
          ...currentSession,
          contextFiles: [...(currentSession.contextFiles || []), ...data.files],
        });
      }
    },
    onError: () => {
      toast.error('Failed to upload files');
    },
  });

  const reactToMessageMutation = useMutation({
    mutationFn: async ({ messageId, reaction }: { messageId: string; reaction: string }) => {
      const response = await fetch('/api/enhanced-ai/tutor/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, reaction }),
      });
      if (!response.ok) throw new Error('Failed to react to message');
      return response.json();
    },
    onSuccess: (data) => {
      setMessageReactions(prev => ({
        ...prev,
        [data.messageId]: data.reactions,
      }));
    },
  });

  // Session timer
  useEffect(() => {
    if (currentSession?.status === 'active') {
      sessionTimerRef.current = setInterval(() => {
        setSessionTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    }

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [currentSession?.status]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.current = window.speechSynthesis;
    }

    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      speechRecognition.current = new (window as any).webkitSpeechRecognition();
      speechRecognition.current.continuous = false;
      speechRecognition.current.interimResults = false;
      speechRecognition.current.lang = 'en-US';

      speechRecognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(prev => prev + transcript);
        setIsListening(false);
      };

      speechRecognition.current.onerror = () => {
        setIsListening(false);
        toast.error('Speech recognition error');
      };

      speechRecognition.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Utility functions
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const speakText = (text: string) => {
    if (!speechSynthesis.current || !voiceEnabled) return;

    // Cancel any ongoing speech
    speechSynthesis.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.current.speak(utterance);
  };

  const startListening = () => {
    if (!speechRecognition.current) {
      toast.error('Speech recognition not supported');
      return;
    }

    setIsListening(true);
    speechRecognition.current.start();
  };

  const stopListening = () => {
    if (speechRecognition.current) {
      speechRecognition.current.stop();
    }
    setIsListening(false);
  };

  const stopSpeaking = () => {
    if (speechSynthesis.current) {
      speechSynthesis.current.cancel();
    }
    setIsSpeaking(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !currentSession) return;

    setIsLoading(true);
    sendMessageMutation.mutate({ 
      sessionId: currentSession.id, 
      message: inputMessage.trim() 
    });
  };

  const handleStartNewSession = (personalityId?: string, subject?: string) => {
    const sessionData: Partial<AITutorSession> = {
      title: `${subject || 'General'} Tutoring Session`,
      subject: subject || 'general',
      difficulty: 'intermediate',
      learningStyle: 'visual',
      personalityType: personalityId ? personalities.find((p: TutorPersonality) => p.id === personalityId)?.personality || 'friendly' : 'friendly',
      language: 'en',
      learningObjectives: [],
      status: 'active',
      tags: [],
      settings: {
        voiceEnabled,
        autoSpeak,
        showCitations,
        showConfidence,
        enableHints: true,
        adaptiveDifficulty,
        realTimeCorrection,
        contextualHelp,
        multimodalInput: multimodalMode,
        collaborativeMode,
      },
    };

    createSessionMutation.mutate(sessionData);
  };

  const handleFileUpload = () => {
    if (selectedFiles.length === 0 || !currentSession) return;

    uploadFilesMutation.mutate({
      sessionId: currentSession.id,
      files: selectedFiles,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getPersonalityIcon = (personality: string) => {
    switch (personality) {
      case 'friendly': return SmileSolidIcon;
      case 'professional': return AcademicCapSolidIcon;
      case 'casual': return ChatSolidIcon;
      case 'encouraging': return TrophySolidIcon;
      case 'challenging': return BoltSolidIcon;
      default: return UserSolidIcon;
    }
  };

  const getSubjectIcon = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'mathematics':
      case 'math': return CalculatorSolidIcon;
      case 'science':
      case 'physics':
      case 'chemistry':
      case 'biology': return BeakerSolidIcon;
      case 'computer science':
      case 'programming':
      case 'coding': return CodeBracketSolidIcon;
      case 'literature':
      case 'english':
      case 'writing': return BookOpenSolidIcon;
      case 'history':
      case 'geography': return GlobeAltSolidIcon;
      case 'art':
      case 'design': return PaintBrushSolidIcon;
      case 'music': return MusicalNoteSolidIcon;
      default: return AcademicCapSolidIcon;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 dark:text-green-400';
      case 'intermediate': return 'text-yellow-600 dark:text-yellow-400';
      case 'advanced': return 'text-orange-600 dark:text-orange-400';
      case 'expert': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const renderMessage = (message: AIMessage, index: number) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    
    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={cn(
          "flex gap-4 p-4",
          isUser && "flex-row-reverse",
          isSystem && "justify-center"
        )}
      >
        {!isSystem && (
          <div className="flex-shrink-0">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isUser 
                ? "bg-blue-500 text-white" 
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            )}>
              {isUser ? (
                <UserSolidIcon className="w-6 h-6" />
              ) : (
                <CpuChipSolidIcon className="w-6 h-6" />
              )}
            </div>
          </div>
        )}

        <div className={cn(
          "flex-1 max-w-2xl",
          isUser && "flex justify-end",
          isSystem && "max-w-md"
        )}>
          <div className={cn(
            "rounded-lg p-4 space-y-3",
            isUser 
              ? "bg-blue-500 text-white" 
              : isSystem
              ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200"
              : "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          )}>
            {/* Message Content */}
            <div className="prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: message.content }} />
            </div>

            {/* Attachments */}
            {message.metadata?.attachments && message.metadata.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {message.metadata.attachments.map(attachment => (
                  <div
                    key={attachment.id}
                    className="flex items-center space-x-2 p-2 bg-white/10 rounded-md"
                  >
                    <PaperClipIcon className="w-4 h-4" />
                    <span className="text-sm">{attachment.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Citations */}
            {showCitations && message.metadata?.citations && message.metadata.citations.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <p className="text-xs font-medium mb-2">Sources:</p>
                <div className="space-y-1">
                  {message.metadata.citations.map(citation => (
                    <a
                      key={citation.id}
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs hover:underline"
                    >
                      {citation.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Confidence Score */}
            {showConfidence && message.metadata?.confidence && !isUser && (
              <div className="flex items-center space-x-2 text-xs">
                <span>Confidence:</span>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                  <div
                    className="bg-green-500 h-1 rounded-full"
                    style={{ width: `${message.metadata.confidence}%` }}
                  />
                </div>
                <span>{message.metadata.confidence}%</span>
              </div>
            )}

            {/* Suggestions */}
            {message.metadata?.suggestions && message.metadata.suggestions.length > 0 && !isUser && (
              <div className="space-y-2">
                <p className="text-xs font-medium">Suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {message.metadata.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputMessage(suggestion)}
                      className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="flex items-center justify-between text-xs opacity-70">
              <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
              
              {!isUser && !isSystem && (
                <div className="flex items-center space-x-1">
                  {/* Voice Playback */}
                  {voiceEnabled && (
                    <button
                      onClick={() => speakText(message.content)}
                      className="p-1 hover:bg-white/20 rounded transition-colors"
                      disabled={isSpeaking}
                    >
                      <SpeakerWaveIcon className="w-4 h-4" />
                    </button>
                  )}

                  {/* Reactions */}
                  <div className="flex items-center space-x-1">
                    {['helpful', 'clear', 'accurate', 'engaging'].map(reaction => (
                      <button
                        key={reaction}
                        onClick={() => reactToMessageMutation.mutate({ messageId: message.id, reaction })}
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                      >
                        {reaction === 'helpful' && <ThumbsUpSolidIcon className="w-3 h-3" />}
                        {reaction === 'clear' && <CheckCircleSolidIcon className="w-3 h-3" />}
                        {reaction === 'accurate' && <ShieldCheckIcon className="w-3 h-3" />}
                        {reaction === 'engaging' && <HeartSolidIcon className="w-3 h-3" />}
                        <span className="ml-1 text-xs">
                          {messageReactions[message.id]?.[reaction] || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderPersonalityCard = (personality: TutorPersonality) => {
    const IconComponent = getPersonalityIcon(personality.personality);
    
    return (
      <motion.div
        key={personality.id}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          setSelectedPersonality(personality.id);
          setShowPersonalities(false);
          handleStartNewSession(personality.id);
        }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer p-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
            <IconComponent className="w-6 h-6" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {personality.name}
              </h3>
              {personality.isPremium && (
                <StarSolidIcon className="w-4 h-4 text-yellow-500" />
              )}
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {personality.description}
            </p>
            
            <div className="flex flex-wrap gap-1 mb-3">
              {personality.expertise.slice(0, 3).map(skill => (
                <span
                  key={skill}
                  className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full"
                >
                  {skill}
                </span>
              ))}
              {personality.expertise.length > 3 && (
                <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                  +{personality.expertise.length - 3}
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <StarSolidIcon className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">{personality.rating.toFixed(1)}</span>
                <span className="text-xs text-gray-500">({personality.usageCount} sessions)</span>
              </div>
              
              <div className="flex items-center space-x-1">
                {personality.voice && (
                  <SpeakerSolidIcon className="w-4 h-4 text-green-500" />
                )}
                {personality.languages.length > 1 && (
                  <LanguageIcon className="w-4 h-4 text-blue-500" />
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderSessionCard = (session: AITutorSession) => {
    const SubjectIcon = getSubjectIcon(session.subject);
    
    return (
      <motion.div
        key={session.id}
        whileHover={{ y: -2 }}
        onClick={() => {
          setCurrentSession(session);
          setMessages(session.messages);
          setShowSessions(false);
        }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer p-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
              <SubjectIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                {session.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {session.subject} • {session.messageCount} messages
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={cn(
              "px-2 py-1 text-xs rounded-full",
              session.status === 'active' && "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
              session.status === 'paused' && "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300",
              session.status === 'completed' && "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
              session.status === 'archived' && "bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300"
            )}>
              {session.status}
            </span>
            <span className={cn("text-sm font-medium", getDifficultyColor(session.difficulty))}>
              {session.difficulty}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Learning Progress</span>
            <span className="font-medium">{session.progressScore}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
              style={{ width: `${session.progressScore}%` }}
            />
          </div>
        </div>

        {/* Tags */}
        {session.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {session.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full"
              >
                {tag}
              </span>
            ))}
            {session.tags.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                +{session.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Session Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {Math.round(session.duration / 60)}m
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Duration</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {session.analytics.conceptsExplained}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Concepts</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {session.engagementScore}%
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Engagement</div>
          </div>
        </div>

        {/* Last Active */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          Last active {new Date(session.lastActiveAt).toLocaleDateString()}
        </div>
      </motion.div>
    );
  };

  if (sessionsLoading || personalitiesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading AI Tutor..." />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>AI Tutor - StudyGenius</title>
        <meta name="description" content="Personalized AI tutoring with adaptive learning, multimodal interaction, and real-time feedback" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left Section */}
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  AI Tutor
                </h1>
                
                {currentSession && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {currentSession.subject} • {formatTime(sessionTimer)}
                    </span>
                  </div>
                )}
              </div>

              {/* Center - Topic */}
              {currentTopic && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <LightBulbSolidIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {currentTopic}
                  </span>
                </div>
              )}

              {/* Right Section */}
              <div className="flex items-center space-x-2">
                {/* Voice Controls */}
                {voiceEnabled && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={isListening ? stopListening : startListening}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        isListening
                          ? "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400"
                          : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                      )}
                      disabled={isLoading}
                    >
                      <MicrophoneSolidIcon className="w-5 h-5" />
                    </button>

                    {isSpeaking && (
                      <button
                        onClick={stopSpeaking}
                        className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                      >
                        <SpeakerXMarkIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Session Management */}
                <button
                  onClick={() => setShowSessions(!showSessions)}
                  className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                </button>

                {/* Personalities */}
                <button
                  onClick={() => setShowPersonalities(!showPersonalities)}
                  className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <UserGroupIcon className="w-5 h-5" />
                </button>

                {/* Settings */}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <CogIcon className="w-5 h-5" />
                </button>

                {/* Analytics */}
                <button
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <ChartBarIcon className="w-5 h-5" />
                </button>

                {/* New Session */}
                <button
                  onClick={() => handleStartNewSession()}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>New Session</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex h-[calc(100vh-64px)]">
          {/* Sidebar */}
          <AnimatePresence>
            {(showSessions || showPersonalities || showSettings || showAnalytics) && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 400, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
              >
                <div className="p-6 h-full overflow-y-auto">
                  {/* Sessions */}
                  {showSessions && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Recent Sessions
                        </h2>
                        <button
                          onClick={() => setShowSessions(false)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Search and Filter */}
                      <div className="space-y-3">
                        <div className="relative">
                          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search sessions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                          />
                        </div>

                        <button
                          onClick={() => setShowFilters(!showFilters)}
                          className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          <FunnelIcon className="w-4 h-4" />
                          <span>Filters</span>
                        </button>

                        {showFilters && (
                          <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <select
                              value={filterBy.subject || ''}
                              onChange={(e) => setFilterBy(prev => ({ ...prev, subject: e.target.value || undefined }))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                            >
                              <option value="">All Subjects</option>
                              <option value="mathematics">Mathematics</option>
                              <option value="science">Science</option>
                              <option value="english">English</option>
                              <option value="history">History</option>
                              <option value="programming">Programming</option>
                            </select>

                            <select
                              value={filterBy.difficulty || ''}
                              onChange={(e) => setFilterBy(prev => ({ ...prev, difficulty: e.target.value || undefined }))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                            >
                              <option value="">All Levels</option>
                              <option value="beginner">Beginner</option>
                              <option value="intermediate">Intermediate</option>
                              <option value="advanced">Advanced</option>
                              <option value="expert">Expert</option>
                            </select>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        {sessions.map((session: AITutorSession) => renderSessionCard(session))}
                      </div>

                      {sessions.length === 0 && (
                        <div className="text-center py-8">
                          <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-600 dark:text-gray-400">No sessions found</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Personalities */}
                  {showPersonalities && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Tutor Personalities
                        </h2>
                        <button
                          onClick={() => setShowPersonalities(false)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        {personalities.map((personality: TutorPersonality) => renderPersonalityCard(personality))}
                      </div>
                    </div>
                  )}

                  {/* Settings */}
                  {showSettings && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Settings
                        </h2>
                        <button
                          onClick={() => setShowSettings(false)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        {/* Voice Settings */}
                        <div className="space-y-3">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">Voice & Audio</h3>
                          
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={voiceEnabled}
                              onChange={(e) => setVoiceEnabled(e.target.checked)}
                              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Enable voice</span>
                          </label>

                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={autoSpeak}
                              onChange={(e) => setAutoSpeak(e.target.checked)}
                              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Auto-speak responses</span>
                          </label>
                        </div>

                        {/* Display Settings */}
                        <div className="space-y-3">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">Display</h3>
                          
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={showCitations}
                              onChange={(e) => setShowCitations(e.target.checked)}
                              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Show citations</span>
                          </label>

                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={showConfidence}
                              onChange={(e) => setShowConfidence(e.target.checked)}
                              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Show confidence scores</span>
                          </label>
                        </div>

                        {/* Learning Settings */}
                        <div className="space-y-3">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">Learning</h3>
                          
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={adaptiveDifficulty}
                              onChange={(e) => setAdaptiveDifficulty(e.target.checked)}
                              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Adaptive difficulty</span>
                          </label>

                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={realTimeCorrection}
                              onChange={(e) => setRealTimeCorrection(e.target.checked)}
                              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Real-time corrections</span>
                          </label>

                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={contextualHelp}
                              onChange={(e) => setContextualHelp(e.target.checked)}
                              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Contextual help</span>
                          </label>
                        </div>

                        {/* Advanced Settings */}
                        <div className="space-y-3">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">Advanced</h3>
                          
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={multimodalMode}
                              onChange={(e) => setMultimodalMode(e.target.checked)}
                              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Multimodal input</span>
                          </label>

                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={collaborativeMode}
                              onChange={(e) => setCollaborativeMode(e.target.checked)}
                              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Collaborative mode</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Analytics */}
                  {showAnalytics && analytics && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Learning Analytics
                        </h2>
                        <button
                          onClick={() => setShowAnalytics(false)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {analytics.totalSessions}
                          </div>
                          <div className="text-xs text-blue-600/70 dark:text-blue-400/70">
                            Total Sessions
                          </div>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {Math.round(analytics.totalStudyTime / 60)}h
                          </div>
                          <div className="text-xs text-green-600/70 dark:text-green-400/70">
                            Study Time
                          </div>
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            {analytics.conceptsMastered}
                          </div>
                          <div className="text-xs text-purple-600/70 dark:text-purple-400/70">
                            Concepts Mastered
                          </div>
                        </div>

                        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                          <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                            {analytics.currentStreak}
                          </div>
                          <div className="text-xs text-orange-600/70 dark:text-orange-400/70">
                            Day Streak
                          </div>
                        </div>
                      </div>

                      {/* Favorite Subjects */}
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Favorite Subjects</h3>
                        <div className="space-y-2">
                          {analytics.favoriteSubjects.slice(0, 5).map((subject, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {subject.subject}
                              </span>
                              <div className="flex items-center space-x-2">
                                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                                  <div
                                    className="bg-blue-500 h-1 rounded-full"
                                    style={{ width: `${(subject.frequency / analytics.totalSessions) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500">
                                  {subject.frequency}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recent Achievements */}
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Recent Achievements</h3>
                        <div className="space-y-2">
                          {analytics.achievements.slice(0, 3).map((achievement, index) => (
                            <div key={index} className="flex items-center space-x-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                              <TrophySolidIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {achievement.title}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {achievement.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Recommendations</h3>
                        <div className="space-y-2">
                          {analytics.recommendations.slice(0, 3).map((rec, index) => (
                            <div key={index} className={cn(
                              "p-3 rounded-lg",
                              rec.priority === 'high' && "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700",
                              rec.priority === 'medium' && "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700",
                              rec.priority === 'low' && "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700"
                            )}>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {rec.title}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {rec.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {currentSession ? (
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center max-w-md">
                        <SparklesSolidIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Welcome to AI Tutor!
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                          Ask me anything you'd like to learn about. I'm here to help you understand complex topics,
                          solve problems, and guide your learning journey.
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {[
                            "Explain quantum physics",
                            "Help with calculus",
                            "Improve my writing",
                            "Learn programming",
                            "Study history",
                            "Practice languages"
                          ].map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => setInputMessage(suggestion)}
                              className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 space-y-4">
                      {messages.map((message, index) => renderMessage(message, index))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}

                  {/* Typing Indicators */}
                  {typingUsers.length > 0 && (
                    <div className="px-4 py-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                        <span>
                          {typingUsers.length === 1 
                            ? `${typingUsers[0]} is typing...`
                            : `${typingUsers.length} people are typing...`
                          }
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Loading Indicator */}
                  {isLoading && (
                    <div className="px-4 py-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <LoadingSpinner size="sm" />
                        <span>AI is thinking...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                  {/* File Attachments */}
                  {selectedFiles.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                        >
                          <PaperClipIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm text-blue-700 dark:text-blue-300">{file.name}</span>
                          <button
                            onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={handleFileUpload}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Upload {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
                      </button>
                    </div>
                  )}

                  {/* Input Controls */}
                  <div className="flex items-end space-x-3">
                    {/* File Upload */}
                    {multimodalMode && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <PaperClipIcon className="w-5 h-5" />
                      </button>
                    )}

                    {/* Text Input */}
                    <div className="flex-1">
                      <textarea
                        ref={inputRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                        rows={1}
                        style={{ minHeight: '42px', maxHeight: '120px' }}
                        disabled={isLoading}
                      />
                    </div>

                    {/* Voice Input */}
                    {voiceEnabled && (
                      <button
                        onClick={isListening ? stopListening : startListening}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          isListening
                            ? "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400"
                            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        )}
                        disabled={isLoading}
                      >
                        <MicrophoneIcon className="w-5 h-5" />
                      </button>
                    )}

                    {/* Send Button */}
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isLoading}
                      className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Press Enter to send, Shift+Enter for new line</span>
                      {voiceEnabled && (
                        <span>Click mic or say "Hey Tutor" to start voice input</span>
                      )}
                    </div>

                    {/* Online Users */}
                    {collaborativeMode && onlineUsers.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{onlineUsers.length} online</span>
                        <div className="flex -space-x-2">
                          {onlineUsers.slice(0, 3).map(user => (
                            <div
                              key={user.id}
                              className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs border-2 border-white dark:border-gray-800"
                              title={user.name}
                            >
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {onlineUsers.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs border-2 border-white dark:border-gray-800">
                              +{onlineUsers.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.md"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setSelectedFiles(prev => [...prev, ...files]);
                  }}
                  className="hidden"
                />
              </>
            ) : (
              /* No Session State */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-2xl px-6">
                  <CpuChipSolidIcon className="w-20 h-20 text-blue-500 mx-auto mb-6" />
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Welcome to AI Tutor
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                    Your personal AI learning companion with adaptive teaching, multimodal interaction,
                    and real-time feedback. Start a new session or continue from where you left off.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <button
                      onClick={() => handleStartNewSession()}
                      className="p-6 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
                    >
                      <PlusIcon className="w-8 h-8 text-blue-500 dark:text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Start New Session
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Begin learning with AI assistance
                      </p>
                    </button>

                    <button
                      onClick={() => setShowPersonalities(true)}
                      className="p-6 border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors group"
                    >
                      <UserGroupIcon className="w-8 h-8 text-purple-500 dark:text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Choose Personality
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Pick your preferred tutor style
                      </p>
                    </button>
                  </div>

                  {/* Capabilities */}
                  {capabilities && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        AI Capabilities
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(capabilities)
                          .filter(([_, enabled]) => enabled)
                          .slice(0, 8)
                          .map(([capability]) => (
                            <div
                              key={capability}
                              className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg"
                            >
                              <CheckCircleSolidIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                              <span className="text-sm text-green-700 dark:text-green-300 capitalize">
                                {capability.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AITutorPage;