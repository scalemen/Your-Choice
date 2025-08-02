import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  AcademicCapIcon,
  BeakerIcon,
  CalculatorIcon,
  CodeBracketIcon,
  CommandLineIcon,
  CubeIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  ChartBarIcon,
  MegaphoneIcon,
  PaintBrushIcon,
  UserGroupIcon,
  ClockIcon,
  StarIcon,
  TrophyIcon,
  ShieldCheckIcon,
  PlayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FireIcon,
  BoltIcon,
  EyeIcon,
  ArrowRightIcon,
  SparklesIcon,
  RocketLaunchIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarSolidIcon,
  TrophyIcon as TrophySolidIcon,
  ShieldCheckIcon as ShieldSolidIcon
} from '@heroicons/react/24/solid';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn } from '@/utils/cn';

// Types
interface SkillCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  industry: string;
  skillCount?: number;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  marketDemand: number;
  averageSalaryImpact: number;
  timeToLearn: number;
  certificationAvailable: boolean;
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  duration: number;
  passingScore: number;
  certificationType: string;
  industryRecognition: string;
  questions?: any[];
}

interface UserSkill {
  skill: Skill;
  profile: {
    proficiencyLevel: number;
    assessmentScore: number;
    experienceYears: number;
    certificationsEarned: number;
    marketValue: number;
  };
  category: SkillCategory;
}

const SkillsAssessmentPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'explore' | 'assess' | 'profile' | 'certificates'>('explore');
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null);
  const [assessmentAnswers, setAssessmentAnswers] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const queryClient = useQueryClient();

  // Fetch skill categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['skill-categories'],
    queryFn: async () => {
      const response = await fetch('/api/professional/skills/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      return data.data;
    }
  });

  // Fetch skills for selected category
  const { data: skills = [], isLoading: skillsLoading } = useQuery({
    queryKey: ['skills', selectedCategory],
    queryFn: async () => {
      if (!selectedCategory) return [];
      const response = await fetch(`/api/professional/skills/category/${selectedCategory}`);
      if (!response.ok) throw new Error('Failed to fetch skills');
      const data = await response.json();
      return data.data;
    },
    enabled: !!selectedCategory
  });

  // Fetch assessments for selected skill
  const { data: assessments = [], isLoading: assessmentsLoading } = useQuery({
    queryKey: ['assessments', selectedSkill],
    queryFn: async () => {
      if (!selectedSkill) return [];
      const response = await fetch(`/api/professional/skills/${selectedSkill}/assessments`);
      if (!response.ok) throw new Error('Failed to fetch assessments');
      const data = await response.json();
      return data.data;
    },
    enabled: !!selectedSkill
  });

  // Fetch user skill profile
  const { data: userSkills = [], isLoading: profileLoading } = useQuery({
    queryKey: ['user-skills'],
    queryFn: async () => {
      const response = await fetch('/api/professional/profile/skills');
      if (!response.ok) throw new Error('Failed to fetch user skills');
      const data = await response.json();
      return data.data;
    }
  });

  // Take assessment mutation
  const takeAssessmentMutation = useMutation({
    mutationFn: async ({ assessmentId, answers }: { assessmentId: string; answers: any[] }) => {
      const response = await fetch(`/api/professional/assessments/${assessmentId}/take`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });
      if (!response.ok) throw new Error('Failed to submit assessment');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.data.passed ? '🎉 Assessment passed!' : 'Assessment completed');
      setCurrentAssessment(null);
      setAssessmentAnswers([]);
      setCurrentQuestion(0);
      queryClient.invalidateQueries({ queryKey: ['user-skills'] });
    },
    onError: () => {
      toast.error('Failed to submit assessment');
    }
  });

  // Category icon mapping
  const getCategoryIcon = (iconName: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      'academic': AcademicCapIcon,
      'beaker': BeakerIcon,
      'calculator': CalculatorIcon,
      'code': CodeBracketIcon,
      'command': CommandLineIcon,
      'cube': CubeIcon,
      'document': DocumentTextIcon,
      'globe': GlobeAltIcon,
      'chart': ChartBarIcon,
      'megaphone': MegaphoneIcon,
      'paint': PaintBrushIcon,
      'users': UserGroupIcon
    };
    return icons[iconName] || CubeIcon;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      'beginner': 'text-green-600 bg-green-50 border-green-200',
      'intermediate': 'text-yellow-600 bg-yellow-50 border-yellow-200',
      'advanced': 'text-orange-600 bg-orange-50 border-orange-200',
      'expert': 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[difficulty as keyof typeof colors] || colors.intermediate;
  };

  const startAssessment = (assessment: Assessment) => {
    setCurrentAssessment(assessment);
    setAssessmentAnswers([]);
    setCurrentQuestion(0);
    setTimeRemaining(assessment.duration * 60); // Convert to seconds
  };

  const submitAssessment = () => {
    if (currentAssessment) {
      takeAssessmentMutation.mutate({
        assessmentId: currentAssessment.id,
        answers: assessmentAnswers
      });
    }
  };

  // Timer effect
  useEffect(() => {
    if (timeRemaining && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev && prev <= 1) {
            submitAssessment();
            return null;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (categoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Skills Assessment - StudyGenius</title>
        <meta name="description" content="Assess your skills, earn certifications, and track your professional development with StudyGenius." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
        {/* Assessment Modal */}
        <AnimatePresence>
          {currentAssessment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              >
                {/* Assessment Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">{currentAssessment.title}</h2>
                      <p className="text-blue-100 mt-1">{currentAssessment.description}</p>
                    </div>
                    {timeRemaining && (
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="h-5 w-5" />
                          <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-blue-100 mb-2">
                      <span>Question {currentQuestion + 1} of {currentAssessment.questions?.length || 10}</span>
                      <span>{Math.round(((currentQuestion + 1) / (currentAssessment.questions?.length || 10)) * 100)}% Complete</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-white h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentQuestion + 1) / (currentAssessment.questions?.length || 10)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Assessment Content */}
                <div className="p-6">
                  {/* Mock question content */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Sample Question {currentQuestion + 1}: What is the primary purpose of version control in software development?
                      </h3>
                      
                      <div className="space-y-3">
                        {['Track changes in code over time', 'Compile code faster', 'Debug applications', 'Create user interfaces'].map((option, index) => (
                          <label key={index} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors">
                            <input
                              type="radio"
                              name={`question-${currentQuestion}`}
                              value={index}
                              onChange={(e) => {
                                const newAnswers = [...assessmentAnswers];
                                newAnswers[currentQuestion] = parseInt(e.target.value);
                                setAssessmentAnswers(newAnswers);
                              }}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-gray-700 dark:text-gray-300">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between">
                      <button
                        onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                        disabled={currentQuestion === 0}
                        className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>

                      {currentQuestion < (currentAssessment.questions?.length || 10) - 1 ? (
                        <button
                          onClick={() => setCurrentQuestion(currentQuestion + 1)}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Next
                        </button>
                      ) : (
                        <button
                          onClick={submitAssessment}
                          disabled={takeAssessmentMutation.isPending}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {takeAssessmentMutation.isPending ? 'Submitting...' : 'Submit Assessment'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={() => setCurrentAssessment(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Skills Assessment</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Evaluate your skills and earn professional certifications</p>
              </div>

              {/* Tab Navigation */}
              <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {[
                  { id: 'explore', label: 'Explore', icon: SparklesIcon },
                  { id: 'assess', label: 'Assess', icon: RocketLaunchIcon },
                  { id: 'profile', label: 'My Skills', icon: UserGroupIcon },
                  { id: 'certificates', label: 'Certificates', icon: TrophyIcon }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={cn(
                        'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        activeTab === tab.id
                          ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnimatePresence mode="wait">
            {activeTab === 'explore' && (
              <motion.div
                key="explore"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Categories Grid */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Skill Categories</h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{categories.length} categories available</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {categories.map((category: SkillCategory) => {
                      const Icon = getCategoryIcon(category.icon);
                      return (
                        <motion.div
                          key={category.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedCategory(category.id)}
                          className={cn(
                            'bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 cursor-pointer transition-all duration-200',
                            selectedCategory === category.id
                              ? 'border-blue-500 shadow-blue-100 dark:shadow-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          )}
                        >
                          <div className="p-6">
                            <div className="flex items-center space-x-4 mb-4">
                              <div 
                                className="p-3 rounded-lg"
                                style={{ backgroundColor: `${category.color}20`, color: category.color }}
                              >
                                <Icon className="h-6 w-6" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">{category.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{category.industry}</p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{category.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {Math.floor(Math.random() * 50) + 10} skills
                              </span>
                              <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Skills in Selected Category */}
                {selectedCategory && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Skills in {categories.find(c => c.id === selectedCategory)?.name}
                      </h2>
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        ← Back to categories
                      </button>
                    </div>

                    {skillsLoading ? (
                      <div className="flex justify-center py-8">
                        <LoadingSpinner />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {skills.map((skill: Skill) => (
                          <motion.div
                            key={skill.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">{skill.name}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{skill.description}</p>
                              </div>
                              {skill.certificationAvailable && (
                                <ShieldSolidIcon className="h-5 w-5 text-yellow-500" />
                              )}
                            </div>

                            <div className="flex items-center space-x-4 mb-4">
                              <span className={cn('px-2 py-1 rounded-md text-xs font-medium border', getDifficultyColor(skill.difficulty))}>
                                {skill.difficulty}
                              </span>
                              <div className="flex items-center space-x-1">
                                <StarIcon className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-300">{skill.marketDemand}/10</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <ClockIcon className="h-4 w-4 text-blue-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-300">{skill.timeToLearn}h</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                                ${skill.averageSalaryImpact?.toLocaleString()} salary impact
                              </span>
                              <button
                                onClick={() => setSelectedSkill(skill.id)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                              >
                                View Assessments
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'assess' && (
              <motion.div
                key="assess"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {selectedSkill ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Assessments for {skills.find(s => s.id === selectedSkill)?.name}
                      </h2>
                      <button
                        onClick={() => setSelectedSkill(null)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        ← Back to skills
                      </button>
                    </div>

                    {assessmentsLoading ? (
                      <div className="flex justify-center py-8">
                        <LoadingSpinner />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {assessments.map((assessment: Assessment) => (
                          <motion.div
                            key={assessment.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">{assessment.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{assessment.description}</p>
                              </div>
                              <TrophySolidIcon className="h-5 w-5 text-yellow-500" />
                            </div>

                            <div className="space-y-3 mb-6">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-300">Type:</span>
                                <span className="font-medium capitalize">{assessment.type}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-300">Duration:</span>
                                <span className="font-medium">{assessment.duration} minutes</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-300">Passing Score:</span>
                                <span className="font-medium">{assessment.passingScore}%</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-300">Certification:</span>
                                <span className="font-medium">{assessment.certificationType}</span>
                              </div>
                            </div>

                            <button
                              onClick={() => startAssessment(assessment)}
                              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium flex items-center justify-center space-x-2"
                            >
                              <PlayIcon className="h-5 w-5" />
                              <span>Start Assessment</span>
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <LightBulbIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Choose a Skill to Assess</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Select a skill from the Explore tab to view available assessments
                    </p>
                    <button
                      onClick={() => setActiveTab('explore')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Browse Skills
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Skill Portfolio</h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{userSkills.length} skills tracked</span>
                </div>

                {profileLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : userSkills.length === 0 ? (
                  <div className="text-center py-12">
                    <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Skills Assessed Yet</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Complete some skill assessments to build your portfolio
                    </p>
                    <button
                      onClick={() => setActiveTab('explore')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Start Assessing
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {userSkills.map((userSkill: UserSkill, index: number) => (
                      <motion.div
                        key={userSkill.skill.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{userSkill.skill.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{userSkill.category.name}</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: 5 }, (_, i) => (
                              <StarSolidIcon
                                key={i}
                                className={cn(
                                  'h-4 w-4',
                                  i < Math.floor(userSkill.profile.proficiencyLevel / 2)
                                    ? 'text-yellow-500'
                                    : 'text-gray-300 dark:text-gray-600'
                                )}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Proficiency:</span>
                            <span className="font-medium">{userSkill.profile.proficiencyLevel}/10</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Assessment Score:</span>
                            <span className="font-medium">{userSkill.profile.assessmentScore}%</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Experience:</span>
                            <span className="font-medium">{userSkill.profile.experienceYears} years</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Market Value:</span>
                            <span className="font-medium text-green-600 dark:text-green-400">
                              ${userSkill.profile.marketValue?.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {userSkill.profile.certificationsEarned > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center space-x-2">
                              <TrophySolidIcon className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {userSkill.profile.certificationsEarned} Certification{userSkill.profile.certificationsEarned !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'certificates' && (
              <motion.div
                key="certificates"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="text-center py-12">
                  <TrophyIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Certificates Coming Soon</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Complete assessments to earn professional certificates that showcase your expertise
                  </p>
                  <button
                    onClick={() => setActiveTab('assess')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Start Earning Certificates
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default SkillsAssessmentPage;