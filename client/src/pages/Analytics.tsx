import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  BookOpen,
  Brain,
  Target,
  Award,
  Users,
  Gamepad2,
  Calendar,
  Timer,
  Zap,
  Star,
  Trophy,
  Flame,
  Heart,
  Eye,
  Download,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Settings,
  Share2,
  FileText,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Info,
  Sparkles,
  Rocket,
  Shield,
  Layers,
  Hash,
  Percent,
  DollarSign,
  MapPin,
  School,
  Crown,
  Medal,
  Gem,
  Diamond
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';
import toast from 'react-hot-toast';

interface StudyMetrics {
  totalStudyTime: number;
  averageSessionLength: number;
  studyStreak: number;
  longestStreak: number;
  studySessions: number;
  notesCreated: number;
  quizzesCompleted: number;
  averageQuizScore: number;
  flashcardsReviewed: number;
  gamesPlayed: number;
  averageGameScore: number;
  achievementsUnlocked: number;
  currentLevel: number;
  experiencePoints: number;
}

interface SubjectMetrics {
  subject: string;
  studyTime: number;
  accuracy: number;
  progress: number;
  notesCount: number;
  quizzes: number;
  averageScore: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

interface TimeSeriesData {
  date: string;
  studyTime: number;
  quizScore: number;
  notesCreated: number;
  gamesPlayed: number;
  achievements: number;
}

interface LearningInsight {
  id: string;
  type: 'positive' | 'warning' | 'suggestion' | 'achievement';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionItems: string[];
  timestamp: string;
}

interface GoalProgress {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  progress: number;
  deadline: string;
  status: 'on_track' | 'behind' | 'ahead' | 'completed';
  category: string;
}

interface ComparisonData {
  metric: string;
  yourValue: number;
  classAverage: number;
  schoolAverage: number;
  globalAverage: number;
  percentile: number;
  unit: string;
}

const Analytics: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [studyMetrics, setStudyMetrics] = useState<StudyMetrics | null>(null);
  const [subjectMetrics, setSubjectMetrics] = useState<SubjectMetrics[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [learningInsights, setLearningInsights] = useState<LearningInsight[]>([]);
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [predictions, setPredictions] = useState<any>(null);

  // UI states
  const [selectedMetric, setSelectedMetric] = useState('studyTime');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState('pdf');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [metricsRes, insightsRes, goalsRes, compareRes, predictRes] = await Promise.all([
        axios.get('/api/analytics/metrics', { params: { timeRange } }),
        axios.get('/api/analytics/insights', { params: { timeRange } }),
        axios.get('/api/analytics/goals'),
        axios.get('/api/analytics/comparison', { params: { timeRange } }),
        axios.get('/api/analytics/predictions')
      ]);

      setStudyMetrics(metricsRes.data.data.overview);
      setSubjectMetrics(metricsRes.data.data.subjects);
      setTimeSeriesData(metricsRes.data.data.timeSeries);
      setLearningInsights(insightsRes.data.data.insights);
      setGoalProgress(goalsRes.data.data.goals);
      setComparisonData(compareRes.data.data.comparison);
      setPredictions(predictRes.data.data.predictions);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (format: string) => {
    try {
      const response = await axios.get(`/api/analytics/export`, {
        params: { format, timeRange },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `study-analytics-${timeRange}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(`Analytics exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting analytics:', error);
      toast.error('Failed to export analytics');
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'suggestion':
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
      case 'achievement':
        return <Award className="h-5 w-5 text-purple-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'on_track':
        return 'bg-blue-500';
      case 'ahead':
        return 'bg-purple-500';
      case 'behind':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <MoreHorizontal className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderOverviewTab = () => {
    if (!studyMetrics) return null;

    return (
      <div className="space-y-8">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-8 w-8" />
              <div className="text-right">
                <div className="text-2xl font-bold">{formatTime(studyMetrics.totalStudyTime)}</div>
                <div className="text-sm opacity-90">Total Study Time</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Avg Session: {formatTime(studyMetrics.averageSessionLength)}</span>
              <span>{studyMetrics.studySessions} sessions</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <Flame className="h-8 w-8" />
              <div className="text-right">
                <div className="text-2xl font-bold">{studyMetrics.studyStreak}</div>
                <div className="text-sm opacity-90">Current Streak</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Best: {studyMetrics.longestStreak} days</span>
              <span className="flex items-center gap-1">
                <Fire className="h-3 w-3" />
                Keep going!
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <Target className="h-8 w-8" />
              <div className="text-right">
                <div className="text-2xl font-bold">{formatPercentage(studyMetrics.averageQuizScore)}</div>
                <div className="text-sm opacity-90">Quiz Accuracy</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>{studyMetrics.quizzesCompleted} quizzes</span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Improving
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <Award className="h-8 w-8" />
              <div className="text-right">
                <div className="text-2xl font-bold">{studyMetrics.achievementsUnlocked}</div>
                <div className="text-sm opacity-90">Achievements</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Level {studyMetrics.currentLevel}</span>
              <span>{studyMetrics.experiencePoints.toLocaleString()} XP</span>
            </div>
          </motion.div>
        </div>

        {/* Study Time Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <LineChart className="h-6 w-6 text-blue-500" />
              Study Progress Over Time
            </h2>
            <div className="flex gap-2">
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="input text-sm"
              >
                <option value="studyTime">Study Time</option>
                <option value="quizScore">Quiz Scores</option>
                <option value="notesCreated">Notes Created</option>
                <option value="gamesPlayed">Games Played</option>
              </select>
            </div>
          </div>

          {/* Placeholder for chart - in a real app, you'd use a chart library like Chart.js or D3 */}
          <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <LineChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Interactive chart showing {selectedMetric} trends</p>
              <p className="text-sm text-gray-400 mt-2">Chart integration with Chart.js or similar</p>
            </div>
          </div>
        </motion.div>

        {/* Subject Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-green-500" />
            Subject Performance
          </h2>
          <div className="space-y-4">
            {subjectMetrics.map((subject, index) => (
              <motion.div
                key={subject.subject}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {subject.subject}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatTime(subject.studyTime)} • {subject.notesCount} notes • {subject.quizzes} quizzes
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {formatPercentage(subject.accuracy)}
                    </div>
                    <div className="text-sm text-gray-500">Accuracy</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {formatPercentage(subject.progress)}
                    </div>
                    <div className="text-sm text-gray-500">Progress</div>
                  </div>
                  
                  <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: subject.color,
                        width: `${subject.progress}%`
                      }}
                    />
                  </div>
                  
                  {getTrendIcon(subject.trend)}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Learning Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-500" />
            AI Learning Insights
          </h2>
          <div className="space-y-4">
            {learningInsights.slice(0, 5).map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-shrink-0 mt-1">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {insight.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      insight.impact === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                      insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {insight.impact} impact
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {insight.description}
                  </p>
                  {insight.actionItems.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Recommended Actions:
                      </p>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {insight.actionItems.map((action, actionIndex) => (
                          <li key={actionIndex} className="flex items-start gap-2">
                            <Sparkles className="h-3 w-3 text-purple-500 mt-1 flex-shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  };

  const renderGoalsTab = () => (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="h-6 w-6 text-blue-500" />
            Goal Progress
          </h2>
          <button className="btn-primary flex items-center gap-2">
            <Target className="h-4 w-4" />
            Set New Goal
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goalProgress.map((goal, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {goal.title}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  goal.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  goal.status === 'on_track' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                  goal.status === 'ahead' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {goal.status.replace('_', ' ')}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {goal.description}
              </p>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {goal.current} / {goal.target}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getGoalStatusColor(goal.status)}`}
                    style={{ width: `${Math.min(goal.progress, 100)}%` }}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Deadline: {new Date(goal.deadline).toLocaleDateString()}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatPercentage(goal.progress)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderComparisonTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
    >
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <Users className="h-6 w-6 text-green-500" />
        Performance Comparison
      </h2>
      
      <div className="space-y-6">
        {comparisonData.map((comparison, index) => (
          <motion.div
            key={comparison.metric}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                {comparison.metric.replace('_', ' ')}
              </h3>
              <span className="text-sm text-gray-500">
                {comparison.percentile}th percentile
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  You
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {comparison.yourValue} {comparison.unit}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Class Average
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {comparison.classAverage} {comparison.unit}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  School Average
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {comparison.schoolAverage} {comparison.unit}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Global Average
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {comparison.globalAverage} {comparison.unit}
                </span>
              </div>
            </div>
            
            <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 relative">
                <div
                  className="absolute top-0 h-full w-1 bg-blue-600"
                  style={{ left: `${comparison.percentile}%` }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderPredictionsTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
    >
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <Rocket className="h-6 w-6 text-purple-500" />
        AI Predictions & Recommendations
      </h2>
      
      <div className="text-center py-12">
        <Rocket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          AI Predictions Coming Soon!
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Get personalized predictions about your academic performance and AI-powered study recommendations
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Brain className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h4 className="font-semibold text-gray-900 dark:text-white">Performance Forecasting</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Predict exam scores and identify improvement areas</p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h4 className="font-semibold text-gray-900 dark:text-white">Goal Achievement</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Optimize study plans to reach your goals faster</p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <Lightbulb className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <h4 className="font-semibold text-gray-900 dark:text-white">Smart Recommendations</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Get personalized study and learning suggestions</p>
          </div>
        </div>
      </div>
    </motion.div>
  );

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-500" />
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your learning progress and get insights to improve
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="input text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 3 months</option>
              <option value="1y">Last year</option>
            </select>
            
            <button
              onClick={() => exportData(exportFormat)}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            
            <button
              onClick={() => {
                setRefreshing(true);
                fetchAnalyticsData().finally(() => setRefreshing(false));
              }}
              disabled={refreshing}
              className="btn-secondary p-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-8">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'goals', label: 'Goals', icon: Target },
          { id: 'comparison', label: 'Comparison', icon: Users },
          { id: 'predictions', label: 'AI Insights', icon: Brain }
        ].map((tab) => (
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
            {renderOverviewTab()}
          </motion.div>
        )}

        {activeTab === 'goals' && (
          <motion.div
            key="goals"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderGoalsTab()}
          </motion.div>
        )}

        {activeTab === 'comparison' && (
          <motion.div
            key="comparison"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderComparisonTab()}
          </motion.div>
        )}

        {activeTab === 'predictions' && (
          <motion.div
            key="predictions"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderPredictionsTab()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Analytics;