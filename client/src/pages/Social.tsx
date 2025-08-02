import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  MessageCircle,
  Video,
  Trophy,
  BookOpen,
  Calendar,
  Search,
  Filter,
  Settings,
  Star,
  Award,
  Crown,
  Heart,
  Share2,
  Mail,
  Phone,
  MapPin,
  School,
  Clock,
  Activity,
  TrendingUp,
  Plus,
  Check,
  X,
  MoreHorizontal,
  Edit,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Globe,
  Shield,
  Flag,
  AlertCircle,
  Info,
  Sparkles,
  Zap,
  Target,
  Brain,
  Lightbulb,
  Rocket,
  Fire,
  Gem,
  Diamond,
  Medal,
  ChevronRight,
  ChevronDown,
  Smile,
  Frown,
  Meh
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';
import toast from 'react-hot-toast';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  school: string;
  grade: string;
  location: string;
  joinedAt: string;
  lastSeen: string;
  isOnline: boolean;
  isPremium: boolean;
  stats: {
    studyTime: number;
    notesCreated: number;
    gamesPlayed: number;
    averageGrade: number;
    streakDays: number;
  };
  subjects: string[];
  achievements: Achievement[];
  badges: Badge[];
}

interface Friend {
  id: number;
  user: User;
  status: 'pending' | 'accepted' | 'blocked';
  requestedAt: string;
  respondedAt?: string;
  mutualFriends: number;
  studyScore: number;
  lastInteraction: string;
}

interface StudyGroup {
  id: number;
  name: string;
  description: string;
  avatar: string;
  creator: User;
  members: StudyGroupMember[];
  subject: string;
  difficultyLevel: string;
  isPublic: boolean;
  maxMembers: number;
  currentMembers: number;
  totalStudyTime: number;
  averageGrade: number;
  goals: string[];
  achievements: string[];
  nextSession?: {
    date: string;
    topic: string;
    duration: number;
  };
  createdAt: string;
  lastActivity: string;
}

interface StudyGroupMember {
  id: number;
  user: User;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedAt: string;
  contributionScore: number;
  studyTime: number;
  helpfulness: number;
  isActive: boolean;
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  points: number;
  unlockedAt: string;
}

interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
}

interface SocialActivity {
  id: number;
  type: 'friend_request' | 'group_joined' | 'achievement_unlocked' | 'study_session' | 'note_shared' | 'quiz_completed';
  user: User;
  content: string;
  metadata: any;
  timestamp: string;
  isRead: boolean;
}

const RARITY_COLORS = {
  common: 'text-gray-600',
  uncommon: 'text-green-600',
  rare: 'text-blue-600',
  epic: 'text-purple-600',
  legendary: 'text-yellow-600'
};

const RARITY_BACKGROUNDS = {
  common: 'bg-gray-100 dark:bg-gray-800',
  uncommon: 'bg-green-100 dark:bg-green-900/30',
  rare: 'bg-blue-100 dark:bg-blue-900/30',
  epic: 'bg-purple-100 dark:bg-purple-900/30',
  legendary: 'bg-yellow-100 dark:bg-yellow-900/30'
};

const Social: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('friends');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<Friend[]>([]);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [recommendedFriends, setRecommendedFriends] = useState<User[]>([]);
  const [recommendedGroups, setRecommendedGroups] = useState<StudyGroup[]>([]);
  const [socialActivity, setSocialActivity] = useState<SocialActivity[]>([]);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  // UI states
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showInviteFriends, setShowInviteFriends] = useState(false);

  useEffect(() => {
    fetchSocialData();
  }, []);

  const fetchSocialData = async () => {
    try {
      setLoading(true);
      const [friendsRes, groupsRes, activityRes] = await Promise.all([
        axios.get('/api/social/friends'),
        axios.get('/api/social/groups'),
        axios.get('/api/social/activity')
      ]);

      setFriends(friendsRes.data.data.friends);
      setFriendRequests(friendsRes.data.data.requests);
      setRecommendedFriends(friendsRes.data.data.recommended);

      setStudyGroups(groupsRes.data.data.groups);
      setMyGroups(groupsRes.data.data.myGroups);
      setRecommendedGroups(groupsRes.data.data.recommended);

      setSocialActivity(activityRes.data.data.activities);
    } catch (error) {
      console.error('Error fetching social data:', error);
      toast.error('Failed to load social data');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId: number) => {
    try {
      await axios.post('/api/social/friends/request', { userId });
      toast.success('Friend request sent!');
      await fetchSocialData();
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Failed to send friend request');
    }
  };

  const respondToFriendRequest = async (requestId: number, action: 'accept' | 'decline') => {
    try {
      await axios.put(`/api/social/friends/request/${requestId}`, { action });
      toast.success(`Friend request ${action}ed!`);
      await fetchSocialData();
    } catch (error) {
      console.error('Error responding to friend request:', error);
      toast.error('Failed to respond to friend request');
    }
  };

  const createStudyGroup = async (groupData: any) => {
    try {
      await axios.post('/api/social/groups', groupData);
      toast.success('Study group created!');
      setShowCreateGroup(false);
      await fetchSocialData();
    } catch (error) {
      console.error('Error creating study group:', error);
      toast.error('Failed to create study group');
    }
  };

  const joinStudyGroup = async (groupId: number) => {
    try {
      await axios.post(`/api/social/groups/${groupId}/join`);
      toast.success('Joined study group!');
      await fetchSocialData();
    } catch (error) {
      console.error('Error joining study group:', error);
      toast.error('Failed to join study group');
    }
  };

  const leaveStudyGroup = async (groupId: number) => {
    try {
      await axios.delete(`/api/social/groups/${groupId}/leave`);
      toast.success('Left study group');
      await fetchSocialData();
    } catch (error) {
      console.error('Error leaving study group:', error);
      toast.error('Failed to leave study group');
    }
  };

  const formatLastSeen = (timestamp: string, isOnline: boolean) => {
    if (isOnline) return 'Online';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 5) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getAchievementIcon = (achievement: Achievement) => {
    switch (achievement.rarity) {
      case 'legendary':
        return '💎';
      case 'epic':
        return '🏆';
      case 'rare':
        return '⭐';
      case 'uncommon':
        return '🎖️';
      default:
        return '🏅';
    }
  };

  const renderFriendCard = (friend: Friend) => (
    <motion.div
      key={friend.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            {friend.user.avatar ? (
              <img
                src={friend.user.avatar}
                alt={`${friend.user.firstName} ${friend.user.lastName}`}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                {friend.user.firstName.charAt(0)}{friend.user.lastName.charAt(0)}
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
              friend.user.isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`} />
            {friend.user.isPremium && (
              <Crown className="absolute -top-1 -right-1 w-5 h-5 text-yellow-500" />
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 dark:text-white">
                {friend.user.firstName} {friend.user.lastName}
              </h3>
              {friend.user.badges.slice(0, 2).map((badge) => (
                <span
                  key={badge.id}
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: badge.color + '20', color: badge.color }}
                >
                  {badge.icon} {badge.name}
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">@{friend.user.username}</p>
            <p className="text-xs text-gray-500">
              {formatLastSeen(friend.user.lastSeen, friend.user.isOnline)}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => toast.info('Messaging feature coming soon!')}
            className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
          <button
            onClick={() => toast.info('Video call feature coming soon!')}
            className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
          >
            <Video className="h-4 w-4" />
          </button>
          <button className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {friend.user.bio && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {friend.user.bio}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="font-semibold text-gray-900 dark:text-white">
            {Math.floor(friend.user.stats.studyTime / 60)}h
          </div>
          <div className="text-xs text-gray-500">Study Time</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-gray-900 dark:text-white">
            {friend.user.stats.averageGrade.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">Avg Grade</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {friend.user.subjects.slice(0, 3).map((subject) => (
            <span
              key={subject}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs"
            >
              {subject}
            </span>
          ))}
        </div>
        
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Trophy className="h-3 w-3" />
          {friend.user.achievements.length}
        </div>
      </div>
    </motion.div>
  );

  const renderStudyGroupCard = (group: StudyGroup) => (
    <motion.div
      key={group.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          {group.avatar ? (
            <img
              src={group.avatar}
              alt={group.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-xl">
              {group.name.charAt(0)}
            </div>
          )}
          
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 dark:text-white">{group.name}</h3>
              {!group.isPublic && <Lock className="h-4 w-4 text-gray-500" />}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {group.subject} • {group.difficultyLevel}
            </p>
            <p className="text-xs text-gray-500">
              Created by {group.creator.firstName} {group.creator.lastName}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {group.currentMembers}/{group.maxMembers}
          </div>
          <div className="text-xs text-gray-500">Members</div>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
        {group.description}
      </p>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="font-semibold text-gray-900 dark:text-white">
            {Math.floor(group.totalStudyTime / 60)}h
          </div>
          <div className="text-xs text-gray-500">Total Study</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-gray-900 dark:text-white">
            {group.averageGrade.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">Avg Grade</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-gray-900 dark:text-white">
            {group.achievements.length}
          </div>
          <div className="text-xs text-gray-500">Achievements</div>
        </div>
      </div>

      {group.nextSession && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium mb-1">
            <Calendar className="h-4 w-4" />
            Next Session
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {new Date(group.nextSession.date).toLocaleDateString()} - {group.nextSession.topic}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {group.members.slice(0, 5).map((member) => (
            <div
              key={member.id}
              className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 overflow-hidden"
            >
              {member.user.avatar ? (
                <img
                  src={member.user.avatar}
                  alt={`${member.user.firstName} ${member.user.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium">
                  {member.user.firstName.charAt(0)}
                </div>
              )}
            </div>
          ))}
          {group.members.length > 5 && (
            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-medium">
              +{group.members.length - 5}
            </div>
          )}
        </div>
        
        <button
          onClick={() => joinStudyGroup(group.id)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Join Group
        </button>
      </div>
    </motion.div>
  );

  const renderFriendsTab = () => (
    <div className="space-y-8">
      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-blue-500" />
            Friend Requests ({friendRequests.length})
          </h2>
          <div className="space-y-4">
            {friendRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {request.user.avatar ? (
                    <img
                      src={request.user.avatar}
                      alt={`${request.user.firstName} ${request.user.lastName}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {request.user.firstName.charAt(0)}{request.user.lastName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {request.user.firstName} {request.user.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      @{request.user.username} • {request.mutualFriends} mutual friends
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => respondToFriendRequest(request.id, 'accept')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => respondToFriendRequest(request.id, 'decline')}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Friends List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-green-500" />
            My Friends ({friends.length})
          </h2>
          <div className="flex gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Online Only
              </span>
            </label>
          </div>
        </div>

        {friends.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No friends yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Connect with classmates to start studying together
            </p>
            <button
              onClick={() => setActiveTab('discover')}
              className="btn-primary"
            >
              Find Friends
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {friends
              .filter(friend => !showOnlineOnly || friend.user.isOnline)
              .map(renderFriendCard)}
          </div>
        )}
      </motion.div>

      {/* Recommended Friends */}
      {recommendedFriends.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            Suggested Friends
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedFriends.slice(0, 6).map((recommendedUser) => (
              <motion.div
                key={recommendedUser.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  {recommendedUser.avatar ? (
                    <img
                      src={recommendedUser.avatar}
                      alt={`${recommendedUser.firstName} ${recommendedUser.lastName}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {recommendedUser.firstName.charAt(0)}{recommendedUser.lastName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {recommendedUser.firstName} {recommendedUser.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      @{recommendedUser.username}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => sendFriendRequest(recommendedUser.id)}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Add Friend
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );

  const renderGroupsTab = () => (
    <div className="space-y-8">
      {/* My Groups */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-500" />
            My Study Groups ({myGroups.length})
          </h2>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Group
          </button>
        </div>

        {myGroups.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No study groups yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create or join study groups to collaborate with peers
            </p>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="btn-primary"
            >
              Create Study Group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myGroups.map(renderStudyGroupCard)}
          </div>
        )}
      </motion.div>

      {/* Available Groups */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Globe className="h-6 w-6 text-green-500" />
          Available Study Groups
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studyGroups.map(renderStudyGroupCard)}
        </div>
      </motion.div>

      {/* Recommended Groups */}
      {recommendedGroups.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-yellow-500" />
            Recommended for You
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedGroups.map(renderStudyGroupCard)}
          </div>
        </motion.div>
      )}
    </div>
  );

  const renderActivityTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
    >
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <Activity className="h-6 w-6 text-purple-500" />
        Social Activity
      </h2>
      
      {socialActivity.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No recent activity
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Connect with friends and join groups to see activity
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {socialActivity.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-start gap-4 p-4 rounded-lg ${
                activity.isRead ? 'bg-gray-50 dark:bg-gray-700' : 'bg-blue-50 dark:bg-blue-900/20'
              }`}
            >
              <div className="flex-shrink-0">
                {activity.user.avatar ? (
                  <img
                    src={activity.user.avatar}
                    alt={`${activity.user.firstName} ${activity.user.lastName}`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {activity.user.firstName.charAt(0)}{activity.user.lastName.charAt(0)}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white">
                  <span className="font-semibold">
                    {activity.user.firstName} {activity.user.lastName}
                  </span>{' '}
                  {activity.content}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
              
              <div className="flex-shrink-0">
                {!activity.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-500" />
          Social Hub
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Connect with friends, join study groups, and learn together
        </p>
      </motion.div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search friends and groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 text-sm w-64"
              />
            </div>
            
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="input text-sm"
            >
              <option value="all">All Subjects</option>
              <option value="mathematics">Mathematics</option>
              <option value="science">Science</option>
              <option value="english">English</option>
              <option value="history">History</option>
              <option value="computer-science">Computer Science</option>
            </select>
          </div>
          
          <button
            onClick={() => {
              setRefreshing(true);
              fetchSocialData().finally(() => setRefreshing(false));
            }}
            disabled={refreshing}
            className="btn-secondary p-2"
          >
            <Activity className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-8">
        {[
          { id: 'friends', label: 'Friends', icon: Users },
          { id: 'groups', label: 'Study Groups', icon: BookOpen },
          { id: 'activity', label: 'Activity', icon: Activity },
          { id: 'discover', label: 'Discover', icon: Search }
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
        {activeTab === 'friends' && (
          <motion.div
            key="friends"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderFriendsTab()}
          </motion.div>
        )}

        {activeTab === 'groups' && (
          <motion.div
            key="groups"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderGroupsTab()}
          </motion.div>
        )}

        {activeTab === 'activity' && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderActivityTab()}
          </motion.div>
        )}

        {activeTab === 'discover' && (
          <motion.div
            key="discover"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Search className="h-6 w-6 text-purple-500" />
                Discover New Connections
              </h2>
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Advanced Discovery Coming Soon!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Find friends by interests, location, school, and study preferences
                </p>
                <button
                  onClick={() => toast.info('Advanced discovery features coming soon!')}
                  className="btn-primary"
                >
                  Explore Features
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Social;