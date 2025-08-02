import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Medal, 
  Award, 
  Crown, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  Brain, 
  BookOpen, 
  Gamepad2, 
  Heart, 
  Zap, 
  Star, 
  Fire, 
  Shield, 
  Sword, 
  ChevronRight, 
  ChevronLeft, 
  MoreHorizontal, 
  Filter, 
  Search, 
  Calendar, 
  Globe, 
  UserCheck, 
  School, 
  Bookmark, 
  Play, 
  Pause, 
  RotateCcw, 
  Share2, 
  MessageCircle, 
  ThumbsUp, 
  Plus,
  Eye,
  EyeOff,
  Settings,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Layers,
  Hash,
  Percent,
  Timer,
  Flame,
  Sparkles,
  Rocket,
  Diamond,
  Gem
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';
import toast from 'react-hot-toast';

interface LeaderboardEntry {
  rank: number;
  userId: number;
  firstName: string;
  lastName: string;
  username: string;
  avatar: string;
  score: number;
  previousRank?: number;
  previousScore?: number;
  personalBest: boolean;
  streakCount: number;
  trendData: any[];
  lastActivity: string;
  isPremium: boolean;
}

interface Leaderboard {
  id: number;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  scope: string;
  timeframe: string;
  metricType: string;
  maxDisplayRank: number;
  showScores: boolean;
  showProgress: boolean;
  showTrends: boolean;
  rewardsEnabled: boolean;
  badgeSystem: any;
  isActive: boolean;
  isVisible: boolean;
  lastUpdated: string;
}

interface PersonalStats {
  totalLeaderboards: number;
  topTenCount: number;
  personalBests: number;
  averagePercentile: number;
  userEntries: any[];
  recentAchievements: any[];
  insights: {
    strengths: string[];
    improvementAreas: string[];
    trends: string[];
    recommendations: string[];
  };
}

interface FriendComparison {
  leaderboard: Leaderboard;
  entries: LeaderboardEntry[];
  userRank: number | null;
}

const CATEGORY_ICONS = {
  study_metrics: Clock,
  academic_performance: Brain,
  content_creation: BookOpen,
  collaboration: Users,
  engagement: Zap,
  game_speed_math: Hash,
  game_vocabulary_vault: BookOpen,
  game_science_lab: Activity,
  game_history_timeline: Calendar,
  game_geography_quest: Globe,
  game_code_breaker: Layers,
  game_literary_detective: BookOpen,
  game_chemistry_mixer: Activity,
  game_economics_empire: TrendingUp,
  game_physics_playground: Zap
};

const RANK_COLORS = {
  1: 'text-yellow-500',
  2: 'text-gray-400',
  3: 'text-orange-400'
};

const TREND_ICONS = {
  up: TrendingUp,
  down: TrendingDown,
  same: MoreHorizontal,
  new: Star
};

const Leaderboards: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedScope, setSelectedScope] = useState('global');
  const [selectedTimeframe, setSelectedTimeframe] = useState('all_time');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([]);
  const [currentLeaderboard, setCurrentLeaderboard] = useState<Leaderboard | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userPosition, setUserPosition] = useState<LeaderboardEntry | null>(null);
  const [personalStats, setPersonalStats] = useState<PersonalStats | null>(null);
  const [friendComparisons, setFriendComparisons] = useState<FriendComparison[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  
  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);

  useEffect(() => {
    fetchLeaderboardsData();
    fetchPersonalDashboard();
  }, []);

  useEffect(() => {
    if (selectedCategory !== 'all' || selectedScope !== 'global' || selectedTimeframe !== 'all_time') {
      fetchFilteredLeaderboards();
    }
  }, [selectedCategory, selectedScope, selectedTimeframe]);

  const fetchLeaderboardsData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/leaderboards', {
        params: {
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          scope: selectedScope,
          timeframe: selectedTimeframe === 'all_time' ? undefined : selectedTimeframe
        }
      });
      
      setLeaderboards(response.data.data.leaderboards);
      
      if (response.data.data.leaderboards.length > 0) {
        await fetchLeaderboardDetails(response.data.data.leaderboards[0].id);
      }
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
      toast.error('Failed to load leaderboards');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredLeaderboards = async () => {
    try {
      setRefreshing(true);
      await fetchLeaderboardsData();
    } finally {
      setRefreshing(false);
    }
  };

  const fetchLeaderboardDetails = async (leaderboardId: number) => {
    try {
      const response = await axios.get(`/api/leaderboards/${leaderboardId}`, {
        params: {
          limit: 50,
          showTrends: true,
          includeMe: true
        }
      });
      
      setCurrentLeaderboard(response.data.data.leaderboard);
      setEntries(response.data.data.entries);
      setUserPosition(response.data.data.userPosition);
    } catch (error) {
      console.error('Error fetching leaderboard details:', error);
      toast.error('Failed to load leaderboard details');
    }
  };

  const fetchPersonalDashboard = async () => {
    try {
      const response = await axios.get('/api/leaderboards/dashboard/personal');
      setPersonalStats(response.data.data);
    } catch (error) {
      console.error('Error fetching personal dashboard:', error);
    }
  };

  const fetchFriendComparisons = async () => {
    try {
      const response = await axios.get('/api/leaderboards/friends/comparison', {
        params: {
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          timeframe: selectedTimeframe === 'all_time' ? undefined : selectedTimeframe
        }
      });
      setFriendComparisons(response.data.data.comparison);
    } catch (error) {
      console.error('Error fetching friend comparisons:', error);
    }
  };

  const fetchActiveChallenges = async () => {
    try {
      const response = await axios.get('/api/leaderboards/challenges/active', {
        params: {
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          limit: 10
        }
      });
      setChallenges(response.data.data);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    }
  };

  const createCustomLeaderboard = async (leaderboardData: any) => {
    try {
      await axios.post('/api/leaderboards/custom', leaderboardData);
      toast.success('Custom leaderboard created!');
      await fetchLeaderboardsData();
    } catch (error) {
      console.error('Error creating leaderboard:', error);
      toast.error('Failed to create leaderboard');
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-400" />;
      default:
        return <span className="text-lg font-bold text-gray-600 dark:text-gray-400">#{rank}</span>;
    }
  };

  const getTrendIcon = (entry: LeaderboardEntry) => {
    if (!entry.previousRank) return <Star className="h-4 w-4 text-blue-500" />;
    
    if (entry.rank < entry.previousRank) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (entry.rank > entry.previousRank) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    } else {
      return <MoreHorizontal className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatScore = (score: number, metricType: string) => {
    switch (metricType) {
      case 'time':
        return `${Math.floor(score / 60)}h ${score % 60}m`;
      case 'percentage':
        return `${score.toFixed(1)}%`;
      case 'gpa':
        return score.toFixed(2);
      default:
        return score.toLocaleString();
    }
  };

  const getStreakDisplay = (streakCount: number) => {
    if (streakCount >= 30) {
      return <Flame className="h-4 w-4 text-orange-500" />;
    } else if (streakCount >= 7) {
      return <Fire className="h-4 w-4 text-red-500" />;
    } else if (streakCount >= 3) {
      return <Zap className="h-4 w-4 text-yellow-500" />;
    }
    return null;
  };

  const renderOverview = () => {
    if (!personalStats) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <Trophy className="h-8 w-8" />
              <span className="text-2xl font-bold">{personalStats.topTenCount}</span>
            </div>
            <h3 className="font-semibold mb-1">Top 10 Positions</h3>
            <p className="text-sm opacity-90">Across all leaderboards</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <Target className="h-8 w-8" />
              <span className="text-2xl font-bold">{personalStats.personalBests}</span>
            </div>
            <h3 className="font-semibold mb-1">Personal Bests</h3>
            <p className="text-sm opacity-90">New records achieved</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="h-8 w-8" />
              <span className="text-2xl font-bold">{Math.round(personalStats.averagePercentile)}%</span>
            </div>
            <h3 className="font-semibold mb-1">Average Percentile</h3>
            <p className="text-sm opacity-90">Performance ranking</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <Layers className="h-8 w-8" />
              <span className="text-2xl font-bold">{personalStats.totalLeaderboards}</span>
            </div>
            <h3 className="font-semibold mb-1">Active Boards</h3>
            <p className="text-sm opacity-90">Participating in</p>
          </motion.div>
        </div>

        {/* Recent Achievements */}
        {personalStats.recentAchievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-500" />
              Recent Achievements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personalStats.recentAchievements.slice(0, 6).map((achievement, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                >
                  <div className="text-2xl">
                    {achievement.achievementRarity === 'legendary' && '💎'}
                    {achievement.achievementRarity === 'epic' && '🏆'}
                    {achievement.achievementRarity === 'rare' && '⭐'}
                    {achievement.achievementRarity === 'uncommon' && '🎖️'}
                    {achievement.achievementRarity === 'common' && '🏅'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {achievement.achievementName}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      +{achievement.pointsReward} points
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Performance Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-500" />
            Performance Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Strengths
              </h4>
              <ul className="space-y-2">
                {personalStats.insights.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-500" />
                Growth Areas
              </h4>
              <ul className="space-y-2">
                {personalStats.insights.improvementAreas.map((area, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-orange-500 mt-1 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Top Leaderboard Positions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Your Top Positions
            </h3>
            <button
              onClick={() => setActiveTab('all')}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1"
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {personalStats.userEntries.slice(0, 5).map((entry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                onClick={() => {
                  setActiveTab('all');
                  fetchLeaderboardDetails(entry.leaderboardId);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getRankIcon(entry.rank)}
                    {entry.personalBest && <Gem className="h-4 w-4 text-purple-500" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {entry.leaderboardName}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {entry.category} • {entry.timeframe.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatScore(entry.score, 'number')}
                    </span>
                    {getTrendIcon({ rank: entry.rank, previousRank: entry.previousRank } as LeaderboardEntry)}
                  </div>
                  <p className="text-xs text-gray-500">
                    {Math.round(entry.percentile)}th percentile
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  };

  const renderLeaderboardGrid = () => {
    const filteredLeaderboards = leaderboards.filter(board => 
      searchTerm === '' || 
      board.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      board.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                <option value="study_metrics">Study Metrics</option>
                <option value="academic_performance">Academic Performance</option>
                <option value="content_creation">Content Creation</option>
                <option value="collaboration">Collaboration</option>
                <option value="engagement">Engagement</option>
                <option value="game_speed_math">Speed Math</option>
                <option value="game_vocabulary_vault">Vocabulary</option>
                <option value="game_science_lab">Science Lab</option>
              </select>
              
              <select
                value={selectedScope}
                onChange={(e) => setSelectedScope(e.target.value)}
                className="input text-sm"
              >
                <option value="global">Global</option>
                <option value="friends">Friends</option>
                <option value="school">School</option>
                <option value="class">Class</option>
              </select>
              
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="input text-sm"
              >
                <option value="all_time">All Time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search leaderboards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 text-sm w-64"
                />
              </div>
              <button
                onClick={fetchLeaderboardsData}
                disabled={refreshing}
                className="btn-secondary p-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Leaderboards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredLeaderboards.map((board, index) => {
            const IconComponent = CATEGORY_ICONS[board.category] || Trophy;
            
            return (
              <motion.div
                key={board.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden group"
                onClick={() => {
                  setCurrentLeaderboard(board);
                  fetchLeaderboardDetails(board.id);
                  setActiveTab('details');
                }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {board.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {board.category.replace('_', ' ')} • {board.timeframe.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      board.scope === 'global' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                      board.scope === 'friends' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      board.scope === 'school' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                      {board.scope}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {board.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {board.maxDisplayRank} max
                      </span>
                      {board.rewardsEnabled && (
                        <span className="flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          Rewards
                        </span>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredLeaderboards.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No leaderboards found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try adjusting your filters or search terms
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedScope('global');
                setSelectedTimeframe('all_time');
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

  const renderLeaderboardDetails = () => {
    if (!currentLeaderboard || !entries.length) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    const IconComponent = CATEGORY_ICONS[currentLeaderboard.category] || Trophy;

    return (
      <div className="space-y-6">
        {/* Leaderboard Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <IconComponent className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{currentLeaderboard.name}</h1>
                <p className="text-blue-100">{currentLeaderboard.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{entries.length}</div>
              <div className="text-sm text-blue-100">Participants</div>
            </div>
          </div>
          
          <div className="flex gap-6 text-sm">
            <span className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              {currentLeaderboard.scope}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {currentLeaderboard.timeframe.replace('_', ' ')}
            </span>
            <span className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              {currentLeaderboard.metricType}
            </span>
          </div>
        </motion.div>

        {/* User Position */}
        {userPosition && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Your Position
            </h3>
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {getRankIcon(userPosition.rank)}
                  {userPosition.personalBest && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 rounded-full text-xs font-medium">
                      <Gem className="h-3 w-3" />
                      Personal Best
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {userPosition.firstName} {userPosition.lastName}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Score: {formatScore(userPosition.score, currentLeaderboard.metricType)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {getTrendIcon(userPosition)}
                {userPosition.streakCount > 0 && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {getStreakDisplay(userPosition.streakCount)}
                    {userPosition.streakCount} streak
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Top 3 Podium */}
        {entries.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 text-center">
              🏆 Top Performers 🏆
            </h3>
            <div className="flex justify-center items-end gap-4 mb-8">
              {/* Second Place */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-2" style={{ height: '120px' }}>
                  <div className="flex flex-col items-center justify-end h-full">
                    <Medal className="h-8 w-8 text-gray-400 mb-2" />
                    <div className="text-center">
                      <div className="font-semibold text-sm text-gray-900 dark:text-white">
                        {entries[1].firstName} {entries[1].lastName}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {formatScore(entries[1].score, currentLeaderboard.metricType)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-600">#2</div>
              </motion.div>

              {/* First Place */}
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <div className="bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-lg p-4 mb-2" style={{ height: '150px' }}>
                  <div className="flex flex-col items-center justify-end h-full">
                    <Crown className="h-10 w-10 text-yellow-700 mb-2" />
                    <div className="text-center">
                      <div className="font-bold text-gray-900">
                        {entries[0].firstName} {entries[0].lastName}
                      </div>
                      <div className="text-sm text-gray-700">
                        {formatScore(entries[0].score, currentLeaderboard.metricType)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-yellow-600">#1</div>
              </motion.div>

              {/* Third Place */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-4 mb-2" style={{ height: '100px' }}>
                  <div className="flex flex-col items-center justify-end h-full">
                    <Award className="h-7 w-7 text-orange-500 mb-2" />
                    <div className="text-center">
                      <div className="font-semibold text-sm text-gray-900 dark:text-white">
                        {entries[2].firstName} {entries[2].lastName}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {formatScore(entries[2].score, currentLeaderboard.metricType)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-orange-600">#3</div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Full Rankings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Full Rankings
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {entries.map((entry, index) => (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  entry.userId === user?.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-16">
                      {getRankIcon(entry.rank)}
                      {entry.personalBest && <Gem className="h-4 w-4 text-purple-500" />}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {entry.avatar ? (
                        <img
                          src={entry.avatar}
                          alt={`${entry.firstName} ${entry.lastName}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {entry.firstName.charAt(0)}{entry.lastName.charAt(0)}
                          </span>
                        </div>
                      )}
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {entry.firstName} {entry.lastName}
                          </h4>
                          {entry.isPremium && <Crown className="h-4 w-4 text-yellow-500" />}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          @{entry.username}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {formatScore(entry.score, currentLeaderboard.metricType)}
                      </div>
                      {entry.previousScore && (
                        <div className="text-xs text-gray-500">
                          Was: {formatScore(entry.previousScore, currentLeaderboard.metricType)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getTrendIcon(entry)}
                      {entry.streakCount > 0 && getStreakDisplay(entry.streakCount)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Back to All Leaderboards */}
        <div className="text-center">
          <button
            onClick={() => setActiveTab('all')}
            className="btn-secondary"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to All Leaderboards
          </button>
        </div>
      </div>
    );
  };

  const renderFriendComparisons = () => {
    useEffect(() => {
      if (activeTab === 'friends') {
        fetchFriendComparisons();
      }
    }, [activeTab]);

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Users className="h-6 w-6 text-green-500" />
            Friend Comparisons
          </h2>
          
          {friendComparisons.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Add friends to see comparisons!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Connect with classmates to compare your progress
              </p>
              <button className="btn-primary">
                Find Friends
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {friendComparisons.map((comparison, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    {comparison.leaderboard.name}
                  </h3>
                  <div className="space-y-3">
                    {comparison.entries.map((entry, entryIndex) => (
                      <div
                        key={entry.userId}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          entry.userId === user?.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-700 dark:text-gray-300 w-8">
                            #{entry.rank}
                          </span>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {entry.firstName} {entry.lastName}
                              {entry.userId === user?.id && <span className="text-blue-600 ml-1">(You)</span>}
                            </h4>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {formatScore(entry.score, comparison.leaderboard.metricType)}
                          </span>
                          {getTrendIcon(entry)}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
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
          <Trophy className="h-8 w-8 text-yellow-500" />
          Leaderboards
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Compete with friends and track your academic progress
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-8">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'all', label: 'All Leaderboards', icon: Trophy },
          { id: 'details', label: 'Details', icon: Target, hidden: !currentLeaderboard },
          { id: 'friends', label: 'Friends', icon: Users },
          { id: 'challenges', label: 'Challenges', icon: Zap }
        ].filter(tab => !tab.hidden).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
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
            {renderOverview()}
          </motion.div>
        )}

        {activeTab === 'all' && (
          <motion.div
            key="all"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderLeaderboardGrid()}
          </motion.div>
        )}

        {activeTab === 'details' && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderLeaderboardDetails()}
          </motion.div>
        )}

        {activeTab === 'friends' && (
          <motion.div
            key="friends"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderFriendComparisons()}
          </motion.div>
        )}

        {activeTab === 'challenges' && (
          <motion.div
            key="challenges"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Zap className="h-6 w-6 text-yellow-500" />
                Active Challenges
              </h2>
              <div className="text-center py-12">
                <Rocket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Challenges Coming Soon!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create and participate in competitive challenges with your peers
                </p>
                <button
                  onClick={() => toast.info('Challenges feature coming soon!')}
                  className="btn-primary"
                >
                  Create Challenge
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Leaderboards;