import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Bookmark, 
  Camera, 
  Plus, 
  Send,
  MoreHorizontal,
  Search,
  Play,
  Pause,
  Volume2,
  VolumeX,
  User,
  Settings,
  Eye,
  Hash,
  MapPin,
  Clock,
  Users,
  Filter,
  Music,
  Smile,
  Type,
  Palette,
  Download,
  Upload,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  fullName: string;
  profilePicture?: string;
  isVerified: boolean;
}

interface Post {
  id: string;
  caption?: string;
  mediaType: 'image' | 'video' | 'carousel';
  mediaUrls: string[];
  thumbnailUrl?: string;
  aspectRatio: string;
  duration?: number;
  location?: string;
  tags: string[];
  mentions: string[];
  studyRelated: boolean;
  subject?: string;
  difficulty?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  createdAt: string;
  user: User;
  isLiked: boolean;
}

interface Story {
  id: string;
  userId: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  duration: number;
  backgroundColor: string;
  textOverlay?: string;
  textColor: string;
  viewsCount: number;
  createdAt: string;
  expiresAt: string;
  user: User;
}

interface StoryGroup {
  user: User;
  stories: Story[];
}

interface Comment {
  id: string;
  content: string;
  likesCount: number;
  repliesCount: number;
  isEdited: boolean;
  createdAt: string;
  user: User;
}

const SocialMediaPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  
  // State management
  const [activeTab, setActiveTab] = useState<'feed' | 'stories' | 'explore'>('feed');
  const [feedType, setFeedType] = useState<'all' | 'following' | 'study'>('all');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStoryGroup, setSelectedStoryGroup] = useState<StoryGroup | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // API calls
  const { data: feed, isLoading: feedLoading } = useQuery({
    queryKey: ['social-media-feed', feedType],
    queryFn: async () => {
      const response = await fetch(`/api/social-media/feed?type=${feedType}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch feed');
      return response.json();
    }
  });

  const { data: stories } = useQuery({
    queryKey: ['social-media-stories'],
    queryFn: async () => {
      const response = await fetch('/api/social-media/stories', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch stories');
      return response.json();
    }
  });

  const { data: trending } = useQuery({
    queryKey: ['social-media-trending'],
    queryFn: async () => {
      const response = await fetch('/api/social-media/trending', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch trending');
      return response.json();
    }
  });

  // Mutations
  const likeMutation = useMutation({
    mutationFn: async ({ postId, likeType }: { postId: string; likeType?: string }) => {
      const response = await fetch(`/api/social-media/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ likeType })
      });
      if (!response.ok) throw new Error('Failed to toggle like');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-media-feed'] });
    }
  });

  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/social-media/users/${userId}/follow`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to toggle follow');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-media-feed'] });
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/social-media/posts/${postId}/save`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to toggle save');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Post saved successfully');
    }
  });

  // Post Component
  const PostCard: React.FC<{ post: Post }> = ({ post }) => {
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    const mediaUrls = JSON.parse(post.mediaUrls as any);

    const toggleLike = () => {
      likeMutation.mutate({ postId: post.id });
    };

    const toggleSave = () => {
      saveMutation.mutate(post.id);
    };

    const openComments = () => {
      setSelectedPost(post);
      setShowComments(true);
    };

    const formatTimeAgo = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'now';
      if (diffInHours < 24) return `${diffInHours}h`;
      return `${Math.floor(diffInHours / 24)}d`;
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-6 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={post.user.profilePicture || '/default-avatar.png'}
                alt={post.user.fullName}
                className="w-10 h-10 rounded-full object-cover"
              />
              {post.user.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {post.user.fullName}
                </h3>
                {post.studyRelated && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    Study
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{formatTimeAgo(post.createdAt)}</span>
                {post.location && (
                  <>
                    <span>•</span>
                    <span className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {post.location}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Media */}
        <div className="relative bg-black">
          {post.mediaType === 'carousel' ? (
            <div className="relative">
              <div className="flex overflow-hidden">
                {mediaUrls.map((url: string, index: number) => (
                  <div
                    key={index}
                    className={`min-w-full transition-transform duration-300 ease-in-out`}
                    style={{ transform: `translateX(-${currentMediaIndex * 100}%)` }}
                  >
                    {url.includes('.mp4') || url.includes('.mov') ? (
                      <video
                        ref={videoRef}
                        src={url}
                        className="w-full h-96 object-cover"
                        playsInline
                        muted={isMuted}
                        onClick={() => setIsPlaying(!isPlaying)}
                      />
                    ) : (
                      <img
                        src={url}
                        alt="Post media"
                        className="w-full h-96 object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
              
              {mediaUrls.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentMediaIndex(Math.max(0, currentMediaIndex - 1))}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
                    disabled={currentMediaIndex === 0}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentMediaIndex(Math.min(mediaUrls.length - 1, currentMediaIndex + 1))}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
                    disabled={currentMediaIndex === mediaUrls.length - 1}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {mediaUrls.map((_: any, index: number) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === currentMediaIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="relative">
              {post.mediaType === 'video' ? (
                <video
                  ref={videoRef}
                  src={mediaUrls[0]}
                  poster={post.thumbnailUrl}
                  className="w-full h-96 object-cover"
                  playsInline
                  muted={isMuted}
                  onClick={() => setIsPlaying(!isPlaying)}
                />
              ) : (
                <img
                  src={mediaUrls[0]}
                  alt="Post media"
                  className="w-full h-96 object-cover"
                />
              )}
              
              {post.mediaType === 'video' && (
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="bg-black/50 text-white p-2 rounded-full"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="bg-black/50 text-white p-2 rounded-full"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleLike}
                className={`flex items-center space-x-1 transition-colors ${
                  post.isLiked ? 'text-red-500' : 'text-gray-700 dark:text-gray-300 hover:text-red-500'
                }`}
              >
                <Heart className={`w-6 h-6 ${post.isLiked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={openComments}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-500 transition-colors"
              >
                <MessageCircle className="w-6 h-6" />
              </button>
              <button className="text-gray-700 dark:text-gray-300 hover:text-green-500 transition-colors">
                <Share className="w-6 h-6" />
              </button>
            </div>
            <button
              onClick={toggleSave}
              className="text-gray-700 dark:text-gray-300 hover:text-yellow-500 transition-colors"
            >
              <Bookmark className="w-6 h-6" />
            </button>
          </div>

          {/* Stats */}
          <div className="text-sm text-gray-900 dark:text-white mb-2">
            <span className="font-semibold">{post.likesCount.toLocaleString()} likes</span>
          </div>

          {/* Caption */}
          {post.caption && (
            <div className="text-sm text-gray-900 dark:text-white mb-2">
              <span className="font-semibold mr-2">{post.user.fullName}</span>
              {post.caption}
            </div>
          )}

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-sm text-blue-500 hover:text-blue-600 cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Comments preview */}
          {post.commentsCount > 0 && (
            <button
              onClick={openComments}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              View all {post.commentsCount} comments
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  // Stories Component
  const StoriesBar: React.FC<{ storyGroups: StoryGroup[] }> = ({ storyGroups }) => {
    const openStoryViewer = (storyGroup: StoryGroup) => {
      setSelectedStoryGroup(storyGroup);
      setShowStoryViewer(true);
    };

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
        <div className="flex space-x-4 overflow-x-auto">
          {/* Add Story */}
          <div className="flex-shrink-0 text-center">
            <button
              onClick={() => setShowCreateStory(true)}
              className="relative w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800"
            >
              <Plus className="w-8 h-8 text-white" />
            </button>
            <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">Your Story</p>
          </div>

          {/* User Stories */}
          {storyGroups.map((group) => (
            <div key={group.user.id} className="flex-shrink-0 text-center">
              <button
                onClick={() => openStoryViewer(group)}
                className="relative w-16 h-16 rounded-full p-0.5 bg-gradient-to-br from-purple-500 to-pink-500"
              >
                <img
                  src={group.user.profilePicture || '/default-avatar.png'}
                  alt={group.user.fullName}
                  className="w-full h-full rounded-full object-cover border-2 border-white dark:border-gray-800"
                />
              </button>
              <p className="text-xs mt-1 text-gray-600 dark:text-gray-400 truncate w-16">
                {group.user.fullName.split(' ')[0]}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Trending Component
  const TrendingSidebar: React.FC = () => (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <Hash className="w-5 h-5 mr-2" />
        Trending in Study
      </h3>
      <div className="space-y-3">
        {trending?.data?.map((hashtag: any, index: number) => (
          <div key={hashtag.id} className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                #{hashtag.hashtag}
              </p>
              <p className="text-sm text-gray-500">
                {hashtag.postsCount.toLocaleString()} posts
              </p>
            </div>
            <span className="text-sm text-gray-400">#{index + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                StudyGram
              </h1>
              
              {/* Tab Navigation */}
              <div className="flex space-x-1">
                {['feed', 'stories', 'explore'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                      activeTab === tab
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users, hashtags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-full text-sm focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-gray-600 transition-colors w-64"
                />
              </div>

              {/* Create buttons */}
              <button
                onClick={() => setShowCreatePost(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create</span>
              </button>
              
              <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <User className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Content */}
          <div className="lg:col-span-2">
            {activeTab === 'feed' && (
              <>
                {/* Feed Type Filter */}
                <div className="flex space-x-2 mb-6">
                  {['all', 'following', 'study'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFeedType(type as any)}
                      className={`px-4 py-2 rounded-full capitalize transition-colors ${
                        feedType === type
                          ? 'bg-purple-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-purple-300'
                      }`}
                    >
                      {type === 'all' ? 'For You' : type}
                    </button>
                  ))}
                </div>

                {/* Stories */}
                {stories?.data && stories.data.length > 0 && (
                  <StoriesBar storyGroups={stories.data} />
                )}

                {/* Feed */}
                <div>
                  {feedLoading ? (
                    <div className="space-y-6">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-2"></div>
                              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/6"></div>
                            </div>
                          </div>
                          <div className="h-96 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      {feed?.data?.map((post: Post) => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'stories' && (
              <div className="text-center py-12">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Stories Feature
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  View and create 24-hour disappearing stories
                </p>
              </div>
            )}

            {activeTab === 'explore' && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Explore
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Discover new content and trending posts
                </p>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <TrendingSidebar />
            
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Camera className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white">Create Post</span>
                </button>
                <button
                  onClick={() => setShowCreateStory(true)}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white">Add Story</span>
                </button>
              </div>
            </div>

            {/* Study Stats */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Study Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Posts shared</span>
                  <span className="font-semibold text-gray-900 dark:text-white">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Study streak</span>
                  <span className="font-semibold text-gray-900 dark:text-white">0 days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Followers</span>
                  <span className="font-semibold text-gray-900 dark:text-white">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal 
        isOpen={showCreatePost} 
        onClose={() => setShowCreatePost(false)} 
      />

      {/* Create Story Modal */}
      <CreateStoryModal 
        isOpen={showCreateStory} 
        onClose={() => setShowCreateStory(false)} 
      />

      {/* Story Viewer */}
      {showStoryViewer && selectedStoryGroup && (
        <StoryViewer 
          storyGroup={selectedStoryGroup} 
          onClose={() => setShowStoryViewer(false)} 
        />
      )}

      {/* Comments Modal */}
      {showComments && selectedPost && (
        <CommentsModal 
          post={selectedPost} 
          onClose={() => setShowComments(false)} 
        />
      )}
    </div>
  );
};

// Create Post Modal Component
const CreatePostModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [studyRelated, setStudyRelated] = useState(false);
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const queryClient = useQueryClient();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one media file');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('media', file);
      });
      
      formData.append('caption', caption);
      formData.append('location', location);
      formData.append('tags', JSON.stringify(tags));
      formData.append('studyRelated', studyRelated.toString());
      formData.append('subject', subject);
      formData.append('difficulty', difficulty);

      const response = await fetch('/api/social-media/posts', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to create post');

      toast.success('Post created successfully!');
      queryClient.invalidateQueries({ queryKey: ['social-media-feed'] });
      onClose();
      
      // Reset form
      setSelectedFiles([]);
      setCaption('');
      setLocation('');
      setTags([]);
      setStudyRelated(false);
      setSubject('');
      setDifficulty('');
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Post</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Media Files
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="media-upload"
              />
              <label
                htmlFor="media-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <span className="text-gray-600 dark:text-gray-400">
                  Click to upload images or videos
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-500">
                  PNG, JPG, GIF, MP4 up to 50MB
                </span>
              </label>
            </div>
            
            {selectedFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              rows={3}
            />
          </div>

          {/* Location */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Tags */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hashtags
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                placeholder="Add hashtag..."
                className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={addTag}
                className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1"
                >
                  <span>#{tag}</span>
                  <button onClick={() => removeTag(tag)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Study Related */}
          <div className="mb-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={studyRelated}
                onChange={(e) => setStudyRelated(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                This is study-related content
              </span>
            </label>
          </div>

          {studyRelated && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select subject</option>
                  <option value="Math">Math</option>
                  <option value="Science">Science</option>
                  <option value="English">English</option>
                  <option value="History">History</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Languages">Languages</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select difficulty</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isUploading || selectedFiles.length === 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isUploading ? 'Uploading...' : 'Share Post'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Create Story Modal Component
const CreateStoryModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textOverlay, setTextOverlay] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [studyTip, setStudyTip] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const queryClient = useQueryClient();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select a media file');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('media', selectedFile);
      formData.append('textOverlay', textOverlay);
      formData.append('backgroundColor', backgroundColor);
      formData.append('textColor', textColor);
      formData.append('studyTip', studyTip);

      const response = await fetch('/api/social-media/stories', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to create story');

      toast.success('Story created successfully!');
      queryClient.invalidateQueries({ queryKey: ['social-media-stories'] });
      onClose();
      
      // Reset form
      setSelectedFile(null);
      setTextOverlay('');
      setBackgroundColor('#000000');
      setTextColor('#FFFFFF');
      setStudyTip('');
    } catch (error) {
      toast.error('Failed to create story');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Story</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="story-upload"
              />
              <label
                htmlFor="story-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Camera className="w-12 h-12 text-gray-400 mb-4" />
                <span className="text-gray-600 dark:text-gray-400">
                  Upload image or video
                </span>
              </label>
            </div>
            
            {selectedFile && (
              <div className="mt-4">
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Story preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Text Overlay */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Text Overlay
            </label>
            <input
              type="text"
              value={textOverlay}
              onChange={(e) => setTextOverlay(e.target.value)}
              placeholder="Add text to your story..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Background Color
              </label>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Text Color
              </label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
              />
            </div>
          </div>

          {/* Study Tip */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Study Tip (Optional)
            </label>
            <textarea
              value={studyTip}
              onChange={(e) => setStudyTip(e.target.value)}
              placeholder="Share a study tip..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              rows={2}
            />
          </div>

          {/* Submit */}
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isUploading || !selectedFile}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isUploading ? 'Uploading...' : 'Share Story'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Story Viewer Component
const StoryViewer: React.FC<{ storyGroup: StoryGroup; onClose: () => void }> = ({ storyGroup, onClose }) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentStory = storyGroup.stories[currentStoryIndex];

  useEffect(() => {
    if (isPaused) return;

    const duration = currentStory.duration * 1000;
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / duration) * 100;
        if (newProgress >= 100) {
          if (currentStoryIndex < storyGroup.stories.length - 1) {
            setCurrentStoryIndex(prev => prev + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentStoryIndex, isPaused, currentStory.duration, storyGroup.stories.length, onClose]);

  const nextStory = () => {
    if (currentStoryIndex < storyGroup.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex space-x-1 z-10">
        {storyGroup.stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{
                width: index === currentStoryIndex ? `${progress}%` : index < currentStoryIndex ? '100%' : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* User info */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <img
            src={storyGroup.user.profilePicture || '/default-avatar.png'}
            alt={storyGroup.user.fullName}
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <div>
            <h3 className="text-white font-semibold">{storyGroup.user.fullName}</h3>
            <p className="text-white/70 text-sm">
              {new Date(currentStory.createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white p-2 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Story content */}
      <div 
        className="relative w-full max-w-md h-full flex items-center justify-center"
        style={{ backgroundColor: currentStory.backgroundColor }}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {currentStory.mediaType === 'image' ? (
          <img
            src={currentStory.mediaUrl}
            alt="Story"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video
            src={currentStory.mediaUrl}
            autoPlay
            muted
            className="max-w-full max-h-full object-contain"
          />
        )}

        {/* Text overlay */}
        {currentStory.textOverlay && (
          <div
            className="absolute inset-4 flex items-center justify-center text-center"
            style={{ color: currentStory.textColor }}
          >
            <p className="text-2xl font-bold drop-shadow-lg">{currentStory.textOverlay}</p>
          </div>
        )}

        {/* Navigation areas */}
        <button
          onClick={prevStory}
          className="absolute left-0 top-0 w-1/3 h-full z-10"
        />
        <button
          onClick={nextStory}
          className="absolute right-0 top-0 w-1/3 h-full z-10"
        />
      </div>

      {/* Story info */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span className="text-sm">{currentStory.viewsCount}</span>
          </div>
          {currentStory.studyTip && (
            <div className="bg-black/50 px-3 py-2 rounded-lg max-w-xs">
              <p className="text-sm">{currentStory.studyTip}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Comments Modal Component
const CommentsModal: React.FC<{ post: Post; onClose: () => void }> = ({ post, onClose }) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: comments, isLoading } = useQuery({
    queryKey: ['post-comments', post.id],
    queryFn: async () => {
      const response = await fetch(`/api/social-media/posts/${post.id}/comments`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    }
  });

  const submitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/social-media/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: newComment.trim() })
      });

      if (!response.ok) throw new Error('Failed to add comment');

      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Comments</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex space-x-3 animate-pulse">
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {comments?.data?.map((comment: Comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <img
                    src={comment.user.profilePicture || '/default-avatar.png'}
                    alt={comment.user.fullName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {comment.user.fullName}
                      </h4>
                      <p className="text-gray-800 dark:text-gray-200 text-sm">{comment.content}</p>
                    </div>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleTimeString()}
                      </span>
                      <button className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        Like
                      </button>
                      <button className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && submitComment()}
            />
            <button
              onClick={submitComment}
              disabled={isSubmitting || !newComment.trim()}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '...' : 'Post'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SocialMediaPage;