import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  ListBulletIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ClockIcon,
  ChartBarIcon,
  BoltIcon,
  FireIcon,
  StarIcon,
  ShareIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ForwardIcon,
  BackwardIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  LightBulbIcon,
  BeakerIcon,
  CalculatorIcon,
  PhotoIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  TagIcon,
  FolderIcon,
  UserGroupIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  ArrowsRightLeftIcon,
  BookmarkIcon,
  CogIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EllipsisHorizontalIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HandRaisedIcon,
  HeartIcon,
  FaceSmileIcon,
  FaceFrownIcon,
  CubeIcon,
  GlobeAltIcon,
  LanguageIcon,
  CameraIcon,
  QrCodeIcon,
  PrinterIcon,
  ArrowTopRightOnSquareIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  RectangleStackIcon,
  Bars3Icon,
  Bars4Icon,
  Square3Stack3DIcon
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarSolidIcon,
  HeartIcon as HeartSolidIcon,
  BookmarkIcon as BookmarkSolidIcon,
  CheckCircleIcon as CheckCircleSolidIcon,
  FireIcon as FireSolidIcon,
  BoltIcon as BoltSolidIcon
} from '@heroicons/react/24/solid';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { cn } from '../utils/cn';

// Types
interface Flashcard {
  id: string;
  front: string;
  back: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'mixed';
  difficulty: 'easy' | 'medium' | 'hard' | 'very_hard';
  subject: string;
  tags: string[];
  deckId: string;
  createdBy: string;
  collaborators: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
    permission: 'view' | 'edit' | 'admin';
  }>;
  multimedia: {
    frontImage?: string;
    backImage?: string;
    frontAudio?: string;
    backAudio?: string;
    frontVideo?: string;
    backVideo?: string;
  };
  latex: {
    frontMath?: string;
    backMath?: string;
  };
  hints: string[];
  explanations: string[];
  relatedCards: string[];
  sourceNote?: string;
  sourceUrl?: string;
  isPublic: boolean;
  isStarred: boolean;
  isArchived: boolean;
  studyData: {
    timesStudied: number;
    correctAnswers: number;
    incorrectAnswers: number;
    averageResponseTime: number;
    lastStudied?: string;
    nextDue?: string;
    interval: number; // days
    easeFactor: number;
    repetitions: number;
    memoryStrength: number; // 0-100
    confidence: number; // 0-100
    difficulty: number; // 0-100
  };
  analytics: {
    viewCount: number;
    likeCount: number;
    shareCount: number;
    copyCount: number;
    reportCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface FlashcardDeck {
  id: string;
  name: string;
  description: string;
  subject: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  color: string;
  icon?: string;
  coverImage?: string;
  isPublic: boolean;
  isOfficial: boolean;
  isPremium: boolean;
  isStarred: boolean;
  isArchived: boolean;
  createdBy: string;
  collaborators: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: 'viewer' | 'editor' | 'admin';
  }>;
  cardCount: number;
  studyData: {
    totalStudyTime: number;
    averageScore: number;
    completionRate: number;
    streakDays: number;
    lastStudied?: string;
    masteredCards: number;
    learningCards: number;
    newCards: number;
    reviewCards: number;
  };
  settings: {
    newCardsPerDay: number;
    maxReviewsPerDay: number;
    showAnswerTimer: boolean;
    autoPlayAudio: boolean;
    randomizeOrder: boolean;
    enableHints: boolean;
    enableTyping: boolean;
    hardInterval: number;
    easyBonus: number;
    intervalModifier: number;
    maximumInterval: number;
    startingEaseFactor: number;
    easyAnswerMultiplier: number;
    hardAnswerMultiplier: number;
  };
  tags: string[];
  category: string;
  language: string;
  sourceType: 'manual' | 'import' | 'ai_generated' | 'note_conversion';
  shareLink?: string;
  analytics: {
    viewCount: number;
    likeCount: number;
    shareCount: number;
    forkCount: number;
    downloadCount: number;
    rating: number;
    reviewCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface StudySession {
  id: string;
  deckId: string;
  type: 'new' | 'review' | 'cram' | 'test' | 'challenge';
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  startedAt: string;
  endedAt?: string;
  duration: number; // seconds
  cardsStudied: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedCards: number;
  averageResponseTime: number;
  difficultyRatings: Array<{
    cardId: string;
    rating: 'again' | 'hard' | 'good' | 'easy';
    responseTime: number;
    wasCorrect: boolean;
  }>;
  streakCount: number;
  score: number;
  efficiency: number;
  focusScore: number;
  mood: 'excellent' | 'good' | 'neutral' | 'poor' | 'terrible';
  environment: string;
  techniques: string[];
  notes?: string;
  achievements: string[];
}

interface StudyStatistics {
  totalDecks: number;
  totalCards: number;
  totalStudyTime: number;
  cardsStudiedToday: number;
  studyTimeToday: number;
  currentStreak: number;
  longestStreak: number;
  averageScore: number;
  masteredCards: number;
  learningCards: number;
  newCards: number;
  reviewCards: number;
  weeklyStats: Array<{
    date: string;
    cardsStudied: number;
    studyTime: number;
    score: number;
  }>;
  monthlyStats: Array<{
    month: string;
    cardsStudied: number;
    studyTime: number;
    score: number;
    newDecks: number;
  }>;
  subjectBreakdown: Array<{
    subject: string;
    cardCount: number;
    studyTime: number;
    score: number;
    difficulty: number;
  }>;
  difficultyBreakdown: Array<{
    difficulty: string;
    cardCount: number;
    successRate: number;
    averageTime: number;
  }>;
  timeOfDayStats: Array<{
    hour: number;
    studyTime: number;
    score: number;
    cardCount: number;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    earnedAt: string;
    category: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }>;
  recommendations: Array<{
    type: 'study_time' | 'difficulty' | 'technique' | 'break' | 'review';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    actionable: boolean;
  }>;
}

interface FlashcardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  subject: string;
  frontTemplate: string;
  backTemplate: string;
  styling: {
    frontCss: string;
    backCss: string;
    cardCss: string;
  };
  fields: Array<{
    name: string;
    type: 'text' | 'image' | 'audio' | 'video' | 'math';
    required: boolean;
    placeholder: string;
  }>;
  isOfficial: boolean;
  isPremium: boolean;
  usageCount: number;
  rating: number;
  previewImage?: string;
  tags: string[];
  createdAt: string;
}

const FlashcardsPage: React.FC = () => {
  // State Management
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'decks' | 'study' | 'analytics' | 'templates' | 'marketplace'>('decks');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'masonry'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<{
    subject?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    tags?: string[];
    isStarred?: boolean;
    isPublic?: boolean;
    dueStatus?: 'new' | 'learning' | 'review' | 'mastered';
    dateRange?: { start: string; end: string };
  }>({});
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'name' | 'progress' | 'difficulty'>('updated');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [isStudying, setIsStudying] = useState(false);
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyMode, setStudyMode] = useState<'new' | 'review' | 'cram' | 'test' | 'challenge'>('review');
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    skipped: 0,
    streak: 0,
    startTime: Date.now(),
  });
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [showDeckSettings, setShowDeckSettings] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [studyTimer, setStudyTimer] = useState(0);
  const [responseTimer, setResponseTimer] = useState(0);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [showHints, setShowHints] = useState(true);
  const [keyboardShortcuts, setKeyboardShortcuts] = useState(true);
  const [flipAnimation, setFlipAnimation] = useState<'flip' | 'slide' | 'fade'>('flip');
  const [studyGoal, setStudyGoal] = useState({ cardsPerDay: 50, timePerDay: 60 });

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const responseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Query Client
  const queryClient = useQueryClient();

  // API Queries
  const { data: decks = [], isLoading: decksLoading } = useQuery({
    queryKey: ['flashcard-decks', searchQuery, filterBy, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterBy.subject) params.append('subject', filterBy.subject);
      if (filterBy.difficulty) params.append('difficulty', filterBy.difficulty);
      if (filterBy.isStarred) params.append('starred', 'true');
      if (filterBy.isPublic !== undefined) params.append('public', filterBy.isPublic.toString());
      if (filterBy.tags?.length) params.append('tags', filterBy.tags.join(','));
      params.append('sort', sortBy);
      
      const response = await fetch(`/api/enhanced-flashcards/decks?${params}`);
      if (!response.ok) throw new Error('Failed to fetch flashcard decks');
      return response.json();
    },
    refetchOnWindowFocus: false,
  });

  const { data: cards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ['flashcards', selectedDeck],
    queryFn: async () => {
      if (!selectedDeck) return [];
      const response = await fetch(`/api/enhanced-flashcards/decks/${selectedDeck}/cards`);
      if (!response.ok) throw new Error('Failed to fetch flashcards');
      return response.json();
    },
    enabled: !!selectedDeck,
  });

  const { data: dueCards = [], isLoading: dueCardsLoading } = useQuery({
    queryKey: ['due-cards', selectedDeck],
    queryFn: async () => {
      if (!selectedDeck) return [];
      const response = await fetch(`/api/enhanced-flashcards/decks/${selectedDeck}/due`);
      if (!response.ok) throw new Error('Failed to fetch due cards');
      return response.json();
    },
    enabled: !!selectedDeck,
    refetchInterval: 60000, // Refetch every minute
  });

  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['flashcard-statistics'],
    queryFn: async () => {
      const response = await fetch('/api/enhanced-flashcards/statistics');
      if (!response.ok) throw new Error('Failed to fetch statistics');
      return response.json();
    },
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['flashcard-templates'],
    queryFn: async () => {
      const response = await fetch('/api/enhanced-flashcards/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
  });

  // Mutations
  const createDeckMutation = useMutation({
    mutationFn: async (deckData: Partial<FlashcardDeck>) => {
      const response = await fetch('/api/enhanced-flashcards/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deckData),
      });
      if (!response.ok) throw new Error('Failed to create deck');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcard-decks'] });
      queryClient.invalidateQueries({ queryKey: ['flashcard-statistics'] });
      toast.success('Deck created successfully!');
      setShowCreateDeck(false);
    },
    onError: () => {
      toast.error('Failed to create deck');
    },
  });

  const createCardMutation = useMutation({
    mutationFn: async (cardData: Partial<Flashcard>) => {
      const response = await fetch('/api/enhanced-flashcards/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      });
      if (!response.ok) throw new Error('Failed to create card');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      queryClient.invalidateQueries({ queryKey: ['due-cards'] });
      queryClient.invalidateQueries({ queryKey: ['flashcard-decks'] });
      toast.success('Card created successfully!');
      setShowCreateCard(false);
    },
    onError: () => {
      toast.error('Failed to create card');
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Flashcard> }) => {
      const response = await fetch(`/api/enhanced-flashcards/cards/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update card');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      queryClient.invalidateQueries({ queryKey: ['due-cards'] });
      toast.success('Card updated successfully!');
    },
  });

  const deleteCardsMutation = useMutation({
    mutationFn: async (cardIds: string[]) => {
      const response = await fetch('/api/enhanced-flashcards/cards/batch-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardIds }),
      });
      if (!response.ok) throw new Error('Failed to delete cards');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      queryClient.invalidateQueries({ queryKey: ['due-cards'] });
      queryClient.invalidateQueries({ queryKey: ['flashcard-decks'] });
      toast.success('Cards deleted successfully!');
      setSelectedCards([]);
      setIsSelectionMode(false);
    },
    onError: () => {
      toast.error('Failed to delete cards');
    },
  });

  const recordStudyMutation = useMutation({
    mutationFn: async (studyData: {
      cardId: string;
      rating: 'again' | 'hard' | 'good' | 'easy';
      responseTime: number;
      wasCorrect: boolean;
    }) => {
      const response = await fetch('/api/enhanced-flashcards/study/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studyData),
      });
      if (!response.ok) throw new Error('Failed to record study data');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['due-cards'] });
      queryClient.invalidateQueries({ queryKey: ['flashcard-statistics'] });
    },
  });

  const generateAICardsMutation = useMutation({
    mutationFn: async ({ deckId, prompt, count }: { deckId: string; prompt: string; count: number }) => {
      const response = await fetch('/api/enhanced-flashcards/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckId, prompt, count }),
      });
      if (!response.ok) throw new Error('Failed to generate AI cards');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      queryClient.invalidateQueries({ queryKey: ['due-cards'] });
      queryClient.invalidateQueries({ queryKey: ['flashcard-decks'] });
      toast.success(`Generated ${data.cards.length} AI cards!`);
    },
  });

  // Study session timer
  useEffect(() => {
    if (isStudying) {
      timerRef.current = setInterval(() => {
        setStudyTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isStudying]);

  // Response timer
  useEffect(() => {
    if (currentCard && !showAnswer) {
      setResponseTimer(0);
      responseTimerRef.current = setInterval(() => {
        setResponseTimer(prev => prev + 1);
      }, 100);
    } else {
      if (responseTimerRef.current) {
        clearInterval(responseTimerRef.current);
      }
    }

    return () => {
      if (responseTimerRef.current) {
        clearInterval(responseTimerRef.current);
      }
    };
  }, [currentCard, showAnswer]);

  // Auto-play audio
  useEffect(() => {
    if (autoPlayAudio && currentCard && !showAnswer && currentCard.multimedia.frontAudio) {
      if (audioRef.current) {
        audioRef.current.src = currentCard.multimedia.frontAudio;
        audioRef.current.play();
      }
    }
  }, [currentCard, showAnswer, autoPlayAudio]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!keyboardShortcuts || !isStudying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;

      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          if (!showAnswer) {
            setShowAnswer(true);
          }
          break;
        case '1':
          if (showAnswer) {
            e.preventDefault();
            handleCardRating('again');
          }
          break;
        case '2':
          if (showAnswer) {
            e.preventDefault();
            handleCardRating('hard');
          }
          break;
        case '3':
          if (showAnswer) {
            e.preventDefault();
            handleCardRating('good');
          }
          break;
        case '4':
          if (showAnswer) {
            e.preventDefault();
            handleCardRating('easy');
          }
          break;
        case 'h':
          if (!showAnswer && showHints && currentCard?.hints.length) {
            e.preventDefault();
            // Show hint
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsStudying(false);
          setCurrentCard(null);
          setShowAnswer(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyboardShortcuts, isStudying, showAnswer, currentCard, showHints]);

  // Utility functions
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  const getCardTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return PhotoIcon;
      case 'audio': return SpeakerWaveIcon;
      case 'video': return VideoCameraIcon;
      case 'mixed': return Square3Stack3DIcon;
      default: return DocumentTextIcon;
    }
  };

  const calculateMemoryStrength = (studyData: Flashcard['studyData']) => {
    const { correctAnswers, incorrectAnswers, interval, repetitions } = studyData;
    const totalAnswers = correctAnswers + incorrectAnswers;
    
    if (totalAnswers === 0) return 0;
    
    const accuracy = correctAnswers / totalAnswers;
    const stabilityFactor = Math.min(interval / 30, 1); // Normalize to 30 days
    const repetitionFactor = Math.min(repetitions / 10, 1); // Normalize to 10 repetitions
    
    return Math.round((accuracy * 0.5 + stabilityFactor * 0.3 + repetitionFactor * 0.2) * 100);
  };

  const getNextStudyDate = (studyData: Flashcard['studyData']) => {
    if (!studyData.nextDue) return 'Now';
    
    const nextDue = new Date(studyData.nextDue);
    const now = new Date();
    const diffMs = nextDue.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Due now';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 30) return `In ${Math.ceil(diffDays / 7)} weeks`;
    return `In ${Math.ceil(diffDays / 30)} months`;
  };

  const handleStartStudy = (deck: FlashcardDeck, mode: typeof studyMode = 'review') => {
    setSelectedDeck(deck.id);
    setStudyMode(mode);
    setIsStudying(true);
    setStudyTimer(0);
    setSessionStats({
      correct: 0,
      incorrect: 0,
      skipped: 0,
      streak: 0,
      startTime: Date.now(),
    });
    
    // Load first card based on mode
    const availableCards = mode === 'new' 
      ? cards.filter((c: Flashcard) => c.studyData.timesStudied === 0)
      : dueCards;
    
    if (availableCards.length > 0) {
      setCurrentCard(availableCards[0]);
      setShowAnswer(false);
    }
  };

  const handleCardRating = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard) return;

    const isCorrect = rating === 'good' || rating === 'easy';
    const responseTime = responseTimer * 100; // Convert to milliseconds

    // Record study data
    recordStudyMutation.mutate({
      cardId: currentCard.id,
      rating,
      responseTime,
      wasCorrect: isCorrect,
    });

    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      incorrect: isCorrect ? prev.incorrect : prev.incorrect + 1,
      streak: isCorrect ? prev.streak + 1 : 0,
    }));

    // Load next card
    const currentIndex = dueCards.findIndex((c: Flashcard) => c.id === currentCard.id);
    const nextCard = dueCards[currentIndex + 1];
    
    if (nextCard) {
      setCurrentCard(nextCard);
      setShowAnswer(false);
    } else {
      // Study session completed
      setIsStudying(false);
      setCurrentCard(null);
      toast.success('Study session completed!');
    }
  };

  const handleCardSelect = useCallback((cardId: string) => {
    if (isSelectionMode) {
      setSelectedCards(prev => 
        prev.includes(cardId) 
          ? prev.filter(id => id !== cardId)
          : [...prev, cardId]
      );
    } else {
      setCurrentCard(cards.find((c: Flashcard) => c.id === cardId) || null);
      setShowCardDetails(true);
    }
  }, [isSelectionMode, cards]);

  const filteredDecks = useMemo(() => {
    return decks.filter((deck: FlashcardDeck) => {
      if (filterBy.subject && deck.subject !== filterBy.subject) return false;
      if (filterBy.difficulty && deck.difficulty !== filterBy.difficulty) return false;
      if (filterBy.isStarred && !deck.isStarred) return false;
      if (filterBy.isPublic !== undefined && deck.isPublic !== filterBy.isPublic) return false;
      if (filterBy.tags?.length && !filterBy.tags.every(tag => deck.tags.includes(tag))) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          deck.name.toLowerCase().includes(query) ||
          deck.description.toLowerCase().includes(query) ||
          deck.subject.toLowerCase().includes(query) ||
          deck.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }
      
      return true;
    });
  }, [decks, filterBy, searchQuery]);

  const sortedDecks = useMemo(() => {
    return [...filteredDecks].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'progress':
          return b.studyData.completionRate - a.studyData.completionRate;
        case 'difficulty':
          const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2, expert: 3 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });
  }, [filteredDecks, sortBy]);

  const renderDeckCard = (deck: FlashcardDeck) => (
    <motion.div
      key={deck.id}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden border border-gray-200 dark:border-gray-700"
      onClick={() => setSelectedDeck(deck.id)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Cover Image */}
      {deck.coverImage && (
        <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
          <img
            src={deck.coverImage}
            alt={deck.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {deck.name}
              </h3>
              {deck.isOfficial && (
                <CheckCircleSolidIcon className="w-4 h-4 text-blue-500" />
              )}
              {deck.isPremium && (
                <StarSolidIcon className="w-4 h-4 text-yellow-500" />
              )}
              {deck.isStarred && (
                <HeartSolidIcon className="w-4 h-4 text-red-500" />
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
              {deck.description}
            </p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <span className={cn("px-2 py-1 text-xs rounded-full", getDifficultyColor(deck.difficulty))}>
              {deck.difficulty}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progress
            </span>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {deck.studyData.completionRate}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${deck.studyData.completionRate}%` }}
            />
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {deck.cardCount}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Cards
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {deck.studyData.masteredCards}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Mastered
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {deck.studyData.streakDays}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Streak
            </div>
          </div>
        </div>

        {/* Tags */}
        {deck.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {deck.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full"
              >
                {tag}
              </span>
            ))}
            {deck.tags.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                +{deck.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {deck.collaborators.length > 0 && (
              <div className="flex items-center space-x-1">
                <UserGroupIcon className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">{deck.collaborators.length}</span>
              </div>
            )}
            <span className="text-xs text-gray-500">
              {new Date(deck.updatedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStartStudy(deck);
              }}
              className="p-1.5 rounded-md hover:bg-green-100 dark:hover:bg-green-900 transition-colors"
              disabled={deck.cardCount === 0}
            >
              <PlayIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Share deck
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
      {deck.studyData.totalStudyTime > 0 && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <ClockIcon className="w-3 h-3" />
              <span>{Math.round(deck.studyData.totalStudyTime / 60)}h studied</span>
            </div>
            <div className="flex items-center space-x-1">
              <StarIcon className="w-3 h-3" />
              <span>{deck.studyData.averageScore.toFixed(1)}% avg</span>
            </div>
            <div className="flex items-center space-x-1">
              <BoltIcon className="w-3 h-3" />
              <span>{deck.studyData.reviewCards} due</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );

  const renderFlashcard = (card: Flashcard, isActive = false) => {
    const IconComponent = getCardTypeIcon(card.type);
    
    return (
      <motion.div
        key={card.id}
        layout
        initial={{ opacity: 0, rotateY: 90 }}
        animate={{ opacity: 1, rotateY: 0 }}
        exit={{ opacity: 0, rotateY: -90 }}
        className={cn(
          "relative bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-300",
          isActive && "ring-2 ring-blue-500 shadow-xl scale-105",
          selectedCards.includes(card.id) && "ring-2 ring-purple-500"
        )}
        onClick={() => handleCardSelect(card.id)}
        whileHover={{ y: isActive ? 0 : -2 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Selection Checkbox */}
        {isSelectionMode && (
          <div className="absolute top-3 left-3 z-10">
            <div className={cn(
              "w-5 h-5 rounded border-2 flex items-center justify-center",
              selectedCards.includes(card.id) 
                ? "bg-purple-500 border-purple-500 text-white" 
                : "border-gray-300 dark:border-gray-600"
            )}>
              {selectedCards.includes(card.id) && <CheckIcon className="w-3 h-3" />}
            </div>
          </div>
        )}

        {/* Card Type Indicator */}
        <div className="absolute top-3 right-3 flex items-center space-x-2">
          <IconComponent className="w-4 h-4 text-gray-400" />
          {card.isStarred && (
            <StarSolidIcon className="w-4 h-4 text-yellow-500" />
          )}
        </div>

        <div className={cn(
          "p-6 min-h-[200px] flex flex-col",
          isSelectionMode && "ml-8"
        )}>
          {/* Front Content */}
          <div className="flex-1 flex items-center justify-center text-center">
            {card.multimedia.frontImage && (
              <img
                src={card.multimedia.frontImage}
                alt="Front"
                className="max-w-full max-h-32 object-contain mb-4"
              />
            )}
            <div 
              className="text-lg text-gray-900 dark:text-gray-100"
              dangerouslySetInnerHTML={{ __html: card.front }}
            />
          </div>

          {/* Memory Strength Indicator */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="text-xs text-gray-500">
                Strength: {calculateMemoryStrength(card.studyData)}%
              </div>
              <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div
                  className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-1 rounded-full"
                  style={{ width: `${calculateMemoryStrength(card.studyData)}%` }}
                />
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {getNextStudyDate(card.studyData)}
            </div>
          </div>

          {/* Study Stats */}
          {card.studyData.timesStudied > 0 && (
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>{card.studyData.timesStudied} reviews</span>
              <span>{((card.studyData.correctAnswers / (card.studyData.correctAnswers + card.studyData.incorrectAnswers)) * 100).toFixed(0)}% correct</span>
              <span>{card.studyData.repetitions} reps</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderStudyInterface = () => {
    if (!currentCard) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Study Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Study Session
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <ClockIcon className="w-4 h-4" />
                  <span>{formatTime(studyTimer)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!showAnswer && responseTimer > 0 && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {(responseTimer / 10).toFixed(1)}s
                  </div>
                )}
                <button
                  onClick={() => {
                    setIsStudying(false);
                    setCurrentCard(null);
                    setShowAnswer(false);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Session Progress</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {sessionStats.correct + sessionStats.incorrect + sessionStats.skipped} / {dueCards.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${((sessionStats.correct + sessionStats.incorrect + sessionStats.skipped) / dueCards.length) * 100}%` 
                  }}
                />
              </div>
            </div>

            {/* Session Stats */}
            <div className="mt-4 grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {sessionStats.correct}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600 dark:text-red-400">
                  {sessionStats.incorrect}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Incorrect</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  {sessionStats.skipped}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Skipped</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {sessionStats.streak}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Streak</div>
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-8">
            <div className="text-center min-h-[300px] flex flex-col justify-center">
              {/* Front Side */}
              {!showAnswer && (
                <motion.div
                  key="front"
                  initial={{ opacity: 0, rotateY: 90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  className="space-y-6"
                >
                  {currentCard.multimedia.frontImage && (
                    <img
                      src={currentCard.multimedia.frontImage}
                      alt="Front"
                      className="max-w-full max-h-48 object-contain mx-auto"
                    />
                  )}
                  <div 
                    className="text-2xl text-gray-900 dark:text-gray-100"
                    dangerouslySetInnerHTML={{ __html: currentCard.front }}
                  />
                  {currentCard.multimedia.frontAudio && (
                    <button
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.src = currentCard.multimedia.frontAudio!;
                          audioRef.current.play();
                        }
                      }}
                      className="p-3 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    >
                      <SpeakerWaveIcon className="w-6 h-6" />
                    </button>
                  )}
                </motion.div>
              )}

              {/* Back Side */}
              {showAnswer && (
                <motion.div
                  key="back"
                  initial={{ opacity: 0, rotateY: -90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  className="space-y-6"
                >
                  {currentCard.multimedia.backImage && (
                    <img
                      src={currentCard.multimedia.backImage}
                      alt="Back"
                      className="max-w-full max-h-48 object-contain mx-auto"
                    />
                  )}
                  <div 
                    className="text-2xl text-gray-900 dark:text-gray-100"
                    dangerouslySetInnerHTML={{ __html: currentCard.back }}
                  />
                  {currentCard.explanations.length > 0 && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      {currentCard.explanations[0]}
                    </div>
                  )}
                  {currentCard.multimedia.backAudio && (
                    <button
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.src = currentCard.multimedia.backAudio!;
                          audioRef.current.play();
                        }
                      }}
                      className="p-3 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    >
                      <SpeakerWaveIcon className="w-6 h-6" />
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* Study Controls */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            {!showAnswer ? (
              <div className="flex items-center justify-center space-x-4">
                {showHints && currentCard.hints.length > 0 && (
                  <button className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors">
                    Show Hint
                  </button>
                )}
                <button
                  onClick={() => setShowAnswer(true)}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>Show Answer</span>
                  <span className="text-xs opacity-75">(Space)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                  How well did you know this card?
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <button
                    onClick={() => handleCardRating('again')}
                    className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors text-center"
                  >
                    <div className="font-medium">Again</div>
                    <div className="text-xs opacity-75">(1)</div>
                  </button>
                  <button
                    onClick={() => handleCardRating('hard')}
                    className="p-3 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors text-center"
                  >
                    <div className="font-medium">Hard</div>
                    <div className="text-xs opacity-75">(2)</div>
                  </button>
                  <button
                    onClick={() => handleCardRating('good')}
                    className="p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors text-center"
                  >
                    <div className="font-medium">Good</div>
                    <div className="text-xs opacity-75">(3)</div>
                  </button>
                  <button
                    onClick={() => handleCardRating('easy')}
                    className="p-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-center"
                  >
                    <div className="font-medium">Easy</div>
                    <div className="text-xs opacity-75">(4)</div>
                  </button>
                </div>
              </div>
            )}

            {/* Keyboard Shortcuts Help */}
            {keyboardShortcuts && (
              <div className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
                Press Space to show answer • Number keys to rate • H for hint • Esc to exit
              </div>
            )}
          </div>
        </motion.div>

        {/* Audio element */}
        <audio ref={audioRef} />
      </div>
    );
  };

  if (decksLoading || cardsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading your flashcards..." />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Flashcards - StudyGenius</title>
        <meta name="description" content="AI-powered spaced repetition flashcards with multimedia support and collaborative features" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left Section */}
              <div className="flex items-center space-x-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Flashcards
                </h1>
                
                {/* Tab Navigation */}
                <nav className="flex space-x-1">
                  {[
                    { key: 'decks', label: 'My Decks', icon: RectangleStackIcon },
                    { key: 'study', label: 'Study', icon: AcademicCapIcon },
                    { key: 'analytics', label: 'Analytics', icon: ChartBarIcon },
                    { key: 'templates', label: 'Templates', icon: DocumentTextIcon },
                    { key: 'marketplace', label: 'Marketplace', icon: GlobeAltIcon },
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
                    placeholder="Search flashcards..."
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
                    <ListBulletIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('masonry')}
                    className={cn(
                      "p-1.5 rounded transition-colors",
                      viewMode === 'masonry' 
                        ? "bg-white dark:bg-gray-600 shadow-sm" 
                        : "hover:bg-gray-200 dark:hover:bg-gray-600"
                    )}
                  >
                    <Square3Stack3DIcon className="w-4 h-4" />
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

                {/* Create Deck Button */}
                <button
                  onClick={() => setShowCreateDeck(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>New Deck</span>
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
                        Subject:
                      </label>
                      <select
                        value={filterBy.subject || ''}
                        onChange={(e) => setFilterBy(prev => ({ ...prev, subject: e.target.value || undefined }))}
                        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      >
                        <option value="">All Subjects</option>
                        {statistics?.subjectBreakdown?.map(({ subject }) => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
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
                        <option value="name">Name</option>
                        <option value="progress">Progress</option>
                        <option value="difficulty">Difficulty</option>
                      </select>
                    </div>

                    <button
                      onClick={() => setIsSelectionMode(!isSelectionMode)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-md transition-colors",
                        isSelectionMode
                          ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      )}
                    >
                      {isSelectionMode ? 'Exit Selection' : 'Select Mode'}
                    </button>

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
          {activeTab === 'decks' && (
            <div className="space-y-8">
              {/* Quick Stats */}
              {statistics && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <RectangleStackIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      <div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {statistics.totalDecks}
                        </div>
                        <div className="text-sm text-blue-600/70 dark:text-blue-400/70">
                          Total Decks
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <AcademicCapIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                      <div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {statistics.cardsStudiedToday}
                        </div>
                        <div className="text-sm text-green-600/70 dark:text-green-400/70">
                          Today
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <FireSolidIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      <div>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {statistics.currentStreak}
                        </div>
                        <div className="text-sm text-purple-600/70 dark:text-purple-400/70">
                          Day Streak
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <CheckCircleSolidIcon className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                      <div>
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {statistics.masteredCards}
                        </div>
                        <div className="text-sm text-orange-600/70 dark:text-orange-400/70">
                          Mastered
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-6 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <ClockIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                      <div>
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                          {statistics.reviewCards}
                        </div>
                        <div className="text-sm text-yellow-600/70 dark:text-yellow-400/70">
                          Due Review
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Flashcard Decks Grid */}
              {sortedDecks.length === 0 ? (
                <div className="text-center py-20">
                  <RectangleStackIcon className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {searchQuery || Object.keys(filterBy).length > 0 ? 'No decks found' : 'No flashcard decks yet'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {searchQuery || Object.keys(filterBy).length > 0 
                      ? 'Try adjusting your search or filters'
                      : 'Create your first flashcard deck to start studying with spaced repetition'
                    }
                  </p>
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={() => setShowCreateDeck(true)}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <PlusIcon className="w-5 h-5" />
                      <span>Create Deck</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('marketplace')}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      <GlobeAltIcon className="w-5 h-5" />
                      <span>Browse Marketplace</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className={cn(
                  "transition-all duration-200",
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : viewMode === 'list'
                    ? "space-y-4"
                    : "columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6"
                )}>
                  <AnimatePresence mode="popLayout">
                    {sortedDecks.map(renderDeckCard)}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {activeTab === 'study' && (
            <div className="space-y-6">
              {/* Study Options */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                  Study Session
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => selectedDeck && handleStartStudy(decks.find((d: FlashcardDeck) => d.id === selectedDeck)!, 'new')}
                    className="p-6 border-2 border-dashed border-green-300 dark:border-green-600 rounded-lg hover:border-green-500 dark:hover:border-green-400 transition-colors group"
                    disabled={!selectedDeck}
                  >
                    <SparklesIcon className="w-8 h-8 text-green-500 dark:text-green-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      New Cards
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Learn new flashcards
                    </p>
                  </button>

                  <button
                    onClick={() => selectedDeck && handleStartStudy(decks.find((d: FlashcardDeck) => d.id === selectedDeck)!, 'review')}
                    className="p-6 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
                    disabled={!selectedDeck}
                  >
                    <ArrowPathIcon className="w-8 h-8 text-blue-500 dark:text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Review
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Review due cards
                    </p>
                  </button>

                  <button
                    onClick={() => selectedDeck && handleStartStudy(decks.find((d: FlashcardDeck) => d.id === selectedDeck)!, 'test')}
                    className="p-6 border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors group"
                    disabled={!selectedDeck}
                  >
                    <BeakerIcon className="w-8 h-8 text-purple-500 dark:text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Test Mode
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Quiz yourself
                    </p>
                  </button>

                  <button
                    onClick={() => selectedDeck && handleStartStudy(decks.find((d: FlashcardDeck) => d.id === selectedDeck)!, 'cram')}
                    className="p-6 border-2 border-dashed border-orange-300 dark:border-orange-600 rounded-lg hover:border-orange-500 dark:hover:border-orange-400 transition-colors group"
                    disabled={!selectedDeck}
                  >
                    <BoltSolidIcon className="w-8 h-8 text-orange-500 dark:text-orange-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Cram
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Quick review
                    </p>
                  </button>
                </div>
              </div>

              {/* Due Cards Preview */}
              {selectedDeck && dueCards.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Due Cards ({dueCards.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dueCards.slice(0, 6).map((card: Flashcard) => renderFlashcard(card))}
                  </div>
                  {dueCards.length > 6 && (
                    <div className="mt-4 text-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        and {dueCards.length - 6} more cards...
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {statistics && (
                <>
                  {/* Analytics Overview */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Weekly Progress
                      </h3>
                      <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                        Weekly study chart would be here
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Subject Performance
                      </h3>
                      <div className="space-y-3">
                        {statistics.subjectBreakdown.map((subject, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {subject.subject}
                            </span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{ width: `${subject.score}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {subject.score}%
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
                      {statistics.achievements.slice(0, 6).map((achievement, index) => (
                        <div
                          key={index}
                          className={cn(
                            "flex items-center space-x-3 p-3 border rounded-lg",
                            achievement.rarity === 'legendary' && "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700",
                            achievement.rarity === 'epic' && "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700",
                            achievement.rarity === 'rare' && "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700",
                            achievement.rarity === 'common' && "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700"
                          )}
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
                  Flashcard Templates
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
                {templates.map((template: FlashcardTemplate) => (
                  <motion.div
                    key={template.id}
                    whileHover={{ y: -2 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden border border-gray-200 dark:border-gray-700"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              {template.name}
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
                        <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors">
                          Use Template
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'marketplace' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
              <GlobeAltIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Marketplace Coming Soon
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Discover and share flashcard decks with the community
              </p>
            </div>
          )}
        </main>

        {/* Study Interface */}
        {isStudying && renderStudyInterface()}
      </div>
    </>
  );
};

export default FlashcardsPage;