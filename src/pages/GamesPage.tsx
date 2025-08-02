import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlayIcon, 
  TrophyIcon, 
  StarIcon, 
  UsersIcon, 
  FireIcon, 
  ClockIcon,
  ChartBarIcon,
  AcademicCapIcon,
  PuzzlePieceIcon,
  BeakerIcon,
  GlobeAltIcon,
  LightBulbIcon,
  BookOpenIcon,
  CalculatorIcon,
  LanguageIcon,
  PaintBrushIcon,
  MusicalNoteIcon,
  CogIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon,
  FlagIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Bars3Icon,
  GridViewIcon
} from '@heroicons/react/24/outline';
import { 
  PlayIcon as PlayIconSolid,
  TrophyIcon as TrophyIconSolid,
  StarIcon as StarIconSolid,
  FireIcon as FireIconSolid
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn } from '@/utils/cn';

// Mock data interfaces
interface Game {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  duration: number;
  thumbnail: string;
  rating: number;
  playCount: number;
  isNew: boolean;
  isFeatured: boolean;
  tags: string[];
  achievements: number;
  maxScore: number;
  multiplayer: boolean;
  learningObjectives: string[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  unlockedAt?: string;
  progress: number;
  total: number;
  gameId?: string;
  category: string;
}

interface Tournament {
  id: string;
  title: string;
  description: string;
  gameId: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'ended';
  participants: number;
  maxParticipants: number;
  prizePool: string;
  entryFee: number;
  difficulty: string;
  thumbnail: string;
}

interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  score: number;
  rank: number;
  gamesPlayed: number;
  winRate: number;
  achievements: number;
  totalTime: number;
  streak: number;
}

interface GameSession {
  id: string;
  gameId: string;
  score: number;
  duration: number;
  completedAt: string;
  accuracy: number;
  streakCount: number;
  achievementsUnlocked: string[];
}

const GamesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'games' | 'tournaments' | 'achievements' | 'leaderboard'>('games');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating' | 'difficulty'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showGameModal, setShowGameModal] = useState(false);
  const [gameFilters, setGameFilters] = useState({
    difficulty: 'all',
    duration: 'all',
    multiplayer: 'all',
    new: false,
    featured: false
  });
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [leaderboardFilter, setLeaderboardFilter] = useState<'global' | 'friends' | 'weekly' | 'monthly'>('global');

  const queryClient = useQueryClient();

  // Mock data
  const gameCategories = [
    { id: 'all', name: 'All Games', icon: GridViewIcon, count: 150 },
    { id: 'math', name: 'Mathematics', icon: CalculatorIcon, count: 25 },
    { id: 'science', name: 'Science', icon: BeakerIcon, count: 30 },
    { id: 'language', name: 'Language Arts', icon: LanguageIcon, count: 20 },
    { id: 'history', name: 'History', icon: BookOpenIcon, count: 18 },
    { id: 'geography', name: 'Geography', icon: GlobeAltIcon, count: 15 },
    { id: 'logic', name: 'Logic & Puzzles', icon: PuzzlePieceIcon, count: 22 },
    { id: 'creativity', name: 'Creativity', icon: PaintBrushIcon, count: 12 },
    { id: 'music', name: 'Music', icon: MusicalNoteIcon, count: 8 }
  ];

  const mockGames: Game[] = [
    {
      id: '1',
      title: 'Algebra Adventure',
      description: 'Master algebraic equations through exciting quests and challenges',
      category: 'math',
      difficulty: 'Medium',
      duration: 25,
      thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400',
      rating: 4.8,
      playCount: 15420,
      isNew: false,
      isFeatured: true,
      tags: ['algebra', 'equations', 'problem-solving'],
      achievements: 12,
      maxScore: 10000,
      multiplayer: true,
      learningObjectives: ['Solve linear equations', 'Understand algebraic expressions', 'Apply mathematical reasoning']
    },
    {
      id: '2',
      title: 'Chemistry Lab Simulator',
      description: 'Conduct virtual experiments and learn chemical reactions safely',
      category: 'science',
      difficulty: 'Hard',
      duration: 40,
      thumbnail: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400',
      rating: 4.9,
      playCount: 8950,
      isNew: true,
      isFeatured: true,
      tags: ['chemistry', 'experiments', 'reactions'],
      achievements: 18,
      maxScore: 15000,
      multiplayer: false,
      learningObjectives: ['Understand chemical reactions', 'Learn lab safety', 'Apply scientific method']
    },
    {
      id: '3',
      title: 'Grammar Galaxy',
      description: 'Explore the universe of grammar rules and language structure',
      category: 'language',
      difficulty: 'Easy',
      duration: 15,
      thumbnail: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
      rating: 4.6,
      playCount: 22100,
      isNew: false,
      isFeatured: false,
      tags: ['grammar', 'language', 'writing'],
      achievements: 8,
      maxScore: 5000,
      multiplayer: true,
      learningObjectives: ['Master grammar rules', 'Improve sentence structure', 'Enhance writing skills']
    },
    {
      id: '4',
      title: 'History Detective',
      description: 'Solve historical mysteries and uncover the secrets of the past',
      category: 'history',
      difficulty: 'Medium',
      duration: 35,
      thumbnail: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400',
      rating: 4.7,
      playCount: 11200,
      isNew: false,
      isFeatured: false,
      tags: ['history', 'mystery', 'investigation'],
      achievements: 15,
      maxScore: 12000,
      multiplayer: false,
      learningObjectives: ['Learn historical events', 'Develop critical thinking', 'Understand cause and effect']
    },
    {
      id: '5',
      title: 'Puzzle Master Challenge',
      description: 'Test your logic and problem-solving skills with mind-bending puzzles',
      category: 'logic',
      difficulty: 'Expert',
      duration: 30,
      thumbnail: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400',
      rating: 4.9,
      playCount: 6780,
      isNew: true,
      isFeatured: true,
      tags: ['logic', 'puzzles', 'critical-thinking'],
      achievements: 20,
      maxScore: 20000,
      multiplayer: true,
      learningObjectives: ['Enhance logical reasoning', 'Improve problem-solving', 'Develop pattern recognition']
    },
    {
      id: '6',
      title: 'World Explorer',
      description: 'Travel the globe and discover countries, capitals, and cultures',
      category: 'geography',
      difficulty: 'Medium',
      duration: 20,
      thumbnail: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
      rating: 4.5,
      playCount: 18900,
      isNew: false,
      isFeatured: false,
      tags: ['geography', 'countries', 'culture'],
      achievements: 10,
      maxScore: 8000,
      multiplayer: true,
      learningObjectives: ['Learn world geography', 'Understand cultural diversity', 'Memorize capitals and landmarks']
    }
  ];

  const mockAchievements: Achievement[] = [
    {
      id: '1',
      title: 'First Steps',
      description: 'Complete your first game',
      icon: '🎯',
      rarity: 'Common',
      unlockedAt: '2024-01-15T10:30:00Z',
      progress: 1,
      total: 1,
      category: 'Milestone'
    },
    {
      id: '2',
      title: 'Math Wizard',
      description: 'Score 100% on 10 math games',
      icon: '🧙‍♂️',
      rarity: 'Epic',
      unlockedAt: '2024-01-20T14:45:00Z',
      progress: 10,
      total: 10,
      gameId: '1',
      category: 'Subject'
    },
    {
      id: '3',
      title: 'Speed Demon',
      description: 'Complete a game in under 5 minutes',
      icon: '⚡',
      rarity: 'Rare',
      progress: 1,
      total: 1,
      category: 'Performance'
    },
    {
      id: '4',
      title: 'Social Learner',
      description: 'Play 50 multiplayer games',
      icon: '👥',
      rarity: 'Rare',
      progress: 23,
      total: 50,
      category: 'Social'
    },
    {
      id: '5',
      title: 'Perfect Streak',
      description: 'Maintain a 7-day gaming streak',
      icon: '🔥',
      rarity: 'Legendary',
      progress: 5,
      total: 7,
      category: 'Streak'
    }
  ];

  const mockTournaments: Tournament[] = [
    {
      id: '1',
      title: 'Global Math Championship',
      description: 'Compete with students worldwide in the ultimate math challenge',
      gameId: '1',
      startDate: '2024-02-01T00:00:00Z',
      endDate: '2024-02-07T23:59:59Z',
      status: 'active',
      participants: 1247,
      maxParticipants: 2000,
      prizePool: '$5,000',
      entryFee: 0,
      difficulty: 'Medium',
      thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400'
    },
    {
      id: '2',
      title: 'Science Fair Showdown',
      description: 'Show off your scientific knowledge in this epic tournament',
      gameId: '2',
      startDate: '2024-02-10T00:00:00Z',
      endDate: '2024-02-17T23:59:59Z',
      status: 'upcoming',
      participants: 0,
      maxParticipants: 1500,
      prizePool: '$3,000',
      entryFee: 5,
      difficulty: 'Hard',
      thumbnail: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400'
    }
  ];

  const mockLeaderboard: LeaderboardEntry[] = [
    {
      id: '1',
      userId: 'user1',
      username: 'MathMaster2024',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
      score: 89750,
      rank: 1,
      gamesPlayed: 156,
      winRate: 94.2,
      achievements: 47,
      totalTime: 2890,
      streak: 12
    },
    {
      id: '2',
      userId: 'user2',
      username: 'ScienceQueen',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b2e0f52f?w=100',
      score: 87320,
      rank: 2,
      gamesPlayed: 142,
      winRate: 91.5,
      achievements: 43,
      totalTime: 2650,
      streak: 8
    },
    {
      id: '3',
      userId: 'user3',
      username: 'LogicLord',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      score: 85640,
      rank: 3,
      gamesPlayed: 134,
      winRate: 89.8,
      achievements: 41,
      totalTime: 2450,
      streak: 15
    }
  ];

  // Queries
  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ['games', selectedCategory, searchQuery, sortBy, gameFilters],
    queryFn: () => Promise.resolve(mockGames.filter(game => 
      (selectedCategory === 'all' || game.category === selectedCategory) &&
      game.title.toLowerCase().includes(searchQuery.toLowerCase())
    )),
    staleTime: 5 * 60 * 1000
  });

  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => Promise.resolve(mockAchievements),
    staleTime: 10 * 60 * 1000
  });

  const { data: tournaments, isLoading: tournamentsLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => Promise.resolve(mockTournaments),
    staleTime: 5 * 60 * 1000
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['leaderboard', leaderboardFilter],
    queryFn: () => Promise.resolve(mockLeaderboard),
    staleTime: 2 * 60 * 1000
  });

  // Mutations
  const playGameMutation = useMutation({
    mutationFn: async (gameId: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Game started! Good luck!');
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
    onError: () => {
      toast.error('Failed to start game. Please try again.');
    }
  });

  const joinTournamentMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Successfully joined tournament!');
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
    onError: () => {
      toast.error('Failed to join tournament. Please try again.');
    }
  });

  // Helper functions
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Hard': return 'text-orange-600 bg-orange-50';
      case 'Expert': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'text-gray-600 bg-gray-100 border-gray-300';
      case 'Rare': return 'text-blue-600 bg-blue-100 border-blue-300';
      case 'Epic': return 'text-purple-600 bg-purple-100 border-purple-300';
      case 'Legendary': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'upcoming': return 'text-blue-600 bg-blue-100';
      case 'ended': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <>
      <Helmet>
        <title>Educational Games - StudyGenius</title>
        <meta name="description" content="Play educational games, join tournaments, earn achievements, and compete on leaderboards." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl">
                    <PuzzlePieceIcon className="h-8 w-8 text-white" />
                  </div>
                  Educational Games
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Learn through play with our collection of educational games and challenges
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">150+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Games</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">25k+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Players</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">500+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Achievements</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="flex space-x-1 bg-white/50 dark:bg-gray-800/50 p-1 rounded-xl backdrop-blur-sm">
              {[
                { id: 'games', label: 'Games', icon: PlayIcon },
                { id: 'tournaments', label: 'Tournaments', icon: TrophyIcon },
                { id: 'achievements', label: 'Achievements', icon: StarIcon },
                { id: 'leaderboard', label: 'Leaderboard', icon: ChartBarIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200',
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Games Tab */}
          {activeTab === 'games' && (
            <div className="space-y-6">
              {/* Filters and Search */}
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search games..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="popular">Most Popular</option>
                    <option value="newest">Newest</option>
                    <option value="rating">Highest Rated</option>
                    <option value="difficulty">Difficulty</option>
                  </select>

                  {/* View Mode */}
                  <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        'p-2 rounded-md transition-colors',
                        viewMode === 'grid'
                          ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      )}
                    >
                      <GridViewIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        'p-2 rounded-md transition-colors',
                        viewMode === 'list'
                          ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      )}
                    >
                      <Bars3Icon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Categories</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-9 gap-3">
                  {gameCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200',
                        selectedCategory === category.id
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 ring-2 ring-purple-500/20'
                          : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white'
                      )}
                    >
                      <category.icon className="h-6 w-6" />
                      <span className="text-xs font-medium text-center">{category.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{category.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Games Grid/List */}
              {gamesLoading ? (
                <LoadingSpinner size="lg" label="Loading games..." />
              ) : (
                <div className={cn(
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                    : 'space-y-4'
                )}>
                  {games?.map((game, index) => (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        'group bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden',
                        viewMode === 'list' && 'flex items-center'
                      )}
                    >
                      {/* Thumbnail */}
                      <div className={cn(
                        'relative overflow-hidden',
                        viewMode === 'grid' ? 'aspect-video' : 'w-24 h-24 flex-shrink-0'
                      )}>
                        <img
                          src={game.thumbnail}
                          alt={game.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {game.isNew && (
                          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            NEW
                          </div>
                        )}
                        {game.isFeatured && (
                          <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            ⭐ FEATURED
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <button
                            onClick={() => playGameMutation.mutate(game.id)}
                            disabled={playGameMutation.isPending}
                            className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors"
                          >
                            {playGameMutation.isPending ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <PlayIconSolid className="h-6 w-6" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className={cn('p-4', viewMode === 'list' && 'flex-1')}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                            {game.title}
                          </h3>
                          <div className="flex items-center gap-1 text-yellow-500">
                            <StarIconSolid className="h-4 w-4" />
                            <span className="text-sm font-medium">{game.rating}</span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {game.description}
                        </p>

                        <div className="flex items-center justify-between text-sm mb-3">
                          <span className={cn('px-2 py-1 rounded-full font-medium', getDifficultyColor(game.difficulty))}>
                            {game.difficulty}
                          </span>
                          <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <ClockIcon className="h-4 w-4" />
                              {formatDuration(game.duration)}
                            </span>
                            <span className="flex items-center gap-1">
                              <EyeIcon className="h-4 w-4" />
                              {game.playCount.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {game.multiplayer && (
                              <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                                <UsersIcon className="h-3 w-3" />
                                Multiplayer
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                              <TrophyIcon className="h-3 w-3" />
                              {game.achievements} achievements
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedGame(game);
                              setShowGameModal(true);
                            }}
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium text-sm"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tournaments Tab */}
          {activeTab === 'tournaments' && (
            <div className="space-y-6">
              {tournamentsLoading ? (
                <LoadingSpinner size="lg" label="Loading tournaments..." />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {tournaments?.map((tournament, index) => (
                    <motion.div
                      key={tournament.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                      <div className="relative h-48">
                        <img
                          src={tournament.thumbnail}
                          alt={tournament.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="flex items-center justify-between">
                            <span className={cn('px-3 py-1 rounded-full text-sm font-medium', getStatusColor(tournament.status))}>
                              {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                            </span>
                            <span className="text-white bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                              {tournament.prizePool}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {tournament.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {tournament.description}
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Participants</div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {tournament.participants.toLocaleString()} / {tournament.maxParticipants.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Entry Fee</div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {tournament.entryFee === 0 ? 'Free' : `$${tournament.entryFee}`}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Start Date</div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {new Date(tournament.startDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">End Date</div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {new Date(tournament.endDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => {
                              setSelectedTournament(tournament);
                              setShowTournamentModal(true);
                            }}
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => joinTournamentMutation.mutate(tournament.id)}
                            disabled={joinTournamentMutation.isPending || tournament.status === 'ended'}
                            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                          >
                            {joinTournamentMutation.isPending ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <TrophyIconSolid className="h-4 w-4" />
                            )}
                            {tournament.status === 'ended' ? 'Ended' : 'Join Tournament'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div className="space-y-6">
              {achievementsLoading ? (
                <LoadingSpinner size="lg" label="Loading achievements..." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {achievements?.map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        'bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 p-6 transition-all duration-300',
                        achievement.unlockedAt
                          ? 'border-green-300 dark:border-green-600 shadow-green-100 dark:shadow-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 opacity-75'
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'text-4xl p-3 rounded-xl border-2',
                          achievement.unlockedAt
                            ? getRarityColor(achievement.rarity)
                            : 'text-gray-400 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                        )}>
                          {achievement.unlockedAt ? achievement.icon : '🔒'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-gray-900 dark:text-white">
                              {achievement.title}
                            </h3>
                            <span className={cn(
                              'px-2 py-1 rounded-full text-xs font-medium border',
                              getRarityColor(achievement.rarity)
                            )}>
                              {achievement.rarity}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {achievement.description}
                          </p>
                          
                          {achievement.unlockedAt ? (
                            <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                              ✓ Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span>Progress</span>
                                <span>{achievement.progress}/{achievement.total}</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-6">
              {/* Leaderboard Filters */}
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'global', label: 'Global' },
                    { id: 'friends', label: 'Friends' },
                    { id: 'weekly', label: 'This Week' },
                    { id: 'monthly', label: 'This Month' }
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setLeaderboardFilter(filter.id as any)}
                      className={cn(
                        'px-4 py-2 rounded-lg font-medium transition-all duration-200',
                        leaderboardFilter === filter.id
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-600'
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {leaderboardLoading ? (
                <LoadingSpinner size="lg" label="Loading leaderboard..." />
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Top Players
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {leaderboard?.map((entry, index) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {/* Rank */}
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                            entry.rank === 1 ? 'bg-yellow-500 text-white' :
                            entry.rank === 2 ? 'bg-gray-400 text-white' :
                            entry.rank === 3 ? 'bg-orange-500 text-white' :
                            'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          )}>
                            {entry.rank}
                          </div>

                          {/* Avatar */}
                          <img
                            src={entry.avatar}
                            alt={entry.username}
                            className="w-12 h-12 rounded-full object-cover"
                          />

                          {/* User Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {entry.username}
                              </h4>
                              {entry.streak > 0 && (
                                <div className="flex items-center gap-1 text-orange-500">
                                  <FireIconSolid className="h-4 w-4" />
                                  <span className="text-sm font-medium">{entry.streak}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                              <span>{entry.gamesPlayed} games</span>
                              <span>{entry.winRate}% win rate</span>
                              <span>{entry.achievements} achievements</span>
                            </div>
                          </div>

                          {/* Score */}
                          <div className="text-right">
                            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                              {entry.score.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {formatTime(entry.totalTime)} played
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Game Details Modal */}
        <AnimatePresence>
          {showGameModal && selectedGame && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowGameModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <img
                    src={selectedGame.thumbnail}
                    alt={selectedGame.title}
                    className="w-full h-64 object-cover rounded-t-xl"
                  />
                  <button
                    onClick={() => setShowGameModal(false)}
                    className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {selectedGame.title}
                      </h2>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={cn('px-2 py-1 rounded-full font-medium', getDifficultyColor(selectedGame.difficulty))}>
                          {selectedGame.difficulty}
                        </span>
                        <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <ClockIcon className="h-4 w-4" />
                          {formatDuration(selectedGame.duration)}
                        </span>
                        <span className="flex items-center gap-1 text-yellow-500">
                          <StarIconSolid className="h-4 w-4" />
                          {selectedGame.rating} ({selectedGame.playCount.toLocaleString()} plays)
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {selectedGame.description}
                  </p>

                  <div className="space-y-4 mb-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Learning Objectives</h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                        {selectedGame.learningObjectives.map((objective, index) => (
                          <li key={index}>{objective}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Game Features</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedGame.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {selectedGame.multiplayer && (
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm rounded-full">
                            Multiplayer
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Achievements Available</h4>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{selectedGame.achievements}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Max Score</h4>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedGame.maxScore.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        playGameMutation.mutate(selectedGame.id);
                        setShowGameModal(false);
                      }}
                      disabled={playGameMutation.isPending}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {playGameMutation.isPending ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <PlayIconSolid className="h-5 w-5" />
                      )}
                      Play Now
                    </button>
                    <button className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                      <HeartIcon className="h-5 w-5" />
                      Favorite
                    </button>
                    <button className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                      <ShareIcon className="h-5 w-5" />
                      Share
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tournament Details Modal */}
        <AnimatePresence>
          {showTournamentModal && selectedTournament && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowTournamentModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <img
                    src={selectedTournament.thumbnail}
                    alt={selectedTournament.title}
                    className="w-full h-64 object-cover rounded-t-xl"
                  />
                  <button
                    onClick={() => setShowTournamentModal(false)}
                    className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center justify-between">
                      <span className={cn('px-3 py-1 rounded-full text-sm font-medium', getStatusColor(selectedTournament.status))}>
                        {selectedTournament.status.charAt(0).toUpperCase() + selectedTournament.status.slice(1)}
                      </span>
                      <span className="text-white bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                        Prize Pool: {selectedTournament.prizePool}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {selectedTournament.title}
                  </h2>

                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {selectedTournament.description}
                  </p>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Start Date</h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {new Date(selectedTournament.startDate).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">End Date</h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {new Date(selectedTournament.endDate).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Entry Fee</h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {selectedTournament.entryFee === 0 ? 'Free' : `$${selectedTournament.entryFee}`}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Participants</h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {selectedTournament.participants.toLocaleString()} / {selectedTournament.maxParticipants.toLocaleString()}
                        </p>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${(selectedTournament.participants / selectedTournament.maxParticipants) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Difficulty</h4>
                        <p className="text-gray-600 dark:text-gray-400">{selectedTournament.difficulty}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Prize Pool</h4>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {selectedTournament.prizePool}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        joinTournamentMutation.mutate(selectedTournament.id);
                        setShowTournamentModal(false);
                      }}
                      disabled={joinTournamentMutation.isPending || selectedTournament.status === 'ended'}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {joinTournamentMutation.isPending ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <TrophyIconSolid className="h-5 w-5" />
                      )}
                      {selectedTournament.status === 'ended' ? 'Tournament Ended' : 'Join Tournament'}
                    </button>
                    <button className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                      <FlagIcon className="h-5 w-5" />
                      Report
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

export default GamesPage;