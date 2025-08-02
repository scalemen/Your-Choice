import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  UserGroupIcon,
  StarIcon,
  ClockIcon,
  CalendarDaysIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  GlobeAltIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
  PhoneIcon,
  HeartIcon,
  ShareIcon,
  BookmarkIcon,
  PlayIcon,
  PauseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  RocketLaunchIcon,
  LightBulbIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarSolidIcon,
  HeartIcon as HeartSolidIcon,
  BookmarkIcon as BookmarkSolidIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/solid';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn } from '@/utils/cn';

// Types
interface Mentor {
  id: string;
  user: {
    id: string;
    fullName: string;
    profilePicture: string;
  };
  mentor: {
    title: string;
    company: string;
    industry: string;
    experience: number;
    expertise: string[];
    bio: string;
    achievements: any[];
    mentoringStyle: string;
    hourlyRate: number;
    freeSessionOffered: boolean;
    rating: number;
    totalSessions: number;
    languages: string[];
    timezone: string;
    isVerified: boolean;
  };
}

interface Session {
  session: {
    id: string;
    title: string;
    description: string;
    scheduledAt: string;
    duration: number;
    status: string;
    cost: number;
  };
  mentor: any;
  mentorUser: {
    fullName: string;
    profilePicture: string;
  };
}

const MentorshipPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'discover' | 'sessions' | 'become-mentor' | 'network'>('discover');
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    industry: '',
    experience: '',
    rating: '',
    priceRange: '',
    availability: ''
  });

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    duration: 60,
    sessionType: 'one_on_one'
  });

  const queryClient = useQueryClient();

  // Fetch mentors
  const { data: mentors = [], isLoading: mentorsLoading } = useQuery({
    queryKey: ['mentors', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(`/api/professional/mentors?${params}`);
      if (!response.ok) throw new Error('Failed to fetch mentors');
      const data = await response.json();
      return data.data;
    }
  });

  // Fetch user sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['mentorship-sessions'],
    queryFn: async () => {
      const response = await fetch('/api/professional/mentorship/sessions');
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      return data.data;
    }
  });

  // Book mentorship session
  const bookSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      const response = await fetch('/api/professional/mentorship/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
      if (!response.ok) throw new Error('Failed to book session');
      return response.json();
    },
    onSuccess: () => {
      toast.success('🎉 Mentorship session booked successfully!');
      setShowBookingModal(false);
      setSelectedMentor(null);
      setBookingForm({
        title: '',
        description: '',
        scheduledAt: '',
        duration: 60,
        sessionType: 'one_on_one'
      });
      queryClient.invalidateQueries({ queryKey: ['mentorship-sessions'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to book session');
    }
  });

  const handleBookSession = () => {
    if (!selectedMentor) return;
    
    bookSessionMutation.mutate({
      mentorId: selectedMentor.id,
      ...bookingForm
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'scheduled': 'text-blue-600 bg-blue-50 border-blue-200',
      'in_progress': 'text-green-600 bg-green-50 border-green-200',
      'completed': 'text-gray-600 bg-gray-50 border-gray-200',
      'cancelled': 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[status as keyof typeof colors] || colors.scheduled;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredMentors = mentors.filter((mentor: Mentor) =>
    mentor.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mentor.mentor.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mentor.mentor.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mentor.mentor.industry.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (mentorsLoading && activeTab === 'discover') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Mentorship Marketplace - StudyGenius</title>
        <meta name="description" content="Connect with industry experts and mentors to accelerate your career growth with personalized guidance." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
        {/* Booking Modal */}
        <AnimatePresence>
          {showBookingModal && selectedMentor && (
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
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
                  <div className="flex items-center space-x-4">
                    <img
                      src={selectedMentor.user.profilePicture || '/default-avatar.png'}
                      alt={selectedMentor.user.fullName}
                      className="w-16 h-16 rounded-full border-4 border-white/20"
                    />
                    <div>
                      <h2 className="text-2xl font-bold">{selectedMentor.user.fullName}</h2>
                      <p className="text-purple-100">{selectedMentor.mentor.title} at {selectedMentor.mentor.company}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center space-x-1">
                          <StarSolidIcon className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm">{selectedMentor.mentor.rating}</span>
                        </div>
                        <span className="text-purple-200">•</span>
                        <span className="text-sm text-purple-100">{selectedMentor.mentor.totalSessions} sessions</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Session Title
                    </label>
                    <input
                      type="text"
                      value={bookingForm.title}
                      onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                      placeholder="e.g., Career guidance for software engineering"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={bookingForm.description}
                      onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
                      placeholder="What would you like to discuss in this session?"
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={bookingForm.scheduledAt}
                        onChange={(e) => setBookingForm({ ...bookingForm, scheduledAt: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Duration
                      </label>
                      <select
                        value={bookingForm.duration}
                        onChange={(e) => setBookingForm({ ...bookingForm, duration: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={90}>1.5 hours</option>
                        <option value={120}>2 hours</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Session Cost</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          ${selectedMentor.mentor.hourlyRate}/hour
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          ${((selectedMentor.mentor.hourlyRate * bookingForm.duration) / 60).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          for {bookingForm.duration} minutes
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowBookingModal(false)}
                      className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBookSession}
                      disabled={bookSessionMutation.isPending || !bookingForm.title || !bookingForm.scheduledAt}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                    >
                      {bookSessionMutation.isPending ? 'Booking...' : 'Book Session'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mentorship Marketplace</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Connect with industry experts and accelerate your career</p>
              </div>

              {/* Tab Navigation */}
              <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {[
                  { id: 'discover', label: 'Discover', icon: SparklesIcon },
                  { id: 'sessions', label: 'My Sessions', icon: CalendarDaysIcon },
                  { id: 'network', label: 'Expert Network', icon: UserGroupIcon },
                  { id: 'become-mentor', label: 'Become Mentor', icon: RocketLaunchIcon }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={cn(
                        'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        activeTab === tab.id
                          ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
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
            {activeTab === 'discover' && (
              <motion.div
                key="discover"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Search and Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
                    {/* Search Bar */}
                    <div className="flex-1 relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search mentors by name, title, company, or industry..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    {/* Quick Filters */}
                    <div className="flex space-x-4">
                      <select
                        value={filters.industry}
                        onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
                      >
                        <option value="">All Industries</option>
                        <option value="technology">Technology</option>
                        <option value="finance">Finance</option>
                        <option value="marketing">Marketing</option>
                        <option value="design">Design</option>
                        <option value="consulting">Consulting</option>
                      </select>

                      <select
                        value={filters.rating}
                        onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
                      >
                        <option value="">All Ratings</option>
                        <option value="4.5">4.5+ Stars</option>
                        <option value="4.0">4.0+ Stars</option>
                        <option value="3.5">3.5+ Stars</option>
                      </select>

                      <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <FunnelIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Featured Mentors Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Expert Mentors', value: '500+', icon: UserGroupIcon, color: 'purple' },
                    { label: 'Industries Covered', value: '25+', icon: BriefcaseIcon, color: 'blue' },
                    { label: 'Sessions Completed', value: '10k+', icon: CheckCircleIcon, color: 'green' },
                    { label: 'Average Rating', value: '4.8', icon: StarIcon, color: 'yellow' }
                  ].map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center"
                      >
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/20 mb-4`}>
                          <Icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</p>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Mentors Grid */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {searchQuery || Object.values(filters).some(f => f) ? 'Filtered' : 'Featured'} Mentors
                    </h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {filteredMentors.length} mentor{filteredMentors.length !== 1 ? 's' : ''} found
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMentors.map((mentor: Mentor, index: number) => (
                      <motion.div
                        key={mentor.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200"
                      >
                        {/* Mentor Header */}
                        <div className="p-6 pb-4">
                          <div className="flex items-start space-x-4">
                            <div className="relative">
                              <img
                                src={mentor.user.profilePicture || '/default-avatar.png'}
                                alt={mentor.user.fullName}
                                className="w-16 h-16 rounded-full object-cover"
                              />
                              {mentor.mentor.isVerified && (
                                <CheckBadgeIcon className="absolute -bottom-1 -right-1 h-6 w-6 text-blue-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                {mentor.user.fullName}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                                {mentor.mentor.title}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {mentor.mentor.company}
                              </p>
                              <div className="flex items-center space-x-4 mt-2">
                                <div className="flex items-center space-x-1">
                                  <StarSolidIcon className="h-4 w-4 text-yellow-500" />
                                  <span className="text-sm font-medium">{mentor.mentor.rating}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <ClockIcon className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-600 dark:text-gray-300">
                                    {mentor.mentor.experience}y exp
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Mentor Bio */}
                        <div className="px-6 pb-4">
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                            {mentor.mentor.bio}
                          </p>
                        </div>

                        {/* Expertise Tags */}
                        <div className="px-6 pb-4">
                          <div className="flex flex-wrap gap-2">
                            {mentor.mentor.expertise.slice(0, 3).map((skill, skillIndex) => (
                              <span
                                key={skillIndex}
                                className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs rounded-md"
                              >
                                {skill}
                              </span>
                            ))}
                            {mentor.mentor.expertise.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-md">
                                +{mentor.mentor.expertise.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Pricing and Actions */}
                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">
                                ${mentor.mentor.hourlyRate}/hr
                              </p>
                              {mentor.mentor.freeSessionOffered && (
                                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                                  Free trial available
                                </p>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                <HeartIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedMentor(mentor);
                                  setShowBookingModal(true);
                                }}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                              >
                                Book Session
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {filteredMentors.length === 0 && (
                    <div className="text-center py-12">
                      <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No mentors found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Try adjusting your search criteria or filters
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setFilters({ industry: '', experience: '', rating: '', priceRange: '', availability: '' });
                        }}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'sessions' && (
              <motion.div
                key="sessions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Mentorship Sessions</h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {sessionsLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarDaysIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No sessions yet</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Book your first mentorship session to get personalized guidance
                    </p>
                    <button
                      onClick={() => setActiveTab('discover')}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      Find a Mentor
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session: Session, index: number) => (
                      <motion.div
                        key={session.session.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <img
                              src={session.mentorUser.profilePicture || '/default-avatar.png'}
                              alt={session.mentorUser.fullName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {session.session.title}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                with {session.mentorUser.fullName}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {session.session.description}
                              </p>
                              <div className="flex items-center space-x-4 mt-3">
                                <div className="flex items-center space-x-1">
                                  <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-600 dark:text-gray-300">
                                    {formatDate(session.session.scheduledAt)}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <ClockIcon className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-600 dark:text-gray-300">
                                    {session.session.duration} min
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-600 dark:text-gray-300">
                                    ${session.session.cost}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className={cn(
                              'px-3 py-1 rounded-full text-xs font-medium border',
                              getStatusColor(session.session.status)
                            )}>
                              {session.session.status.replace('_', ' ')}
                            </span>
                            
                            {session.session.status === 'scheduled' && (
                              <div className="flex space-x-2">
                                <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                                  <VideoCameraIcon className="h-5 w-5" />
                                </button>
                                <button className="p-2 text-gray-400 hover:text-green-600 transition-colors">
                                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'network' && (
              <motion.div
                key="network"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="text-center py-12">
                  <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Expert Network Coming Soon</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Connect with a global network of industry experts, share insights, and collaborate on projects
                  </p>
                  <button
                    onClick={() => setActiveTab('discover')}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    Explore Mentors Meanwhile
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'become-mentor' && (
              <motion.div
                key="become-mentor"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="text-center py-12">
                  <RocketLaunchIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Become a Mentor</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Share your expertise, help others grow, and earn income by becoming a mentor on our platform
                  </p>
                  <div className="space-y-4 max-w-md mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-left border border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Benefits of Mentoring</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        <li>• Earn $50-200+ per hour</li>
                        <li>• Flexible scheduling</li>
                        <li>• Build your personal brand</li>
                        <li>• Make a meaningful impact</li>
                      </ul>
                    </div>
                    <button className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
                      Apply to Become a Mentor
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default MentorshipPage;