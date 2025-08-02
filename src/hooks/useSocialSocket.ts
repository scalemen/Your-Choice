import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

interface SocialSocketEvents {
  // Post events
  'post:new': (data: any) => void;
  'post:liked': (data: any) => void;
  'post:comment': (data: any) => void;
  'notification:new': (data: any) => void;
  
  // Story events
  'story:viewed': (data: any) => void;
  
  // Follow events
  'follower:new': (data: any) => void;
  
  // Message events
  'message:new': (data: any) => void;
  'typing:update': (data: any) => void;
  
  // Presence events
  'user:presence': (data: any) => void;
}

export const useSocialSocket = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const socket = useRef<Socket | null>(null);
  const eventListeners = useRef<Map<string, Function[]>>(new Map());

  const connect = useCallback(() => {
    if (!user?.id || socket.current?.connected) return;

    console.log('🔌 Connecting to social media socket...');
    
    socket.current = io('/social-media', {
      auth: {
        token: localStorage.getItem('token'),
        userId: user.id
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      retries: 3
    });

    socket.current.on('connect', () => {
      console.log('✅ Connected to social media socket');
      toast.success('Connected to social features');
    });

    socket.current.on('disconnect', () => {
      console.log('❌ Disconnected from social media socket');
      toast.error('Disconnected from social features');
    });

    socket.current.on('connect_error', (error) => {
      console.error('❌ Social socket connection error:', error);
      toast.error('Failed to connect to social features');
    });

    // Set up default event listeners
    setupDefaultListeners();

    return socket.current;
  }, [user?.id]);

  const disconnect = useCallback(() => {
    if (socket.current) {
      console.log('🔌 Disconnecting from social media socket...');
      socket.current.disconnect();
      socket.current = null;
      eventListeners.current.clear();
    }
  }, []);

  const setupDefaultListeners = useCallback(() => {
    if (!socket.current) return;

    // Real-time post updates
    socket.current.on('post:new', (data) => {
      console.log('📝 New post received:', data);
      queryClient.invalidateQueries({ queryKey: ['social-media-feed'] });
      
      if (data.studyRelated) {
        toast.success(`New study post from ${data.user?.fullName}`, {
          duration: 4000,
        });
      }
    });

    // Real-time like updates
    socket.current.on('post:likes', (data) => {
      console.log('👍 Post likes updated:', data);
      queryClient.setQueryData(['social-media-feed'], (oldData: any) => {
        if (!oldData?.data) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.map((post: any) => 
            post.id === data.postId 
              ? { ...post, likesCount: data.count }
              : post
          )
        };
      });
    });

    // Real-time comment updates
    socket.current.on('post:comment', (data) => {
      console.log('💬 New comment received:', data);
      queryClient.invalidateQueries({ 
        queryKey: ['post-comments', data.postId] 
      });
      
      // Update post comments count
      queryClient.setQueryData(['social-media-feed'], (oldData: any) => {
        if (!oldData?.data) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.map((post: any) => 
            post.id === data.postId 
              ? { ...post, commentsCount: post.commentsCount + 1 }
              : post
          )
        };
      });
    });

    // Real-time notifications
    socket.current.on('notification:new', (data) => {
      console.log('🔔 New notification:', data);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      // Show toast notification
      const message = data.message || `${data.fromUser?.fullName} ${data.type}d your post`;
      toast(message, {
        icon: getNotificationIcon(data.type),
        duration: 5000,
      });
    });

    // Real-time story views
    socket.current.on('story:viewed', (data) => {
      console.log('👁️ Story viewed:', data);
      queryClient.invalidateQueries({ queryKey: ['story-views', data.storyId] });
    });

    // Real-time followers
    socket.current.on('follower:new', (data) => {
      console.log('👥 New follower:', data);
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
    });

    // Real-time messages
    socket.current.on('message:new', (data) => {
      console.log('📨 New message:', data);
      queryClient.invalidateQueries({ 
        queryKey: ['conversation', data.conversationId] 
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      // Show message notification if not in current conversation
      const currentPath = window.location.pathname;
      if (!currentPath.includes(`/messages/${data.conversationId}`)) {
        toast(`New message from ${data.sender?.fullName}`, {
          icon: '💬',
          duration: 4000,
        });
      }
    });

    // Real-time typing indicators
    socket.current.on('typing:update', (data) => {
      console.log('⌨️ Typing update:', data);
      // This would be handled by message components
    });

    // Real-time presence updates
    socket.current.on('user:presence', (data) => {
      console.log('🟢 User presence update:', data);
      queryClient.setQueryData(['user-presence', data.userId], data);
    });

  }, [queryClient]);

  const emit = useCallback((event: string, data?: any) => {
    if (socket.current?.connected) {
      console.log(`📤 Emitting ${event}:`, data);
      socket.current.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }, []);

  const on = useCallback(<K extends keyof SocialSocketEvents>(
    event: K,
    callback: SocialSocketEvents[K]
  ) => {
    if (!socket.current) return;

    socket.current.on(event, callback);

    // Track listener for cleanup
    if (!eventListeners.current.has(event)) {
      eventListeners.current.set(event, []);
    }
    eventListeners.current.get(event)!.push(callback);

    return () => {
      socket.current?.off(event, callback);
      const listeners = eventListeners.current.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }, []);

  const off = useCallback((event: string, callback?: Function) => {
    if (socket.current) {
      if (callback) {
        socket.current.off(event, callback);
      } else {
        socket.current.off(event);
      }
    }
  }, []);

  // Social media specific helper functions
  const likePost = useCallback((postId: string, likeType: string = 'like') => {
    emit('post:like', { postId, likeType });
  }, [emit]);

  const commentOnPost = useCallback((postId: string, content: string, parentCommentId?: string) => {
    emit('post:comment', { postId, content, parentCommentId });
  }, [emit]);

  const followUser = useCallback((userId: string, action: 'follow' | 'unfollow') => {
    emit('user:follow', { userId, action });
  }, [emit]);

  const viewStory = useCallback((storyId: string, userId: string) => {
    emit('story:view', { storyId, userId });
  }, [emit]);

  const joinConversation = useCallback((conversationId: string) => {
    emit('conversation:join', { conversationId });
  }, [emit]);

  const sendMessage = useCallback((conversationId: string, content: string, messageType?: string) => {
    emit('message:send', { conversationId, content, messageType });
  }, [emit]);

  const startTyping = useCallback((conversationId: string) => {
    emit('typing:start', { conversationId });
  }, [emit]);

  const stopTyping = useCallback((conversationId: string) => {
    emit('typing:stop', { conversationId });
  }, [emit]);

  const updatePresence = useCallback((status: 'online' | 'away' | 'busy' | 'offline') => {
    emit('presence:update', { status });
  }, [emit]);

  const markNotificationsAsRead = useCallback((notificationIds: string[]) => {
    emit('notifications:read', { notificationIds });
  }, [emit]);

  const trackAnalytics = useCallback((event: string, metadata?: any) => {
    emit('analytics:track', { event, metadata });
  }, [emit]);

  // Auto-connect when user is available
  useEffect(() => {
    if (user?.id) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user?.id, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Auto presence updates
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('away');
      } else {
        updatePresence('online');
      }
    };

    const handleBeforeUnload = () => {
      updatePresence('offline');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [updatePresence]);

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'follow': return '👥';
      case 'mention': return '🏷️';
      case 'share': return '🔄';
      case 'story_view': return '👁️';
      default: return '🔔';
    }
  };

  return {
    socket: socket.current,
    isConnected: socket.current?.connected || false,
    connect,
    disconnect,
    emit,
    on,
    off,
    
    // Helper functions
    likePost,
    commentOnPost,
    followUser,
    viewStory,
    joinConversation,
    sendMessage,
    startTyping,
    stopTyping,
    updatePresence,
    markNotificationsAsRead,
    trackAnalytics
  };
};