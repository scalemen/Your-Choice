import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Download,
  Flag,
  Heart,
  MessageCircle,
  Send,
  Search,
  Upload,
  Filter,
  Trending,
  Clock,
  Eye,
  Users,
  PlayCircle,
  List,
  Grid,
  Calendar,
  BarChart,
  TrendingUp,
  Award,
  BookOpen,
  Brain,
  Target,
  Zap,
  Star,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  UserPlus,
  Bell,
  BellOff
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
  category: string;
  tags: string[];
  viewCount: number;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  publishedAt: string;
  isEducational: boolean;
  subject?: string;
  difficulty?: string;
  learningObjectives?: string[];
  channel: {
    id: string;
    handle: string;
    name: string;
    avatarUrl: string;
    subscriberCount: number;
    isVerified: boolean;
  };
}

interface Comment {
  id: string;
  content: string;
  timestamp?: number;
  likeCount: number;
  replyCount: number;
  isPinned: boolean;
  isHearted: boolean;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl: string;
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
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState('auto');
  const [playbackRate, setPlaybackRate] = useState(1);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
        onPause?.();
      } else {
        videoRef.current.play();
        onPlay?.();
      }
      setPlaying(!playing);
    }
  }, [playing, onPause, onPlay]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  }, [onTimeUpdate]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setMuted(newVolume === 0);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  }, [muted]);

  const toggleFullscreen = useCallback(() => {
    if (!fullscreen) {
      videoRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setFullscreen(!fullscreen);
  }, [fullscreen]);

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      handleSeek(newTime);
    }
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('ended', () => {
        setPlaying(false);
        onEnded?.();
      });

      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [handleTimeUpdate, handleLoadedMetadata, onEnded]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target === document.body) {
        switch (e.key) {
          case ' ':
            e.preventDefault();
            togglePlay();
            break;
          case 'ArrowLeft':
            e.preventDefault();
            skip(-10);
            break;
          case 'ArrowRight':
            e.preventDefault();
            skip(10);
            break;
          case 'm':
            e.preventDefault();
            toggleMute();
            break;
          case 'f':
            e.preventDefault();
            toggleFullscreen();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [togglePlay, skip, toggleMute, toggleFullscreen]);

  return (
    <div 
      className="relative bg-black rounded-lg overflow-hidden group"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full aspect-video"
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      
      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none"
          >
            {/* Play/Pause Button - Center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={togglePlay}
                className="bg-white/20 backdrop-blur-sm rounded-full p-4 hover:bg-white/30 transition-all"
              >
                {playing ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </motion.button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-white/30 rounded-full h-1 cursor-pointer"
                     onClick={(e) => {
                       const rect = e.currentTarget.getBoundingClientRect();
                       const x = e.clientX - rect.left;
                       const percentage = x / rect.width;
                       handleSeek(percentage * duration);
                     }}>
                  <div 
                    className="bg-red-500 h-1 rounded-full transition-all"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-4">
                  <button onClick={() => skip(-10)} className="hover:text-red-400 transition-colors">
                    <SkipBack className="w-5 h-5" />
                  </button>
                  
                  <button onClick={togglePlay} className="hover:text-red-400 transition-colors">
                    {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  
                  <button onClick={() => skip(10)} className="hover:text-red-400 transition-colors">
                    <SkipForward className="w-5 h-5" />
                  </button>

                  <div className="flex items-center space-x-2">
                    <button onClick={toggleMute} className="hover:text-red-400 transition-colors">
                      {muted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={muted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <span className="text-sm font-mono">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center space-x-4">
                  <select 
                    value={playbackRate} 
                    onChange={(e) => {
                      const rate = parseFloat(e.target.value);
                      setPlaybackRate(rate);
                      if (videoRef.current) videoRef.current.playbackRate = rate;
                    }}
                    className="bg-white/20 text-white rounded px-2 py-1 text-sm"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={0.75}>0.75x</option>
                    <option value={1}>Normal</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2x</option>
                  </select>

                  <select 
                    value={quality} 
                    onChange={(e) => setQuality(e.target.value)}
                    className="bg-white/20 text-white rounded px-2 py-1 text-sm"
                  >
                    <option value="auto">Auto</option>
                    <option value="1080p">1080p</option>
                    <option value="720p">720p</option>
                    <option value="480p">480p</option>
                    <option value="360p">360p</option>
                  </select>

                  <button onClick={toggleFullscreen} className="hover:text-red-400 transition-colors">
                    {fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
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

// Video Card Component
const VideoCard: React.FC<{ video: Video; variant?: 'grid' | 'list' }> = ({ video, variant = 'grid' }) => {
  const navigate = useNavigate();

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  if (variant === 'list') {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="flex space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg hover:shadow-lg transition-all cursor-pointer"
        onClick={() => navigate(`/dashboard/video-platform/watch/${video.id}`)}
      >
        <div className="relative flex-shrink-0">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-40 h-24 object-cover rounded-lg"
          />
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 rounded">
            {formatDuration(video.duration)}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
            {video.title}
          </h3>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <img
              src={video.channel.avatarUrl}
              alt={video.channel.name}
              className="w-6 h-6 rounded-full"
            />
            <span className="font-medium">{video.channel.name}</span>
            {video.channel.isVerified && (
              <Award className="w-4 h-4 text-blue-500" />
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{formatViews(video.viewCount)} views</span>
            </span>
            <span>{formatDistanceToNow(new Date(video.publishedAt))} ago</span>
            {video.isEducational && (
              <span className="flex items-center space-x-1 text-green-600">
                <BookOpen className="w-4 h-4" />
                <span>{video.subject}</span>
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer"
      onClick={() => navigate(`/dashboard/video-platform/watch/${video.id}`)}
    >
      <div className="relative">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full aspect-video object-cover"
        />
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          {formatDuration(video.duration)}
        </div>
        {video.isEducational && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
            <BookOpen className="w-3 h-3" />
            <span>Educational</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
          {video.title}
        </h3>
        
        <div className="flex items-center space-x-2 mb-2">
          <img
            src={video.channel.avatarUrl}
            alt={video.channel.name}
            className="w-8 h-8 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                {video.channel.name}
              </span>
              {video.channel.isVerified && (
                <Award className="w-4 h-4 text-blue-500 flex-shrink-0" />
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center space-x-1">
            <Eye className="w-4 h-4" />
            <span>{formatViews(video.viewCount)} views</span>
          </span>
          <span>{formatDistanceToNow(new Date(video.publishedAt))} ago</span>
        </div>
        
        {video.isEducational && video.subject && (
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
              {video.subject}
            </span>
            {video.difficulty && (
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full">
                {video.difficulty}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
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
    queryFn: () => api.get(`/video-platform/videos/${videoId}`).then(res => res.data),
    enabled: !!videoId
  });

  const { data: commentsData } = useQuery({
    queryKey: ['video-comments', videoId],
    queryFn: () => api.get(`/video-platform/videos/${videoId}/comments`).then(res => res.data),
    enabled: !!videoId
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['video-search', searchQuery, selectedCategory, sortBy],
    queryFn: () => api.get('/video-platform/search', {
      params: { q: searchQuery, category: selectedCategory, sortBy }
    }).then(res => res.data),
    enabled: !!searchQuery
  });

  const { data: recommendations } = useQuery({
    queryKey: ['video-recommendations', user?.id],
    queryFn: () => api.get('/video-platform/recommendations').then(res => res.data),
    enabled: !!user && !videoId
  });

  const { data: trendingVideos } = useQuery({
    queryKey: ['trending-videos'],
    queryFn: () => api.get('/video-platform/search?sortBy=trending').then(res => res.data),
    enabled: !videoId && !searchQuery
  });

  // Mutations
  const likeMutation = useMutation({
    mutationFn: ({ videoId, type }: { videoId: string; type: 'like' | 'dislike' }) =>
      api.post(`/video-platform/videos/${videoId}/like`, { type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video', videoId] });
      toast.success('Reaction updated!');
    }
  });

  const commentMutation = useMutation({
    mutationFn: ({ videoId, content }: { videoId: string; content: string }) =>
      api.post(`/video-platform/videos/${videoId}/comments`, { content, timestamp: Math.floor(currentTime) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-comments', videoId] });
      setNewComment('');
      toast.success('Comment added!');
    }
  });

  const subscribeMutation = useMutation({
    mutationFn: (channelId: string) =>
      api.post(`/video-platform/channels/${channelId}/subscribe`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video', videoId] });
      toast.success('Subscription updated!');
    }
  });

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery, category: selectedCategory, sort: sortBy });
      navigate(`/dashboard/video-platform?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLike = (type: 'like' | 'dislike') => {
    if (videoId) {
      likeMutation.mutate({ videoId, type });
    }
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() && videoId) {
      commentMutation.mutate({ videoId, content: newComment });
    }
  };

  const handleSubscribe = () => {
    if (videoData?.video?.channel?.id) {
      subscribeMutation.mutate(videoData.video.channel.id);
    }
  };

  const categories = [
    'education', 'technology', 'science', 'entertainment', 
    'music', 'gaming', 'sports', 'news'
  ];

  // Watch page layout
  if (videoId && videoData) {
    const { video, userInteraction, recommendations } = videoData;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Video Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Player */}
              <VideoPlayer
                src={video.videoUrl}
                poster={video.thumbnailUrl}
                onTimeUpdate={setCurrentTime}
                onPlay={() => console.log('Video started playing')}
                onPause={() => console.log('Video paused')}
                onEnded={() => console.log('Video ended')}
              />

              {/* Video Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {video.title}
                </h1>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{video.viewCount.toLocaleString()} views</span>
                    </span>
                    <span>{formatDistanceToNow(new Date(video.publishedAt))} ago</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleLike('like')}
                      className={cn(
                        "flex items-center space-x-2 px-4 py-2 rounded-full transition-all",
                        userInteraction?.liked === 'like'
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
                      )}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>{video.likeCount}</span>
                    </button>

                    <button
                      onClick={() => handleLike('dislike')}
                      className={cn(
                        "flex items-center space-x-2 px-4 py-2 rounded-full transition-all",
                        userInteraction?.liked === 'dislike'
                          ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
                      )}
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span>{video.dislikeCount}</span>
                    </button>

                    <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 transition-all">
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </button>

                    <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 transition-all">
                      <Download className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>

                {/* Channel Info */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <img
                      src={video.channel.avatarUrl}
                      alt={video.channel.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {video.channel.name}
                        </h3>
                        {video.channel.isVerified && (
                          <Award className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {video.channel.subscriberCount.toLocaleString()} subscribers
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSubscribe}
                      className={cn(
                        "flex items-center space-x-2 px-6 py-2 rounded-full font-medium transition-all",
                        userInteraction?.subscribed
                          ? "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                          : "bg-red-600 text-white hover:bg-red-700"
                      )}
                    >
                      {userInteraction?.subscribed ? (
                        <>
                          <Bell className="w-4 h-4" />
                          <span>Subscribed</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>Subscribe</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Description */}
                {video.description && (
                  <div className="mt-4">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {video.description}
                    </p>
                  </div>
                )}

                {/* Educational Info */}
                {video.isEducational && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <BookOpen className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-green-800 dark:text-green-400">
                        Educational Content
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {video.subject && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Subject:</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">{video.subject}</span>
                        </div>
                      )}
                      {video.difficulty && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Difficulty:</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">{video.difficulty}</span>
                        </div>
                      )}
                    </div>
                    {video.learningObjectives && video.learningObjectives.length > 0 && (
                      <div className="mt-3">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Learning Objectives:</span>
                        <ul className="mt-1 list-disc list-inside text-gray-600 dark:text-gray-400">
                          {video.learningObjectives.map((objective, index) => (
                            <li key={index}>{objective}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {video.commentCount} Comments
                  </h3>
                  <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    {showComments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <span>{showComments ? 'Hide' : 'Show'} Comments</span>
                  </button>
                </div>

                {showComments && (
                  <div className="space-y-6">
                    {/* Add Comment */}
                    <form onSubmit={handleComment} className="flex space-x-4">
                      <img
                        src={user?.avatarUrl || '/default-avatar.png'}
                        alt={user?.username || 'User'}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                          rows={3}
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            type="submit"
                            disabled={!newComment.trim() || commentMutation.isPending}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Send className="w-4 h-4" />
                            <span>Comment</span>
                          </button>
                        </div>
                      </div>
                    </form>

                    {/* Comments List */}
                    <div className="space-y-4">
                      {commentsData?.comments?.map((comment: Comment) => (
                        <div key={comment.id} className="flex space-x-4">
                          <img
                            src={comment.user.avatarUrl}
                            alt={comment.user.username}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {comment.user.username}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDistanceToNow(new Date(comment.createdAt))} ago
                              </span>
                              {comment.timestamp && (
                                <span className="text-sm text-blue-600 dark:text-blue-400">
                                  @{Math.floor(comment.timestamp / 60)}:{(comment.timestamp % 60).toString().padStart(2, '0')}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 mb-2">
                              {comment.content}
                            </p>
                            <div className="flex items-center space-x-4 text-sm">
                              <button className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                                <ThumbsUp className="w-4 h-4" />
                                <span>{comment.likeCount}</span>
                              </button>
                              <button className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                                Reply
                              </button>
                              {comment.isPinned && (
                                <span className="text-blue-600 dark:text-blue-400 flex items-center space-x-1">
                                  <Star className="w-4 h-4" />
                                  <span>Pinned</span>
                                </span>
                              )}
                              {comment.isHearted && (
                                <Heart className="w-4 h-4 text-red-500 fill-current" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar - Recommendations */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Up Next
              </h3>
              <div className="space-y-4">
                {recommendations?.map((video: Video) => (
                  <VideoCard key={video.id} video={video} variant="list" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main platform page (browse/search)
  const videosToShow = searchQuery ? searchResults?.results : 
                     recommendations?.recommendations || trendingVideos?.results || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              StudyTube
            </h1>
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            >
              Search
            </button>
          </form>

          {/* Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>

              {!searchQuery && (
                <div className="flex items-center space-x-2">
                  <Trending className="w-5 h-5 text-red-500" />
                  <span className="font-medium text-gray-900 dark:text-white">Trending</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 rounded",
                  viewMode === 'grid' ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded",
                  viewMode === 'list' ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <List className="w-4 h-4" />
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
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="upload_date">Upload Date</option>
                      <option value="view_count">View Count</option>
                      <option value="rating">Rating</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Duration
                    </label>
                    <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option value="">Any Duration</option>
                      <option value="short">Short (< 4 minutes)</option>
                      <option value="medium">Medium (4-20 minutes)</option>
                      <option value="long">Long (> 20 minutes)</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Videos Grid/List */}
        {(searchLoading || videoLoading) ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className={cn(
            "gap-6",
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
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
              {searchQuery ? 'No videos found' : 'No videos available'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery 
                ? 'Try adjusting your search terms or filters' 
                : 'Upload some videos to get started'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlatformPage;