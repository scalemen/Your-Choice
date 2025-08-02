import express from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { 
  db, 
  users, 
  userProfiles, 
  friendships, 
  studyServers, 
  studyChannels, 
  serverMemberships, 
  serverRoles, 
  directMessages, 
  voiceCalls, 
  userPresence,
  studySessionParticipants 
} from '../db/index.js';
import { eq, and, or, desc, asc, sql, inArray, like, gte, lte, ne, count, exists } from 'drizzle-orm';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import crypto from 'crypto';

const router = express.Router();

// Discord-style friend system - Add friend by username#discriminator
router.post('/friends/add', [
  body('username').notEmpty().withMessage('Username is required'),
  body('discriminator').optional().isLength({ min: 4, max: 4 }).withMessage('Discriminator must be 4 digits'),
  body('globalName').optional().isString().withMessage('Global name must be a string'),
  body('message').optional().isLength({ max: 500 }).withMessage('Message too long')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { username, discriminator, globalName, message } = req.body;
  const userId = req.user.id;

  // Find target user by username and discriminator or globalName
  let targetUser;
  if (discriminator) {
    // Traditional Discord-style username#1234
    const profile = await db.select({
      userId: userProfiles.userId,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName
    })
      .from(userProfiles)
      .innerJoin(users, eq(userProfiles.userId, users.id))
      .where(and(
        eq(users.username, username),
        eq(userProfiles.discriminator, discriminator)
      ))
      .limit(1);
    
    targetUser = profile[0];
  } else if (globalName) {
    // New Discord global display name system
    const profile = await db.select({
      userId: userProfiles.userId,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName
    })
      .from(userProfiles)
      .innerJoin(users, eq(userProfiles.userId, users.id))
      .where(eq(userProfiles.globalName, globalName))
      .limit(1);
    
    targetUser = profile[0];
  } else {
    // Search by username only (less precise)
    const profiles = await db.select({
      userId: userProfiles.userId,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      discriminator: userProfiles.discriminator
    })
      .from(userProfiles)
      .innerJoin(users, eq(userProfiles.userId, users.id))
      .where(eq(users.username, username))
      .limit(5);
    
    if (profiles.length === 1) {
      targetUser = profiles[0];
    } else if (profiles.length > 1) {
      return res.status(400).json({
        success: false,
        message: 'Multiple users found. Please specify discriminator.',
        suggestions: profiles.map(p => ({
          username: p.username,
          discriminator: p.discriminator,
          name: `${p.firstName} ${p.lastName}`
        }))
      });
    }
  }

  if (!targetUser) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  if (targetUser.userId === userId) {
    throw new AppError('Cannot add yourself as a friend', 400, 'SELF_FRIEND_REQUEST');
  }

  // Check if friendship already exists
  const existingFriendship = await db.select()
    .from(friendships)
    .where(or(
      and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, targetUser.userId)),
      and(eq(friendships.requesterId, targetUser.userId), eq(friendships.addresseeId, userId))
    ))
    .limit(1);

  if (existingFriendship.length > 0) {
    const friendship = existingFriendship[0];
    if (friendship.status === 'accepted') {
      throw new AppError('Already friends', 400, 'ALREADY_FRIENDS');
    } else if (friendship.status === 'pending') {
      throw new AppError('Friend request already sent', 400, 'REQUEST_PENDING');
    } else if (friendship.status === 'blocked') {
      throw new AppError('Cannot send friend request', 400, 'USER_BLOCKED');
    }
  }

  // Check if target user allows friend requests
  const targetProfile = await db.select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, targetUser.userId))
    .limit(1);

  if (targetProfile[0] && !targetProfile[0].allowFriendRequests) {
    throw new AppError('User does not accept friend requests', 400, 'REQUESTS_DISABLED');
  }

  // Create friend request
  const newFriendship = await db.insert(friendships)
    .values({
      requesterId: userId,
      addresseeId: targetUser.userId,
      status: 'pending',
      requestMessage: message,
      requestedAt: new Date()
    })
    .returning();

  // TODO: Send real-time notification to target user
  // socketManager.sendToUser(targetUser.userId, 'friend_request', {
  //   requesterId: userId,
  //   requesterName: `${req.user.firstName} ${req.user.lastName}`,
  //   message
  // });

  res.json({
    success: true,
    message: 'Friend request sent successfully',
    data: newFriendship[0]
  });
}));

// Get friend suggestions based on mutual friends, servers, and study interests
router.get('/friends/suggestions', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 10;

  // Get user's current friends
  const currentFriends = await db.select({ friendId: friendships.addresseeId })
    .from(friendships)
    .where(and(
      eq(friendships.requesterId, userId),
      eq(friendships.status, 'accepted')
    ))
    .union(
      db.select({ friendId: friendships.requesterId })
        .from(friendships)
        .where(and(
          eq(friendships.addresseeId, userId),
          eq(friendships.status, 'accepted')
        ))
    );

  const friendIds = currentFriends.map(f => f.friendId);
  friendIds.push(userId); // Exclude self

  // Get mutual friends suggestions
  const mutualFriendsSuggestions = await db.select({
    userId: users.id,
    username: users.username,
    firstName: users.firstName,
    lastName: users.lastName,
    avatar: users.avatar,
    discriminator: userProfiles.discriminator,
    globalName: userProfiles.globalName,
    mutualCount: sql`count(*)`.as('mutualCount')
  })
    .from(friendships)
    .innerJoin(users, or(
      eq(friendships.addresseeId, users.id),
      eq(friendships.requesterId, users.id)
    ))
    .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(and(
      or(
        and(inArray(friendships.requesterId, friendIds), ne(friendships.addresseeId, userId)),
        and(inArray(friendships.addresseeId, friendIds), ne(friendships.requesterId, userId))
      ),
      eq(friendships.status, 'accepted'),
      ne(users.id, userId),
      sql`${users.id} NOT IN (${friendIds.join(',')})`
    ))
    .groupBy(users.id, users.username, users.firstName, users.lastName, users.avatar, userProfiles.discriminator, userProfiles.globalName)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);

  // Get server-based suggestions (people in same study servers)
  const serverSuggestions = await db.select({
    userId: users.id,
    username: users.username,
    firstName: users.firstName,
    lastName: users.lastName,
    avatar: users.avatar,
    discriminator: userProfiles.discriminator,
    globalName: userProfiles.globalName,
    serverCount: sql`count(*)`.as('serverCount')
  })
    .from(serverMemberships)
    .innerJoin(users, eq(serverMemberships.userId, users.id))
    .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(and(
      inArray(serverMemberships.serverId, 
        db.select({ serverId: serverMemberships.serverId })
          .from(serverMemberships)
          .where(eq(serverMemberships.userId, userId))
      ),
      ne(serverMemberships.userId, userId),
      sql`${users.id} NOT IN (${friendIds.join(',')})`
    ))
    .groupBy(users.id, users.username, users.firstName, users.lastName, users.avatar, userProfiles.discriminator, userProfiles.globalName)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);

  // Combine and deduplicate suggestions
  const allSuggestions = [...mutualFriendsSuggestions, ...serverSuggestions];
  const uniqueSuggestions = allSuggestions.reduce((acc, current) => {
    const existing = acc.find(item => item.userId === current.userId);
    if (!existing) {
      acc.push({
        ...current,
        suggestionReason: current.mutualCount ? 'mutual_friends' : 'shared_servers'
      });
    }
    return acc;
  }, []);

  res.json({
    success: true,
    data: {
      suggestions: uniqueSuggestions.slice(0, limit),
      total: uniqueSuggestions.length
    }
  });
}));

// Create massive study server (supports up to 10 million members!)
router.post('/servers/create', [
  body('name').notEmpty().isLength({ min: 1, max: 100 }).withMessage('Server name must be 1-100 characters'),
  body('description').optional().isLength({ max: 2000 }).withMessage('Description too long'),
  body('primarySubject').isString().withMessage('Primary subject is required'),
  body('gradeLevel').optional().isString().withMessage('Grade level must be a string'),
  body('isPublic').optional().isBoolean().withMessage('IsPublic must be boolean'),
  body('maxMembers').optional().isInt({ min: 1, max: 10000000 }).withMessage('Max members must be 1-10,000,000'),
  body('verificationLevel').optional().isInt({ min: 0, max: 4 }).withMessage('Verification level must be 0-4')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    name,
    description,
    primarySubject,
    secondarySubjects = [],
    gradeLevel,
    institutionType,
    isPublic = false,
    maxMembers = 100000,
    verificationLevel = 0,
    features = []
  } = req.body;
  const userId = req.user.id;

  // Create the server
  const newServer = await db.insert(studyServers)
    .values({
      name,
      description,
      ownerId: userId,
      primarySubject,
      secondarySubjects,
      gradeLevel,
      institutionType,
      isPublic,
      maxMembers,
      verificationLevel,
      features,
      currentMembers: 1
    })
    .returning();

  const serverId = newServer[0].id;

  // Create default channels
  const defaultChannels = [
    { name: 'general', type: 0, topic: 'General discussion' },
    { name: 'announcements', type: 0, topic: 'Important announcements' },
    { name: 'study-help', type: 0, topic: 'Ask for help with your studies' },
    { name: 'General Voice', type: 2, topic: 'General voice chat' },
    { name: 'Study Session', type: 2, topic: 'Voice channel for study sessions' }
  ];

  const createdChannels = await db.insert(studyChannels)
    .values(
      defaultChannels.map((channel, index) => ({
        serverId,
        name: channel.name,
        type: channel.type,
        topic: channel.topic,
        position: index,
        studyMode: channel.name.includes('Study'),
        whiteboardEnabled: channel.name.includes('Study'),
        pomodoroTimer: channel.name.includes('Study')
      }))
    )
    .returning();

  // Create default roles
  const defaultRoles = [
    { name: '@everyone', permissions: '104324673', position: 0, color: '#000000' },
    { name: 'Student', permissions: '104857409', position: 1, color: '#3498db', tutorPermissions: false },
    { name: 'Tutor', permissions: '104857473', position: 2, color: '#e74c3c', tutorPermissions: true },
    { name: 'Moderator', permissions: '268435544', position: 3, color: '#f39c12', moderatorLevel: 1 },
    { name: 'Admin', permissions: '2147483647', position: 4, color: '#9b59b6', moderatorLevel: 2 }
  ];

  const createdRoles = await db.insert(serverRoles)
    .values(
      defaultRoles.map(role => ({
        serverId,
        ...role
      }))
    )
    .returning();

  // Add owner as member with admin role
  await db.insert(serverMemberships)
    .values({
      serverId,
      userId,
      isOwner: true,
      roles: [createdRoles.find(r => r.name === 'Admin').roleId],
      joinedAt: new Date(),
      lastActivity: new Date()
    });

  res.json({
    success: true,
    message: 'Study server created successfully',
    data: {
      server: newServer[0],
      channels: createdChannels,
      roles: createdRoles
    }
  });
}));

// Join massive study server with invite code or direct link
router.post('/servers/:serverId/join', [
  param('serverId').isUUID().withMessage('Invalid server ID'),
  body('inviteCode').optional().isString().withMessage('Invalid invite code')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { serverId } = req.params;
  const { inviteCode } = req.body;
  const userId = req.user.id;

  // Get server details
  const server = await db.select()
    .from(studyServers)
    .where(eq(studyServers.serverId, serverId))
    .limit(1);

  if (!server.length) {
    throw new AppError('Server not found', 404, 'SERVER_NOT_FOUND');
  }

  const serverData = server[0];

  // Check if server is at capacity
  if (serverData.currentMembers >= serverData.maxMembers) {
    throw new AppError('Server is at maximum capacity', 400, 'SERVER_FULL');
  }

  // Check if user is already a member
  const existingMembership = await db.select()
    .from(serverMemberships)
    .where(and(
      eq(serverMemberships.serverId, serverData.id),
      eq(serverMemberships.userId, userId)
    ))
    .limit(1);

  if (existingMembership.length > 0) {
    throw new AppError('Already a member of this server', 400, 'ALREADY_MEMBER');
  }

  // Check server access requirements
  if (!serverData.isPublic && !inviteCode) {
    throw new AppError('This server requires an invite', 403, 'INVITE_REQUIRED');
  }

  // TODO: Validate invite code if provided
  // if (inviteCode) {
  //   const invite = await validateInviteCode(inviteCode, serverData.id);
  //   if (!invite) {
  //     throw new AppError('Invalid invite code', 400, 'INVALID_INVITE');
  //   }
  // }

  // Get default member role
  const defaultRole = await db.select()
    .from(serverRoles)
    .where(and(
      eq(serverRoles.serverId, serverData.id),
      eq(serverRoles.name, 'Student')
    ))
    .limit(1);

  // Add user as member
  const newMembership = await db.insert(serverMemberships)
    .values({
      serverId: serverData.id,
      userId,
      roles: defaultRole.length > 0 ? [defaultRole[0].roleId] : [],
      pending: serverData.verificationLevel > 0,
      joinedAt: new Date(),
      lastActivity: new Date()
    })
    .returning();

  // Update server member count
  await db.update(studyServers)
    .set({ 
      currentMembers: sql`${studyServers.currentMembers} + 1`,
      lastActivity: new Date()
    })
    .where(eq(studyServers.id, serverData.id));

  // TODO: Send welcome message and notifications
  // await sendWelcomeMessage(serverData.id, userId);
  // await notifyServerOwnerOfNewMember(serverData.ownerId, userId);

  res.json({
    success: true,
    message: 'Successfully joined the server',
    data: {
      membership: newMembership[0],
      server: serverData,
      pending: newMembership[0].pending
    }
  });
}));

// Get user's servers with member counts and activity
router.get('/servers', [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['owned', 'member', 'all']).withMessage('Invalid server type')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 50;
  const type = req.query.type || 'all';

  let query = db.select({
    serverId: studyServers.serverId,
    name: studyServers.name,
    description: studyServers.description,
    icon: studyServers.icon,
    banner: studyServers.banner,
    primarySubject: studyServers.primarySubject,
    isOwner: serverMemberships.isOwner,
    memberCount: studyServers.currentMembers,
    maxMembers: studyServers.maxMembers,
    isVerified: studyServers.isVerified,
    isPartnered: studyServers.isPartnered,
    boostLevel: studyServers.boostLevel,
    lastActivity: studyServers.lastActivity,
    joinedAt: serverMemberships.joinedAt,
    userRoles: serverMemberships.roles,
    unreadCount: sql`0`.as('unreadCount') // TODO: Calculate actual unread count
  })
    .from(serverMemberships)
    .innerJoin(studyServers, eq(serverMemberships.serverId, studyServers.id))
    .where(eq(serverMemberships.userId, userId));

  if (type === 'owned') {
    query = query.where(eq(serverMemberships.isOwner, true));
  } else if (type === 'member') {
    query = query.where(eq(serverMemberships.isOwner, false));
  }

  const servers = await query
    .orderBy(desc(studyServers.lastActivity))
    .limit(limit);

  // Get quick stats for each server
  const serverStats = await Promise.all(
    servers.map(async (server) => {
      const stats = await db.select({
        channelCount: sql`count(*)`.as('channelCount'),
        activeMembers: sql`count(case when ${serverMemberships.lastActivity} > now() - interval '7 days' then 1 end)`.as('activeMembers')
      })
        .from(studyChannels)
        .leftJoin(serverMemberships, eq(studyChannels.serverId, serverMemberships.serverId))
        .where(eq(studyChannels.serverId, server.serverId))
        .groupBy(studyChannels.serverId);

      return {
        ...server,
        stats: stats[0] || { channelCount: 0, activeMembers: 0 }
      };
    })
  );

  res.json({
    success: true,
    data: {
      servers: serverStats,
      total: servers.length
    }
  });
}));

// Real-time messaging system
router.post('/messages/send', [
  body('channelId').isUUID().withMessage('Invalid channel ID'),
  body('content').optional().isLength({ min: 1, max: 4000 }).withMessage('Message content must be 1-4000 characters'),
  body('recipientId').optional().isInt().withMessage('Invalid recipient ID'),
  body('attachments').optional().isArray().withMessage('Attachments must be an array'),
  body('embeds').optional().isArray().withMessage('Embeds must be an array'),
  body('studyContent').optional().isObject().withMessage('Study content must be an object')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    channelId,
    content,
    recipientId,
    attachments = [],
    embeds = [],
    studyContent = {},
    sharedNote,
    sharedQuiz,
    tts = false
  } = req.body;
  const userId = req.user.id;

  // Validate that message has content
  if (!content && attachments.length === 0 && embeds.length === 0 && !sharedNote && !sharedQuiz) {
    throw new AppError('Message must have content, attachments, embeds, or shared content', 400, 'EMPTY_MESSAGE');
  }

  // Check if user can send messages in this channel/DM
  // TODO: Implement permission checking for server channels
  // if (isServerChannel) {
  //   const hasPermission = await checkChannelPermissions(userId, channelId, 'SEND_MESSAGES');
  //   if (!hasPermission) {
  //     throw new AppError('No permission to send messages in this channel', 403, 'NO_PERMISSION');
  //   }
  // }

  // For DMs, check if users are friends or allow DMs from everyone
  if (recipientId) {
    const targetProfile = await db.select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, recipientId))
      .limit(1);

    if (targetProfile[0]?.allowDirectMessages === 'none') {
      throw new AppError('User does not accept direct messages', 403, 'DMS_DISABLED');
    }

    if (targetProfile[0]?.allowDirectMessages === 'friends') {
      const friendship = await db.select()
        .from(friendships)
        .where(or(
          and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, recipientId)),
          and(eq(friendships.requesterId, recipientId), eq(friendships.addresseeId, userId))
        ))
        .limit(1);

      if (!friendship.length || friendship[0].status !== 'accepted') {
        throw new AppError('You must be friends to send direct messages', 403, 'NOT_FRIENDS');
      }
    }
  }

  // Create the message
  const newMessage = await db.insert(directMessages)
    .values({
      channelId,
      authorId: userId,
      recipientId,
      content,
      attachments,
      embeds,
      studyContent,
      sharedNote,
      sharedQuiz,
      tts,
      type: 0 // Default message type
    })
    .returning();

  // Update channel activity
  if (recipientId) {
    // Update DM channel last message
    // TODO: Update DM channel metadata
  } else {
    // Update server channel
    await db.update(studyChannels)
      .set({
        messageCount: sql`${studyChannels.messageCount} + 1`,
        lastMessageAt: new Date()
      })
      .where(eq(studyChannels.channelId, channelId));
  }

  // Update friendship interaction if DM
  if (recipientId) {
    await db.update(friendships)
      .set({
        lastInteraction: new Date(),
        interactionCount: sql`${friendships.interactionCount} + 1`,
        messageCount: sql`${friendships.messageCount} + 1`
      })
      .where(or(
        and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, recipientId)),
        and(eq(friendships.requesterId, recipientId), eq(friendships.addresseeId, userId))
      ));
  }

  // TODO: Send real-time message via Socket.io
  // if (recipientId) {
  //   socketManager.sendToUser(recipientId, 'direct_message', newMessage[0]);
  // } else {
  //   socketManager.sendToChannel(channelId, 'channel_message', newMessage[0]);
  // }

  res.json({
    success: true,
    message: 'Message sent successfully',
    data: newMessage[0]
  });
}));

// Start voice/video call
router.post('/calls/start', [
  body('type').isIn(['voice', 'video', 'screen_share', 'study_session']).withMessage('Invalid call type'),
  body('channelId').optional().isUUID().withMessage('Invalid channel ID'),
  body('recipientId').optional().isInt().withMessage('Invalid recipient ID'),
  body('maxParticipants').optional().isInt({ min: 2, max: 1000 }).withMessage('Max participants must be 2-1000'),
  body('studyTopic').optional().isString().withMessage('Study topic must be a string'),
  body('studySubject').optional().isString().withMessage('Study subject must be a string')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    type,
    channelId,
    recipientId,
    maxParticipants = 25,
    studyTopic,
    studySubject,
    pomodoroSession = false
  } = req.body;
  const userId = req.user.id;

  // Validate call setup
  if (!channelId && !recipientId) {
    throw new AppError('Must specify either channel ID or recipient ID', 400, 'INVALID_CALL_SETUP');
  }

  // For DM calls, check friendship
  if (recipientId) {
    const friendship = await db.select()
      .from(friendships)
      .where(or(
        and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, recipientId)),
        and(eq(friendships.requesterId, recipientId), eq(friendships.addresseeId, userId))
      ))
      .limit(1);

    if (!friendship.length || friendship[0].status !== 'accepted') {
      throw new AppError('You must be friends to start a call', 403, 'NOT_FRIENDS');
    }
  }

  // Create the call
  const newCall = await db.insert(voiceCalls)
    .values({
      type,
      channelId,
      dmChannelId: recipientId ? `dm_${Math.min(userId, recipientId)}_${Math.max(userId, recipientId)}` : null,
      hostId: userId,
      participants: [userId],
      maxParticipants,
      status: 'waiting',
      studyTopic,
      studySubject,
      pomodoroSession,
      studyMode: type === 'study_session',
      hasWhiteboard: type === 'study_session',
      region: 'us-west' // TODO: Determine optimal region
    })
    .returning();

  // Update user presence
  await db.update(userPresence)
    .set({
      activities: sql`jsonb_set(${userPresence.activities}, '{0}', '{"type": "voice", "callId": "${newCall[0].callId}"}')`,
      lastActivity: new Date()
    })
    .where(eq(userPresence.userId, userId));

  // TODO: Send call invitation via Socket.io
  // if (recipientId) {
  //   socketManager.sendToUser(recipientId, 'call_invitation', {
  //     callId: newCall[0].callId,
  //     hostId: userId,
  //     type,
  //     studyTopic
  //   });
  // } else if (channelId) {
  //   socketManager.sendToChannel(channelId, 'call_started', {
  //     callId: newCall[0].callId,
  //     hostId: userId,
  //     type
  //   });
  // }

  res.json({
    success: true,
    message: 'Call started successfully',
    data: newCall[0]
  });
}));

// Update user presence and status
router.put('/presence', [
  body('status').isIn(['online', 'idle', 'dnd', 'invisible', 'offline']).withMessage('Invalid status'),
  body('customStatus').optional().isLength({ max: 100 }).withMessage('Custom status too long'),
  body('statusEmoji').optional().isLength({ max: 10 }).withMessage('Status emoji too long'),
  body('currentStudySession').optional().isInt().withMessage('Invalid study session ID'),
  body('studySubject').optional().isString().withMessage('Study subject must be a string')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    status,
    customStatus,
    statusEmoji,
    activities = [],
    currentStudySession,
    studySubject,
    device = 'web',
    platform = 'unknown'
  } = req.body;
  const userId = req.user.id;

  // Update presence
  const updatedPresence = await db.insert(userPresence)
    .values({
      userId,
      status,
      customStatus,
      statusEmoji,
      activities,
      currentStudySession,
      studySubject,
      device,
      platform,
      lastSeen: new Date(),
      lastOnline: status !== 'offline' ? new Date() : undefined,
      lastActivity: new Date()
    })
    .onConflictDoUpdate({
      target: userPresence.userId,
      set: {
        status,
        customStatus,
        statusEmoji,
        activities,
        currentStudySession,
        studySubject,
        device,
        platform,
        lastSeen: new Date(),
        lastOnline: status !== 'offline' ? new Date() : undefined,
        lastActivity: new Date(),
        updatedAt: new Date()
      }
    })
    .returning();

  // TODO: Broadcast presence update to friends and servers
  // socketManager.broadcastPresenceUpdate(userId, updatedPresence[0]);

  res.json({
    success: true,
    message: 'Presence updated successfully',
    data: updatedPresence[0]
  });
}));

// Get massive server member list with pagination and filtering
router.get('/servers/:serverId/members', [
  param('serverId').isUUID().withMessage('Invalid server ID'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('roleId').optional().isUUID().withMessage('Invalid role ID'),
  query('status').optional().isIn(['online', 'offline', 'all']).withMessage('Invalid status filter')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { serverId } = req.params;
  const {
    limit = 100,
    offset = 0,
    search,
    roleId,
    status = 'all'
  } = req.query;

  // Get server
  const server = await db.select()
    .from(studyServers)
    .where(eq(studyServers.serverId, serverId))
    .limit(1);

  if (!server.length) {
    throw new AppError('Server not found', 404, 'SERVER_NOT_FOUND');
  }

  // Check if user is member of the server
  const membership = await db.select()
    .from(serverMemberships)
    .where(and(
      eq(serverMemberships.serverId, server[0].id),
      eq(serverMemberships.userId, req.user.id)
    ))
    .limit(1);

  if (!membership.length) {
    throw new AppError('You are not a member of this server', 403, 'NOT_MEMBER');
  }

  // Build member query
  let query = db.select({
    userId: users.id,
    username: users.username,
    firstName: users.firstName,
    lastName: users.lastName,
    avatar: users.avatar,
    nickname: serverMemberships.nickname,
    roles: serverMemberships.roles,
    joinedAt: serverMemberships.joinedAt,
    lastActivity: serverMemberships.lastActivity,
    isOwner: serverMemberships.isOwner,
    status: userPresence.status,
    customStatus: userPresence.customStatus,
    currentActivity: userPresence.activities
  })
    .from(serverMemberships)
    .innerJoin(users, eq(serverMemberships.userId, users.id))
    .leftJoin(userPresence, eq(userPresence.userId, users.id))
    .where(eq(serverMemberships.serverId, server[0].id));

  // Apply filters
  if (search) {
    query = query.where(or(
      like(users.username, `%${search}%`),
      like(users.firstName, `%${search}%`),
      like(users.lastName, `%${search}%`),
      like(serverMemberships.nickname, `%${search}%`)
    ));
  }

  if (roleId) {
    query = query.where(sql`${serverMemberships.roles} ? ${roleId}`);
  }

  if (status === 'online') {
    query = query.where(inArray(userPresence.status, ['online', 'idle', 'dnd']));
  } else if (status === 'offline') {
    query = query.where(or(
      eq(userPresence.status, 'offline'),
      sql`${userPresence.status} IS NULL`
    ));
  }

  const members = await query
    .orderBy(
      desc(serverMemberships.isOwner), // Owner first
      asc(users.username) // Then alphabetical
    )
    .limit(parseInt(limit))
    .offset(parseInt(offset));

  // Get total count for pagination
  const totalCount = await db.select({ count: sql`count(*)` })
    .from(serverMemberships)
    .where(eq(serverMemberships.serverId, server[0].id));

  res.json({
    success: true,
    data: {
      members,
      pagination: {
        total: totalCount[0].count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + members.length < totalCount[0].count
      }
    }
  });
}));

// Get comprehensive server analytics
router.get('/servers/:serverId/analytics', [
  param('serverId').isUUID().withMessage('Invalid server ID'),
  query('timeframe').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Invalid timeframe')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { serverId } = req.params;
  const { timeframe = 'week' } = req.query;

  // Get server and check permissions
  const server = await db.select()
    .from(studyServers)
    .where(eq(studyServers.serverId, serverId))
    .limit(1);

  if (!server.length) {
    throw new AppError('Server not found', 404, 'SERVER_NOT_FOUND');
  }

  // Check if user is owner or has admin permissions
  const membership = await db.select()
    .from(serverMemberships)
    .where(and(
      eq(serverMemberships.serverId, server[0].id),
      eq(serverMemberships.userId, req.user.id)
    ))
    .limit(1);

  if (!membership.length || (!membership[0].isOwner && !hasAdminPermissions(membership[0].roles))) {
    throw new AppError('Insufficient permissions to view analytics', 403, 'INSUFFICIENT_PERMISSIONS');
  }

  // Calculate time range
  const timeMap = {
    day: '1 day',
    week: '7 days',
    month: '30 days',
    year: '365 days'
  };
  const timeRange = timeMap[timeframe];

  // Get comprehensive analytics
  const analytics = await Promise.all([
    // Member growth
    db.select({
      date: sql`date_trunc('day', ${serverMemberships.joinedAt})`,
      newMembers: sql`count(*)`
    })
      .from(serverMemberships)
      .where(and(
        eq(serverMemberships.serverId, server[0].id),
        sql`${serverMemberships.joinedAt} > now() - interval '${timeRange}'`
      ))
      .groupBy(sql`date_trunc('day', ${serverMemberships.joinedAt})`)
      .orderBy(sql`date_trunc('day', ${serverMemberships.joinedAt})`),

    // Message activity
    db.select({
      totalMessages: sql`count(*)`,
      uniqueAuthors: sql`count(distinct ${directMessages.authorId})`
    })
      .from(directMessages)
      .where(sql`${directMessages.createdAt} > now() - interval '${timeRange}'`),

    // Active members
    db.select({
      activeMembers: sql`count(distinct ${serverMemberships.userId})`
    })
      .from(serverMemberships)
      .where(and(
        eq(serverMemberships.serverId, server[0].id),
        sql`${serverMemberships.lastActivity} > now() - interval '${timeRange}'`
      )),

    // Top channels by activity
    db.select({
      channelId: studyChannels.channelId,
      channelName: studyChannels.name,
      messageCount: studyChannels.messageCount
    })
      .from(studyChannels)
      .where(eq(studyChannels.serverId, server[0].id))
      .orderBy(desc(studyChannels.messageCount))
      .limit(10)
  ]);

  res.json({
    success: true,
    data: {
      server: server[0],
      timeframe,
      memberGrowth: analytics[0],
      messageActivity: analytics[1][0],
      activeMembers: analytics[2][0],
      topChannels: analytics[3],
      summary: {
        totalMembers: server[0].currentMembers,
        totalChannels: await db.select({ count: sql`count(*)` }).from(studyChannels).where(eq(studyChannels.serverId, server[0].id)),
        totalMessages: server[0].totalMessages,
        totalStudyTime: server[0].totalStudyTime,
        activityScore: server[0].activityScore
      }
    }
  });
}));

// Helper function to check admin permissions
function hasAdminPermissions(roles) {
  // TODO: Implement proper permission checking
  return false; // Placeholder
}

export default router;