import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, Settings, 
  ThumbsUp, ThumbsDown, Share2, Download, Flag, Heart, MessageCircle, Send, Search, 
  Upload, Filter, Trending, Clock, Eye, Users, PlayCircle, List, Grid, Calendar, 
  BarChart, TrendingUp, Award, BookOpen, Brain, Target, Zap, Star, ChevronDown, 
  ChevronUp, MoreVertical, UserPlus, Bell, BellOff, Bookmark, BookmarkPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

// Types
interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;
  subject?: string;
  difficulty?: string;
  category?: string;
  tags?: string[];
  viewCount: number;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  publishedAt: string;
  channel: {
    id: string;
    handle: string;
    name: string;
    avatarUrl: string;
    isVerified: boolean;
    subscriberCount: number;
  };
  creator: {
    id: string;
    username: string;
    avatar: string;
  };
}

interface Comment {
  id: string;
  content: string;
  timestamp?: number;
  likeCount: number;
  replyCount: number;
  isPinned: boolean;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
}

interface UserInteraction {
  liked: 'like' | 'dislike' | null;
  subscribed: boolean;
}

// Custom Video Player Component
const VideoPlayer: React.FC<{
  src: string;
  poster: string;
  onTimeUpdate?: (time: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}> = ({ src, poster, onTimeUpdate, onPlay, onPause, onEnded }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState('1080p');
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        onPause?.();
      } else {
        videoRef.current.play();
        onPlay?.();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  };

  const handleSeek = (newTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      handleSeek(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleLoadedMetadata = () => setDuration(video.duration);
      const handleEnded = () => {
        setIsPlaying(false);
        onEnded?.();
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('ended', handleEnded);

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, []);

  return (
    <div 
      className="relative bg-black rounded-lg overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full aspect-video"
        onClick={togglePlay}
      />
      
      {/* Play button overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="w-20 h-20 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-all transform hover:scale-110"
          >
            <Play className="w-8 h-8 text-white ml-1" />
          </button>
        </div>
      )}

      {/* Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
          >
            {/* Progress bar */}
            <div className="mb-4">
              <div className="relative h-1 bg-white/30 rounded-full cursor-pointer group/progress">
                <div 
                  className="absolute top-0 left-0 h-full bg-red-600 rounded-full transition-all"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button onClick={togglePlay} className="text-white hover:text-red-500 transition-colors">
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
                
                <button onClick={() => skipTime(-10)} className="text-white hover:text-red-500 transition-colors">
                  <SkipBack className="w-5 h-5" />
                </button>
                
                <button onClick={() => skipTime(10)} className="text-white hover:text-red-500 transition-colors">
                  <SkipForward className="w-5 h-5" />
                </button>

                <div className="flex items-center space-x-2">
                  <button onClick={toggleMute} className="text-white hover:text-red-500 transition-colors">
                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-16 h-1 bg-white/30 rounded-full appearance-none slider"
                  />
                </div>

                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <div className="relative">
                  <select
                    value={playbackRate}
                    onChange={(e) => {
                      const rate = Number(e.target.value);
                      setPlaybackRate(rate);
                      if (videoRef.current) {
                        videoRef.current.playbackRate = rate;
                      }
                    }}
                    className="bg-black/60 text-white text-sm px-2 py-1 rounded border-none outline-none"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={0.75}>0.75x</option>
                    <option value={1}>1x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2x</option>
                  </select>
                </div>

                <div className="relative">
                  <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                    className="bg-black/60 text-white text-sm px-2 py-1 rounded border-none outline-none"
                  >
                    <option value="360p">360p</option>
                    <option value="480p">480p</option>
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                  </select>
                </div>

                <button className="text-white hover:text-red-500 transition-colors">
                  <Settings className="w-5 h-5" />
                </button>

                <button onClick={toggleFullscreen} className="text-white hover:text-red-500 transition-colors">
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Video Card Component
const VideoCard: React.FC<{
  video: Video;
  variant?: 'grid' | 'list';
}> = ({ video, variant = 'grid' }) => {
  const navigate = useNavigate();

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`;
    }
    return `${views} views`;
  };

  if (variant === 'list') {
    return (
      <div 
        className="flex space-x-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-all"
        onClick={() => navigate(`/dashboard/video-platform/watch/${video.id}`)}
      >
        <div className="relative flex-shrink-0">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-40 h-24 object-cover rounded-lg"
          />
          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
            {formatDuration(video.duration)}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">
            {video.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-3">
            {video.description}
          </p>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>{video.channel.name}</span>
            {video.channel.isVerified && <Star className="w-3 h-3 text-blue-500" />}
            <span>•</span>
            <span>{formatViews(video.viewCount)}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true })}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="group cursor-pointer"
      onClick={() => navigate(`/dashboard/video-platform/watch/${video.id}`)}
    >
      <div className="relative mb-3">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full aspect-video object-cover rounded-lg group-hover:rounded-none transition-all duration-200"
        />
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          {formatDuration(video.duration)}
        </div>
        {video.subject && (
          <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
            {video.subject}
          </div>
        )}
      </div>
      <div className="flex space-x-3">
        <img
          src={video.channel.avatarUrl}
          alt={video.channel.name}
          className="w-9 h-9 rounded-full"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
            {video.title}
          </h3>
          <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>{video.channel.name}</span>
            {video.channel.isVerified && <Star className="w-3 h-3 text-blue-500" />}
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>{formatViews(video.viewCount)}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true })}</span>
          </div>
          {video.difficulty && (
            <div className="mt-1">
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                video.difficulty === 'beginner' && "bg-green-100 text-green-800",
                video.difficulty === 'intermediate' && "bg-yellow-100 text-yellow-800",
                video.difficulty === 'advanced' && "bg-orange-100 text-orange-800",
                video.difficulty === 'expert' && "bg-red-100 text-red-800"
              )}>
                {video.difficulty}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Video Platform Page
const VideoPlatformPage: React.FC = () => {
  const { videoId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  // State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  // Queries
  const { data: videoData, isLoading: videoLoading } = useQuery({
    queryKey: ['video', videoId],
    queryFn: () => api.get(`/video-platform/videos/${videoId}`),
    enabled: !!videoId,
  });

  const { data: commentsData } = useQuery({
    queryKey: ['video-comments', videoId],
    queryFn: () => api.get(`/video-platform/videos/${videoId}/comments`),
    enabled: !!videoId,
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['video-search', searchQuery, selectedCategory, sortBy],
    queryFn: () => api.get('/video-platform/search', {
      params: {
        q: searchQuery,
        category: selectedCategory,
        sort: sortBy,
        limit: 20
      }
    }),
    enabled: !!searchQuery,
  });

  const { data: recommendations } = useQuery({
    queryKey: ['video-recommendations'],
    queryFn: () => api.get('/video-platform/recommendations'),
    enabled: !searchQuery && !videoId,
  });

  const { data: trendingVideos } = useQuery({
    queryKey: ['trending-videos'],
    queryFn: () => api.get('/video-platform/trending'),
    enabled: !searchQuery && !videoId,
  });

  // Mutations
  const likeMutation = useMutation({
    mutationFn: (data: { videoId: string; type: 'like' | 'dislike' }) => 
      api.post(`/video-platform/videos/${data.videoId}/like`, { type: data.type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video', videoId] });
      toast.success('Video liked!');
    },
  });

  const commentMutation = useMutation({
    mutationFn: (data: { videoId: string; content: string; timestamp?: number }) =>
      api.post(`/video-platform/videos/${data.videoId}/comments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-comments', videoId] });
      setNewComment('');
      toast.success('Comment added!');
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: (channelId: string) => api.post(`/video-platform/channels/${channelId}/subscribe`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video', videoId] });
      toast.success('Subscription updated!');
    },
  });

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const params = new URLSearchParams();
    params.set('q', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    
    setSearchParams(params);
    navigate({ search: params.toString() });
  };

  const handleLike = (type: 'like' | 'dislike') => {
    if (!videoId) return;
    likeMutation.mutate({ videoId, type });
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoId || !newComment.trim()) return;
    
    commentMutation.mutate({
      videoId,
      content: newComment,
      timestamp: Math.floor(currentTime)
    });
  };

  const handleSubscribe = () => {
    if (!videoData?.channel?.id) return;
    subscribeMutation.mutate(videoData.channel.id);
  };

  const categories = ['education', 'technology', 'science', 'entertainment', 'music', 'gaming', 'sports', 'news'];

  // Watch page layout
  if (videoId && videoData) {
    const { video, userInteraction } = videoData;
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main video player */}
            <div className="lg:col-span-2">
              <VideoPlayer
                src={video.videoUrl}
                poster={video.thumbnailUrl}
                onTimeUpdate={setCurrentTime}
              />
              
              {/* Video info */}
              <div className="mt-4">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {video.title}
                </h1>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>{video.viewCount.toLocaleString()} views</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true })}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <button
                        onClick={() => handleLike('like')}
                        className={cn(
                          "flex items-center space-x-2 px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors",
                          userInteraction?.liked === 'like' && "bg-blue-100 dark:bg-blue-900 text-blue-600"
                        )}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>{video.likeCount}</span>
                      </button>
                      <button
                        onClick={() => handleLike('dislike')}
                        className={cn(
                          "flex items-center space-x-2 px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border-l border-gray-200 dark:border-gray-700",
                          userInteraction?.liked === 'dislike' && "bg-red-100 dark:bg-red-900 text-red-600"
                        )}
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <span>{video.dislikeCount}</span>
                      </button>
                    </div>
                    
                    <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                    
                    <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                      <BookmarkPlus className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>
                
                {/* Channel info */}
                <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <img
                      src={video.channel.avatarUrl}
                      alt={video.channel.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {video.channel.name}
                        </h3>
                        {video.channel.isVerified && <Star className="w-4 h-4 text-blue-500" />}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {video.channel.subscriberCount.toLocaleString()} subscribers
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSubscribe}
                    className={cn(
                      "px-6 py-2 rounded-full font-medium transition-colors",
                      userInteraction?.subscribed
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                        : "bg-red-600 text-white hover:bg-red-700"
                    )}
                  >
                    {userInteraction?.subscribed ? 'Subscribed' : 'Subscribe'}
                  </button>
                </div>
                
                {/* Video description */}
                <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {video.subject && (
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full">
                        {video.subject}
                      </span>
                    )}
                    {video.difficulty && (
                      <span className={cn(
                        "px-3 py-1 text-sm rounded-full",
                        video.difficulty === 'beginner' && "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
                        video.difficulty === 'intermediate' && "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
                        video.difficulty === 'advanced' && "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200",
                        video.difficulty === 'expert' && "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                      )}>
                        {video.difficulty}
                      </span>
                    )}
                    {video.category && (
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-sm rounded-full">
                        {video.category}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {video.description}
                  </p>
                </div>

                {/* Comments section */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {video.commentCount} Comments
                    </h3>
                    <button
                      onClick={() => setShowComments(!showComments)}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      {showComments ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>

                  {showComments && (
                    <div className="space-y-4">
                      {/* Add comment form */}
                      <form onSubmit={handleComment} className="flex space-x-3">
                        <img
                          src={user?.avatar || '/default-avatar.png'}
                          alt={user?.username || 'User'}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a public comment..."
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            rows={3}
                          />
                          <div className="flex justify-end space-x-2 mt-2">
                            <button
                              type="button"
                              onClick={() => setNewComment('')}
                              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={!newComment.trim() || commentMutation.isPending}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Comment
                            </button>
                          </div>
                        </div>
                      </form>

                      {/* Comments list */}
                      <div className="space-y-4">
                        {commentsData?.comments?.map((comment: Comment) => (
                          <div key={comment.id} className="flex space-x-3">
                            <img
                              src={comment.user.avatar}
                              alt={comment.user.username}
                              className="w-10 h-10 rounded-full"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {comment.user.username}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                </span>
                                {comment.timestamp && (
                                  <span className="text-sm text-blue-600">
                                    {Math.floor(comment.timestamp / 60)}:{(comment.timestamp % 60).toString().padStart(2, '0')}
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 mb-2">
                                {comment.content}
                              </p>
                              <div className="flex items-center space-x-4">
                                <button className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                  <ThumbsUp className="w-4 h-4" />
                                  <span>{comment.likeCount}</span>
                                </button>
                                <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                  Reply
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar with related videos */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Up Next</h3>
              {recommendations?.recommendations?.slice(0, 10).map((rec: any) => (
                <VideoCard key={rec.video.id} video={rec.video} variant="list" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main platform page (browse/search)
  const videosToShow = searchQuery 
    ? searchResults?.results 
    : recommendations?.recommendations?.map((rec: any) => rec.video) || trendingVideos?.trending || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">StudyTube</h1>
            <button
              onClick={() => navigate('/dashboard/video-platform/upload')}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Video</span>
            </button>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search educational videos..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </form>

          {/* Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="relevance">Relevance</option>
                <option value="upload_date">Upload Date</option>
                <option value="view_count">View Count</option>
                <option value="rating">Rating</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  viewMode === 'grid' ? "bg-blue-100 dark:bg-blue-900 text-blue-600" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  viewMode === 'list' ? "bg-blue-100 dark:bg-blue-900 text-blue-600" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      <option value="">All Subjects</option>
                      <option value="mathematics">Mathematics</option>
                      <option value="science">Science</option>
                      <option value="history">History</option>
                      <option value="programming">Programming</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Difficulty
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      <option value="">All Levels</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Duration
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      <option value="">Any Duration</option>
                      <option value="short">Short (Under 5 min)</option>
                      <option value="medium">Medium (5-20 min)</option>
                      <option value="long">Long (20+ min)</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Videos Grid/List */}
        {(searchLoading || videoLoading) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-gray-300 dark:bg-gray-700 rounded-lg mb-3"></div>
                <div className="flex space-x-3">
                  <div className="w-9 h-9 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          )}>
            {videosToShow?.map((video: Video) => (
              <VideoCard key={video.id} video={video} variant={viewMode} />
            ))}
          </div>
        )}

        {videosToShow?.length === 0 && !searchLoading && (
          <div className="text-center py-12">
            <PlayCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No videos found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search criteria or explore our trending videos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlatformPage;