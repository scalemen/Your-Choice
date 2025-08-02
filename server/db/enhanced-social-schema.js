import { pgTable, serial, text, varchar, boolean, timestamp, integer, jsonb, decimal, index, foreignKey, bigint, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './schema.js';

// Enhanced user profiles with Discord-style features
export const userProfiles = pgTable('user_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  
  // Discord-style username system
  discriminator: varchar('discriminator', { length: 4 }).notNull(), // Like #1234
  displayName: varchar('display_name', { length: 100 }).notNull(),
  globalName: varchar('global_name', { length: 100 }), // New Discord global display name
  
  // Status and presence
  status: varchar('status', { length: 20 }).default('online'), // online, idle, dnd, invisible, offline
  customStatus: varchar('custom_status', { length: 100 }),
  statusEmoji: varchar('status_emoji', { length: 10 }),
  
  // Profile customization
  banner: text('banner'), // Profile banner image
  bannerColor: varchar('banner_color', { length: 7 }), // Hex color
  accentColor: varchar('accent_color', { length: 7 }),
  theme: varchar('theme', { length: 20 }).default('dark'), // dark, light, auto
  
  // Activity and presence
  currentActivity: jsonb('current_activity').default({}), // What they're doing
  gameActivity: jsonb('game_activity').default({}), // Current game/study session
  musicActivity: jsonb('music_activity').default({}), // Spotify-like integration
  
  // Communication preferences
  allowDirectMessages: varchar('allow_direct_messages', { length: 20 }).default('friends'), // everyone, friends, none
  allowFriendRequests: boolean('allow_friend_requests').default(true),
  showOnlineStatus: boolean('show_online_status').default(true),
  showCurrentActivity: boolean('show_current_activity').default(true),
  
  // Verification and badges
  isVerified: boolean('is_verified').default(false),
  badges: jsonb('badges').default([]), // Array of badge IDs
  nitroType: varchar('nitro_type', { length: 20 }), // basic, classic, premium (StudyGenius Premium)
  
  // Privacy settings
  profileVisibility: varchar('profile_visibility', { length: 20 }).default('public'),
  showMutualServers: boolean('show_mutual_servers').default(true),
  showMutualFriends: boolean('show_mutual_friends').default(true),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  discriminatorIdx: index('user_profiles_discriminator_idx').on(table.discriminator),
  globalNameIdx: index('user_profiles_global_name_idx').on(table.globalName),
  statusIdx: index('user_profiles_status_idx').on(table.status)
}));

// Enhanced friendship system
export const friendships = pgTable('friendships', {
  id: serial('id').primaryKey(),
  requesterId: integer('requester_id').references(() => users.id).notNull(),
  addresseeId: integer('addressee_id').references(() => users.id).notNull(),
  
  // Friendship status
  status: varchar('status', { length: 20 }).default('pending'), // pending, accepted, blocked, removed
  friendshipType: varchar('friendship_type', { length: 20 }).default('friend'), // friend, best_friend, blocked
  
  // Request metadata
  requestMessage: text('request_message'), // Optional message with friend request
  requestedAt: timestamp('requested_at').defaultNow(),
  respondedAt: timestamp('responded_at'),
  
  // Friendship interaction data
  lastInteraction: timestamp('last_interaction'),
  interactionCount: integer('interaction_count').default(0),
  messageCount: bigint('message_count', { mode: 'number' }).default(0),
  callTime: bigint('call_time', { mode: 'number' }).default(0), // Total minutes in calls
  studyTime: bigint('study_time', { mode: 'number' }).default(0), // Time studied together
  
  // Customization
  nickname: varchar('nickname', { length: 100 }), // Custom nickname for this friend
  isFavorite: boolean('is_favorite').default(false),
  notificationSettings: jsonb('notification_settings').default({}),
  
  // Privacy and blocking
  isHidden: boolean('is_hidden').default(false), // Hide from friend list
  blockReason: text('block_reason'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  uniqueFriendship: index('friendships_unique_idx').on(table.requesterId, table.addresseeId),
  statusIdx: index('friendships_status_idx').on(table.status),
  favoriteIdx: index('friendships_favorite_idx').on(table.isFavorite)
}));

// Massive study groups supporting millions of users
export const studyServers = pgTable('study_servers', {
  id: serial('id').primaryKey(),
  serverId: uuid('server_id').defaultRandom().notNull().unique(), // Public server ID
  
  // Basic server info
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  icon: text('icon'),
  banner: text('banner'),
  splash: text('splash'), // Invite splash image
  
  // Server configuration
  ownerId: integer('owner_id').references(() => users.id).notNull(),
  region: varchar('region', { length: 50 }).default('us-west'),
  preferredLocale: varchar('preferred_locale', { length: 10 }).default('en-US'),
  
  // Capacity and limits (supporting massive scale)
  maxMembers: bigint('max_members', { mode: 'number' }).default(10000000), // 10 million!
  currentMembers: bigint('current_members', { mode: 'number' }).default(1),
  maxChannels: integer('max_channels').default(500),
  maxRoles: integer('max_roles').default(250),
  
  // Server features and boosts
  features: jsonb('features').default([]), // COMMUNITY, VERIFIED, PARTNERED, etc.
  boostLevel: integer('boost_level').default(0), // 0-3 (like Discord Nitro boosts)
  boostCount: integer('boost_count').default(0),
  premiumSubscriptionCount: integer('premium_subscription_count').default(0),
  
  // Discovery and verification
  isPublic: boolean('is_public').default(false),
  isVerified: boolean('is_verified').default(false),
  isPartnered: boolean('is_partnered').default(false),
  discoverable: boolean('discoverable').default(false),
  invitesDisabled: boolean('invites_disabled').default(false),
  
  // Categories and subjects
  primarySubject: varchar('primary_subject', { length: 100 }),
  secondarySubjects: jsonb('secondary_subjects').default([]),
  gradeLevel: varchar('grade_level', { length: 50 }),
  institutionType: varchar('institution_type', { length: 50 }), // university, high_school, etc.
  
  // Moderation settings
  verificationLevel: integer('verification_level').default(0), // 0-4 like Discord
  defaultMessageNotifications: integer('default_message_notifications').default(0),
  explicitContentFilter: integer('explicit_content_filter').default(2),
  mfaLevel: integer('mfa_level').default(0),
  
  // Analytics and engagement
  totalMessages: bigint('total_messages', { mode: 'number' }).default(0),
  totalStudyTime: bigint('total_study_time', { mode: 'number' }).default(0),
  totalEvents: integer('total_events').default(0),
  activityScore: decimal('activity_score', { precision: 10, scale: 2 }).default('0'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastActivity: timestamp('last_activity').defaultNow()
}, (table) => ({
  serverIdIdx: index('study_servers_server_id_idx').on(table.serverId),
  ownerIdx: index('study_servers_owner_idx').on(table.ownerId),
  publicIdx: index('study_servers_public_idx').on(table.isPublic),
  subjectIdx: index('study_servers_subject_idx').on(table.primarySubject),
  membersIdx: index('study_servers_members_idx').on(table.currentMembers)
}));

// Channel system for massive servers
export const studyChannels = pgTable('study_channels', {
  id: serial('id').primaryKey(),
  channelId: uuid('channel_id').defaultRandom().notNull().unique(),
  serverId: integer('server_id').references(() => studyServers.id).notNull(),
  
  // Channel info
  name: varchar('name', { length: 100 }).notNull(),
  topic: text('topic'),
  type: integer('type').notNull(), // 0: text, 2: voice, 4: category, 13: stage, 15: forum
  position: integer('position').default(0),
  
  // Channel configuration
  parentId: integer('parent_id').references(() => studyChannels.id), // Category parent
  isNsfw: boolean('is_nsfw').default(false),
  rateLimitPerUser: integer('rate_limit_per_user').default(0), // Slowmode in seconds
  
  // Permissions and access
  permissionOverwrites: jsonb('permission_overwrites').default([]),
  defaultAutoArchiveDuration: integer('default_auto_archive_duration').default(4320), // 3 days
  
  // Voice channel specific
  bitrate: integer('bitrate').default(64000), // Voice quality
  userLimit: integer('user_limit').default(0), // 0 = unlimited
  videoQualityMode: integer('video_quality_mode').default(1), // 1: auto, 2: full
  
  // Forum channel specific (for study discussions)
  availableTags: jsonb('available_tags').default([]),
  defaultReactionEmoji: varchar('default_reaction_emoji', { length: 100 }),
  defaultThreadRateLimitPerUser: integer('default_thread_rate_limit_per_user').default(0),
  defaultSortOrder: integer('default_sort_order').default(0),
  
  // Study-specific features
  studyMode: boolean('study_mode').default(false), // Special study-focused mode
  pomodoroTimer: boolean('pomodoro_timer').default(false),
  whiteboardEnabled: boolean('whiteboard_enabled').default(false),
  screenShareEnabled: boolean('screen_share_enabled').default(true),
  
  // Analytics
  messageCount: bigint('message_count', { mode: 'number' }).default(0),
  lastMessageAt: timestamp('last_message_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  channelIdIdx: index('study_channels_channel_id_idx').on(table.channelId),
  serverIdx: index('study_channels_server_idx').on(table.serverId),
  typeIdx: index('study_channels_type_idx').on(table.type),
  parentIdx: index('study_channels_parent_idx').on(table.parentId)
}));

// Massive server memberships with roles and permissions
export const serverMemberships = pgTable('server_memberships', {
  id: serial('id').primaryKey(),
  serverId: integer('server_id').references(() => studyServers.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  
  // Member info
  nickname: varchar('nickname', { length: 100 }),
  avatar: text('avatar'), // Server-specific avatar
  banner: text('banner'), // Server-specific banner
  
  // Membership details
  joinedAt: timestamp('joined_at').defaultNow(),
  premiumSince: timestamp('premium_since'), // When they started boosting
  communicationDisabledUntil: timestamp('communication_disabled_until'), // Timeout
  
  // Member status in server
  isOwner: boolean('is_owner').default(false),
  pending: boolean('pending').default(false), // Waiting for verification
  deaf: boolean('deaf').default(false),
  mute: boolean('mute').default(false),
  
  // Engagement metrics
  messageCount: bigint('message_count', { mode: 'number' }).default(0),
  voiceTime: bigint('voice_time', { mode: 'number' }).default(0), // Minutes in voice
  studyTime: bigint('study_time', { mode: 'number' }).default(0),
  helpfulnessScore: decimal('helpfulness_score', { precision: 5, scale: 2 }).default('0'),
  lastActivity: timestamp('last_activity'),
  
  // Permissions and roles
  permissions: varchar('permissions', { length: 20 }).default('0'), // Bitfield for permissions
  roles: jsonb('roles').default([]), // Array of role IDs
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  uniqueMembership: index('server_memberships_unique_idx').on(table.serverId, table.userId),
  userIdx: index('server_memberships_user_idx').on(table.userId),
  joinedIdx: index('server_memberships_joined_idx').on(table.joinedAt),
  activityIdx: index('server_memberships_activity_idx').on(table.lastActivity)
}));

// Role system for servers
export const serverRoles = pgTable('server_roles', {
  id: serial('id').primaryKey(),
  roleId: uuid('role_id').defaultRandom().notNull().unique(),
  serverId: integer('server_id').references(() => studyServers.id).notNull(),
  
  // Role info
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }).default('#000000'), // Hex color
  hoist: boolean('hoist').default(false), // Display separately in member list
  position: integer('position').default(0),
  
  // Role configuration
  permissions: varchar('permissions', { length: 20 }).default('0'), // Bitfield
  managed: boolean('managed').default(false), // Bot/integration role
  mentionable: boolean('mentionable').default(false),
  
  // Role icon and customization
  icon: text('icon'), // Role icon image
  unicodeEmoji: varchar('unicode_emoji', { length: 100 }),
  
  // Study-specific role features
  studyGroupAccess: jsonb('study_group_access').default([]), // Which study groups this role can access
  tutorPermissions: boolean('tutor_permissions').default(false),
  moderatorLevel: integer('moderator_level').default(0), // 0-3 for different mod levels
  
  // Analytics
  memberCount: integer('member_count').default(0),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  roleIdIdx: index('server_roles_role_id_idx').on(table.roleId),
  serverIdx: index('server_roles_server_idx').on(table.serverId),
  positionIdx: index('server_roles_position_idx').on(table.position)
}));

// Comprehensive messaging system
export const directMessages = pgTable('direct_messages', {
  id: serial('id').primaryKey(),
  messageId: uuid('message_id').defaultRandom().notNull().unique(),
  
  // Message routing
  channelId: uuid('channel_id').notNull(), // DM channel ID
  authorId: integer('author_id').references(() => users.id).notNull(),
  recipientId: integer('recipient_id').references(() => users.id), // For DMs
  
  // Message content
  content: text('content'),
  type: integer('type').default(0), // 0: default, 1: recipient_add, etc.
  
  // Message features
  tts: boolean('tts').default(false), // Text-to-speech
  mentionEveryone: boolean('mention_everyone').default(false),
  mentions: jsonb('mentions').default([]), // User mentions
  mentionRoles: jsonb('mention_roles').default([]),
  mentionChannels: jsonb('mention_channels').default([]),
  
  // Attachments and embeds
  attachments: jsonb('attachments').default([]),
  embeds: jsonb('embeds').default([]),
  reactions: jsonb('reactions').default([]),
  
  // Message status
  pinned: boolean('pinned').default(false),
  edited: boolean('edited').default(false),
  editedAt: timestamp('edited_at'),
  
  // Study-specific features
  studyContent: jsonb('study_content').default({}), // Embedded study materials
  sharedNote: integer('shared_note_id'), // Reference to shared note
  sharedQuiz: integer('shared_quiz_id'), // Reference to shared quiz
  studySession: integer('study_session_id'), // Reference to study session
  
  // Thread support
  thread: jsonb('thread').default({}), // Thread metadata if this starts a thread
  
  // Message flags and moderation
  flags: integer('flags').default(0), // Bitfield for various flags
  deleted: boolean('deleted').default(false),
  deletedAt: timestamp('deleted_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  messageIdIdx: index('direct_messages_message_id_idx').on(table.messageId),
  channelIdx: index('direct_messages_channel_idx').on(table.channelId),
  authorIdx: index('direct_messages_author_idx').on(table.authorId),
  recipientIdx: index('direct_messages_recipient_idx').on(table.recipientId),
  createdIdx: index('direct_messages_created_idx').on(table.createdAt)
}));

// Voice and video call system
export const voiceCalls = pgTable('voice_calls', {
  id: serial('id').primaryKey(),
  callId: uuid('call_id').defaultRandom().notNull().unique(),
  
  // Call configuration
  type: varchar('type', { length: 20 }).notNull(), // voice, video, screen_share, study_session
  channelId: uuid('channel_id'), // Voice channel if in server
  dmChannelId: uuid('dm_channel_id'), // DM channel if private call
  
  // Call participants
  hostId: integer('host_id').references(() => users.id).notNull(),
  participants: jsonb('participants').default([]), // Array of user IDs
  maxParticipants: integer('max_participants').default(25), // Can be increased for study sessions
  
  // Call status
  status: varchar('status', { length: 20 }).default('waiting'), // waiting, active, ended
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  duration: integer('duration').default(0), // Seconds
  
  // Call features
  isRecording: boolean('is_recording').default(false),
  hasScreenShare: boolean('has_screen_share').default(false),
  hasWhiteboard: boolean('has_whiteboard').default(false),
  studyMode: boolean('study_mode').default(false), // Special study features enabled
  
  // Study session specific
  studyTopic: varchar('study_topic', { length: 200 }),
  studySubject: varchar('study_subject', { length: 100 }),
  pomodoroSession: boolean('pomodoro_session').default(false),
  breakoutRooms: jsonb('breakout_rooms').default([]),
  
  // Quality and technical info
  region: varchar('region', { length: 50 }),
  bitrate: integer('bitrate').default(64000),
  codec: varchar('codec', { length: 20 }).default('opus'),
  
  // Analytics
  totalMessages: integer('total_messages').default(0),
  totalReactions: integer('total_reactions').default(0),
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  callIdIdx: index('voice_calls_call_id_idx').on(table.callId),
  hostIdx: index('voice_calls_host_idx').on(table.hostId),
  statusIdx: index('voice_calls_status_idx').on(table.status),
  typeIdx: index('voice_calls_type_idx').on(table.type)
}));

// Real-time presence and activity system
export const userPresence = pgTable('user_presence', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  
  // Current status
  status: varchar('status', { length: 20 }).default('offline'), // online, idle, dnd, invisible, offline
  clientStatus: jsonb('client_status').default({}), // Status per client (web, desktop, mobile)
  
  // Activity information
  activities: jsonb('activities').default([]), // Array of current activities
  customStatus: varchar('custom_status', { length: 100 }),
  statusEmoji: varchar('status_emoji', { length: 10 }),
  
  // Study activity tracking
  currentStudySession: integer('current_study_session'),
  studySubject: varchar('study_subject', { length: 100 }),
  studyStartTime: timestamp('study_start_time'),
  totalStudyTimeToday: integer('total_study_time_today').default(0),
  
  // Device and location info
  device: varchar('device', { length: 50 }), // web, desktop, mobile, tablet
  platform: varchar('platform', { length: 50 }), // windows, macos, ios, android, linux
  location: varchar('location', { length: 100 }), // City/region for study groups
  timezone: varchar('timezone', { length: 50 }),
  
  // Presence timestamps
  lastSeen: timestamp('last_seen').defaultNow(),
  lastOnline: timestamp('last_online'),
  lastActivity: timestamp('last_activity'),
  
  // Privacy settings
  showActivity: boolean('show_activity').default(true),
  showLocation: boolean('show_location').default(false),
  showStudyStatus: boolean('show_study_status').default(true),
  
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  statusIdx: index('user_presence_status_idx').on(table.status),
  lastSeenIdx: index('user_presence_last_seen_idx').on(table.lastSeen),
  studySubjectIdx: index('user_presence_study_subject_idx').on(table.studySubject)
}));

// Study session collaboration
export const studySessionParticipants = pgTable('study_session_participants', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id'), // References study session
  userId: integer('user_id').references(() => users.id).notNull(),
  
  // Participation details
  role: varchar('role', { length: 20 }).default('participant'), // host, moderator, participant, observer
  joinedAt: timestamp('joined_at').defaultNow(),
  leftAt: timestamp('left_at'),
  duration: integer('duration').default(0), // Minutes participated
  
  // Engagement metrics
  messagesCount: integer('messages_count').default(0),
  questionsAsked: integer('questions_asked').default(0),
  questionsAnswered: integer('questions_answered').default(0),
  helpfulnessRating: decimal('helpfulness_rating', { precision: 3, scale: 2 }),
  
  // Study contributions
  notesShared: integer('notes_shared').default(0),
  resourcesShared: integer('resources_shared').default(0),
  whiteboardContributions: integer('whiteboard_contributions').default(0),
  
  // Status and permissions
  isMuted: boolean('is_muted').default(false),
  isVideoOn: boolean('is_video_on').default(false),
  isScreenSharing: boolean('is_screen_sharing').default(false),
  canModerate: boolean('can_moderate').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  sessionUserIdx: index('study_session_participants_session_user_idx').on(table.sessionId, table.userId),
  roleIdx: index('study_session_participants_role_idx').on(table.role),
  joinedIdx: index('study_session_participants_joined_idx').on(table.joinedAt)
}));

// Define relationships
export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id]
  })
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  requester: one(users, {
    fields: [friendships.requesterId],
    references: [users.id]
  }),
  addressee: one(users, {
    fields: [friendships.addresseeId],
    references: [users.id]
  })
}));

export const studyServersRelations = relations(studyServers, ({ one, many }) => ({
  owner: one(users, {
    fields: [studyServers.ownerId],
    references: [users.id]
  }),
  channels: many(studyChannels),
  memberships: many(serverMemberships),
  roles: many(serverRoles)
}));

export const studyChannelsRelations = relations(studyChannels, ({ one, many }) => ({
  server: one(studyServers, {
    fields: [studyChannels.serverId],
    references: [studyServers.id]
  }),
  parent: one(studyChannels, {
    fields: [studyChannels.parentId],
    references: [studyChannels.id]
  }),
  children: many(studyChannels, {
    relationName: 'parent'
  })
}));

export const serverMembershipsRelations = relations(serverMemberships, ({ one }) => ({
  server: one(studyServers, {
    fields: [serverMemberships.serverId],
    references: [studyServers.id]
  }),
  user: one(users, {
    fields: [serverMemberships.userId],
    references: [users.id]
  })
}));

export const serverRolesRelations = relations(serverRoles, ({ one }) => ({
  server: one(studyServers, {
    fields: [serverRoles.serverId],
    references: [studyServers.id]
  })
}));

export const directMessagesRelations = relations(directMessages, ({ one }) => ({
  author: one(users, {
    fields: [directMessages.authorId],
    references: [users.id]
  }),
  recipient: one(users, {
    fields: [directMessages.recipientId],
    references: [users.id]
  })
}));

export const voiceCallsRelations = relations(voiceCalls, ({ one }) => ({
  host: one(users, {
    fields: [voiceCalls.hostId],
    references: [users.id]
  })
}));

export const userPresenceRelations = relations(userPresence, ({ one }) => ({
  user: one(users, {
    fields: [userPresence.userId],
    references: [users.id]
  })
}));

export const studySessionParticipantsRelations = relations(studySessionParticipants, ({ one }) => ({
  user: one(users, {
    fields: [studySessionParticipants.userId],
    references: [users.id]
  })
}));