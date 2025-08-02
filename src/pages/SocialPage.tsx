import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import {
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  VideoCameraIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  Cog6ToothIcon,
  BellIcon,
  HeartIcon,
  ShareIcon,
  BookOpenIcon,
  AcademicCapIcon,
  TrophyIcon,
  ClockIcon,
  MapPinIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  XMarkIcon,
  PlusIcon,
  EllipsisHorizontalIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  CameraIcon,
  ComputerDesktopIcon,
  HandRaisedIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  FaceSmileIcon,
  PaperAirplaneIcon,
  DocumentIcon,
  PhotoIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  StarIcon,
  FireIcon,
  LightBulbIcon,
  QuestionMarkCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
  UserGroupIcon as UserGroupIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  PhoneIcon as PhoneIconSolid,
  VideoCameraIcon as VideoCameraIconSolid,
  HeartIcon as HeartIconSolid,
  BookOpenIcon as BookOpenIconSolid,
  TrophyIcon as TrophyIconSolid,
  StarIcon as StarIconSolid,
  FireIcon as FireIconSolid
} from '@heroicons/react/24/solid';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { cn } from '../utils/cn';

const SocialPage: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<'friends' | 'groups' | 'messages' | 'calls' | 'activity' | 'discover'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'online' | 'studying' | 'away' | 'dnd'>('all');
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<any>(null);
  const [callSettings, setCallSettings] = useState({
    video: true,
    audio: true,
    screen: false
  });
  const [showGroupCreation, setShowGroupCreation] = useState(false);
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    description: '',
    privacy: 'public' as 'public' | 'private',
    subject: '',
    maxMembers: 100
  });
  const [showFriendRequest, setShowFriendRequest] = useState(false);
  const [friendRequestData, setFriendRequestData] = useState({
    username: '',
    message: ''
  });

  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data queries (replace with real API calls)
  const { data: friends, isLoading: friendsLoading } = useQuery({
    queryKey: ['social', 'friends'],
    queryFn: async () => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return [
        {
          id: '1',
          username: 'alex_study',
          globalName: 'Alex Thompson',
          discriminator: '1234',
          avatar: null,
          status: 'online',
          activity: 'Studying Mathematics',
          mutualFriends: 3,
          friendSince: '2024-01-15',
          studyStreak: 15,
          lastSeen: new Date(),
          preferences: {
            canCall: true,
            canMessage: true,
            showActivity: true
          }
        },
        {
          id: '2',
          username: 'sarah_chem',
          globalName: 'Sarah Chen',
          discriminator: '5678',
          avatar: null,
          status: 'studying',
          activity: 'Chemistry Lab Report',
          mutualFriends: 7,
          friendSince: '2023-11-20',
          studyStreak: 42,
          lastSeen: new Date(Date.now() - 300000),
          preferences: {
            canCall: true,
            canMessage: true,
            showActivity: true
          }
        },
        {
          id: '3',
          username: 'mike_cs',
          globalName: 'Michael Rodriguez',
          discriminator: '9012',
          avatar: null,
          status: 'away',
          activity: 'Taking a break',
          mutualFriends: 1,
          friendSince: '2024-02-01',
          studyStreak: 8,
          lastSeen: new Date(Date.now() - 1800000),
          preferences: {
            canCall: false,
            canMessage: true,
            showActivity: false
          }
        }
      ];
    }
  });

  const { data: studyGroups, isLoading: groupsLoading } = useQuery({
    queryKey: ['social', 'groups'],
    queryFn: async () => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 600));
      return [
        {
          id: '1',
          name: 'Advanced Calculus Study Group',
          description: 'Weekly study sessions for Calc III students',
          memberCount: 24,
          maxMembers: 50,
          privacy: 'public',
          subject: 'Mathematics',
          owner: 'alex_study',
          moderators: ['sarah_chem'],
          createdAt: '2024-01-10',
          lastActivity: new Date(),
          weeklyHours: 12,
          achievements: ['Study Streak Champions', 'Problem Solving Masters'],
          upcomingSession: {
            title: 'Integration Techniques',
            date: new Date(Date.now() + 86400000),
            duration: 2
          }
        },
        {
          id: '2',
          name: 'Chemistry Lab Partners',
          description: 'Collaboration space for organic chemistry lab work',
          memberCount: 8,
          maxMembers: 12,
          privacy: 'private',
          subject: 'Chemistry',
          owner: 'sarah_chem',
          moderators: [],
          createdAt: '2023-12-05',
          lastActivity: new Date(Date.now() - 3600000),
          weeklyHours: 6,
          achievements: ['Lab Safety Stars'],
          upcomingSession: {
            title: 'Synthesis Review',
            date: new Date(Date.now() + 172800000),
            duration: 1.5
          }
        }
      ];
    }
  });

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['social', 'conversations'],
    queryFn: async () => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 400));
      return [
        {
          id: '1',
          type: 'direct',
          participants: ['alex_study'],
          lastMessage: {
            id: '1',
            content: 'Hey! Want to study together for the calc exam?',
            sender: 'alex_study',
            timestamp: new Date(Date.now() - 3600000),
            type: 'text'
          },
          unreadCount: 2,
          isPinned: true
        },
        {
          id: '2',
          type: 'group',
          groupId: '1',
          participants: ['alex_study', 'sarah_chem', 'mike_cs'],
          lastMessage: {
            id: '2',
            content: 'Posted the study guide in our shared notes!',
            sender: 'sarah_chem',
            timestamp: new Date(Date.now() - 7200000),
            type: 'text'
          },
          unreadCount: 0,
          isPinned: false
        }
      ];
    }
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['social', 'messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 300));
      return [
        {
          id: '1',
          content: 'Hey! Want to study together for the calc exam?',
          sender: 'alex_study',
          timestamp: new Date(Date.now() - 3600000),
          type: 'text',
          reactions: [{ emoji: '👍', users: ['current_user'], count: 1 }],
          edited: false,
          replyTo: null
        },
        {
          id: '2',
          content: 'Absolutely! I was just about to ask. What time works for you?',
          sender: 'current_user',
          timestamp: new Date(Date.now() - 3540000),
          type: 'text',
          reactions: [],
          edited: false,
          replyTo: null
        },
        {
          id: '3',
          content: 'How about 7 PM? I can share my screen and we can go through practice problems.',
          sender: 'alex_study',
          timestamp: new Date(Date.now() - 3480000),
          type: 'text',
          reactions: [{ emoji: '🔥', users: ['current_user'], count: 1 }],
          edited: false,
          replyTo: null
        }
      ];
    },
    enabled: !!selectedConversation
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['social', 'activities'],
    queryFn: async () => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 450));
      return [
        {
          id: '1',
          type: 'achievement',
          user: 'alex_study',
          content: 'completed a 50-day study streak!',
          timestamp: new Date(Date.now() - 1800000),
          icon: FireIcon,
          color: 'text-orange-500'
        },
        {
          id: '2',
          type: 'study_session',
          user: 'sarah_chem',
          content: 'studied Chemistry for 3 hours',
          timestamp: new Date(Date.now() - 3600000),
          icon: BookOpenIcon,
          color: 'text-blue-500'
        },
        {
          id: '3',
          type: 'group_join',
          user: 'mike_cs',
          content: 'joined Advanced Calculus Study Group',
          timestamp: new Date(Date.now() - 7200000),
          icon: UserGroupIcon,
          color: 'text-green-500'
        },
        {
          id: '4',
          type: 'quiz_completion',
          user: 'alex_study',
          content: 'scored 95% on Calculus Quiz #5',
          timestamp: new Date(Date.now() - 10800000),
          icon: TrophyIcon,
          color: 'text-yellow-500'
        }
      ];
    }
  });

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { conversationId: string; content: string; type: string }) => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 200));
      return data;
    },
    onSuccess: () => {
      setMessageInput('');
      queryClient.invalidateQueries({ queryKey: ['social', 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['social', 'conversations'] });
    }
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: typeof newGroupData) => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      setShowGroupCreation(false);
      setNewGroupData({
        name: '',
        description: '',
        privacy: 'public',
        subject: '',
        maxMembers: 100
      });
      queryClient.invalidateQueries({ queryKey: ['social', 'groups'] });
      toast.success('Study group created successfully!');
    }
  });

  const sendFriendRequestMutation = useMutation({
    mutationFn: async (data: typeof friendRequestData) => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 800));
      return data;
    },
    onSuccess: () => {
      setShowFriendRequest(false);
      setFriendRequestData({ username: '', message: '' });
      toast.success('Friend request sent!');
    }
  });

  // Effects
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let typingTimer: NodeJS.Timeout;
    if (messageInput.length > 0) {
      setIsTyping(true);
      typingTimer = setTimeout(() => setIsTyping(false), 1000);
    } else {
      setIsTyping(false);
    }
    return () => clearTimeout(typingTimer);
  }, [messageInput]);

  // Handlers
  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      content: messageInput.trim(),
      type: 'text'
    });
  };

  const handleCreateGroup = () => {
    if (!newGroupData.name.trim()) {
      toast.error('Group name is required');
      return;
    }
    createGroupMutation.mutate(newGroupData);
  };

  const handleSendFriendRequest = () => {
    if (!friendRequestData.username.trim()) {
      toast.error('Username is required');
      return;
    }
    sendFriendRequestMutation.mutate(friendRequestData);
  };

  const handleStartCall = (type: 'voice' | 'video') => {
    setActiveCall({
      id: 'call_' + Date.now(),
      type,
      participants: selectedFriend ? [selectedFriend] : [],
      startTime: new Date(),
      status: 'connecting'
    });
  };

  const handleEndCall = () => {
    setActiveCall(null);
    setCallSettings({ video: true, audio: true, screen: false });
  };

  const filteredFriends = friends?.filter(friend => {
    const matchesSearch = friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         friend.globalName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || friend.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredGroups = studyGroups?.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabVariants = {
    inactive: { opacity: 0.6, scale: 0.95 },
    active: { opacity: 1, scale: 1 }
  };

  const tabs = [
    { id: 'friends', label: 'Friends', icon: UserGroupIcon, count: friends?.length || 0 },
    { id: 'groups', label: 'Study Groups', icon: AcademicCapIcon, count: studyGroups?.length || 0 },
    { id: 'messages', label: 'Messages', icon: ChatBubbleLeftRightIcon, count: conversations?.reduce((acc, conv) => acc + conv.unreadCount, 0) || 0 },
    { id: 'calls', label: 'Calls', icon: PhoneIcon, count: 0 },
    { id: 'activity', label: 'Activity', icon: BellIcon, count: activities?.length || 0 },
    { id: 'discover', label: 'Discover', icon: GlobeAltIcon, count: 0 }
  ];

  return (
    <>
      <Helmet>
        <title>Social - StudyGenius</title>
        <meta name="description" content="Connect with study buddies, join study groups, and collaborate on your learning journey" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <UserGroupIcon className="h-8 w-8 text-primary-600" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Social Hub</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search friends, groups..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Quick Actions */}
                <button
                  onClick={() => setShowFriendRequest(true)}
                  className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  title="Add Friend"
                >
                  <UserPlusIcon className="h-5 w-5" />
                </button>
                
                <button
                  onClick={() => setShowGroupCreation(true)}
                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  title="Create Study Group"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  variants={tabVariants}
                  animate={activeTab === tab.id ? 'active' : 'inactive'}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {tab.count}
                    </span>
                  )}
                </motion.button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnimatePresence mode="wait">
            {/* Friends Tab */}
            {activeTab === 'friends' && (
              <motion.div
                key="friends"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Filter Bar */}
                <div className="flex items-center space-x-4">
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value as any)}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Friends</option>
                    <option value="online">Online</option>
                    <option value="studying">Studying</option>
                    <option value="away">Away</option>
                    <option value="dnd">Do Not Disturb</option>
                  </select>
                </div>

                {/* Friends List */}
                {friendsLoading ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFriends?.map((friend) => (
                      <motion.div
                        key={friend.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                      >
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {friend.globalName.charAt(0)}
                            </div>
                            <div className={cn(
                              'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800',
                              friend.status === 'online' && 'bg-green-500',
                              friend.status === 'studying' && 'bg-blue-500',
                              friend.status === 'away' && 'bg-yellow-500',
                              friend.status === 'dnd' && 'bg-red-500'
                            )} />
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {friend.globalName}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              @{friend.username}#{friend.discriminator}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <ClockIcon className="h-4 w-4 mr-2" />
                            Friends since {new Date(friend.friendSince).toLocaleDateString()}
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <FireIcon className="h-4 w-4 mr-2 text-orange-500" />
                            {friend.studyStreak} day study streak
                          </div>
                          {friend.activity && (
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <BookOpenIcon className="h-4 w-4 mr-2" />
                              {friend.activity}
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedConversation(friend.id);
                              setActiveTab('messages');
                            }}
                            className="flex-1 bg-primary-600 text-white px-3 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm"
                          >
                            <ChatBubbleLeftRightIcon className="h-4 w-4 inline mr-1" />
                            Message
                          </button>
                          {friend.preferences.canCall && (
                            <button
                              onClick={() => {
                                setSelectedFriend(friend.id);
                                handleStartCall('voice');
                              }}
                              className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <PhoneIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Study Groups Tab */}
            {activeTab === 'groups' && (
              <motion.div
                key="groups"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {groupsLoading ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredGroups?.map((group) => (
                      <motion.div
                        key={group.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {group.name}
                              </h3>
                              {group.privacy === 'private' && (
                                <ShieldCheckIcon className="h-5 w-5 text-yellow-500" />
                              )}
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                              {group.description}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary-600">
                              {group.memberCount}
                            </div>
                            <div className="text-xs text-gray-500">Members</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {group.weeklyHours}h
                            </div>
                            <div className="text-xs text-gray-500">Weekly Study</div>
                          </div>
                        </div>

                        {group.upcomingSession && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
                            <div className="flex items-center text-sm text-blue-800 dark:text-blue-300">
                              <CalendarIcon className="h-4 w-4 mr-2" />
                              Next Session: {group.upcomingSession.title}
                            </div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              {group.upcomingSession.date.toLocaleDateString()} • {group.upcomingSession.duration}h
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {group.subject}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedGroup(group.id);
                              // Navigate to group details
                            }}
                            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm"
                          >
                            Join Group
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <motion.div
                key="messages"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]"
              >
                {/* Conversations List */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Conversations</h3>
                  {conversationsLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <div className="space-y-2">
                      {conversations?.map((conversation) => (
                        <div
                          key={conversation.id}
                          onClick={() => setSelectedConversation(conversation.id)}
                          className={cn(
                            'p-3 rounded-lg cursor-pointer transition-colors',
                            selectedConversation === conversation.id
                              ? 'bg-primary-100 dark:bg-primary-900'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                          )}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                              {conversation.type === 'direct' ? 
                                conversation.participants[0]?.charAt(0).toUpperCase() : 
                                'G'
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {conversation.type === 'direct' ? 
                                    conversation.participants[0] : 
                                    'Group Chat'
                                  }
                                </p>
                                {conversation.unreadCount > 0 && (
                                  <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                    {conversation.unreadCount}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {conversation.lastMessage.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chat Area */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                  {selectedConversation ? (
                    <>
                      {/* Chat Header */}
                      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                              A
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">Alex Thompson</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Online</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleStartCall('voice')}
                              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <PhoneIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleStartCall('video')}
                              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <VideoCameraIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messagesLoading ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          messages?.map((message) => (
                            <div
                              key={message.id}
                              className={cn(
                                'flex',
                                message.sender === 'current_user' ? 'justify-end' : 'justify-start'
                              )}
                            >
                              <div
                                className={cn(
                                  'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
                                  message.sender === 'current_user'
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                )}
                              >
                                <p>{message.content}</p>
                                <div className="flex items-center justify-between mt-1">
                                  <span className={cn(
                                    'text-xs',
                                    message.sender === 'current_user'
                                      ? 'text-primary-100'
                                      : 'text-gray-500 dark:text-gray-400'
                                  )}>
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {message.reactions.length > 0 && (
                                    <div className="flex space-x-1">
                                      {message.reactions.map((reaction, index) => (
                                        <span key={index} className="text-sm">
                                          {reaction.emoji} {reaction.count}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Message Input */}
                      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={messageInput}
                              onChange={(e) => setMessageInput(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                              placeholder="Type a message..."
                              className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                            <button
                              onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <FaceSmileIcon className="h-5 w-5" />
                            </button>
                          </div>
                          <button
                            onClick={handleSendMessage}
                            disabled={!messageInput.trim() || sendMessageMutation.isPending}
                            className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <PaperAirplaneIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                      <div className="text-center">
                        <ChatBubbleLeftRightIcon className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <p>Select a conversation to start messaging</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Recent Activity</h3>
                  {activitiesLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <div className="space-y-4">
                      {activities?.map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className={cn('p-2 rounded-full', activity.color.replace('text-', 'bg-').replace('500', '100'))}>
                            <activity.icon className={cn('h-5 w-5', activity.color)} />
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-900 dark:text-white">
                              <span className="font-semibold">{activity.user}</span> {activity.content}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {activity.timestamp.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Active Call Overlay */}
        <AnimatePresence>
          {activeCall && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-900 rounded-xl p-6 text-white max-w-md w-full mx-4"
              >
                <div className="text-center mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                    A
                  </div>
                  <h3 className="text-xl font-semibold">Alex Thompson</h3>
                  <p className="text-gray-400">
                    {activeCall.type === 'video' ? 'Video Call' : 'Voice Call'} • {activeCall.status}
                  </p>
                </div>

                <div className="flex justify-center space-x-4 mb-6">
                  <button
                    onClick={() => setCallSettings(prev => ({ ...prev, audio: !prev.audio }))}
                    className={cn(
                      'p-3 rounded-full',
                      callSettings.audio ? 'bg-gray-700' : 'bg-red-600'
                    )}
                  >
                    <MicrophoneIcon className="h-6 w-6" />
                  </button>
                  
                  {activeCall.type === 'video' && (
                    <button
                      onClick={() => setCallSettings(prev => ({ ...prev, video: !prev.video }))}
                      className={cn(
                        'p-3 rounded-full',
                        callSettings.video ? 'bg-gray-700' : 'bg-red-600'
                      )}
                    >
                      <CameraIcon className="h-6 w-6" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => setCallSettings(prev => ({ ...prev, screen: !prev.screen }))}
                    className={cn(
                      'p-3 rounded-full',
                      callSettings.screen ? 'bg-blue-600' : 'bg-gray-700'
                    )}
                  >
                    <ComputerDesktopIcon className="h-6 w-6" />
                  </button>
                  
                  <button
                    onClick={handleEndCall}
                    className="p-3 rounded-full bg-red-600"
                  >
                    <PhoneIcon className="h-6 w-6 transform rotate-180" />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals */}
        <AnimatePresence>
          {/* Create Group Modal */}
          {showGroupCreation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Create Study Group</h3>
                  <button
                    onClick={() => setShowGroupCreation(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Group Name
                    </label>
                    <input
                      type="text"
                      value={newGroupData.name}
                      onChange={(e) => setNewGroupData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., Advanced Calculus Study Group"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newGroupData.description}
                      onChange={(e) => setNewGroupData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Describe your study group..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={newGroupData.subject}
                      onChange={(e) => setNewGroupData(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., Mathematics"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Privacy
                    </label>
                    <select
                      value={newGroupData.privacy}
                      onChange={(e) => setNewGroupData(prev => ({ ...prev, privacy: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Members
                    </label>
                    <input
                      type="number"
                      value={newGroupData.maxMembers}
                      onChange={(e) => setNewGroupData(prev => ({ ...prev, maxMembers: parseInt(e.target.value) }))}
                      min="2"
                      max="10000000"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowGroupCreation(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateGroup}
                    disabled={createGroupMutation.isPending || !newGroupData.name.trim()}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Add Friend Modal */}
          {showFriendRequest && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add Friend</h3>
                  <button
                    onClick={() => setShowFriendRequest(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={friendRequestData.username}
                      onChange={(e) => setFriendRequestData(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="username#1234"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Message (Optional)
                    </label>
                    <textarea
                      value={friendRequestData.message}
                      onChange={(e) => setFriendRequestData(prev => ({ ...prev, message: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Hi! I'd like to be study buddies..."
                    />
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowFriendRequest(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendFriendRequest}
                    disabled={sendFriendRequestMutation.isPending || !friendRequestData.username.trim()}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendFriendRequestMutation.isPending ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default SocialPage;