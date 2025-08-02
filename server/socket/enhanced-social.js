import { 
  db, 
  users, 
  userProfiles, 
  friendships, 
  studyServers, 
  studyChannels, 
  serverMemberships, 
  directMessages, 
  voiceCalls, 
  userPresence
} from '../db/index.js';
import { eq, and, or, inArray, ne, sql } from 'drizzle-orm';

// Store user socket mappings
const userSockets = new Map(); // userId -> socketId
const socketUsers = new Map(); // socketId -> userId
const channelSockets = new Map(); // channelId -> Set of socketIds
const callRooms = new Map(); // callId -> Set of socketIds

// WebRTC signaling data
const callSignalingData = new Map(); // callId -> signaling data

export function setupEnhancedSocialHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Enhanced Social: User connected: ${socket.id}`);

    // User authentication and presence
    socket.on('authenticate', async (data) => {
      try {
        const { userId } = data;
        if (!userId) return;

        // Store socket mapping
        userSockets.set(userId, socket.id);
        socketUsers.set(socket.id, userId);
        socket.userId = userId;

        // Update user presence to online
        await updateUserPresence(userId, {
          status: 'online',
          lastSeen: new Date(),
          lastOnline: new Date(),
          device: data.device || 'web',
          platform: data.platform || 'unknown'
        });

        // Join user to their personal room
        socket.join(`user:${userId}`);

        // Join user to their server channels
        await joinUserToServerChannels(socket, userId);

        // Broadcast presence update to friends and servers
        await broadcastPresenceUpdate(io, userId, 'online');

        socket.emit('authenticated', { success: true });
        console.log(`User ${userId} authenticated and joined channels`);
      } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('authenticated', { success: false, error: error.message });
      }
    });

    // Friend system events
    socket.on('send_friend_request', async (data) => {
      try {
        const { targetUserId, message } = data;
        const senderId = socket.userId;

        if (!senderId) return;

        // Get target user socket
        const targetSocketId = userSockets.get(targetUserId);
        
        if (targetSocketId) {
          // Get sender info
          const sender = await db.select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            avatar: users.avatar,
            username: users.username,
            discriminator: userProfiles.discriminator,
            globalName: userProfiles.globalName
          })
            .from(users)
            .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
            .where(eq(users.id, senderId))
            .limit(1);

          // Send real-time notification
          io.to(`user:${targetUserId}`).emit('friend_request', {
            requesterId: senderId,
            requester: sender[0],
            message,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error('Send friend request error:', error);
      }
    });

    socket.on('accept_friend_request', async (data) => {
      try {
        const { requesterId } = data;
        const accepterId = socket.userId;

        if (!accepterId) return;

        // Update friendship status
        await db.update(friendships)
          .set({
            status: 'accepted',
            respondedAt: new Date()
          })
          .where(and(
            eq(friendships.requesterId, requesterId),
            eq(friendships.addresseeId, accepterId)
          ));

        // Notify both users
        const accepter = await getUserInfo(accepterId);
        const requester = await getUserInfo(requesterId);

        io.to(`user:${requesterId}`).emit('friend_request_accepted', {
          friend: accepter,
          timestamp: new Date()
        });

        io.to(`user:${accepterId}`).emit('friend_added', {
          friend: requester,
          timestamp: new Date()
        });

        console.log(`Friend request accepted: ${requesterId} <-> ${accepterId}`);
      } catch (error) {
        console.error('Accept friend request error:', error);
      }
    });

    // Real-time messaging
    socket.on('send_message', async (data) => {
      try {
        const { channelId, content, recipientId, attachments = [], embeds = [], studyContent = {} } = data;
        const authorId = socket.userId;

        if (!authorId) return;

        // Create message in database
        const newMessage = await db.insert(directMessages)
          .values({
            channelId,
            authorId,
            recipientId,
            content,
            attachments,
            embeds,
            studyContent,
            type: 0
          })
          .returning();

        // Get author info
        const author = await getUserInfo(authorId);

        const messageData = {
          ...newMessage[0],
          author,
          timestamp: new Date()
        };

        if (recipientId) {
          // Direct message - send to both users
          io.to(`user:${authorId}`).emit('direct_message', messageData);
          io.to(`user:${recipientId}`).emit('direct_message', messageData);

          // Update friendship interaction
          await db.update(friendships)
            .set({
              lastInteraction: new Date(),
              interactionCount: sql`${friendships.interactionCount} + 1`,
              messageCount: sql`${friendships.messageCount} + 1`
            })
            .where(or(
              and(eq(friendships.requesterId, authorId), eq(friendships.addresseeId, recipientId)),
              and(eq(friendships.requesterId, recipientId), eq(friendships.addresseeId, authorId))
            ));
        } else {
          // Channel message - send to all channel members
          const channelRoom = `channel:${channelId}`;
          io.to(channelRoom).emit('channel_message', messageData);

          // Update channel message count
          await db.update(studyChannels)
            .set({
              messageCount: sql`${studyChannels.messageCount} + 1`,
              lastMessageAt: new Date()
            })
            .where(eq(studyChannels.channelId, channelId));
        }

        console.log(`Message sent by ${authorId} to ${recipientId ? `user ${recipientId}` : `channel ${channelId}`}`);
      } catch (error) {
        console.error('Send message error:', error);
      }
    });

    // Typing indicators
    socket.on('typing_start', (data) => {
      const { channelId, recipientId } = data;
      const userId = socket.userId;

      if (!userId) return;

      if (recipientId) {
        io.to(`user:${recipientId}`).emit('typing_start', { userId, channelId });
      } else {
        socket.to(`channel:${channelId}`).emit('typing_start', { userId, channelId });
      }
    });

    socket.on('typing_stop', (data) => {
      const { channelId, recipientId } = data;
      const userId = socket.userId;

      if (!userId) return;

      if (recipientId) {
        io.to(`user:${recipientId}`).emit('typing_stop', { userId, channelId });
      } else {
        socket.to(`channel:${channelId}`).emit('typing_stop', { userId, channelId });
      }
    });

    // Voice/Video call events
    socket.on('start_call', async (data) => {
      try {
        const { callId, type, channelId, recipientId, participants = [] } = data;
        const hostId = socket.userId;

        if (!hostId) return;

        // Create call room
        const callRoom = `call:${callId}`;
        socket.join(callRoom);
        
        if (!callRooms.has(callId)) {
          callRooms.set(callId, new Set());
        }
        callRooms.get(callId).add(socket.id);

        const callData = {
          callId,
          type,
          hostId,
          channelId,
          status: 'waiting',
          participants: [hostId],
          timestamp: new Date()
        };

        if (recipientId) {
          // Direct call invitation
          io.to(`user:${recipientId}`).emit('call_invitation', callData);
        } else if (channelId) {
          // Channel call
          socket.to(`channel:${channelId}`).emit('call_started', callData);
        }

        console.log(`Call started by ${hostId}: ${callId}`);
      } catch (error) {
        console.error('Start call error:', error);
      }
    });

    socket.on('join_call', (data) => {
      const { callId } = data;
      const userId = socket.userId;

      if (!userId) return;

      const callRoom = `call:${callId}`;
      socket.join(callRoom);

      if (!callRooms.has(callId)) {
        callRooms.set(callId, new Set());
      }
      callRooms.get(callId).add(socket.id);

      // Notify other participants
      socket.to(callRoom).emit('user_joined_call', {
        userId,
        callId,
        timestamp: new Date()
      });

      console.log(`User ${userId} joined call: ${callId}`);
    });

    socket.on('leave_call', (data) => {
      const { callId } = data;
      const userId = socket.userId;

      if (!userId) return;

      const callRoom = `call:${callId}`;
      socket.leave(callRoom);

      if (callRooms.has(callId)) {
        callRooms.get(callId).delete(socket.id);
        if (callRooms.get(callId).size === 0) {
          callRooms.delete(callId);
        }
      }

      // Notify other participants
      socket.to(callRoom).emit('user_left_call', {
        userId,
        callId,
        timestamp: new Date()
      });

      console.log(`User ${userId} left call: ${callId}`);
    });

    // WebRTC signaling
    socket.on('webrtc_offer', (data) => {
      const { callId, targetUserId, offer } = data;
      const sourceUserId = socket.userId;

      if (!sourceUserId) return;

      const targetSocketId = userSockets.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc_offer', {
          callId,
          sourceUserId,
          offer
        });
      }
    });

    socket.on('webrtc_answer', (data) => {
      const { callId, targetUserId, answer } = data;
      const sourceUserId = socket.userId;

      if (!sourceUserId) return;

      const targetSocketId = userSockets.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc_answer', {
          callId,
          sourceUserId,
          answer
        });
      }
    });

    socket.on('webrtc_ice_candidate', (data) => {
      const { callId, targetUserId, candidate } = data;
      const sourceUserId = socket.userId;

      if (!sourceUserId) return;

      const targetSocketId = userSockets.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc_ice_candidate', {
          callId,
          sourceUserId,
          candidate
        });
      }
    });

    // Server events
    socket.on('join_server', async (data) => {
      try {
        const { serverId } = data;
        const userId = socket.userId;

        if (!userId) return;

        // Join all server channels
        const channels = await db.select()
          .from(studyChannels)
          .where(eq(studyChannels.serverId, serverId));

        for (const channel of channels) {
          const channelRoom = `channel:${channel.channelId}`;
          socket.join(channelRoom);
        }

        // Notify server members
        const serverRoom = `server:${serverId}`;
        socket.to(serverRoom).emit('member_joined_server', {
          userId,
          serverId,
          timestamp: new Date()
        });

        console.log(`User ${userId} joined server: ${serverId}`);
      } catch (error) {
        console.error('Join server error:', error);
      }
    });

    socket.on('leave_server', (data) => {
      const { serverId } = data;
      const userId = socket.userId;

      if (!userId) return;

      // Leave all server channels
      const serverRoom = `server:${serverId}`;
      socket.leave(serverRoom);

      // Notify server members
      socket.to(serverRoom).emit('member_left_server', {
        userId,
        serverId,
        timestamp: new Date()
      });

      console.log(`User ${userId} left server: ${serverId}`);
    });

    // Presence updates
    socket.on('update_presence', async (data) => {
      try {
        const userId = socket.userId;
        if (!userId) return;

        await updateUserPresence(userId, {
          status: data.status,
          customStatus: data.customStatus,
          statusEmoji: data.statusEmoji,
          activities: data.activities || [],
          lastActivity: new Date()
        });

        // Broadcast to friends and servers
        await broadcastPresenceUpdate(io, userId, data.status, data);

        console.log(`Presence updated for user ${userId}: ${data.status}`);
      } catch (error) {
        console.error('Update presence error:', error);
      }
    });

    // Message reactions
    socket.on('add_reaction', async (data) => {
      try {
        const { messageId, emoji } = data;
        const userId = socket.userId;

        if (!userId) return;

        // Get message and update reactions
        const message = await db.select()
          .from(directMessages)
          .where(eq(directMessages.messageId, messageId))
          .limit(1);

        if (message.length === 0) return;

        const currentReactions = message[0].reactions || [];
        const existingReaction = currentReactions.find(r => r.emoji === emoji);

        let updatedReactions;
        if (existingReaction) {
          if (existingReaction.users?.includes(userId)) {
            // Remove reaction
            existingReaction.users = existingReaction.users.filter(id => id !== userId);
            existingReaction.count = existingReaction.users.length;
            if (existingReaction.count === 0) {
              updatedReactions = currentReactions.filter(r => r.emoji !== emoji);
            } else {
              updatedReactions = currentReactions;
            }
          } else {
            // Add reaction
            existingReaction.users = existingReaction.users || [];
            existingReaction.users.push(userId);
            existingReaction.count = existingReaction.users.length;
            updatedReactions = currentReactions;
          }
        } else {
          // New reaction
          updatedReactions = [...currentReactions, {
            emoji,
            count: 1,
            users: [userId]
          }];
        }

        // Update in database
        await db.update(directMessages)
          .set({ reactions: updatedReactions })
          .where(eq(directMessages.messageId, messageId));

        // Broadcast to relevant users/channels
        const reactionData = {
          messageId,
          reactions: updatedReactions,
          userId,
          emoji,
          timestamp: new Date()
        };

        if (message[0].recipientId) {
          // DM reaction
          io.to(`user:${message[0].authorId}`).emit('message_reaction_updated', reactionData);
          io.to(`user:${message[0].recipientId}`).emit('message_reaction_updated', reactionData);
        } else {
          // Channel reaction
          io.to(`channel:${message[0].channelId}`).emit('message_reaction_updated', reactionData);
        }

        console.log(`Reaction ${emoji} ${existingReaction?.users?.includes(userId) ? 'removed' : 'added'} by ${userId} on message ${messageId}`);
      } catch (error) {
        console.error('Add reaction error:', error);
      }
    });

    // User disconnect
    socket.on('disconnect', async () => {
      try {
        const userId = socketUsers.get(socket.id);
        
        if (userId) {
          // Update presence to offline
          await updateUserPresence(userId, {
            status: 'offline',
            lastSeen: new Date()
          });

          // Clean up mappings
          userSockets.delete(userId);
          socketUsers.delete(socket.id);

          // Remove from call rooms
          for (const [callId, sockets] of callRooms.entries()) {
            if (sockets.has(socket.id)) {
              sockets.delete(socket.id);
              if (sockets.size === 0) {
                callRooms.delete(callId);
              }
              
              // Notify other call participants
              socket.to(`call:${callId}`).emit('user_left_call', {
                userId,
                callId,
                timestamp: new Date()
              });
            }
          }

          // Broadcast offline status
          await broadcastPresenceUpdate(io, userId, 'offline');

          console.log(`Enhanced Social: User disconnected: ${userId}`);
        }
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });
  });
}

// Helper functions
async function joinUserToServerChannels(socket, userId) {
  try {
    // Get user's servers
    const memberships = await db.select({
      serverId: serverMemberships.serverId,
      serverServerId: studyServers.serverId
    })
      .from(serverMemberships)
      .innerJoin(studyServers, eq(serverMemberships.serverId, studyServers.id))
      .where(eq(serverMemberships.userId, userId));

    for (const membership of memberships) {
      // Join server room
      const serverRoom = `server:${membership.serverServerId}`;
      socket.join(serverRoom);

      // Get server channels
      const channels = await db.select()
        .from(studyChannels)
        .where(eq(studyChannels.serverId, membership.serverId));

      // Join channel rooms
      for (const channel of channels) {
        const channelRoom = `channel:${channel.channelId}`;
        socket.join(channelRoom);
      }
    }
  } catch (error) {
    console.error('Error joining user to server channels:', error);
  }
}

async function updateUserPresence(userId, presenceData) {
  try {
    await db.insert(userPresence)
      .values({
        userId,
        ...presenceData,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: userPresence.userId,
        set: {
          ...presenceData,
          updatedAt: new Date()
        }
      });
  } catch (error) {
    console.error('Error updating user presence:', error);
  }
}

async function broadcastPresenceUpdate(io, userId, status, additionalData = {}) {
  try {
    // Get user's friends
    const friends = await db.select({
      friendId: friendships.addresseeId
    })
      .from(friendships)
      .where(and(
        eq(friendships.requesterId, userId),
        eq(friendships.status, 'accepted')
      ))
      .union(
        db.select({
          friendId: friendships.requesterId
        })
          .from(friendships)
          .where(and(
            eq(friendships.addresseeId, userId),
            eq(friendships.status, 'accepted')
          ))
      );

    // Get user's servers
    const memberships = await db.select({
      serverServerId: studyServers.serverId
    })
      .from(serverMemberships)
      .innerJoin(studyServers, eq(serverMemberships.serverId, studyServers.id))
      .where(eq(serverMemberships.userId, userId));

    const presenceUpdate = {
      userId,
      status,
      timestamp: new Date(),
      ...additionalData
    };

    // Broadcast to friends
    for (const friend of friends) {
      io.to(`user:${friend.friendId}`).emit('friend_presence_update', presenceUpdate);
    }

    // Broadcast to servers
    for (const membership of memberships) {
      io.to(`server:${membership.serverServerId}`).emit('member_presence_update', presenceUpdate);
    }
  } catch (error) {
    console.error('Error broadcasting presence update:', error);
  }
}

async function getUserInfo(userId) {
  try {
    const userInfo = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      avatar: users.avatar,
      username: users.username,
      discriminator: userProfiles.discriminator,
      globalName: userProfiles.globalName,
      isVerified: userProfiles.isVerified,
      badges: userProfiles.badges,
      nitroType: userProfiles.nitroType
    })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(eq(users.id, userId))
      .limit(1);

    return userInfo[0] || null;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
}

// Export helper functions for use in other modules
export {
  userSockets,
  socketUsers,
  channelSockets,
  callRooms,
  broadcastPresenceUpdate,
  getUserInfo
};