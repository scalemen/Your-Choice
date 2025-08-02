import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Target, 
  Settings, 
  TrendingUp, 
  Award, 
  BookOpen, 
  Clock, 
  Lightbulb,
  User,
  Zap,
  BarChart3,
  Calendar,
  Heart,
  Eye,
  Headphones,
  Hand,
  FileText,
  Star,
  Trophy,
  Users,
  Timer,
  CheckCircle,
  X,
  ChevronRight,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';
import toast from 'react-hot-toast';

interface LearningStyle {
  visual: number;
  auditory: number;
  kinesthetic: number;
  reading: number;
}

interface PersonalityTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

interface Recommendation {
  id: number;
  type: string;
  category: string;
  title: string;
  description: string;
  actionableSteps: string[];
  priority: string;
  confidenceScore: number;
  expectedImpact: string;
  status: string;
  createdAt: string;
}

interface PersonalizationProfile {
  id: number;
  learningStyleVisual: number;
  learningStyleAuditory: number;
  learningStyleKinesthetic: number;
  learningStyleReading: number;
  personalityOpenness: number;
  personalityConscientiousness: number;
  personalityExtraversion: number;
  personalityAgreeableness: number;
  personalityNeuroticism: number;
  preferredStudyTime: string;
  preferredSessionLength: number;
  preferredBreakLength: number;
  motivationType: string;
  tutorPersonality: string;
  tutorFormality: string;
  feedbackStyle: string;
  fontSizeMultiplier: number;
  highContrast: boolean;
  reducedMotion: boolean;
  notificationsEnabled: boolean;
  studyReminders: boolean;
  achievementNotifications: boolean;
  profileVisibility: string;
}

const LEARNING_STYLE_QUESTIONS = [
  {
    id: 1,
    question: "When learning something new, I prefer to:",
    options: [
      { text: "See diagrams, charts, or visual aids", style: "visual", weight: 5 },
      { text: "Listen to explanations or discussions", style: "auditory", weight: 5 },
      { text: "Practice hands-on activities", style: "kinesthetic", weight: 5 },
      { text: "Read detailed written instructions", style: "reading", weight: 5 }
    ]
  },
  {
    id: 2,
    question: "I remember information best when:",
    options: [
      { text: "I can see it in my mind as a picture", style: "visual", weight: 4 },
      { text: "I can hear it explained or discussed", style: "auditory", weight: 4 },
      { text: "I can physically practice or do it", style: "kinesthetic", weight: 4 },
      { text: "I can read and write about it", style: "reading", weight: 4 }
    ]
  },
  {
    id: 3,
    question: "When giving directions, I would:",
    options: [
      { text: "Draw a map or diagram", style: "visual", weight: 3 },
      { text: "Give verbal directions", style: "auditory", weight: 3 },
      { text: "Walk them through the route", style: "kinesthetic", weight: 3 },
      { text: "Write down step-by-step directions", style: "reading", weight: 3 }
    ]
  },
  {
    id: 4,
    question: "I prefer teachers who:",
    options: [
      { text: "Use lots of visual aids and demonstrations", style: "visual", weight: 4 },
      { text: "Explain things clearly and encourage discussion", style: "auditory", weight: 4 },
      { text: "Provide hands-on activities and experiments", style: "kinesthetic", weight: 4 },
      { text: "Assign reading and writing exercises", style: "reading", weight: 4 }
    ]
  },
  {
    id: 5,
    question: "When I'm concentrating, I:",
    options: [
      { text: "Focus on images and visualizations", style: "visual", weight: 3 },
      { text: "Prefer quiet or background music", style: "auditory", weight: 3 },
      { text: "Need to move around or fidget", style: "kinesthetic", weight: 3 },
      { text: "Like to have notes and text to refer to", style: "reading", weight: 3 }
    ]
  }
];

const PERSONALITY_QUESTIONS = [
  {
    trait: "openness",
    questions: [
      { text: "I enjoy exploring new ideas and concepts", reverse: false },
      { text: "I prefer familiar routines over new experiences", reverse: true },
      { text: "I'm curious about how things work", reverse: false }
    ]
  },
  {
    trait: "conscientiousness", 
    questions: [
      { text: "I always complete my assignments on time", reverse: false },
      { text: "I often procrastinate on important tasks", reverse: true },
      { text: "I like to plan my study schedule in advance", reverse: false }
    ]
  },
  {
    trait: "extraversion",
    questions: [
      { text: "I enjoy studying in groups", reverse: false },
      { text: "I prefer to work alone most of the time", reverse: true },
      { text: "I'm comfortable asking questions in class", reverse: false }
    ]
  },
  {
    trait: "agreeableness",
    questions: [
      { text: "I enjoy helping classmates with their studies", reverse: false },
      { text: "I prefer to focus on my own work", reverse: true },
      { text: "I work well in collaborative projects", reverse: false }
    ]
  },
  {
    trait: "neuroticism",
    questions: [
      { text: "I often worry about upcoming exams", reverse: false },
      { text: "I stay calm under academic pressure", reverse: true },
      { text: "I get anxious when facing new challenges", reverse: false }
    ]
  }
];

const Personalization: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState<PersonalizationProfile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Assessment states
  const [learningStyleStep, setLearningStyleStep] = useState(0);
  const [learningStyleAnswers, setLearningStyleAnswers] = useState<any[]>([]);
  const [personalityStep, setPersonalityStep] = useState(0);
  const [personalityAnswers, setPersonalityAnswers] = useState<any[]>([]);
  const [showingResults, setShowingResults] = useState(false);
  
  // Settings states
  const [settings, setSettings] = useState<Partial<PersonalizationProfile>>({});
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchPersonalizationData();
  }, []);

  const fetchPersonalizationData = async () => {
    try {
      const [profileRes, recommendationsRes] = await Promise.all([
        axios.get('/api/personalization/profile'),
        axios.get('/api/personalization/recommendations')
      ]);
      
      setProfile(profileRes.data.data.profile);
      setRecommendations(recommendationsRes.data.data);
      setSettings(profileRes.data.data.profile || {});
    } catch (error) {
      console.error('Error fetching personalization data:', error);
      toast.error('Failed to load personalization data');
    } finally {
      setLoading(false);
    }
  };

  const submitLearningStyleAssessment = async () => {
    try {
      const answers = learningStyleAnswers.map((answer, index) => ({
        questionId: index + 1,
        response: answer.weight
      }));

      const response = await axios.post('/api/personalization/assessment/learning-style', {
        answers
      });

      toast.success('Learning style assessment completed!');
      setShowingResults(true);
      
      // Refresh profile data
      await fetchPersonalizationData();
    } catch (error) {
      console.error('Error submitting learning style assessment:', error);
      toast.error('Failed to submit assessment');
    }
  };

  const submitPersonalityAssessment = async () => {
    try {
      const traitScores = personalityAnswers.reduce((acc, answer) => {
        if (!acc[answer.trait]) acc[answer.trait] = [];
        acc[answer.trait].push(answer.score);
        return acc;
      }, {});

      const answers = Object.entries(traitScores).map(([trait, scores]: [string, number[]]) => ({
        trait,
        score: (scores.reduce((sum, score) => sum + score, 0) / scores.length / 5).toFixed(2)
      }));

      await axios.post('/api/personalization/assessment/personality', { answers });
      
      toast.success('Personality assessment completed!');
      setShowingResults(true);
      
      // Refresh profile data
      await fetchPersonalizationData();
    } catch (error) {
      console.error('Error submitting personality assessment:', error);
      toast.error('Failed to submit assessment');
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await axios.put('/api/personalization/profile', settings);
      toast.success('Settings saved successfully!');
      setProfile({ ...profile, ...settings } as PersonalizationProfile);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const updateRecommendationStatus = async (id: number, status: string, feedback?: number, comments?: string) => {
    try {
      await axios.put(`/api/personalization/recommendations/${id}/status`, {
        status,
        feedback,
        comments
      });
      
      toast.success('Recommendation updated!');
      await fetchPersonalizationData();
    } catch (error) {
      console.error('Error updating recommendation:', error);
      toast.error('Failed to update recommendation');
    }
  };

  const generateAIStudyPlan = async () => {
    try {
      const response = await axios.post('/api/personalization/recommendations/study-plan', {
        goals: ['Improve grades', 'Better time management'],
        timeframe: 'month',
        subjects: ['Mathematics', 'Science', 'English'],
        currentWorkload: 6
      });
      
      toast.success('AI study plan generated!');
      await fetchPersonalizationData();
    } catch (error) {
      console.error('Error generating study plan:', error);
      toast.error('Failed to generate study plan');
    }
  };

  const renderLearningStyleAssessment = () => {
    if (learningStyleStep >= LEARNING_STYLE_QUESTIONS.length) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8"
        >
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Assessment Complete!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You've answered all questions. Click submit to get your learning style results.
          </p>
          <button
            onClick={submitLearningStyleAssessment}
            className="btn-primary"
          >
            Submit Assessment
          </button>
        </motion.div>
      );
    }

    const question = LEARNING_STYLE_QUESTIONS[learningStyleStep];

    return (
      <motion.div
        key={learningStyleStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="max-w-2xl mx-auto"
      >
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">
              Question {learningStyleStep + 1} of {LEARNING_STYLE_QUESTIONS.length}
            </span>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((learningStyleStep + 1) / LEARNING_STYLE_QUESTIONS.length) * 100}%` }}
              />
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {question.question}
          </h3>
        </div>

        <div className="space-y-3">
          {question.options.map((option, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const newAnswers = [...learningStyleAnswers];
                newAnswers[learningStyleStep] = option;
                setLearningStyleAnswers(newAnswers);
                setTimeout(() => setLearningStyleStep(learningStyleStep + 1), 300);
              }}
              className="w-full p-4 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
            >
              {option.text}
            </motion.button>
          ))}
        </div>

        {learningStyleStep > 0 && (
          <button
            onClick={() => setLearningStyleStep(learningStyleStep - 1)}
            className="mt-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Previous Question
          </button>
        )}
      </motion.div>
    );
  };

  const renderPersonalityAssessment = () => {
    const totalQuestions = PERSONALITY_QUESTIONS.reduce((total, trait) => total + trait.questions.length, 0);
    
    if (personalityStep >= totalQuestions) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8"
        >
          <Brain className="h-16 w-16 text-purple-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Personality Assessment Complete!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You've completed the Big Five personality assessment. Click submit to get your results.
          </p>
          <button
            onClick={submitPersonalityAssessment}
            className="btn-primary"
          >
            Submit Assessment
          </button>
        </motion.div>
      );
    }

    // Find current question
    let currentQuestionIndex = 0;
    let currentTrait = '';
    let currentQuestion = '';
    
    for (const trait of PERSONALITY_QUESTIONS) {
      for (const question of trait.questions) {
        if (currentQuestionIndex === personalityStep) {
          currentTrait = trait.trait;
          currentQuestion = question.text;
          break;
        }
        currentQuestionIndex++;
      }
      if (currentTrait) break;
    }

    return (
      <motion.div
        key={personalityStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="max-w-2xl mx-auto"
      >
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">
              Question {personalityStep + 1} of {totalQuestions}
            </span>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((personalityStep + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="mb-2">
            <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium capitalize">
              {currentTrait}
            </span>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {currentQuestion}
          </h3>
        </div>

        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((score) => (
            <motion.button
              key={score}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const newAnswers = [...personalityAnswers];
                newAnswers[personalityStep] = { trait: currentTrait, score };
                setPersonalityAnswers(newAnswers);
                setTimeout(() => setPersonalityStep(personalityStep + 1), 300);
              }}
              className="w-full p-4 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 flex items-center justify-between"
            >
              <span>
                {score === 1 && "Strongly Disagree"}
                {score === 2 && "Disagree"}
                {score === 3 && "Neutral"}
                {score === 4 && "Agree"}
                {score === 5 && "Strongly Agree"}
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star}
                    className={`h-4 w-4 ${star <= score ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            </motion.button>
          ))}
        </div>

        {personalityStep > 0 && (
          <button
            onClick={() => setPersonalityStep(personalityStep - 1)}
            className="mt-6 text-purple-600 hover:text-purple-800 flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Previous Question
          </button>
        )}
      </motion.div>
    );
  };

  const renderOverview = () => {
    if (!profile) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Welcome card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white"
          >
            <h2 className="text-3xl font-bold mb-4">Welcome to Your Learning Journey!</h2>
            <p className="text-blue-100 mb-6">
              Personalize your StudyGenius experience with AI-powered recommendations and customized learning paths.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('assessments')}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Take Assessment
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Customize Settings
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    const learningStyle = {
      visual: profile.learningStyleVisual,
      auditory: profile.learningStyleAuditory,
      kinesthetic: profile.learningStyleKinesthetic,
      reading: profile.learningStyleReading
    };

    const primaryStyle = Object.entries(learningStyle).reduce((a, b) => 
      learningStyle[a[0]] > learningStyle[b[0]] ? a : b
    )[0];

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              {primaryStyle === 'visual' && <Eye className="h-8 w-8 text-blue-500" />}
              {primaryStyle === 'auditory' && <Headphones className="h-8 w-8 text-green-500" />}
              {primaryStyle === 'kinesthetic' && <Hand className="h-8 w-8 text-orange-500" />}
              {primaryStyle === 'reading' && <FileText className="h-8 w-8 text-purple-500" />}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Learning Style</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{primaryStyle}</p>
              </div>
            </div>
            <div className="space-y-2">
              {Object.entries(learningStyle).map(([style, score]) => (
                <div key={style} className="flex justify-between items-center">
                  <span className="text-sm capitalize text-gray-600 dark:text-gray-400">{style}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(score || 0) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{Math.round((score || 0) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-8 w-8 text-purple-500" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Study Preferences</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Optimal timing</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Best Time:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white capitalize">
                  {profile.preferredStudyTime}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Session Length:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {profile.preferredSessionLength} min
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Break Length:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {profile.preferredBreakLength} min
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <Zap className="h-8 w-8 text-yellow-500" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Motivation</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">What drives you</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white capitalize">
                  {profile.motivationType}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">AI Tutor Style:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white capitalize">
                  {profile.tutorPersonality}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-8 w-8 text-red-500" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Recommendations</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">AI suggestions</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
                <span className="font-medium text-orange-600">
                  {recommendations.filter(r => r.status === 'pending').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                <span className="font-medium text-green-600">
                  {recommendations.filter(r => r.status === 'completed').length}
                </span>
              </div>
              <button
                onClick={generateAIStudyPlan}
                className="w-full mt-3 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                Generate New Plan
              </button>
            </div>
          </motion.div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              AI Recommendations
            </h3>
            <div className="space-y-4">
              {recommendations.slice(0, 3).map((rec) => (
                <div key={rec.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{rec.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{rec.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>
                  
                  {rec.actionableSteps.length > 0 && (
                    <div className="mb-3">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Action Steps:</h5>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {rec.actionableSteps.slice(0, 2).map((step, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateRecommendationStatus(rec.id, 'accepted')}
                      className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => updateRecommendationStatus(rec.id, 'dismissed')}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {recommendations.length > 3 && (
              <button
                onClick={() => setActiveTab('recommendations')}
                className="mt-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-2"
              >
                View all recommendations
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Personalization Center
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Customize your learning experience with AI-powered insights and recommendations
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-8">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'assessments', label: 'Assessments', icon: Brain },
          { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
          { id: 'settings', label: 'Settings', icon: Settings }
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
            {renderOverview()}
          </motion.div>
        )}

        {activeTab === 'assessments' && (
          <motion.div
            key="assessments"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Learning Style Assessment */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Learning Style Assessment
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Discover how you learn best
                  </p>
                </div>
              </div>
              
              {renderLearningStyleAssessment()}
            </div>

            {/* Personality Assessment */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Personality Assessment
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Understand your learning personality
                  </p>
                </div>
              </div>
              
              {renderPersonalityAssessment()}
            </div>
          </motion.div>
        )}

        {activeTab === 'recommendations' && (
          <motion.div
            key="recommendations"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  AI Recommendations
                </h2>
                <button
                  onClick={generateAIStudyPlan}
                  className="btn-primary"
                >
                  Generate New Plan
                </button>
              </div>
              
              <div className="space-y-6">
                {recommendations.map((rec) => (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {rec.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {rec.description}
                        </p>
                        <div className="flex gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            {rec.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            {rec.expectedImpact} impact
                          </span>
                          <span className="flex items-center gap-1">
                            <Award className="h-4 w-4" />
                            {Math.round(rec.confidenceScore * 100)}% confidence
                          </span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {rec.priority} priority
                      </span>
                    </div>
                    
                    {rec.actionableSteps.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          Action Steps:
                        </h4>
                        <ul className="space-y-2">
                          {rec.actionableSteps.map((step, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium flex items-center justify-center">
                                {index + 1}
                              </span>
                              <span className="text-gray-700 dark:text-gray-300">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => updateRecommendationStatus(rec.id, 'accepted')}
                        className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                      >
                        Accept & Start
                      </button>
                      <button
                        onClick={() => updateRecommendationStatus(rec.id, 'completed')}
                        className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        Mark Complete
                      </button>
                      <button
                        onClick={() => updateRecommendationStatus(rec.id, 'dismissed')}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </motion.div>
                ))}
                
                {recommendations.length === 0 && (
                  <div className="text-center py-12">
                    <Lightbulb className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No recommendations yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Complete the assessments to get personalized AI recommendations
                    </p>
                    <button
                      onClick={() => setActiveTab('assessments')}
                      className="btn-primary"
                    >
                      Take Assessments
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Personalization Settings
              </h2>
              
              <div className="space-y-8">
                {/* Study Preferences */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Study Preferences
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Preferred Study Time
                      </label>
                      <select
                        value={settings.preferredStudyTime || 'morning'}
                        onChange={(e) => setSettings({ ...settings, preferredStudyTime: e.target.value })}
                        className="input"
                      >
                        <option value="morning">Morning</option>
                        <option value="afternoon">Afternoon</option>
                        <option value="evening">Evening</option>
                        <option value="night">Night</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Session Length (minutes)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="180"
                        value={settings.preferredSessionLength || 25}
                        onChange={(e) => setSettings({ ...settings, preferredSessionLength: parseInt(e.target.value) })}
                        className="input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Break Length (minutes)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={settings.preferredBreakLength || 5}
                        onChange={(e) => setSettings({ ...settings, preferredBreakLength: parseInt(e.target.value) })}
                        className="input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Motivation Type
                      </label>
                      <select
                        value={settings.motivationType || 'achievement'}
                        onChange={(e) => setSettings({ ...settings, motivationType: e.target.value })}
                        className="input"
                      >
                        <option value="achievement">Achievement</option>
                        <option value="social">Social</option>
                        <option value="mastery">Mastery</option>
                        <option value="curiosity">Curiosity</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* AI Tutor Preferences */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    AI Tutor Preferences
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Personality
                      </label>
                      <select
                        value={settings.tutorPersonality || 'encouraging'}
                        onChange={(e) => setSettings({ ...settings, tutorPersonality: e.target.value })}
                        className="input"
                      >
                        <option value="encouraging">Encouraging</option>
                        <option value="challenging">Challenging</option>
                        <option value="patient">Patient</option>
                        <option value="enthusiastic">Enthusiastic</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Formality
                      </label>
                      <select
                        value={settings.tutorFormality || 'casual'}
                        onChange={(e) => setSettings({ ...settings, tutorFormality: e.target.value })}
                        className="input"
                      >
                        <option value="formal">Formal</option>
                        <option value="casual">Casual</option>
                        <option value="friendly">Friendly</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Feedback Style
                      </label>
                      <select
                        value={settings.feedbackStyle || 'constructive'}
                        onChange={(e) => setSettings({ ...settings, feedbackStyle: e.target.value })}
                        className="input"
                      >
                        <option value="direct">Direct</option>
                        <option value="constructive">Constructive</option>
                        <option value="gentle">Gentle</option>
                        <option value="detailed">Detailed</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Accessibility */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Accessibility
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Font Size Multiplier
                      </label>
                      <input
                        type="range"
                        min="0.8"
                        max="2.0"
                        step="0.1"
                        value={settings.fontSizeMultiplier || 1.0}
                        onChange={(e) => setSettings({ ...settings, fontSizeMultiplier: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                      <span className="text-sm text-gray-500">
                        {Math.round((settings.fontSizeMultiplier || 1.0) * 100)}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={settings.highContrast || false}
                          onChange={(e) => setSettings({ ...settings, highContrast: e.target.checked })}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          High Contrast Mode
                        </span>
                      </label>
                      
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={settings.reducedMotion || false}
                          onChange={(e) => setSettings({ ...settings, reducedMotion: e.target.checked })}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Reduced Motion
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Notifications
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.notificationsEnabled ?? true}
                        onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Enable Notifications
                      </span>
                    </label>
                    
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.studyReminders ?? true}
                        onChange={(e) => setSettings({ ...settings, studyReminders: e.target.checked })}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Study Reminders
                      </span>
                    </label>
                    
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.achievementNotifications ?? true}
                        onChange={(e) => setSettings({ ...settings, achievementNotifications: e.target.checked })}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Achievement Notifications
                      </span>
                    </label>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={saveSettings}
                    disabled={savingSettings}
                    className="btn-primary"
                  >
                    {savingSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Personalization;