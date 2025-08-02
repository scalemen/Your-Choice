import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { db, users, notes, chatMessages, chatRooms, roomMemberships } from '../db/index.js';
import { eq, and } from 'drizzle-orm';
import { setupEnhancedSocialHandlers } from './enhanced-social.js';
import { setupSocialMediaHandlers } from './socialMediaHandlers.js';

// Store active connections and room states
const activeConnections = new Map();
const noteCollaborators = new Map(); // noteId -> Set of userIds
const videoSessions = new Map(); // roomId -> session data
const typingUsers = new Map(); // roomId -> Set of userIds

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    // Get user from database
    const user = await db.select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user.length) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.userId = user[0].id;
    socket.user = user[0];
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};

// Main socket setup function
export function setupSocketHandlers(io) {
  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.firstName} ${socket.user.lastName} connected: ${socket.id}`);
    
    // Store connection
    activeConnections.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      joinedAt: new Date()
    });

    // Update user's last active status
    updateUserLastActive(socket.userId);

    // Send user their current status
    socket.emit('connection:established', {
      user: socket.user,
      activeUsers: Array.from(activeConnections.values()).length
    });

    // === REAL-TIME NOTE COLLABORATION ===
    
    // Join note collaboration room
    socket.on('note:join', async (data) => {
      try {
        const { noteId } = data;
        
        // Verify user has access to this note
        const note = await db.select()
          .from(notes)
          .where(eq(notes.id, noteId))
          .limit(1);

        if (!note.length) {
          socket.emit('error', { message: 'Note not found' });
          return;
        }

        const noteData = note[0];
        
        // Check access permissions
        if (noteData.userId !== socket.userId && !noteData.isPublic) {
          socket.emit('error', { message: 'Access denied to this note' });
          return;
        }

        // Join the note room
        socket.join(`note:${noteId}`);
        
        // Track collaborators
        if (!noteCollaborators.has(noteId)) {
          noteCollaborators.set(noteId, new Set());
        }
        noteCollaborators.get(noteId).add(socket.userId);

        // Notify other collaborators
        socket.to(`note:${noteId}`).emit('note:user_joined', {
          userId: socket.userId,
          user: {
            id: socket.user.id,
            firstName: socket.user.firstName,
            lastName: socket.user.lastName,
            avatar: socket.user.avatar
          }
        });

        // Send current collaborators to new user
        const collaboratorIds = Array.from(noteCollaborators.get(noteId));
        const collaborators = Array.from(activeConnections.values())
          .filter(conn => collaboratorIds.includes(conn.user.id))
          .map(conn => ({
            id: conn.user.id,
            firstName: conn.user.firstName,
            lastName: conn.user.lastName,
            avatar: conn.user.avatar
          }));

        socket.emit('note:collaborators', collaborators);
        
        console.log(`User ${socket.user.firstName} joined note ${noteId}`);
      } catch (error) {
        console.error('Error joining note:', error);
        socket.emit('error', { message: 'Failed to join note' });
      }
    });

    // Leave note collaboration room
    socket.on('note:leave', (data) => {
      const { noteId } = data;
      socket.leave(`note:${noteId}`);
      
      if (noteCollaborators.has(noteId)) {
        noteCollaborators.get(noteId).delete(socket.userId);
        if (noteCollaborators.get(noteId).size === 0) {
          noteCollaborators.delete(noteId);
        }
      }

      socket.to(`note:${noteId}`).emit('note:user_left', {
        userId: socket.userId
      });
    });

    // Real-time content updates
    socket.on('note:content_change', (data) => {
      const { noteId, content, operation, position } = data;
      
      // Broadcast to other collaborators in the same note
      socket.to(`note:${noteId}`).emit('note:content_update', {
        userId: socket.userId,
        content,
        operation,
        position,
        timestamp: new Date().toISOString()
      });
    });

    // Real-time handwriting updates
    socket.on('note:handwriting_stroke', (data) => {
      const { noteId, stroke, isComplete } = data;
      
      // Broadcast stroke data to other collaborators
      socket.to(`note:${noteId}`).emit('note:handwriting_update', {
        userId: socket.userId,
        stroke,
        isComplete,
        timestamp: new Date().toISOString()
      });
    });

    // Cursor position updates
    socket.on('note:cursor_update', (data) => {
      const { noteId, position, selection } = data;
      
      socket.to(`note:${noteId}`).emit('note:cursor_position', {
        userId: socket.userId,
        user: {
          id: socket.user.id,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName
        },
        position,
        selection,
        timestamp: new Date().toISOString()
      });
    });

    // === REAL-TIME MESSAGING ===
    
    // Join chat room
    socket.on('chat:join_room', async (data) => {
      try {
        const { roomId } = data;
        
        // Verify user is a member of this room
        const membership = await db.select()
          .from(roomMemberships)
          .where(and(
            eq(roomMemberships.roomId, roomId),
            eq(roomMemberships.userId, socket.userId)
          ))
          .limit(1);

        if (!membership.length) {
          socket.emit('error', { message: 'Not a member of this room' });
          return;
        }

        socket.join(`chat:${roomId}`);
        
        // Update last seen
        await db.update(roomMemberships)
          .set({ lastSeen: new Date() })
          .where(and(
            eq(roomMemberships.roomId, roomId),
            eq(roomMemberships.userId, socket.userId)
          ));

        // Notify others that user is online
        socket.to(`chat:${roomId}`).emit('chat:user_online', {
          userId: socket.userId,
          user: socket.user
        });

        console.log(`User ${socket.user.firstName} joined chat room ${roomId}`);
      } catch (error) {
        console.error('Error joining chat room:', error);
        socket.emit('error', { message: 'Failed to join chat room' });
      }
    });

    // Leave chat room
    socket.on('chat:leave_room', (data) => {
      const { roomId } = data;
      socket.leave(`chat:${roomId}`);
      
      socket.to(`chat:${roomId}`).emit('chat:user_offline', {
        userId: socket.userId
      });
    });

    // Send message
    socket.on('chat:send_message', async (data) => {
      try {
        const { roomId, content, type = 'text', replyTo } = data;
        
        // Verify user is a member
        const membership = await db.select()
          .from(roomMemberships)
          .where(and(
            eq(roomMemberships.roomId, roomId),
            eq(roomMemberships.userId, socket.userId)
          ))
          .limit(1);

        if (!membership.length) {
          socket.emit('error', { message: 'Not authorized to send messages in this room' });
          return;
        }

        // Save message to database
        const newMessage = await db.insert(chatMessages)
          .values({
            roomId,
            userId: socket.userId,
            content,
            type,
            replyTo: replyTo || null
          })
          .returning();

        // Broadcast to all room members
        io.to(`chat:${roomId}`).emit('chat:new_message', {
          ...newMessage[0],
          user: {
            id: socket.user.id,
            firstName: socket.user.firstName,
            lastName: socket.user.lastName,
            avatar: socket.user.avatar
          }
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('chat:typing_start', (data) => {
      const { roomId } = data;
      
      if (!typingUsers.has(roomId)) {
        typingUsers.set(roomId, new Set());
      }
      typingUsers.get(roomId).add(socket.userId);
      
      socket.to(`chat:${roomId}`).emit('chat:user_typing', {
        userId: socket.userId,
        user: socket.user
      });
    });

    socket.on('chat:typing_stop', (data) => {
      const { roomId } = data;
      
      if (typingUsers.has(roomId)) {
        typingUsers.get(roomId).delete(socket.userId);
      }
      
      socket.to(`chat:${roomId}`).emit('chat:user_stop_typing', {
        userId: socket.userId
      });
    });

    // === VIDEO CALLING ===
    
    // Join video session
    socket.on('video:join_session', async (data) => {
      try {
        const { sessionId, isVideo = true, isAudio = true } = data;
        
        socket.join(`video:${sessionId}`);
        
        if (!videoSessions.has(sessionId)) {
          videoSessions.set(sessionId, {
            participants: new Map(),
            createdAt: new Date()
          });
        }

        const session = videoSessions.get(sessionId);
        session.participants.set(socket.userId, {
          user: socket.user,
          socketId: socket.id,
          isVideo,
          isAudio,
          joinedAt: new Date()
        });

        // Notify existing participants
        socket.to(`video:${sessionId}`).emit('video:user_joined', {
          userId: socket.userId,
          user: socket.user,
          isVideo,
          isAudio
        });

        // Send existing participants to new user
        const participants = Array.from(session.participants.values())
          .filter(p => p.user.id !== socket.userId)
          .map(p => ({
            userId: p.user.id,
            user: p.user,
            isVideo: p.isVideo,
            isAudio: p.isAudio
          }));

        socket.emit('video:existing_participants', participants);
        
        console.log(`User ${socket.user.firstName} joined video session ${sessionId}`);
      } catch (error) {
        console.error('Error joining video session:', error);
        socket.emit('error', { message: 'Failed to join video session' });
      }
    });

    // Leave video session
    socket.on('video:leave_session', (data) => {
      const { sessionId } = data;
      socket.leave(`video:${sessionId}`);
      
      if (videoSessions.has(sessionId)) {
        const session = videoSessions.get(sessionId);
        session.participants.delete(socket.userId);
        
        if (session.participants.size === 0) {
          videoSessions.delete(sessionId);
        }
      }

      socket.to(`video:${sessionId}`).emit('video:user_left', {
        userId: socket.userId
      });
    });

    // WebRTC signaling
    socket.on('video:offer', (data) => {
      const { sessionId, targetUserId, offer } = data;
      
      // Find target user's socket
      const targetConnection = Array.from(activeConnections.values())
        .find(conn => conn.user.id === targetUserId);
      
      if (targetConnection) {
        io.to(targetConnection.socketId).emit('video:offer', {
          fromUserId: socket.userId,
          offer
        });
      }
    });

    socket.on('video:answer', (data) => {
      const { targetUserId, answer } = data;
      
      const targetConnection = Array.from(activeConnections.values())
        .find(conn => conn.user.id === targetUserId);
      
      if (targetConnection) {
        io.to(targetConnection.socketId).emit('video:answer', {
          fromUserId: socket.userId,
          answer
        });
      }
    });

    socket.on('video:ice_candidate', (data) => {
      const { targetUserId, candidate } = data;
      
      const targetConnection = Array.from(activeConnections.values())
        .find(conn => conn.user.id === targetUserId);
      
      if (targetConnection) {
        io.to(targetConnection.socketId).emit('video:ice_candidate', {
          fromUserId: socket.userId,
          candidate
        });
      }
    });

    // Audio/Video toggle
    socket.on('video:toggle_audio', (data) => {
      const { sessionId, isAudio } = data;
      
      if (videoSessions.has(sessionId)) {
        const session = videoSessions.get(sessionId);
        const participant = session.participants.get(socket.userId);
        if (participant) {
          participant.isAudio = isAudio;
        }
      }
      
      socket.to(`video:${sessionId}`).emit('video:user_audio_toggle', {
        userId: socket.userId,
        isAudio
      });
    });

    socket.on('video:toggle_video', (data) => {
      const { sessionId, isVideo } = data;
      
      if (videoSessions.has(sessionId)) {
        const session = videoSessions.get(sessionId);
        const participant = session.participants.get(socket.userId);
        if (participant) {
          participant.isVideo = isVideo;
        }
      }
      
      socket.to(`video:${sessionId}`).emit('video:user_video_toggle', {
        userId: socket.userId,
        isVideo
      });
    });

    // Screen sharing
    socket.on('video:start_screen_share', (data) => {
      const { sessionId } = data;
      
      socket.to(`video:${sessionId}`).emit('video:screen_share_started', {
        userId: socket.userId,
        user: socket.user
      });
    });

    socket.on('video:stop_screen_share', (data) => {
      const { sessionId } = data;
      
      socket.to(`video:${sessionId}`).emit('video:screen_share_stopped', {
        userId: socket.userId
      });
    });

    // === STUDY SESSIONS ===
    
    // Join study session
    socket.on('study:join_session', (data) => {
      const { sessionId } = data;
      socket.join(`study:${sessionId}`);
      
      socket.to(`study:${sessionId}`).emit('study:user_joined', {
        userId: socket.userId,
        user: socket.user
      });
    });

    // Share study material
    socket.on('study:share_material', (data) => {
      const { sessionId, materialType, materialData } = data;
      
      socket.to(`study:${sessionId}`).emit('study:material_shared', {
        userId: socket.userId,
        user: socket.user,
        materialType,
        materialData,
        timestamp: new Date().toISOString()
      });
    });

    // Study session timer sync
    socket.on('study:timer_update', (data) => {
      const { sessionId, timeRemaining, isRunning } = data;
      
      socket.to(`study:${sessionId}`).emit('study:timer_sync', {
        timeRemaining,
        isRunning,
        updatedBy: socket.userId
      });
    });

    // === GAMES ===
    
    // Join game session
    socket.on('game:join', (data) => {
      const { gameId, sessionId } = data;
      const roomName = `game:${gameId}:${sessionId}`;
      
      socket.join(roomName);
      
      socket.to(roomName).emit('game:player_joined', {
        userId: socket.userId,
        user: socket.user
      });
    });

    // Game state updates
    socket.on('game:state_update', (data) => {
      const { gameId, sessionId, gameState } = data;
      const roomName = `game:${gameId}:${sessionId}`;
      
      socket.to(roomName).emit('game:state_changed', {
        gameState,
        updatedBy: socket.userId,
        timestamp: new Date().toISOString()
      });
    });

    // Quiz/Game answers
    socket.on('game:answer_submitted', (data) => {
      const { gameId, sessionId, answer, questionId } = data;
      const roomName = `game:${gameId}:${sessionId}`;
      
      socket.to(roomName).emit('game:answer_received', {
        userId: socket.userId,
        user: socket.user,
        answer,
        questionId,
        timestamp: new Date().toISOString()
      });
    });

    // === NOTIFICATIONS ===
    
    // Join user's notification room
    socket.join(`user:${socket.userId}`);
    
    // Send notification to specific user
    socket.on('notification:send', (data) => {
      const { targetUserId, notification } = data;
      
      io.to(`user:${targetUserId}`).emit('notification:received', {
        ...notification,
        fromUser: socket.user,
        timestamp: new Date().toISOString()
      });
    });

    // === DISCONNECT HANDLING ===
    
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.firstName} ${socket.user.lastName} disconnected: ${socket.id}`);
      
      // Remove from active connections
      activeConnections.delete(socket.userId);
      
      // Clean up note collaborations
      for (const [noteId, collaborators] of noteCollaborators.entries()) {
        if (collaborators.has(socket.userId)) {
          collaborators.delete(socket.userId);
          socket.to(`note:${noteId}`).emit('note:user_left', {
            userId: socket.userId
          });
          
          if (collaborators.size === 0) {
            noteCollaborators.delete(noteId);
          }
        }
      }
      
      // Clean up video sessions
      for (const [sessionId, session] of videoSessions.entries()) {
        if (session.participants.has(socket.userId)) {
          session.participants.delete(socket.userId);
          socket.to(`video:${sessionId}`).emit('video:user_left', {
            userId: socket.userId
          });
          
          if (session.participants.size === 0) {
            videoSessions.delete(sessionId);
          }
        }
      }
      
      // Clean up typing indicators
      for (const [roomId, typingSet] of typingUsers.entries()) {
        if (typingSet.has(socket.userId)) {
          typingSet.delete(socket.userId);
          socket.to(`chat:${roomId}`).emit('chat:user_stop_typing', {
            userId: socket.userId
          });
        }
      }
    });

    // === ERROR HANDLING ===
    
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  // Helper function to update user's last active status
  async function updateUserLastActive(userId) {
    try {
      await db.update(users)
        .set({ lastActive: new Date() })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error updating user last active:', error);
    }
  }

  // Send global notifications
  io.sendNotificationToUser = (userId, notification) => {
    io.to(`user:${userId}`).emit('notification:received', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  };

  // Send notification to all active users
  io.broadcastNotification = (notification) => {
    io.emit('notification:broadcast', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  };

  // Get active users count
  io.getActiveUsersCount = () => {
    return activeConnections.size;
  };

  // Get active collaborators for a note
  io.getNoteCollaborators = (noteId) => {
    return noteCollaborators.get(noteId) || new Set();
  };

  // Setup enhanced social handlers
  setupEnhancedSocialHandlers(io);

  // Setup social media handlers for each connection
  io.on('connection', (socket) => {
    setupSocialMediaHandlers(io, socket);
  });

  console.log('✅ Socket.io handlers configured successfully');
}