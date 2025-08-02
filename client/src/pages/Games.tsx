import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gamepad2, 
  Trophy, 
  Star, 
  Users, 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Award, 
  Target, 
  Clock, 
  Zap, 
  Brain, 
  BookOpen, 
  Hash, 
  Activity, 
  Calendar, 
  Globe, 
  Layers, 
  TrendingUp, 
  Timer, 
  Crown, 
  Medal, 
  Fire, 
  Flame, 
  Shield, 
  Sword, 
  Sparkles, 
  Rocket, 
  Diamond, 
  Gem, 
  Heart, 
  Eye, 
  Headphones, 
  Hand, 
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  BarChart3, 
  PieChart, 
  LineChart, 
  TrendingDown, 
  MoreHorizontal, 
  UserPlus, 
  Share2, 
  MessageCircle, 
  ThumbsUp, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  HelpCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Lightbulb,
  BookMarked,
  Calculator,
  Flask,
  MapPin,
  Code,
  Feather,
  DollarSign,
  Atom
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Game {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty_levels: string[];
  multiplayer: boolean;
  max_players: number;
  duration: number;
  scoring: {
    [key: string]: number;
  };
  userStats?: {
    bestScore: number;
    gamesPlayed: number;
    averageScore: number;
  };
  globalRank?: number;
  totalPlayers: number;
}

interface GameSession {
  sessionId: number;
  gameContent: any;
  timeLimit: number;
  scoring: any;
}

interface GameScore {
  gameId: string;
  userId: number;
  score: number;
  difficulty: string;
  achievedAt: string;
  metadata: any;
}

interface LeaderboardEntry {
  rank: number;
  userId: number;
  firstName: string;
  lastName: string;
  username: string;
  avatar: string;
  score: number;
  difficulty: string;
  achievedAt: string;
  metadata: any;
}

interface Lobby {
  sessionId: number;
  hostUser: string;
  hostAvatar: string;
  difficulty: string;
  currentPlayers: number;
  maxPlayers: number;
  createdAt: string;
  metadata: any;
}

const GAME_ICONS = {
  speed_math: Calculator,
  vocabulary_vault: BookOpen,
  science_lab: Flask,
  history_timeline: Calendar,
  geography_quest: MapPin,
  code_breaker: Code,
  literary_detective: Feather,
  chemistry_mixer: Atom,
  economics_empire: DollarSign,
  physics_playground: Zap
};

const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  hard: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  expert: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  beginner: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  intermediate: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  advanced: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
};

const Games: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [recentGames, setRecentGames] = useState<GameScore[]>([]);
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  
  // Game states
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [gameContent, setGameContent] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  
  // UI states
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMultiplayerOnly, setShowMultiplayerOnly] = useState(false);
  const [showGameDetails, setShowGameDetails] = useState(false);
  const [showCreateLobby, setShowCreateLobby] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    fetchGamesData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleGameEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeRemaining]);

  const fetchGamesData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (showMultiplayerOnly) params.multiplayer = true;
      if (selectedDifficulty) params.difficulty = selectedDifficulty;

      const response = await axios.get('/api/games', { params });
      setGames(response.data.data.games);
    } catch (error) {
      console.error('Error fetching games:', error);
      toast.error('Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  const fetchGameDetails = async (gameId: string, difficulty?: string, timeframe?: string) => {
    try {
      const params: any = {};
      if (difficulty) params.difficulty = difficulty;
      if (timeframe) params.timeframe = timeframe;

      const response = await axios.get(`/api/games/${gameId}`, { params });
      setLeaderboard(response.data.data.leaderboard);
      setUserStats(response.data.data.userStats);
      setRecentGames(response.data.data.recentGames);
    } catch (error) {
      console.error('Error fetching game details:', error);
      toast.error('Failed to load game details');
    }
  };

  const fetchLobbies = async (gameId: string, difficulty?: string) => {
    try {
      const params: any = {};
      if (difficulty) params.difficulty = difficulty;

      const response = await axios.get(`/api/games/${gameId}/lobby`, { params });
      setLobbies(response.data.data.lobbies);
    } catch (error) {
      console.error('Error fetching lobbies:', error);
      toast.error('Failed to load lobbies');
    }
  };

  const startGame = async (gameId: string, difficulty: string, multiplayer = false) => {
    try {
      const response = await axios.post(`/api/games/${gameId}/start`, {
        difficulty,
        multiplayer,
        customSettings: {
          soundEnabled,
          fullscreen
        }
      });

      setGameSession(response.data.data);
      setGameContent(response.data.data.gameContent);
      setTimeRemaining(response.data.data.timeLimit);
      setCurrentQuestion(0);
      setAnswers([]);
      setScore(0);
      setStreak(0);
      setIsPlaying(true);
      setGameStarted(true);
      setActiveTab('play');

      toast.success('Game started! Good luck!');
    } catch (error) {
      console.error('Error starting game:', error);
      toast.error('Failed to start game');
    }
  };

  const submitAnswer = (answer: any) => {
    const newAnswers = [...answers];
    const questionStartTime = Date.now() - (gameSession!.timeLimit - timeRemaining) * 1000;
    const timeSpent = Math.max(1, Math.min(30, (Date.now() - questionStartTime) / 1000));
    
    newAnswers[currentQuestion] = {
      ...answer,
      timeSpent,
      correct: checkAnswer(answer, gameContent, currentQuestion)
    };
    
    setAnswers(newAnswers);

    // Update score and streak
    if (newAnswers[currentQuestion].correct) {
      const baseScore = selectedGame?.scoring.correct_answer || 10;
      const speedBonus = Math.max(0, (30 - timeSpent) / 5) * (selectedGame?.scoring.speed_bonus || 5);
      const newStreak = streak + 1;
      const streakMultiplier = newStreak >= 5 ? (selectedGame?.scoring.streak_multiplier || 1.5) : 1;
      
      setScore(prev => prev + Math.floor((baseScore + speedBonus) * streakMultiplier));
      setStreak(newStreak);
      
      if (soundEnabled) {
        // Play success sound
        playSound('correct');
      }
    } else {
      setStreak(0);
      if (soundEnabled) {
        // Play error sound
        playSound('incorrect');
      }
    }

    // Move to next question or end game
    if (currentQuestion < getTotalQuestions(gameContent) - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleGameEnd();
    }
  };

  const checkAnswer = (answer: any, content: any, questionIndex: number): boolean => {
    if (!content || !content.problems && !content.questions && !content.experiments) return false;
    
    const questions = content.problems || content.questions || content.experiments || [];
    const question = questions[questionIndex];
    
    if (!question) return false;
    
    if (question.answer !== undefined) {
      return answer.value === question.answer;
    }
    
    if (question.correctAnswer !== undefined) {
      return answer.value === question.correctAnswer;
    }
    
    return false;
  };

  const getTotalQuestions = (content: any): number => {
    if (!content) return 0;
    return (content.problems?.length || 0) + 
           (content.questions?.length || 0) + 
           (content.experiments?.length || 0) +
           (content.challenges?.length || 0) +
           (content.scenarios?.length || 0);
  };

  const handleGameEnd = async () => {
    if (!gameSession || !selectedGame) return;

    setIsPlaying(false);
    setGameStarted(false);

    try {
      const response = await axios.post(`/api/games/${selectedGame.id}/submit`, {
        sessionId: gameSession.sessionId,
        answers,
        timeSpent: gameSession.timeLimit - timeRemaining,
        metadata: {
          finalScore: score,
          streak: Math.max(...answers.map((_, i) => {
            let currentStreak = 0;
            let maxStreak = 0;
            answers.slice(0, i + 1).forEach(a => {
              if (a?.correct) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
              } else {
                currentStreak = 0;
              }
            });
            return maxStreak;
          })),
          soundEnabled,
          fullscreen
        }
      });

      const result = response.data.data;
      
      toast.success(`Game completed! Score: ${result.score}`);
      
      if (result.personalBest) {
        toast.success('🎉 New personal best!');
      }
      
      if (result.achievements.length > 0) {
        result.achievements.forEach((achievement: string) => {
          toast.success(`🏆 Achievement unlocked: ${achievement}`);
        });
      }

      // Refresh game data
      await fetchGameDetails(selectedGame.id);
      await fetchGamesData();
      
      setActiveTab('results');
    } catch (error) {
      console.error('Error submitting game:', error);
      toast.error('Failed to submit game results');
    }
  };

  const createLobby = async (gameId: string, difficulty: string, maxPlayers: number, isPrivate: boolean) => {
    try {
      const response = await axios.post(`/api/games/${gameId}/lobby/create`, {
        difficulty,
        maxPlayers,
        isPrivate
      });

      toast.success('Lobby created successfully!');
      await fetchLobbies(gameId, difficulty);
      setShowCreateLobby(false);
    } catch (error) {
      console.error('Error creating lobby:', error);
      toast.error('Failed to create lobby');
    }
  };

  const playSound = (type: 'correct' | 'incorrect' | 'start' | 'end') => {
    if (!soundEnabled) return;
    
    // Create audio context and play sounds
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch (type) {
      case 'correct':
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
        break;
      case 'incorrect':
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.1);
        break;
      case 'start':
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2);
        break;
      case 'end':
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(392, audioContext.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(330, audioContext.currentTime + 0.4);
        break;
    }
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderGameCard = (game: Game) => {
    const IconComponent = GAME_ICONS[game.id] || Gamepad2;
    
    return (
      <motion.div
        key={game.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden group"
        onClick={() => {
          setSelectedGame(game);
          fetchGameDetails(game.id);
          setShowGameDetails(true);
        }}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white">
                <IconComponent className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {game.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {game.category.replace('_', ' ')}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {game.multiplayer && (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-xs font-medium">
                  Multiplayer
                </span>
              )}
              {game.userStats && game.userStats.gamesPlayed > 0 && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-xs font-medium">
                  Played
                </span>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {game.description}
          </p>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {game.difficulty_levels.slice(0, 3).map((level) => (
                <span
                  key={level}
                  className={`px-2 py-1 rounded-full text-xs font-medium ${DIFFICULTY_COLORS[level] || 'bg-gray-100 text-gray-800'}`}
                >
                  {level}
                </span>
              ))}
              {game.difficulty_levels.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full text-xs font-medium">
                  +{game.difficulty_levels.length - 3}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {Math.floor(game.duration / 60)}m
              </span>
              {game.multiplayer && (
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {game.max_players}
                </span>
              )}
            </div>
          </div>
          
          {game.userStats && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {game.userStats.bestScore.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Best Score</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {game.userStats.gamesPlayed}
                  </div>
                  <div className="text-xs text-gray-500">Games</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {game.globalRank ? `#${game.globalRank}` : '-'}
                  </div>
                  <div className="text-xs text-gray-500">Rank</div>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-4 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                startGame(game.id, game.difficulty_levels[0]);
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Play className="h-4 w-4" />
              Play Solo
            </button>
            {game.multiplayer && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fetchLobbies(game.id);
                  setActiveTab('multiplayer');
                }}
                className="px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-sm font-medium transition-colors"
              >
                <Users className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderGameOverview = () => {
    const filteredGames = games.filter(game => {
      if (selectedCategory !== 'all' && game.category !== selectedCategory) return false;
      if (showMultiplayerOnly && !game.multiplayer) return false;
      if (searchTerm && !game.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !game.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });

    return (
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input text-sm"
              >
                <option value="all">All Categories</option>
                <option value="mathematics">Mathematics</option>
                <option value="language">Language</option>
                <option value="science">Science</option>
                <option value="history">History</option>
                <option value="geography">Geography</option>
                <option value="computer_science">Computer Science</option>
                <option value="literature">Literature</option>
                <option value="chemistry">Chemistry</option>
                <option value="economics">Economics</option>
                <option value="physics">Physics</option>
              </select>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showMultiplayerOnly}
                  onChange={(e) => setShowMultiplayerOnly(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Multiplayer Only
                </span>
              </label>
            </div>
            
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search games..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 text-sm w-64"
                />
              </div>
              <button
                onClick={() => {
                  setRefreshing(true);
                  fetchGamesData().finally(() => setRefreshing(false));
                }}
                disabled={refreshing}
                className="btn-secondary p-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map(renderGameCard)}
        </div>

        {filteredGames.length === 0 && (
          <div className="text-center py-12">
            <Gamepad2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No games found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try adjusting your filters or search terms
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setShowMultiplayerOnly(false);
                setSearchTerm('');
              }}
              className="btn-primary"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderGameplay = () => {
    if (!gameSession || !gameContent || !selectedGame) {
      return (
        <div className="text-center py-12">
          <Gamepad2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No active game
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start a game to begin playing
          </p>
          <button
            onClick={() => setActiveTab('overview')}
            className="btn-primary"
          >
            Browse Games
          </button>
        </div>
      );
    }

    const IconComponent = GAME_ICONS[selectedGame.id] || Gamepad2;
    const questions = gameContent.problems || gameContent.questions || gameContent.experiments || [];
    const currentQ = questions[currentQuestion];

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Game Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <IconComponent className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{selectedGame.name}</h1>
                <p className="text-purple-100">Question {currentQuestion + 1} of {questions.length}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{formatTime(timeRemaining)}</div>
              <div className="text-sm text-purple-100">Time Remaining</div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex gap-6 text-sm">
              <span>Score: {score.toLocaleString()}</span>
              <span>Streak: {streak}</span>
              <span>Question {currentQuestion + 1}/{questions.length}</span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setFullscreen(!fullscreen)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Question Content */}
        {currentQ && (
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {currentQ.question || currentQ.title || 'Question'}
            </h2>
            
            {currentQ.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {currentQ.description}
              </p>
            )}

            {/* Math Problems */}
            {selectedGame.id === 'speed_math' && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    {currentQ.question}
                  </div>
                  <input
                    type="number"
                    placeholder="Your answer..."
                    className="input text-xl text-center w-48"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const value = parseFloat((e.target as HTMLInputElement).value);
                        submitAnswer({ value });
                      }
                    }}
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Multiple Choice Questions */}
            {(selectedGame.id === 'vocabulary_vault' || selectedGame.id === 'geography_quest' || 
              selectedGame.id === 'history_timeline' || selectedGame.id === 'economics_empire') && currentQ.options && (
              <div className="space-y-3">
                {currentQ.options.map((option: string, index: number) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => submitAnswer({ value: option })}
                    className="w-full p-4 text-left bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                  >
                    <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Coding Challenges */}
            {selectedGame.id === 'code_breaker' && (
              <div className="space-y-4">
                <div className="bg-gray-900 rounded-lg p-4">
                  <pre className="text-green-400 text-sm">
                    <code>{currentQ.template || 'function solution() {\n  // Your code here\n}'}</code>
                  </pre>
                </div>
                <textarea
                  placeholder="Write your solution here..."
                  className="input h-32 font-mono text-sm"
                  onKeyDown={(e) => {
                    if (e.ctrlKey && e.key === 'Enter') {
                      submitAnswer({ value: (e.target as HTMLTextAreaElement).value });
                    }
                  }}
                />
                <div className="text-sm text-gray-500">
                  Press Ctrl+Enter to submit your solution
                </div>
              </div>
            )}

            {/* Science Experiments */}
            {selectedGame.id === 'science_lab' && (
              <div className="space-y-6">
                {currentQ.materials && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Materials:</h3>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                      {currentQ.materials.map((material: string, index: number) => (
                        <li key={index}>{material}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {currentQ.steps && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Steps:</h3>
                    <ol className="list-decimal list-inside text-gray-600 dark:text-gray-400 space-y-1">
                      {currentQ.steps.map((step: string, index: number) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
                
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What do you observe?</h3>
                  <textarea
                    placeholder="Describe your observations..."
                    className="input h-24"
                    onKeyDown={(e) => {
                      if (e.ctrlKey && e.key === 'Enter') {
                        submitAnswer({ value: (e.target as HTMLTextAreaElement).value });
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Timer indicator */}
            <div className="mt-6 flex justify-center">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                timeRemaining > 30 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                timeRemaining > 10 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                <Timer className="h-4 w-4" />
                {formatTime(timeRemaining)}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
          <Gamepad2 className="h-8 w-8 text-purple-500" />
          Learning Games
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Learn through interactive games and compete with friends
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-8">
        {[
          { id: 'overview', label: 'All Games', icon: Gamepad2 },
          { id: 'play', label: 'Play', icon: Play, hidden: !isPlaying },
          { id: 'leaderboards', label: 'Leaderboards', icon: Trophy },
          { id: 'multiplayer', label: 'Multiplayer', icon: Users },
          { id: 'achievements', label: 'Achievements', icon: Award }
        ].filter(tab => !tab.hidden).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderGameOverview()}
          </motion.div>
        )}

        {activeTab === 'play' && (
          <motion.div
            key="play"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderGameplay()}
          </motion.div>
        )}

        {activeTab === 'leaderboards' && (
          <motion.div
            key="leaderboards"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                Game Leaderboards
              </h2>
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Game-specific leaderboards
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Select a game to view its leaderboard
                </p>
                <button
                  onClick={() => setActiveTab('overview')}
                  className="btn-primary"
                >
                  Browse Games
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'multiplayer' && (
          <motion.div
            key="multiplayer"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Users className="h-6 w-6 text-green-500" />
                Multiplayer Lobbies
              </h2>
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Multiplayer Coming Soon!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Play with friends in real-time multiplayer games
                </p>
                <button
                  onClick={() => toast.info('Multiplayer feature coming soon!')}
                  className="btn-primary"
                >
                  Create Lobby
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'achievements' && (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Award className="h-6 w-6 text-purple-500" />
                Game Achievements
              </h2>
              <div className="text-center py-12">
                <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Achievements System
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Unlock achievements by playing games and improving your skills
                </p>
                <button
                  onClick={() => setActiveTab('overview')}
                  className="btn-primary"
                >
                  Start Playing
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Games;