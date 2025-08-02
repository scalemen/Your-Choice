import { 
  socialPosts, 
  socialStories, 
  postLikes, 
  postComments, 
  socialFollows,
  socialNotifications,
  directMessages,
  conversations
} from '../db/social-media-schema.js';
import { 
  enhancedSocialPosts,
  enhancedPostLikes,
  enhancedPostComments,
  enhancedSocialNotifications
} from '../db/enhanced-social-media-schema.js';
import { users } from '../db/schema.js';
import { db } from '../db/index.js';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';

// Store active connections
const activeUsers = new Map(); // userId -> socketId
const userSockets = new Map(); // socketId -> userId
const typingUsers = new Map(); // conversationId -> Set of userIds

export const setupSocialMediaHandlers = (io) => {
  
  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const userId = socket.handshake.auth.userId;
      
      if (!userId) {
        return next(new Error('Authentication failed'));
      }
      
      socket.userId = userId;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`👤 User ${socket.userId} connected to social media`);
    
    // Track active user
    activeUsers.set(socket.userId, socket.id);
    userSockets.set(socket.id, socket.userId);
    
    // Join user's personal room for notifications
    socket.join(`user:${socket.userId}`);
    
    // Emit online status to followers
    emitUserOnlineStatus(socket.userId, true);

    // =============================================================================
    // POST INTERACTIONS
    // =============================================================================

    // Real-time post creation
    socket.on('post:create', async (data) => {
      try {
        console.log(`📝 User ${socket.userId} creating post`);
        
        // Broadcast to followers
        const followers = await getFollowers(socket.userId);
        followers.forEach(followerId => {
          const followerSocketId = activeUsers.get(followerId);
          if (followerSocketId) {
            io.to(followerSocketId).emit('post:new', {
              ...data,
              userId: socket.userId,
              timestamp: new Date()
            });
          }
        });

        socket.emit('post:created', { success: true });
      } catch (error) {
        socket.emit('post:error', { message: 'Failed to create post' });
      }
    });

    // Real-time likes
    socket.on('post:like', async (data) => {
      try {
        const { postId, likeType = 'like' } = data;
        console.log(`👍 User ${socket.userId} ${likeType} post ${postId}`);

        // Get post owner
        const [post] = await db
          .select({ userId: socialPosts.userId })
          .from(socialPosts)
          .where(eq(socialPosts.id, postId))
          .limit(1);

        if (post && post.userId !== socket.userId) {
          // Notify post owner
          const notification = {
            type: 'like',
            subtype: likeType,
            fromUserId: socket.userId,
            postId,
            timestamp: new Date()
          };

          io.to(`user:${post.userId}`).emit('notification:new', notification);
          
          // Store notification in database
          await createNotification({
            userId: post.userId,
            actorId: socket.userId,
            type: 'like',
            entityType: 'post',
            entityId: postId
          });
        }

        // Broadcast like count update to all viewers
        const likeCount = await getLikeCount(postId);
        io.emit(`post:${postId}:likes`, { 
          count: likeCount,
          latestLiker: socket.userId,
          likeType 
        });

        socket.emit('post:liked', { success: true, postId, likeType });
      } catch (error) {
        socket.emit('post:like:error', { message: 'Failed to like post' });
      }
    });

    // Real-time comments
    socket.on('post:comment', async (data) => {
      try {
        const { postId, content, parentCommentId } = data;
        console.log(`💬 User ${socket.userId} commenting on post ${postId}`);

        const comment = {
          id: generateId(),
          postId,
          userId: socket.userId,
          content,
          parentCommentId,
          timestamp: new Date()
        };

        // Get post owner and commenters for notifications
        const [post] = await db
          .select({ userId: socialPosts.userId })
          .from(socialPosts)
          .where(eq(socialPosts.id, postId))
          .limit(1);

        // Broadcast comment to all post viewers
        io.emit(`post:${postId}:comment`, comment);

        // Notify post owner
        if (post && post.userId !== socket.userId) {
          const notification = {
            type: 'comment',
            fromUserId: socket.userId,
            postId,
            comment: content.substring(0, 50),
            timestamp: new Date()
          };

          io.to(`user:${post.userId}`).emit('notification:new', notification);
        }

        socket.emit('post:comment:success', { commentId: comment.id });
      } catch (error) {
        socket.emit('post:comment:error', { message: 'Failed to add comment' });
      }
    });

    // =============================================================================
    // STORY INTERACTIONS
    // =============================================================================

    // Story viewing
    socket.on('story:view', async (data) => {
      try {
        const { storyId, userId: storyOwnerId } = data;
        console.log(`👁️ User ${socket.userId} viewing story ${storyId}`);

        // Notify story owner of view
        if (storyOwnerId !== socket.userId) {
          io.to(`user:${storyOwnerId}`).emit('story:viewed', {
            storyId,
            viewerId: socket.userId,
            timestamp: new Date()
          });
        }

        socket.emit('story:view:recorded', { storyId });
      } catch (error) {
        socket.emit('story:view:error', { message: 'Failed to record story view' });
      }
    });

    // =============================================================================
    // FOLLOW SYSTEM
    // =============================================================================

    // Follow/Unfollow
    socket.on('user:follow', async (data) => {
      try {
        const { userId: targetUserId, action } = data; // action: 'follow' or 'unfollow'
        console.log(`🔔 User ${socket.userId} ${action} user ${targetUserId}`);

        if (action === 'follow') {
          // Notify target user
          const notification = {
            type: 'follow',
            fromUserId: socket.userId,
            timestamp: new Date()
          };

          io.to(`user:${targetUserId}`).emit('notification:new', notification);
          
          // Update follower count in real-time
          io.to(`user:${targetUserId}`).emit('follower:new', {
            followerId: socket.userId
          });
        }

        socket.emit('user:follow:success', { targetUserId, action });
      } catch (error) {
        socket.emit('user:follow:error', { message: `Failed to ${data.action} user` });
      }
    });

    // =============================================================================
    // DIRECT MESSAGING
    // =============================================================================

    // Join conversation
    socket.on('conversation:join', async (data) => {
      try {
        const { conversationId } = data;
        console.log(`💬 User ${socket.userId} joining conversation ${conversationId}`);
        
        // Verify user is part of conversation
        const hasAccess = await verifyConversationAccess(socket.userId, conversationId);
        if (!hasAccess) {
          socket.emit('conversation:access:denied', { conversationId });
          return;
        }

        socket.join(`conversation:${conversationId}`);
        
        // Notify other participants
        socket.to(`conversation:${conversationId}`).emit('user:joined', {
          userId: socket.userId,
          conversationId
        });

        socket.emit('conversation:joined', { conversationId });
      } catch (error) {
        socket.emit('conversation:join:error', { message: 'Failed to join conversation' });
      }
    });

    // Send message
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, content, messageType = 'text', replyToMessageId } = data;
        console.log(`📨 User ${socket.userId} sending message to ${conversationId}`);

        const message = {
          id: generateId(),
          conversationId,
          senderId: socket.userId,
          content,
          messageType,
          replyToMessageId,
          timestamp: new Date()
        };

        // Broadcast to conversation participants
        io.to(`conversation:${conversationId}`).emit('message:new', message);

        // Send push notifications to offline participants
        await sendMessageNotifications(conversationId, socket.userId, content);

        socket.emit('message:sent', { messageId: message.id });
      } catch (error) {
        socket.emit('message:send:error', { message: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('typing:start', (data) => {
      const { conversationId } = data;
      
      if (!typingUsers.has(conversationId)) {
        typingUsers.set(conversationId, new Set());
      }
      typingUsers.get(conversationId).add(socket.userId);

      socket.to(`conversation:${conversationId}`).emit('typing:update', {
        userId: socket.userId,
        isTyping: true
      });
    });

    socket.on('typing:stop', (data) => {
      const { conversationId } = data;
      
      if (typingUsers.has(conversationId)) {
        typingUsers.get(conversationId).delete(socket.userId);
      }

      socket.to(`conversation:${conversationId}`).emit('typing:update', {
        userId: socket.userId,
        isTyping: false
      });
    });

    // =============================================================================
    // NOTIFICATIONS
    // =============================================================================

    // Mark notifications as read
    socket.on('notifications:read', async (data) => {
      try {
        const { notificationIds } = data;
        console.log(`📖 User ${socket.userId} marking ${notificationIds.length} notifications as read`);

        await markNotificationsAsRead(socket.userId, notificationIds);
        socket.emit('notifications:read:success', { count: notificationIds.length });
      } catch (error) {
        socket.emit('notifications:read:error', { message: 'Failed to mark notifications as read' });
      }
    });

    // =============================================================================
    // PRESENCE SYSTEM
    // =============================================================================

    // Update user presence
    socket.on('presence:update', (data) => {
      const { status } = data; // 'online', 'away', 'busy', 'offline'
      console.log(`🟢 User ${socket.userId} status: ${status}`);

      socket.broadcast.emit('user:presence', {
        userId: socket.userId,
        status,
        lastSeen: new Date()
      });
    });

    // =============================================================================
    // ANALYTICS EVENTS
    // =============================================================================

    // Track engagement events
    socket.on('analytics:track', async (data) => {
      try {
        const { event, metadata } = data;
        console.log(`📊 Analytics: ${socket.userId} - ${event}`);

        // Store analytics event
        await trackAnalyticsEvent(socket.userId, event, metadata);
      } catch (error) {
        console.error('Failed to track analytics event:', error);
      }
    });

    // =============================================================================
    // DISCONNECT HANDLING
    // =============================================================================

    socket.on('disconnect', () => {
      console.log(`👋 User ${socket.userId} disconnected from social media`);
      
      // Clean up tracking
      activeUsers.delete(socket.userId);
      userSockets.delete(socket.id);
      
      // Clean up typing indicators
      typingUsers.forEach((users, conversationId) => {
        if (users.has(socket.userId)) {
          users.delete(socket.userId);
          socket.to(`conversation:${conversationId}`).emit('typing:update', {
            userId: socket.userId,
            isTyping: false
          });
        }
      });

      // Emit offline status to followers
      emitUserOnlineStatus(socket.userId, false);
    });
  });

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  async function getFollowers(userId) {
    try {
      const followers = await db
        .select({ followerId: socialFollows.followerId })
        .from(socialFollows)
        .where(eq(socialFollows.followingId, userId));
      
      return followers.map(f => f.followerId);
    } catch (error) {
      console.error('Error getting followers:', error);
      return [];
    }
  }

  async function getLikeCount(postId) {
    try {
      const [result] = await db
        .select({ count: sql`COUNT(*)` })
        .from(postLikes)
        .where(eq(postLikes.postId, postId));
      
      return parseInt(result?.count || 0);
    } catch (error) {
      console.error('Error getting like count:', error);
      return 0;
    }
  }

  async function createNotification(notificationData) {
    try {
      await db.insert(socialNotifications).values({
        ...notificationData,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  async function verifyConversationAccess(userId, conversationId) {
    try {
      const [conversation] = await db
        .select({ participantIds: conversations.participantIds })
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);
      
      if (!conversation) return false;
      
      const participants = Array.isArray(conversation.participantIds) 
        ? conversation.participantIds 
        : JSON.parse(conversation.participantIds || '[]');
      
      return participants.includes(userId);
    } catch (error) {
      console.error('Error verifying conversation access:', error);
      return false;
    }
  }

  async function sendMessageNotifications(conversationId, senderId, content) {
    try {
      // Get conversation participants
      const [conversation] = await db
        .select({ participantIds: conversations.participantIds })
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);
      
      if (!conversation) return;
      
      const participants = Array.isArray(conversation.participantIds) 
        ? conversation.participantIds 
        : JSON.parse(conversation.participantIds || '[]');
      
      // Send notifications to offline participants
      for (const participantId of participants) {
        if (participantId !== senderId && !activeUsers.has(participantId)) {
          await createNotification({
            userId: participantId,
            actorId: senderId,
            type: 'message',
            entityType: 'conversation',
            entityId: conversationId,
            message: content.substring(0, 50)
          });
        }
      }
    } catch (error) {
      console.error('Error sending message notifications:', error);
    }
  }

  async function markNotificationsAsRead(userId, notificationIds) {
    try {
      await db
        .update(socialNotifications)
        .set({ isRead: true })
        .where(and(
          eq(socialNotifications.userId, userId),
          inArray(socialNotifications.id, notificationIds)
        ));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }

  async function trackAnalyticsEvent(userId, event, metadata) {
    try {
      // Store analytics event in database
      // This could be expanded to use a dedicated analytics table
      console.log(`📊 Analytics Event: ${userId} - ${event}`, metadata);
    } catch (error) {
      console.error('Error tracking analytics event:', error);
    }
  }

  function emitUserOnlineStatus(userId, isOnline) {
    // Emit to user's followers
    getFollowers(userId).then(followers => {
      followers.forEach(followerId => {
        const followerSocketId = activeUsers.get(followerId);
        if (followerSocketId) {
          io.to(followerSocketId).emit('user:presence', {
            userId,
            status: isOnline ? 'online' : 'offline',
            lastSeen: new Date()
          });
        }
      });
    });
  }

  function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup function for server shutdown
  return {
    cleanup: () => {
      activeUsers.clear();
      userSockets.clear();
      typingUsers.clear();
    },
    getActiveUsers: () => activeUsers.size,
    broadcastToActiveUsers: (event, data) => {
      activeUsers.forEach(socketId => {
        io.to(socketId).emit(event, data);
      });
    }
  };
};