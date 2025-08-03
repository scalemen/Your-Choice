import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { 
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Search, Plus, 
  Camera, Video, MapPin, Users, Home, Compass, User,
  Play, Pause, X, ChevronLeft, ChevronRight, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

// Mock API and utilities since the actual files don't exist in this build
const api = {
  get: async (url: string) => ({ data: { posts: [], stories: [], hashtags: [] } }),
  post: async (url: string, data?: any, config?: any) => ({ data: {} })
};

const useAuthStore = () => ({ 
  user: { 
    id: '1', 
    username: 'testuser', 
    profilePicture: null 
  } 
});

const cn = (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(' ');

// ==================== INTERFACES ====================

interface StudyGramPost {
  id: string;
  userId: string;
  content: string;
  mediaUrls: string[];
  mediaType: 'image' | 'video' | 'mixed';
  hashtags: string[];
  mentions: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    profilePicture?: string;
    isVerified: boolean;
  };
  location?: string;
  isEdited: boolean;
}

interface StudyGramStory {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  content?: string;
  expiresAt: string;
  isViewed: boolean;
  viewsCount: number;
  createdAt: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    profilePicture?: string;
  };
}

// StudyGramComment interface removed as unused

// ==================== COMPONENTS ====================

const StoryRing: React.FC<{ story: StudyGramStory; onClick: () => void }> = ({ story, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative flex flex-col items-center space-y-1 cursor-pointer"
      onClick={onClick}
    >
      <div className={cn(
        "w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr",
        story.isViewed 
          ? "from-gray-300 to-gray-400" 
          : "from-purple-500 to-pink-500"
      )}>
        <div className="w-full h-full rounded-full bg-white p-0.5">
          <img
            src={story.user.profilePicture || '/default-avatar.png'}
            alt={story.user.username}
            className="w-full h-full rounded-full object-cover"
          />
        </div>
      </div>
      <span className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-[60px]">
        {story.user.username}
      </span>
    </motion.div>
  );
};

const PostCard: React.FC<{ post: StudyGramPost; onLike: (postId: string) => void; onSave: (postId: string) => void; onComment: (postId: string) => void }> = ({ 
  post, onLike, onSave, onComment 
}) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const nextMedia = () => {
    setCurrentMediaIndex((prev) => (prev + 1) % post.mediaUrls.length);
  };

  const prevMedia = () => {
    setCurrentMediaIndex((prev) => (prev - 1 + post.mediaUrls.length) % post.mediaUrls.length);
  };

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatHashtags = (content: string, hashtags: string[]) => {
    let formattedContent = content;
    hashtags.forEach(tag => {
      formattedContent = formattedContent.replace(
        new RegExp(`#${tag}`, 'gi'),
        `<span class="text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline">#${tag}</span>`
      );
    });
    return formattedContent;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-6"
    >
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <img
            src={post.user.profilePicture || '/default-avatar.png'}
            alt={post.user.username}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <div className="flex items-center space-x-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {post.user.username}
              </h3>
              {post.user.isVerified && (
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{formatDistanceToNow(new Date(post.createdAt))} ago</span>
              {post.location && (
                <>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{post.location}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
          <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Media Content */}
      {post.mediaUrls.length > 0 && (
        <div className="relative bg-black">
          <div className="aspect-square relative overflow-hidden">
            {post.mediaType === 'video' || post.mediaUrls[currentMediaIndex]?.includes('.mp4') ? (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  src={post.mediaUrls[currentMediaIndex]}
                  className="w-full h-full object-cover"
                  loop
                  muted
                  playsInline
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                <button
                  onClick={toggleVideoPlay}
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 hover:bg-opacity-30 transition-all"
                >
                  {isPlaying ? (
                    <Pause className="w-12 h-12 text-white opacity-80" />
                  ) : (
                    <Play className="w-12 h-12 text-white opacity-80" />
                  )}
                </button>
              </div>
            ) : (
              <img
                src={post.mediaUrls[currentMediaIndex]}
                alt="Post content"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Media Navigation */}
          {post.mediaUrls.length > 1 && (
            <>
              <button
                onClick={prevMedia}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextMedia}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              {/* Media Indicators */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {post.mediaUrls.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full",
                      index === currentMediaIndex ? "bg-white" : "bg-white bg-opacity-50"
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onLike(post.id)}
              className="flex items-center space-x-2"
            >
              <Heart className={cn(
                "w-6 h-6",
                post.isLiked ? "fill-red-500 text-red-500" : "text-gray-700 dark:text-gray-300"
              )} />
            </motion.button>
            <button
              onClick={() => onComment(post.id)}
              className="flex items-center space-x-2"
            >
              <MessageCircle className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
            <button className="flex items-center space-x-2">
              <Send className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onSave(post.id)}
          >
            <Bookmark className={cn(
              "w-6 h-6",
              post.isSaved ? "fill-gray-700 text-gray-700 dark:fill-gray-300 dark:text-gray-300" : "text-gray-700 dark:text-gray-300"
            )} />
          </motion.button>
        </div>

        {/* Like Count */}
        {post.likesCount > 0 && (
          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            {post.likesCount.toLocaleString()} {post.likesCount === 1 ? 'like' : 'likes'}
          </div>
        )}

        {/* Caption */}
        {post.content && (
          <div className="text-sm text-gray-900 dark:text-white">
            <span className="font-semibold mr-2">{post.user.username}</span>
            <span
              dangerouslySetInnerHTML={{
                __html: showFullCaption 
                  ? formatHashtags(post.content, post.hashtags)
                  : formatHashtags(post.content.slice(0, 100) + (post.content.length > 100 ? '...' : ''), post.hashtags)
              }}
            />
            {post.content.length > 100 && (
              <button
                onClick={() => setShowFullCaption(!showFullCaption)}
                className="text-gray-500 dark:text-gray-400 ml-1"
              >
                {showFullCaption ? 'less' : 'more'}
              </button>
            )}
          </div>
        )}

        {/* Comments Preview */}
        {post.commentsCount > 0 && (
          <button
            onClick={() => onComment(post.id)}
            className="text-sm text-gray-500 dark:text-gray-400 mt-2 hover:text-gray-700 dark:hover:text-gray-300"
          >
            View all {post.commentsCount} comments
          </button>
        )}

        <div className="text-xs text-gray-400 dark:text-gray-500 mt-2 uppercase tracking-wide">
          {formatDistanceToNow(new Date(post.createdAt))} ago
        </div>
      </div>
    </motion.div>
  );
};

const CreatePostModal: React.FC<{ isOpen: boolean; onClose: () => void; onPost: (data: any) => void }> = ({ 
  isOpen, onClose, onPost 
}) => {
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 10) {
      toast.error('Maximum 10 files allowed');
      return;
    }

    setSelectedFiles(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && selectedFiles.length === 0) {
      toast.error('Please add content or media');
      return;
    }

    const formData = new FormData();
    formData.append('content', content);
    if (location) formData.append('location', location);
    selectedFiles.forEach(file => formData.append('media', file));

    try {
      await onPost(formData);
      setContent('');
      setSelectedFiles([]);
      setPreviews([]);
      setLocation('');
      onClose();
      toast.success('Post created successfully!');
    } catch (error) {
      toast.error('Failed to create post');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create new post</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <div className="p-4 max-h-[70vh] overflow-y-auto">
            {/* User Info */}
            <div className="flex items-center space-x-3 mb-4">
              <img
                src={user?.profilePicture || '/default-avatar.png'}
                alt={user?.username}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{user?.username}</h3>
              </div>
            </div>

            {/* Content Input */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={4}
              maxLength={2200}
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {content.length}/2200
            </div>

            {/* Location Input */}
            <div className="mt-4">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location (optional)"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Media Previews */}
            {previews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {previews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Media Upload */}
            <div className="mt-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center space-y-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <Camera className="w-8 h-8" />
                <span>Add photos/videos</span>
                <span className="text-xs">Up to 10 files</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSubmit}
              disabled={!content.trim() && selectedFiles.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Share
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ==================== MAIN COMPONENT ====================

const StudyGramPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // State
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'feed' | 'explore' | 'profile'>('feed');

  // Queries
  const { data: feedData, isLoading: feedLoading, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['studygram-feed'],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await api.get(`/studygram/feed?page=${pageParam}&limit=10`);
      return response.data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: any, pages) => (lastPage as any).hasMore ? pages.length : undefined,
    enabled: !!user
  });

  const { data: storiesData } = useQuery({
    queryKey: ['studygram-stories'],
    queryFn: async () => {
      const response = await api.get('/studygram/stories');
      return response.data;
    },
    enabled: !!user
  });

  const { data: trendingHashtags } = useQuery({
    queryKey: ['studygram-trending-hashtags'],
    queryFn: async () => {
      const response = await api.get('/studygram/hashtags/trending');
      return response.data;
    },
    enabled: !!user
  });

  // Mutations
  const createPostMutation = useMutation({
    mutationFn: async (postData: FormData) => {
      const response = await api.post('/studygram/posts', postData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studygram-feed'] });
    }
  });

  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await api.post(`/studygram/posts/${postId}/like`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studygram-feed'] });
    }
  });

  const savePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await api.post(`/studygram/posts/${postId}/save`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studygram-feed'] });
    }
  });

  // Handlers
  const handleLike = useCallback((postId: string) => {
    likePostMutation.mutate(postId);
  }, [likePostMutation]);

  const handleSave = useCallback((postId: string) => {
    savePostMutation.mutate(postId);
  }, [savePostMutation]);

  const handleComment = useCallback((postId: string) => {
    navigate(`/studygram/post/${postId}`);
  }, [navigate]);

  const handleCreatePost = useCallback((postData: FormData) => {
    return createPostMutation.mutateAsync(postData);
  }, [createPostMutation]);

  // Get all posts from infinite query
  const posts = feedData?.pages?.flatMap((page: any) => page.posts) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">StudyGram</h1>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search StudyGram..."
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-64"
                />
              </div>

              {/* Create Post Button */}
              <button
                onClick={() => setShowCreatePost(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>

              {/* Navigation */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('feed')}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    activeTab === 'feed' ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <Home className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveTab('explore')}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    activeTab === 'explore' ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <Compass className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    activeTab === 'profile' ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <User className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Stories Section */}
            {storiesData?.stories?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
                <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
                                     {storiesData.stories.map((story: StudyGramStory) => (
                     <StoryRing
                       key={story.id}
                       story={story}
                       onClick={() => {}}
                     />
                   ))}
                </div>
              </div>
            )}

            {/* Posts Feed */}
            <div className="space-y-6">
              {feedLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : posts.length > 0 ? (
                <>
                  {posts.map((post: StudyGramPost) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onLike={handleLike}
                      onSave={handleSave}
                      onComment={handleComment}
                    />
                  ))}
                  
                  {hasNextPage && (
                    <div className="flex justify-center py-4">
                      <button
                        onClick={() => fetchNextPage()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                      >
                        Load More
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No posts yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Start following others or create your first post!
                  </p>
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Create Post
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Hashtags */}
            {trendingHashtags?.hashtags?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                  Trending
                </h3>
                <div className="space-y-2">
                  {trendingHashtags.hashtags.slice(0, 5).map((hashtag: any) => (
                    <div key={hashtag.tag} className="flex items-center justify-between">
                      <span className="text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline">
                        #{hashtag.tag}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {hashtag.count} posts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Camera className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">Create Post</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Video className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">Create Story</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">Find Friends</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onPost={handleCreatePost}
      />
    </div>
  );
};

export default StudyGramPage;