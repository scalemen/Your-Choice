import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb, serial, numeric, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './schema.js';

// ==================== STUDYGRAM SOCIAL MEDIA SCHEMA ====================

// Posts - Main content sharing
export const socialPosts = pgTable('social_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  caption: text('caption'),
  imageUrls: jsonb('image_urls').default([]).notNull(), // Multiple images for carousel
  videoUrl: text('video_url'), // Optional video
  aspectRatio: varchar('aspect_ratio', { length: 10 }).default('1:1'), // 1:1, 4:5, 16:9
  location: varchar('location', { length: 255 }),
  coordinates: jsonb('coordinates'), // { lat, lng }
  tags: jsonb('tags').default([]), // Study tags, hashtags
  mentions: jsonb('mentions').default([]), // User mentions
  studyRelated: boolean('study_related').default(false),
  subject: varchar('subject', { length: 100 }), // Math, Science, etc.
  difficulty: varchar('difficulty', { length: 20 }), // beginner, intermediate, advanced
  studyTips: text('study_tips'), // Educational content
  resources: jsonb('resources').default([]), // Links to study materials
  likesCount: integer('likes_count').default(0),
  commentsCount: integer('comments_count').default(0),
  sharesCount: integer('shares_count').default(0),
  savesCount: integer('saves_count').default(0),
  isPublic: boolean('is_public').default(true),
  allowComments: boolean('allow_comments').default(true),
  isArchived: boolean('is_archived').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdIdx: index('social_posts_user_id_idx').on(table.userId),
  createdAtIdx: index('social_posts_created_at_idx').on(table.createdAt),
  studyRelatedIdx: index('social_posts_study_related_idx').on(table.studyRelated),
  subjectIdx: index('social_posts_subject_idx').on(table.subject),
  tagsIdx: index('social_posts_tags_idx').on(table.tags)
}));

// Stories - 24-hour disappearing content
export const socialStories = pgTable('social_stories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  mediaType: varchar('media_type', { length: 10 }).notNull(), // image, video
  mediaUrl: text('media_url').notNull(),
  duration: integer('duration').default(5), // seconds for images, actual for videos
  text: text('text'), // Text overlay
  textStyle: jsonb('text_style').default({}), // Font, color, position
  background: varchar('background', { length: 50 }), // Background color/gradient
  stickers: jsonb('stickers').default([]), // Study stickers, emojis
  music: varchar('music', { length: 255 }), // Background music
  studyTip: text('study_tip'), // Educational overlay
  subject: varchar('subject', { length: 100 }),
  viewsCount: integer('views_count').default(0),
  repliesCount: integer('replies_count').default(0),
  isHighlight: boolean('is_highlight').default(false),
  highlightTitle: varchar('highlight_title', { length: 100 }),
  expiresAt: timestamp('expires_at').notNull(), // 24 hours by default
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userIdIdx: index('social_stories_user_id_idx').on(table.userId),
  expiresAtIdx: index('social_stories_expires_at_idx').on(table.expiresAt),
  isHighlightIdx: index('social_stories_is_highlight_idx').on(table.isHighlight)
}));

// Likes - Multiple reaction types
export const socialLikes = pgTable('social_likes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  postId: uuid('post_id').references(() => socialPosts.id, { onDelete: 'cascade' }),
  commentId: uuid('comment_id'), // References social_comments.id
  reactionType: varchar('reaction_type', { length: 20 }).default('like'), // like, love, fire, clap, brilliant
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userPostIdx: uniqueIndex('social_likes_user_post_idx').on(table.userId, table.postId),
  userCommentIdx: uniqueIndex('social_likes_user_comment_idx').on(table.userId, table.commentId),
  postIdIdx: index('social_likes_post_id_idx').on(table.postId),
  commentIdIdx: index('social_likes_comment_id_idx').on(table.commentId)
}));

// Comments - Threaded commenting system
export const socialComments = pgTable('social_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  postId: uuid('post_id').references(() => socialPosts.id, { onDelete: 'cascade' }).notNull(),
  parentCommentId: uuid('parent_comment_id'), // Self-reference for replies
  content: text('content').notNull(),
  mediaUrl: text('media_url'), // Optional image/gif in comment
  mentions: jsonb('mentions').default([]), // User mentions
  likesCount: integer('likes_count').default(0),
  repliesCount: integer('replies_count').default(0),
  isPinned: boolean('is_pinned').default(false),
  isEdited: boolean('is_edited').default(false),
  editedAt: timestamp('edited_at'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userIdIdx: index('social_comments_user_id_idx').on(table.userId),
  postIdIdx: index('social_comments_post_id_idx').on(table.postId),
  parentCommentIdIdx: index('social_comments_parent_comment_id_idx').on(table.parentCommentId),
  createdAtIdx: index('social_comments_created_at_idx').on(table.createdAt)
}));

// Shares - Content sharing tracking
export const socialShares = pgTable('social_shares', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  postId: uuid('post_id').references(() => socialPosts.id, { onDelete: 'cascade' }).notNull(),
  shareType: varchar('share_type', { length: 20 }).notNull(), // repost, story_share, dm, external
  shareCaption: text('share_caption'), // Additional comment when sharing
  targetUserId: uuid('target_user_id').references(() => users.id), // For DM shares
  externalPlatform: varchar('external_platform', { length: 50 }), // instagram, twitter, etc.
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userIdIdx: index('social_shares_user_id_idx').on(table.userId),
  postIdIdx: index('social_shares_post_id_idx').on(table.postId),
  shareTypeIdx: index('social_shares_share_type_idx').on(table.shareType)
}));

// Saves - Bookmarked posts
export const socialSaves = pgTable('social_saves', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  postId: uuid('post_id').references(() => socialPosts.id, { onDelete: 'cascade' }).notNull(),
  collectionName: varchar('collection_name', { length: 100 }), // Custom collections
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userPostIdx: uniqueIndex('social_saves_user_post_idx').on(table.userId, table.postId),
  userIdIdx: index('social_saves_user_id_idx').on(table.userId),
  collectionIdx: index('social_saves_collection_idx').on(table.collectionName)
}));

// Follows - User relationships
export const socialFollows = pgTable('social_follows', {
  id: uuid('id').defaultRandom().primaryKey(),
  followerId: uuid('follower_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  followingId: uuid('following_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  isAccepted: boolean('is_accepted').default(true), // For private accounts
  isMuted: boolean('is_muted').default(false), // Hide from feed but still following
  isCloseFriend: boolean('is_close_friend').default(false), // Special story access
  followedAt: timestamp('followed_at').defaultNow(),
  unfollowedAt: timestamp('unfollowed_at')
}, (table) => ({
  followerFollowingIdx: uniqueIndex('social_follows_follower_following_idx').on(table.followerId, table.followingId),
  followerIdIdx: index('social_follows_follower_id_idx').on(table.followerId),
  followingIdIdx: index('social_follows_following_id_idx').on(table.followingId),
  isAcceptedIdx: index('social_follows_is_accepted_idx').on(table.isAccepted)
}));

// Direct Messages - Private messaging
export const socialMessages = pgTable('social_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').notNull(),
  senderId: uuid('sender_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  receiverId: uuid('receiver_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  messageType: varchar('message_type', { length: 20 }).default('text'), // text, image, video, post_share, voice
  content: text('content'),
  mediaUrl: text('media_url'),
  sharedPostId: uuid('shared_post_id').references(() => socialPosts.id),
  replyToMessageId: uuid('reply_to_message_id'), // Self-reference
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  isEdited: boolean('is_edited').default(false),
  editedAt: timestamp('edited_at'),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  conversationIdIdx: index('social_messages_conversation_id_idx').on(table.conversationId),
  senderIdIdx: index('social_messages_sender_id_idx').on(table.senderId),
  receiverIdIdx: index('social_messages_receiver_id_idx').on(table.receiverId),
  createdAtIdx: index('social_messages_created_at_idx').on(table.createdAt),
  isReadIdx: index('social_messages_is_read_idx').on(table.isRead)
}));

// Notifications - Real-time notifications
export const socialNotifications = pgTable('social_notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(), // Recipient
  actorId: uuid('actor_id').references(() => users.id, { onDelete: 'cascade' }).notNull(), // Who performed the action
  type: varchar('type', { length: 30 }).notNull(), // like, comment, follow, mention, share, story_view
  postId: uuid('post_id').references(() => socialPosts.id, { onDelete: 'cascade' }),
  commentId: uuid('comment_id'), // References social_comments.id
  storyId: uuid('story_id').references(() => socialStories.id, { onDelete: 'cascade' }),
  messageId: uuid('message_id').references(() => socialMessages.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content'),
  imageUrl: text('image_url'), // Thumbnail for notification
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userIdIdx: index('social_notifications_user_id_idx').on(table.userId),
  actorIdIdx: index('social_notifications_actor_id_idx').on(table.actorId),
  typeIdx: index('social_notifications_type_idx').on(table.type),
  isReadIdx: index('social_notifications_is_read_idx').on(table.isRead),
  createdAtIdx: index('social_notifications_created_at_idx').on(table.createdAt)
}));

// Story Views - Track who viewed stories
export const socialStoryViews = pgTable('social_story_views', {
  id: uuid('id').defaultRandom().primaryKey(),
  storyId: uuid('story_id').references(() => socialStories.id, { onDelete: 'cascade' }).notNull(),
  viewerId: uuid('viewer_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  viewedAt: timestamp('viewed_at').defaultNow()
}, (table) => ({
  storyViewerIdx: uniqueIndex('social_story_views_story_viewer_idx').on(table.storyId, table.viewerId),
  storyIdIdx: index('social_story_views_story_id_idx').on(table.storyId),
  viewerIdIdx: index('social_story_views_viewer_id_idx').on(table.viewerId),
  viewedAtIdx: index('social_story_views_viewed_at_idx').on(table.viewedAt)
}));

// Hashtags - Trending topics
export const socialHashtags = pgTable('social_hashtags', {
  id: uuid('id').defaultRandom().primaryKey(),
  tag: varchar('tag', { length: 100 }).unique().notNull(),
  usageCount: integer('usage_count').default(0),
  category: varchar('category', { length: 50 }), // study, subject, general
  isEducational: boolean('is_educational').default(false),
  subjectArea: varchar('subject_area', { length: 100 }), // math, science, history
  trendingScore: numeric('trending_score', { precision: 10, scale: 2 }).default(0),
  lastUsedAt: timestamp('last_used_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  tagIdx: uniqueIndex('social_hashtags_tag_idx').on(table.tag),
  usageCountIdx: index('social_hashtags_usage_count_idx').on(table.usageCount),
  trendingScoreIdx: index('social_hashtags_trending_score_idx').on(table.trendingScore),
  categoryIdx: index('social_hashtags_category_idx').on(table.category),
  subjectAreaIdx: index('social_hashtags_subject_area_idx').on(table.subjectArea)
}));

// Social Analytics - Aggregate statistics
export const socialAnalytics = pgTable('social_analytics', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: timestamp('date').notNull(),
  postsCount: integer('posts_count').default(0),
  storiesCount: integer('stories_count').default(0),
  likesReceived: integer('likes_received').default(0),
  commentsReceived: integer('comments_received').default(0),
  sharesReceived: integer('shares_received').default(0),
  storyViews: integer('story_views').default(0),
  profileVisits: integer('profile_visits').default(0),
  followersGained: integer('followers_gained').default(0),
  followersLost: integer('followers_lost').default(0),
  engagementRate: numeric('engagement_rate', { precision: 5, scale: 4 }).default(0),
  reach: integer('reach').default(0), // Unique accounts reached
  impressions: integer('impressions').default(0), // Total views
  topSubjects: jsonb('top_subjects').default([]), // Most engaging subjects
  bestPostingTime: varchar('best_posting_time', { length: 10 }), // HH:MM format
  averageEngagementTime: integer('average_engagement_time').default(0), // seconds
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userDateIdx: uniqueIndex('social_analytics_user_date_idx').on(table.userId, table.date),
  userIdIdx: index('social_analytics_user_id_idx').on(table.userId),
  dateIdx: index('social_analytics_date_idx').on(table.date),
  engagementRateIdx: index('social_analytics_engagement_rate_idx').on(table.engagementRate)
}));

// User Social Profiles - Extended profile info
export const socialProfiles = pgTable('social_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).unique().notNull(),
  bio: text('bio'),
  website: varchar('website', { length: 255 }),
  location: varchar('location', { length: 255 }),
  isPrivate: boolean('is_private').default(false),
  isVerified: boolean('is_verified').default(false),
  isEducator: boolean('is_educator').default(false),
  institution: varchar('institution', { length: 255 }),
  subjects: jsonb('subjects').default([]), // Teaching/studying subjects
  grade: varchar('grade', { length: 50 }), // Student grade level
  studyGoals: jsonb('study_goals').default([]),
  achievements: jsonb('achievements').default([]),
  studyStreak: integer('study_streak').default(0),
  totalStudyTime: integer('total_study_time').default(0), // minutes
  favoriteSubjects: jsonb('favorite_subjects').default([]),
  studyStyle: varchar('study_style', { length: 50 }), // visual, auditory, kinesthetic
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  language: varchar('language', { length: 10 }).default('en'),
  followersCount: integer('followers_count').default(0),
  followingCount: integer('following_count').default(0),
  postsCount: integer('posts_count').default(0),
  studyScore: integer('study_score').default(0), // Gamification score
  lastActiveAt: timestamp('last_active_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdIdx: uniqueIndex('social_profiles_user_id_idx').on(table.userId),
  isPrivateIdx: index('social_profiles_is_private_idx').on(table.isPrivate),
  isEducatorIdx: index('social_profiles_is_educator_idx').on(table.isEducator),
  institutionIdx: index('social_profiles_institution_idx').on(table.institution),
  studyScoreIdx: index('social_profiles_study_score_idx').on(table.studyScore),
  lastActiveAtIdx: index('social_profiles_last_active_at_idx').on(table.lastActiveAt)
}));

// ==================== RELATIONS ====================

export const socialPostsRelations = relations(socialPosts, ({ one, many }) => ({
  user: one(users, {
    fields: [socialPosts.userId],
    references: [users.id]
  }),
  comments: many(socialComments),
  likes: many(socialLikes),
  shares: many(socialShares),
  saves: many(socialSaves)
}));

export const socialStoriesRelations = relations(socialStories, ({ one, many }) => ({
  user: one(users, {
    fields: [socialStories.userId],
    references: [users.id]
  }),
  views: many(socialStoryViews)
}));

export const socialCommentsRelations = relations(socialComments, ({ one, many }) => ({
  user: one(users, {
    fields: [socialComments.userId],
    references: [users.id]
  }),
  post: one(socialPosts, {
    fields: [socialComments.postId],
    references: [socialPosts.id]
  }),
  parentComment: one(socialComments, {
    fields: [socialComments.parentCommentId],
    references: [socialComments.id]
  }),
  replies: many(socialComments),
  likes: many(socialLikes)
}));

export const socialLikesRelations = relations(socialLikes, ({ one }) => ({
  user: one(users, {
    fields: [socialLikes.userId],
    references: [users.id]
  }),
  post: one(socialPosts, {
    fields: [socialLikes.postId],
    references: [socialPosts.id]
  }),
  comment: one(socialComments, {
    fields: [socialLikes.commentId],
    references: [socialComments.id]
  })
}));

export const socialFollowsRelations = relations(socialFollows, ({ one }) => ({
  follower: one(users, {
    fields: [socialFollows.followerId],
    references: [users.id]
  }),
  following: one(users, {
    fields: [socialFollows.followingId],
    references: [users.id]
  })
}));

export const socialMessagesRelations = relations(socialMessages, ({ one }) => ({
  sender: one(users, {
    fields: [socialMessages.senderId],
    references: [users.id]
  }),
  receiver: one(users, {
    fields: [socialMessages.receiverId],
    references: [users.id]
  }),
  sharedPost: one(socialPosts, {
    fields: [socialMessages.sharedPostId],
    references: [socialPosts.id]
  })
}));

export const socialNotificationsRelations = relations(socialNotifications, ({ one }) => ({
  user: one(users, {
    fields: [socialNotifications.userId],
    references: [users.id]
  }),
  actor: one(users, {
    fields: [socialNotifications.actorId],
    references: [users.id]
  }),
  post: one(socialPosts, {
    fields: [socialNotifications.postId],
    references: [socialPosts.id]
  }),
  story: one(socialStories, {
    fields: [socialNotifications.storyId],
    references: [socialStories.id]
  })
}));

export const socialProfilesRelations = relations(socialProfiles, ({ one }) => ({
  user: one(users, {
    fields: [socialProfiles.userId],
    references: [users.id]
  })
}));